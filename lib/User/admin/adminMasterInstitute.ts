"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { v2 as cloudinary } from "cloudinary";
import { syncSingleInstituteToMeili } from '@/scripts/SyncInstitute';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImageToCloudinary(file: File, folderName: string, idPrefix: string) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: `academyfind/${folderName}`,
        public_id: `${idPrefix}-${Date.now()}`, 
        overwrite: true,
        format: "webp", 
    });

    return uploadResult.secure_url;
}

function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function createInstitute(formData: FormData, selectedCategoryIds: string[]) {
    try {
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const website = formData.get("website") as string;
        const address = formData.get("address") as string;
        const googleMapsUrl = formData.get("googleMapsUrl") as string;
        const cityId = formData.get("cityId") as string;
        const subscriptionPlan = formData.get("subscriptionPlan") as any || "BASIC";
        const image = formData.get("imageFile") as File || null;

        const isVerified = formData.get("isVerified") === "true";
        const isFeatured = formData.get("isFeatured") === "true";
        const isActive = formData.get("isActive") === "true";

        const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : undefined;
        const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : undefined;
        const googleRating = formData.get("googleRating") ? parseFloat(formData.get("googleRating") as string) : undefined;
        const googleReviewCount = formData.get("googleReviewCount") ? parseInt(formData.get("googleReviewCount") as string) : undefined;

        if (!name || !cityId || !address) {
            return { success: false, error: "Name, City, and Address are required." };
        }

        let slug = generateSlug(name);
        let existing = await prisma.institute.findFirst({ where: { slug } });
        let counter = 1;
        while (existing) {
            slug = `${generateSlug(name)}-${counter}`;
            existing = await prisma.institute.findFirst({ where: { slug } });
            counter++;
        }

        let secureUrl = null;
        if (image && image.size > 0) {
            secureUrl = await uploadImageToCloudinary(image, "institutes", `inst-${slug}-${Date.now()}`);
        }

        const newInstitute = await prisma.$transaction(async (tx) => {
            const institute = await tx.institute.create({
                data: {
                    name, slug, description, phone, email, website, address,
                    googleMapsUrl, cityId, subscriptionPlan, 
                    imageUrl: secureUrl,
                    isVerified, isFeatured, isActive, latitude, longitude,
                    googleRating, googleReviewCount
                }
            });

            if (selectedCategoryIds.length > 0) {
                await tx.instituteCategory.createMany({
                    data: selectedCategoryIds.map(catId => ({
                        instituteId: institute.id,
                        categoryId: catId
                    }))
                });
            }
            return institute;
        });

        // Sync to MeiliSearch
        const syncResult = await syncSingleInstituteToMeili(newInstitute.id);
        if (!syncResult.success) {
            console.error("Failed to sync new institute to Meilisearch:", syncResult.error);
        }

        revalidatePath("/af-ass-manage/institutes");
        return { success: true, message: "Institute created successfully!", id: newInstitute.id };
    } catch (error) {
        console.error("Create Institute Error:", error);
        return { success: false, error: "Failed to create institute." };
    }
}

