import { createHash } from "node:crypto";

export type PlanStep = { id: string; title: string; acceptance: string; phase: string };
export type StepInput = { title: string; acceptance: string; phase?: string };
export type ReviewStep = { title: string; acceptance: string; status: "todo" | "doing" | "review"; evidence?: string };

const defaults: StepInput[] = [
  { phase: "Discovery", title: "Establish the source of truth", acceptance: "Record project identity, existing artifacts, tools, constraints and unknowns." },
  { phase: "Scope", title: "Define the target and limits", acceptance: "Record user-visible outcome, acceptance tests, budget, security and approval gates." },
  { phase: "Design", title: "Design the smallest safe solution", acceptance: "Document workflow, interfaces, alternatives, tradeoffs and rollback plan." },
  { phase: "Build", title: "Create an isolated candidate", acceptance: "Record branch or sandbox artifact, dependency versions and reproducible build procedure." },
  { phase: "Test", title: "Execute functional and failure tests", acceptance: "Attach real test commands, output, dates and unresolved failures." },
  { phase: "Validate", title: "Request independent QA", acceptance: "Obtain separate review evidence for security, correctness and release readiness." },
  { phase: "Handoff", title: "Deliver and preserve receipts", acceptance: "Link artifacts, source revision, risk register, owner approvals and next actions." },
];

function normalized(t: string, max = 500) {
  return t.trim().slice(0, max);
}

export function makePlan(goal: string, steps?: StepInput[]) {
  const g = normalized(goal);
  if (g.length < 3) throw new Error("Goal must have at least 3 characters.");
  const selected = steps?.length ? steps : defaults;
  if (selected.length > 12) throw new Error("Maximum 12 steps.");
  const cleaned: PlanStep[] = selected.map((item, i) => ({
    id: String(i + 1).padStart(2, "0"),
    title: normalized(item.title, 120),
    acceptance: normalized(item.acceptance, 600),
    phase: normalized(item.phase || `Step ${i + 1}`, 60),
  }));
  if (cleaned.some(s => s.title.length < 3 || s.acceptance.length < 3)) {
    throw new Error("Each step needs a title and an acceptance criterion.");
  }
  const planId = createHash("sha256").update(JSON.stringify({ goal: g, steps: cleaned })).digest("hex").slice(0, 16);
  return { planId, goal: g, steps: cleaned, source: steps?.length ? "assistant-supplied" : "universal-template", verification: "NOT_RUN" as const };
}

export function reviewEvidence(goal: string, steps: ReviewStep[]) {
  const prepared = steps.map((s, i) => ({
    step: i + 1,
    title: normalized(s.title, 120),
    status: s.status,
    evidenceSupplied: !!s.evidence?.trim(),
    needsEvidence: s.status === "review" && !s.evidence?.trim(),
  }));
  const hasEvidence = prepared.filter(s => s.evidenceSupplied).length;
  const awaitingReview = prepared.filter(s => s.status === "review").length;
  const missingEvidence = prepared.filter(s => s.needsEvidence).map(s => s.step);
  const remaining = prepared.filter(s => s.status !== "review").length;
  return {
    goal: normalized(goal),
    total: steps.length,
    evidenceSupplied: hasEvidence,
    awaitingIndependentReview: awaitingReview,
    notReadyForReview: remaining,
    missingEvidence,
    nextActions: missingEvidence.length ? ["Attach evidence to all steps marked ready for review."] : remaining ? ["Finish open steps and supply supporting evidence."] : ["Arrange independent verification of all submitted evidence."],
    independentVerification: "NOT_RUN",
    releaseApproved: false,
    note: "Submitted evidence is not independent verification. This review checks completeness only."
  };
}