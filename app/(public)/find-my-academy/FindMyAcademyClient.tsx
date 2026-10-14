"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Target,
  MapPin,
  GraduationCap,
  IndianRupee,
  Users,
  CheckCircle2,
  ArrowRight,
  Share2,
  Copy,
  Check,
  HelpCircle,
  Phone,
  ShieldCheck,
  Star,
  SlidersHorizontal,
  MessageSquare,
  Bot,
  ExternalLink,
  Layers,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Building2,
  Scale,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface InstituteMatch {
  id: string;
  name: string;
  slug: string;
  city: string;
  matchScore: number;
  rating: number;
  badge: string;
  feeEstimate: string;
  batchSizeEstimate: string;
  whySuitable: string;
  budgetFit: string;
  batchFit: string;
  doubtSupportFit: string;
  counselorTip: string;
  url: string;
  isVerified: boolean;
  rank: number;
}

interface MatchResult {
  studentSummary: string;
  studentDiagnosis: string;
  counselorStrategy: string[];
  questionsToAskAtDemo: string[];
  shortlist: InstituteMatch[];
  moreSuggestions?: InstituteMatch[];
  directoryUrl?: string;
  directoryCity?: string;
  directoryCategory?: string;
  aiCitationText: string;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Class 11 Agra (JEE 2028)',
    desc: 'Average student, ₹1.5L budget, small batches & doubt focus',
    prompt:
      "I'm a Class 11 student in Agra, budget ₹1.5 lakh, targeting JEE 2028, I prefer small batches, need doubt support, and I'm an average student. Which 3 institutes are actually suitable for me?",
  },
  {
    title: 'NEET Dropper in Kota',
    desc: 'Struggles with Physics numericals, ₹1.8L budget, strict test series',
    prompt:
      "I am a NEET repeater in Kota with a budget of ₹1.8 lakh. My biology and chemistry are solid but I struggle with physics numericals. I need an institute with strong 1-on-1 doubt counters and disciplined batch monitoring. Which 3 institutes should I shortlist?",
  },
  {
    title: 'UPSC Aspirant in Delhi',
    desc: 'Working professional, weekend/evening batch, ₹1.6L budget',
    prompt:
      "I am a working software engineer in Delhi aiming for UPSC 2027. My budget is ₹1.6 lakh. I need either evening or weekend batches with strong answer writing evaluation and current affairs mentorship. What are the 3 best institutes for me?",
  },
  {
    title: 'Class 9-10 Foundation',
    desc: 'Maths Olympiad & board balance, Jaipur, ₹80k budget',
    prompt:
      "Looking for Class 9 and 10 Foundation coaching in Jaipur for NTSE and Maths Olympiad along with CBSE boards. Budget is around ₹80,000 per year. Prefer medium batch with conceptual teachers. Which 3 academies fit best?",
  },
];

const EXAM_OPTIONS = [
  'JEE Main & Advanced 2028',
  'JEE Main & Advanced 2027',
  'NEET-UG Medical',
  'UPSC Civil Services (IAS/IPS)',
  'Foundation (Class 9 & 10)',
  'Commerce & CA Foundation',
  'CUET (UG)',
  'SSC / Government Exams',
];

const CLASS_OPTIONS = [
  'Class 9 Foundation',
  'Class 10 Foundation',
  'Class 11 (2-Year Target)',
  'Class 12 (1-Year Target)',
  'Dropper / Repeater',
  'College Student / Graduate',
];

const BUDGET_OPTIONS = [
  'Under ₹60,000 / year',
  '₹60,000 - ₹1.0 Lakh / year',
  '₹1.0 Lakh - ₹1.5 Lakh / year',
  '₹1.5 Lakh - ₹2.0 Lakh / year',
  'Above ₹2.0 Lakh / year',
];

const BATCH_SIZE_OPTIONS = [
  'Small Batches (< 30 students - Maximum Personal Attention)',
  'Medium Batches (30 - 60 students - Balanced Peer Group)',
  'Large Batches (60+ students - Highly Competitive Atmosphere)',
];

const MODE_OPTIONS = [
  'Offline Classroom (In-Person)',
  'Hybrid (Offline Classes + Online Support)',
  'Live Online (From Home)',
];

