#!/usr/bin/env python3
"""Deterministic offline X1 task compiler; this module never submits work to a provider."""
import hashlib,json,sys
PHASES=[
("P00","rehydrate",[]),("P01","onboard",["P00"]),("P02","research",["P01"]),
("P03","benchmark",["P02"]),("P04","domain_50",["P02"]),
("P05","render_10_visuals",["P03","P04"]),("P06","approve_visual",["P05"]),
("P07","build_staging",["P06"]),("P08","guardian",["P07"]),("P09","provision_staging",["P08"]),
("P10","connect_google_assets",["P09"]),("P11","release_approval",["P10"]),
("P12","monitor_handoff",["P11"])]
def compile_mission(sentence,client_id="UNASSIGNED"):
 goal=" ".join(sentence.strip().split())
 if not goal or len(goal)>1000:raise ValueError("sentence length must be 1-1000")
 seed=hashlib.sha256((client_id+"|"+goal.casefold()).encode()).hexdigest()
 mid="X1-"+seed[:16].upper()
 tasks=[]
 for code,name,deps in PHASES:
  tasks.append({"mission_id":mid,"task_id":mid+"-"+code,"phase":name,
   "deps":[mid+"-"+d for d in deps],
   "idempotency_key":hashlib.sha256((seed+"|"+code).encode()).hexdigest(),
   "approval_required":name in ("approve_visual","release_approval"),"status":"PLANNED",
   "attempts":0,"max_attempts":2,"target":"existing-X1-queue-UNVERIFIED",
   "receipt_uri":None,"guardian_receipt_uri":None,"rollback_ref":None})
 return {"schema_version":"x1.mission.v0.1","mission_id":mid,"client_id":client_id,
 "objective":goal,"not_submitted":True,"tasks":tasks,
 "guards":{"visual_desktop_required":10,"visual_mobile_required":10,"logo_concepts_required":10,
 "benchmark_websites_required":3,"domain_candidates_required":50,"guardian_target_score":95,
 "zero_critical_failures":True}}
if __name__=="__main__":
 print(json.dumps(compile_mission(" ".join(sys.argv[1:]) or "Build a premium service website"),indent=2))
