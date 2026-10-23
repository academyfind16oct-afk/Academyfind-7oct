import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import {
  hasUserUnlockedInstituteContact,
  hasUserUnlockedInstituteCommunity,
} from "@/lib/unlocks/unlock-service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({
        isLoggedIn: false,
        isContactUnlocked: false,
        isCommunityUnlocked: false,
      });
    }

    const { searchParams } = new URL(req.url);
    const instituteId = searchParams.get("instituteId");

    if (!instituteId) {
      return NextResponse.json(
        { error: "instituteId query parameter is required" },
        { status: 400 }
      );
    }

    const [isContactUnlocked, isCommunityUnlocked] = await Promise.all([
      hasUserUnlockedInstituteContact(userId, instituteId),
      hasUserUnlockedInstituteCommunity(userId, instituteId),
    ]);

    return NextResponse.json({
      isLoggedIn: true,
      isContactUnlocked,
      isCommunityUnlocked,
    });
  } catch (error: any) {
    console.error("Error in unlock-status route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check unlock status" },
      { status: 500 }
    );
  }
}
