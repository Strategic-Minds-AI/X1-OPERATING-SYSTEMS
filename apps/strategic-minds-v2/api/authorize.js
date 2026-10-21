// Vercel API route; preview/development only via x1-staging binding.
import {runControlPlaneAuthorize} from "../server/x1-control-plane-authorize.mjs";
export default async function handler(req,res){return runControlPlaneAuthorize(req,res);}
