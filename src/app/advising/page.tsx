"use client";

import {
  MapPin,
  Clock,
  Mail,
  Phone,
  Calendar,
  Video,
  MessageSquare,
  CheckSquare,
  ExternalLink,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

// ── HPO constants ─────────────────────────────────────────────────────────────

const HPO = {
  address:       "Flawn Academic Center, Room 2.236",
  addressLine2:  "2304 Whitis Ave, Austin, TX 78712",
  mapsUrl:       "https://maps.google.com/?q=Flawn+Academic+Center+UT+Austin",
  hours:         "Mon–Fri · 8:30 AM – 4:30 PM",
  hoursNote:     "Closed weekends and university holidays",
  email:         "hpo@austin.utexas.edu",
  phone:         "(512) 471-3172",
  phoneTel:      "tel:+15124713172",
  homepage:      "https://healthprofessions.utexas.edu/",
  servicesPage:  "https://healthprofessions.utexas.edu/hpo-programs-and-services/hpo-services",
  twelveTwenty:  "https://utexas.12twenty.com/Login",
} as const;

const PREP_ITEMS = [
  "Unofficial transcript (current and planned courses)",
  "List of current and planned extracurricular activities with hours",
  "MCAT score and test date (if taken or scheduled)",
  "Specific questions you want answered",
  "Draft list of schools you're considering",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdvisingPage() {
  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-5">

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Advising
          </h1>
          <p className="text-sm text-white/35 mt-0.5">
            Connect with UT Austin&apos;s Health Professions Office (HPO).
          </p>
        </div>
        <span className="text-[11px] text-white/20 font-mono">Official UT advising</span>
      </div>

      {/* Primary CTA */}
      <div className="bg-[#BF5700]/10 border border-[#BF5700]/25 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-[#BF5700]/20 flex items-center justify-center shrink-0">
              <GraduationCap size={20} className="text-[#BF5700]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Book a 1-on-1 HPO appointment</p>
              <p className="text-xs text-white/50 mt-0.5">
                Open to currently enrolled students and recent grads (≤1 year). Times vary by coach availability.
              </p>
            </div>
          </div>
          <a
            href={HPO.twelveTwenty}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#BF5700] hover:bg-[#D4620A] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#BF5700]/20 shrink-0"
          >
            Open 12Twenty@Texas
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Step-by-step nav hint */}
        <div className="mt-4 pt-4 border-t border-[#BF5700]/20">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#BF5700]/80 mb-2">
            After sign-in, what to click
          </p>
          <ol className="space-y-1.5 text-xs text-white/65">
            <li className="flex gap-2">
              <span className="font-mono text-[#BF5700]/70 shrink-0">1.</span>
              <span>Make sure your profile lists <span className="font-medium text-white/85">Pre-Health</span> under interests (Profile → Interests).</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-[#BF5700]/70 shrink-0">2.</span>
              <span>In the left sidebar, click <span className="font-medium text-white/85">Appointments</span> for 1-on-1 coaching, or <span className="font-medium text-white/85">Events</span> → search &ldquo;HPO Virtual Drop-Ins&rdquo; for drop-ins.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-[#BF5700]/70 shrink-0">3.</span>
              <span>Pick a time and confirm. You&apos;ll get an email confirmation.</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Quick info */}
      <div>
        <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
          Office Info
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">

          {/* Location */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-[#BF5700]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Location</span>
            </div>
            <p className="text-sm font-medium text-white leading-snug">{HPO.address}</p>
            <p className="text-xs text-white/50 mt-1">{HPO.addressLine2}</p>
            <a
              href={HPO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#BF5700] hover:text-[#D4620A] mt-3 font-medium"
            >
              Get directions <ExternalLink size={11} />
            </a>
          </div>

          {/* Hours */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-[#BF5700]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Office Hours</span>
            </div>
            <p className="text-sm font-medium text-white leading-snug">{HPO.hours}</p>
            <p className="text-xs text-white/50 mt-1">{HPO.hoursNote}</p>
          </div>

          {/* Contact */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={15} className="text-[#BF5700]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Contact</span>
            </div>
            <a
              href={`mailto:${HPO.email}`}
              className="inline-flex items-center gap-2 text-sm text-white hover:text-[#BF5700] transition-colors"
            >
              <Mail size={13} className="text-white/40" />
              {HPO.email}
            </a>
            <a
              href={HPO.phoneTel}
              className="inline-flex items-center gap-2 text-sm text-white hover:text-[#BF5700] transition-colors mt-2"
            >
              <Phone size={13} className="text-white/40" />
              {HPO.phone}
            </a>
          </div>

        </div>
      </div>

      {/* Advising paths */}
      <div>
        <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
          Ways to Get Advising
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">

          {/* 1-on-1 */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex flex-col">
            <div className="w-9 h-9 rounded-lg bg-[#BF5700]/15 flex items-center justify-center mb-3">
              <Calendar size={16} className="text-[#BF5700]" />
            </div>
            <p className="text-sm font-semibold text-white">1-on-1 Appointment</p>
            <p className="text-xs text-white/55 mt-1.5 leading-relaxed flex-1">
              Best for academic record review, school list feedback, and application timing. After sign-in, click <span className="text-white/80 font-medium">Appointments</span> in the left sidebar.
            </p>
            <a
              href={HPO.twelveTwenty}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#BF5700] hover:text-[#D4620A] mt-3 font-medium"
            >
              Open 12Twenty <ExternalLink size={11} />
            </a>
          </div>

          {/* Virtual drop-in */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex flex-col">
            <div className="w-9 h-9 rounded-lg bg-[#BF5700]/15 flex items-center justify-center mb-3">
              <Video size={16} className="text-[#BF5700]" />
            </div>
            <p className="text-sm font-semibold text-white">Virtual Drop-Ins</p>
            <p className="text-xs text-white/55 mt-1.5 leading-relaxed flex-1">
              15 minutes max, always virtual. After sign-in, click <span className="text-white/80 font-medium">Events</span> in the left sidebar and search &ldquo;HPO Virtual Drop-Ins&rdquo;.
            </p>
            <a
              href={HPO.twelveTwenty}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#BF5700] hover:text-[#D4620A] mt-3 font-medium"
            >
              Open 12Twenty <ExternalLink size={11} />
            </a>
          </div>

          {/* Email / phone */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex flex-col">
            <div className="w-9 h-9 rounded-lg bg-[#BF5700]/15 flex items-center justify-center mb-3">
              <MessageSquare size={16} className="text-[#BF5700]" />
            </div>
            <p className="text-sm font-semibold text-white">Quick Email or Phone</p>
            <p className="text-xs text-white/55 mt-1.5 leading-relaxed flex-1">
              For general inquiries only. HPO will <span className="text-white/80 font-medium">not</span> review academic records over email — book a 1-on-1 for that.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <a href={`mailto:${HPO.email}`} className="inline-flex items-center gap-1 text-xs text-[#BF5700] hover:text-[#D4620A] font-medium">
                <Mail size={11} /> Email
              </a>
              <a href={HPO.phoneTel} className="inline-flex items-center gap-1 text-xs text-[#BF5700] hover:text-[#D4620A] font-medium">
                <Phone size={11} /> Call
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Prep checklist */}
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare size={16} className="text-[#BF5700]" />
          <span className="text-sm font-semibold text-white">Before Your Appointment</span>
        </div>
        <p className="text-xs text-white/50 mb-4">
          Bring or have ready. A prepared appointment is a productive appointment.
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
          {PREP_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-white/75">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BF5700] mt-2 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Eligibility / FAQ footer */}
      <div className="flex items-start gap-3 bg-white/[0.025] border border-white/[0.08] rounded-xl px-4 py-3">
        <AlertCircle size={14} className="text-white/40 shrink-0 mt-0.5" />
        <p className="text-xs text-white/55 leading-relaxed">
          Full coaching access is for currently enrolled UT students and recent graduates (within one academic year).
          Alumni and post-bacc students can access fee-based coaching on a limited basis after the 12th class day.
          In-person drop-ins are not offered.{" "}
          <a
            href={HPO.servicesPage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#BF5700] hover:text-[#D4620A] font-medium"
          >
            Full HPO services page →
          </a>
        </p>
      </div>

    </div>
  );
}
