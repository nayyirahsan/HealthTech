"use client";

import {
  useState,
  useEffect,
  useRef,
} from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  X,
  Plus,
  Search,
  Pencil,
  Check,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tier = "Reach" | "Target" | "Safety";

interface ListSchool {
  id:          string;
  name:        string;
  abbr:        string;
  state:       string;
  type:        "MD" | "DO";
  probability: number;
  tier:        Tier;
  notes:       string;
}

// ── School picker catalog (same 50 from chance calculator) ────────────────────

const CATALOG = [
  { name: "Harvard Medical School",          abbr: "HMS",   state: "MA", type: "MD" as const, probability: 8  },
  { name: "Johns Hopkins SOM",               abbr: "JHU",   state: "MD", type: "MD" as const, probability: 9  },
  { name: "Stanford SOM",                    abbr: "STAN",  state: "CA", type: "MD" as const, probability: 7  },
  { name: "UCSF School of Medicine",         abbr: "UCSF",  state: "CA", type: "MD" as const, probability: 9  },
  { name: "Mayo Clinic Alix SOM",            abbr: "MAYO",  state: "MN", type: "MD" as const, probability: 6  },
  { name: "Columbia Vagelos COM",            abbr: "CU",    state: "NY", type: "MD" as const, probability: 10 },
  { name: "Penn Perelman SOM",               abbr: "PENN",  state: "PA", type: "MD" as const, probability: 11 },
  { name: "Yale SOM",                        abbr: "YALE",  state: "CT", type: "MD" as const, probability: 12 },
  { name: "Duke SOM",                        abbr: "DUKE",  state: "NC", type: "MD" as const, probability: 13 },
  { name: "Washington University SOM",       abbr: "WUSTL", state: "MO", type: "MD" as const, probability: 11 },
  { name: "Baylor College of Medicine",      abbr: "BCM",   state: "TX", type: "MD" as const, probability: 22 },
  { name: "UT Southwestern",                 abbr: "UTSW",  state: "TX", type: "MD" as const, probability: 28 },
  { name: "Northwestern Feinberg SOM",       abbr: "NW",    state: "IL", type: "MD" as const, probability: 17 },
  { name: "Vanderbilt SOM",                  abbr: "VU",    state: "TN", type: "MD" as const, probability: 18 },
  { name: "Cornell Weill",                   abbr: "WCM",   state: "NY", type: "MD" as const, probability: 15 },
  { name: "University of Michigan",          abbr: "UMICH", state: "MI", type: "MD" as const, probability: 20 },
  { name: "Emory SOM",                       abbr: "EMO",   state: "GA", type: "MD" as const, probability: 21 },
  { name: "Dartmouth Geisel SOM",            abbr: "GS",    state: "NH", type: "MD" as const, probability: 19 },
  { name: "Pittsburgh SOM",                  abbr: "PITT",  state: "PA", type: "MD" as const, probability: 23 },
  { name: "Case Western SOM",                abbr: "CWRU",  state: "OH", type: "MD" as const, probability: 22 },
  { name: "UT Health Houston McGovern",      abbr: "UTH",   state: "TX", type: "MD" as const, probability: 35 },
  { name: "Texas A&M COM",                   abbr: "TAMU",  state: "TX", type: "MD" as const, probability: 38 },
  { name: "UT Rio Grande Valley SOM",        abbr: "UTRGV", state: "TX", type: "MD" as const, probability: 44 },
  { name: "TTUHSC Paul Foster SOM",          abbr: "TTEP",  state: "TX", type: "MD" as const, probability: 42 },
  { name: "TTUHSC SOM Lubbock",              abbr: "TTU",   state: "TX", type: "MD" as const, probability: 43 },
  { name: "Georgetown SOM",                  abbr: "GU",    state: "DC", type: "MD" as const, probability: 25 },
  { name: "George Washington SMHS",          abbr: "GWU",   state: "DC", type: "MD" as const, probability: 26 },
  { name: "Tulane SOM",                      abbr: "TUL",   state: "LA", type: "MD" as const, probability: 30 },
  { name: "Loyola Stritch SOM",              abbr: "LUC",   state: "IL", type: "MD" as const, probability: 29 },
  { name: "Cincinnati COM",                  abbr: "UC",    state: "OH", type: "MD" as const, probability: 31 },
  { name: "Vermont Larner COM",              abbr: "UVM",   state: "VT", type: "MD" as const, probability: 32 },
  { name: "Albany Medical College",          abbr: "AMC",   state: "NY", type: "MD" as const, probability: 38 },
  { name: "Jefferson Sidney Kimmel",         abbr: "SKMC",  state: "PA", type: "MD" as const, probability: 34 },
  { name: "Creighton SOM",                   abbr: "CRE",   state: "NE", type: "MD" as const, probability: 39 },
  { name: "Medical College of Wisconsin",    abbr: "MCW",   state: "WI", type: "MD" as const, probability: 36 },
  { name: "Drexel COM",                      abbr: "DU",    state: "PA", type: "MD" as const, probability: 42 },
  { name: "Florida International Herbert",  abbr: "FIU",   state: "FL", type: "MD" as const, probability: 33 },
  { name: "LSU SOM New Orleans",             abbr: "LSUNO", state: "LA", type: "MD" as const, probability: 40 },
  { name: "Arkansas COM",                    abbr: "UAMS",  state: "AR", type: "MD" as const, probability: 44 },
  { name: "South Carolina COM",              abbr: "MUSC",  state: "SC", type: "MD" as const, probability: 43 },
  { name: "Texas COM (TCOM)",                abbr: "TCOM",  state: "TX", type: "DO" as const, probability: 55 },
  { name: "AT Still SOMA",                   abbr: "ATSU",  state: "AZ", type: "DO" as const, probability: 58 },
  { name: "PCOM Georgia",                    abbr: "PCG",   state: "GA", type: "DO" as const, probability: 60 },
  { name: "Touro COM Middletown",            abbr: "TOU",   state: "NY", type: "DO" as const, probability: 62 },
  { name: "Des Moines University COM",       abbr: "DMU",   state: "IA", type: "DO" as const, probability: 59 },
  { name: "Midwestern Glendale COM",         abbr: "MWG",   state: "AZ", type: "DO" as const, probability: 61 },
  { name: "Chicago COM CCOM",                abbr: "CCOM",  state: "IL", type: "DO" as const, probability: 62 },
  { name: "NSU Kiran Patel COM",             abbr: "NSU",   state: "FL", type: "DO" as const, probability: 63 },
  { name: "LECOM Bradenton COM",             abbr: "LECOM", state: "FL", type: "DO" as const, probability: 67 },
  { name: "Pacific Northwest University",    abbr: "PNWU",  state: "WA", type: "DO" as const, probability: 68 },
];

