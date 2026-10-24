"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createCity(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const state = (formData.get("state") as string)?.trim();
    const country = (formData.get("country") as string)?.trim() || "India";
    const customSlug = (formData.get("slug") as string)?.trim();
    const latitudeStr = formData.get("latitude") as string;
    const longitudeStr = formData.get("longitude") as string;
    const description = (formData.get("description") as string)?.trim() || null;

    if (!name) {
      return { success: false, error: "City name is required." };
    }
    if (!state) {
      return { success: false, error: "State is required." };
    }

    let slug = customSlug ? generateSlug(customSlug) : generateSlug(name);
    if (!slug) slug = "city-" + Date.now();

    // Duplicate slug handler
    let existing = await prisma.city.findUnique({ where: { slug } });
    let counter = 1;
    const baseSlug = slug;
    while (existing) {
      slug = `${baseSlug}-${counter}`;
      existing = await prisma.city.findUnique({ where: { slug } });
      counter++;
    }

    const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null;

    await prisma.city.create({
      data: {
        name,
        slug,
        state,
        country,
        latitude: isNaN(latitude as number) ? null : latitude,
        longitude: isNaN(longitude as number) ? null : longitude,
        description,
      },
    });

    revalidatePath("/af-ass-manage/cities");
    revalidatePath("/cities");
    revalidatePath("/af-ass-manage/institutes");
    revalidatePath("/");

    return { success: true, message: `City "${name}" added successfully!` };
  } catch (error: any) {
    console.error("Create City Error:", error);
    return {
      success: false,
      error: error?.message || "Failed to create city. Please try again.",
    };
  }
}

export async function updateCity(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const state = (formData.get("state") as string)?.trim();
    const country = (formData.get("country") as string)?.trim() || "India";
    const slug = (formData.get("slug") as string)?.trim();
    const latitudeStr = formData.get("latitude") as string;
    const longitudeStr = formData.get("longitude") as string;
    const description = (formData.get("description") as string)?.trim() || null;

    if (!id) return { success: false, error: "City ID is missing." };
    if (!name) return { success: false, error: "City name is required." };
    if (!state) return { success: false, error: "State is required." };

    const cleanSlug = slug ? generateSlug(slug) : generateSlug(name);

    // Verify slug uniqueness if slug changed
    if (cleanSlug) {
      const existingWithSlug = await prisma.city.findFirst({
        where: { slug: cleanSlug, NOT: { id } },
      });
      if (existingWithSlug) {
        return { success: false, error: `Slug "${cleanSlug}" is already taken by another city.` };
      }
    }

    const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null;

    await prisma.city.update({
      where: { id },
      data: {
        name,
        slug: cleanSlug,
        state,
        country,
        latitude: isNaN(latitude as number) ? null : latitude,
        longitude: isNaN(longitude as number) ? null : longitude,
        description,
      },
    });

    revalidatePath("/af-ass-manage/cities");
    revalidatePath("/cities");
    revalidatePath(`/directory/${cleanSlug}`);
    revalidatePath("/");

    return { success: true, message: `City "${name}" updated successfully!` };
  } catch (error: any) {
    console.error("Update City Error:", error);
    return {
      success: false,
      error: error?.message || "Failed to update city.",
    };
  }
}

export async function deleteCity(cityId: string) {
  try {
    if (!cityId) return { success: false, error: "City ID is missing." };

    const city = await prisma.city.findUnique({
      where: { id: cityId },
      include: { _count: { select: { institutes: true } } },
    });

    if (!city) return { success: false, error: "City not found." };

    if (city._count.institutes > 0) {
      return {
        success: false,
        error: `Cannot delete "${city.name}" because it has ${city._count.institutes} linked institutes. Reassign or delete those institutes first.`,
      };
    }

    await prisma.city.delete({ where: { id: cityId } });

    revalidatePath("/af-ass-manage/cities");
    revalidatePath("/cities");
    revalidatePath("/");

    return { success: true, message: `City "${city.name}" deleted successfully!` };
  } catch (error: any) {
    console.error("Delete City Error:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete city.",
    };
  }
}
