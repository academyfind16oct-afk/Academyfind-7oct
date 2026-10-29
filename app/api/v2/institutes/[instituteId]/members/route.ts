import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ instituteId: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const q = searchParams.get("q") || "";
        const instituteId = (await params).instituteId;

        if (!instituteId) {
            return NextResponse.json({ error: "Missing instituteId" }, { status: 400 });
        }

        interface MemberItem {
            id: string;
            courseName?: string | null;
            designation?: string | null;
            experience?: string | null;
            subjects?: string[] | string | null;
            user?: {
                id: string;
                name: string | null;
                username: string | null;
                image: string | null;
                allowDms: boolean;
            } | null;
        }

        let members: MemberItem[] = [];

        if (type === "STUDENT") {
            const studentRecords = await prisma.studentInstituteRecord.findMany({
                where: {
                    instituteId,
                    isVerified: true,
                    isVisible: true,
                    membership: { status: "ACTIVE" },
                    studentProfile: {
                        user: {
                            name: { contains: q, mode: "insensitive" }
                        }
                    }
                },
                take: 20,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    courseName: true,
                    studentProfile: {
                        select: {
                            user: {
                                select: { id: true, name: true, username: true, image: true, allowDms: true }
                            }
                        }
                    }
                }
            });
            members = studentRecords.map((m) => ({
                id: m.id,
                courseName: m.courseName,
                user: m.studentProfile?.user
            }));
        } else if (type === "TEACHER") {
            const [regTeachers, customFaculty] = await Promise.all([
                prisma.teacherInstituteRecord.findMany({
                    where: {
                        instituteId,
                        isVerified: true,
                        isVisible: true,
                        membership: { status: "ACTIVE" },
                        ...(q ? {
                            teacherProfile: {
                                user: {
                                    name: { contains: q, mode: "insensitive" }
                                }
                            }
                        } : {})
                    },
                    take: 20,
                    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
                    select: {
                        id: true,
                        designation: true,
                        teacherProfile: {
                            select: {
                                user: {
                                    select: { id: true, name: true, username: true, image: true, allowDms: true }
                                }
                            }
                        }
                    }
                }),
                prisma.instituteFacultyMember.findMany({
                    where: {
                        instituteId,
                        ...(q ? {
                            OR: [
                                { name: { contains: q, mode: "insensitive" } },
                                { designation: { contains: q, mode: "insensitive" } },
                            ]
                        } : {})
                    },
                    take: 20,
                    orderBy: { displayOrder: "asc" },
                })
            ]);

            const mappedReg: MemberItem[] = regTeachers.map((m) => ({
                id: m.id,
                designation: m.designation,
                user: m.teacherProfile?.user
            }));

            const mappedCustom: MemberItem[] = customFaculty.map((f) => ({
                id: f.id,
                designation: f.designation || "Faculty",
                experience: f.experience,
                subjects: f.subjects,
                user: {
                    id: f.id,
                    name: f.name,
                    username: null,
                    image: f.imageUrl,
                    allowDms: false,
                }
            }));

            members = [...mappedReg, ...mappedCustom];
        } else if (type === "MANAGER") {
            const managerRecords = await prisma.instituteManager.findMany({
                where: {
                    instituteId,
                    user: {
                        name: { contains: q, mode: "insensitive" },
                        role: { notIn: ["SALES_MANAGER", "INSTITUTE_SALES_MANAGER"] },
                    }
                },
                take: 20,
                select: {
                    user: {
                        select: { id: true, name: true, username: true, image: true, allowDms: true }
                    }
                }
            });
            members = managerRecords.map((m) => ({
                id: m.user.id,
                user: m.user
            }));
        }

        return NextResponse.json({ members });
    } catch (error) {
        console.error("Members API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
