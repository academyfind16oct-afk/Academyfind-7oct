"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/requireAuth";
import { prisma } from "@/lib/prisma";
import { checkAndAwardProfileCompletion } from "@/lib/profile/completion";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type SettingsActionState = {
  success: boolean;
  message: string;
};

export type UploadMediaResponse = {
  success: boolean;
  url?: string;
  error?: string;
};

export async function uploadProfileMedia(
  formData: FormData,
): Promise<UploadMediaResponse> {
  try {
    const session = await requireAuth();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "avatar";

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "No file provided or file is empty." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Image size must be less than 5MB." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const folder =
      type === "cover" ? "academyfind/users/covers" : "academyfind/users/avatars";

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      public_id: `user-${session.user.id}-${type}-${Date.now()}`,
      overwrite: true,
      format: "webp",
    });

    return {
      success: true,
      url: uploadResult.secure_url,
    };
  } catch (error: any) {
    console.error("Profile media upload error:", error);
    return {
      success: false,
      error: error?.message || "Failed to upload image. Please try again.",
    };
  }
}

const optionalUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().url().nullable(),
);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/),
  phone: z.string().trim().max(20).nullable(),
  image: optionalUrl,
  coverImage: optionalUrl,
});

const studentSchema = z.object({
  enabled: z.boolean(),
  headline: z.string().trim().max(120).nullable(),
  bio: z.string().trim().max(1000).nullable(),
  targetExam: z.string().trim().max(100).nullable(),
  currentClass: z.string().trim().max(50).nullable(),
});

const teacherSchema = z.object({
  enabled: z.boolean(),
  headline: z.string().trim().max(120).nullable(),
  bio: z.string().trim().max(1000).nullable(),
  qualification: z.string().trim().max(160).nullable(),
  experience: z.string().trim().max(80).nullable(),
  subjects: z.array(z.string().trim().min(1).max(60)).max(30),
  languages: z.array(z.string().trim().min(1).max(60)).max(20),
});

const privacySchema = z.object({
  allowDms: z.boolean(),
  isVisible: z.boolean(),
  allowMessageRequests: z.boolean(),
  showOnlineStatus: z.boolean(),
  showLastSeen: z.boolean(),
  readReceiptsEnabled: z.boolean(),
});

const socialSchema = z.object({
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  telegramUrl: optionalUrl,
  twitterUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  whatsappUrl: optionalUrl,
});

function nullableText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function list(formData: FormData, name: string) {
  return String(formData.get(name) ?? "")
    .split(",")
    .map((value: string) => value.trim())
    .filter(Boolean);
}

export async function updateProfile(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireAuth();

  let imageUrl = nullableText(formData, "image");
  let coverImageUrl = nullableText(formData, "coverImage");

  // Check if direct files were submitted in the form
  const imageFile = formData.get("imageFile") as File | null;
  if (
    imageFile &&
    imageFile instanceof File &&
    imageFile.size > 0 &&
    imageFile.name !== "undefined"
  ) {
    try {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = imageFile.type || "image/jpeg";
      const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: "academyfind/users/avatars",
        public_id: `user-${session.user.id}-avatar-${Date.now()}`,
        overwrite: true,
        format: "webp",
      });
      imageUrl = uploadRes.secure_url;
    } catch (err) {
      console.error("Error uploading avatar in updateProfile:", err);
    }
  }

  const coverFile = formData.get("coverFile") as File | null;
  if (
    coverFile &&
    coverFile instanceof File &&
    coverFile.size > 0 &&
    coverFile.name !== "undefined"
  ) {
    try {
      const bytes = await coverFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = coverFile.type || "image/jpeg";
      const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: "academyfind/users/covers",
        public_id: `user-${session.user.id}-cover-${Date.now()}`,
        overwrite: true,
        format: "webp",
      });
      coverImageUrl = uploadRes.secure_url;
    } catch (err) {
      console.error("Error uploading cover in updateProfile:", err);
    }
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    phone: nullableText(formData, "phone"),
    image: imageUrl,
    coverImage: coverImageUrl,
  });

  if (!parsed.success) {
    return { success: false, message: "Please check the profile fields." };
  }

  const conflict = await prisma.user.findFirst({
    where: {
      username: parsed.data.username,
      id: { not: session.user.id },
    },
    select: { id: true },
  });
  if (conflict) return { success: false, message: "Username is unavailable." };

  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, phoneVerified: true },
  });

  const phoneChanged = existingUser?.phone !== parsed.data.phone;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...parsed.data,
      // Reset verification if the phone number was changed
      ...(phoneChanged ? { phoneVerified: false } : {}),
    },
  });
  await checkAndAwardProfileCompletion(session.user.id);
  revalidatePath("/settings/profile");
  revalidatePath(`/u/${parsed.data.username}`);
  return { success: true, message: "Profile updated." };
}

