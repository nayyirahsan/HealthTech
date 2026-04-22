import { Calendar, AlertCircle } from "lucide-react";
import { mockDeadlines } from "@/lib/mock-data";

const systemColors: Record<string, string> = {
  TMDSAS: "border-l-orange-500",
  AMCAS: "border-l-blue-500",
  AACOMAS: "border-l-purple-500",
  MCAT: "border-l-green-500",
};

export function DeadlineCards() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-orange-600" />
        <h3 className="text-sm font-semibold text-gray-900">Upcoming Deadlines</h3>
      </div>
      <div className="space-y-3">
        {mockDeadlines.map((d) => (
          <div
            key={d.id}
            className={`rounded-lg border border-gray-200 border-l-4 p-4 ${
              systemColors[d.system] || "border-l-gray-400"
            } ${d.urgent ? "bg-red-50 border-red-200" : "bg-white"} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-sm font-medium ${d.urgent ? "text-red-900" : "text-gray-900"}`}>
                  {d.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{d.date}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {d.urgent && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    d.urgent
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {d.daysAway}d away
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
