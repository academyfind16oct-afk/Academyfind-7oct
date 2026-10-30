"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { v2 as cloudinary } from "cloudinary";
import { isDiwaliOfferActive } from "@/lib/subscription/plans";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImageToCloudinary(file: File, idPrefix: string) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "academyfind/payments",
        public_id: `pay-${idPrefix}-${Date.now()}`, 
        overwrite: true,
        format: "webp", 
    });
    return uploadResult.secure_url;
}

export async function submitPaymentProof(instituteId: string, formData: FormData) {
    try {
        const planRequested = formData.get("planRequested") as any;
        const billingCycle = formData.get("billingCycle") as string;
        const amountPaid = parseInt(formData.get("amountPaid") as string);
        const utrNumber = (formData.get("utrNumber") as string).trim();
        const imageFile = formData.get("imageFile") as File | null;

        if (!utrNumber || utrNumber.length < 6) {
            return { success: false, error: "Please enter a valid Transaction ID / UTR Number." };
        }

        // Check if UTR already exists to prevent  entries
        const existingUtr = await prisma.subscriptionPayment.findUnique({
            where: { utrNumber }
        });

        if (existingUtr) {
            return { success: false, error: "This UTR number has already been submitted or used." };
        }

        let proofImageUrl = null;
        if (imageFile && imageFile.size > 0) {
            proofImageUrl = await uploadImageToCloudinary(imageFile, utrNumber);
        }

        await prisma.subscriptionPayment.create({
            data: {
                instituteId,
                planRequested,
                billingCycle,
                amountPaid,
                utrNumber,
                proofImageUrl,
                status: "PENDING"
            }
        });

        revalidatePath(`/manager/${instituteId}/subscription`);
        return { success: true, message: "Payment proof submitted! Admin will verify soon." };
    } catch (error) {
        console.error("Payment Submission Error:", error);
        return { success: false, error: "Failed to submit transaction details." };
    }
}

export async function activateFreePlan(instituteId: string, planId: string = "VERIFIED") {
    try {
        if (!instituteId) {
            return { success: false, error: "Institute ID is missing." };
        }
        if (planId !== "VERIFIED") {
            return { success: false, error: "Only Verified Annual plan is eligible for free Diwali activation." };
        }
        if (!isDiwaliOfferActive()) {
            return { success: false, error: "Diwali 15-day promotional offer has ended." };
        }

        const institute = await prisma.institute.findUnique({
            where: { id: instituteId },
            select: { id: true, name: true, subscriptionPlan: true }
        });

        if (!institute) {
            return { success: false, error: "Institute not found." };
        }

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        const utrNumber = `DIWALI-FREE-${instituteId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

        await prisma.$transaction([
            prisma.subscriptionPayment.create({
                data: {
                    instituteId,
                    planRequested: "VERIFIED",
                    billingCycle: "ANNUAL",
                    amountPaid: 0,
                    utrNumber,
                    status: "APPROVED",
                }
            }),
            prisma.institute.update({
                where: { id: instituteId },
                data: {
                    subscriptionPlan: "VERIFIED",
                    planWeight: 2,
                    planExpiresAt: expiryDate,
                    isVerified: true,
                }
            })
        ]);

        try {
            const { syncSingleInstituteToMeili } = await import("@/scripts/SyncInstitute");
            await syncSingleInstituteToMeili(instituteId);
        } catch (syncErr) {
            console.warn("Meili sync warning during free plan activation:", syncErr);
        }

        try {
            revalidatePath(`/manager/${instituteId}/subscription`);
            revalidatePath(`/manager/${instituteId}`);
            revalidatePath(`/institute/${instituteId}`);
            revalidatePath("/");
        } catch (revalidateErr) {
            console.warn("Revalidate path note (non-request context):", revalidateErr);
        }

        return {
            success: true,
            message: `🪔 Happy Diwali! Verified Annual Plan activated for ${institute.name} (Free for 1 Year)!`
        };
    } catch (error: any) {
        console.error("Free Plan Activation Error:", error);
        return { success: false, error: error?.message || "Failed to activate free plan." };
    }
}