export async function updateInstituteByAdmin(
    instituteId: string, 
    formData: FormData, 
    selectedCategoryIds: string[] 
) {
    try {
        const name = formData.get("name") as string;
        const slug = formData.get("slug") as string;
        const description = formData.get("description") as string;
        const feeInfo = formData.get("feeInfo") as string; 
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const website = formData.get("website") as string;
        const address = formData.get("address") as string;
        const googleMapsUrl = formData.get("googleMapsUrl") as string;
        const cityId = formData.get("cityId") as string;
        const subscriptionPlan = formData.get("subscriptionPlan") as any;
        const planDuration = formData.get("planDuration") as string;
        
        // 🕒 Calculate Expiration Date based on duration
        let planExpiresAt: Date | null | undefined = undefined; // undefined = don't update db field
        if (subscriptionPlan === "BASIC") {
            planExpiresAt = null; 
        } else if (planDuration === "KEEP_EXISTING") {
            planExpiresAt = undefined;
        } else if (planDuration === "LIFETIME") {
            planExpiresAt = null;
        } else if (planDuration) {
            const now = new Date();
            if (planDuration === "1_MONTH") now.setMonth(now.getMonth() + 1);
            else if (planDuration === "3_MONTHS") now.setMonth(now.getMonth() + 3);
            else if (planDuration === "6_MONTHS") now.setMonth(now.getMonth() + 6);
            else if (planDuration === "1_YEAR") now.setFullYear(now.getFullYear() + 1);
            planExpiresAt = now;
        }

        // Social Media Links
        const whatsappUrl = formData.get("whatsappUrl") as string;
        const instagramUrl = formData.get("instagramUrl") as string;
        const facebookUrl = formData.get("facebookUrl") as string;
        const youtubeUrl = formData.get("youtubeUrl") as string;
        const linkedinUrl = formData.get("linkedinUrl") as string;
        const twitterUrl = formData.get("twitterUrl") as string;
        const telegramUrl = formData.get("telegramUrl") as string;

        // Checkboxes / Toggles values
        const isVerified = formData.get("isVerified") === "true";
        const isFeatured = formData.get("isFeatured") === "true";
        const isPublished = formData.get("isPublished") === "true"; 
        const isActive = formData.get("isActive") === "true";

        // ==========================================
        // 🚀 NEW FIELDS (SEO, Features, Stats)
        // ==========================================
        const metaTitle = formData.get("metaTitle") as string;
        const metaDescription = formData.get("metaDescription") as string;
        const metaKeywords = formData.get("metaKeywords") as string;
        const mode = formData.get("mode") as "OFFLINE" | "ONLINE" | "HYBRID";
        const refundPolicy = formData.get("refundPolicy") as string;
        const brochureUrl = formData.get("brochureUrl") as string;

        const establishedYear = formData.get("establishedYear") ? parseInt(formData.get("establishedYear") as string) : null;
        const totalStudents = formData.get("totalStudents") ? parseInt(formData.get("totalStudents") as string) : null;
        const totalBranches = formData.get("totalBranches") ? parseInt(formData.get("totalBranches") as string) : null;

        const hasOnlineClasses = formData.get("hasOnlineClasses") === "true";
        const hasHostelFacility = formData.get("hasHostelFacility") === "true";
        const hasDemoClasses = formData.get("hasDemoClasses") === "true";
        const hasScholarship = formData.get("hasScholarship") === "true";
        const hasCertification = formData.get("hasCertification") === "true";

        // Outreach & Contact Status
        const contactStatus = (formData.get("contactStatus") as string) || undefined;
        const contactComment = (formData.get("contactComment") as string) || undefined;

        const pros = JSON.parse((formData.get("pros") as string) || "[]");
        const cons = JSON.parse((formData.get("cons") as string) || "[]");
        const affiliations = JSON.parse((formData.get("affiliations") as string) || "[]");
        const awards = JSON.parse((formData.get("awards") as string) || "[]");
        const mediumOfInstruction = JSON.parse((formData.get("mediumOfInstruction") as string) || "[]");

        // Facilities & Highlight Stats JSON
        const facilitiesRaw = formData.get("facilities") as string;
        const facilities = facilitiesRaw ? JSON.parse(facilitiesRaw) : [];

        const statsRaw = formData.get("highlightStats") as string;
        const highlightStats = statsRaw ? JSON.parse(statsRaw) : [];

        // 📸 Media Uploads (Logo & Cover)
        const imageFile = formData.get("imageFile") as File || null;
        const coverFile = formData.get("coverFile") as File || null;

        let newImageUrl: string | undefined = undefined; 
        if (imageFile && imageFile.size > 0) {
            newImageUrl = await uploadImageToCloudinary(imageFile, "institutes", `inst-${slug}-${Date.now()}`);
        }

        let newCoverUrl: string | undefined = undefined;
        if (coverFile && coverFile.size > 0) {
            newCoverUrl = await uploadImageToCloudinary(coverFile, "institutes-covers", `cover-${slug}-${Date.now()}`);
        }

        // Floats
        const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : undefined;
        const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : undefined;
        const googleRating = formData.get("googleRating") ? parseFloat(formData.get("googleRating") as string) : undefined;
        const googleReviewCount = formData.get("googleReviewCount") ? parseInt(formData.get("googleReviewCount") as string) : undefined;


        // ⚡ RUNNING EVERYTHING IN A SINGLE TRANSACTION
        await prisma.$transaction(async (tx) => {
            const planWeights: Record<string, number> = { "ULTRA": 4, "PREMIUM": 3, "VERIFIED": 2, "BASIC": 1 };
            const planWeight = planWeights[subscriptionPlan] || 1;
            // 1. Update Core Institute Data
            await tx.institute.update({
                where: { id: instituteId },
                data: {
                    name, slug, description, feeInfo, phone, email, website, address, googleMapsUrl, cityId, subscriptionPlan, planExpiresAt, planWeight,
                    
                    whatsappUrl, instagramUrl, facebookUrl, youtubeUrl, linkedinUrl, twitterUrl, telegramUrl,
                    
                    isVerified, isFeatured, isPublished, isActive,    
                    ...(latitude !== undefined && { latitude }),
                    ...(longitude !== undefined && { longitude }),
                    ...(googleRating !== undefined && { googleRating }),
                    ...(googleReviewCount !== undefined && { googleReviewCount }),

                    // SEO & Features
                    metaTitle, metaDescription, metaKeywords, mode, establishedYear, totalStudents, totalBranches, refundPolicy, brochureUrl,
                    hasOnlineClasses, hasHostelFacility, hasDemoClasses, hasScholarship, hasCertification,
                    pros, cons, affiliations, awards, mediumOfInstruction,
                    
                    // Outreach
                    ...(contactStatus !== undefined && { contactStatus }),
                    ...(contactComment !== undefined && { 
                        contactComment,
                        contactedAt: new Date()
                    }),

                    ...(newImageUrl && { imageUrl: newImageUrl }),
                    ...(newCoverUrl && { coverImage: newCoverUrl })
                }
            });

            // Outreach Note creation if comment provided
            if (contactComment && contactComment.trim()) {
                await tx.instituteContactNote.create({
                    data: {
                        instituteId,
                        status: contactStatus || "NOT_CONTACTED",
                        comment: contactComment.trim(),
                        authorName: "Admin"
                    }
                });
            }

            // 2. Manage Categories
            await tx.instituteCategory.deleteMany({ where: { instituteId: instituteId } });
            if (selectedCategoryIds.length > 0) {
                await tx.instituteCategory.createMany({
                    data: selectedCategoryIds.map((catId) => ({
                        instituteId: instituteId,
                        categoryId: catId
                    }))
                });
            }

            // 3. Manage Facilities (If provided)
            if (facilitiesRaw) {
                await tx.instituteFacility.deleteMany({ where: { instituteId: instituteId } });
                if (facilities.length > 0) {
                    await tx.instituteFacility.createMany({
                        data: facilities.map((f: any, i: number) => ({
                            instituteId: instituteId,
                            name: f.name,
                            available: f.available,
                            order: i
                        }))
                    });
                }
            }

            // 4. Manage Highlight Stats (If provided)
            if (statsRaw) {
                await tx.instituteHighlightStat.deleteMany({ where: { instituteId: instituteId } });
                if (highlightStats.length > 0) {
                    await tx.instituteHighlightStat.createMany({
                        data: highlightStats.map((s: any, i: number) => ({
                            instituteId: instituteId,
                            label: s.label,
                            value: s.value,
                            icon: s.icon || null,
                            order: i
                        }))
                    });
                }
            }
        });

        // Sync to MeiliSearch
        const syncResult = await syncSingleInstituteToMeili(instituteId);
        if (!syncResult.success) {
            console.error("Failed to sync updated institute to Meilisearch:", syncResult.error);
        }

        // Revalidate Paths so the changes show up immediately everywhere!
        revalidatePath("/af-ass-manage/institutes");
        revalidatePath(`/af-ass-manage/institutes/${instituteId}`);
        revalidatePath(`/institute/${instituteId}-${slug}`); 
        revalidatePath(`/compare/[slug]`, 'page');
        revalidatePath('/', 'layout'); // Clears listing pages cache

        return { success: true, message: "Master properties sync completed!" }
    } catch (error) {
        console.error("Admin Master Update Error:", error);
        return { success: false, error: "Something went wrong in transaction database update." }
    }
}