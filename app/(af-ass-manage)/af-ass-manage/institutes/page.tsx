import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Building2, Edit, MapPin, Plus, Eye, ShieldCheck, Users, Building } from "lucide-react"
import ToggleStatusButton from "@/components/admin/AdminToggleButton"
import InstituteFilters from "@/components/admin/AdminInstituteFilters"
import InstitutePagination from "@/components/admin/AdminInstitutePagination"
import AdminDeleteButton from "@/components/admin/AdminDeleteButton"
import { deleteInstituteAction } from "./actions"

export default async function AdminInstitutesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // 1. Await Next.js 15 searchParams
    const params = await searchParams;

    const page = Number(params.page) || 1;
    const limit = 50;
    const search = typeof params.search === 'string' ? params.search : '';
    const cityId = typeof params.cityId === 'string' ? params.cityId : '';
    const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
    const subscriptionPlan = typeof params.subscriptionPlan === 'string' ? params.subscriptionPlan : '';

    // 🆕 Params for sort, status, and ownership/approval
    const status = typeof params.status === 'string' ? params.status : 'all';
    const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'newest';
    const ownership = typeof params.ownership === 'string' ? params.ownership : 'all';

    // 2. Dynamic Prisma Filters Build Karna
    const whereCondition: any = {};

    if (search) {
        whereCondition.name = { contains: search, mode: 'insensitive' };
    }
    if (cityId) {
        whereCondition.cityId = cityId;
    }
    if (categoryId) {
        whereCondition.categories = {
            some: { categoryId: categoryId }
        };
    }

    // 🆕 Status Filtering Logic
    if (status === 'active') whereCondition.isActive = true;
    else if (status === 'inactive') whereCondition.isActive = false;
    else if (status === 'published') whereCondition.isPublished = true;
    else if (status === 'hidden') whereCondition.isPublished = false;

    if (subscriptionPlan) {
        whereCondition.subscriptionPlan = subscriptionPlan;
    }

    // 🛡️ Ownership & Approval Filtering Logic
    if (ownership === 'approved_all') {
        whereCondition.OR = [
            { claims: { some: { status: 'APPROVED' } } },
            { instituteRequest: { status: 'APPROVED' } }
        ];
    } else if (ownership === 'approved_claims') {
        whereCondition.claims = { some: { status: 'APPROVED' } };
    } else if (ownership === 'approved_requests') {
        whereCondition.instituteRequest = { status: 'APPROVED' };
    } else if (ownership === 'has_managers') {
        whereCondition.managers = { some: {} };
    } else if (ownership === 'unclaimed') {
        whereCondition.AND = [
            { claims: { none: { status: 'APPROVED' } } },
            {
                OR: [
                    { instituteRequest: null },
                    { instituteRequest: { status: { not: 'APPROVED' } } }
                ]
            },
            { managers: { none: {} } }
        ];
    }

    // 🆕 Sorting Logic
    let orderByCondition: any = { createdAt: 'desc' }; // Default
    if (sortBy === 'views') orderByCondition = { viewCount: 'desc' }; // Sabse zyada views wale upar
    else if (sortBy === 'oldest') orderByCondition = { createdAt: 'asc' };

    // 3. Parallel Database Queries
    const [totalInstitutes, institutes, cities, categories] = await Promise.all([
        prisma.institute.count({ where: whereCondition }),

        prisma.institute.findMany({
            where: whereCondition,
            take: limit,
            skip: (page - 1) * limit,
            include: {
                city: true,
                _count: { select: { managers: true, claims: true } },
                claims: {
                    where: { status: 'APPROVED' },
                    take: 1,
                    select: { id: true, status: true, fullName: true, email: true }
                },
                instituteRequest: {
                    select: { id: true, status: true, ownerName: true }
                }
            },
            orderBy: orderByCondition
        }),

        prisma.city.findMany({ orderBy: { name: 'asc' } }),
        prisma.category.findMany({ orderBy: { name: 'asc' } })
    ]);

    const totalPages = Math.ceil(totalInstitutes / limit);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-stone-900 flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-stone-800" /> All Institutes
                    </h1>
                    <p className="text-stone-500 mt-1">
                        Found <span className="font-bold text-stone-800">{totalInstitutes}</span> matching institutes
                        {ownership === 'approved_all' && <span className="font-bold text-amber-700"> (⭐ Approved Claims & Owner-Created)</span>}
                        {ownership === 'approved_claims' && <span className="font-bold text-emerald-700"> (✓ Approved Claims Only)</span>}
                        {ownership === 'approved_requests' && <span className="font-bold text-blue-700"> (🏢 Owner-Created & Approved)</span>}
                        {ownership === 'has_managers' && <span className="font-bold text-purple-700"> (👤 Has Assigned Managers)</span>}
                        {ownership === 'unclaimed' && <span className="font-bold text-stone-600"> (🌐 Unclaimed / Seeded Only)</span>}.
                    </p>
                </div>
            </div>

            <div className="shrink-0">
                <Link
                    href="/af-ass-manage/institutes/add"
                    prefetch={false}
                    className="bg-stone-800 hover:bg-stone-900 text-stone-50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-sm border border-stone-900"
                >
                    <Plus className="w-4 h-4" /> Add Academy Profile
                </Link>
            </div>

            {/* 🚀 Filter Component Inserted Here */}
            <InstituteFilters cities={cities} categories={categories} />

            {/* Data Table */}
            <div className="bg-white border border-stone-200 rounded-t-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Academy Details</th>
                                <th className="p-4">Location</th>
                                <th className="p-4 text-center">Plan & Managers</th>
                                <th className="p-4">Status & Visibility</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {institutes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-stone-400 italic">No institutes match your filters.</td>
                                </tr>
                            ) : (
                                institutes.map((institute: any) => (
                                    <tr key={institute.id} className={`hover:bg-stone-50/50 transition-colors ${!institute.isActive ? 'opacity-70' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="font-bold text-stone-800 text-base">{institute.name}</div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${institute.providerType === 'INDIVIDUAL' ? 'bg-stone-100 text-stone-700 border border-stone-200 shadow-sm' : 'bg-stone-800 text-stone-100 border border-stone-900 shadow-sm'}`}>
                                                    {institute.providerType || 'INSTITUTE'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-stone-500 mt-1 font-medium">{institute.email || "No Email"}</div>

                                            {/* Ownership & Claim Badges */}
                                            {((institute.claims && institute.claims.length > 0) || institute.instituteRequest?.status === 'APPROVED') && (
                                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                    {institute.claims && institute.claims.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                                                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                                                            Claim Approved{institute.claims[0].fullName ? `: ${institute.claims[0].fullName}` : ''}
                                                        </span>
                                                    )}
                                                    {institute.instituteRequest?.status === 'APPROVED' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                                                            <Building className="w-3 h-3 text-blue-600" />
                                                            Owner-Created & Approved{institute.instituteRequest.ownerName ? `: ${institute.instituteRequest.ownerName}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-stone-600 bg-stone-100 w-fit px-2 py-1 rounded-md border border-stone-200">
                                                <Eye className="w-3.5 h-3.5 text-stone-500" />
                                                <span>{institute.viewCount} <span className="font-medium text-stone-500">total visits</span></span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-stone-700 font-bold">
                                                <MapPin className="w-4 h-4 text-stone-400" /> {institute.city.name}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center space-y-1.5">
                                            <div>
                                                <span className="inline-block bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-200 shadow-sm">
                                                    {institute.subscriptionPlan}
                                                </span>
                                            </div>
                                            {institute._count?.managers > 0 ? (
                                                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    <Users className="w-3 h-3 text-emerald-600" />
                                                    <span>{institute._count.managers} {institute._count.managers === 1 ? 'Manager' : 'Managers'}</span>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-stone-400 font-medium">0 Managers</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${institute.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                        {institute.isActive ? 'Active' : 'Inactive'}
                                                    </span>

                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${institute.isPublished ? 'bg-stone-50 text-stone-700 border-stone-200 shadow-sm' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                                                        {institute.isPublished ? 'Published' : 'Hidden'}
                                                    </span>
                                                </div>

                                                <div className="mt-1">
                                                    <ToggleStatusButton instituteId={institute.id} isActive={institute.isActive} isPublished={institute.isPublished} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/af-ass-manage/institutes/${institute.id}`}
                                                    prefetch={false}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg text-xs font-bold transition-all border border-stone-200 shadow-sm"
                                                >
                                                    <Edit className="w-3.5 h-3.5" /> Master Edit
                                                </Link>
                                                <AdminDeleteButton id={institute.id} onDelete={deleteInstituteAction} title="Delete Academy?" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <InstitutePagination totalPages={totalPages} currentPage={page} />
        </div>
    )
}