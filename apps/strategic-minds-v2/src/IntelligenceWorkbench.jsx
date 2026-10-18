import React, { useEffect, useState } from "react";
import { ArrowLeft, Database, ExternalLink, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const panel = { background: "#0a1524", border: "1px solid #22334a", borderRadius: 14, padding: 18 };
const inputStyle = { width: "100%", boxSizing: "border-box", background: "#07101c", color: "#e4f2ff", border: "1px solid #31465f", borderRadius: 8, padding: "11px 12px" };
const buttonStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#8edfff", color: "#07101c", border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };

async function responseJson(response) {
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(String(data.reason || data.message || data.status || response.status).replaceAll("_", " ").slice(0, 180));
  return data;
}

export default function IntelligenceWorkbench() {
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("stars:>1000 pushed:>2025-01-01");
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const signedIn = step === "authenticated" && Boolean(token);

  useEffect(() => {
    let active = true;
    fetch("/api/x1/agent-config", { cache: "no-store" })
      .then(response => response.json())
      .then(data => { if (active) setConfig(data); })
      .catch(() => { if (active) setConfig({ status: "UNBOUND", reason: "CONFIG_UNAVAILABLE" }); })
      .finally(() => { if (active) setConfigLoading(false); });
    return () => { active = false; };
  }, []);

  async function requestCode(event) {
    event.preventDefault();
    if (!config?.authOrigin || !config?.publicAnonKey) return;
    setBusy(true); setNotice("");
    try {
      await responseJson(await fetch(config.authOrigin + "/auth/v1/otp", {
        method: "POST",
        headers: { apikey: config.publicAnonKey, "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), create_user: false })
      }));
      setStep("otp");
      setNotice("Sign-in code requested. Check your email.");
    } catch (error) { setNotice("Sign-in request blocked: " + error.message); }
    finally { setBusy(false); }
  }

  async function loadRecords(authToken = token) {
    if (!authToken) return;
    setBusy(true); setNotice("");
    try {
      const data = await responseJson(await fetch("/api/x1/intelligence-scan", {
        headers: { authorization: "Bearer " + authToken }, cache: "no-store"
      }));
      setItems(Array.isArray(data.items) ? data.items : []);
      setNotice("Read complete: " + (data.items?.length || 0) + " tenant-scoped records.");
    } catch (error) { setNotice("Intelligence read blocked: " + error.message); }
    finally { setBusy(false); }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true); setNotice("");
    try {
      const data = await responseJson(await fetch(config.authOrigin + "/auth/v1/verify", {
        method: "POST",
        headers: { apikey: config.publicAnonKey, "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token: otp.trim(), type: "email" })
      }));
      if (!data.access_token) throw new Error("No access token returned");
      setToken(data.access_token);
      setStep("authenticated");
      await loadRecords(data.access_token);
    } catch (error) { setNotice("Verification blocked: " + error.message); }
    finally { setBusy(false); }
  }

  async function scan() {
    if (!token) return;
    setBusy(true); setNotice("Scanning public GitHub repository metadata…");
    try {
      const data = await responseJson(await fetch("/api/x1/intelligence-scan", {
        method: "POST",
        headers: { authorization: "Bearer " + token, "content-type": "application/json" },
        body: JSON.stringify({ query, limit: 15 })
      }));
      setItems(Array.isArray(data.items) ? data.items : []);
      setNotice("Scan complete: discovered " + data.discovered + ", stored " + data.stored + ". " + (data.reason || ""));
    } catch (error) { setNotice("Scan blocked: " + error.message + ". Confirm the staging migration is applied."); }
    finally { setBusy(false); }
  }

  return <main style={{ minHeight: "100vh", background: "#050c15", color: "#e4f2ff", padding: "clamp(18px,4vw,48px)", fontFamily: "Inter,system-ui,sans-serif" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <Link to="/admin/prompt-lab" style={{ color: "#8edfff", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 24 }}><ArrowLeft size={16}/> Prompt Lab control plane</Link>
      <header style={{ marginBottom: 24 }}>
        <div style={{ color: "#8edfff", textTransform: "uppercase", letterSpacing: ".16em", fontSize: 11, fontWeight: 800 }}>X1 · Passive intelligence</div>
        <h1 style={{ fontSize: "clamp(28px,4vw,42px)", margin: "8px 0" }}>Intelligence Workbench</h1>
        <p style={{ color: "#9bb0c6", maxWidth: 760, lineHeight: 1.6 }}>Discover and persist public GitHub repository metadata into the authenticated X1 staging tenant. Repository content is never executed or treated as trusted instructions.</p>
      </header>
      {!signedIn ? <section style={{ ...panel, maxWidth: 480 }}>
        <ShieldCheck size={22} color="#8edfff"/>
        <h2 style={{ margin: "10px 0" }}>Sign in to X1 staging</h2>
        <p style={{ color: "#9bb0c6", fontSize: 13 }}>Existing accounts only. Access is scoped to your verified tenant membership.</p>
        {configLoading ? <p>Checking staging configuration…</p> : config?.status !== "STAGING_CONFIGURED_NOT_AUTHENTICATED" ? <p role="alert">Staging authentication is not configured: {config?.reason || config?.status || "unknown status"}. No alternate backend will be used.</p> :
          step === "email" ? <form onSubmit={requestCode} style={{ display: "grid", gap: 12 }}>
            <label htmlFor="x1-intel-email">Account email</label><input id="x1-intel-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}/>
            <button style={buttonStyle} disabled={busy}>Send sign-in code <Search size={15}/></button>
          </form> : <form onSubmit={verifyCode} style={{ display: "grid", gap: 12 }}>
            <label htmlFor="x1-intel-otp">Email code</label><input id="x1-intel-otp" required value={otp} onChange={e => setOtp(e.target.value)} style={inputStyle} autoComplete="one-time-code"/>
            <button style={buttonStyle} disabled={busy}>Verify and open <ShieldCheck size={15}/></button>
            <button type="button" onClick={() => setStep("email")} style={{ ...buttonStyle, background: "transparent", color: "#9bb0c6", border: "1px solid #31465f" }}>Change email</button>
          </form>}
      </section> : <>
        <section style={{ ...panel, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}><Database color="#8edfff" size={20}/><h2 style={{ margin: 0, fontSize: 18 }}>Repository discovery</h2><span style={{ marginLeft: "auto", color: "#9bb0c6", fontSize: 12 }}>Staging only</span></div>
          <label htmlFor="x1-intel-query" style={{ display: "block", marginBottom: 8 }}>GitHub Search query</label>
          <input id="x1-intel-query" value={query} onChange={e => setQuery(e.target.value)} style={inputStyle}/>
          <p style={{ color: "#8197ae", fontSize: 12 }}>Bounded to 15 repositories per run. Use GitHub search qualifiers such as stars, language, topic, or pushed date.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button style={buttonStyle} disabled={busy || !query.trim()} onClick={scan}><Search size={15}/> {busy ? "Working…" : "Scan GitHub"}</button>
            <button style={{ ...buttonStyle, background: "transparent", color: "#8edfff", border: "1px solid #31465f" }} disabled={busy} onClick={() => loadRecords()}><RefreshCw size={15}/> Refresh stored records</button>
          </div>
        </section>
        {notice && <p role="status" style={{ color: "#b8d4e9", background: "#0a1524", border: "1px solid #22334a", borderRadius: 8, padding: 12 }}>{notice}</p>}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 12 }}>
          {items.map(item => <article key={item.ingest_id || item.external_id} style={panel}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}><h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{item.title || item.external_id}</h3><p style={{ margin: 0, color: "#9bb0c6", lineHeight: 1.5, fontSize: 13 }}>{item.summary || "No description supplied by repository owner."}</p></div>
              <a href={item.url} target="_blank" rel="noreferrer" aria-label={"Open " + (item.title || item.external_id) + " on GitHub"} style={{ color: "#8edfff" }}><ExternalLink size={16}/></a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#8edfff", fontSize: 12, marginTop: 16 }}>
              <span>★ {Number(item.stars || 0).toLocaleString()}</span><span>Forks {Number(item.forks || 0).toLocaleString()}</span><span>{item.language || "Language unknown"}</span>
            </div>
          </article>)}
        </section>
      </>}
      {notice && !signedIn && <p role="status" style={{ color: "#b8d4e9", marginTop: 14 }}>{notice}</p>}
      <footer style={{ color: "#637d96", fontSize: 12, marginTop: 32, borderTop: "1px solid #1c2d40", paddingTop: 14 }}>No source downloads, code execution, repository writes, or production queue dispatch are enabled by this workbench.</footer>
    </div>
  </main>;
}
