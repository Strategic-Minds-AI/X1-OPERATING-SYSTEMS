import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ExternalLink, Maximize2, RefreshCw, Sparkles } from 'lucide-react';

const LAUNCH_STUDIO_URL = 'https://the-ultimate-auto-buiilder-hmcyunpf4-strategic-minds-advisory.vercel.app/launch-studio/';

export default function LaunchStudio() {
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(false);

  return (
    <main className={`x1-launch-studio-page${expanded ? ' x1-launch-studio-expanded' : ''}`}>
      <header className="x1-launch-studio-toolbar">
        <div className="x1-launch-studio-heading">
          <Link className="x1-launch-studio-back" to="/admin/studio" aria-label="Back to Visual Studio"><ArrowLeft size={16} /></Link>
          <div className="x1-launch-studio-mark"><Sparkles size={18} /></div>
          <div>
            <div className="x1-launch-studio-eyebrow">STRATEGIC MINDS AI <span>/ ADMIN WORKSPACE</span></div>
            <h1>Launch Studio</h1>
            <p>Industry-aware website creation, brand design, and launch workflow.</p>
          </div>
        </div>
        <div className="x1-launch-studio-actions">
          <span className="x1-launch-studio-status"><i /> BUILDER CONNECTION</span>
          <button type="button" onClick={() => setReloadKey((v) => v + 1)}><RefreshCw size={14} /> Reload</button>
          <button type="button" onClick={() => setExpanded((v) => !v)}><Maximize2 size={14} /> {expanded ? 'Restore' : 'Expand'}</button>
          <a className="x1-launch-studio-open" href={LAUNCH_STUDIO_URL} target="_blank" rel="noreferrer">Open separately <ArrowUpRight size={14} /></a>
        </div>
      </header>
      <section className="x1-launch-studio-frame-wrap" aria-label="Launch Studio application">
        <iframe
          key={reloadKey}
          title="Launch Studio"
          src={LAUNCH_STUDIO_URL}
          className="x1-launch-studio-frame"
          allow="clipboard-read; clipboard-write; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </section>
      <style>{`
        .x1-launch-studio-page{--ls-bg:var(--smai-canvas,#02050d);--ls-panel:var(--smai-panel,#061726);--ls-border:var(--smai-border-soft,rgba(74,201,255,.21));--ls-blue:var(--smai-blue,#128cff);--ls-cyan:var(--smai-cyan,#02cfff);--ls-white:var(--smai-white,#f6fbff);--ls-muted:var(--smai-muted,#9bbdd0);position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;background:var(--ls-bg);color:var(--ls-white);font-family:inherit}
        .x1-launch-studio-toolbar{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:88px;padding:16px 24px;border-bottom:1px solid var(--ls-border);background:linear-gradient(110deg,rgba(2,5,13,.99),rgba(3,15,30,.97));box-shadow:0 10px 36px rgba(0,0,0,.24)}
        .x1-launch-studio-heading{display:flex;align-items:center;gap:14px;min-width:0}.x1-launch-studio-back,.x1-launch-studio-mark{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border:1px solid var(--ls-border);border-radius:11px;background:rgba(18,140,255,.09);color:var(--ls-cyan)}.x1-launch-studio-back{text-decoration:none}.x1-launch-studio-mark{background:linear-gradient(145deg,rgba(18,140,255,.2),rgba(2,207,255,.08))}
        .x1-launch-studio-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:var(--ls-cyan)}.x1-launch-studio-eyebrow span{color:var(--ls-muted)}.x1-launch-studio-heading h1{margin:4px 0 2px;font-size:21px;line-height:1.2;font-weight:750;letter-spacing:-.025em}.x1-launch-studio-heading p{margin:0;color:var(--ls-muted);font-size:12px}
        .x1-launch-studio-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.x1-launch-studio-actions button,.x1-launch-studio-open{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:0 11px;border:1px solid var(--ls-border);border-radius:8px;background:rgba(6,23,38,.85);color:var(--ls-white);font:600 11px inherit;text-decoration:none;cursor:pointer}.x1-launch-studio-actions button:hover,.x1-launch-studio-open:hover{border-color:var(--ls-cyan);background:rgba(18,140,255,.12)}.x1-launch-studio-open{border-color:rgba(2,207,255,.42);background:linear-gradient(100deg,rgba(18,140,255,.18),rgba(2,207,255,.09))}
        .x1-launch-studio-status{display:inline-flex;align-items:center;gap:7px;margin-right:4px;color:var(--ls-muted);font-size:9px;font-weight:800;letter-spacing:.1em;white-space:nowrap}.x1-launch-studio-status i{width:6px;height:6px;border-radius:50%;background:var(--ls-cyan);box-shadow:0 0 10px rgba(2,207,255,.7)}
        .x1-launch-studio-frame-wrap{position:relative;flex:1;min-height:0;background:#05070b}.x1-launch-studio-frame{display:block;width:100%;height:100%;min-height:300px;border:0;background:#05070b}.x1-launch-studio-expanded .x1-launch-studio-toolbar{min-height:60px;padding:8px 16px}.x1-launch-studio-expanded .x1-launch-studio-heading p,.x1-launch-studio-expanded .x1-launch-studio-status{display:none}
        @media(max-width:900px){.x1-launch-studio-toolbar{align-items:flex-start;flex-direction:column;padding:14px 16px;gap:12px}.x1-launch-studio-actions{justify-content:flex-start;width:100%}.x1-launch-studio-heading p{max-width:60vw}.x1-launch-studio-frame{min-height:65vh}}
        @media(prefers-reduced-motion:reduce){.x1-launch-studio-page *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
    </main>
  );
}
