import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EditProfileForm from "./edit/EditProfileForm";
import { Lock } from "lucide-react";
import Link from "next/link";

export default async function ManagerProfilePage({
    params
}: {
    params: Promise<{ instituteId: string }>
}) {
    // 🚀 Await params properly to avoid type errors
    const { instituteId } = await params;

    // Fetch Institute Data
    const institute = await prisma.institute.findUnique({
        where: { id: instituteId },
        include:{
            teacherRecords: {
                include: {
                    membership: {
                        include: {
                            user: {
                                select: { name: true, image: true, email: true }
                            }
                        }
                    }
                }
            },
            categories: true,
            facilities: true,
            highlightStats: true,
            faqs: true,
            batches: true,
            achievements: true,
            notablepersons: true,
            facultyMembers: {
                orderBy: { displayOrder: "asc" }
            },
            operatingHours: true
        }
    });

    const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    })

    if (!institute) return redirect("/manager");
    if (institute.subscriptionPlan === "BASIC") {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="w-16 h-16 bg-[#ebdbb7]/30 text-stone-700 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">Profile Data Locked</h2>
                <p className="text-stone-500 max-w-md mb-6">
                    Unlock profile customization. Upgrade to the <b>Verified, Premium Plan</b> or <b>Featured</b> to customize your public presence.
                </p>
                <Link href={`/manager/${instituteId}/subscription`} className="bg-stone-800 hover:bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                    View Upgrade Plans
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">Institute Profile</h2>
                <p className="text-sm text-stone-500 mt-1">
                    Update your academy's public information. This data will be visible to students on your public page.
                </p>
            </div>

            {/* Form Section */}
            <div className="p-6 md:p-8 bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <EditProfileForm institute={institute} allCategories={allCategories}/>
            </div>
        </div>
    );
}