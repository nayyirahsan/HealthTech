"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";
import { GPAChart, MCATChart, ActivityChart } from "@/components/next-steps/profile-charts";
import { DeadlineCards } from "@/components/next-steps/deadline-cards";
import { mockUser, mockRecommendations } from "@/lib/mock-data";

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const visualComponents: Record<string, React.ReactNode> = {
  activity: <ActivityChart />,
  mcat: <MCATChart />,
  gpa: <GPAChart />,
  deadlines: (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <DeadlineCards />
    </div>
  ),
};

export default function NextStepsPage() {
  const [step, setStep] = useState(0);
  const current = mockRecommendations[step];
  const isLast = step === mockRecommendations.length - 1;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {mockUser.full_name.split(" ")[0]}
            </h1>
            <p className="text-sm text-gray-500">
              Your AI copilot analyzed your profile. Let&apos;s walk through your priorities.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Step list (left sidebar) */}
        <div className="hidden md:block w-56 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Steps ({step + 1}/{mockRecommendations.length})
          </p>
          <div className="space-y-1">
            {mockRecommendations.map((rec, i) => (
              <button
                key={rec.id}
                onClick={() => setStep(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                  i === step
                    ? "bg-orange-100 text-orange-700 font-medium"
                    : i < step
                    ? "text-gray-400"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0 font-medium ${
                    i === step
                      ? "bg-orange-600 text-white"
                      : i < step
                      ? "bg-gray-200 text-gray-400"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span className="truncate">{rec.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile step indicator */}
          <div className="flex md:hidden items-center gap-1.5 mb-4">
            {mockRecommendations.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-orange-500" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Relevant visual for this step */}
          <div className="mb-6 animate-fade-in" key={`visual-${step}`}>
            {visualComponents[current.visual]}
          </div>

          {/* AI recommendation card */}
          <div
            className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200 p-6 animate-fade-in"
            key={`rec-${step}`}
          >
            <div className="flex items-start gap-3 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${priorityDot[current.priority]}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5">
                    {current.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    Step {step + 1} of {mockRecommendations.length}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{current.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{current.description}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-orange-100">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  step === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {isLast ? (
                <Link href="/action-plan">
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors text-sm">
                    View Your Action Plan
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
