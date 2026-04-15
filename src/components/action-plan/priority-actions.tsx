import { FileText, Mail, BookOpen } from "lucide-react";

const priorityItems = [
  {
    id: 1,
    title: "Register for MCAT",
    description: "Secure your preferred June test date before spots fill up.",
    dueDate: "Apr 15",
    badge: "Urgent",
    badgeClass: "bg-red-100 text-red-700",
    icon: BookOpen,
  },
  {
    id: 2,
    title: "Request Letter from Dr. Chen",
    description: "Send a polite email with your resume and a reminder of the class you took.",
    dueDate: "Apr 12",
    badge: "Urgent",
    badgeClass: "bg-red-100 text-red-700",
    icon: Mail,
  },
  {
    id: 3,
    title: "Start Personal Statement",
    description: "Outline your narrative arc. TMDSAS opens May 1 — get ahead.",
    dueDate: "Apr 30",
    badge: "Important",
    badgeClass: "bg-orange-100 text-orange-700",
    icon: FileText,
  },
];

export function PriorityActions() {
  return (
    <div className="mb-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Priorities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {priorityItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border-2 border-orange-200 p-6 shadow-md hover:shadow-lg transition-shadow opacity-0 animate-slide-up"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.badgeClass}`}>
                  {item.badge}
                </span>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Due {item.dueDate}</span>
                <button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
                  Start
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
