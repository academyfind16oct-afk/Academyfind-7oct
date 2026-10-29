"use client";

import { useState } from "react";
import { 
    PhoneCall, Clock, User, CheckCircle2, 
    Save, Loader2, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { updateInstituteContactStatusAction } from "@/app/(af-ass-manage)/af-ass-manage/institutes/actions";

export const CONTACT_STATUS_OPTIONS = [
    { label: "Not Contacted", value: "NOT_CONTACTED", color: "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200" },
    { label: "Contacted", value: "CONTACTED", color: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200" },
    { label: "Call Back", value: "CALL_BACK", color: "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200" },
    { label: "Follow Up", value: "FOLLOW_UP", color: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200" },
    { label: "Interested", value: "INTERESTED", color: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200" },
    { label: "Not Interested", value: "NOT_INTERESTED", color: "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200" },
    { label: "Onboarded", value: "ONBOARDED", color: "bg-green-100 text-green-900 border-green-300 hover:bg-green-200" },
    { label: "DNP (No Answer)", value: "DNP", color: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" },
    { label: "Junk / Invalid", value: "JUNK", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
];

export function getContactStatusMeta(status?: string | null) {
    const s = status || "NOT_CONTACTED";
    return (
        CONTACT_STATUS_OPTIONS.find((opt) => opt.value === s) || {
            label: s.replace(/_/g, " "),
            value: s,
            color: "bg-stone-100 text-stone-700 border-stone-200",
        }
    );
}

export function ContactStatusBadge({ status }: { status?: string | null }) {
    const meta = getContactStatusMeta(status);
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border shadow-2xs ${meta.color}`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {meta.label}
        </span>
    );
}

type ContactNote = {
    id: string;
    status: string | null;
    comment: string;
    authorName: string | null;
    createdAt: string | Date;
};

interface AdminInstituteContactControlProps {
    instituteId: string;
    instituteName: string;
    phone?: string | null;
    initialStatus?: string | null;
    initialComment?: string | null;
    initialContactedAt?: string | Date | null;
    initialLastContactedBy?: string | null;
    contactNotes?: ContactNote[];
}

export default function AdminInstituteContactControl({
    instituteId,
    instituteName,
    phone,
    initialStatus,
    initialComment,
    initialContactedAt,
    initialLastContactedBy,
    contactNotes = [],
}: AdminInstituteContactControlProps) {
    const [currentStatus, setCurrentStatus] = useState<string>(initialStatus || "NOT_CONTACTED");
    const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || "NOT_CONTACTED");
    const [newComment, setNewComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [notesList, setNotesList] = useState<ContactNote[]>(contactNotes);
    const [lastContactedDate, setLastContactedDate] = useState<Date | null>(
        initialContactedAt ? new Date(initialContactedAt) : null
    );
    const [lastAuthor, setLastAuthor] = useState<string | null>(initialLastContactedBy || null);

    const handleSave = async () => {
        if (!selectedStatus) {
            toast.error("Please select a status");
            return;
        }

        setIsSaving(true);
        try {
            const res = await updateInstituteContactStatusAction({
                instituteId,
                status: selectedStatus,
                comment: newComment.trim() || undefined,
            });

            if (res.success) {
                toast.success("Contact status & comment updated!");
                setCurrentStatus(selectedStatus);
                setLastContactedDate(new Date());

                if (newComment.trim()) {
                    const newEntry: ContactNote = {
                        id: `temp-${Date.now()}`,
                        status: selectedStatus,
                        comment: newComment.trim(),
                        authorName: "You (Admin)",
                        createdAt: new Date(),
                    };
                    setNotesList([newEntry, ...notesList]);
                    setNewComment("");
                }
            } else {
                toast.error(res.error || "Failed to update");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-linear-to-r from-amber-50/70 via-stone-50 to-white border-b border-stone-200/80 p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-200/60">
                                <PhoneCall className="w-4 h-4" />
                            </span>
                            <CardTitle className="text-lg md:text-xl font-extrabold text-stone-900 tracking-tight">
                                Institute Outreach & Contact Status
                            </CardTitle>
                            <ContactStatusBadge status={currentStatus} />
                        </div>
                        <CardDescription className="text-xs text-stone-500">
                            Track whether this institute was contacted, client interest level, and internal discussion comments.
                        </CardDescription>
                    </div>

                    {phone && (
                        <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-xs w-fit"
                        >
                            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                            Call: {phone}
                        </a>
                    )}
                </div>

                {/* Sub-meta strip */}
                {(lastContactedDate || lastAuthor) && (
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-2 font-medium">
                        {lastContactedDate && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                Last updated: {format(lastContactedDate, "dd MMM yyyy, hh:mm a")}
                            </span>
                        )}
                        {lastAuthor && (
                            <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-stone-400" />
                                By: <strong className="text-stone-700 font-semibold">{lastAuthor}</strong>
                            </span>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-5 md:p-6 space-y-6">
                {/* 1. Status Selector Pills */}
                <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5 block">
                        Select Current Contact Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CONTACT_STATUS_OPTIONS.map((opt) => {
                            const isSelected = selectedStatus === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSelectedStatus(opt.value)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                                        isSelected
                                            ? "bg-stone-900 text-white border-stone-900 shadow-sm scale-102 ring-2 ring-stone-900/10"
                                            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                                    }`}
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            isSelected ? "bg-amber-400" : "bg-stone-400"
                                        }`}
                                    />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. New Comment / Notes Field */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Add Call / Contact Comment & Notes</span>
                        <span className="text-[11px] font-normal lowercase text-stone-400">
                            (Visible to admin team)
                        </span>
                    </label>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`e.g. Called owner at ${phone || instituteName}. Discussed premium plan demo. Asked to follow up on Friday afternoon...`}
                        rows={3}
                        className="w-full p-3.5 text-sm rounded-xl border border-stone-200 bg-stone-50/50 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-y font-medium text-stone-800"
                    />
                </div>

                {/* Save Button Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <p className="text-xs text-stone-500 font-medium hidden sm:block">
                        Status changes and notes are saved to this institute's outreach log.
                    </p>
                    <Button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSave}
                        className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 font-bold text-xs gap-2 shadow-sm cursor-pointer ml-auto transition-all"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" /> Save Status & Comment
                            </>
                        )}
                    </Button>
                </div>

                {/* 3. History of Previous Comments / Notes */}
                {notesList.length > 0 && (
                    <div className="pt-4 border-t border-stone-100 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                            <History className="w-3.5 h-3.5 text-stone-500" />
                            Previous Contact History ({notesList.length})
                        </div>

                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                            {notesList.map((note) => {
                                const noteDate = new Date(note.createdAt);
                                const statusMeta = getContactStatusMeta(note.status);
                                return (
                                    <div
                                        key={note.id}
                                        className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs space-y-1.5 hover:bg-stone-100/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-stone-900 flex items-center gap-1">
                                                    <User className="w-3 h-3 text-stone-400" />
                                                    {note.authorName || "Admin"}
                                                </span>
                                                {note.status && (
                                                    <span
                                                        className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${statusMeta.color}`}
                                                    >
                                                        {statusMeta.label}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-stone-400 font-medium">
                                                {format(noteDate, "dd MMM yyyy, hh:mm a")}
                                            </span>
                                        </div>
                                        <p className="text-stone-700 text-xs leading-relaxed font-normal whitespace-pre-wrap pl-0.5">
                                            {note.comment}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
