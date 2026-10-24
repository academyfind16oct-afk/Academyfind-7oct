import { prisma } from "@/lib/prisma"
import { MapPin, Map } from "lucide-react"
import AddCityModal from "@/components/admin/AddCityModal"
import EditCityModal from "@/components/admin/EditCityModal"

export default async function AdminCitiesPage() {
    // 🚀 Fetch all cities and count the institutes linked to each city
    const cities = await prisma.city.findMany({
        include: {
            _count: {
                select: { institutes: true }
            }
        },
        orderBy: [
            { name: 'asc' },
            { state: 'asc' },
            
        ]
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-8 h-8 text-rose-500" /> Operational Cities
                    </h1>
                    <p className="text-slate-500 mt-1">Manage regions, cities, and geographic distribution of your institutes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl font-bold text-sm">
                        Total Cities: {cities.length}
                    </div>
                    {/* Add City Modal Trigger */}
                    <AddCityModal />
                </div>
            </div>

            {/* Cities Table */}
            <div className="bg-white/80 backdrop-blur-xl border border-stone-100/60 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">City Name & Slug</th>
                                <th className="p-4">State & Country</th>
                                <th className="p-4 text-center">Institutes Listed</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100/50">
                            {cities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">No cities found. Please run your database seed script.</td>
                                </tr>
                            ) : (
                                cities.map((city: any) => (
                                    <tr key={city.id} className="hover:bg-slate-50/50 transition-colors">
                                        
                                        {/* 1. Name & Slug */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 flex items-center gap-2 text-base">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                {city.name}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                                /{city.slug}
                                            </div>
                                        </td>

                                        {/* 2. State & Country */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                <Map className="w-3.5 h-3.5 text-slate-400" /> {city.state}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold ml-5">
                                                {city.country}
                                            </div>
                                        </td>

                                        {/* 3. Listed Institutes Count */}
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 h-8 rounded-full text-xs font-bold ${
                                                    city._count.institutes > 0 
                                                        ? 'bg-rose-100 text-rose-700' 
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {city._count.institutes}
                                                </span>
                                                {city._count.institutes > 0 && (
                                                    <span className="text-[10px] text-slate-400 mt-1">Institutes</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* 4. Action Buttons */}
                                        <td className="p-4 text-right">
                                            <EditCityModal city={city} />
                                        </td>
                                        
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}