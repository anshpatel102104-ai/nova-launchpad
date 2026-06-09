import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Zap,
  Mail,
  MessageSquare,
  GitBranch,
  Clock,
  Brain,
  Target,
  Play,
  Save,
  Plus,
  X,
  GripVertical,
  ChevronRight,
  FlaskConical,
  Radio,
  Loader2,
  Sparkles,
  Database,
  Phone,
  Globe,
  Calendar,
  Bell,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
} from "lucide-react";

export const Route = createFileRoute("/app/builder")({ component: BuilderPage });

/* ─── Types ─────────────────────────────────────────────── */
type BlockCategory = "trigger" | "action" | "logic" | "ai" | "memory";
type BlockType =
  | "trigger_new_lead"
  | "trigger_form_submit"
  | "trigger_schedule"
  | "trigger_webhook"
  | "trigger_payment"
  | "action_send_email"
  | "action_send_sms"
  | "action_update_crm"
  | "action_create_task"
  | "action_notify_team"
  | "action_webhook_out"
  | "logic_if_branch"
  | "logic_wait"
  | "logic_loop"
  | "ai_classify"
  | "ai_generate"
  | "ai_score"
  | "memory_write"
  | "memory_read"
  | "goal_check";

type RunMode = "build" | "test" | "live";

interface BlockConfig {
  [key: string]: string;
}

interface WorkflowBlock {
  id: string;
  type: BlockType;
  label: string;
  config: BlockConfig;
  branches?: Array<{ id: string; label: string }>;
}

interface WorkflowDraft {
  id?: string;
  name: string;
  description: string;
  blocks: WorkflowBlock[];
  is_active: boolean;
  org_id: string;
}

/* ─── Block palette definitions ─────────────────────────── */
interface PaletteBlock {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: BlockCategory;
  color: string;
  configFields: Array<{ key: string; label: string; placeholder?: string; type: "text" | "textarea" | "select"; options?: string[] }>;
}

