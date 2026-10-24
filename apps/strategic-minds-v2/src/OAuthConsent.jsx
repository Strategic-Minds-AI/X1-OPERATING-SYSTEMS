import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && publishableKey
  ? createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } })
  : null;

const panel = { maxWidth: 540, margin: '8vh auto', padding: 28, border: '1px solid #27435a', borderRadius: 18, background: '#0c1829', boxShadow: '0 10px 60px #02040a55' };
const button = { minHeight: 44, border: 0, borderRadius: 10, padding: '11px 18px', fontWeight: 800, cursor: 'pointer' };

export default function OAuthConsent() {
  const authorizationId = new URLSearchParams(window.location.search).get('authorization_id');
  const [phase, setPhase] = useState('loading');
  const [details, setDetails] = useState(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const headingId = useMemo(() => 'x1-oauth-consent-heading', []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!authorizationId || !/^[A-Za-z0-9_-]{6,256}$/.test(authorizationId)) { setPhase('error'); setMessage('Missing or invalid OAuth authorization request.'); return; }
      if (!supabase) { setPhase('error'); setMessage('The X1 staging consent page has not been connected to Supabase Auth.'); return; }
      try {
        const user = await supabase.auth.getUser();
        if (!mounted) return;
        if (user.error || !user.data?.user) { setPhase('signin'); return; }
        const response = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
        if (!mounted) return;
        if (response.error || !response.data) { setPhase('error'); setMessage('Unable to retrieve this authorization request. It may have expired.'); return; }
        if (!('authorization_id' in response.data) && response.data.redirect_url) {
          window.location.assign(response.data.redirect_url); return;
        }
        setDetails(response.data);
        setPhase('consent');
      } catch {
        if (mounted) { setPhase('error'); setMessage('Authentication service unavailable. No authorization was granted.'); }
      }
    }
    load();
    return () => { mounted = false; };
  }, [authorizationId]);

  async function sendMagicLink(e) {
    e.preventDefault();
    if (!supabase || !email.includes('@') || busy) return;
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: window.location.href }
    });
    setBusy(false);
    if (error) setMessage('Could not send a sign-in email. Verify your account or use your existing sign-in method.');
    else setMessage('Check your email for a sign-in link. Return to this authorization page after signing in.');
  }

  async function decide(decision) {
    if (!supabase || busy || !details || !authorizationId) return;
    setBusy(true); setMessage('');
    try {
      const result = decision === 'approve'
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId);
      if (result.error || !result.data?.redirect_url) throw Error('Denied');
      window.location.assign(result.data.redirect_url);
    } catch {
      setBusy(false);
      setMessage('The authorization request could not be completed. No access was changed.');
    }
  }

  return <main style={{ minHeight:'100vh', background:'radial-gradient(circle at 80% 10%, #102c49, #050c17 65%)', color:'#eaf6ff', fontFamily:'Inter,system-ui,sans-serif', padding:18 }}>
    <section aria-labelledby={headingId} style={panel}>
      <div style={{ fontSize:12, letterSpacing:3, color:'#8cd9f7', fontWeight:700 }}>STRATEGIC MINDS AI / X1</div>
      <h1 id={headingId} style={{ fontSize:30, lineHeight:1.2, margin:'18px 0 10px' }}>Authorize an X1 connection</h1>
      {phase === 'loading' && <p role="status">Checking your session and the requesting application…</p>}
      {phase === 'error' && <p role="alert">{message}</p>}
      {phase === 'signin' && <>
        <p style={{ color:'#b9c9da' }}>Sign in to an existing Strategic Minds AI account before reviewing the requested access. Approval is never automatic.</p>
        <form onSubmit={sendMagicLink} style={{ display:'grid', gap:12 }}>
          <label htmlFor="x1-oauth-email">Account email</label>
          <input id="x1-oauth-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ padding:12,borderRadius:8,background:'#172944',color:'#fff',border:'1px solid #57748a' }}/>
          <button disabled={busy} style={{...button,background:'#8cd9f7',color:'#081724'}}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
        </form>
      </>}
      {phase === 'consent' && details && <>
        <p style={{ color:'#b9c9da' }}><strong>{details.client?.client_name || details.client?.clientName || 'A connected application'}</strong> is requesting access.</p>
        <div style={{ background:'#15273e',padding:17,borderRadius:10,overflowWrap:'anywhere' }}>
          <div style={{fontSize:12,color:'#8cd9f7'}}>REQUESTED SCOPES</div>
          <p>{String(details.scope || 'Not supplied').split(' ').join(' · ')}</p>
          <div style={{fontSize:12,color:'#8cd9f7'}}>RETURN TO</div>
          <p style={{fontSize:13}}>{details.redirect_uri || details.redirectUri || 'The application requesting access'}</p>
        </div>
        <p style={{fontSize:13,color:'#a8bacb'}}>Approve only if you recognize the application and trust the requested permissions. You can deny access.</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button disabled={busy} onClick={()=>decide('deny')} style={{...button,background:'#304155',color:'#eaf6ff'}}>Deny access</button>
          <button disabled={busy} onClick={()=>decide('approve')} style={{...button,background:'#8cd9f7',color:'#081724'}}>{busy ? 'Processing…' : 'Approve access'}</button>
        </div>
      </>}
      {message && phase!=='error' && <p role="status" style={{color:'#f3c15b'}}>{message}</p>}
      <p style={{fontSize:12,color:'#778fa7',marginTop:28}}>Staging authentication · User-controlled consent · No automatic production permissions</p>
    </section>
  </main>;
}
