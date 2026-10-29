"use client";

import { useState } from "react";
import { submitClaimRequest } from "@/lib/institutes/institute-claim";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { PricingModal } from "../manager/PricingPopUp";

interface ClaimFormProps {
  instituteId: string;
  instituteName: string;
  userId: string;
  defaultName?: string | null;
  defaultEmail?: string | null;
  defaultPhone?: string | null;
}

export default function ClaimForm({ instituteId, instituteName, userId, defaultName, defaultEmail, defaultPhone }: ClaimFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const res = await submitClaimRequest(formData);

    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMsg(res.error || "Something went wrong.");
    }
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md bg-white rounded-3xl shadow-xl shadow-amber-900/5 p-10 text-center border border-amber-100">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Request Submitted!</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Thank you for claiming <strong className="text-slate-800">{instituteName}</strong>. Our admin team will verify your details and grant you access shortly.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3.5 bg-amber-400 text-white rounded-xl font-semibold hover:bg-amber-500 transition-all shadow-md shadow-amber-500/20"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-amber-900/5 overflow-hidden flex flex-col lg:flex-row border border-amber-100/60">

      {/* LEFT PANEL: Soft Amber Theme with Your Illustration */}
      <div className="lg:w-5/12 bg-amber-50 p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden border-r border-amber-100/50">
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-amber-200 rounded-full blur-[80px] opacity-40"></div>

        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-amber-950 mb-2 tracking-tight flex items-center gap-2.5 flex-wrap">
            Claim Profile <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60 uppercase tracking-wide">100% Free</span>
          </h1>
          <p className="text-lg font-bold text-amber-600 mb-4 pb-4 border-b border-amber-200">
            {instituteName}
          </p>

          <p className="text-amber-900/70 leading-relaxed text-sm font-medium">
            Take official ownership of your AcademyFind listing. Unlock powerful tools to grow your institute's presence, update courses, and attract more students.
          </p>
        </div>

        {/* The Magic Image Integration */}
        <div className="mt-10 relative z-10 flex justify-center items-center">
          <Image
            src="/claim-illustration.PNG"
            alt="Claim Institute Illustration"
            width={500}
            height={500}
            priority
            // mix-blend-multiply image ke white background ko hide karke amber bg se blend kar dega
            className="object-contain mix-blend-multiply drop-shadow-sm transition-transform hover:scale-105 duration-700 ease-out"
          />
        </div>
      </div>

      {/* RIGHT PANEL: Clean Form */}
      <div className="lg:w-7/12 p-10 lg:p-12 bg-white">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left Side: Headings */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Your Details</h2>
            <p className="text-slate-500 mt-1 text-sm">
              Please provide your official contact information.
            </p>
          </div>

          {/* Right Side: View Pricing Link (Temporarily hidden) */}
          {/* <div className="sm:text-right">
            <PricingModal>
              <button className="inline-flex items-center gap-1 text-sm font-medium text-amber-500 transition-colors hover:text-amber-600 cursor-pointer">
                View Pricing
                <ArrowRight className="h-4 w-4" />
              </button>
            </PricingModal>
          </div> */}
        </div>


        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="instituteId" value={instituteId} />
          <input type="hidden" name="userId" value={userId} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="fullName"
                required
                defaultValue={defaultName || ""}
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Phone Number <span className="text-red-500">*</span></label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500 font-medium text-sm pointer-events-none">+91</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  defaultValue={defaultPhone || ""}
                  className="w-full py-3.5 pr-4 pl-11 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                  placeholder="98765 43210"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Official Email ID <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              required
              defaultValue={defaultEmail || ""}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
              placeholder="contact@yourinstitute.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Your Role at Institute <span className="text-red-500">*</span></label>
            <Select name="role" required>
              <SelectTrigger className="w-full px-4 py-6 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all text-base shadow-none">
                <SelectValue placeholder="Select your designation" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="Owner/Founder">Owner / Founder</SelectItem>
                <SelectItem value="Director/Principal">Director / Principal</SelectItem>
                <SelectItem value="Manager/Admin">Manager / Admin</SelectItem>
                <SelectItem value="Marketing Head">Marketing Head</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Additional Information</label>
            <textarea
              name="message"
              rows={3}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all resize-none"
              placeholder="Any links (website, social media) to help us verify faster..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Submitting Request...
              </>
            ) : "Submit Claim Request"}
          </button>
        </form>
      </div>
    </div>
  );
}