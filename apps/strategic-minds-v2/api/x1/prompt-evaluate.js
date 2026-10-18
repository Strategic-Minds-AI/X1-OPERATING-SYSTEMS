import { runPromptEvaluation } from "../../server/x1-prompt-evaluate.mjs";
export default async function handler(req,res){ return runPromptEvaluation(req,res); }
