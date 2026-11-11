import { z } from "zod";

export const verdictSchema = z.enum(["safe", "suspicious", "dangerous"]);
export type Verdict = z.infer<typeof verdictSchema>;

export const flagSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  severity: z.enum(["high", "medium", "low"]),
});
export type Flag = z.infer<typeof flagSchema>;

export const scanResultSchema = z.object({
  input: z.string(),
  url: z.string(),
  host: z.string(),
  registered_domain: z.string(),
  verdict: verdictSchema,
  model_verdict: verdictSchema,   // what the two scores alone say, before the trusted list
  risk: z.number().int().min(0).max(100),
  trusted: z.boolean(),
  threat_type: z.string().nullable(),
  type_probabilities: z.record(z.string(), z.number()),
  models: z.object({ a: z.number().min(0).max(1), b: z.number().min(0).max(1) }),
  models_disagree: z.boolean(),
  flags: z.array(flagSchema),
});
export type ScanResult = z.infer<typeof scanResultSchema>;

export const cueSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  category: z.string(),
  text: z.string(),
});
export type Cue = z.infer<typeof cueSchema>;

export const messageResultSchema = z.object({
  links: z.array(scanResultSchema),
  truncated: z.boolean(),
  cues: z.array(cueSchema),
  cue_summary: z.array(z.object({ category: z.string(), label: z.string(), count: z.number().int() })),
  brands: z.array(z.string()),
});
export type MessageResult = z.infer<typeof messageResultSchema>;

export const healthSchema = z.object({ status: z.literal("ok"), models_loaded: z.boolean() });
