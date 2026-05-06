import {
  Sparkles, Target, Magnet, MessageSquareText, GitBranch,
  ScrollText, FileEdit, FileSignature, Repeat, Bot,
} from "lucide-react";

export interface LaunchPadTool {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "ready" | "beta";
}

export const LAUNCHPAD_TOOLS: LaunchPadTool[] = [
  { slug: "offer-builder",     name: "Offer Builder",         description: "Turn your service into a high-converting offer in minutes.", icon: Sparkles, status: "ready" },
  { slug: "icp-finder",        name: "ICP Finder",            description: "Define the exact customer worth chasing.",                  icon: Target, status: "ready" },
  { slug: "lead-magnet",       name: "Lead Magnet Generator", description: "Spin up assets that capture qualified leads.",              icon: Magnet, status: "ready" },
  { slug: "outreach-writer",   name: "Outreach Writer",       description: "Write cold emails and DMs that get replies.",               icon: MessageSquareText, status: "ready" },
  { slug: "funnel-planner",    name: "Funnel Planner",        description: "Map a funnel that actually converts.",                       icon: GitBranch, status: "ready" },
  { slug: "sales-script",      name: "Sales Script Builder",  description: "Close calls with a script tuned to your offer.",            icon: ScrollText, status: "ready" },
  { slug: "content-engine",    name: "Content Engine",        description: "Produce a week of content from one prompt.",                icon: FileEdit, status: "ready" },
  { slug: "proposal-generator",name: "Proposal Generator",    description: "Send proposals that get signed faster.",                    icon: FileSignature, status: "ready" },
  { slug: "follow-up",         name: "Follow-Up Assistant",   description: "Never lose a deal to silence again.",                       icon: Repeat, status: "ready" },
  { slug: "founder-copilot",   name: "Founder Copilot",       description: "Your operator AI for daily decisions.",                     icon: Bot, status: "beta" },
];

export interface NovaSystem {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trigger: string;
  action: string;
  output: string;
}

import { Inbox, CalendarCheck, MessageCircleHeart, Star, Rewind, Workflow } from "lucide-react";

export const NOVA_SYSTEMS: NovaSystem[] = [
  { slug: "lead-capture",     name: "Lead Capture System",       description: "Convert traffic into qualified leads on autopilot.",     icon: Inbox,            trigger: "Form / ad / DM", action: "Score + route lead", output: "CRM record + alert" },
  { slug: "appointment",      name: "Appointment Booking System",description: "Fill your calendar without manual back-and-forth.",      icon: CalendarCheck,    trigger: "Lead booked",     action: "Confirm + remind",   output: "Show-up call" },
  { slug: "crm-followup",     name: "CRM Follow-Up System",      description: "Move every deal forward — automatically.",               icon: MessageCircleHeart,trigger: "Stage change",   action: "Personalized nudge", output: "Reply / close" },
  { slug: "review-gen",       name: "Review Generation System",  description: "Turn happy customers into 5-star social proof.",         icon: Star,             trigger: "Job complete",    action: "Request review",     output: "Public review" },
  { slug: "reengagement",     name: "Re-Engagement System",      description: "Win back cold leads and dormant clients.",               icon: Rewind,           trigger: "Inactivity",      action: "Multi-touch sequence", output: "Reactivated lead" },
  { slug: "internal-ops",     name: "Internal Ops Assistant",    description: "Run your back office with a single AI agent.",           icon: Workflow,         trigger: "Slack / email",   action: "Execute task",       output: "Done + logged" },
];
