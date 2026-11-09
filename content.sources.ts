// External content repos pulled into src/content/<name>/ by scripts/sync-content.ts.
// Those directories are gitignored — the repos below are the source of truth.

export type ContentSource = {
  /** Git URL to clone (public repos need no auth). */
  repo: string;
  /** Branch, tag, or commit to check out. */
  ref: string;
  /** Top-level paths to sparse-checkout (keeps raw scans etc. out of the site). */
  paths: string[];
};

export const sources: Record<string, ContentSource> = {
  'puzzle-solves': {
    repo: 'https://github.com/jcrowe6/puzzle-solves.git',
    ref: 'main',
    paths: ['puzzles', 'solves', 'books'],
  },
};
