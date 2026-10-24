import React from "react";
import { useDownload, useDisplayMode, useViewState } from "skybridge/web";
import { useCallTool, useToolInfo } from "../helpers.js";
import "../index.css";

type Status = "todo" | "doing" | "review";
type Evidence = { status: Status; note: string };
type ViewState = { entries: Record<string, Evidence> };

function escapeMarkdown(text: string) {
  return text.replace(/\r/g, "").replace(/\u0000/g, "").trim();
}

export default function GoalPlan() {
  const { output, isPending } = useToolInfo<"create_goal_plan">();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const [view, setView] = useViewState<ViewState>({ entries: {} });
  const download = useDownload();
  const { callTool, data: review, isPending: reviewing } = useCallTool("review_goal_evidence");
  const [exportError, setExportError] = React.useState("");
  const [kind, setKind] = React.useState<"website"|"app">("website");
  const {callTool:buildPreview, data:buildResult,isPending:building} = useCallTool("build_site_preview");
  const {callTool:validatePreview,data:validation,isPending:validating} = useCallTool("validate_site_preview");

  if (isPending || !output) return <main className="shell"><p>Loading goal plan…</p></main>;

  const getEntry = (id: string): Evidence => view.entries[`${output.planId}:${id}`] ?? { status: "todo", note: "" };
  const setEntry = (id: string, patch: Partial<Evidence>) => {
    const key = `${output.planId}:${id}`;
    setView(current => ({
      ...current,
      entries: { ...current.entries, [key]: { ...getEntry(id), ...patch } },
    }));
  };
  const steps = output.steps;
  const reviewReady = steps.filter(s => getEntry(s.id).status === "review").length;
  const hasEvidence = steps.filter(s => getEntry(s.id).note.trim().length > 0).length;
  const expanded = displayMode === "fullscreen";
  const snapshot = steps.map(s => ({
    title: s.title,
    acceptance: s.acceptance,
    status: getEntry(s.id).status,
    evidence: getEntry(s.id).note.trim(),
  }));

  const runReview = () => {
    callTool({ goal: output.goal, steps: snapshot });
  };

  const exportHandoff = async () => {
    setExportError("");
    const body = [
      `# Goal Handoff — ${output.goal}`,
      "",
      `- Plan ID: \`${output.planId}\``,
      "- Independent QA: NOT RUN",
      "- Release approval: NOT GRANTED",
      `- Checklist: ${reviewReady}/${steps.length} marked awaiting review; ${hasEvidence} with evidence notes`,
      "",
      ...steps.flatMap((s) => {
        const e = getEntry(s.id);
        return [
          `## ${s.id}. ${escapeMarkdown(s.title)}`,
          `Phase: ${s.phase} | Status: ${e.status}`,
          `Acceptance: ${escapeMarkdown(s.acceptance)}`,
          `Evidence supplied (unverified): ${escapeMarkdown(e.note) || "NONE"}`,
          "",
        ];
      }),
      "## Outstanding validation",
      "Evidence is operator supplied. Independent security, reliability, and correctness review is still required.",
      "Do not use this handoff as a production release approval.",
      ""
    ].join("\n");
    try {
      const result = await download({
        contents: [{ type: "resource", resource: {
          uri: `file:///x1-goal-handoff-${output.planId}.md`,
          mimeType: "text/markdown",
          text: body
        } }]
      });
      if (result.isError) setExportError("Download was cancelled or declined by the host.");
    } catch {
      setExportError("This host did not allow the download. The checklist is still available in the view.");
    }
  };

  return <main className={expanded ? "shell full" : "shell compact"} data-llm={`Goal: ${output.goal}; plan ${output.planId}; ${reviewReady} steps awaiting independent review; evidence notes on ${hasEvidence} steps; release not approved`}>
    <header className="top">
      <div>
        <div className="eyebrow">X1 / GOAL → RECEIPT</div>
        <h1>{output.goal}</h1>
        <p className="sub">Plan <code>{output.planId}</code> · {output.source === "universal-template" ? "7-phase template" : "Goal-specific steps"}</p>
      </div>
      <span className="qa">QA NOT RUN</span>
    </header>

    <div className="metricrow">
      <div><b>{steps.length}</b><span>Steps</span></div>
      <div><b>{reviewReady}</b><span>Awaiting review</span></div>
      <div><b>{hasEvidence}</b><span>Evidence notes</span></div>
    </div>

    <div className="progress" role="progressbar" aria-valuenow={reviewReady} aria-valuemax={steps.length} aria-valuemin={0} aria-label="Steps awaiting review">
      <div style={{ width: `${(reviewReady / steps.length) * 100}%` }} />
    </div>

    <section className="steps">
      {(expanded ? steps : steps.slice(0, 3)).map((step) => {
        const e = getEntry(step.id);
        return <article className="step" key={step.id} data-llm={`Step ${step.id}: ${step.title}; status ${e.status}`}>
          <div className="stephead"><span className="number">{step.id}</span>
            <div className="stepbody"><span className="phase">{step.phase}</span><h2>{step.title}</h2>
            <p>{step.acceptance}</p></div></div>
          {expanded && <div className="controls">
            <label>Status
              <select value={e.status} onChange={event => setEntry(step.id, { status: event.target.value as Status })}>
                <option value="todo">Not started</option>
                <option value="doing">In progress</option>
                <option value="review">Submit for independent review</option>
              </select>
            </label>
            <label>Evidence / receipt link (not yet verified)
              <textarea rows={2} maxLength={2000} value={e.note}
                placeholder="File path, commit, test output reference or an issue blocking completion"
                onChange={event => setEntry(step.id, { note: event.target.value })} />
            </label>
          </div>}
        </article>;
      })}
    </section>

    {expanded && <section className="step" style={{marginTop:12}}>
      <span className="phase">BUILD / LOCAL CANDIDATE</span>
      <h2>Generate an isolated preview</h2>
      <p>Creates a static website preview or a functional estimate calculator. This is not an autonomous production deployment.</p>
      <div className="actions">
        <label>Candidate type <select value={kind} onChange={e=>setKind(e.target.value as "website"|"app")}><option value="website">Landing website</option><option value="app">Mini-app calculator</option></select></label>
        <button className="primary" disabled={building} onClick={()=>buildPreview({goal:output.goal,title:output.goal.slice(0,70),kind})}>{building?"Creating...":"Build preview locally"}</button>
      </div>
      {buildResult?.structuredContent && <div className="reviewbox"><strong>Candidate {buildResult.structuredContent.candidateId}</strong><p>Source: {buildResult.structuredContent.localPath}</p><p>SHA-256: {buildResult.structuredContent.sha256}</p><p>Release: NOT PUBLISHED</p><button disabled={validating} onClick={()=>validatePreview({candidateId:buildResult.structuredContent.candidateId})}>Run static checks</button></div>}
      {validation?.structuredContent && <p role="status">Static checks: {validation.structuredContent.passed} passed; {validation.structuredContent.failed} failed. Browser/Guardian QA: NOT RUN.</p>}
    </section>}
    <div className="actions">
      <button className="primary" onClick={() => setDisplayMode(expanded ? "inline" : "fullscreen")}>
        {expanded ? "Collapse" : "Open full checklist"}
      </button>
      {expanded && <button onClick={runReview} disabled={reviewing}>{reviewing ? "Checking..." : "Check evidence completeness"}</button>}
      <button className="secondary" onClick={exportHandoff}>Export handoff</button>
    </div>
    {review?.structuredContent && <div className="reviewbox" role="status">
      <strong>Completeness review</strong>
      <p>{review.structuredContent.evidenceSupplied} entries with evidence. {review.structuredContent.notReadyForReview} steps not submitted for review. Independent QA: NOT RUN.</p>
      <p>{review.structuredContent.nextActions.join(" ")}</p>
    </div>}
    {exportError && <p className="warning" role="alert">{exportError}</p>}
    <footer>Evidence notes are not independent proof. Local previews are sandbox candidates, not published products. Cloud and production actions require separate authentication and approval.</footer>
  </main>;
}