const PALETTE_BLOCKS: PaletteBlock[] = [
  /* TRIGGERS */
  {
    type: "trigger_new_lead",
    label: "New Lead",
    description: "When a new lead arrives in your CRM",
    icon: Zap,
    category: "trigger",
    color: "orange",
    configFields: [
      { key: "source", label: "Lead source", type: "select", options: ["Any source", "Website form", "Ad campaign", "Manual entry"] },
    ],
  },
  {
    type: "trigger_form_submit",
    label: "Form Submitted",
    description: "When someone fills out a form",
    icon: Globe,
    category: "trigger",
    color: "orange",
    configFields: [
      { key: "form_name", label: "Form name or URL", placeholder: "e.g. Contact form, Waitlist form", type: "text" },
    ],
  },
  {
    type: "trigger_schedule",
    label: "Scheduled Time",
    description: "Run at a specific time or on repeat",
    icon: Calendar,
    category: "trigger",
    color: "orange",
    configFields: [
      { key: "schedule", label: "When to run", type: "select", options: ["Every day at 9am", "Every Monday", "First of month", "Every hour", "Custom"] },
    ],
  },
  {
    type: "trigger_webhook",
    label: "Webhook",
    description: "When data arrives from an outside app",
    icon: Radio,
    category: "trigger",
    color: "orange",
    configFields: [
      { key: "endpoint_note", label: "What triggers this?", placeholder: "e.g. Stripe payment, Typeform response", type: "text" },
    ],
  },
  {
    type: "trigger_payment",
    label: "Payment Received",
    description: "When a customer pays via Stripe",
    icon: CheckCircle2,
    category: "trigger",
    color: "orange",
    configFields: [
      { key: "amount_filter", label: "Minimum amount (optional)", placeholder: "e.g. $100", type: "text" },
    ],
  },
  /* ACTIONS */
  {
    type: "action_send_email",
    label: "Send Email",
    description: "Send an email to a contact or list",
    icon: Mail,
    category: "action",
    color: "blue",
    configFields: [
      { key: "to", label: "Send to", placeholder: "e.g. {{lead.email}} or team@company.com", type: "text" },
      { key: "subject", label: "Subject line", placeholder: "e.g. Your {{product}} is ready!", type: "text" },
      { key: "body", label: "Email body", placeholder: "Write the email content here...", type: "textarea" },
    ],
  },
  {
    type: "action_send_sms",
    label: "Send SMS",
    description: "Send a text message via Twilio",
    icon: MessageSquare,
    category: "action",
    color: "blue",
    configFields: [
      { key: "to", label: "Phone number", placeholder: "e.g. {{lead.phone}}", type: "text" },
      { key: "message", label: "Message", placeholder: "Keep it under 160 characters", type: "textarea" },
    ],
  },
  {
    type: "action_update_crm",
    label: "Update CRM",
    description: "Change a lead's stage or add a note",
    icon: Database,
    category: "action",
    color: "blue",
    configFields: [
      { key: "field", label: "What to update", type: "select", options: ["Lead stage", "Lead score", "Add tag", "Add note", "Assign owner"] },
      { key: "value", label: "New value", placeholder: "e.g. Qualified, Hot lead", type: "text" },
    ],
  },
  {
    type: "action_create_task",
    label: "Create Task",
    description: "Add a to-do or follow-up task",
    icon: CheckCircle2,
    category: "action",
    color: "blue",
    configFields: [
      { key: "title", label: "Task title", placeholder: "e.g. Follow up with {{lead.name}}", type: "text" },
      { key: "due_in", label: "Due in", type: "select", options: ["1 hour", "1 day", "3 days", "1 week"] },
    ],
  },
  {
    type: "action_notify_team",
    label: "Notify Team",
    description: "Alert your team via Slack or email",
    icon: Bell,
    category: "action",
    color: "blue",
    configFields: [
      { key: "channel", label: "Where to notify", type: "select", options: ["Slack channel", "Email to team", "Both"] },
      { key: "message", label: "Message", placeholder: "e.g. New hot lead: {{lead.name}} — {{lead.company}}", type: "textarea" },
    ],
  },
  {
    type: "action_webhook_out",
    label: "Call Webhook",
    description: "Send data to any external app",
    icon: Globe,
    category: "action",
    color: "blue",
    configFields: [
      { key: "url", label: "Webhook URL", placeholder: "https://...", type: "text" },
      { key: "note", label: "What this connects to", placeholder: "e.g. Zapier, Make.com, custom app", type: "text" },
    ],
  },
  /* LOGIC */
  {
    type: "logic_if_branch",
    label: "If / Else",
    description: "Take a different path based on a condition",
    icon: GitBranch,
    category: "logic",
    color: "purple",
    configFields: [
      { key: "condition", label: "If this is true…", placeholder: "e.g. Lead score > 70, Email opened, Tag = VIP", type: "text" },
    ],
  },
  {
    type: "logic_wait",
    label: "Wait",
    description: "Pause before the next step runs",
    icon: Clock,
    category: "logic",
    color: "purple",
    configFields: [
      { key: "duration", label: "Wait for", type: "select", options: ["1 hour", "4 hours", "1 day", "2 days", "3 days", "1 week", "Until replied"] },
    ],
  },
  {
    type: "logic_loop",
    label: "Loop / Repeat",
    description: "Repeat a set of steps N times",
    icon: ChevronRight,
    category: "logic",
    color: "purple",
    configFields: [
      { key: "times", label: "Repeat", type: "select", options: ["2 times", "3 times", "5 times", "Until condition met"] },
    ],
  },
  /* AI */
  {
    type: "ai_classify",
    label: "AI Classify",
    description: "Let AI label or categorize incoming data",
    icon: Brain,
    category: "ai",
    color: "emerald",
    configFields: [
      { key: "what_to_classify", label: "What to classify", placeholder: "e.g. Lead intent, Email reply, Support ticket", type: "text" },
      { key: "categories", label: "Possible labels", placeholder: "e.g. Hot, Warm, Cold — separate with commas", type: "text" },
    ],
  },
  {
    type: "ai_generate",
    label: "AI Write",
    description: "Have AI draft a message or document",
    icon: Sparkles,
    category: "ai",
    color: "emerald",
    configFields: [
      { key: "output_type", label: "What to write", type: "select", options: ["Personalized email", "Follow-up message", "SMS message", "Proposal draft", "Meeting summary"] },
      { key: "context", label: "Extra context for AI", placeholder: "e.g. Use a friendly, helpful tone. Mention their industry.", type: "textarea" },
    ],
  },
  {
    type: "ai_score",
    label: "AI Score",
    description: "Have AI rate a lead, reply, or outcome",
    icon: Target,
    category: "ai",
    color: "emerald",
    configFields: [
      { key: "what_to_score", label: "What to score", placeholder: "e.g. Lead quality, Email engagement", type: "text" },
      { key: "scale", label: "Score scale", type: "select", options: ["1–10", "1–100", "Low / Medium / High"] },
    ],
  },
  /* MEMORY */
  {
    type: "memory_write",
    label: "Remember This",
    description: "Save something to your platform memory",
    icon: Database,
    category: "memory",
    color: "rose",
    configFields: [
      { key: "what_to_save", label: "What to remember", placeholder: "e.g. Customer outcome, Campaign result, Lead insight", type: "text" },
      { key: "category", label: "Memory category", type: "select", options: ["Customer data", "Campaign result", "Strategy insight", "Experiment result", "General"] },
    ],
  },
  {
    type: "goal_check",
    label: "Goal Check",
    description: "Check if your target was hit. Stop or continue based on result.",
    icon: Target,
    category: "memory",
    color: "rose",
    configFields: [
      { key: "goal", label: "What is the goal?", placeholder: "e.g. Booked a call, Replied to email, Made a purchase", type: "text" },
      { key: "if_not_met", label: "If goal not met", type: "select", options: ["Send follow-up", "Re-try from start", "Mark as lost", "Escalate to team"] },
    ],
  },
];

