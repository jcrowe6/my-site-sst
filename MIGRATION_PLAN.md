# Next.js to Astro Migration Plan

## Why Astro?

- **Built for content sites** - Markdown is a first-class citizen
- **No routing hacks needed** - Outputs `posts/my-post/index.html` by default (S3-friendly)
- **Zero JS by default** - Faster pages, better SEO
- **Simpler mental model** - No hydration, no `getStaticProps`, just templates

## Current Site Inventory

| Category | Count | Notes |
|----------|-------|-------|
| Pages | 4 | index, projects, movie recommender, post template |
| Components | 5 | layout, date, stars, starrating, movie |
| Blog posts | 5 | Markdown with YAML frontmatter |
| Images | 25 | In public/images/ |
| CSS | Tailwind + custom animations | Star field effect |

## Migration Steps

### Step 1: Initialize Astro alongside Next.js

Create Astro config, keep existing files until migration is complete.

**New files to create:**
```
astro.config.mjs
src/
  layouts/
    Layout.astro        # from components/layout.tsx
  pages/
    index.astro         # from pages/index.tsx
    projects.astro      # from pages/projects.tsx
  content/
    config.ts           # Astro content collection schema
    posts/              # move markdown files here
      *.md
  components/
    Date.astro          # from components/date.tsx
    Stars.astro         # from components/stars.tsx
  styles/
    global.css          # from styles/globals.css
```

### Step 2: Content Collection Setup

Astro's content collections replace your `libs/posts.ts` entirely.

**Before (Next.js):**
```typescript
// libs/posts.ts - 104 lines of file system code
const postsDirectory = path.join(process.cwd(), 'posts');
export function getSortedPostsData() {
  const fileNames = fs.readdirSync(postsDirectory);
  // ... manual parsing with gray-matter
}
```

**After (Astro):**
```typescript
// src/content/config.ts - ~10 lines
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
});

export const collections = { posts };
```

```astro
---
// In any page - that's it
import { getCollection } from 'astro:content';
const posts = await getCollection('posts');
const sorted = posts.sort((a, b) =>
  new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
);
---
```

### Step 3: Dynamic Routes (The Original Problem)

**Before (Next.js):**
```typescript
// pages/posts/[id].tsx
export const getStaticPaths = async () => {
  const paths = getAllPostIds();
  return { paths, fallback: false };
}
```
Outputs: `out/posts/my-post.html` (broken on S3)

**After (Astro):**
```astro
---
// src/pages/posts/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}
---
```
Outputs: `dist/posts/my-post/index.html` (works on S3)

### Step 4: Component Conversion

Most components become simpler `.astro` files. Only keep React for truly interactive parts.

**Layout (layout.tsx → Layout.astro):**
```astro
---
// src/layouts/Layout.astro
import '../styles/global.css';
const { title } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{title || 'jcrowell.net'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin&display=swap" rel="stylesheet">
  </head>
  <body class="bg-neutral-950 text-blue-50 font-librefranklin">
    <nav><!-- your nav --></nav>
    <main><slot /></main>
    <footer><!-- your footer --></footer>
  </body>
</html>
```

**Date component (date.tsx → Date.astro):**
```astro
---
// src/components/Date.astro
import { format, parseISO } from 'date-fns';
const { dateString } = Astro.props;
---
<time datetime={dateString}>
  {format(parseISO(dateString), 'LLLL d, yyyy')}
</time>
```

**Stars background:**
Keep CSS animations in global.css, just render the divs in Layout.astro.

### Step 5: Markdown Rendering

Astro handles this natively. Your custom styling becomes CSS/Tailwind:

```astro
---
// src/pages/posts/[...slug].astro
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---
<Layout title={post.data.title}>
  <article class="prose prose-invert">
    <h1>{post.data.title}</h1>
    <p class="text-gray-400">{post.data.date}</p>
    <Content />
  </article>
</Layout>
```

For syntax highlighting, Astro uses Shiki by default (better than Prism).

### Step 6: SST Config Update

```typescript
// sst.config.ts
export default $config({
  app(input) {
    return {
      name: "my-site-sst",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.StaticSite("MyWeb", {
      build: {
        command: "npm run build",
        output: "dist",  // Astro outputs to dist/ by default
      },
      domain: {
        name: "jcrowell.net",
        redirects: ["www.jcrowell.net"],
      },
    });
  },
});
```

No CloudFront function needed.

### Step 7: Google Analytics

```astro
<!-- In Layout.astro <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-T5TJ893ZKF"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-T5TJ893ZKF');
</script>
```

Or use `@astrojs/partytown` for better performance.

## Files to Delete After Migration

```
pages/                  # All Next.js pages
components/             # Replaced by src/components/
libs/posts.ts           # Replaced by content collections
posts/                  # Moved to src/content/posts/
next.config.js
mdx-components.tsx
```

## Dependencies: Before vs After

**Remove:**
- next, @next/mdx, @next/third-parties
- react, react-dom (unless keeping interactive components)
- react-markdown, react-syntax-highlighter
- gray-matter (Astro handles frontmatter)

**Add:**
- astro
- @astrojs/tailwind

**Keep:**
- tailwindcss, postcss, autoprefixer
- date-fns
- typescript

## Estimated New File Count

| Location | Files |
|----------|-------|
| src/layouts/ | 1 |
| src/pages/ | 3 (index, projects, posts/[...slug]) |
| src/components/ | 2-3 |
| src/content/ | 1 config + 5 posts |
| src/styles/ | 1 |
| Config files | 2 (astro.config.mjs, tailwind.config.js) |

**Total: ~15 files** (down from ~20)

## Interactive Components Decision

The movie recommender page has interactive elements (star ratings). Options:

1. **Keep as React** - Use `@astrojs/react` and `client:load` directive
2. **Convert to vanilla JS** - Simpler, no framework needed for basic interactivity
3. **Drop it** - You mentioned it's currently disabled anyway

Recommendation: Drop it for now, add back later if needed.