export async function updateStudentProfile(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireAuth();
  const parsed = studentSchema.safeParse({
    enabled: checked(formData, "enabled"),
    headline: nullableText(formData, "headline"),
    bio: nullableText(formData, "bio"),
    targetExam: nullableText(formData, "targetExam"),
    currentClass: nullableText(formData, "currentClass"),
  });
  if (!parsed.success) {
    return { success: false, message: "Please check the student fields." };
  }

  const { enabled, ...data } = parsed.data;
  if (enabled) {
    await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });
  } else {
    await prisma.studentProfile.updateMany({
      where: { userId: session.user.id },
      data: { isVisible: false },
    });
  }
  await checkAndAwardProfileCompletion(session.user.id);
  revalidatePath("/settings/profile");
  return { success: true, message: "Student profile updated." };
}

export async function updateTeacherProfile(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireAuth();
  const parsed = teacherSchema.safeParse({
    enabled: checked(formData, "enabled"),
    headline: nullableText(formData, "headline"),
    bio: nullableText(formData, "bio"),
    qualification: nullableText(formData, "qualification"),
    experience: nullableText(formData, "experience"),
    subjects: list(formData, "subjects"),
    languages: list(formData, "languages"),
  });
  if (!parsed.success) {
    return { success: false, message: "Please check the teacher fields." };
  }

  const { enabled, ...data } = parsed.data;
  if (enabled) {
    await prisma.teacherProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: { ...data, isVisible: true },
    });
  } else {
    await prisma.teacherProfile.updateMany({
      where: { userId: session.user.id },
      data: { isVisible: false },
    });
  }
  await checkAndAwardProfileCompletion(session.user.id);
  revalidatePath("/settings/profile");
  return { success: true, message: "Teacher profile updated." };
}

export async function updatePrivacySettings(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireAuth();
  const parsed = privacySchema.safeParse({
    allowDms: checked(formData, "allowDms"),
    isVisible: checked(formData, "isVisible"),
    allowMessageRequests: checked(formData, "allowMessageRequests"),
    showOnlineStatus: checked(formData, "showOnlineStatus"),
    showLastSeen: checked(formData, "showLastSeen"),
    readReceiptsEnabled: checked(formData, "readReceiptsEnabled"),
  });
  if (!parsed.success) return { success: false, message: "Invalid settings." };

  const { allowDms, isVisible, ...chat } = parsed.data;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { allowDms, isVisible },
    }),
    prisma.chatSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...chat },
      update: chat,
    }),
  ]);
  revalidatePath("/settings/privacy");
  return { success: true, message: "Privacy settings updated." };
}

export async function updateSocialLinks(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireAuth();
  const parsed = socialSchema.safeParse(
    Object.fromEntries(
      Object.keys(socialSchema.shape).map((key: string) => [
        key,
        nullableText(formData, key),
      ]),
    ),
  );
  if (!parsed.success) {
    return { success: false, message: "Use complete, valid URLs." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });
  await checkAndAwardProfileCompletion(session.user.id);
  revalidatePath("/settings/account");
  return { success: true, message: "Social links updated." };
}

export async function updateNotificationPreferences(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireAuth();
  await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      emailOnDm: checked(formData, "emailOnDm"),
      emailOnNews: checked(formData, "emailOnNews"),
      emailOnUpdates: checked(formData, "emailOnUpdates"),
    },
    update: {
      emailOnDm: checked(formData, "emailOnDm"),
      emailOnNews: checked(formData, "emailOnNews"),
      emailOnUpdates: checked(formData, "emailOnUpdates"),
    },
  });
  revalidatePath("/settings/notifications");
  return { success: true, message: "Notification preferences updated." };
}

export async function deactivateAccount() {
  const session = await requireAuth();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { isActive: false, isVisible: false },
  });
  redirect("/login");
}
