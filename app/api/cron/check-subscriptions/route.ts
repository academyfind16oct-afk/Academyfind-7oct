import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    // Secure the route: Vercel sends the CRON_SECRET in the Authorization header
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // 1. Find all expired institutes with their managers
    const expiredInstitutes = await prisma.institute.findMany({
      where: {
        planExpiresAt: {
          lt: now,
        },
        subscriptionPlan: {
          not: "BASIC",
        },
      },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        managers: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (expiredInstitutes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Checked subscriptions. 0 expired institutes found.",
      });
    }

    const expiredIds = expiredInstitutes.map((i) => i.id);

    // 2. Prepare notifications for all managers
    const notificationsToCreate = expiredInstitutes.flatMap((inst) =>
      inst.managers.map((m) => ({
        userId: m.userId,
        entityId: inst.id,
        type: "SYSTEM" as const,
        title: "Subscription Expired",
        body: `Your ${inst.subscriptionPlan} subscription for ${inst.name} has expired. Your institute has been moved to the Basic plan. Renew now to restore student leads & priority rankings.`,
        isRead: false,
      }))
    );

    // 3. Atomically downgrade institutes to BASIC and insert notifications
    await prisma.$transaction([
      prisma.institute.updateMany({
        where: {
          id: { in: expiredIds },
        },
        data: {
          subscriptionPlan: "BASIC",
          planWeight: 1,
        },
      }),
      ...(notificationsToCreate.length > 0
        ? [prisma.userNotification.createMany({ data: notificationsToCreate })]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      message: `Checked subscriptions. Downgraded ${expiredInstitutes.length} institutes to BASIC and notified ${notificationsToCreate.length} managers.`,
    });
  } catch (error) {
    console.error("Error in check-subscriptions cron:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
