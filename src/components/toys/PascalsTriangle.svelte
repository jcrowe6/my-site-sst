<script lang="ts">
  import { untrack } from "svelte";

  // --- Parameters (reactive) ------------------------------------------------
  // $state is Svelte 5's reactive variable — like React's useState, but you
  // read/write it as a plain variable (no setter fn). Mutating one re-runs any
  // $effect that reads it, which re-renders the canvas.
  let rows = $state(64);
  let modulus = $state(2);

  // --- Coloring (reactive) --------------------------------------------------
  let mode = $state<
    "default" | "gradient" | "remainder" | "rainbow" | "highlight"
  >("default");
  let colorA = $state("#1e3a8a"); // gradient start (deep blue)
  let colorB = $state("#f59e0b"); // gradient end (amber)
  let remX = $state(0); // "remainder only": which residue to highlight
  let colorX = $state("#000000"); // "remainder only": its color
  let colorHi = $state("#e11d48"); // "highlight": the swept color
  let band = $state(1.5); // "highlight": band width, ×(1/modulus)
  let phase = $state(0); // rainbow/highlight cycle offset, 0..1
  let cycling = $state(false); // auto-advance the cycle

  const SIZE = 750; // logical canvas size, in CSS pixels
  const SQRT3 = Math.sqrt(3);

  // A handle to the actual <canvas> DOM node.
  // `bind:this` (below) fills this in — it's Svelte's version of React's useRef,
  // except you read it as a plain variable, not `ref.current`.
  let canvas: HTMLCanvasElement;

  // --- Math -----------------------------------------------------------------
  // Build Pascal's triangle mod `modulus`. The trick: never touch big integers.
  // Using the additive recurrence  C(n,j) = C(n-1,j-1) + C(n-1,j)  and taking
  // the mod at every step, every value stays in 0..modulus-1. O(rows²) cells.
  // Returns a jagged array: tri[n] has n+1 entries.
  function computeTriangle(rows: number, modulus: number): number[][] {
    const tri: number[][] = [];
    for (let n = 0; n < rows; n++) {
      const row = new Array<number>(n + 1);
      row[0] = 1 % modulus; // edges are 1 (0 when modulus === 1)
      row[n] = 1 % modulus;
      for (let j = 1; j < n; j++) {
        row[j] = (tri[n - 1][j - 1] + tri[n - 1][j]) % modulus;
      }
      tri.push(row);
    }
    return tri;
  }

  // --- Color schemes --------------------------------------------------------
  type Mode = "default" | "gradient" | "remainder" | "rainbow" | "highlight";
  type Scheme = {
    mode: Mode;
    rgbA: [number, number, number]; // gradient start
    rgbB: [number, number, number]; // gradient end
    remX: number; // "remainder only" target residue
    rgbX: [number, number, number]; // "remainder only" color
    rgbHi: [number, number, number]; // "highlight" swept color
    band: number; // "highlight" band width, ×(1/modulus)
    phase: number; // rainbow/highlight cycle offset, 0..1
  };

  const WHITE: [number, number, number] = [255, 255, 255];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Cyclic rainbow via HSL. Fixed moderate saturation/lightness keeps it "easy
  // on the eyes"; hue wraps at 1.0 so the two ends meet seamlessly.
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const hue = (((h % 1) + 1) % 1) * 6; // wrap into [0,6)
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue % 2) - 1));
    let r = 0,
      g = 0,
      b = 0;
    if (hue < 1) [r, g] = [c, x];
    else if (hue < 2) [r, g] = [x, c];
    else if (hue < 3) [g, b] = [c, x];
    else if (hue < 4) [g, b] = [x, c];
    else if (hue < 5) [r, b] = [x, c];
    else [r, b] = [c, x];
    const m = l - c / 2;
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }

  // Map one residue → [r,g,b] under the active scheme.
  function residueToRgb(
    residue: number,
    modulus: number,
    s: Scheme,
  ): [number, number, number] {
    switch (s.mode) {
      case "gradient": {
        const t = modulus <= 1 ? 0 : residue / (modulus - 1);
        return [
          lerp(s.rgbA[0], s.rgbB[0], t),
          lerp(s.rgbA[1], s.rgbB[1], t),
          lerp(s.rgbA[2], s.rgbB[2], t),
        ];
      }
      case "remainder":
        // Only the chosen residue is colored; everything else is background.
        return residue === s.remX ? s.rgbX : WHITE;
      case "rainbow": {
        // Divide by modulus (not modulus-1) so residue 0 and modulus map to the
        // same hue — the cycle wraps. `phase` rotates where it begins.
        return hslToRgb(residue / modulus + s.phase, 0.65, 0.55);
      }
      case "highlight": {
        // A narrow band of color sweeping the cycle. Each residue sits at
        // position residue/modulus on the [0,1) circle; `phase` is the band's
        // center. Full color at the center, fading to white within ~1/modulus
        // of the circle (so ~one residue is lit at a time).
        const halfWidth = (0.5 / modulus) * s.band; // ×band widens/narrows it
        let d = Math.abs(residue / modulus - s.phase);
        d = Math.min(d, 1 - d); // circular distance, 0..0.5
        let t = 1 - d / halfWidth;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        t = t * t * (3 - 2 * t); // smoothstep → quick, smooth falloff to white
        return [
          lerp(255, s.rgbHi[0], t),
          lerp(255, s.rgbHi[1], t),
          lerp(255, s.rgbHi[2], t),
        ];
      }
      default: {
        // Grayscale: 0 → white, (modulus-1) → black.
        if (modulus <= 1) return WHITE;
        const v = 255 * (1 - residue / (modulus - 1));
        return [v, v, v];
      }
    }
  }

  // Cache the raw residues so rainbow phase-cycling doesn't rebuild the whole
  // triangle every frame — only the cheap residue→color mapping re-runs. Cell
  // (n,j) lives at flat index n(n+1)/2 + j. Null = invalid params (blank).
  let residueCache: Int16Array | null = null;
  let cacheRows = -1;
  let cacheMod = -1;

  function getResidues(rows: number, modulus: number): Int16Array | null {
    if (
      !Number.isFinite(rows) ||
      !Number.isFinite(modulus) ||
      rows < 1 ||
      modulus < 1
    ) {
      return null;
    }
    if (residueCache && cacheRows === rows && cacheMod === modulus) {
      return residueCache;
    }
    const tri = computeTriangle(rows, modulus);
    const buf = new Int16Array((rows * (rows + 1)) / 2);
    let idx = 0;
    for (let n = 0; n < rows; n++) {
      for (let j = 0; j <= n; j++) buf[idx++] = tri[n][j];
    }
    residueCache = buf;
    cacheRows = rows;
    cacheMod = modulus;
    return buf;
  }

  // Build the packed [r,g,b, ...] color buffer for the current params + scheme.
  // Separating "compute colors" from "paint" is the whole trick: the animator
  // paints *interpolated* buffers.
  function computeColors(
    rows: number,
    modulus: number,
    scheme: Scheme,
  ): Float32Array | null {
    const res = getResidues(rows, modulus);
    if (!res) return null;
    const buf = new Float32Array(res.length * 3);
    for (let i = 0; i < res.length; i++) {
      const [r, g, b] = residueToRgb(res[i], modulus, scheme);
      buf[i * 3] = r;
      buf[i * 3 + 1] = g;
      buf[i * 3 + 2] = b;
    }
    return buf;
  }

  // --- Drawing --------------------------------------------------------------
  // Trace one pointy-top hexagon path and fill it with the *current* fillStyle
  // (the caller sets the color before calling — keeps this purely geometric).
  function drawHex(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
  ) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      // 60° apart, offset by -90° so a vertex points straight up.
      const angle = (Math.PI / 180) * (60 * i - 90);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Geometry only: where each hex goes and how big, for a given row count.
  // Kept separate so both static paints and animated frames share one source.
  function computeLayout(rows: number, size: number) {
    const pad = 8;
    const avail = size - pad * 2;
    // Pointy-top hexes tile so each cell's two children sit directly below-left
    // and below-right — exactly Pascal's structure. For circumradius r:
    //   horizontal center spacing = √3·r,  vertical center spacing = 1.5·r.
    // Pick the largest r that fits both the width and height of the triangle.
    const rByWidth = avail / (rows * SQRT3);
    const rByHeight = avail / (2 + (rows - 1) * 1.5);
    const r = Math.min(rByWidth, rByHeight);
    const hSpace = SQRT3 * r;
    const vSpace = 1.5 * r;
    const triH = 2 * r + (rows - 1) * vSpace;
    return {
      r,
      hSpace,
      vSpace,
      originX: size / 2, // triangle is centered horizontally
      originY: (size - triH) / 2 + r, // top row's center y
    };
  }

  // Paint every cell. `colorAt(idx, n)` hands back the CSS color for the cell at
  // flat index `idx` in row `n` — a plain buffer lookup for static paints, or an
  // interpolated value during a transition. `null` = blank canvas.
  function paint(
    rowsN: number,
    colorAt: ((idx: number, n: number) => string) | null,
  ) {
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (!colorAt || !Number.isFinite(rowsN) || rowsN < 1) return;

    const { r, hSpace, vSpace, originX, originY } = computeLayout(rowsN, SIZE);
    let idx = 0;
    for (let n = 0; n < rowsN; n++) {
      const y = originY + n * vSpace;
      for (let j = 0; j <= n; j++) {
        // Center row n on the axis: offset each cell by (j - n/2) columns.
        const x = originX + (j - n / 2) * hSpace;
        ctx.fillStyle = colorAt(idx, n);
        drawHex(ctx, x, y, r);
        idx++;
      }
    }
  }

  function rgbStr(buf: Float32Array, idx: number): string {
    const o = idx * 3;
    return `rgb(${buf[o] | 0}, ${buf[o + 1] | 0}, ${buf[o + 2] | 0})`;
  }

  // --- Animation state (plain, non-reactive — mutated imperatively) ---------
  let ctx: CanvasRenderingContext2D | null = null;
  let live: Float32Array | null = null; // colors currently on screen
  let liveRows = 0;
  let fromColors: Float32Array | null = null;
  let toColors: Float32Array | null = null;
  let animRows = 0;
  let animStartTs: number | null = null;
  let rafId: number | null = null;

  function ensureCtx() {
    if (ctx) return;
    ctx = canvas.getContext("2d")!;
    // High-DPI scaling, done once: give the buffer dpr× more pixels, then scale.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // One animation frame: interpolate every cell from→to and repaint.
  function frame(ts: number) {
    if (!fromColors || !toColors || !live) {
      rafId = null;
      return;
    }
    if (animStartTs === null) animStartTs = ts;

    const from = fromColors;
    const to = toColors;
    const cur = live;
    const n1 = animRows - 1;

    paint(animRows, (idx) => {
      // Top-to-bottom: later rows start later. stag === 0 → everyone at once.
      const start = 0;
      let cp = 1 - start;
      cp = cp < 0 ? 0 : cp > 1 ? 1 : cp;
      const e = cp * cp * (3 - 2 * cp); // smoothstep easing
      const o = idx * 3;
      const r = from[o] + (to[o] - from[o]) * e;
      const g = from[o + 1] + (to[o + 1] - from[o + 1]) * e;
      const b = from[o + 2] + (to[o + 2] - from[o + 2]) * e;
      cur[o] = r; // keep `live` current so an interrupted fade retargets smoothly
      cur[o + 1] = g;
      cur[o + 2] = b;
      return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
    });

    rafId = null;
    animStartTs = null;
  }

  function cancelRaf() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    animStartTs = null;
  }

  // Snap (instant) or fade to a precomputed target color buffer.
  function applyChange(newRows: number, target: Float32Array | null) {
    ensureCtx();
    // We can only fade if cells map 1:1 — i.e. row count is unchanged (same
    // geometry). First paint, invalid input, or a rows change → snap instead.
    const canFade =
      live !== null &&
      target !== null &&
      liveRows === newRows &&
      target.length === live.length;

    if (!canFade) {
      directPaint(newRows, target);
      return;
    }

    // Snapshot what's on screen right now as the "from" (handles interrupting a
    // fade mid-flight), aim at the new colors, and let the rAF loop run.
    fromColors = live!.slice();
    toColors = target;
    animRows = newRows;
    animStartTs = null; // restart the clock (retargets a running fade smoothly)
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  // Instant repaint, no fade — used for rainbow phase changes (scrubbing or
  // auto-cycling), where a cross-fade per step would just look laggy.
  function directPaint(newRows: number, target: Float32Array | null) {
    ensureCtx();
    cancelRaf();
    live = target;
    liveRows = newRows;
    paint(newRows, target ? (idx) => rgbStr(target, idx) : null);
  }

  // Assemble a Scheme from the current controls (parsing hex → rgb once).
  function buildScheme(ph: number): Scheme {
    return {
      mode,
      rgbA: hexToRgb(colorA),
      rgbB: hexToRgb(colorB),
      remX,
      rgbX: hexToRgb(colorX),
      rgbHi: hexToRgb(colorHi),
      band,
      phase: ph,
    };
  }

  // Keep `remX` in range 0..modulus-1 as the modulus changes.
  $effect(() => {
    const maxX = Math.max(0, modulus - 1);
    if (remX > maxX) remX = maxX;
  });

  // Stop auto-cycling if we leave a cyclable mode.
  $effect(() => {
    if (mode !== "rainbow" && mode !== "highlight" && cycling) cycling = false;
  });

  // Discrete-change trigger: fades/snaps when rows, modulus, or any *non-phase*
  // scheme setting changes. Reads phase untracked so scrubbing it doesn't fade.
  $effect(() => {
    const r = rows;
    const m = modulus;
    const scheme = buildScheme(untrack(() => phase)); // tracks mode/colors/remX
    applyChange(r, computeColors(r, m, scheme));
  });

  // Phase trigger: rainbow only. Tracks phase; reads everything else untracked
  // so it fires ONLY on phase changes, painting directly (no fade).
  $effect(() => {
    const ph = phase;
    untrack(() =>
      directPaint(rows, computeColors(rows, modulus, buildScheme(ph))),
    );
  });

  // Auto-cycle: advance `phase` 0→1 over CYCLE_MS while `cycling` is on. Setting
  // `phase` drives the phase trigger above, which repaints.
  const CYCLE_MS = 4000;
  let cycleRaf: number | null = null;
  let cycleStartTs: number | null = null;
  let cycleBase = 0;

  function cycleFrame(ts: number) {
    if (!cycling) {
      cycleRaf = null;
      return;
    }
    if (cycleStartTs === null) {
      cycleStartTs = ts;
      cycleBase = phase;
    }
    phase = (cycleBase + (ts - cycleStartTs) / CYCLE_MS) % 1;
    cycleRaf = requestAnimationFrame(cycleFrame);
  }

  $effect(() => {
    if (cycling) {
      cycleStartTs = null;
      if (cycleRaf === null) cycleRaf = requestAnimationFrame(cycleFrame);
    } else if (cycleRaf !== null) {
      cancelAnimationFrame(cycleRaf);
      cycleRaf = null;
    }
  });

  // Mount-only cleanup: cancel any in-flight animations on destroy, so no stray
  // rAF touches a dead canvas.
  $effect(() => () => {
    cancelRaf();
    if (cycleRaf !== null) cancelAnimationFrame(cycleRaf);
  });

  // Info box hover bool
  let onInfoHover = $state(false);
  let onInfoBox = $state(false);
  let showInfo = $state(false);
  let activeInfoPage = $state(0);

  function handleInfoHoverEnter() {
    onInfoHover = true;
    updateShowInfo();
  }

  function handleInfoHoverLeave() {
    onInfoHover = false;
    updateShowInfo();
  }

  function handleInfoBoxEnter() {
    onInfoBox = true;
    updateShowInfo();
  }

  function handleInfoBoxLeave() {
    onInfoBox = false;
    updateShowInfo();
  }

  function updateShowInfo() {
    if (onInfoHover || onInfoBox) {
      showInfo = true;
    } else {
      showInfo = false;
    }
  }

  function goToInfoPage(direction: -1 | 1) {
    const nextPage = activeInfoPage + direction;
    if (nextPage >= 0 && nextPage < 4) {
      activeInfoPage = nextPage;
    }
  }

  function randomHex(): string {
    const n = Math.floor(Math.random() * 0x1000000);
    return "#" + n.toString(16).padStart(6, "0");
  }

  function randomizeVars() {
    rows = Math.floor(Math.random() * 249) + 1;
    modulus = Math.floor(Math.random() * 98) + 2;
    // <option value="default">Default (grayscale)</option>
    //     <option value="gradient">Custom gradient</option>
    //     <option value="remainder">Remainder only</option>
    //     <option value="highlight">Remainder only - gradient</option>
    //     <option value="rainbow">Rainbow</option>
    const modes: Mode[] = [
      "default",
      "gradient",
      "remainder",
      "highlight",
      "rainbow",
    ];
    mode = modes[Math.floor(Math.random() * 5)];

    colorA = randomHex();
    colorB = randomHex();
    remX = Math.floor(Math.random() * modulus); // clamped by the existing $effect if out of range
    colorX = randomHex();
    colorHi = randomHex();
    band = Math.random() * 7.75 + 0.25; // matches your slider's min="0.25" max="8"
    phase = Math.random();
    cycling = Math.random() < 0.5;
  }

  function savePng() {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pascals-triangle-mod-${modulus}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }
</script>

<div class="stage">
  <aside class="controls">
    <label class="control">
      <span class="control-label">Rows</span>
      <div class="control-row">
        <!-- bind:value is Svelte's two-way binding; on range/number inputs it
             coerces to a number automatically, so `rows` stays numeric. -->
        <input type="range" min="1" max="250" bind:value={rows} />
        <input type="number" min="1" max="250" bind:value={rows} class="num" />
      </div>
    </label>

    <label class="control">
      <span class="control-label">Modulus</span>
      <div class="control-row">
        <input type="range" min="2" max="100" bind:value={modulus} />
        <input
          type="number"
          min="2"
          max="100"
          bind:value={modulus}
          class="num"
        />
      </div>
    </label>

    <label class="control">
      <span class="control-label">Coloring</span>
      <select class="select" bind:value={mode}>
        <option value="default">Default (grayscale)</option>
        <option value="gradient">Custom gradient</option>
        <option value="remainder">Remainder only</option>
        <option value="highlight">Remainder only - gradient</option>
        <option value="rainbow">Rainbow</option>
      </select>
    </label>

    {#if mode === "gradient"}
      <div class="control-row">
        <label class="swatch">
          <input type="color" bind:value={colorA} />
          <span>Start</span>
        </label>
        <label class="swatch">
          <input type="color" bind:value={colorB} />
          <span>End</span>
        </label>
      </div>
    {:else if mode === "remainder"}
      <label class="control">
        <span class="control-label-sub">Highlight residue — {remX}</span>
        <div class="control-row">
          <input
            type="range"
            min="0"
            max={Math.max(0, modulus - 1)}
            bind:value={remX}
          />
          <input
            type="number"
            min="0"
            max={Math.max(0, modulus - 1)}
            bind:value={remX}
            class="num"
          />
        </div>
      </label>
      <label class="swatch swatch--row">
        <input type="color" bind:value={colorX} />
        <span>Color</span>
      </label>
    {:else if mode === "rainbow" || mode === "highlight"}
      {#if mode === "highlight"}
        <label class="swatch swatch--row">
          <input type="color" bind:value={colorHi} />
          <span>Color</span>
        </label>
        <label class="control">
          <span class="control-label-sub">Band width — {band.toFixed(2)}×</span>
          <div class="control-row">
            <input
              type="range"
              min="0.25"
              max="8"
              step="0.05"
              bind:value={band}
            />
          </div>
        </label>
      {/if}
      <label class="control">
        <span class="control-label-sub">Cycle start — {(phase * 100) | 0}%</span
        >
        <div class="control-row">
          <input type="range" min="0" max="1" step="0.005" bind:value={phase} />
        </div>
      </label>
      <label class="checkbox-row">
        <input type="checkbox" bind:checked={cycling} />
        <span>Auto-cycle</span>
      </label>
    {/if}
  </aside>

  <canvas bind:this={canvas} style="width: {SIZE}px; height: {SIZE}px;"
  ></canvas>

  <div
    class="info-hover"
    onmouseenter={handleInfoHoverEnter}
    onmouseleave={handleInfoHoverLeave}
    role="contentinfo"
  >
    <svg
      fill="#000000"
      version="1.1"
      id="Capa_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width="25px"
      height="25px"
      viewBox="0 0 416.979 416.979"
      xml:space="preserve"
    >
      <g>
        <path
          d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85
		c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786
		c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576
		c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765
		c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"
        />
      </g>
    </svg>
    <p>What is this?</p>
  </div>

  {#snippet infoPage1()}
    <p>
      This is a visualization of <a
        href="https://en.wikipedia.org/wiki/Pascal%27s_triangle"
        target="_blank">Pascal's Triangle</a
      >
    </p>
    <p>
      Instead of showing the numbers, the cells are colored based on their
      remainder after being divided by the modulus
    </p>
    <p>
      In the default mode, a remainder of 0 is colored white, remainder
      `modulus-1` is colored black, and the other remainders are interpolated
      shades of grey in between
    </p>
    <p>
      This results in lots of beautiful fractals, including the famous <a
        href="https://en.wikipedia.org/wiki/Sierpi%C5%84ski_triangle"
        target="_blank"
        rel="noreferrer">Sierpiński Triangle!</a
      >
    </p>
  {/snippet}

  {#snippet infoPage2()}
    <h4>Remainder only</h4>
    <p>
      In this coloring mode, the only cells colored are those with the chosen
      remainder
    </p>
    <p>
      Notice how sparse it is for non-zero remainders? I wonder why that is...
    </p>
  {/snippet}

  {#snippet infoPage3()}
    <h4>Remainder only - gradient</h4>
    <p>
      Similar to the previous coloring mode, but applies color in a narrow band
      of residuals with a gradient.
    </p>
    <p>
      This allows for a smoother transition as you cycle across them. You can
      adjust the bandwidth to show more than one residual at once, as well as
      auto-cycle smoothly through the residuals.
    </p>
  {/snippet}

  {#snippet infoPage4()}
    <h4>Rainbow</h4>
    <p>
      Applies a cyclical gradient for the entire color spectrum across the
      residuals.
    </p>
    <p>
      Can also be auto-cycled. Not quite as easy to follow as the
      remainder-only, but definitely trippier!
    </p>
  {/snippet}

  {#if showInfo}
    {@const pages = [infoPage1, infoPage2, infoPage3, infoPage4]}
    <div
      class="info-box"
      onmouseenter={handleInfoBoxEnter}
      onmouseleave={handleInfoBoxLeave}
      role="contentinfo"
    >
      <div class="info-box__content">
        {@render pages[activeInfoPage]()}
      </div>

      <div class="info-box__nav" aria-label="Info box pagination">
        {#if activeInfoPage > 0}
          <button
            type="button"
            class="info-box__arrow info-box__arrow--left"
            aria-label="Previous page"
            onclick={() => goToInfoPage(-1)}
          >
            ←
          </button>
        {/if}

        {#if activeInfoPage < 3}
          <button
            type="button"
            class="info-box__arrow info-box__arrow--right"
            aria-label="Next page"
            onclick={() => goToInfoPage(1)}
          >
            →
          </button>
        {/if}
      </div>
    </div>
  {/if}
  <div class="action-buttons">
    <button class="action-button" onclick={randomizeVars}>Randomize</button>
    <button class="action-button" onclick={savePng}>Save as PNG</button>
  </div>
</div>

<style>
  /* :global() is Svelte's escape hatch to reach outside the component's scope —
     here to kill the default body margin so the toy truly fills the page. */
  :global(body) {
    margin: 0;
  }

  .stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 1.5rem;
    background: #fff;
    font-family: system-ui, sans-serif;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 200px;
  }
  .control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .control-label {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #555;
  }
  .control-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .control-row input[type="range"] {
    flex: 1;
  }
  .num {
    width: 4rem;
  }

  .select {
    font: inherit;
    font-size: 0.85rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    color: #222;
  }
  .control-label-sub {
    font-size: 0.75rem;
    color: #777;
  }
  .swatch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #555;
  }
  .swatch--row {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  .swatch input[type="color"] {
    width: 3rem;
    height: 2rem;
    padding: 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: none;
    cursor: pointer;
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #333;
  }

  .divider {
    width: 100%;
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 0;
  }

  .info-hover {
    align-self: flex-start;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .info-box {
    position: absolute;
    top: 8%;
    left: 65%;
    margin-top: 8px;
    padding: 16px 16px 52px;
    background-color: #333;
    color: #fff;
    width: 500px;
    height: 300px;
    border-radius: 6px;
    z-index: 10;
  }

  .info-box__content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 150px;
  }

  .info-box :global(p) {
    margin: 0;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.9);
  }

  .info-box :global(a) {
    color: #fff;
    text-decoration: underline;
  }

  .info-box__nav {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 14px;
    pointer-events: none;
  }

  .info-box__arrow {
    pointer-events: auto;
    /* display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px; */
    background-color: #333;
    color: #fff;
    font-size: 1.15rem;
    font-weight: 700;
    cursor: pointer;
  }

  .info-box__arrow--left {
    margin-right: auto;
  }

  .info-box__arrow--right {
    margin-left: auto;
  }

  .action-buttons {
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-button {
    font: inherit;
    font-size: 0.85rem;
  }

  /* .info-box::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -6px;
    border-width: 6px;
    border-style: solid;
    border-color: transparent transparent #333 transparent;
  } */

  canvas {
    display: block;
  }
</style>
