import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { mockRecommendations } from "@/lib/mock-data";

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export function AIRecommendations() {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200 p-6 sm:p-8">
      {/* AI header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your AI Copilot&apos;s Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">
            Based on your profile, here are your top priorities to stay competitive for TX medical schools.
          </p>
        </div>
      </div>

      {/* Recommendation cards */}
      <div className="space-y-3 mb-8">
        {mockRecommendations.map((rec, i) => (
          <div
            key={rec.id}
            className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards" }}
          >
            <div className="flex items-start gap-3">
              <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${priorityDot[rec.priority]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                  <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5 shrink-0">
                    {rec.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link href="/action-plan">
        <button className="w-full sm:w-auto px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
          View Your Action Plan
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}
