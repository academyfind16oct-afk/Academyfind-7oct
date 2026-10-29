"use client"

import { useState } from "react"
import toast from "react-hot-toast";
import Link from "next/link";
import { updateInstituteProfile } from "@/lib/User/manager/updateProfile";
import { PLAN_LIMITS, PlanType } from "@/lib/plan_limits";

// SHADCN & UI COMPONENTS
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ICONS
import {
    Save, Lock, MapPin, Image as ImageIcon, IndianRupee, Link as LinkIcon, UploadCloud,
    Map, Video, Users, Trophy, ShieldCheck, UsersRound, Settings, Sparkles, Search,
    Plus, X, Building2, Star, Clock, GraduationCap, HelpCircle,
    Award
} from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTelegram, FaTwitter, FaWhatsapp, FaYoutube } from "react-icons/fa";

// CUSTOM COMPONENTS
import LocationAutocomplete from "@/components/admin/AdminLocationAutoComplete";
import VideoSettings from "./EditVideoLinks";
import EditTeachers from "./EditTeacherProfile";
import EditResultImages from "./EditResultImages";
import ClassroomImages from "./EditClassroomImages";
import EditAchievements from "./EditAchievements";
import EditFAQs from "./EditFAQS";
import EditNotablePersons from "./EditNotablePersons";
import EditOperatingHours from "./EditOperatingHours";

type Facility = { id: string; name: string; available: boolean };
type HighlightStat = { id: string; label: string; value: string; icon: string };

function genId() {
    return Math.random().toString(36).slice(2, 9);
}

