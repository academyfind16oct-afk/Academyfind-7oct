"use client";

import { useActionState, useState, useCallback, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Phone,
  Camera,
  UploadCloud,
  Trash2,
  ImagePlus,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  updateProfile,
  updateStudentProfile,
  updateTeacherProfile,
  uploadProfileMedia,
} from "@/app/(app)/settings/actions";
import {
  ActionMessage,
  SubmitButton,
} from "@/app/(app)/settings/components/FormStatus";
import PhoneOtpModal from "@/components/auth/PhoneOtpModal";

const initial = { success: false, message: "" };
const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-400";

type Props = {
  user: {
    name: string | null;
    username: string | null;
    phone: string | null;
    phoneVerified: boolean;
    image: string | null;
    coverImage: string | null;
  };
  student: {
    headline: string | null;
    bio: string | null;
    targetExam: string | null;
    currentClass: string | null;
    isVisible: boolean;
  } | null;
  teacher: {
    headline: string | null;
    bio: string | null;
    qualification: string | null;
    experience: string | null;
    subjects: string[];
    languages: string[];
    isVisible: boolean;
  } | null;
};

export function ProfileForms({ user, student, teacher }: Props) {
  const [profileState, profileAction] = useActionState(updateProfile, initial);
  const [studentState, studentAction] = useActionState(updateStudentProfile, initial);
  const [teacherState, teacherAction] = useActionState(updateTeacherProfile, initial);

  // Phone verification UI state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(user.phoneVerified);
  const [currentPhone, setCurrentPhone] = useState(user.phone ?? "");

  // Avatar & Cover Image states
  const [avatarUrl, setAvatarUrl] = useState<string>(user.image ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string>(user.image ?? "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarUrlInput, setShowAvatarUrlInput] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [coverUrl, setCoverUrl] = useState<string>(user.coverImage ?? "");
  const [coverPreview, setCoverPreview] = useState<string>(user.coverImage ?? "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setIsUploadingAvatar(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "avatar");

    try {
      const res = await uploadProfileMedia(fd);
      if (res.success && res.url) {
        setAvatarUrl(res.url);
        setAvatarPreview(res.url);
        toast.success("Profile photo uploaded!");
      } else {
        toast.error(res.error || "Failed to upload photo. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    setAvatarPreview("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    toast.success("Profile photo removed. Save changes to update.");
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);
    setIsUploadingCover(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "cover");

    try {
      const res = await uploadProfileMedia(fd);
      if (res.success && res.url) {
        setCoverUrl(res.url);
        setCoverPreview(res.url);
        toast.success("Cover banner uploaded!");
      } else {
        toast.error(res.error || "Failed to upload banner. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload banner.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverUrl("");
    setCoverPreview("");
    if (coverInputRef.current) coverInputRef.current.value = "";
    toast.success("Cover banner removed. Save changes to update.");
  };

  const handleVerified = useCallback(async (idToken: string, phone: string) => {
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        toast.error(`Server error (${res.status}). Please try again.`);
        return false;
      }

      if (data?.success) {
        setPhoneVerified(true);
        setCurrentPhone(phone);
        toast.dismiss("af-phone-otp-status");
        toast.success("Phone number verified successfully! ✓", {
          id: "af-phone-verified-profile",
          duration: 3500,
        });
        setIsVerifyModalOpen(false);
        return true;
      } else {
        toast.error(data?.error ?? "Verification failed. Please try again.");
        return false;
      }
    } catch {
      toast.error("Network error. Please try again.");
      return false;
    }
  }, []);

  return (
    <div className="space-y-6">
      <SettingsCard title="General profile">
        <form action={profileAction} className="grid gap-6 md:grid-cols-2">
          {/* 1. Avatar / Profile Picture Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Profile Picture
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:border-amber-200">
              {/* Avatar Circle Container */}
              <div className="relative group shrink-0">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-white shadow-md ring-2 ring-amber-400/40 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold text-amber-700 select-none">
                      {(user.name ?? user.username ?? "U").charAt(0).toUpperCase()}
                    </span>
                  )}

                  {/* Upload Spinner Overlay */}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                      <span className="text-[10px] font-semibold mt-1">Uploading...</span>
                    </div>
                  )}
                </div>

                {/* Quick Camera Overlay Button */}
                <button
                  type="button"
                  title="Upload profile picture"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Controls and guidance */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 shadow-sm shadow-amber-500/20 cursor-pointer transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        <span>Upload Picture</span>
                      </>
                    )}
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAvatarUrlInput(!showAvatarUrlInput)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-amber-600 transition-colors underline-offset-2 hover:underline ml-1 cursor-pointer"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {showAvatarUrlInput ? "Hide image link" : "Or use image link"}
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Recommended: Square JPG, PNG or WebP, max 5MB. Visible on reviews, posts, and your public profile.
                </p>

                {/* Optional manual URL input */}
                {showAvatarUrlInput && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                      placeholder="https://example.com/your-avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarUrl(e.target.value);
                        setAvatarPreview(e.target.value);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Hidden file input & hidden text input */}
              <input
                ref={avatarInputRef}
                name="imageFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarFile}
                className="hidden"
              />
              <input type="hidden" name="image" value={avatarUrl} />
            </div>
          </div>

          {/* 2. Cover Banner Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Cover Banner
            </label>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3 transition-all hover:border-amber-200">
              {/* Banner Preview Area */}
              <div className="relative h-36 sm:h-44 w-full rounded-xl border border-slate-200 overflow-hidden bg-gradient-to-br from-amber-100/60 via-amber-50/40 to-slate-100 flex items-center justify-center group shadow-inner">
                {coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isUploadingCover}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-xs hover:bg-white transition-all hover:scale-105 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5 text-amber-600" />
                        Change Banner
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        disabled={isUploadingCover}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-rose-700 shadow-md backdrop-blur-xs hover:bg-white transition-all hover:scale-105 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer p-6 text-center w-full h-full hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center shadow-xs">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-amber-600">
                        Click to upload a cover banner
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        PNG, JPG, or WebP up to 5MB (1200×400px recommended)
                      </p>
                    </div>
                  </button>
                )}

                {/* Upload Spinner Overlay */}
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10">
                    <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
                    <span className="text-xs font-semibold mt-2">Uploading cover image...</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold px-4 py-2 shadow-2xs cursor-pointer transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {isUploadingCover ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 text-amber-600" />
                        <span>{coverPreview ? "Change Banner" : "Upload Banner"}</span>
                      </>
                    )}
                  </button>

                  {coverPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      disabled={isUploadingCover}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-amber-600 transition-colors underline-offset-2 hover:underline ml-1 cursor-pointer"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {showCoverUrlInput ? "Hide image link" : "Or use image link"}
                  </button>
                </div>
              </div>

              {/* Optional manual URL input */}
              {showCoverUrlInput && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    placeholder="https://example.com/your-cover-banner.jpg"
                    value={coverUrl}
                    onChange={(e) => {
                      setCoverUrl(e.target.value);
                      setCoverPreview(e.target.value);
                    }}
                  />
                </div>
              )}

              {/* Hidden file input & hidden text input */}
              <input
                ref={coverInputRef}
                name="coverFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleCoverFile}
                className="hidden"
              />
              <input type="hidden" name="coverImage" value={coverUrl} />
            </div>
          </div>

          {/* 3. Name & Username fields */}
          <Field label="Name" name="name" defaultValue={user.name} required />
          <Field
            label="Username"
            name="username"
            defaultValue={user.username}
            required
          />

          {/* 4. Phone field with verify button */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  +91
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-amber-400"
                  name="phone"
                  type="tel"
                  maxLength={10}
                  defaultValue={user.phone ?? ""}
                  placeholder="98XXXXXXXX"
                />
              </div>

              {/* Verified badge or verify button */}
              {phoneVerified ? (
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Verified</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-300"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {currentPhone ? "Verify" : "Add & Verify"}
                </button>
              )}
            </div>

            {/* Status hint */}
            {!phoneVerified && (
              <div className="mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700">
                  Phone verification is required to submit blog posts.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 md:col-span-2 pt-2">
            <SubmitButton />
            <ActionMessage state={profileState} />
          </div>
        </form>
      </SettingsCard>

      {/* Student profile section */}
      <SettingsCard title="Student profile">
        <form action={studentAction} className="space-y-4">
          <Toggle
            name="enabled"
            label="Enable public student profile"
            defaultChecked={student?.isVisible ?? Boolean(student)}
          />
          <Field label="Headline" name="headline" defaultValue={student?.headline} />
          <TextArea label="Bio" name="bio" defaultValue={student?.bio} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Target exam"
              name="targetExam"
              defaultValue={student?.targetExam}
            />
            <Field
              label="Current class"
              name="currentClass"
              defaultValue={student?.currentClass}
            />
          </div>
          <p className="text-sm text-slate-500">
            Institute-specific courses and batches are read-only here. Manage them
            at the institute.
          </p>
          <div className="flex items-center gap-4">
            <SubmitButton />
            <ActionMessage state={studentState} />
          </div>
        </form>
      </SettingsCard>

      {/* Teacher profile section */}
      <SettingsCard title="Teacher profile">
        <form action={teacherAction} className="space-y-4">
          <Toggle
            name="enabled"
            label="Enable public teacher profile"
            defaultChecked={teacher?.isVisible ?? Boolean(teacher)}
          />
          <Field label="Headline" name="headline" defaultValue={teacher?.headline} />
          <TextArea label="Bio" name="bio" defaultValue={teacher?.bio} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Qualification"
              name="qualification"
              defaultValue={teacher?.qualification}
            />
            <Field
              label="Experience"
              name="experience"
              defaultValue={teacher?.experience}
            />
            <Field
              label="Subjects (comma separated)"
              name="subjects"
              defaultValue={teacher?.subjects.join(", ")}
            />
            <Field
              label="Languages (comma separated)"
              name="languages"
              defaultValue={teacher?.languages.join(", ")}
            />
          </div>
          <p className="text-sm text-slate-500">
            Designations and institute subjects remain attached to memberships,
            not this global identity.
          </p>
          <div className="flex items-center gap-4">
            <SubmitButton />
            <ActionMessage state={teacherState} />
          </div>
        </form>
      </SettingsCard>

      {/* Phone OTP Verification Modal */}
      <PhoneOtpModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onVerified={handleVerified}
        defaultPhone={currentPhone}
        title="Verify Your Phone"
        subtitle="Enter your mobile number to receive a verification code via SMS."
      />
    </div>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className={inputClass}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        className={inputClass}
        name={name}
        rows={4}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 accent-amber-500"
      />
      {label}
    </label>
  );
}
