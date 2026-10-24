"use client";

import { useState } from "react";
import { updateCity, deleteCity } from "@/lib/User/admin/adminCities";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Save, Trash2, MapPin, Loader2 } from "lucide-react";

interface CityData {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  _count?: {
    institutes: number;
  };
}

const POPULAR_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function EditCityModal({ city }: { city: CityData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedState, setSelectedState] = useState(
    POPULAR_STATES.includes(city.state) ? city.state : "CUSTOM"
  );
  const [customState, setCustomState] = useState(
    POPULAR_STATES.includes(city.state) ? "" : city.state
  );

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("id", city.id);
    if (selectedState === "CUSTOM") {
      formData.set("state", customState);
    } else {
      formData.set("state", selectedState);
    }

    const res = await updateCity(formData);
    if (res.success) {
      toast.success(res.message || "City updated successfully!");
      setIsOpen(false);
    } else {
      toast.error(res.error || "Failed to update city.");
    }
    setIsLoading(false);
  }

  async function handleDelete() {
    const linkedInstitutes = city._count?.institutes ?? 0;
    if (linkedInstitutes > 0) {
      toast.error(
        `Cannot delete "${city.name}" because it has ${linkedInstitutes} linked institutes.`
      );
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to delete "${city.name}"? This action cannot be undone.`
    );
    if (!confirm) return;

    setIsDeleting(true);
    const res = await deleteCity(city.id);
    if (res.success) {
      toast.success(res.message || "City deleted successfully!");
      setIsOpen(false);
    } else {
      toast.error(res.error || "Failed to delete city.");
    }
    setIsDeleting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" /> Edit
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-6 bg-white border-slate-100 rounded-3xl shadow-2xl outline-none max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              Edit City: {city.name}
            </div>
            {city._count && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {city._count.institutes} Institutes
              </span>
            )}
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Update geographical details, directory URL slug, or descriptive information.
          </p>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <input type="hidden" name="id" value={city.id} />

          {/* City Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              City Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={city.name}
              placeholder="e.g. Lucknow"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              URL Slug <span className="text-slate-400 font-normal">(/directory/...)</span>
            </label>
            <input
              type="text"
              name="slug"
              defaultValue={city.slug}
              placeholder="lucknow"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-mono transition"
            />
          </div>

          {/* State */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              State / UT <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition cursor-pointer"
              >
                <option value="">-- Select State --</option>
                {POPULAR_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
                <option value="CUSTOM">+ Other State (Enter manually)</option>
              </select>

              {selectedState === "CUSTOM" && (
                <input
                  type="text"
                  required
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                  placeholder="Enter state name"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition"
                />
              )}
            </div>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Country</label>
            <input
              type="text"
              name="country"
              defaultValue={city.country || "India"}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Latitude <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                defaultValue={city.latitude ?? ""}
                placeholder="e.g. 26.8467"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Longitude <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                defaultValue={city.longitude ?? ""}
                placeholder="e.g. 80.9462"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Short Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={city.description ?? ""}
              placeholder="e.g. Prominent educational hub..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting || (city._count?.institutes ?? 0) > 0}
              onClick={handleDelete}
              title={
                (city._count?.institutes ?? 0) > 0
                  ? "Cannot delete city with linked institutes"
                  : "Delete city"
              }
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete City
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50 shadow-sm hover:shadow"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
