"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { mockActionItems } from "@/lib/mock-data";

const priorityClasses: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

type ActionItem = {
  id: number;
  title: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
};

function TaskSection({
  title,
  items,
  defaultOpen = true,
}: {
  title: string;
  items: ActionItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggleComplete = (id: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 border-b border-gray-200"
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs flex items-center justify-center font-bold">
            {items.length}
          </span>
          {title}
        </h3>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="mt-2">
          {items.map((item) => {
            const done = completed.has(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <button
                  onClick={() => toggleComplete(item.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                    done
                      ? "bg-orange-500 border-orange-500"
                      : "border-gray-300 hover:border-orange-500"
                  }`}
                >
                  {done && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      done ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">Due: {item.dueDate}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                    priorityClasses[item.priority]
                  }`}
                >
                  {item.priority}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TaskCategories() {
  return (
    <div>
      <TaskSection title="This Week" items={mockActionItems.thisWeek} defaultOpen={true} />
      <TaskSection title="This Month" items={mockActionItems.thisMonth} defaultOpen={true} />
      <TaskSection title="Upcoming" items={mockActionItems.upcoming} defaultOpen={false} />
    </div>
  );
}
