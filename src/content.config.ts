import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
});
const puzzles = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/puzzle-solves/puzzles',
  }),
  schema: z.object({
    collection: z.string(),
    problem: z.number(),
    title: z.string(),
    source_title: z.string().optional(),
    source_author: z.string().optional(),
  }),
});
const solves = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/puzzle-solves/solves',
  }),
  schema: z.object({
    collection: z.string(),
    problem: z.number(),
    date: z.date(),
    source: z.string(),
  }),
});
const books = defineCollection({
  loader: glob({
    pattern: '**/*.yaml',
    base: './src/content/puzzle-solves/books',
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    author: z.string(),
    publisher: z.string(),
    year: z.number(),
    purchase_url: z.string(),
  }),
});

export const collections = { posts, solves, puzzles, books };