const WEAKNESS_CHIPS = [
  'Struggle with Physics / Math numericals',
  'Need 1-on-1 daily doubt resolution',
  'Average student needing steady pacing',
  'Struggle with consistent self-study discipline',
  'Strong in theory but slow in mock tests',
  'Prone to exam anxiety under pressure',
  'Need regular parent-teacher feedback',
];

const TRAVEL_OPTIONS = [
  'Within 5 km from home',
  'Within 10 - 15 km in my city',
  'Anywhere in the city',
  'Willing to stay in Hostel / PG (e.g. Kota, Delhi)',
  'Online only (Zero travel)',
];

const LOADING_PHRASES = [
  '✦ Analyzing student constraints & target exam requirements...',
  '⚡ Scanning AcademyFind verified database for fee brackets & batch capacities...',
  '🔍 Auditing daily doubt resolution facilities and teacher-to-student ratios...',
  '🧠 Evaluating candidate fit for average learner pacing vs ranker batches...',
  '✨ Synthesizing personalized shortlist of 3 most suitable institutes...',
  '🎯 Formulating counselor advice and demo class inspection points...',
];

export default function FindMyAcademyClient() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'wizard'>('prompt');
  const [promptText, setPromptText] = useState(SAMPLE_PROMPTS[0].prompt);

  // Wizard state
  const [targetExam, setTargetExam] = useState(EXAM_OPTIONS[0]);
  const [city, setCity] = useState('Agra');
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[2]);
  const [budget, setBudget] = useState(BUDGET_OPTIONS[2]);
  const [batchSize, setBatchSize] = useState(BATCH_SIZE_OPTIONS[0]);
  const [mode, setMode] = useState(MODE_OPTIONS[0]);
  const [selectedWeaknesses, setSelectedWeaknesses] = useState<string[]>([
    'Struggle with Physics / Math numericals',
    'Need 1-on-1 daily doubt resolution',
    'Average student needing steady pacing',
  ]);
  const [customWeakness, setCustomWeakness] = useState('');
  const [travelDistance, setTravelDistance] = useState(TRAVEL_OPTIONS[1]);

  // Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [activeCardTab, setActiveCardTab] = useState<Record<number, string>>({
    0: 'why',
    1: 'why',
    2: 'why',
  });

  const resultsRef = useRef<HTMLDivElement>(null);

  // Cycle loading phrases
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2400);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const toggleWeakness = (chip: string) => {
    if (selectedWeaknesses.includes(chip)) {
      setSelectedWeaknesses(selectedWeaknesses.filter((w) => w !== chip));
    } else {
      setSelectedWeaknesses([...selectedWeaknesses, chip]);
    }
  };

  const handleFindAcademies = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setLoadingPhraseIndex(0);

    try {
      let payload: any = {};
      if (activeTab === 'prompt') {
        payload = { prompt: promptText };
      } else {
        const fullWeaknesses = [
          ...selectedWeaknesses,
          ...(customWeakness.trim() ? [customWeakness.trim()] : []),
        ].join(', ');

        payload = {
          targetExam,
          city,
          classLevel,
          budget,
          mode,
          batchSize,
          strengthsWeaknesses: fullWeaknesses,
          travelDistance,
        };
      }

      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        console.warn('API returned non-JSON:', parseErr);
      }

      if (!res.ok || !data) {
        throw new Error(
          data?.error || `Counseling engine is momentarily busy (status ${res.status}). Please try again.`
        );
      }

      setResult(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err: any) {
      console.error('Match error:', err);
      let msg = err.message || '';
      if (msg.includes('JSON') || msg.includes('token') || msg.includes('Unexpected') || msg.includes('end of JSON')) {
        msg = 'The AI counselor is experiencing high demand right now. Please click "Find Best Match" again.';
      }
      setErrorMessage(
        msg || 'Unable to connect to AI counselor. Please check your network and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyAiCitation = () => {
    if (!result?.aiCitationText) return;
    navigator.clipboard.writeText(result.aiCitationText);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  const shareShortlist = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-amber-50/70 via-white to-amber-50/40 text-slate-900 pb-24">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 h-96 w-full max-w-5xl rounded-full bg-amber-200/35 blur-[100px]" />
      <div className="pointer-events-none absolute right-10 top-96 h-80 w-80 rounded-full bg-orange-200/25 blur-[90px]" />

      {/* Main Container */}
      <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-amber-800 shadow-xs backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            AcademyFind AI Matchmaker · Personalized Shortlist Engine
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Find the Right Coaching for{' '}
            <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 bg-clip-text text-transparent">
              YOU.
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Stop guessing from billboards. Tell us your target exam, budget, batch preference, and personal learning pace — our AI analyzes 50,000+ verified institutes to produce your tailored 3-academy shortlist.
          </p>
        </div>

        {/* Input Interface Card */}
        <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-5 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all">
          {/* Dual Mode Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-100 pb-6 mb-6">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'prompt'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="size-4" />
              Speak Freely / Natural Prompt
            </button>
            <button
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'wizard'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="size-4" />
              8-Step Guided Match Wizard
            </button>
          </div>

          {/* TAB 1: Free Form Natural Language Prompt */}
          {activeTab === 'prompt' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                  Describe your exact situation & requirements:
                </label>
                <div className="relative">
                  <Textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={4}
                    placeholder="e.g. I'm a Class 11 student in Agra, budget ₹1.5 lakh, targeting JEE 2028, I prefer small batches, need doubt support, and I'm an average student. Which 3 institutes are actually suitable for me?"
                    className="w-full resize-none rounded-2xl border-slate-200/80 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 transition-all leading-relaxed"
                  />
                  <div className="absolute right-3 bottom-3 text-xs text-slate-400">
                    Natural AI Language · Powered by AcademyFind
                  </div>
                </div>
              </div>

              {/* Sample Chips */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-2.5">
                  Try asking like this (click to load):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SAMPLE_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPromptText(item.prompt)}
                      className="group flex flex-col items-start p-3 rounded-xl border border-slate-200/70 bg-white hover:border-amber-300 hover:bg-amber-50/30 text-left transition-all text-xs"
                    >
                      <span className="font-bold text-slate-800 group-hover:text-amber-600 flex items-center gap-1.5">
                        <Sparkles className="size-3 text-amber-500" />
                        {item.title}
                      </span>
                      <span className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 8-Step Guided Wizard */}
          {activeTab === 'wizard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Target Exam */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Target className="size-3.5 text-amber-600" />
                  1. What are you preparing for?
                </label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                >
                  {EXAM_OPTIONS.map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. City */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-amber-600" />
                  2. Your City
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Agra, Delhi, Kota, Lucknow, Jaipur"
                  className="h-11 rounded-xl border-slate-200 bg-white text-sm"
                />
              </div>

              {/* 3. Class Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-amber-600" />
                  3. Your Current Class / Stage
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                >
                  {CLASS_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Budget */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <IndianRupee className="size-3.5 text-amber-600" />
                  4. Annual Budget
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Compass className="size-3.5 text-amber-600" />
                  5. Online / Offline / Hybrid
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                >
                  {MODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Batch Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="size-3.5 text-amber-600" />
                  6. Preferred Batch Size
                </label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                >
                  {BATCH_SIZE_OPTIONS.map((bs) => (
                    <option key={bs} value={bs}>
                      {bs}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Strengths / Weaknesses */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Lightbulb className="size-3.5 text-amber-600" />
                  7. Your Learning Strengths & Weaknesses (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEAKNESS_CHIPS.map((chip) => {
                    const active = selectedWeaknesses.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleWeakness(chip)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                          active
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {chip}
                      </button>
                    );
                  })}
                </div>
                <Input
                  value={customWeakness}
                  onChange={(e) => setCustomWeakness(e.target.value)}
                  placeholder="Or write custom notes (e.g. Average student, need patience with organic chemistry)"
                  className="h-10 rounded-xl text-xs bg-slate-50 border-slate-200 mt-2"
                />
              </div>

              {/* 8. Travel */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-amber-600" />
                  8. How far are you willing to travel?
                </label>
                <select
                  value={travelDistance}
                  onChange={(e) => setTravelDistance(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                >
                  {TRAVEL_OPTIONS.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" />
              100% Free · Independent & Unbiased · No Marketing Commissions
            </div>

            <Button
              onClick={handleFindAcademies}
              disabled={isLoading}
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm px-8 h-12 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 transition-all hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="size-4 animate-spin text-white" />
                  Evaluating Institutes...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-200" />
                  Find My Best Academy
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </div>

          {/* Animated Loading Status */}
          {isLoading && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center animate-fade-in">
              <p className="text-xs sm:text-sm font-semibold text-amber-900 transition-all">
                {LOADING_PHRASES[loadingPhraseIndex]}
              </p>
              <div className="mt-3 w-48 mx-auto h-1.5 bg-amber-200/60 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        {result && (
          <div ref={resultsRef} className="mt-14 space-y-8 animate-fade-in">
            {/* Shortlist Header Banner */}
            <div className="rounded-3xl border border-amber-200/80 bg-linear-to-r from-amber-50 via-white to-orange-50 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-800 px-3 py-1 text-xs font-bold mb-2">
                    <CheckCircle2 className="size-3.5 text-amber-600" />
                    Verified AI Recommendation Shortlist
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Your Personalized 3-Academy Shortlist
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                    Profile Evaluated: {result.studentSummary}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAiCitation}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                  >
                    {copiedCitation ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        Copied Prompt!
                      </>
                    ) : (
                      <>
                        <Bot className="size-3.5 text-amber-600" />
                        Copy for ChatGPT / Claude
                      </>
                    )}
                  </button>

                  <button
                    onClick={shareShortlist}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="size-3.5 text-slate-600" />
                        Share
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Student Diagnosis Insight */}
              <div className="mt-5 p-4 rounded-2xl bg-white/90 border border-slate-200/80">
                <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider block mb-1">
                  AI Academic Counselor Diagnosis:
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {result.studentDiagnosis}
                </p>
              </div>
            </div>

            {/* THE 3 SIGNATURE ACADEMY CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {result.shortlist.map((inst, index) => {
                const currentTab = activeCardTab[index] || 'why';
                return (
                  <div
                    key={inst.id || index}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300 ease-out hover:border-amber-300/80 hover:bg-white hover:shadow-[0_20px_45px_rgba(251,191,36,0.12)] hover:-translate-y-1.5"
                  >
                    {/* Ambient subtle corner glow on hover */}
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/10 blur-xl group-hover:bg-amber-400/20 transition-all" />

                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-3 py-1 shadow-2xs">
                          #{index + 1} {inst.badge}
                        </span>

                        <div className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="size-3" />
                          {inst.matchScore}% Fit
                        </div>
                      </div>

                      {/* Institute Title */}
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
                        {inst.name}
                      </h3>

                      {/* City & Rating */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-slate-400" />
                          {inst.city}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="size-3.5 fill-amber-500 text-amber-500" />
                          {inst.rating} / 5.0
                        </span>
                      </div>

                      {/* Key Stats Pill Bar */}
                      <div className="mt-4 grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Est. Fees
                          </span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {inst.feeEstimate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Batch Capacity
                          </span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {inst.batchSizeEstimate}
                          </span>
                        </div>
                      </div>

                      {/* Card Content Tabs */}
                      <div className="mt-4 border-b border-slate-100 flex gap-2 text-xs">
                        <button
                          onClick={() =>
                            setActiveCardTab({ ...activeCardTab, [index]: 'why' })
                          }
                          className={`pb-1.5 font-bold transition-all border-b-2 ${
                            currentTab === 'why'
                              ? 'border-amber-500 text-amber-600'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Personal Fit
                        </button>
                        <button
                          onClick={() =>
                            setActiveCardTab({ ...activeCardTab, [index]: 'budget' })
                          }
                          className={`pb-1.5 font-bold transition-all border-b-2 ${
                            currentTab === 'budget'
                              ? 'border-amber-500 text-amber-600'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Budget & Batch
                        </button>
                        <button
                          onClick={() =>
                            setActiveCardTab({ ...activeCardTab, [index]: 'doubt' })
                          }
                          className={`pb-1.5 font-bold transition-all border-b-2 ${
                            currentTab === 'doubt'
                              ? 'border-amber-500 text-amber-600'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Doubt Support
                        </button>
                      </div>

                      {/* Tab Body */}
                      <div className="mt-3 text-xs text-slate-600 min-h-[110px] leading-relaxed">
                        {currentTab === 'why' && (
                          <div className="space-y-2">
                            <p className="text-slate-700">{inst.whySuitable}</p>
                            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50 text-[11px] text-amber-900">
                              <span className="font-bold block">💡 Counselor Tip:</span>
                              {inst.counselorTip}
                            </div>
                          </div>
                        )}

                        {currentTab === 'budget' && (
                          <div className="space-y-2">
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">
                                💰 Budget Analysis:
                              </span>
                              <p className="text-slate-600">{inst.budgetFit}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">
                                👥 Batch Size Alignment:
                              </span>
                              <p className="text-slate-600">{inst.batchFit}</p>
                            </div>
                          </div>
                        )}

                        {currentTab === 'doubt' && (
                          <div className="space-y-2">
                            <span className="font-bold text-slate-800 block text-[11px]">
                              ❓ Doubt Resolution Protocol:
                            </span>
                            <p className="text-slate-600">{inst.doubtSupportFit}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card CTAs */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <Link
                        href={inst.url}
                        className="w-full flex items-center justify-center gap-1.5 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-2xs hover:-translate-y-0.5"
                      >
                        View Full Academy Profile
                        <ExternalLink className="size-3.5" />
                      </Link>

                      <Link
                        href="/compare"
                        className="w-full flex items-center justify-center gap-1.5 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all"
                      >
                        <Scale className="size-3" />
                        Compare With Other Institutes
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Market Estimation Transparency Footnote */}
            <p className="text-[11px] text-slate-500 text-center max-w-2xl mx-auto -mt-2">
              ℹ️ <span className="font-semibold text-slate-600">Note on Fees & Batch Sizes:</span> Figures are realistic market estimates for {result.studentSummary}. Actual tuition may vary based on scholarship test scores, instalment plans, and current batch intake caps. Confirm during demo classes.
            </p>

            {/* VIEW MORE SUGGESTIONS & ALTERNATIVES */}
            {result.moreSuggestions && result.moreSuggestions.length > 0 && (
              <div className="pt-2 pb-2">
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                    className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-50 via-white to-orange-50 hover:from-amber-100 hover:to-orange-100 text-slate-800 font-extrabold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Sparkles className="size-4 text-amber-600 transition-transform group-hover:rotate-12" />
                    <span>
                      {showMoreSuggestions
                        ? 'Hide Alternative Suggestions'
                        : `✨ View More Suggestions (+${result.moreSuggestions.length} Alternative Options)`}
                    </span>
                    {showMoreSuggestions ? (
                      <ChevronUp className="size-4 text-amber-700" />
                    ) : (
                      <ChevronDown className="size-4 text-amber-700" />
                    )}
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    {showMoreSuggestions
                      ? 'Showing alternative ranked academies suited to your criteria'
                      : 'Click to expand additional verified academies matching your budget & study requirements'}
                  </p>
                </div>

                {/* EXPANDED EXTRA CARDS */}
                {showMoreSuggestions && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {result.moreSuggestions.map((inst, index) => {
                      const cardIdx = 10 + index;
                      const currentTab = activeCardTab[cardIdx] || 'why';
                      return (
                        <div
                          key={inst.id || cardIdx}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300 ease-out hover:border-amber-300/80 hover:bg-white hover:shadow-[0_20px_45px_rgba(251,191,36,0.12)] hover:-translate-y-1.5"
                        >
                          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-slate-400/10 blur-xl group-hover:bg-amber-400/15 transition-all" />

                          <div>
                            {/* Top Badges */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1">
                                #{inst.rank || index + 4} {inst.badge}
                              </span>

                              <div className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="size-3" />
                                {inst.matchScore}% Fit
                              </div>
                            </div>

                            {/* Institute Title */}
                            <h3 className="text-lg font-extrabold text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
                              {inst.name}
                            </h3>

                            {/* City & Rating */}
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3.5 text-slate-400" />
                                {inst.city}
                              </span>
                              <span className="flex items-center gap-1 font-bold text-amber-600">
                                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                                {inst.rating} / 5.0
                              </span>
                            </div>

                            {/* Key Stats Pill Bar */}
                            <div className="mt-4 grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  Est. Fees
                                </span>
                                <span className="font-bold text-slate-800 text-[11px]">
                                  {inst.feeEstimate}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  Batch Capacity
                                </span>
                                <span className="font-bold text-slate-800 text-[11px]">
                                  {inst.batchSizeEstimate}
                                </span>
                              </div>
                            </div>

                            {/* Card Content Tabs */}
                            <div className="mt-4 border-b border-slate-100 flex gap-2 text-xs">
                              <button
                                onClick={() =>
                                  setActiveCardTab({ ...activeCardTab, [cardIdx]: 'why' })
                                }
                                className={`pb-1.5 font-bold transition-all border-b-2 ${
                                  currentTab === 'why'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                Personal Fit
                              </button>
                              <button
                                onClick={() =>
                                  setActiveCardTab({ ...activeCardTab, [cardIdx]: 'budget' })
                                }
                                className={`pb-1.5 font-bold transition-all border-b-2 ${
                                  currentTab === 'budget'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                Budget & Batch
                              </button>
                              <button
                                onClick={() =>
                                  setActiveCardTab({ ...activeCardTab, [cardIdx]: 'doubt' })
                                }
                                className={`pb-1.5 font-bold transition-all border-b-2 ${
                                  currentTab === 'doubt'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                Doubt Support
                              </button>
                            </div>

                            {/* Tab Body */}
                            <div className="mt-3 text-xs text-slate-600 min-h-[110px] leading-relaxed">
                              {currentTab === 'why' && (
                                <div className="space-y-2">
                                  <p className="text-slate-700">{inst.whySuitable}</p>
                                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50 text-[11px] text-amber-900">
                                    <span className="font-bold block">💡 Counselor Tip:</span>
                                    {inst.counselorTip}
                                  </div>
                                </div>
                              )}

                              {currentTab === 'budget' && (
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[11px]">
                                      💰 Budget Analysis:
                                    </span>
                                    <p className="text-slate-600">{inst.budgetFit}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[11px]">
                                      👥 Batch Size Alignment:
                                    </span>
                                    <p className="text-slate-600">{inst.batchFit}</p>
                                  </div>
                                </div>
                              )}

                              {currentTab === 'doubt' && (
                                <div className="space-y-2">
                                  <span className="font-bold text-slate-800 block text-[11px]">
                                    ❓ Doubt Resolution Protocol:
                                  </span>
                                  <p className="text-slate-600">{inst.doubtSupportFit}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card CTAs */}
                          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                            <Link
                              href={inst.url}
                              className="w-full flex items-center justify-center gap-1.5 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-2xs hover:-translate-y-0.5"
                            >
                              View Full Academy Profile
                              <ExternalLink className="size-3.5" />
                            </Link>

                            <Link
                              href="/compare"
                              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all"
                            >
                              <Scale className="size-3" />
                              Compare With Other Institutes
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* EXPLORE FULL CITY DIRECTORY BANNER */}
            {result.directoryUrl && (
              <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="space-y-2 text-center md:text-left z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                    <Building2 className="size-3.5" />
                    Complete Verified Directory
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Want to explore all coachings in {result.directoryCity || 'your city'}?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Browse all verified institutes in {result.directoryCity || 'the area'} with interactive maps, student reviews, fee comparisons, and filter by distance.
                  </p>
                </div>
                <Link
                  href={result.directoryUrl}
                  className="z-10 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 shrink-0"
                >
                  Explore All {result.directoryCity || ''} Institutes
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}

            {/* Strategic Counselor Roadmap & Demo Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Strategy Plan */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold">
                    <Compass className="size-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Your 3-Step Preparation Roadmap
                  </h3>
                </div>
                <div className="space-y-3">
                  {result.counselorStrategy.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo Questions Checklist */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold">
                    <HelpCircle className="size-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Ask These 3 Questions During Demo Classes
                  </h3>
                </div>
                <div className="space-y-3">
                  {result.questionsToAskAtDemo.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-800 font-bold text-[10px]">
                        ?
                      </span>
                      <p className="text-slate-700 font-medium">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generative AI Citation Widget (Requirement 4) */}
            <div className="rounded-3xl border border-amber-300/80 bg-linear-to-r from-amber-500/10 via-white to-amber-500/5 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bot className="size-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Generative AI & LLM Friendly
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Want to cross-check this shortlist with ChatGPT, Claude, or Perplexity?
                  </h4>
                  <p className="text-xs text-slate-600">
                    Copy the pre-formatted citation prompt below and paste into ChatGPT. It instructs the AI to use AcademyFind verified data.
                  </p>
                </div>

                <Button
                  onClick={copyAiCitation}
                  className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 h-10 shrink-0"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="size-3.5 text-emerald-400 mr-1.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1.5" />
                      Copy AI Citation Prompt
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-600 select-all whitespace-pre-wrap">
                {result.aiCitationText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
