import {PublicApiError,readBearer,respond} from "../../server/x1-staging.mjs";
import {listAgentConversations,verifyChatRuntime} from "../../server/x1-agent-chat.mjs";

export async function runAgentSessions(req,res,{env=process.env,fetchImpl=fetch}={}){
  if(req.method!=="GET"){
    res.setHeader("Allow","GET");
    return respond(res,405,{status:"METHOD_NOT_ALLOWED"});
  }
  try{
    readBearer(req.headers);
    verifyChatRuntime(env);
    return respond(res,200,await listAgentConversations(req,{env,fetchImpl}));
  }catch(err){
    if(err instanceof PublicApiError)return respond(res,err.status,{status:"BLOCKED",reason:err.code});
    return respond(res,503,{status:"BLOCKED",reason:"X1_SESSION_SYNC_UNAVAILABLE"});
  }
}
export default async function handler(req,res){return runAgentSessions(req,res);}
