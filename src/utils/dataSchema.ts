import { z } from "zod";

export const ExportDataSchema = z.object({
  version: z.number(),
  exportDate: z.string(),
  appVersion: z.string(),
  data: z.object({
    workouts: z.array(z.any()).optional(),
    exercises: z.array(z.any()).optional(),
    prs: z.array(z.any()).optional(),
    cardio: z.array(z.any()).optional(),
    preferences: z.any().optional(),
    gymSelections: z.any().optional(),
    spotifyData: z.any().optional(),
    userProfile: z.any().optional(),
  }),
});

export type ExportData = z.infer<typeof ExportDataSchema>;
