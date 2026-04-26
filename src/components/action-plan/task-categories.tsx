"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import {
  buildActionItems,
  buildProfileActivityRows,
  type ActionItem,
  type ActivityRow,
  type DeadlineRow,
  type BucketedActionItems,
} from "@/lib/activity-tasks";

const priorityClasses: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const EMPTY: BucketedActionItems = { thisWeek: [], thisMonth: [], upcoming: [] };

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
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleComplete = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between w-full py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center font-bold">
              0
            </span>
            {title}
          </h3>
        </div>
        <p className="text-sm text-gray-400 px-4 py-3">Nothing in this window.</p>
      </div>
    );
  }

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
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let cancelled = false;
    Promise.all([
      supabase
        .from("activities")
        .select("id, name, category, hours, end_date")
        .eq("user_id", user.id),
      supabase
        .from("application_deadlines")
        .select("id, key, label, date, system, type")
        .order("date", { ascending: true }),
    ]).then(([actRes, dlRes]) => {
      if (cancelled) return;
      if (actRes.data && actRes.data.length > 0) {
        setActivities(actRes.data as ActivityRow[]);
      } else {
        setActivities(buildProfileActivityRows(profile));
      }
      if (dlRes.data) setDeadlines(dlRes.data as DeadlineRow[]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  const buckets = useMemo(
    () => (loading ? EMPTY : buildActionItems(activities, deadlines)),
    [activities, deadlines, loading]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading your action plan…
      </div>
    );
  }

  return (
    <div>
      <TaskSection title="This Week" items={buckets.thisWeek} defaultOpen={true} />
      <TaskSection title="This Month" items={buckets.thisMonth} defaultOpen={true} />
      <TaskSection title="Upcoming" items={buckets.upcoming} defaultOpen={false} />
    </div>
  );
}
