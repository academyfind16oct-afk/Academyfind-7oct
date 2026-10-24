"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShieldCheck, FileCheck, Building, Sparkles } from "lucide-react"

export default function InstituteFilters({ cities, categories }: { cities: any[], categories: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Current Values from URL
    const currentSearch = searchParams.get("search") || "";
    const currentCity = searchParams.get("cityId") || "";
    const currentCategory = searchParams.get("categoryId") || "";
    const currentStatus = searchParams.get("status") || "all";
    const currentSubscriptionPlan = searchParams.get("subscriptionPlan") || "";
    const currentSortBy = searchParams.get("sortBy") || "newest";
    const currentOwnership = searchParams.get("ownership") || "all";

    // URL Update Logic
    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Agar value empty ya default (all/newest) hai, toh URL clean rakhne ke liye param delete kardo
        if (value && value !== "all" && value !== "newest") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        
        params.set("page", "1"); // Naya filter lagte hi hamesha Page 1 par bhej do
        router.push(`/af-ass-manage/institutes?${params.toString()}`);
    }

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 mb-6">
            
            {/* Search Input (Takes remaining space) */}
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Search academy name..."
                    defaultValue={currentSearch}
                    onBlur={(e) => updateFilter("search", e.target.value)} // Type karke bahar click karne pe search hoga
                    onKeyDown={(e) => e.key === 'Enter' && updateFilter("search", e.currentTarget.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
            </div>

            {/* 🔥 Sort Dropdown */}
            <div className="w-full md:w-40">
                <select 
                    value={currentSortBy}
                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                    <option value="newest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="views"> Most Viewed</option>
                </select>
            </div>

            {/* 🔥 Status & Visibility Filter */}
            <div className="w-full md:w-40">
                <select 
                    value={currentStatus}
                    onChange={(e) => updateFilter("status", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">🟢 Active Only</option>
                    <option value="inactive">🔴 Inactive Only</option>
                    <option value="published">👁️ Published Only</option>
                    <option value="hidden">🙈 Hidden Only</option>
                </select>
            </div>

            {/* 🔥 Subscription Plan Filter */}
            <div className="w-full md:w-60">
                <select 
                    value={currentSubscriptionPlan}
                    onChange={(e) => updateFilter("subscriptionPlan", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                    <option value="">All Subscription Plans</option>
                    <option value="BASIC">Basic</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ULTRA">Ultra</option>
                </select>
            </div>


            {/* 🛡️ Ownership & Approval Filter (Claims & Owner-Created) */}
            <div className="w-full md:w-64">
                <select 
                    value={currentOwnership}
                    onChange={(e) => updateFilter("ownership", e.target.value)}
                    aria-label="Filter by ownership and approval status"
                    className={`w-full p-2 border rounded-xl text-sm outline-none cursor-pointer font-medium transition-colors ${
                        currentOwnership !== "all"
                            ? "bg-amber-50 border-amber-300 text-amber-900 font-bold ring-2 ring-amber-400/30"
                            : "bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-purple-500"
                    }`}
                >
                    <option value="all">All Ownership Types</option>
                    <option value="approved_all">⭐ Approved (Claims & Owner Added)</option>
                    <option value="approved_claims">✓ Approved Claims Only</option>
                    <option value="approved_requests">🏢 Owner Added & Approved Only</option>
                    <option value="has_managers">👤 Has Assigned Managers</option>
                    <option value="unclaimed">🌐 Unclaimed / Seeded Only</option>
                </select>
            </div>

            {/* City Filter */}
            <div className="w-full md:w-40">
                <select 
                    value={currentCity}
                    onChange={(e) => updateFilter("cityId", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                </select>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-40">
                <select 
                    value={currentCategory}
                    onChange={(e) => updateFilter("categoryId", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
            </div>

            {/* ⚡ Quick Filter Pills Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 w-full">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Approvals:
                </span>

                <button
                    type="button"
                    onClick={() => updateFilter("ownership", currentOwnership === "approved_all" ? "all" : "approved_all")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm border ${
                        currentOwnership === "approved_all"
                            ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300"
                            : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                    }`}
                >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Approved Owners (Claims + Created)
                </button>

                <button
                    type="button"
                    onClick={() => updateFilter("ownership", currentOwnership === "approved_claims" ? "all" : "approved_claims")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm border ${
                        currentOwnership === "approved_claims"
                            ? "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300"
                            : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                    }`}
                >
                    <FileCheck className="w-3.5 h-3.5" />
                    Approved Claims
                </button>

                <button
                    type="button"
                    onClick={() => updateFilter("ownership", currentOwnership === "approved_requests" ? "all" : "approved_requests")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm border ${
                        currentOwnership === "approved_requests"
                            ? "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300"
                            : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                    }`}
                >
                    <Building className="w-3.5 h-3.5" />
                    Owner-Created & Approved
                </button>

                {currentOwnership !== "all" && (
                    <button
                        type="button"
                        onClick={() => updateFilter("ownership", "all")}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                    >
                        ✕ Reset Filter
                    </button>
                )}
            </div>
        </div>
    )
}