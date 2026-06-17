// Next-best-action — the single most important move for one contact, right now.
//
// A lead score tells a founder *who* is hot. It does not tell them *what to do*.
// This turns a contact's signals (status, contactability, recency, intent tags)
// into one plain-language next move with an urgency, so every row in the CRM can
// answer the only question that matters: "who do I act on next, and how?"
//
// Pure and side-effect free so it's trivially unit-testable; `now` is injectable
// for recency tests. Mirrors the signal model of `lead-scoring.ts`.

export type ActionUrgency = "now" | "soon" | "later" | "won" | "none";

export interface NextActionInput {
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  tags?: string[] | null;
  last_contacted_at?: string | null;
}

export interface NextAction {
  /** Short imperative the founder can act on, e.g. "Send the intro email". */
  label: string;
  /** Plain, 5th-grade reason the move matters now. */
  reason: string;
  urgency: ActionUrgency;
}

// Lower rank = more urgent. Used to sort "act on these first".
const URGENCY_RANK: Record<ActionUrgency, number> = {
  now: 0,
  soon: 1,
  later: 2,
  won: 3,
  none: 4,
};

export function urgencyRank(u: ActionUrgency): number {
  return URGENCY_RANK[u];
}

// Tags that signal buying intent — mirror of lead-scoring's HIGH_INTENT_TAGS.
const HIGH_INTENT_TAGS = new Set(["hot", "ready", "demo", "trial", "quote", "proposal"]);

const DAY = 86_400_000;

/** Whole days since a timestamp, or null if there is none / it's unparseable. */
function daysSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / DAY);
}

/**
 * The one move to make next for a contact. Rules are ordered by priority;
 * the first match wins, so the most valuable / most urgent move surfaces.
 */
export function nextBestAction(input: NextActionInput, now: Date = new Date()): NextAction {
  const status = (input.status ?? "new").toLowerCase();
  const hasEmail = !!input.email;
  const hasPhone = !!input.phone;
  const reachable = hasEmail || hasPhone;
  const tags = input.tags ?? [];
  const highIntent = tags.some((t) => HIGH_INTENT_TAGS.has(t.toLowerCase()));
  const sinceContact = daysSince(input.last_contacted_at, now);

  // 1. Terminal states — no chasing.
  if (status === "archived")
    return {
      label: "Leave it",
      reason: "This contact is archived. Spend your time on live leads instead.",
      urgency: "none",
    };
  if (status === "won" || status === "closed")
    return {
      label: "Ask for a referral",
      reason: "You won them. Ask for a referral or a testimonial while they're happy.",
      urgency: "won",
    };
  if (status === "lost")
    return {
      label: "Move on",
      reason: "This one didn't close. Add a fresh lead instead of chasing it.",
      urgency: "none",
    };

  // 2. Can't reach them — finding contact info is the only move that unblocks the rest.
  if (!reachable)
    return {
      label: "Find their email or phone",
      reason: "You have no way to reach this person yet. Add an email or phone first.",
      urgency: highIntent || status === "qualified" || status === "engaged" ? "now" : "soon",
    };

  // 3. Buying signals — strike while it's hot, unless you just spoke to them.
  if (highIntent && (sinceContact === null || sinceContact >= 2))
    return {
      label: "Reach out today",
      reason: "They're showing buying signals. Contact them today before the moment passes.",
      urgency: "now",
    };

  // 4. Qualified / engaged — these are your warmest, push them toward a yes.
  if (status === "qualified" || status === "engaged") {
    if (sinceContact !== null && sinceContact < 3)
      return {
        label: "Keep the momentum",
        reason: "You spoke recently and they're warm. Send the next step you promised.",
        urgency: "soon",
      };
    return {
      label: status === "engaged" ? "Send the proposal" : "Book the call",
      reason: "They're qualified and warm. Move them to the next step now.",
      urgency: "now",
    };
  }

  // 5. Brand-new lead — make first contact.
  if (status === "new")
    return {
      label: "Send the intro",
      reason: "New lead. Make first contact today — fresh leads reply the most.",
      urgency: "now",
    };

  // 6. Contacted — cadence depends on how long they've gone quiet.
  if (status === "contacted") {
    if (sinceContact === null)
      return {
        label: "Log when you reached out",
        reason:
          "Marked contacted but with no date. Add when you last spoke so follow-ups stay on track.",
        urgency: "soon",
      };
    if (sinceContact >= 7)
      return {
        label: "Send the follow-up",
        reason: `It's been ${sinceContact} days with no reply. Send a short follow-up now.`,
        urgency: "now",
      };
    if (sinceContact >= 3)
      return {
        label: "Follow up soon",
        reason: `${sinceContact} days since you spoke. A nudge in the next day or two keeps it alive.`,
        urgency: "soon",
      };
    return {
      label: "Give it a day or two",
      reason: "You just reached out. Give them a little time before nudging again.",
      urgency: "later",
    };
  }

  // 7. Nurture — keep them warm with value, no pressure.
  if (status === "nurture")
    return {
      label: "Share something useful",
      reason: "Not ready to buy. Send a helpful tip to stay top of mind.",
      urgency: "later",
    };

  // 8. Cold — one more try with a different angle.
  if (status === "cold")
    return {
      label: "Try a new angle",
      reason: "They went quiet. Try one message with a different hook before letting go.",
      urgency: "soon",
    };

  // 9. Anything else — just reach out.
  return {
    label: "Reach out",
    reason: "Make contact and learn where they stand.",
    urgency: "soon",
  };
}

/** Sort comparator: most urgent / most valuable next action first. */
export function compareByNextAction(
  a: NextActionInput,
  b: NextActionInput,
  now: Date = new Date(),
): number {
  return urgencyRank(nextBestAction(a, now).urgency) - urgencyRank(nextBestAction(b, now).urgency);
}
