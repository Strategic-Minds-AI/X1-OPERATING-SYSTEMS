import {rejectVisualXMutation} from "../../server/x1-visualx-auth.mjs";
import {PublicApiError,readBearer,respond} from "../../server/x1-staging.mjs";
import {postAgentTurn,readAgentConversation,verifyChatRuntime} from "../../server/x1-agent-chat.mjs";

export async function runAgentChat(req,res,{env=process.env,fetchImpl=fetch}={}){
  if(!["GET","POST"].includes(req.method)){
    res.setHeader("Allow","GET, POST");return respond(res,405,{status:"METHOD_NOT_ALLOWED"});
  }
  try {
    readBearer(req.headers);
    verifyChatRuntime(env);
    if(req.method==="POST")rejectVisualXMutation(req);
    if(req.method==="POST" && env.VERCEL_ENV==="production" && env.X1_PRODUCTION_WRITES_ENABLED!=="true")
      throw new PublicApiError(403,"PRODUCTION_WRITES_DISABLED");
    if(req.method==="POST"){
      const declared=Number(req.headers?.["content-length"]??0);
      if(!Number.isFinite(declared)||declared>9000)throw new PublicApiError(413,"CHAT_BODY_TOO_LARGE");
    }
    const data=req.method==="GET"
      ?await readAgentConversation(req,{env,fetchImpl})
      :await postAgentTurn(req,{env,fetchImpl});
    return respond(res,200,data);
  }catch(err){
    if(err instanceof PublicApiError)return respond(res,err.status,{status:"BLOCKED",reason:err.code});
    return respond(res,503,{status:"BLOCKED",reason:"X1_AGENT_BRIDGE_UNAVAILABLE"});
  }
}
export default async function handler(req,res){return runAgentChat(req,res);}
