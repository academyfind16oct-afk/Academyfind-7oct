"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";

export async function deleteInstituteAction(id: string) {
    try {
        await prisma.institute.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/institutes");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting institute:", error);
        return { success: false, error: "Failed to delete institute. Ensure no related records are blocking this." };
    }
}

export async function updateInstituteContactStatusAction({
    instituteId,
    status,
    comment
}: {
    instituteId: string;
    status: string;
    comment?: string;
}) {
    try {
        const session = await getSession();
        const userName = session?.user?.name || "Admin";

        const updateData: any = {
            contactStatus: status,
            contactedAt: new Date(),
            lastContactedBy: userName
        };

        const trimmedComment = comment?.trim();
        if (trimmedComment) {
            updateData.contactComment = trimmedComment;
        }

        await prisma.$transaction(async (tx) => {
            await tx.institute.update({
                where: { id: instituteId },
                data: updateData
            });

            if (trimmedComment) {
                await tx.instituteContactNote.create({
                    data: {
                        instituteId,
                        status,
                        comment: trimmedComment,
                        authorName: userName
                    }
                });
            }
        });

        revalidatePath("/af-ass-manage/institutes");
        revalidatePath(`/af-ass-manage/institutes/${instituteId}`);
        revalidatePath(`/af-ass-manage/institutes/${instituteId}/edit`);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating institute contact status:", error);
        return { success: false, error: error.message || "Failed to update contact status" };
    }
}
