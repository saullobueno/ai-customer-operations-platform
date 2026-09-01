import { createGroq } from "@ai-sdk/groq";
import { env } from "@/lib/env";

const groq = createGroq({ apiKey: env.GROQ_API_KEY });

export const aiModel = groq(env.AI_MODEL_ID);
export const AI_MODEL_ID = env.AI_MODEL_ID;