// ── Default list ──────────────────────────────────────────────────────────────

const DEFAULT_LIST: ListSchool[] = [];

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_CFG = {
  Reach:  { color: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/10",    header: "bg-red-500/10",    dot: "bg-red-400"    },
  Target: { color: "text-[#BF5700]",  border: "border-[#BF5700]/30",  bg: "bg-[#BF5700]/10",  header: "bg-[#BF5700]/10",  dot: "bg-[#BF5700]"  },
  Safety: { color: "text-emerald-400",border: "border-emerald-500/30",bg: "bg-emerald-500/10",header: "bg-emerald-500/10",dot: "bg-emerald-400" },
} as const;

const TIERS: Tier[] = ["Reach", "Target", "Safety"];

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = "premed-my-list";

function loadList(): ListSchool[] {
  if (typeof window === "undefined") return DEFAULT_LIST;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ListSchool[]) : DEFAULT_LIST;
  } catch {
    return DEFAULT_LIST;
  }
}

function saveList(list: ListSchool[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

// ── Probability color ─────────────────────────────────────────────────────────

function probColor(p: number) {
  if (p >= 40) return "text-emerald-400";
  if (p >= 20) return "text-[#BF5700]";
  return "text-red-400";
}

// ── Sortable card ─────────────────────────────────────────────────────────────

function SchoolCard({
  school,
  onRemove,
  onNoteChange,
  isDragOverlay = false,
}: {
  school:        ListSchool;
  onRemove:      (id: string) => void;
  onNoteChange:  (id: string, notes: string) => void;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: school.id });

  const style = isDragOverlay
    ? {}
    : {
        transform:  CSS.Transform.toString(transform),
        transition,
        opacity:    isDragging ? 0.35 : 1,
      };

  const [editingNote, setEditingNote] = useState(false);
  const [noteVal,     setNoteVal]     = useState(school.notes);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const cfg     = TIER_CFG[school.tier];

  useEffect(() => {
    if (editingNote) noteRef.current?.focus();
  }, [editingNote]);

  function commitNote() {
    setEditingNote(false);
    onNoteChange(school.id, noteVal);
  }

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      className={`bg-[#0D1628] border rounded-xl p-4 flex flex-col gap-3 group transition-shadow ${
        isDragOverlay
          ? "shadow-2xl border-white/25 rotate-1 scale-105"
          : `${cfg.border} hover:border-white/20`
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {!isDragOverlay && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          >
            <GripVertical size={14} />
          </button>
        )}

        {/* Abbr badge */}
        <div className="w-8 h-8 rounded-md bg-white/[0.07] flex items-center justify-center shrink-0">
          <span className="text-[9px] font-mono font-bold text-white/40 tracking-wider">
            {school.abbr}
          </span>
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/85 truncate leading-snug">
            {school.name}
          </p>
          <p className="text-[11px] text-white/30 font-mono mt-0.5">
            {school.state} · {school.type}
          </p>
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(school.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
        >
          <X size={12} />
        </button>
      </div>

      {/* Probability */}
      <div className="flex items-center justify-between">
        <span className={`font-mono text-lg font-bold ${probColor(school.probability)}`}>
          {school.probability}%
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>
          {school.tier}
        </span>
      </div>

      {/* Notes */}
      <div className="relative">
        {editingNote ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              ref={noteRef}
              value={noteVal}
              onChange={(e) => setNoteVal(e.target.value)}
              onBlur={commitNote}
              rows={2}
              placeholder="Add notes…"
              className="w-full bg-white/[0.05] border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white/70 placeholder:text-white/20 resize-none outline-none focus:border-[#BF5700]/40 transition-colors"
            />
            <button
              onClick={commitNote}
              className="self-end flex items-center gap-1 text-[10px] text-[#BF5700] hover:underline"
            >
              <Check size={10} /> Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingNote(true)}
            className="w-full flex items-start gap-1.5 group/note"
          >
            <Pencil size={10} className="text-white/15 group-hover/note:text-white/35 mt-0.5 shrink-0 transition-colors" />
            <p className="text-xs text-left text-white/30 group-hover/note:text-white/50 transition-colors leading-relaxed line-clamp-2">
              {noteVal || "Add notes…"}
            </p>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add school dialog ─────────────────────────────────────────────────────────

function AddSchoolDialog({
  open,
  onClose,
  tier,
  existingIds,
  onAdd,
}: {
  open:        boolean;
  onClose:     () => void;
  tier:        Tier;
  existingIds: Set<string>;
  onAdd:       (school: Omit<ListSchool, "id" | "notes">) => void;
}) {
  const [query, setQuery] = useState("");

  const results = CATALOG.filter(
    (s) =>
      !existingIds.has(s.abbr) &&
      (s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.abbr.toLowerCase().includes(query.toLowerCase()) ||
        s.state.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 12);

  function handleAdd(s: typeof CATALOG[0]) {
    onAdd({ name: s.name, abbr: s.abbr, state: s.state, type: s.type, probability: s.probability, tier });
    onClose();
    setQuery("");
  }

  return (
    <Dialog open={open} onClose={() => { onClose(); setQuery(""); }} title={`Add to ${tier}`}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            autoFocus
            type="text"
            placeholder="Search by name, abbreviation, or state…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#BF5700]/40 transition-colors"
          />
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-white/25 text-center py-6">No schools found</p>
          ) : (
            results.map((s) => (
              <button
                key={s.abbr}
                onClick={() => handleAdd(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-md bg-white/[0.07] flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-mono font-bold text-white/40">{s.abbr}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{s.name}</p>
                  <p className="text-[11px] text-white/30 font-mono">{s.state} · {s.type}</p>
                </div>
                <span className={`font-mono text-sm font-semibold shrink-0 ${probColor(s.probability)}`}>
                  {s.probability}%
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ── Droppable column ──────────────────────────────────────────────────────────

function Column({
  tier,
  schools,
  onRemove,
  onNoteChange,
  onAdd,
  existingIds,
}: {
  tier:         Tier;
  schools:      ListSchool[];
  onRemove:     (id: string) => void;
  onNoteChange: (id: string, notes: string) => void;
  onAdd:        (school: Omit<ListSchool, "id" | "notes">) => void;
  existingIds:  Set<string>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const cfg = TIER_CFG[tier];

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${cfg.border} ${cfg.header}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className={`text-sm font-semibold ${cfg.color}`}>{tier}</span>
        </div>
        <span className={`font-mono text-xs px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          {schools.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={schools.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 min-h-[120px]">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              onRemove={onRemove}
              onNoteChange={onNoteChange}
            />
          ))}

          {schools.length === 0 && (
            <div className={`flex items-center justify-center h-20 rounded-xl border border-dashed ${cfg.border} border-opacity-50`}>
              <p className="text-xs text-white/20">Drop schools here</p>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Add button */}
      <button
        onClick={() => setDialogOpen(true)}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed ${cfg.border} text-xs ${cfg.color} hover:${cfg.bg} transition-colors opacity-60 hover:opacity-100`}
      >
        <Plus size={12} /> Add School
      </button>

      <AddSchoolDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tier={tier}
        existingIds={existingIds}
        onAdd={onAdd}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyListPage() {
  const [list,        setList]        = useState<ListSchool[]>([]);
  const [activeSchool,setActiveSchool]= useState<ListSchool | null>(null);
  const [hydrated,    setHydrated]    = useState(false);

  // Load from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    setList(loadList());
    setHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (hydrated) saveList(list);
  }, [list, hydrated]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const existingIds = new Set(list.map((s) => s.abbr));

  function handleRemove(id: string) {
    setList((prev) => prev.filter((s) => s.id !== id));
  }

  function handleNoteChange(id: string, notes: string) {
    setList((prev) => prev.map((s) => s.id === id ? { ...s, notes } : s));
  }

  function handleAdd(tier: Tier) {
    return (school: Omit<ListSchool, "id" | "notes">) => {
      const newSchool: ListSchool = {
        ...school,
        id:    `${school.abbr}-${Date.now()}`,
        notes: "",
        tier,
      };
      setList((prev) => [...prev, newSchool]);
    };
  }

  function handleDragStart(event: DragStartEvent) {
    const s = list.find((x) => x.id === event.active.id);
    setActiveSchool(s ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId   = over.id   as string;
    if (activeId === overId) return;

    const activeSchoolItem = list.find((s) => s.id === activeId);
    if (!activeSchoolItem) return;

    // Check if we're hovering over a tier column ID
    const overTier = TIERS.find((t) => t === overId);
    if (overTier) {
      setList((prev) =>
        prev.map((s) => s.id === activeId ? { ...s, tier: overTier } : s)
      );
      return;
    }

    // Hovering over another card
    const overSchool = list.find((s) => s.id === overId);
    if (!overSchool) return;

    if (activeSchoolItem.tier !== overSchool.tier) {
      setList((prev) =>
        prev.map((s) => s.id === activeId ? { ...s, tier: overSchool.tier } : s)
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveSchool(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId   = over.id   as string;
    if (activeId === overId) return;

    setList((prev) => {
      const oldIdx = prev.findIndex((s) => s.id === activeId);
      const newIdx = prev.findIndex((s) => s.id === overId);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  const byTier = (tier: Tier) => list.filter((s) => s.tier === tier);

  const totalReach  = byTier("Reach").length;
  const totalTarget = byTier("Target").length;
  const totalSafety = byTier("Safety").length;

  if (!hydrated) return null; // avoid SSR/hydration mismatch with localStorage

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My School List</h1>
          <p className="text-sm text-white/35 mt-0.5">
            Drag cards between columns to re-tier. Click the pencil to add notes.
          </p>
        </div>

        {/* Summary */}
        <div className="flex gap-2 shrink-0">
          {([["Reach", totalReach, "text-red-400", "border-red-500/25"], ["Target", totalTarget, "text-[#BF5700]", "border-[#BF5700]/25"], ["Safety", totalSafety, "text-emerald-400", "border-emerald-500/25"]] as const).map(
            ([label, count, color, border]) => (
              <div key={label} className={`px-3 py-1.5 rounded-lg border ${border} bg-white/[0.04] text-center min-w-[56px]`}>
                <p className={`font-mono text-lg font-bold ${color}`}>{count}</p>
                <p className="text-[10px] text-white/30">{label}</p>
              </div>
            )
          )}
          <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-center min-w-[56px]">
            <p className="font-mono text-lg font-bold text-white">{list.length}</p>
            <p className="text-[10px] text-white/30">Total</p>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <Column
              key={tier}
              tier={tier}
              schools={byTier(tier)}
              onRemove={handleRemove}
              onNoteChange={handleNoteChange}
              onAdd={handleAdd(tier)}
              existingIds={existingIds}
            />
          ))}
        </div>

        {/* Drag overlay — floats above everything while dragging */}
        <DragOverlay>
          {activeSchool && (
            <SchoolCard
              school={activeSchool}
              onRemove={() => {}}
              onNoteChange={() => {}}
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      <p className="text-[11px] text-white/15 text-center font-mono pb-2">
        Saved to browser storage · Connect Supabase to sync across devices
      </p>
    </div>
  );
}