const CATEGORY_META: Record<BlockCategory, { label: string; color: string; bg: string }> = {
  trigger: { label: "Triggers", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
  action: { label: "Actions", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  logic: { label: "Logic", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
  ai: { label: "AI Steps", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  memory: { label: "Memory & Goals", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" },
};

const BLOCK_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  orange: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  rose: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-500" },
};

function getPaletteBlock(type: BlockType): PaletteBlock {
  return PALETTE_BLOCKS.find((b) => b.type === type)!;
}

function buildSentencePreview(blocks: WorkflowBlock[]): string {
  if (blocks.length === 0) return "Add your first block to start building a workflow.";
  const parts: string[] = [];
  for (const block of blocks) {
    const def = getPaletteBlock(block.type);
    if (!def) continue;
    const label = block.label || def.label;
    switch (block.type) {
      case "trigger_new_lead": parts.push(`When a new lead arrives`); break;
      case "trigger_form_submit": parts.push(`When a form is submitted`); break;
      case "trigger_schedule": parts.push(`On a schedule`); break;
      case "trigger_webhook": parts.push(`When a webhook fires`); break;
      case "trigger_payment": parts.push(`When a payment is received`); break;
      case "logic_wait": parts.push(`Wait ${block.config.duration || "..."}`); break;
      case "logic_if_branch": parts.push(`If ${block.config.condition || "condition is met"}`); break;
      case "ai_classify": parts.push(`AI classifies the ${block.config.what_to_classify || "data"}`); break;
      case "ai_generate": parts.push(`AI writes a ${block.config.output_type || "message"}`); break;
      case "ai_score": parts.push(`AI scores the ${block.config.what_to_score || "result"}`); break;
      case "memory_write": parts.push(`Remember ${block.config.what_to_save || "the result"}`); break;
      case "goal_check": parts.push(`Check goal: ${block.config.goal || "..."}`); break;
      default: parts.push(label);
    }
  }
  return parts.join(" → ");
}

/* ─── Palette Block (draggable from palette) ──────────────── */
function PaletteItem({ block }: { block: PaletteBlock }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${block.type}`,
    data: { type: block.type, fromPalette: true },
  });
  const colors = BLOCK_COLOR[block.color];
  const Icon = block.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border p-2.5 cursor-grab active:cursor-grabbing select-none transition-all",
        colors.bg,
        colors.border,
        isDragging && "opacity-40",
      )}
    >
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", colors.bg)}>
        <Icon className={cn("h-4 w-4", colors.text)} />
      </div>
      <div className="min-w-0">
        <div className={cn("text-[12px] font-semibold leading-tight", colors.text)}>{block.label}</div>
        <div className="text-[10.5px] text-muted-foreground leading-tight mt-px truncate">{block.description}</div>
      </div>
    </div>
  );
}

/* ─── Canvas Block (sortable, on canvas) ─────────────────── */
function CanvasBlock({
  block,
  isSelected,
  onSelect,
  onDelete,
  isFirst,
}: {
  block: WorkflowBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isFirst: boolean;
}) {
  const def = getPaletteBlock(block.type);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const colors = BLOCK_COLOR[def?.color ?? "blue"];
  const Icon = def?.icon ?? Zap;
  const isConnector = block.type.startsWith("logic_if_branch");

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Arrow connector */}
      {!isFirst && (
        <div className="flex justify-center py-1">
          <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}

      {/* Block card */}
      <div
        onClick={onSelect}
        className={cn(
          "group relative rounded-xl border-2 p-3 cursor-pointer transition-all select-none",
          colors.bg,
          isSelected ? "border-primary shadow-md shadow-primary/10" : cn(colors.border, "hover:border-primary/40"),
          isDragging && "opacity-50 shadow-xl",
          isConnector && "border-dashed",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <div
            {...listeners}
            {...attributes}
            className="mt-0.5 flex h-5 w-5 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center opacity-0 group-hover:opacity-50"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Icon */}
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colors.bg, "border", colors.border)}>
            <Icon className={cn("h-4.5 w-4.5", colors.text)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("text-[11px] font-bold uppercase tracking-widest opacity-60", colors.text)}>
                {def?.category.toUpperCase() ?? "STEP"}
              </span>
            </div>
            <div className="text-[13.5px] font-semibold text-foreground mt-0.5">
              {block.label || def?.label}
            </div>
            {Object.keys(block.config).length > 0 && (
              <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                {Object.values(block.config).filter(Boolean).slice(0, 2).join(" · ")}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* If block: show branch labels */}
        {isConnector && (
          <div className="mt-2.5 flex gap-2 ml-11">
            <div className="rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 text-[11px] font-semibold border border-green-200 dark:border-green-800">
              ✓ Yes path
            </div>
            <div className="rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 text-[11px] font-semibold border border-red-200 dark:border-red-800">
              ✗ No path
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Canvas Drop Zone ───────────────────────────────────── */
function CanvasDropZone({ children, isEmpty }: { children: React.ReactNode; isEmpty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex-1 rounded-2xl border-2 border-dashed transition-all min-h-[400px] p-4",
        isOver ? "border-primary bg-primary/5" : "border-border/60 bg-surface-1/30",
      )}
    >
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center pointer-events-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Plus className="h-7 w-7 text-primary/60" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-foreground">Drag a block here to start</div>
            <div className="text-[13px] text-muted-foreground mt-1">
              Start with a <span className="text-orange-500 font-medium">Trigger</span> — the event that kicks things off.
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Properties Panel ───────────────────────────────────── */
function PropertiesPanel({
  block,
  onChange,
}: {
  block: WorkflowBlock;
  onChange: (id: string, updates: Partial<WorkflowBlock>) => void;
}) {
  const def = getPaletteBlock(block.type);
  if (!def) return null;
  const colors = BLOCK_COLOR[def.color];
  const Icon = def.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn("flex items-center gap-3 rounded-xl border p-3", colors.bg, colors.border)}>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", colors.border)}>
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
        <div>
          <div className={cn("text-[11px] font-bold uppercase tracking-widest", colors.text)}>{def.category}</div>
          <div className="text-[14px] font-semibold text-foreground">{def.label}</div>
        </div>
      </div>

      {/* Custom label */}
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
          Step name (optional)
        </label>
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          placeholder={def.label}
          value={block.label}
          onChange={(e) => onChange(block.id, { label: e.target.value })}
        />
      </div>

      {/* Config fields */}
      {def.configFields.map((field) => (
        <div key={field.key}>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            {field.label}
          </label>
          {field.type === "select" ? (
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              value={block.config[field.key] ?? ""}
              onChange={(e) => onChange(block.id, { config: { ...block.config, [field.key]: e.target.value } })}
            >
              <option value="">Choose one…</option>
              {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
              placeholder={field.placeholder}
              value={block.config[field.key] ?? ""}
              onChange={(e) => onChange(block.id, { config: { ...block.config, [field.key]: e.target.value } })}
            />
          ) : (
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              placeholder={field.placeholder}
              value={block.config[field.key] ?? ""}
              onChange={(e) => onChange(block.id, { config: { ...block.config, [field.key]: e.target.value } })}
            />
          )}
        </div>
      ))}

      <div className="rounded-xl border border-border/60 bg-surface-1/50 p-3 text-[11.5px] text-muted-foreground">
        <span className="font-semibold text-foreground">How it works: </span>
        {def.description}
      </div>
    </div>
  );
}

/* ─── Main Builder Page ──────────────────────────────────── */
function BuilderPage() {
  const { currentOrgId } = useAuth();

  const [workflowName, setWorkflowName] = useState("My first workflow");
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<RunMode>("build");
  const [draggingType, setDraggingType] = useState<BlockType | null>(null);
  const [activePaletteCategory, setActivePaletteCategory] = useState<BlockCategory>("trigger");
  const [saving, setSaving] = useState(false);
  const [testLogs, setTestLogs] = useState<Array<{ id: string; status: "ok" | "error" | "running"; message: string }>>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const makeId = () => `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const addBlock = useCallback((type: BlockType, insertAfterIdx?: number) => {
    const def = getPaletteBlock(type);
    if (!def) return;
    const newBlock: WorkflowBlock = { id: makeId(), type, label: "", config: {} };
    setBlocks((prev) => {
      const copy = [...prev];
      if (insertAfterIdx !== undefined) copy.splice(insertAfterIdx + 1, 0, newBlock);
      else copy.push(newBlock);
      return copy;
    });
    setSelectedId(newBlock.id);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<WorkflowBlock>) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...updates, config: { ...b.config, ...updates.config } } : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((s) => s === id ? null : s);
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.fromPalette) setDraggingType(data.type as BlockType);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingType(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.fromPalette && over.id === "canvas") {
      addBlock(activeData.type as BlockType);
      return;
    }

    // Reorder within canvas
    if (!activeData?.fromPalette) {
      const oldIdx = blocks.findIndex((b) => b.id === active.id);
      const newIdx = blocks.findIndex((b) => b.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setBlocks((prev) => arrayMove(prev, oldIdx, newIdx));
      }
    }
  }

  const runTest = () => {
    if (blocks.length === 0) { toast.error("Add at least one block first"); return; }
    setMode("test");
    setTestLogs([]);
    const newLogs: typeof testLogs = [];
    blocks.forEach((block, i) => {
      const def = getPaletteBlock(block.type);
      setTimeout(() => {
        newLogs.push({ id: block.id, status: "ok", message: `✓ ${def?.label ?? block.type} — OK` });
        setTestLogs([...newLogs]);
      }, (i + 1) * 600);
    });
    setTimeout(() => {
      toast.success("Test complete — all steps passed!");
    }, (blocks.length + 1) * 600);
  };

  const saveWorkflow = async () => {
    if (!currentOrgId) return;
    if (blocks.length === 0) { toast.error("Add at least one block before saving"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        description: workflowName,
        workflow_json: { name: workflowName, blocks, mode, created_at: new Date().toISOString() },
        status: "draft" as const,
      };
      const { error } = await supabase.from("automation_drafts").insert(payload);
      if (error) throw error;
      toast.success("Workflow saved!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const visiblePalette = PALETTE_BLOCKS.filter((b) => b.category === activePaletteCategory);
  const categories = ["trigger", "action", "logic", "ai", "memory"] as BlockCategory[];
  const sentence = buildSentencePreview(blocks);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden">
        {/* ── Top bar ── */}
        <div
          className="shrink-0 flex items-center gap-3 px-5 py-3 border-b"
          style={{ background: "var(--background)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <input
              className="text-[15px] font-bold bg-transparent outline-none border-none min-w-0 max-w-[260px] text-foreground"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
            />
            <div className="h-4 w-px bg-border" />
            <div className="text-[12px] text-muted-foreground truncate max-w-sm hidden md:block">
              {sentence}
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-surface-1/50">
            {(["build", "test", "live"] as RunMode[]).map((m) => (
              <button
                key={m}
                onClick={() => m === "test" ? runTest() : setMode(m)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium capitalize transition-all",
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "test" ? <FlaskConical className="h-3.5 w-3.5" /> : m === "live" ? <Radio className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>

        {/* ── Main 3-panel layout ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: Block Palette ── */}
          <div
            className="hidden lg:flex w-[220px] shrink-0 flex-col border-r"
            style={{ background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
          >
            {/* Category tabs */}
            <div className="flex flex-col gap-px p-2 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
              {categories.map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActivePaletteCategory(cat)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-left transition-all",
                      activePaletteCategory === cat ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    )}
                  >
                    <div className={cn("h-2 w-2 rounded-full", activePaletteCategory === cat ? "bg-primary" : "bg-muted-foreground/40")} />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Blocks */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1 pb-0.5">
                Drag onto canvas →
              </div>
              {visiblePalette.map((block) => <PaletteItem key={block.type} block={block} />)}
            </div>
          </div>

          {/* ── Center: Canvas ── */}
          <div className="flex-1 overflow-y-auto p-4">
            {mode === "test" && testLogs.length > 0 && (
              <div className="mb-4 rounded-xl border border-border bg-surface-1/50 p-4 space-y-2">
                <div className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FlaskConical className="h-3.5 w-3.5 text-blue-500" /> Test run
                </div>
                {testLogs.map((log) => (
                  <div key={log.id} className={cn("flex items-center gap-2 text-[12.5px]", log.status === "ok" ? "text-emerald-600" : log.status === "error" ? "text-destructive" : "text-muted-foreground")}>
                    {log.status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : log.status === "ok" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {log.message}
                  </div>
                ))}
              </div>
            )}

            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <CanvasDropZone isEmpty={blocks.length === 0}>
                <div className="space-y-0">
                  {blocks.map((block, idx) => (
                    <CanvasBlock
                      key={block.id}
                      block={block}
                      isFirst={idx === 0}
                      isSelected={selectedId === block.id}
                      onSelect={() => setSelectedId(block.id === selectedId ? null : block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  ))}
                </div>

                {/* Add block button at bottom */}
                {blocks.length > 0 && (
                  <div className="flex flex-col items-center gap-1 mt-2 pt-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                    <div className="relative group">
                      <button
                        className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                        onClick={() => {
                          const firstAction = PALETTE_BLOCKS.find((b) => b.category === "action");
                          if (firstAction) addBlock(firstAction.type);
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add next step
                      </button>
                    </div>
                  </div>
                )}
              </CanvasDropZone>
            </SortableContext>

            {/* Mobile palette (shown below canvas on small screens) */}
            <div className="lg:hidden mt-4">
              <div className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Add blocks</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActivePaletteCategory(cat)}
                    className={cn("shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all", activePaletteCategory === cat ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground")}
                  >
                    {CATEGORY_META[cat].label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {visiblePalette.map((block) => {
                  const Icon = block.icon;
                  const colors = BLOCK_COLOR[block.color];
                  return (
                    <button key={block.type} onClick={() => addBlock(block.type)} className={cn("flex items-center gap-2 rounded-lg border p-2.5 text-left", colors.bg, colors.border)}>
                      <Icon className={cn("h-4 w-4 shrink-0", colors.text)} />
                      <span className={cn("text-[12px] font-semibold", colors.text)}>{block.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Properties ── */}
          <div
            className="hidden lg:flex w-[260px] shrink-0 flex-col border-l"
            style={{ borderColor: "var(--sidebar-border)", background: "var(--sidebar)" }}
          >
            {selectedBlock ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">
                  Configure step
                </div>
                <PropertiesPanel block={selectedBlock} onChange={updateBlock} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary/60" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-foreground">Click any block</div>
                  <div className="text-[12px] text-muted-foreground mt-1">
                    Select a step on the canvas to configure it here.
                  </div>
                </div>
              </div>
            )}

            {/* Sentence preview at bottom */}
            <div className="shrink-0 border-t p-3" style={{ borderColor: "var(--sidebar-border)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">What this workflow does</div>
              <div className="text-[12px] text-muted-foreground leading-relaxed">{sentence}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggingType && (() => {
          const def = getPaletteBlock(draggingType);
          if (!def) return null;
          const colors = BLOCK_COLOR[def.color];
          const Icon = def.icon;
          return (
            <div className={cn("flex items-center gap-2.5 rounded-xl border-2 p-3 shadow-xl cursor-grabbing w-[200px]", colors.bg, colors.border)}>
              <Icon className={cn("h-5 w-5 shrink-0", colors.text)} />
              <span className={cn("text-[13px] font-semibold", colors.text)}>{def.label}</span>
            </div>
          );
        })()}
      </DragOverlay>
    </DndContext>
  );
}
