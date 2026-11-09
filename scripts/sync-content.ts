// Pulls every source in content.sources.ts into src/content/<name>/.
// Runs before `dev` and `build` (and therefore in CI via `sst deploy`).
//
// Each target is a shallow, sparse git clone. On re-run it fetches `ref` and
// hard-resets to it — unless the clone has local changes, in which case it
// stops rather than throw your edits away.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { sources } from '../content.sources';

const contentDir = resolve(import.meta.dir, '..', 'src', 'content');

async function git(args: string[], cwd?: string): Promise<string> {
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    throw new Error(`git ${args.join(' ')} failed (${code}):\n${err.trim()}`);
  }
  return out.trim();
}

async function sync(
  name: string,
  { repo, ref, paths }: (typeof sources)[string]
) {
  const dir = join(contentDir, name);

  if (!existsSync(join(dir, '.git'))) {
    if (existsSync(dir)) {
      throw new Error(
        `${dir} exists but is not a git clone — move it aside and re-run.`
      );
    }
    await git([
      'clone',
      '--depth=1',
      '--filter=blob:none',
      '--no-checkout',
      repo,
      dir,
    ]);
  } else {
    const dirty = await git(['status', '--porcelain'], dir);
    if (dirty) {
      throw new Error(
        `${dir} has local changes; refusing to reset. Commit them in the source repo ` +
          `(${repo}) and discard them here, or move the folder aside.\n${dirty}`
      );
    }
  }

  await git(['sparse-checkout', 'set', '--cone', ...paths], dir);
  await git(['fetch', '--depth=1', 'origin', ref], dir);
  await git(
    ['-c', 'advice.detachedHead=false', 'checkout', '--force', 'FETCH_HEAD'],
    dir
  );
  await git(['reset', '--hard', 'FETCH_HEAD'], dir);

  const sha = await git(['rev-parse', '--short', 'HEAD'], dir);
  console.log(`[content] ${name}: ${ref} @ ${sha}`);
}

const results = await Promise.allSettled(
  Object.entries(sources).map(([name, src]) => sync(name, src))
);
const failures = results.filter(
  (r): r is PromiseRejectedResult => r.status === 'rejected'
);
for (const f of failures)
  console.error(`[content] ${f.reason?.message ?? f.reason}`);
if (failures.length) process.exit(1);
