"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DrawerMember {
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
        allowDms?: boolean;
    } | null;
}

export function MemberDrawer({ 
    title, 
    total, 
    type,
    instituteId 
}: { 
    title: string, 
    total: number, 
    type: "STUDENT" | "TEACHER" | "MANAGER",
    instituteId: string
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [members, setMembers] = useState<DrawerMember[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            // Note: This endpoint might need to be created if it doesn't exist yet, 
            // but for now we will simulate it or assume it will be handled by the next task
            const res = await fetch(`/api/v2/institutes/${instituteId}/members?type=${type}&q=${search}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val && members.length === 0) fetchMembers();
        }}>
            <SheetTrigger asChild>
                <Button variant="outline" className="h-8 rounded-full text-xs font-bold px-4">View All ({total})</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md bg-slate-50 flex flex-col p-0">
                <div className="p-6 pb-4 border-b bg-white">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input 
                            placeholder={`Search ${title.toLowerCase()}...`}
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') fetchMembers();
                            }}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : members.length > 0 ? (
                        members.map((m: DrawerMember) => (
                            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
                                    {m.user?.image ? (
                                        <Image src={m.user.image} alt={m.user.name || "Member"} width={48} height={48} className="w-full h-full object-cover"/>
                                    ) : (
                                        <User className="w-full h-full p-2.5 text-slate-400"/>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 text-sm truncate">{m.user?.name}</h4>
                                    <p className="text-xs text-slate-500 truncate">
                                        {type === 'STUDENT' ? m.courseName : type === 'TEACHER' ? m.designation : "Institute Manager"}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                                    {m.user?.allowDms && (
                                        <Link href={`/chat?userId=${m.user.id}`} className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 font-semibold">Message</Link>
                                    )}
                                    {m.user?.username ? (
                                        <Link href={`/u/${m.user.username}`} className="text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold">Profile</Link>
                                    ) : (
                                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">Faculty</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 text-slate-500 text-sm">No members found.</div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
