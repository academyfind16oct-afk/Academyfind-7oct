"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { updateInstituteByAdmin } from "@/lib/User/admin/adminMasterInstitute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Save, AlertTriangle, ArrowLeft, Image as ImageIcon, UploadCloud, Sparkles, 
    Search, Plus, X, Building2, Star, 
    ShieldAlert,
    Eye,
    PhoneCall
} from "lucide-react";
import Link from "next/link";


import EditOperatingHours from "@/app/(public)/manager/[instituteId]/profile/edit/EditOperatingHours";

type Facility = { id: string; name: string; available: boolean };
type HighlightStat = { id: string; label: string; value: string; icon: string };

function genId() {
    return Math.random().toString(36).slice(2, 9);
}

type Props = {
    institute: any;
    allCities: any[];
    allCategories: any[];
    currentCategoryIds: string[];
};

export default function MasterEditForm({ institute, allCities, allCategories, currentCategoryIds }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategoryIds);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(institute.imageUrl || institute.logo || "");
    const showActualImage = imagePreview.includes("cloudinary.com") || imagePreview.startsWith("blob:");

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>(institute.coverImage || "");
    const showActualCover = coverPreview.includes("cloudinary.com") || coverPreview.startsWith("blob:");

    const [isActive, setIsActive] = useState(institute.isActive);
    const [isPublished, setIsPublished] = useState(institute.isPublished ?? true);
    const [isVerified, setIsVerified] = useState(institute.isVerified);
    const [isFeatured, setIsFeatured] = useState(institute.isFeatured);
    const [plan, setPlan] = useState(institute.subscriptionPlan || "BASIC");
    const [planDuration, setPlanDuration] = useState("KEEP_EXISTING");

    const [contactStatus, setContactStatus] = useState(institute.contactStatus || "NOT_CONTACTED");
    const [contactComment, setContactComment] = useState(institute.contactComment || "");

    const [hasOnlineClasses, setHasOnlineClasses] = useState(institute.hasOnlineClasses ?? false);
    const [hasHostelFacility, setHasHostelFacility] = useState(institute.hasHostelFacility ?? false);
    const [hasDemoClasses, setHasDemoClasses] = useState(institute.hasDemoClasses ?? false);
    const [hasScholarship, setHasScholarship] = useState(institute.hasScholarship ?? false);
    const [hasCertification, setHasCertification] = useState(institute.hasCertification ?? false);

    const [metaTitle, setMetaTitle] = useState(institute.metaTitle || "");
    const [metaDescription, setMetaDescription] = useState(institute.metaDescription || "");
    const [metaKeywords, setMetaKeywords] = useState(institute.metaKeywords || "");

    const [facilities, setFacilities] = useState<Facility[]>(
        (institute.facilities || []).map((f: any) => ({ id: f.id || genId(), name: f.name, available: f.available }))
    );
    const [newFacility, setNewFacility] = useState("");

    const [stats, setStats] = useState<HighlightStat[]>(
        (institute.highlightStats || []).map((s: any) => ({ id: s.id || genId(), label: s.label, value: s.value, icon: s.icon || "" }))
    );

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (Max 5MB).");
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file)); 
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return toast.error("Cover too large (Max 5MB).");
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories((prev) => 
            prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
        );
    };

    const addFacility = () => {
        if (!newFacility.trim()) return;
        setFacilities(prev => [...prev, { id: genId(), name: newFacility.trim(), available: true }]);
        setNewFacility("");
    };
    const removeFacility = (id: string) => setFacilities(prev => prev.filter(f => f.id !== id));
    const toggleFacility = (id: string) => setFacilities(prev => prev.map(f => f.id === id ? { ...f, available: !f.available } : f));

    const addStat = () => setStats(prev => [...prev, { id: genId(), label: "", value: "", icon: "" }]);
    const updateStat = (id: string, field: keyof HighlightStat, val: string) => setStats(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    const removeStat = (id: string) => setStats(prev => prev.filter(s => s.id !== id));

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        
        if (imageFile) formData.append("imageFile", imageFile);
        if (coverFile) formData.append("coverFile", coverFile);

        formData.set("isActive", String(isActive));
        formData.set("isPublished", String(isPublished));
        formData.set("isVerified", String(isVerified));
        formData.set("isFeatured", String(isFeatured));
        formData.set("subscriptionPlan", plan);
        formData.set("planDuration", planDuration);
        formData.set("hasOnlineClasses", String(hasOnlineClasses));
        formData.set("hasHostelFacility", String(hasHostelFacility));
        formData.set("hasDemoClasses", String(hasDemoClasses));
        formData.set("hasScholarship", String(hasScholarship));
        formData.set("hasCertification", String(hasCertification));
        formData.set("contactStatus", contactStatus);
        formData.set("contactComment", contactComment);

        formData.set("metaTitle", metaTitle);
        formData.set("metaDescription", metaDescription);
        formData.set("metaKeywords", metaKeywords);

        formData.set("facilities", JSON.stringify(facilities.filter(f => f.name.trim())));
        formData.set("highlightStats", JSON.stringify(stats.filter(s => s.label.trim() && s.value.trim())));

        const arrayFields = ["pros", "cons", "affiliations", "awards", "mediumOfInstruction"];
        arrayFields.forEach(field => {
            const rawVal = formData.get(field)?.toString() || "";
            const parsedArray = rawVal.split(",").map(s => s.trim()).filter(Boolean);
            formData.set(field, JSON.stringify(parsedArray));
        });

        try {
            const result = await updateInstituteByAdmin(institute.id, formData, selectedCategories);
            if (result.success) {
                toast.success(result.message || "Institute updated successfully!");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update institute.");
            }
        } catch (error) {
            toast.error("Something went wrong!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-24">
            <form onSubmit={handleFormSubmit} className="space-y-8">
                
                <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl flex gap-3 text-sm text-stone-900 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-stone-800 shrink-0 mt-0.5" />
                    <p><strong>Admin Controls Warning:</strong> Modifying details here bypasses manager confirmations. Altering slugs may break older student bookmark links.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-stone-50 to-slate-50 border-b border-stone-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base text-stone-800">
                                <ImageIcon className="w-5 h-5 text-stone-800" /> Logo / Display Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
                            <div className="w-full h-44 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden relative shadow-inner p-3 text-center">
                                {showActualImage ? (
                                    <img src={imagePreview} alt="Institute Logo" className="w-full h-full object-cover absolute inset-0" />
                                ) : (
                                    <div className="text-sm text-stone-400 flex flex-col items-center gap-2 z-10">
                                        <ImageIcon className="w-7 h-7 text-stone-300"/> 
                                        <span>No Image Available</span>
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer bg-stone-900 hover:bg-stone-800 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
                                <UploadCloud className="w-4 h-4" /> Change Logo
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-slate-50 border-b border-stone-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base text-stone-800">
                                <ImageIcon className="w-5 h-5 text-amber-600" /> Cover / Banner Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
                            <div className="w-full h-44 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden relative shadow-inner p-3 text-center">
                                {showActualCover ? (
                                    <img src={coverPreview} alt="Institute Cover" className="w-full h-full object-cover absolute inset-0" />
                                ) : (
                                    <div className="text-sm text-stone-400 flex flex-col items-center gap-2 z-10">
                                        <ImageIcon className="w-7 h-7 text-stone-300"/> 
                                        <span>No Banner Available</span>
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer bg-stone-900 hover:bg-amber-600 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
                                <UploadCloud className="w-4 h-4" /> Change Cover
                                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                            </label>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="flex flex-wrap w-full bg-stone-100 p-1 rounded-xl mb-6 h-auto gap-1">
                        <TabsTrigger value="general" className="rounded-lg py-2 flex-grow">General Info</TabsTrigger>
                        <TabsTrigger value="features" className="rounded-lg py-2 flex-grow text-stone-900 data-[state=active]:bg-stone-100"><Sparkles className="w-4 h-4 mr-1"/> Features</TabsTrigger>
                        <TabsTrigger value="contact" className="rounded-lg py-2 flex-grow">Contact & Geo</TabsTrigger>
                        <TabsTrigger value="social" className="rounded-lg py-2 flex-grow">Social</TabsTrigger>
                        <TabsTrigger value="seo" className="rounded-lg py-2 flex-grow text-emerald-700 data-[state=active]:bg-emerald-100"><Search className="w-4 h-4 mr-1" /> SEO</TabsTrigger>
                        <TabsTrigger value="config" className="rounded-lg py-2 flex-grow">Admin Controls</TabsTrigger>
                    </TabsList>

                    {/* 🔥 FIX: Added `forceMount` and `data-[state=inactive]:hidden` to keep elements in DOM for FormData */}
                    <TabsContent value="general" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Institute Name</Label><Input name="name" defaultValue={institute.name} required /></div>
                                    <div className="space-y-2"><Label>Slug (URL)</Label><Input name="slug" defaultValue={institute.slug} required /></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Teaching Mode</Label>
                                        <select name="mode" defaultValue={institute.mode || "OFFLINE"} className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800">
                                            <option value="OFFLINE">Offline Only</option>
                                            <option value="ONLINE">Online Only</option>
                                            <option value="HYBRID">Hybrid (Both)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2"><Label>Estimated Fee Info</Label><Input name="feeInfo" defaultValue={institute.feeInfo || ""} placeholder="e.g. ₹50,000 - ₹1,20,000" /></div>
                                </div>

                                <div className="space-y-2"><Label>Description</Label><Textarea name="description" rows={4} defaultValue={institute.description || ""} /></div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Refund Policy</Label><Input name="refundPolicy" defaultValue={institute.refundPolicy || ""} placeholder="e.g. 7 Days Money Back" /></div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <select name="cityId" defaultValue={institute.cityId} className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800">
                                            {allCities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t mt-4">
                                    <Label>Tagged Categories</Label>
                                    <div className="h-40 overflow-y-auto border border-stone-200 rounded-xl p-3 bg-stone-50 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {allCategories.map(cat => (
                                            <label key={cat.id} className={`flex items-center space-x-2 border p-2 rounded-lg transition-colors cursor-pointer select-none ${selectedCategories.includes(cat.id) ? "bg-stone-50 border-stone-200 text-stone-900 font-medium" : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"}`}>
                                                <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-800" />
                                                <span className="text-sm truncate">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="features" forceMount className="data-[state=inactive]:hidden space-y-6">
                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle>Quick Features (Yes/No)</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-3 border rounded-lg"><Label>Online Classes</Label><Switch checked={hasOnlineClasses} onCheckedChange={setHasOnlineClasses} /></div>
                                <div className="flex items-center justify-between p-3 border rounded-lg"><Label>Hostel Facility</Label><Switch checked={hasHostelFacility} onCheckedChange={setHasHostelFacility} /></div>
                                <div className="flex items-center justify-between p-3 border rounded-lg"><Label>Free Demo Classes</Label><Switch checked={hasDemoClasses} onCheckedChange={setHasDemoClasses} /></div>
                                <div className="flex items-center justify-between p-3 border rounded-lg"><Label>Scholarships Available</Label><Switch checked={hasScholarship} onCheckedChange={setHasScholarship} /></div>
                                <div className="flex items-center justify-between p-3 border rounded-lg"><Label>Provides Certification</Label><Switch checked={hasCertification} onCheckedChange={setHasCertification} /></div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> Facilities</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input value={newFacility} onChange={(e) => setNewFacility(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFacility(); } }} placeholder="Type a facility and press Add..." />
                                    <Button type="button" onClick={addFacility} variant="outline" className="shrink-0 gap-1"><Plus className="w-4 h-4" /> Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {facilities.map((f) => (
                                        <div key={f.id} className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-sm ${f.available ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-stone-100 border-stone-200 text-stone-400 line-through"}`}>
                                            <button type="button" onClick={() => toggleFacility(f.id)} className="font-medium">{f.name}</button>
                                            <button type="button" onClick={() => removeFacility(f.id)} className="hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> Highlight Stats</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {stats.map((s) => (
                                    <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center bg-stone-50 border border-stone-200 rounded-xl p-3">
                                        <Input value={s.label} onChange={(e) => updateStat(s.id, "label", e.target.value)} placeholder="Label" />
                                        <Input value={s.value} onChange={(e) => updateStat(s.id, "value", e.target.value)} placeholder="Value" />
                                        <Input value={s.icon} onChange={(e) => updateStat(s.id, "icon", e.target.value)} placeholder="Icon name" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStat(s.id)} className="text-stone-400 hover:text-red-600"><X className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                                <Button type="button" onClick={addStat} variant="outline" size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Stat</Button>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle>Compare Highlights</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label className="text-emerald-600">Pros</Label><Textarea name="pros" defaultValue={institute.pros?.join(", ") || ""} rows={2}/></div>
                                <div className="space-y-2"><Label className="text-rose-500">Cons</Label><Textarea name="cons" defaultValue={institute.cons?.join(", ") || ""} rows={2}/></div>
                                <div className="space-y-2"><Label>Affiliations</Label><Textarea name="affiliations" defaultValue={institute.affiliations?.join(", ") || ""} rows={2}/></div>
                                <div className="space-y-2"><Label>Awards</Label><Textarea name="awards" defaultValue={institute.awards?.join(", ") || ""} rows={2}/></div>
                                <div className="space-y-2"><Label>Medium of Instruction</Label><Input name="mediumOfInstruction" defaultValue={institute.mediumOfInstruction?.join(", ") || "English, Hindi"} /></div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contact" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle>Contact & Geography</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Phone Number</Label><Input name="phone" type="tel" defaultValue={institute.phone || ""} /></div>
                                    <div className="space-y-2"><Label>Email Address</Label><Input name="email" type="email" defaultValue={institute.email || ""} /></div>
                                </div>
                                <div className="space-y-2"><Label>Physical Address</Label><Input name="address" defaultValue={institute.address} required /></div>
                                <div className="space-y-2"><Label>Website URL</Label><Input name="website" type="url" defaultValue={institute.website || ""} /></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>Latitude</Label><Input name="latitude" type="number" step="any" defaultValue={institute.latitude || ""} /></div>
                                    <div className="space-y-2"><Label>Longitude</Label><Input name="longitude" type="number" step="any" defaultValue={institute.longitude || ""} /></div>
                                    <div className="space-y-2"><Label>Google Rating</Label><Input name="googleRating" type="number" step="any" defaultValue={institute.googleRating || ""} /></div>
                                </div>
                                <EditOperatingHours instituteId={institute.id} currentHours={institute.operatingHours || []} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle>Social Media Links</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>WhatsApp URL</Label><Input name="whatsappUrl" type="url" defaultValue={institute.whatsappUrl || ""} /></div>
                                <div className="space-y-2"><Label>Instagram URL</Label><Input name="instagramUrl" type="url" defaultValue={institute.instagramUrl || ""} /></div>
                                <div className="space-y-2"><Label>Facebook URL</Label><Input name="facebookUrl" type="url" defaultValue={institute.facebookUrl || ""} /></div>
                                <div className="space-y-2"><Label>YouTube URL</Label><Input name="youtubeUrl" type="url" defaultValue={institute.youtubeUrl || ""} /></div>
                                <div className="space-y-2"><Label>LinkedIn URL</Label><Input name="linkedinUrl" type="url" defaultValue={institute.linkedinUrl || ""} /></div>
                                <div className="space-y-2"><Label>Twitter URL</Label><Input name="twitterUrl" type="url" defaultValue={institute.twitterUrl || ""} /></div>
                                <div className="space-y-2"><Label>Telegram URL</Label><Input name="telegramUrl" type="url" defaultValue={institute.telegramUrl || ""} /></div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="seo" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-emerald-600" /> SEO Override</CardTitle></CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between"><Label>Meta Title</Label><span className="text-xs text-stone-400">{metaTitle.length}/60</span></div>
                                    <Input name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between"><Label>Meta Description</Label><span className="text-xs text-stone-400">{metaDescription.length}/160</span></div>
                                    <Textarea name="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} maxLength={200} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Meta Keywords</Label>
                                    <Input name="metaKeywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="e.g. JEE Coaching, Best Institute, IIT Delhi" />
                                    <p className="text-[11px] text-stone-500">Comma separated keywords for search engines.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= 5. ADMIN CONTROLS ================= */}
                    <TabsContent value="config" forceMount className="data-[state=inactive]:hidden">
                        <Card className="rounded-2xl border-stone-200 bg-stone-50/30 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-stone-900">Master Configuration</CardTitle>
                                <CardDescription>Critical system-level controls and subscription overrides.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                
                                {/* 🔴 1. GLOBAL ADMIN LOCK (DANGEROUS) */}
                                <div className={`p-5 rounded-xl border transition-colors duration-300 ${isActive ? 'bg-white border-stone-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1 pr-6">
                                            <Label className="text-base flex items-center gap-2">
                                                <ShieldAlert className={`w-4 h-4 ${isActive ? 'text-stone-400' : 'text-red-600'}`} />
                                                Global System Status (Admin Lock)
                                            </Label>
                                            <p className="text-xs text-stone-500 leading-relaxed">
                                                {isActive
                                                    ? "This institute is currently ACTIVE on the platform. Turning this OFF will completely ban and hide it from the entire website, overriding all manager settings."
                                                    : "🚨 This institute is currently BANNED/DISABLED globally. Turn this ON to restore their access."}
                                            </p>
                                        </div>
                                        <Switch 
                                            checked={isActive} 
                                            onCheckedChange={setIsActive} 
                                            className={!isActive ? "data-[state=unchecked]:bg-red-500" : ""}
                                        />
                                    </div>
                                </div>

                                {/* 👁️ 2. MANAGER PUBLISH STATUS */}
                                <div className="p-5 bg-white rounded-xl border border-stone-200">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1 pr-6">
                                            <Label className="text-base flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-blue-500" />
                                                Manager's Publish Status
                                            </Label>
                                            <p className="text-xs text-stone-500 leading-relaxed">
                                                This is the toggle the institute manager uses. If OFF, the profile is saved as a "Draft" and hidden from public search results, but the manager can still log in and edit it.
                                            </p>
                                        </div>
                                        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                                    </div>
                                </div>

                                {/* 🌟 3. BADGES & FEATURES */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-white rounded-xl border border-stone-200">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Verified Badge</Label>
                                            <p className="text-[11px] text-stone-500">Shows the blue tick on profile.</p>
                                        </div>
                                        <Switch checked={isVerified} onCheckedChange={setIsVerified} />
                                    </div>
                                    <div className="flex items-center justify-between sm:border-l sm:pl-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                                        <div className="space-y-0.5">
                                            <Label>Featured Status</Label>
                                            <p className="text-[11px] text-stone-500">Boosts ranking in directory.</p>
                                        </div>
                                        <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                                    </div>
                                </div>

                                {/* 💳 4. SUBSCRIPTION PLAN */}
                                <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-3">
                                    <div className="mb-4 p-4 bg-stone-50 rounded-lg border border-stone-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-stone-800 font-bold uppercase tracking-wide">Current Plan</p>
                                            <p className="text-lg font-bold text-stone-900 mt-0.5">{institute.subscriptionPlan || "BASIC"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-stone-800 font-bold uppercase tracking-wide">Valid Until</p>
                                            <p className="text-sm font-medium text-stone-700 mt-0.5">
                                                {institute.subscriptionPlan === "BASIC" ? "N/A" : (institute.planExpiresAt ? new Date(institute.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Lifetime (Never Expires)")}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Subscription Plan (Manual Override)</Label>
                                        <p className="text-[11px] text-stone-500 mt-1 mb-3">Manually upgrade or downgrade the institute's tier to unlock/lock features for the manager.</p>
                                    </div>
                                    <select value={plan} onChange={(e) => setPlan(e.target.value)} className="flex h-10 w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800">
                                        <option value="BASIC">Basic (Free)</option>
                                        <option value="VERIFIED">Verified</option>
                                        <option value="PREMIUM">Premium</option>
                                        <option value="ULTRA">Ultra / Elite</option>
                                    </select>
                                    {plan !== "BASIC" && (
                                        <div className="pt-2">
                                            <Label>Subscription Duration</Label>
                                            <select value={planDuration} onChange={(e) => setPlanDuration(e.target.value)} className="flex h-10 w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 mt-1">
                                                <option value="KEEP_EXISTING">Keep Current Validity</option>
                                                <option value="LIFETIME">Lifetime (Never Expires)</option>
                                                <option value="1_MONTH">1 Month</option>
                                                <option value="3_MONTHS">3 Months</option>
                                                <option value="6_MONTHS">6 Months</option>
                                                <option value="1_YEAR">1 Year</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                
                                {/* 📎 5. BROCHURE */}
                                <div className="space-y-2 bg-white p-5 rounded-xl border border-stone-200">
                                    <Label>Brochure / Lead Magnet URL</Label>
                                    <Input name="brochureUrl" type="url" defaultValue={institute.brochureUrl || ""} placeholder="https://link-to-brochure.pdf" className="bg-stone-50" />
                                </div>

                                {/* 📞 6. OUTREACH & CONTACT STATUS */}
                                <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-700 border border-amber-200/60">
                                            <PhoneCall className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <Label className="text-base font-bold text-stone-900">Institute Outreach & Contact Status</Label>
                                            <p className="text-xs text-stone-500">Track client outreach status and record comments from administrative contact.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wide text-stone-600">Contact Status</Label>
                                        <select 
                                            value={contactStatus} 
                                            onChange={(e) => setContactStatus(e.target.value)} 
                                            className="flex h-10 w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-medium"
                                        >
                                            <option value="NOT_CONTACTED">⚪ Not Contacted</option>
                                            <option value="CONTACTED">🔵 Contacted</option>
                                            <option value="CALL_BACK">🟣 Call Back</option>
                                            <option value="FOLLOW_UP">🟠 Follow Up</option>
                                            <option value="INTERESTED">🟢 Interested</option>
                                            <option value="NOT_INTERESTED">🔴 Not Interested</option>
                                            <option value="ONBOARDED">⭐ Onboarded</option>
                                            <option value="DNP">🟡 DNP (No Answer)</option>
                                            <option value="JUNK">❌ Junk / Invalid</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wide text-stone-600">Contact Comment / Discussion Notes</Label>
                                        <Textarea 
                                            value={contactComment} 
                                            onChange={(e) => setContactComment(e.target.value)} 
                                            rows={3}
                                            placeholder="Add notes about discussion with institute owner/staff..."
                                            className="bg-stone-50"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="sticky bottom-4 z-20 flex justify-end">
                    <Button type="submit" disabled={isLoading} className="bg-stone-800 hover:bg-stone-900 text-white rounded-2xl gap-2 px-8 py-6 shadow-xl shadow-stone-800/30">
                        {isLoading ? "Saving Configurations..." : <><Save className="w-4 h-4" /> Save Master Overrides</>}
                    </Button>
                </div>
            </form>


        </div>
    );
}