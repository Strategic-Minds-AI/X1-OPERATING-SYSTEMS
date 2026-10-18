import {chatConfig} from "../../server/x1-agent-chat.mjs";
import {respond} from "../../server/x1-staging.mjs";

export function runAgentConfig(req,res,env=process.env){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return respond(res,405,{status:"METHOD_NOT_ALLOWED"});}
  const config=chatConfig(env);
  return respond(res,config.status==="UNBOUND"?503:200,config);
}
export default function handler(req,res){return runAgentConfig(req,res);}
