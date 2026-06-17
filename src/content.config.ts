import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const sourceLink = z.object({
  label: z.string(),
  url: z.string(),
  type: z.string(),
  language: z.string().optional().nullable(),
  accessStatus: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

const museum = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/museum' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    dateDisplay: z.string(),
    dateStatus: z.string(),
    speakerNameUsed: z.string(),
    normalizedSpeakerName: z.string(),
    materialType: z.string(),
    speechType: z.string(),
    channel: z.string().optional().nullable(),
    interviewer: z.string().optional().nullable(),
    politicalPhase: z.string(),
    city: z.string(),
    exactLocation: z.string(),
    geospatialStatus: z.string(),
    locationCertainty: z.string(),
    verificationStatus: z.string(),
    corpusStatus: z.string(),
    primarySourceStatus: z.string(),
    transcriptStatus: z.string(),
    evidenceSummary: z.string(),
    sourceLinks: z.array(sourceLink).default([]),
    publicResearchNote: z.string(),
    speakerNameMethodologicalNote: z.string().optional().nullable(),
    featured: z.boolean().default(false),
    published: z.boolean().default(true),
  }),
});

export const collections = { museum };