export default function EditProfileForm({
    institute,
    allCategories
}: {
    institute: any,
    allCategories: { id: string, name: string }[]
}) {
    const [isLoading, setIsLoading] = useState(false);

    // Image Upload States — Logo / Main Display Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(institute.imageUrl || institute.logo || "");
    const showActualImage = Boolean(
        imagePreview &&
        (imagePreview.startsWith("http://") ||
         imagePreview.startsWith("https://") ||
         imagePreview.startsWith("blob:") ||
         imagePreview.startsWith("data:") ||
         imagePreview.startsWith("/"))
    );

    // Cover / Banner Image
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>(institute.coverImage || "");
    const showActualCover = Boolean(
        coverPreview &&
        (coverPreview.startsWith("http://") ||
         coverPreview.startsWith("https://") ||
         coverPreview.startsWith("blob:") ||
         coverPreview.startsWith("data:") ||
         coverPreview.startsWith("/"))
    );

    // Category States
    const initialCategories = institute.categories?.map((c: any) => c.categoryId || c.id) || [];
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

    // Location & Coordinate States
    const [address, setAddress] = useState(institute.address || "");
    const [latitude, setLatitude] = useState(institute.latitude?.toString() || "");
    const [longitude, setLongitude] = useState(institute.longitude?.toString() || "");

    // Visibility & Toggle States
    const [isPublished, setIsPublished] = useState(institute.isPublished ?? true);
    const [hasOnlineClasses, setHasOnlineClasses] = useState(institute.hasOnlineClasses ?? false);
    const [hasHostelFacility, setHasHostelFacility] = useState(institute.hasHostelFacility ?? false);
    const [hasDemoClasses, setHasDemoClasses] = useState(institute.hasDemoClasses ?? false);
    const [hasScholarship, setHasScholarship] = useState(institute.hasScholarship ?? false);
    const [hasCertification, setHasCertification] = useState(institute.hasCertification ?? false);

    // SEO States (for live char-count UX)
    const [metaTitle, setMetaTitle] = useState(institute.metaTitle || "");
    const [metaDescription, setMetaDescription] = useState(institute.metaDescription || "");

    // Facilities (InstituteFacility) — simple repeatable rows, saved with main form
    const [facilities, setFacilities] = useState<Facility[]>(
        (institute.facilities || []).map((f: any) => ({ id: f.id || genId(), name: f.name, available: f.available })).length
            ? (institute.facilities || []).map((f: any) => ({ id: f.id || genId(), name: f.name, available: f.available }))
            : []
    );
    const [newFacility, setNewFacility] = useState("");

    // Highlight Stats (InstituteHighlightStat) — e.g. "500+ Students Placed"
    const [stats, setStats] = useState<HighlightStat[]>(
        (institute.highlightStats || []).map((s: any) => ({ id: s.id || genId(), label: s.label, value: s.value, icon: s.icon || "" }))
    );

    // Handlers
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large. Max allowed limit is 5MB.");
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large. Max allowed limit is 5MB.");
            return;
        }
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id: any) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleLocationSelect = (lat: number, lng: number, newAddress: string) => {
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        setAddress(newAddress);
        toast.success("Location auto-filled from Google Maps!");
    };

    const addFacility = () => {
        if (!newFacility.trim()) return;
        setFacilities(prev => [...prev, { id: genId(), name: newFacility.trim(), available: true }]);
        setNewFacility("");
    };
    const removeFacility = (id: string) => setFacilities(prev => prev.filter((f: any) => f.id !== id));
    const toggleFacility = (id: string) => setFacilities(prev => prev.map((f: any) => f.id === id ? { ...f, available: !f.available } : f));

    const addStat = () => setStats(prev => [...prev, { id: genId(), label: "", value: "", icon: "" }]);
    const updateStat = (id: string, field: keyof HighlightStat, val: string) =>
        setStats(prev => prev.map((s: any) => s.id === id ? { ...s, [field]: val } : s));
    const removeStat = (id: string) => setStats(prev => prev.filter((s: any) => s.id !== id));

    // Form Submit
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        // Append all states to formData using SET (so it overwrites if exists)
        formData.set("categories", JSON.stringify(selectedCategories));
        formData.set("isPublished", String(isPublished));
        formData.set("hasOnlineClasses", String(hasOnlineClasses));
        formData.set("hasHostelFacility", String(hasHostelFacility));
        formData.set("hasDemoClasses", String(hasDemoClasses));
        formData.set("hasScholarship", String(hasScholarship));
        formData.set("hasCertification", String(hasCertification));

        formData.set("metaTitle", metaTitle);
        formData.set("metaDescription", metaDescription);

        // Facilities & Highlight Stats — sent as JSON, replaced wholesale server-side
        formData.set("facilities", JSON.stringify(facilities.filter((f: any) => f.name.trim())));
        formData.set("highlightStats", JSON.stringify(stats.filter((s: any) => s.label.trim() && s.value.trim())));

        // Format Comma Separated Strings into JSON Arrays for Backend
        const arrayFields = ["pros", "cons", "affiliations", "awards", "mediumOfInstruction"];
        arrayFields.forEach((field: any) => {
            const rawVal = formData.get(field)?.toString() || "";
            const parsedArray = rawVal.split(",").map((s: any) => s.trim()).filter(Boolean);
            formData.set(field, JSON.stringify(parsedArray));
        });

        if (imageFile) formData.append("imageFile", imageFile);
        if (coverFile) formData.append("coverFile", coverFile);

        const result = await updateInstituteProfile(institute.id, formData);

        if (result.success) {
            toast.success(result.message || "Successfully updated profile");
        } else {
            toast.error(result.error || "Can't update Profile, try again");
        }
        setIsLoading(false);
    }

    const limits = PLAN_LIMITS[institute.subscriptionPlan as PlanType] || PLAN_LIMITS.BASIC;
    const isPremiumOrUltra = institute.subscriptionPlan === "PREMIUM" || institute.subscriptionPlan === "ULTRA";

    // =======================================================
    // 🚨 1. FULL PAGE LOCK FOR "BASIC" (FREE) PLAN
    // =======================================================
    if (institute.subscriptionPlan === "BASIC" || !institute.subscriptionPlan) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01] max-w-3xl mx-auto">
                <div className="w-20 h-20 bg-stone-50 border border-stone-100 text-stone-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 mb-3">Profile Editing is Locked</h2>
                <p className="text-stone-500 max-w-md mb-8 text-sm md:text-base leading-relaxed">
                    You are currently on the <b>Free (Basic)</b> tier. To take control of this listing, update details, and start receiving student leads, please verify your academy.
                </p>
                <Link href={`/manager/${institute.id}/subscription`} className="bg-stone-800 hover:bg-stone-900 text-white px-8 py-3.5 rounded-2xl font-bold transition shadow-lg shadow-blue-600/20 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Verify Academy Now
                </Link>
            </div>
        );
    }

    // =======================================================
    // ✅ 2. FORM FOR VERIFIED, PREMIUM & ULTRA PLANS
    // =======================================================
    return (
        <div className="space-y-10 w-full mx-auto pb-32">

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 📸 IMAGE UPLOAD SECTION — Logo + Cover, side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-0 rounded-3xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01] overflow-hidden">
                        <CardHeader className="rounded-t-3xl bg-gradient-to-r from-[#ebdbb7]/40 to-transparent border-b border-[#ebdbb7]/20 p-6 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base text-stone-900">
                                <ImageIcon className="w-5 h-5 text-stone-800" /> Logo / Display Image
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Appears everywhere as your square profile picture (e.g. search results).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
                            <div className="w-full h-44 rounded-2xl border border-stone-200 bg-white/50 flex items-center justify-center overflow-hidden relative shadow-inner p-3 text-center">
                                {showActualImage ? (
                                    <img src={imagePreview} alt="Institute Logo" className="w-full h-full object-contain absolute inset-0 p-2" />
                                ) : imagePreview ? (
                                    <div className="flex flex-col items-center gap-2 text-stone-500 w-full z-10">
                                        <ImageIcon className="w-7 h-7 text-stone-300" />
                                        <div className="text-xs bg-white border border-stone-200 text-stone-500 px-3 py-1.5 rounded-lg w-full truncate font-mono select-all">
                                            {imagePreview}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-stone-400 flex flex-col items-center gap-2 z-10">
                                        <ImageIcon className="w-7 h-7 text-stone-300" />
                                        <span>No Image Available</span>
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer bg-stone-900 hover:bg-[#ebdbb7] hover:text-stone-900 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm border border-transparent hover:border-stone-200">
                                <UploadCloud className="w-4 h-4" /> Change Logo
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </CardContent>
                    </Card>

                    <Card className="p-0 rounded-3xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01] overflow-hidden">
                        <CardHeader className="rounded-t-3xl bg-gradient-to-r from-[#ebdbb7]/40 to-transparent border-b border-[#ebdbb7]/20 p-6 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base text-stone-900">
                                <ImageIcon className="w-5 h-5 text-stone-800" /> Cover / Banner Image
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Large horizontal banner shown at the top of your detailed profile page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
                            <div className="w-full h-44 rounded-2xl border border-stone-200 bg-white/50 flex items-center justify-center overflow-hidden relative shadow-inner p-3 text-center">
                                {showActualCover ? (
                                    <img src={coverPreview} alt="Institute Cover" className="w-full h-full object-contain absolute inset-0 p-2" />
                                ) : coverPreview ? (
                                    <div className="flex flex-col items-center gap-2 text-stone-500 w-full z-10">
                                        <ImageIcon className="w-7 h-7 text-stone-300" />
                                        <div className="text-xs bg-white border border-stone-200 text-stone-500 px-3 py-1.5 rounded-lg w-full truncate font-mono select-all">
                                            {coverPreview}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-stone-400 flex flex-col items-center gap-2 z-10">
                                        <ImageIcon className="w-7 h-7 text-stone-300" />
                                        <span>Shown at top of your profile page</span>
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer bg-stone-900 hover:bg-[#ebdbb7] hover:text-stone-900 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm border border-transparent hover:border-stone-200">
                                <UploadCloud className="w-4 h-4" /> Change Cover
                                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                            </label>
                        </CardContent>
                    </Card>
                </div>

                {/* 📋 SHADCN TABS FOR DETAILS */}
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="flex w-full bg-stone-100 p-1 rounded-xl mb-6 h-auto overflow-x-auto scrollbar-hide snap-x justify-start lg:justify-between items-center gap-1">
                        <TabsTrigger value="general" className="rounded-lg py-2 px-4 whitespace-nowrap snap-start">General Info</TabsTrigger>
                        <TabsTrigger value="features" className="rounded-lg py-2 px-4 whitespace-nowrap text-amber-700 data-[state=active]:bg-amber-100 snap-start"><Sparkles className="w-4 h-4 mr-1" /> Features & Stats</TabsTrigger>
                        <TabsTrigger value="location" className="rounded-lg py-2 px-4 whitespace-nowrap snap-start">Location & Contact</TabsTrigger>
                        <TabsTrigger value="seo" className="rounded-lg py-2 px-4 whitespace-nowrap text-emerald-700 data-[state=active]:bg-emerald-100 snap-start"><Search className="w-4 h-4 mr-1" /> Search Appearance</TabsTrigger>
                        <TabsTrigger value="social" className="rounded-lg py-2 px-4 whitespace-nowrap snap-start">Social Links</TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-lg py-2 px-4 whitespace-nowrap snap-start">Settings</TabsTrigger>
                        <TabsTrigger value="media" className="rounded-lg py-2 px-4 whitespace-nowrap text-purple-700 data-[state=active]:bg-purple-100 snap-start"><Sparkles className="w-4 h-4 mr-1" /> Premium Content</TabsTrigger>
                    </TabsList>

                    {/* 🔥 FIX: forceMount added to all TabsContent */}

                    {/* ================= 1. GENERAL INFO ================= */}
                    <TabsContent value="general" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader><CardTitle>Basic Details</CardTitle><CardDescription>Update your academy's primary information.</CardDescription></CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label>Institute / Mentor Name <span className="text-red-500">*</span></Label>
                                    <Input name="name" defaultValue={institute.name || ""} required />
                                </div>

                                <div className="space-y-2">
                                    <Label>Listing Type <span className="text-red-500">*</span></Label>
                                    <select name="providerType" defaultValue={institute.providerType || "INSTITUTE"} className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                                        <option value="INSTITUTE">Coaching Institute</option>
                                        <option value="INDIVIDUAL">Individual Mentor / Tutor</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Teaching Mode</Label>
                                        <select name="mode" defaultValue={institute.mode || "OFFLINE"} className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                                            <option value="OFFLINE">Offline Only</option>
                                            <option value="ONLINE">Online Only</option>
                                            <option value="HYBRID">Hybrid (Both)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Starting Fee Info</Label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <Input name="feeInfo" defaultValue={institute.feeInfo || ""} placeholder="e.g. ₹5,000/month" className="pl-9" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>About the Academy</Label>
                                    <Textarea name="description" rows={4} defaultValue={institute.description || ""} placeholder="Tell students about your courses, batches, and achievements..." />
                                </div>

                                <div className="space-y-2">
                                    <Label>Refund Policy</Label>
                                    <Input name="refundPolicy" defaultValue={institute.refundPolicy || ""} placeholder="e.g. 7 Days Money Back / No Refund" />
                                </div>

                                {/* Categories */}
                                <div className="space-y-2 pt-2 border-t mt-4">
                                    <Label>Tagged Categories</Label>
                                    <p className="text-xs text-stone-500">Select the courses and exams you teach.</p>
                                    <div className="h-48 overflow-y-auto border border-stone-200 rounded-xl p-3 bg-stone-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {allCategories?.map((cat: any) => {
                                            const isSelected = selectedCategories.includes(cat.id);
                                            return (
                                                <label key={cat.id} className={`flex items-center space-x-2 border p-2 rounded-lg transition-colors cursor-pointer select-none ${isSelected ? "bg-[#ebdbb7]/20 border-blue-200 text-blue-900 font-medium" : "bg-white/60 backdrop-blur-md border-white/60 text-stone-700 hover:bg-stone-50"}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleCategory(cat.id)}
                                                        className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-blue-600"
                                                    />
                                                    <span className="text-sm truncate">{cat.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= 2. FEATURES & STATS ================= */}
                    <TabsContent value="features" forceMount className="data-[state=inactive]:hidden space-y-6">

                        {/* Highlights & Toggles */}
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader><CardTitle>Quick Features (Yes/No)</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <Label>Online Classes</Label>
                                    <Switch checked={hasOnlineClasses} onCheckedChange={setHasOnlineClasses} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <Label>Hostel Facility</Label>
                                    <Switch checked={hasHostelFacility} onCheckedChange={setHasHostelFacility} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <Label>Free Demo Classes</Label>
                                    <Switch checked={hasDemoClasses} onCheckedChange={setHasDemoClasses} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <Label>Scholarships Available</Label>
                                    <Switch checked={hasScholarship} onCheckedChange={setHasScholarship} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <Label>Provides Certification</Label>
                                    <Switch checked={hasCertification} onCheckedChange={setHasCertification} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Facilities — NEW: InstituteFacility */}
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-stone-800" /> Facilities</CardTitle>
                                <CardDescription>e.g. Library, AC Classrooms, Practice Nets, Mirror Studio, Locker Room</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newFacility}
                                        onChange={(e) => setNewFacility(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFacility(); } }}
                                        placeholder="Type a facility and press Add..."
                                    />
                                    <Button type="button" onClick={addFacility} variant="outline" className="shrink-0 gap-1">
                                        <Plus className="w-4 h-4" /> Add
                                    </Button>
                                </div>
                                {facilities.length === 0 ? (
                                    <p className="text-sm text-stone-400 italic">No facilities added yet.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {facilities.map((f: any) => (
                                            <div key={f.id} className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-sm ${f.available ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-stone-100 border-stone-200 text-stone-400 line-through"}`}>
                                                <button type="button" onClick={() => toggleFacility(f.id)} className="font-medium">{f.name}</button>
                                                <button type="button" onClick={() => removeFacility(f.id)} className="hover:text-red-600">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Highlight Stats — NEW: InstituteHighlightStat */}
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> Highlight Stats</CardTitle>
                                <CardDescription>Quick numbers shown on your profile, e.g. "500+ Students Trained"</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {stats.map((s: any) => (
                                    <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center bg-stone-50 border border-stone-200 rounded-xl p-3">
                                        <Input value={s.label} onChange={(e) => updateStat(s.id, "label", e.target.value)} placeholder="Label (e.g. Students Trained)" />
                                        <Input value={s.value} onChange={(e) => updateStat(s.id, "value", e.target.value)} placeholder="Value (e.g. 500+)" />
                                        <Input value={s.icon} onChange={(e) => updateStat(s.id, "icon", e.target.value)} placeholder="Icon name (optional, e.g. trophy)" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStat(s.id)} className="text-stone-400 hover:text-red-600">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" onClick={addStat} variant="outline" size="sm" className="gap-1">
                                    <Plus className="w-4 h-4" /> Add Stat
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Numeric Stats */}
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader><CardTitle>Institute Statistics</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Established Year</Label>
                                    <Input name="establishedYear" type="number" defaultValue={institute.establishedYear || ""} placeholder="e.g. 2005" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total Students Taught</Label>
                                    <Input name="totalStudents" type="number" defaultValue={institute.totalStudents || ""} placeholder="e.g. 5000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total Branches</Label>
                                    <Input name="totalBranches" type="number" defaultValue={institute.totalBranches || ""} placeholder="e.g. 12" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Minimum Estimated Fee (₹)</Label>
                                    <Input name="feeMin" type="number" defaultValue={institute.feeMin || ""} placeholder="e.g. 5000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Maximum Estimated Fee (₹)</Label>
                                    <Input name="feeMax" type="number" defaultValue={institute.feeMax || ""} placeholder="e.g. 50000" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Text Highlights (Comma Separated) */}
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader><CardTitle>Compare Highlights</CardTitle><CardDescription>Separate multiple items with commas (e.g., AC Classrooms, Great Faculty)</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-emerald-600">Pros (Advantages)</Label>
                                    <Textarea name="pros" defaultValue={institute.pros?.join(", ") || ""} placeholder="Experienced Faculty, AC Classrooms, Small Batch Size..." rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-rose-500">Cons (Disadvantages)</Label>
                                    <Textarea name="cons" defaultValue={institute.cons?.join(", ") || ""} placeholder="High Fees, Strict Discipline..." rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Affiliations / Certifications</Label>
                                    <Textarea name="affiliations" defaultValue={institute.affiliations?.join(", ") || ""} placeholder="CBSE, ISO 9001 Certified, NSDC..." rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Awards</Label>
                                    <Textarea name="awards" defaultValue={institute.awards?.join(", ") || ""} placeholder="Best Coaching 2023, Excellence in Education..." rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Medium of Instruction</Label>
                                    <Input name="mediumOfInstruction" defaultValue={institute.mediumOfInstruction?.join(", ") || "English, Hindi"} placeholder="English, Hindi, Bilingual" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= 3. LOCATION & CONTACT ================= */}
                    <TabsContent value="location" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader><CardTitle>Location & Contact</CardTitle><CardDescription>Help students find and reach you easily.</CardDescription></CardHeader>
                            <CardContent className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>Phone Number</Label><Input name="phone" type="tel" defaultValue={institute.phone || ""} /></div>
                                    <div className="space-y-2"><Label>Public Email</Label><Input name="email" type="email" defaultValue={institute.email || ""} /></div>
                                    <div className="space-y-2">
                                        <Label>Website URL</Label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <Input type="url" name="website" defaultValue={institute.website || ""} placeholder="https://..." className="pl-9" />
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Map Settings */}
                                <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1.5 text-stone-900"><Map className="w-4 h-4" /> Auto-fill Coordinates via Maps</Label>
                                        <LocationAutocomplete onLocationSelect={handleLocationSelect} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Full Address <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                                            <Textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} className="pl-9 bg-white" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Latitude</Label><Input name="latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="bg-white font-mono" /></div>
                                        <div className="space-y-2"><Label>Longitude</Label><Input name="longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="bg-white font-mono" /></div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Google Maps Share URL</Label>
                                        <Input type="url" name="googleMapsUrl" defaultValue={institute.googleMapsUrl || ""} placeholder="https://maps.app.goo.gl/..." className="bg-white" />
                                    </div>
                                </div>

                                {/* Weekly Operating Hours */}
                                <EditOperatingHours instituteId={institute.id} currentHours={institute.operatingHours || []} />

                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= 4. SEO ================= */}
                    <TabsContent value="seo" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-emerald-600" /> SEO & Search Appearance</CardTitle>
                                <CardDescription>Override the auto-generated title and description shown on Google search results.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Meta Title</Label>
                                        <span className={`text-xs ${metaTitle.length > 60 ? "text-red-500" : "text-stone-400"}`}>{metaTitle.length}/60</span>
                                    </div>
                                    <Input
                                        name="metaTitle"
                                        value={metaTitle}
                                        onChange={(e) => setMetaTitle(e.target.value)}
                                        placeholder="e.g. Best JEE Coaching in Noida | Allen Career Institute"
                                        maxLength={70}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Meta Description</Label>
                                        <span className={`text-xs ${metaDescription.length > 160 ? "text-red-500" : "text-stone-400"}`}>{metaDescription.length}/160</span>
                                    </div>
                                    <Textarea
                                        name="metaDescription"
                                        value={metaDescription}
                                        onChange={(e) => setMetaDescription(e.target.value)}
                                        rows={3}
                                        placeholder="A short, compelling summary of your academy for search engines..."
                                        maxLength={200}
                                    />
                                </div>

                                {/* Live Google preview */}
                                <div className="p-4 bg-white border border-stone-200 rounded-xl">
                                    <p className="text-xs text-stone-400 mb-2">Search preview</p>
                                    <p className="text-[#1a0dab] text-lg leading-tight truncate">{metaTitle || institute.name}</p>
                                    <p className="text-[#006621] text-sm">academyfind.com › institute › {institute.slug}</p>
                                    <p className="text-sm text-stone-600 line-clamp-2 mt-1">{metaDescription || institute.description || "No description provided yet."}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= 5. SOCIAL LINKS ================= */}
                    <TabsContent value="social" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader><CardTitle>Social Media Links</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>WhatsApp URL</Label><div className="relative"><FaWhatsapp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" /><Input name="whatsappUrl" type="url" defaultValue={institute.whatsappUrl || ""} className="pl-9" /></div></div>
                                <div className="space-y-2"><Label>Instagram URL</Label><div className="relative"><FaInstagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-600" /><Input name="instagramUrl" type="url" defaultValue={institute.instagramUrl || ""} className="pl-9" /></div></div>
                                <div className="space-y-2"><Label>Facebook URL</Label><div className="relative"><FaFacebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-800" /><Input name="facebookUrl" type="url" defaultValue={institute.facebookUrl || ""} className="pl-9" /></div></div>
                                <div className="space-y-2"><Label>YouTube URL</Label><div className="relative"><FaYoutube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" /><Input name="youtubeUrl" type="url" defaultValue={institute.youtubeUrl || ""} className="pl-9" /></div></div>
                                <div className="space-y-2"><Label>LinkedIn URL</Label><div className="relative"><FaLinkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-900" /><Input name="linkedinUrl" type="url" defaultValue={institute.linkedinUrl || ""} className="pl-9" /></div></div>
                                <div className="space-y-2"><Label>Twitter/X URL</Label><div className="relative"><FaTwitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-800" /><Input name="twitterUrl" type="url" defaultValue={institute.twitterUrl || ""} className="pl-9" /></div></div>
                                <div className="space-y-2"><Label>Telegram URL</Label><div className="relative"><FaTelegram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" /><Input name="telegramUrl" type="url" defaultValue={institute.telegramUrl || ""} className="pl-9" /></div></div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= 6. SETTINGS ================= */}
                    <TabsContent value="settings" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] hover:scale-[1.01]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-stone-600" /> Profile Settings</CardTitle>
                                <CardDescription>Control visibility and lead generation files.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-5 border border-stone-200 rounded-xl bg-stone-50">
                                    <div className="space-y-1 max-w-[70%]">
                                        <Label className="text-base">Publish Profile</Label>
                                        <p className="text-xs text-stone-500 leading-relaxed">
                                            If turned OFF, your institute will be hidden from public search results and category pages. Your data will be saved securely and you can turn it back ON anytime.
                                        </p>
                                    </div>
                                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Brochure URL (Lead Magnet)</Label>
                                    <Input name="brochureUrl" type="url" defaultValue={institute.brochureUrl || ""} placeholder="https://link-to-your-pdf-brochure.com" />
                                    <p className="text-xs text-stone-500">Provide a link to your syllabus or brochure. This helps capture student leads.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= 7. PREMIUM MEDIA ================= */}
                    <TabsContent value="media" forceMount className="data-[state=inactive]:hidden space-y-6">
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-purple-600" /> Premium Content & Media
                            </h2>
                            <p className="text-stone-600 text-sm">
                                Manage your advanced showcase sections here. Changes made here are saved automatically.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* YouTube Videos Component */}
                            {isPremiumOrUltra ? (
                                <VideoSettings instituteId={institute.id} currentVideos={institute.youtubeVideos || []} maxLimit={limits.maxVideos} />
                            ) : (
                                <LockedFeatureCard icon={<Video className="w-4 h-4 text-red-500" />} title="YouTube Video Integration" desc="Showcase your classroom dynamic and video lectures directly on your public profile page." instituteId={institute.id} />
                            )}

                            {/* Classroom Images */}
                            {isPremiumOrUltra ? (
                                <ClassroomImages instituteId={institute.id} currentImages={institute.classroomImages || []} maxLimit={limits.maxClassroom} />
                            ) : (
                                <LockedFeatureCard icon={<UsersRound className="w-4 h-4 text-amber-500" />} title="Classroom Images" desc="Showcase your classroom images directly on your public profile page." instituteId={institute.id} />
                            )}

                            {/* Results Gallery Component */}
                            {isPremiumOrUltra ? (
                                <EditResultImages instituteId={institute.id} currentImages={institute.gallery || []} maxLimit={limits.maxResults} />
                            ) : (
                                <LockedFeatureCard icon={<Trophy className="w-4 h-4 text-amber-500" />} title="Toppers & Results Gallery" desc="Publish images of top-ranking students, batch results, and milestone banners." instituteId={institute.id} />
                            )}

                            {/* FAQs */}
                            {isPremiumOrUltra ? (
                                <EditFAQs instituteId={institute.id} currentFAQs={institute.faqs || []} maxLimit={15} />
                            ) : (
                                <LockedFeatureCard icon={<HelpCircle className="w-4 h-4 text-purple-500" />} title="FAQs" desc="Answer common student questions — also boosts your Google FAQ rich results." instituteId={institute.id} />
                            )}

                            {/* Achievements */}
                            {isPremiumOrUltra ? (
                                <EditAchievements instituteId={institute.id} currentAchievements={institute.achievements || []} maxLimit={12} />
                            ) : (
                                <LockedFeatureCard icon={<Award className="w-4 h-4 text-amber-500" />} title="Awards & Achievements" desc="Showcase institutional milestones, recognitions, and major accomplishments." instituteId={institute.id} />
                            )}

                            {/* Notable Alumni Component */}
                            {isPremiumOrUltra ? (
                                <EditNotablePersons instituteId={institute.id} currentPersons={institute.notablepersons || []} maxLimit={12} />
                            ) : (
                                <LockedFeatureCard icon={<GraduationCap className="w-4 h-4 text-blue-500" />} title="Notable Alumni" desc="Showcase your most successful alumni and their current placements." instituteId={institute.id} />
                            )}

                            {/* Faculty Management Link Notice */}
                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                                        <GraduationCap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-stone-900">Manage Faculty & Teachers</p>
                                        <p className="text-stone-500 text-[11px] mt-0.5">Faculty management (both direct showcase and registered accounts) has moved to the <strong>Members</strong> tab.</p>
                                    </div>
                                </div>
                                <Link href={`/manager/${institute.id}/members`} className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 shrink-0 text-xs px-3 py-1.5 rounded-xl bg-amber-100/70 border border-amber-200">
                                    Go to Members Tab →
                                </Link>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Sticky Save Bar */}
                <div className="sticky bottom-4 z-20 flex justify-end">
                    <Button type="submit" disabled={isLoading} className="bg-stone-800 hover:bg-stone-900 text-white rounded-2xl gap-2 px-8 py-6 shadow-xl shadow-blue-600/30">
                        {isLoading ? "Saving Details..." : <><Save className="w-4 h-4" /> Save General Details</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function LockedFeatureCard({ icon, title, desc, instituteId }: { icon: React.ReactNode; title: string; desc: string; instituteId: string }) {
    return (
        <div className="bg-stone-50 border border-dashed border-stone-200 rounded-3xl p-6 text-center flex flex-col items-center shadow-sm h-full justify-center">
            <div className="w-10 h-10 bg-white border border-stone-100 rounded-full flex items-center justify-center mb-3 text-stone-400"><Lock className="w-4 h-4" /></div>
            <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">{icon} {title} Locked</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1 mb-3">{desc}</p>
            <Link href={`/manager/${instituteId}/subscription`} className="bg-stone-900 hover:bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-medium transition">Upgrade to Premium</Link>
        </div>
    );
}