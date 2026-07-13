import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import { useGlobalTheme } from "../hooks/useGlobalTheme";
import { Play, Pause, StepForward, RotateCcw, Copy, Check, VolumeX, Volume2, Maximize2, Minimize2 } from "lucide-react";


const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playSound(type: "tick" | "swoosh", muted: boolean) {
  if (muted || !audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  
  if (type === "tick") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.start(now);
    osc.stop(now + 0.04);
  } else if (type === "swoosh") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

let worker: Worker | null = null;
let msgId = 0;
const callbacks = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();

function tokenizeWithWorker(snapshots: string[], lang: string): Promise<{ dark: string[], light: string[] }> {
  if (typeof window === 'undefined') {
    return Promise.resolve({ dark: snapshots, light: snapshots });
  }
  
  if (!worker) {
    worker = new Worker(new URL('../workers/shiki.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, dark, light, error } = e.data;
      const cb = callbacks.get(id);
      if (cb) {
        if (error) cb.reject(new Error(error));
        else cb.resolve({ dark, light });
        callbacks.delete(id);
      }
    };
  }
  
  return new Promise((resolve, reject) => {
    const id = msgId++;
    callbacks.set(id, { resolve, reject });
    worker!.postMessage({ id, snapshots, lang });
  });
}

function detectLang(code: string): string {
  const t = code.trim();
  if (
    /\b(import|export|const|let|var|function|=>|async|await|require)\b/.test(t)
  )
    return "javascript";
  if (/^(type|interface|enum)\s/.test(t) || /\b(interface|type|as)\b/.test(t))
    return "typescript";
  if (
    /\b(class|public|private|namespace|using|void|string|int|var|decimal|bool)\b/.test(
      t,
    )
  )
    return "csharp";
  if (/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE)\b/i.test(t))
    return "sql";
  if (/^\s*</.test(t) || /<(div|span|html|head|body)/i.test(t)) return "html";
  if (t.startsWith("{") || t.startsWith("[")) return "json";
  if (/^#/.test(t) || /\b(def|print|return)\b/.test(t)) return "python";
  return "text";
}



interface TokenRect {
  text: string;
  rect: DOMRect;
  color: string;
  weight: string;
  idx: number;
}

interface AnimLayer {
  layer: HTMLElement;
  wr: DOMRect;
  pos: (r: DOMRect) => { left: number; top: number };
  add: (el: HTMLElement) => HTMLElement;
  anims: Animation[];
}

interface CodeMorphBlockProps {
  code: string;
  anim?: string;
  delay?: number;
}

export type AnimMode =
  | "morph"
  | "fade"
  | "flip"
  | "diff"
  | "flight"
  | "typewriter"
  | "highlight"
  | "scroll"
  | "blur"
  | "slide"
  | "zoom"
  | "glitch"
  | "erase"
  | "matrix"
  | "explode";

const ANIM_MODES: { key: AnimMode; label: string; desc: string }[] = [
  {
    key: "morph",
    label: "Morph",
    desc: "Tokens glide to new positions (HyperFrames)",
  },
  { key: "fade", label: "Fade", desc: "Cross-fade between old and new" },
  { key: "flip", label: "Flip", desc: "3D card flip rotation" },
  { key: "diff", label: "Diff", desc: "Line-level diff with collapse/expand" },
  { key: "flight", label: "Flight", desc: "Lines fly in from left staggered" },
  {
    key: "typewriter",
    label: "Typewriter",
    desc: "Per-character reveal with caret",
  },
  {
    key: "highlight",
    label: "Highlight",
    desc: "Line highlight box, dim others",
  },
  { key: "scroll", label: "Scroll", desc: "Scroll to target line + highlight" },
  { key: "blur", label: "Blur", desc: "Cinematic out-of-focus crossfade" },
  { key: "slide", label: "Slide", desc: "Carousel slide transition" },
  { key: "zoom", label: "Zoom", desc: "Z-axis depth scaling" },
  { key: "glitch", label: "Glitch", desc: "Cyberpunk neon scramble" },
  { key: "erase", label: "Erase", desc: "Realistic backspace and re-type" },
  { key: "matrix", label: "Matrix", desc: "Digital rain character cascade" },
  { key: "explode", label: "Explode", desc: "Tokens scatter outwards" },
];

function ensureStyles() {
  if (typeof document === "undefined") return;
  const styleId = "cm-block-styles";
  let style = document.getElementById(styleId) as HTMLStyleElement;
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.innerHTML = `
    .cm-wrapper { position:relative;transition:height 0.35s ease-out;transform-origin:top; }
    .cm-tok { white-space: pre; display: inline; }
    .cm-stage { counter-reset: cm-line-no; }
    .cm-line { display: block; white-space: pre; position: relative; padding-left: 2.5rem; counter-increment: cm-line-no; font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; line-height: 1.6; transition: opacity 0.2s ease; }
    .cm-line::before { content: counter(cm-line-no); position: absolute; left: 0; top: 0; width: 1.8rem; text-align: right; padding-right: 0.6rem; font-size: 12px; color: var(--text-muted); opacity: 0.45; font-variant-numeric: tabular-nums; user-select: none; pointer-events: none; }
    .cm-line:hover::before { opacity: 0.8; color: var(--accent); }
    .cm-line:hover { opacity: 1 !important; }
    .cm-dropdown { position:absolute;top:100%;left:0;margin-top:4px;min-width:150px;max-height:320px;overflow-y:auto;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);box-shadow:0 8px 24px rgba(0,0,0,0.3);z-index:50; }
    .cm-dropdown button { display:flex;flex-direction:column;width:100%;text-align:left;padding:6px 10px;font-size:11px;border:none;background:none;cursor:pointer;color:var(--text-primary); }
    .cm-dropdown button:hover { background:rgba(255,255,255,0.08); }
    .cm-dropdown button.active { background:rgba(255,255,255,0.05); }
    .cm-dropdown button .lbl { font-size:11px;font-weight:600; }
    .cm-dropdown button.active .lbl { color:var(--accent); }
    .cm-dropdown button .dsc { font-size:9px;color:var(--text-muted);margin-top:1px; }
    .cm-diff-del { background:rgba(248,81,73,0.12); box-shadow:inset 3px 0 #f85149; }
    .cm-diff-add { background:rgba(63,185,80,0.12); box-shadow:inset 3px 0 #3fb950; }
    .cm-diff-sign { display:inline-block;width:32px;padding-left:16px;user-select:none; }
    .cm-diff-del .cm-diff-sign { color:#f85149; }
    .cm-diff-add .cm-diff-sign { color:#3fb950; }
    .cm-highlight-box { position:absolute;background:rgba(88,166,255,0.16);border-left:3px solid #58a6ff;border-radius:6px;pointer-events:none; }
    .cm-caret { position:absolute;width:2px;background:#58a6ff;border-radius:1px;pointer-events:none; }
    @keyframes cm-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes cm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  `;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}



function measureTokens(wrapper: HTMLElement, html: string): TokenRect[] {
  wrapper.innerHTML = html;
  void wrapper.offsetHeight;
  return Array.from(wrapper.querySelectorAll(".cm-tok")).map((el, i) => {
    const h = el as HTMLElement;
    return {
      text: h.textContent || "",
      rect: h.getBoundingClientRect(),
      color: getComputedStyle(h).color,
      weight: getComputedStyle(h).fontWeight,
      idx: i,
    };
  });
}

function matchByKey(from: TokenRect[], to: TokenRect[]) {
  const fromByText = new Map<string, TokenRect[]>();
  for (const f of from) {
    const arr = fromByText.get(f.text) || [];
    arr.push(f);
    fromByText.set(f.text, arr);
  }
  const used = new Set<number>();
  const matched: Array<{ f: TokenRect; t: TokenRect }> = [];
  const entering: TokenRect[] = [];
  for (const t of to) {
    const arr = fromByText.get(t.text);
    if (arr) {
      const f = arr.find((c) => !used.has(c.idx));
      if (f) {
        used.add(f.idx);
        matched.push({ f, t });
        continue;
      }
    }
    entering.push(t);
  }
  const leaving = from.filter((f) => !used.has(f.idx));
  return { matched, leaving, entering };
}

function buildAnimLayer(wrapper: HTMLElement, anims: Animation[]): AnimLayer {
  wrapper.style.position = "relative";
  const layer = document.createElement("div");
  layer.style.cssText =
    "position:absolute;inset:0;pointer-events:none;font-family:JetBrains Mono,Fira Code,Cascadia Code,Consolas,monospace;font-size:inherit;line-height:1.6;font-variant-ligatures:none";
  wrapper.appendChild(layer);
  const wr = wrapper.getBoundingClientRect();
  const pos = (r: DOMRect) => ({ left: r.left - wr.left, top: r.top - wr.top });
  const add = (el: HTMLElement) => {
    layer.appendChild(el);
    return el;
  };
  return { layer, wr, pos, add, anims };
}

// ── HyperFrames-accurate animations ──

function animMorph(m: AnimLayer, matched: ReturnType<typeof matchByKey>) {
  // 1. Tokens glide between positions with a highly polished spring easing and color morph
  matched.matched.forEach(({ f, t }, i) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${t.weight};white-space:pre;will-change:transform,color`;
    const dx = t.rect.left - f.rect.left,
      dy = t.rect.top - f.rect.top;
    
    // Slight stagger for a cascading effect
    const delay = Math.min(i * 1.5, 120);

    m.anims.push(
      el.animate(
        [
          { transform: `translate3d(0,0,0)`, color: f.color },
          { transform: `translate3d(${dx}px,${dy}px,0)`, color: t.color },
        ],
        {
          duration: 750,
          delay: delay,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Snappy, elegant elastic spring
          fill: "both",
        },
      ),
    );
  });

  // 2. Leavers drop down slightly and fade out
  matched.leaving.forEach((f, i) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:transform,opacity`;
    
    const delay = Math.min(i * 2, 100);
    
    m.anims.push(
      el.animate(
        [
          { opacity: 1, transform: "translateY(0) scale(1)" },
          { opacity: 0, transform: "translateY(10px) scale(0.95)" }
        ], 
        {
          duration: 400,
          delay: delay,
          easing: "ease-in",
          fill: "both",
        }
      ),
    );
  });

  // 3. Enterers rise up and fade in
  matched.entering.forEach((t, i) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:transform,opacity`;
    
    const delay = Math.min(i * 2.5, 150) + 100; // Start slightly after leavers
    
    m.anims.push(
      el.animate(
        [
          { opacity: 0, transform: "translateY(-10px) scale(0.95)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ], 
        {
          duration: 550,
          delay: delay,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)", // Smooth deceleration
          fill: "both",
        }
      ),
    );
  });
}

function animFade(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach((f) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`;
    m.anims.push(
      el.animate(
        [{ opacity: 1 }, { opacity: 0, transform: "translate3d(0,-8px,0)" }],
        {
          duration: 300,
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          fill: "both",
        },
      ),
    );
  });
  to.forEach((t) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`;
    m.anims.push(
      el.animate(
        [
          { opacity: 0, transform: "translate3d(0,8px,0)" },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        {
          duration: 400,
          easing: "cubic-bezier(0, 0, 0.2, 1)",
          fill: "both",
          delay: 200,
        },
      ),
    );
  });
}

function animFlip(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  const both = [...from, ...to];
  const l = Math.min(...both.map((r) => r.rect.left)),
    t = Math.min(...both.map((r) => r.rect.top));
  const r = Math.max(...both.map((r) => r.rect.right)),
    b = Math.max(...both.map((r) => r.rect.bottom));
  const fw = r - l + 40,
    fh = b - t + 40;
  const cx = (l + r) / 2 - m.wr.left,
    cy = (t + b) / 2 - m.wr.top;
  const card = m.add(
    Object.assign(document.createElement("div"), { className: "cm-flip-card" }),
  );
  card.style.cssText = `position:absolute;left:${cx - fw / 2}px;top:${cy - fh / 2}px;width:${fw}px;height:${fh}px;perspective:1400px`;
  const inner = document.createElement("div");
  inner.style.cssText =
    "width:100%;height:100%;position:relative;transform-style:preserve-3d;will-change:transform";
  card.appendChild(inner);
  const front = document.createElement("div");
  front.style.cssText =
    "position:absolute;inset:0;backface-visibility:hidden;background:var(--bg-primary);border-radius:8px";
  from.forEach((f) => {
    const p = m.pos(f.rect);
    const s = Object.assign(document.createElement("span"), {
      textContent: f.text,
    });
    s.style.cssText = `position:absolute;left:${p.left - (cx - fw / 2)}px;top:${p.top - (cy - fh / 2)}px;color:${f.color};font-weight:${f.weight};white-space:pre`;
    front.appendChild(s);
  });
  inner.appendChild(front);
  const back = document.createElement("div");
  back.style.cssText =
    "position:absolute;inset:0;backface-visibility:hidden;transform:rotateX(180deg);background:var(--bg-primary);border-radius:8px";
  to.forEach((t) => {
    const p = m.pos(t.rect);
    const s = Object.assign(document.createElement("span"), {
      textContent: t.text,
    });
    s.style.cssText = `position:absolute;left:${p.left - (cx - fw / 2)}px;top:${p.top - (cy - fh / 2)}px;color:${t.color};font-weight:${t.weight};white-space:pre`;
    back.appendChild(s);
  });
  inner.appendChild(back);
  m.anims.push(
    inner.animate(
      [
        { transform: "rotateX(0deg) scale(1)" },
        { transform: "rotateX(90deg) scale(0.92)", offset: 0.5 },
        { transform: "rotateX(180deg) scale(1)" },
      ],
      {
        duration: 800,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "both",
      },
    ),
  );
}

interface DiffOp {
  type: "same" | "del" | "add";
  text: string;
}

function lineDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length,
    m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (const i of Array.from({ length: n }).map((_, i) => n - 1 - i))
    for (const j of Array.from({ length: m }).map((_, i) => m - 1 - i))
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: DiffOp[] = [];
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", text: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", text: a[i] });
      i++;
    } else {
      ops.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "del", text: a[i++] });
  while (j < m) ops.push({ type: "add", text: b[j++] });
  return ops;
}

function animDiff(
  m: AnimLayer,
  _from: TokenRect[],
  _to: TokenRect[],
  fromHtml: string,
  toHtml: string,
  wrapper: HTMLElement,
  _cb: () => void,
) {
  const fromLines = fromHtml.match(/<div class="cm-line">.*?<\/div>/g) || [];
  const toLines = toHtml.match(/<div class="cm-line">.*?<\/div>/g) || [];
  const lineText = (h: string) =>
    h
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  const lineInner = (h: string) =>
    h.replace(/^<div class="cm-line">/, "").replace(/<\/div>$/, "");

  const ops = lineDiff(fromLines.map(lineText), toLines.map(lineText));
  const lineH = 26;

  wrapper.innerHTML = "";
  const delEls: HTMLElement[] = [];
  const addEls: HTMLElement[] = [];
  const allEls: HTMLElement[] = [];
  let fi = 0,
    ti = 0;

  ops.forEach((op) => {
    const ln = document.createElement("div");
    ln.className =
      "cm-line" +
      (op.type === "del"
        ? " cm-diff-del"
        : op.type === "add"
          ? " cm-diff-add"
          : "");
    const sign = document.createElement("span");
    sign.className = "cm-diff-sign";
    sign.textContent =
      op.type === "del" ? "- " : op.type === "add" ? "+ " : "  ";
    ln.appendChild(sign);

    let innerHtml = "";
    if (op.type === "del") {
      innerHtml = fromLines[fi] ? lineInner(fromLines[fi]) : "";
      fi++;
    } else if (op.type === "add") {
      innerHtml = toLines[ti] ? lineInner(toLines[ti]) : "";
      ti++;
    } else {
      innerHtml = toLines[ti] ? lineInner(toLines[ti]) : "";
      fi++;
      ti++;
    }

    const inner = document.createElement("span");
    inner.innerHTML = innerHtml;
    ln.appendChild(inner);
    wrapper.appendChild(ln);
    allEls.push(ln);
    if (op.type === "del") {
      delEls.push(ln);
      ln.style.overflow = "hidden";
    } else if (op.type === "add") {
      addEls.push(ln);
      ln.style.overflow = "hidden";
    }
  });

  void wrapper.offsetHeight;
  const totalHeight = wrapper.scrollHeight;
  wrapper.style.minHeight = `${totalHeight}px`;
  wrapper.innerHTML = "";

  allEls.forEach((el) => wrapper.appendChild(el));
  void wrapper.offsetHeight;

  const addH = addEls.map((el) => el.scrollHeight || lineH);

  delEls.forEach((el, i) => {
    m.anims.push(
      el.animate([{ backgroundColor: "transparent" }, { backgroundColor: "rgba(255, 99, 71, 0.15)" }], {
        duration: 300,
        easing: "ease-in",
        fill: "both",
        delay: i * 60,
      }),
    );
  });

  addEls.forEach((el, i) => {
    const h = addH[i];
    el.style.height = "0px";
    el.style.opacity = "0";
    m.anims.push(
      el.animate(
        [
          { height: "0px", opacity: 0, backgroundColor: "transparent" },
          { height: `${h}px`, opacity: 1, backgroundColor: "rgba(46, 204, 113, 0.15)" },
        ],
        {
          duration: 350,
          easing: "ease-out",
          fill: "both",
          delay: 350 + i * 80,
        },
      ),
    );
  });
}

function animFlight(
  m: AnimLayer,
  _from: TokenRect[],
  _to: TokenRect[],
  fromHtml: string,
  toHtml: string,
  wrapper: HTMLElement,
) {
  const fromLines = fromHtml.match(/<div class="cm-line">.*?<\/div>/g) || [];
  const toLines = toHtml.match(/<div class="cm-line">.*?<\/div>/g) || [];
  wrapper.innerHTML = "";

  const oldBlocks: HTMLElement[] = [];
  const newBlocks: HTMLElement[] = [];

  fromLines.forEach((h) => {
    const blk = document.createElement("div");
    blk.style.cssText =
      "position:absolute;white-space:pre;border-radius:8px;padding:4px 10px;background:var(--bg-card);border:1px solid var(--border);font-size:inherit;line-height:1.6;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,0.1)";
    blk.innerHTML = h;
    wrapper.appendChild(blk);
    oldBlocks.push(blk);
  });

  toLines.forEach((h) => {
    const blk = document.createElement("div");
    blk.style.cssText =
      "position:absolute;white-space:pre;border-radius:8px;padding:4px 10px;background:var(--bg-card);border:1px solid var(--border);font-size:inherit;line-height:1.6;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,0.1);opacity:0";
    blk.innerHTML = h;
    wrapper.appendChild(blk);
    newBlocks.push(blk);
  });

  void wrapper.offsetHeight;
  let maxW = 0;
  [...oldBlocks, ...newBlocks].forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.width > maxW) maxW = r.width;
  });
  [...oldBlocks, ...newBlocks].forEach((b) => {
    b.style.width = maxW + "px";
  });
  void wrapper.offsetHeight;

  const GAP = 8;
  const lineH = parseInt(getComputedStyle(wrapper).lineHeight) || 26;
  const n = Math.max(oldBlocks.length, newBlocks.length);
  const stackH = n * lineH + (n - 1) * GAP + 16;

  wrapper.style.height = `${stackH}px`;
  wrapper.style.position = "relative";

  oldBlocks.forEach((blk, i) => {
    blk.style.top = `${i * (lineH + GAP) + 8}px`;
  });
  newBlocks.forEach((blk, i) => {
    blk.style.top = `${i * (lineH + GAP) + 8}px`;
  });

  const flyDist = maxW + 100;

  oldBlocks.forEach((blk, i) => {
    m.anims.push(
      blk.animate(
        [
          { transform: "translate3d(0,0,0)", opacity: 1 },
          { transform: `translate3d(${flyDist}px,0,0)`, opacity: 0 },
        ],
        {
          duration: 400,
          easing: "cubic-bezier(0.36, 0, 0.66, -0.56)",
          fill: "both",
          delay: i * 50,
        },
      ),
    );
  });

  newBlocks.forEach((blk, i) => {
    m.anims.push(
      blk.animate(
        [
          { transform: `translate3d(-${flyDist}px,0,0)`, opacity: 0 },
          { transform: "translate3d(0,0,0)", opacity: 1 },
        ],
        {
          duration: 500,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          fill: "both",
          delay: 300 + i * 50,
        },
      ),
    );
  });
}

function animTypewriter(
  m: AnimLayer,
  from: TokenRect[],
  _to: TokenRect[],
  toHtml: string,
  wrapper: HTMLElement,
) {
  const unesc = (s: string) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const toHtmlChar = toHtml.replace(
    /<span class="cm-tok"[^>]*>([^<]+)<\/span>/g,
    (_, txt) =>
      [...unesc(txt)]
        .map((ch) =>
          ch === " "
            ? '<span class="cm-tok">&nbsp;</span>'
            : `<span class="cm-tok">${esc(ch)}</span>`,
        )
        .join(""),
  );
  wrapper.innerHTML = toHtmlChar;
  void wrapper.offsetHeight;

  const wr = wrapper.getBoundingClientRect();
  const charEls = Array.from(
    wrapper.querySelectorAll(".cm-tok"),
  ) as HTMLElement[];

  charEls.forEach((el) => {
    el.style.opacity = "0";
  });

  const caret = document.createElement("div");
  caret.className = "cm-caret";
  caret.style.animation = "cm-blink 0.8s step-end infinite";
  const firstRect = charEls[0]?.getBoundingClientRect();
  if (firstRect) {
    caret.style.cssText += `;left:${firstRect.left - wr.left}px;top:${firstRect.top - wr.top}px;height:${firstRect.height}px`;
  }
  m.layer.appendChild(caret);

  let currentDelay = 0;
  charEls.forEach((el, i) => {
    const isSpace = el.textContent === " " || el.textContent === "\u00A0";
    const isPunctuation = /[,.;(){}\[\]]/.test(el.textContent || "");
    const baseDelay = isSpace
      ? 10
      : isPunctuation
        ? 80 + Math.random() * 50
        : 20 + Math.random() * 40;
    const charDelay = baseDelay / 10;

    m.anims.push(
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 10,
        easing: "ease-out",
        fill: "both",
        delay: currentDelay,
      }),
    );

    const r = el.getBoundingClientRect();
    const x = r.right - wr.left;
    const y = r.top - wr.top;
    const isLast = i === charEls.length - 1;
    m.anims.push(
      caret.animate([{ left: `${x}px`, top: `${y}px` }], {
        duration: isLast ? 1 : charDelay,
        easing: "steps(1)",
        fill: "both",
        delay: currentDelay,
      }),
    );

    currentDelay += charDelay;
  });

  from.forEach((f) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre`;
    m.anims.push(
      el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        easing: "ease-in-out",
        fill: "both",
      }),
    );
  });
}

function animHighlight(
  m: AnimLayer,
  toHtml: string,
  wrapper: HTMLElement,
  targetIndicesRaw: number[] | null,
) {
  wrapper.innerHTML = toHtml;
  void wrapper.offsetHeight;

  const lines = wrapper.querySelectorAll(".cm-line");
  if (!lines.length) return;

  let targetIndices =
    targetIndicesRaw && targetIndicesRaw.length > 0
      ? targetIndicesRaw.map((i) => i - 1)
      : [Math.floor(lines.length / 2)];
  targetIndices = targetIndices.map((idx) =>
    Math.max(0, Math.min(idx, lines.length - 1)),
  );

  const targetLines = targetIndices.map((idx) => lines[idx] as HTMLElement);
  const rects = targetLines.map((l) => l.getBoundingClientRect());
  const wr = wrapper.getBoundingClientRect();

  const minTop = Math.min(...rects.map((r) => r.top));
  const maxBottom = Math.max(...rects.map((r) => r.bottom));
  const maxWidth = Math.max(...rects.map((r) => r.width));
  const minLeft = Math.min(...rects.map((r) => r.left));

  const box = document.createElement("div");
  box.className = "cm-highlight-box";
  box.style.left = `${minLeft - wr.left - 8}px`;
  box.style.top = `${minTop - wr.top - 2}px`;
  box.style.width = "0px";
  box.style.height = `${maxBottom - minTop + 4}px`;
  box.style.opacity = "0";
  box.style.animation = "cm-pulse 2.5s ease-in-out infinite alternate";
  box.style.animationDelay = "0.7s";
  wrapper.insertBefore(box, wrapper.firstChild);

  const otherLines = Array.from(lines).filter(
    (_, i) => !targetIndices.includes(i),
  );
  otherLines.forEach((el, i) => {
    m.anims.push(
      (el as HTMLElement).animate([{ opacity: 1 }, { opacity: 0.3 }], {
        duration: 400,
        easing: "ease-out",
        fill: "both",
        delay: Math.min(i * 15, 600),
      }),
    );
  });

  m.anims.push(
    box.animate(
      [
        { width: "0px", opacity: "0" },
        { width: `${maxWidth + 18}px`, opacity: "1" },
      ],
      {
        duration: 500,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
        delay: 200,
      },
    ),
  );
}

function animScroll(
  m: AnimLayer,
  toHtml: string,
  wrapper: HTMLElement,
  targetIndicesRaw: number[] | null,
) {
  wrapper.innerHTML = toHtml;
  void wrapper.offsetHeight;

  const lines = wrapper.querySelectorAll(".cm-line");
  if (!lines.length) return;

  let targetIndices =
    targetIndicesRaw && targetIndicesRaw.length > 0
      ? targetIndicesRaw.map((i) => i - 1)
      : [Math.floor(lines.length / 2)];
  targetIndices = targetIndices.map((idx) =>
    Math.max(0, Math.min(idx, lines.length - 1)),
  );

  const targetLines = targetIndices.map((idx) => lines[idx] as HTMLElement);
  const rects = targetLines.map((l) => l.getBoundingClientRect());
  const wr = wrapper.getBoundingClientRect();
  const surfRect = wrapper.parentElement?.getBoundingClientRect() || wr;

  const minTop = Math.min(...rects.map((r) => r.top));
  const maxBottom = Math.max(...rects.map((r) => r.bottom));
  const maxWidth = Math.max(...rects.map((r) => r.width));
  const minLeft = Math.min(...rects.map((r) => r.left));

  const blockCenter = minTop + (maxBottom - minTop) / 2 - wr.top;

  let dy = surfRect.height / 2 - blockCenter;

  const minDy = surfRect.height - wr.height;
  const maxDy = 0;

  if (minDy >= 0) {
    dy = 0;
  } else {
    dy = Math.max(minDy, Math.min(maxDy, dy));
  }

  const box = document.createElement("div");
  box.className = "cm-highlight-box";
  box.style.left = `${minLeft - wr.left - 8}px`;
  box.style.top = `${minTop - wr.top - 2}px`;
  box.style.width = `${maxWidth + 18}px`;
  box.style.height = `${maxBottom - minTop + 4}px`;
  box.style.opacity = "0";
  box.style.animation = "cm-pulse 2.5s ease-in-out infinite alternate";
  box.style.animationDelay = "0.85s";
  wrapper.insertBefore(box, wrapper.firstChild);

  const otherLines = Array.from(lines).filter(
    (_, i) => !targetIndices.includes(i),
  );
  otherLines.forEach((el, i) => {
    m.anims.push(
      (el as HTMLElement).animate([{ opacity: 1 }, { opacity: 0.3 }], {
        duration: 350,
        easing: "ease-out",
        fill: "both",
        delay: Math.min(500 + i * 15, 1100),
      }),
    );
  });

  m.anims.push(
    wrapper.animate(
      [{ transform: "translateY(0)" }, { transform: `translateY(${dy}px)` }],
      {
        duration: 600,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        fill: "both",
      },
    ),
  );

  m.anims.push(
    box.animate([{ opacity: "0" }, { opacity: "1" }], {
      duration: 300,
      easing: "ease-out",
      fill: "both",
      delay: 550,
    }),
  );
}

type AnimFn = (m: AnimLayer, ...args: any[]) => void;

function animBlur(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach((f) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,filter`;
    m.anims.push(
      el.animate(
        [
          { opacity: 1, filter: "blur(0px)" },
          { opacity: 0, filter: "blur(8px)" },
        ],
        { duration: 600, easing: "ease-in-out", fill: "both" },
      ),
    );
  });
  to.forEach((t) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,filter`;
    m.anims.push(
      el.animate(
        [
          { opacity: 0, filter: "blur(8px)" },
          { opacity: 1, filter: "blur(0px)" },
        ],
        { duration: 600, easing: "ease-in-out", fill: "both" },
      ),
    );
  });
}

function animSlide(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach((f) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`;
    m.anims.push(
      el.animate(
        [
          { opacity: 1, transform: "translate3d(0,0,0)" },
          { opacity: 0, transform: "translate3d(-50px,0,0)" },
        ],
        {
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    );
  });
  to.forEach((t) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`;
    m.anims.push(
      el.animate(
        [
          { opacity: 0, transform: "translate3d(50px,0,0)" },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        {
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    );
  });
}

function animZoom(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach((f) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform;transform-origin:center`;
    m.anims.push(
      el.animate(
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0.8)" },
        ],
        {
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    );
  });
  to.forEach((t) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform;transform-origin:center`;
    m.anims.push(
      el.animate(
        [
          { opacity: 0, transform: "scale(1.2)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        {
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    );
  });
}

function animGlitch(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach((f) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`;
    m.anims.push(
      el.animate(
        [
          { opacity: 1, transform: "translate(0)" },
          { opacity: 0.8, transform: "translate(-2px, 1px)", color: "#0ff" },
          { opacity: 0.9, transform: "translate(2px, -1px)", color: "#f0f" },
          { opacity: 0.5, transform: "translate(-1px, 2px)", color: "#f0f" },
          { opacity: 0, transform: "translate(1px, -2px)" },
        ],
        { duration: 300, easing: "steps(4, end)", fill: "both" },
      ),
    );
  });
  to.forEach((t) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`;
    m.anims.push(
      el.animate(
        [
          { opacity: 0, transform: "translate(-2px, 2px)", color: "#0ff" },
          { opacity: 0.8, transform: "translate(2px, -2px)", color: "#f0f" },
          { opacity: 0.5, transform: "translate(-1px, 1px)", color: "#0ff" },
          { opacity: 0.9, transform: "translate(1px, -1px)" },
          { opacity: 1, transform: "translate(0)", color: t.color },
        ],
        {
          duration: 300,
          easing: "steps(4, end)",
          fill: "both",
          delay: 200,
        },
      ),
    );
  });
}

function animErase(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  const maxDelayFrom = from.length * 5;
  from.reverse().forEach((f, i) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;`;
    m.anims.push(
      el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 1,
        delay: i * 5,
        fill: "both",
      }),
    );
  });
  to.forEach((t, i) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;opacity:0`;
    m.anims.push(
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 1,
        delay: maxDelayFrom + 100 + i * 5,
        fill: "both",
      }),
    );
  });
}

function animMatrix(
  m: AnimLayer,
  _from: TokenRect[],
  to: TokenRect[],
  _toHtml?: string,
) {
  const layer = m.layer;
  const cssW = layer.clientWidth || 320;
  const cssH = layer.clientHeight || 200;
  const fontSize = Math.max(
    10,
    parseFloat(getComputedStyle(layer).fontSize) || 14,
  );
  const DURATION = 1500;
  const chars =
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789=+-*/<>{}[]()/$#";
  const randGlyph = () => chars[(Math.random() * chars.length) | 0];

  // Theme colors so the rain blends with the app (dark or light).
  const rootStyle = getComputedStyle(document.documentElement);
  const accent = rootStyle.getPropertyValue("--accent").trim() || "#22d3ee";
  const bg = rootStyle.getPropertyValue("--bg-primary").trim() || "#0b0f17";

  // Build one cell per target character, positioned at its real code
  // location. Each starts as a scrambling matrix glyph and "locks" into its
  // real character (in its syntax color) — left to right — so the rain
  // visibly decrypts into the next snapshot's code.
  const cells: {
    x: number;
    y: number;
    ch: string;
    color: string;
    settled: boolean;
    g: string;
    settleAt: number;
  }[] = [];
  let maxX = 1;
  for (const t of to) {
    const text = t.text;
    if (!text) continue;
    const cw = (t.rect.width || text.length * fontSize) / Math.max(1, text.length);
    const p = m.pos(t.rect);
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const x = p.left + i * cw;
      if (x > maxX) maxX = x;
      cells.push({
        x,
        y: p.top,
        ch,
        color: t.color,
        settled: false,
        g: randGlyph(),
        settleAt: 0,
      });
    }
  }
  cells.sort((a, b) => a.x - b.x || a.y - b.y);
  cells.forEach((c) => {
    c.settleAt = (c.x / maxX) * (DURATION * 0.7) + Math.random() * 160;
  });

  // Faint falling-rain ambiance behind the decrypt.
  const cols = Math.max(1, Math.floor(cssW / fontSize));
  const drops = new Array(cols)
    .fill(0)
    .map(() => Math.floor((Math.random() * cssH) / fontSize) * -1);

  const canvas = m.add(document.createElement("canvas")) as HTMLCanvasElement;
  canvas.style.cssText = `position:absolute;inset:0;opacity:1;filter:drop-shadow(0 0 6px ${accent})`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.font = `${fontSize}px JetBrains Mono, Fira Code, Cascadia Code, Consolas, monospace`;
  ctx.textBaseline = "top";

  const draw = (elapsed: number) => {
    // Trail fade in the theme background.
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.globalAlpha = 1;

    // Ambient columns.
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < cols; i++) {
      const ch = randGlyph();
      ctx.fillStyle = accent;
      ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > cssH && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 1;
    }
    ctx.globalAlpha = 1;

    // Decrypt grid: matrix glyphs locking into the real code.
    for (const c of cells) {
      if (!c.settled && elapsed >= c.settleAt) c.settled = true;
      if (c.settled) {
        if (c.ch.trim()) {
          ctx.fillStyle = c.color;
          ctx.fillText(c.ch, c.x, c.y);
        }
      } else if (c.ch.trim()) {
        if (Math.random() < 0.25) c.g = randGlyph();
        ctx.fillStyle = accent;
        ctx.fillText(c.g, c.x, c.y);
      }
    }
  };

  let raf = 0;
  let stopped = false;
  const startT = performance.now();
  const frame = (now: number) => {
    if (stopped) return;
    draw(now - startT);
    if (now - startT < DURATION) raf = requestAnimationFrame(frame);
    else stop();
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
  };
  raf = requestAnimationFrame(frame);

  // Sentinel keeps runMorph awaiting until the decrypt finishes and cancels
  // the rAF loop on scrub/cancel. (runMorph then swaps in the real toHtml,
  // which now matches what the canvas already shows.)
  m.anims.push({
    playState: "running",
    play() {},
    pause() {},
    cancel: stop,
    get finished() {
      return new Promise<void>((res) => {
        const check = () => (stopped ? res() : setTimeout(check, 50));
        check();
      });
    },
  } as unknown as Animation);
}

function animExplode(m: AnimLayer, from: TokenRect[], to: TokenRect[]) {
  from.forEach((f) => {
    const fp = m.pos(f.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: f.text }),
    );
    el.style.cssText = `position:absolute;left:${fp.left}px;top:${fp.top}px;color:${f.color};font-weight:${f.weight};white-space:pre;will-change:opacity,transform`;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    m.anims.push(
      el.animate(
        [
          { opacity: 1, transform: "translate3d(0,0,0) rotate(0deg)" },
          {
            opacity: 0,
            transform: `translate3d(${dx}px,${dy}px,0) rotate(${(Math.random() - 0.5) * 180}deg)`,
          },
        ],
        {
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    );
  });
  to.forEach((t) => {
    const tp = m.pos(t.rect);
    const el = m.add(
      Object.assign(document.createElement("span"), { textContent: t.text }),
    );
    el.style.cssText = `position:absolute;left:${tp.left}px;top:${tp.top}px;color:${t.color};font-weight:${t.weight};white-space:pre;will-change:opacity,transform`;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    m.anims.push(
      el.animate(
        [
          {
            opacity: 0,
            transform: `translate3d(${dx}px,${dy}px,0) rotate(${(Math.random() - 0.5) * 180}deg)`,
          },
          { opacity: 1, transform: "translate3d(0,0,0) rotate(0deg)" },
        ],
        {
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    );
  });
}

const ANIM_FNS: Record<AnimMode, AnimFn> = {
  morph: animMorph,
  fade: animFade,
  flip: animFlip,
  diff: animDiff,
  flight: animFlight,
  typewriter: animTypewriter,
  highlight: animHighlight,
  scroll: animScroll,
  blur: animBlur,
  slide: animSlide,
  zoom: animZoom,
  glitch: animGlitch,
  erase: animErase,
  matrix: animMatrix,
  explode: animExplode,
};

export default function CodeMorphBlock({
  code,
  anim: initialAnim = "morph",
}: CodeMorphBlockProps) {
  const { theme: globalTheme } = useGlobalTheme();
  // Keep the FULL list of `---` separated snapshots so the player can step
  // through every state in order (not just a single before/after pair).

  // Parse annotations out of the raw code blocks (lines starting with // !)
  const { cleanSnapshots, allAnnotations } = useMemo(() => {
    const rawParts = code.split("---").map((p) => p.trim()).filter(Boolean);
    const raws = rawParts.length ? rawParts : [code.trim()];
    const allAnnotations: { lineIndex: number; text: string }[][] = [];
    const cleanSnapshots: string[] = [];

    raws.forEach(raw => {
        const lines = raw.split("\n");
        const cleanLines: string[] = [];
        const annotations: { lineIndex: number; text: string }[] = [];
        
        lines.forEach(line => {
            // Check for line-level annotations like `# !callout(...)`, `// !callout(...)`, `<!-- !callout(...) -->`, or `// ! ...`
            const calloutMatch = line.match(/^\s*(?:\/\/|#|<!--)\s*!callout\((.*?)\)(?:\s*-->)?\s*$/)
                              || line.match(/^\s*(?:\/\/|#|<!--)\s*!\s+(.*?)(?:\s*-->)?\s*$/);
            
            if (calloutMatch) {
                annotations.push({
                    lineIndex: Math.max(0, cleanLines.length - 1),
                    text: calloutMatch[1].trim()
                });
            } else {
                // Strip inline CodeHike-style markers if they exist (e.g. ` // !focus`)
                const cleanLine = line.replace(/\s*(?:\/\/|#|<!--)\s*!(?:focus|mark|border|tooltip).*$/, '');
                cleanLines.push(cleanLine);
            }
        });
        cleanSnapshots.push(cleanLines.join("\n"));
        allAnnotations.push(annotations);
    });
    return { cleanSnapshots, allAnnotations };
  }, [code]);

  const snapshots = cleanSnapshots;
  const isSingle = snapshots.length < 2;

  const lang = detectLang(snapshots[0]);
  const validMode = (m: string): AnimMode =>
    ANIM_MODES.some((a) => a.key === m) ? (m as AnimMode) : "morph";

  // Parse mode and potential target (e.g., highlight:3)
  const animParts = (initialAnim || "morph").split(":");
  const baseModeStr = animParts[0].trim();
  const targetStr = animParts[1]?.trim() || "";

  let animTargetIndices: number[] | null = null;
  if (targetStr) {
    if (targetStr.includes("-")) {
      const [start, end] = targetStr
        .split("-")
        .map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        animTargetIndices = Array.from(
          { length: end - start + 1 },
          (_, i) => start + i,
        );
      }
    } else {
      const parsedTarget = parseInt(targetStr, 10);
      if (!isNaN(parsedTarget)) animTargetIndices = [parsedTarget];
    }
  }

  const [animMode, setAnimMode] = useState<AnimMode>(validMode(baseModeStr));

  const [step, setStep] = useState(0);
  const [htmls, setHtmls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [morphing, setMorphing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [primaryAction, setPrimaryAction] = useState<"play" | "step">("step");
  const [hasPlayed, setHasPlayed] = useState(false);

  const [copied, setCopied] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);


  const [muted, setMuted] = useState(false);
  const lastTickRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeAnimsRef = useRef<Animation[]>([]);
  const [scrubValue, setScrubValue] = useState(100);

  const stageRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const htmlsRef = useRef<string[]>([]);
  const sequenceRef = useRef(false);
  const aliveRef = useRef(true);
  const skipSyncRef = useRef(false);
  const inViewRef = useRef(true);
  const dirtyRef = useRef(false);
  const [inView, setInView] = useState(true);
  const cacheRef = useRef<Record<string, { dark: string[]; light: string[] }>>({});

  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    htmlsRef.current = htmls;
  }, [htmls]);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      sequenceRef.current = false;
    };
  }, []);

  useEffect(() => {
    ensureStyles();
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
      if (
        controlsRef.current &&
        !controlsRef.current.contains(e.target as Node)
      )
        setControlsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  // Track viewport visibility: pause autoplay off-screen (save GPU) and skip
  // expensive DOM work (innerHTML swap + reflow) for off-screen blocks so that
  // theme switches on pages with many blocks stay fast.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        inViewRef.current = visible;
        setInView(visible);
        if (!visible && sequenceRef.current) {
          sequenceRef.current = false;
          setPlaying(false);
          setCountdown(0);
        }
      },
      { threshold: 0, rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // When a deferred (off-screen) block scrolls back into view, flush any
  // pending snapshot/theme update it skipped.
  useLayoutEffect(() => {
    if (!inView || !dirtyRef.current || morphing || !stageRef.current) return;
    dirtyRef.current = false;
    const html = htmls[step];
    if (html != null) stageRef.current.innerHTML = html;
  }, [inView, htmls, step, morphing]);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${code}|||${lang}`;

    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setHtmls(globalTheme === "dark" ? cached.dark : cached.light);
      setLoading(false);
      return () => { cancelled = true; };
    }

    async function init() {
      try {
        const { dark, light } = await tokenizeWithWorker(snapshots, lang);
        if (!cancelled) {
          cacheRef.current[cacheKey] = { dark, light };
          setHtmls(globalTheme === "dark" ? dark : light);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          const e = (s: string) =>
            s
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          setHtmls(
            snapshots.map(
              (s: string) => `<span style="color:var(--text-secondary)">${e(s)}</span>`,
            ),
          );
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [code, lang, globalTheme]);


  const [annotationBounds, setAnnotationBounds] = useState<Record<number, { top: number; left?: number; right?: number }>>({});
  
  // 1. Sync the rendered snapshot whenever the step, theme, or html set changes.
  // Skipped while an animation is mid-flight (the anim layer owns the DOM then).
  useLayoutEffect(() => {
    if (morphing || !stageRef.current) return;
    // A keep-structure animation (diff/highlight/scroll) just left its decorated
    // DOM in place — don't clobber it with the plain snapshot this one time.
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    // Off-screen: defer the DOM swap until the block scrolls back into view.
    if (!inViewRef.current) {
      dirtyRef.current = true;
      return;
    }
    const html = htmls[step];
    if (html != null) {
      stageRef.current.innerHTML = html;
    }
  }, [htmls, step, morphing]);

  // 2. Calculate positions for annotations when idle
  useLayoutEffect(() => {
    if (morphing || !stageRef.current || !containerRef.current) {
      setAnnotationBounds({});
      return;
    }
    // Skip the getBoundingClientRect reflow storm for off-screen blocks.
    if (!inViewRef.current) return;
    
    const bounds: Record<number, { top: number; left?: number; right?: number }> = {};
    const currentAnns = allAnnotations[step];
    const lines = stageRef.current.querySelectorAll('.cm-line');
    
    // Always reset margins first
    lines.forEach(l => (l as HTMLElement).style.marginBottom = '0');

    if (currentAnns && currentAnns.length > 0) {
       // First pass: Add margins to make physical space for annotations
       currentAnns.forEach((ann: { lineIndex: number; text: string }) => {
           const lineEl = lines[ann.lineIndex] as HTMLElement;
           if (lineEl) {
               // Estimate height needed: base 36px + ~16px per 50 chars
               const linesOfText = Math.ceil(ann.text.length / 50);
               const estimatedHeight = 36 + (linesOfText * 16);
               lineEl.style.marginBottom = `${estimatedHeight + 16}px`; 
           }
       });
       
       // Second pass: Read positions after layout shift
       const containerRect = containerRef.current.getBoundingClientRect();
       currentAnns.forEach((ann: { lineIndex: number; text: string }) => {
           const lineEl = lines[ann.lineIndex] as HTMLElement;
           if (lineEl) {
               const rect = lineEl.getBoundingClientRect();
               // rect.bottom is the bottom of the text, ignoring the margin we just added!
               bounds[ann.lineIndex] = {
                   top: rect.bottom - containerRect.top + containerRef.current!.scrollTop + 8,
                   left: 32 // Indent slightly
               };
           }
       });
    }
    setAnnotationBounds(bounds);
  }, [step, morphing, allAnnotations, htmls, inView]);

  // Remove the separate useEffect that was overwriting the theme swap

  const runMorph = useCallback(
    async (fromHtml: string, toHtml: string, toStep?: number) => {
      if (!stageRef.current || morphing) return;
      const wrapper = stageRef.current;
      setMorphing(true);
      try {
        // 1. Accurately measure heights first
        wrapper.style.height = "";
        wrapper.innerHTML = fromHtml;
        void wrapper.offsetHeight;
        const h1 = wrapper.scrollHeight;

        wrapper.innerHTML = toHtml;
        void wrapper.offsetHeight;
        const h2 = wrapper.scrollHeight;

        // 2. Lock height to max to prevent page scroll/layout shift during measurements and animation
        const maxH = Math.max(h1, h2);
        wrapper.style.height = `${maxH}px`;

        const from = measureTokens(wrapper, fromHtml);
        const to = measureTokens(wrapper, toHtml);


        const matched = matchByKey(from, to);
        
        

        wrapper.innerHTML = "";
        const m = buildAnimLayer(wrapper, []);

        if (animMode === "diff" || animMode === "flight") {
          wrapper.style.height = "";
        }


        const fn = ANIM_FNS[animMode];
        playSound("swoosh", muted);

        if (animMode === "diff") {
          (fn as Function)(m, from, to, fromHtml, toHtml, wrapper, () => {});
        } else if (animMode === "flight") {
          (fn as Function)(m, from, to, fromHtml, toHtml, wrapper);
        } else if (animMode === "highlight" || animMode === "scroll") {
          (fn as Function)(m, toHtml, wrapper, animTargetIndices);
        } else if (animMode === "typewriter") {
          (fn as Function)(m, from, to, toHtml, wrapper);
        } else if (animMode === "morph") {
          (fn as Function)(m, matched);
        } else {
          (fn as Function)(m, from, to);
        }

        activeAnimsRef.current = m.anims;
        await Promise.all(m.anims.map((a) => a.finished.catch(() => {})));
        
        if (scrubCancelRef.current) {
           if (m.layer && m.layer.parentNode) m.layer.parentNode.removeChild(m.layer);
           return;
        }
        
        activeAnimsRef.current = [];

        wrapper.style.position = "";
        wrapper.style.height = "";
        wrapper.style.minHeight = "";

        const keepStructure = ["diff", "highlight", "scroll"].includes(
          animMode,
        );
        if (!keepStructure) {
          wrapper.innerHTML = toHtml;
        } else {
          // Prevent the post-morph sync effect from wiping the animated styling.
          skipSyncRef.current = true;
        }

        if (
          ["diff", "flight", "typewriter", "highlight", "scroll"].includes(
            animMode,
          )
        ) {
          wrapper.querySelectorAll(".cm-tok").forEach((el) => {
            (el as HTMLElement).style.opacity = "1";
          });
        }
        if (typeof toStep === "number") setStep(toStep);
      } finally {
        if (!scrubCancelRef.current) {
          setMorphing(false);
        }
      }
    },
    [animMode, morphing],
  );

  // Drives the circular countdown meter for `ms`, resolving when it completes.
  // Cancels early if autoplay is paused or the component unmounts.
  const startCountdown = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        let raf = 0;
        const tick = (now: number) => {
          if (!aliveRef.current || !sequenceRef.current) {
            cancelAnimationFrame(raf);
            setCountdown(0);
            resolve();
            return;
          }
          const t = Math.min(1, (now - start) / ms);
          setCountdown(t);
          if (t >= 1) {
            setCountdown(0);
            resolve();
          } else {
            raf = requestAnimationFrame(tick);
          }
        };
        raf = requestAnimationFrame(tick);
      }),
    [],
  );

  // Autoplay: continuously step through every snapshot, counting down 5s
  // between transitions and looping back to the start. Clicking Play again
  // (or the menu's Pause) stops it.

  const toggleAutoplay = useCallback(async () => {
    if (morphing && !sequenceRef.current) {
       if (activeAnimsRef.current.some(a => a.playState === 'paused')) {
           activeAnimsRef.current.forEach(a => a.play());
       }
       return;
    }
    if (sequenceRef.current) {

      sequenceRef.current = false;
      setPlaying(false);
      setCountdown(0);
      return;
    }
    if (morphing) return;
    const arr = htmlsRef.current;
    if (arr.length < 2) return;
    sequenceRef.current = true;
    setPlaying(true);
    setHasPlayed(true);
    try {
      while (aliveRef.current && sequenceRef.current) {
        const from = stepRef.current;
        const next = from >= arr.length - 1 ? 0 : from + 1;
        await runMorph(arr[from], arr[next], next);
        if (!sequenceRef.current) break;
        await startCountdown(5000);
      }
    } finally {
      sequenceRef.current = false;
      setPlaying(false);
      setCountdown(0);
    }
  }, [morphing, runMorph, startCountdown]);

  // Manual single step: advance exactly one snapshot (wraps at the end).

  const stepOnce = useCallback(() => {
    if (sequenceRef.current) return;
    if (morphing) {
       activeAnimsRef.current.forEach(a => a.finish());
       return;
    }

    const arr = htmlsRef.current;
    if (arr.length < 2) return;
    const from = stepRef.current;
    const next = from >= arr.length - 1 ? 0 : from + 1;
    setHasPlayed(true);
    runMorph(arr[from], arr[next], next);
  }, [morphing, runMorph]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snapshots[step] ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [snapshots, step]);

  // The default (split-button) action: whatever was last chosen in the menu.

  const runPrimary = () => {
    if (primaryAction === "step") stepOnce();
    else toggleAutoplay();
  };


  const scrubCancelRef = useRef(false);

  const handleReset = useCallback(() => {
    sequenceRef.current = false;
    setPlaying(false);
    
    if (morphing) {
      scrubCancelRef.current = true;
      activeAnimsRef.current.forEach(a => a.cancel());
      activeAnimsRef.current = [];
      setMorphing(false);
    }

    const arr = htmlsRef.current;
    if (stageRef.current && arr[0] != null) stageRef.current.innerHTML = arr[0];
    setStep(0);
    setScrubValue(0);
  }, [morphing]);


  // Sync scrubber visually during playback
  useEffect(() => {
    if (!morphing) {
       return;
    }
    let raf = 0;
    const updateScrubber = () => {
       if (activeAnimsRef.current.length > 0 && sequenceRef.current) {
          const a = activeAnimsRef.current[0];
          const dur = (a.effect?.getComputedTiming().duration as number) || 1;
          const curr = (a.currentTime as number) || 0;
          setScrubValue(Math.min(100, (curr / dur) * 100));
       }
       raf = requestAnimationFrame(updateScrubber);
    };
    raf = requestAnimationFrame(updateScrubber);
    return () => cancelAnimationFrame(raf);
  }, [morphing]);

  const isBuildingRef = useRef(false);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const globalVal = parseFloat(e.target.value);
    if (Math.abs(globalVal - lastTickRef.current) > 3) {
       playSound("tick", muted);
       lastTickRef.current = globalVal;
    }

    const targetFromStep = Math.floor(globalVal / 100);
    const localVal = globalVal % 100;
    const arr = htmlsRef.current;
    if (arr.length < 2) return;
    const targetNextStep = Math.min(targetFromStep + 1, arr.length - 1);

    setScrubValue(localVal);

    if (localVal === 0) {
       if (sequenceRef.current) { sequenceRef.current = false; setPlaying(false); }
       if (morphing) {
          scrubCancelRef.current = true;
          activeAnimsRef.current.forEach(a => a.cancel());
          activeAnimsRef.current = [];
          setMorphing(false);
       }
       if (targetFromStep !== stepRef.current) setStep(targetFromStep);
       if (stageRef.current && arr[targetFromStep] != null) {
           stageRef.current.innerHTML = arr[targetFromStep];
       }
       return;
    }

    if (!morphing || targetFromStep !== stepRef.current) {
       if (isBuildingRef.current) return;
       if (sequenceRef.current) { sequenceRef.current = false; setPlaying(false); }
       
       if (morphing) {
          scrubCancelRef.current = true;
          activeAnimsRef.current.forEach(a => a.cancel());
       }
       
       setStep(targetFromStep);
       isBuildingRef.current = true;
       scrubCancelRef.current = false;
       setTimeout(() => {
           runMorph(arr[targetFromStep], arr[targetNextStep], targetNextStep);
           setTimeout(() => {
               if (activeAnimsRef.current.length > 0) {
                   activeAnimsRef.current.forEach(a => {
                      a.pause();
                      const dur = a.effect?.getComputedTiming().duration as number;
                      if (dur) a.currentTime = (localVal / 100) * dur;
                   });
               }
               isBuildingRef.current = false;
           }, 20);
       }, 0);
       return;
    }

    if (sequenceRef.current) { sequenceRef.current = false; setPlaying(false); }
    activeAnimsRef.current.forEach(a => {
      a.pause();
      const dur = a.effect?.getComputedTiming().duration as number;
      if (dur) a.currentTime = (localVal / 100) * dur;
    });
  }, [morphing, runMorph]);





  if (loading) {
    return (
      <div
        className="my-6 rounded-2xl border"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: "var(--accent)" }}
          >
            Code Anime
          </span>
        </div>
        <div className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      </div>
    );
  }


  return (
    <>
    {isFullscreen && (
       <div 
         className="fixed inset-0 z-[99998] backdrop-blur-md transition-opacity" 
         style={{ background: "var(--glass-bg)" }}
         onClick={() => setIsFullscreen(false)} 
       />
    )}
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[99999] overflow-y-auto p-4 pt-8 sm:p-12 sm:pt-[8vh] animate-in fade-in zoom-in-95 duration-300"
          : "my-6 rounded-3xl border"
      }
      style={{ 
         borderColor: isFullscreen ? "transparent" : "var(--border)", 
         background: isFullscreen ? "transparent" : "var(--bg-card)" 
      }}
    >
      <div 
         className={isFullscreen ? "mx-auto w-full max-w-6xl rounded-3xl overflow-hidden border shadow-2xl flex flex-col mb-12 relative" : "flex flex-col relative rounded-3xl"}
         style={{ 
            borderColor: "var(--border)", 
            boxShadow: isFullscreen ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "none"
         }}
      >
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-wider uppercase">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
            >
              {animMode}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="cm-dropdown">
                {ANIM_MODES.map((m) => (
                  <button
                    key={m.key}
                    className={m.key === animMode ? "active" : ""}
                    onClick={() => {
                      setAnimMode(m.key);
                      setDropdownOpen(false);
                      handleReset();
                    }}
                  >
                    <span className="lbl">{m.label}</span>
                    <span className="dsc">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>·</span>
          <span style={{ opacity: 0.6 }}>{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}</span>
          <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>·</span>
          <span style={{ opacity: 0.6 }}>{snapshots[step]?.split('\n').length || 0} lines</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Theater Mode"}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={handleCopy}
            title="Copy code"
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${copied ? "text-green-500" : ""}`}
            style={{ color: copied ? undefined : "var(--text-muted)" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button
            onClick={() => {
               if (muted && audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
               setMuted(!muted);
            }}
            title={muted ? "Unmute" : "Mute"}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <div className="relative flex items-center" ref={controlsRef}>
            {!hasPlayed && step === 0 && !isSingle && (
              <div 
                className="absolute -top-10 right-0 px-2.5 py-1 rounded-md text-[10px] font-bold animate-bounce pointer-events-none whitespace-nowrap border z-10"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  borderColor: "var(--accent)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3), 0 0 10px rgba(255,200,0,0.2)",
                }}
              >
                Click to play / step
                <div 
                  className="absolute -bottom-1 right-6 w-2 h-2 rotate-45 border-r border-b"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--accent)",
                  }}
                />
              </div>
            )}
            <button
              onClick={runPrimary}
              disabled={isSingle}
              title={primaryAction === "step" ? "Step to next snapshot" : playing ? "Pause autoplay" : "Play (auto-advances every 5s)"}
              className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "var(--text-secondary)" }}
            >
              {primaryAction === "step" ? (
                <StepForward size={13} />
              ) : playing ? (
                <Pause size={13} />
              ) : (
                <Play size={13} className={!hasPlayed && !isSingle ? "animate-pulse text-[var(--accent)]" : ""} />
              )}
              <span className="hidden sm:inline ml-1">
                {primaryAction === "step" ? "Step" : playing ? "Pause" : "Play"}
              </span>
            </button>
            <button
              onClick={() => setControlsOpen((o) => !o)}
              title="Choose action"
              className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center text-[10px] font-bold"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {controlsOpen && (
              <div className="cm-dropdown" style={{ right: 0 }}>
                <button
                  onClick={() => {
                    setPrimaryAction("play");
                    toggleAutoplay();
                    setControlsOpen(false);
                  }}
                  disabled={isSingle}
                  className={primaryAction === "play" ? "active" : ""}
                  style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}
                >
                  {playing ? <Pause size={13} /> : <Play size={13} />}
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span className="lbl">{playing ? "Pause" : "Play"}</span>
                    <span className="dsc">Auto every 5s</span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    setPrimaryAction("step");
                    if (sequenceRef.current) {
                      sequenceRef.current = false;
                      setPlaying(false);
                    }
                    stepOnce();
                    setControlsOpen(false);
                  }}
                  disabled={playing || isSingle}
                  className={primaryAction === "step" ? "active" : ""}
                  style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}
                >
                  <StepForward size={13} />
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span className="lbl">Step</span>
                    <span className="dsc">Next snapshot</span>
                  </span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleReset}
            disabled={isSingle}
            title="Back to first snapshot"
            className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--text-muted)" }}
          >
            <RotateCcw size={13} />
          </button>
        </div>



      </div>
      {!isSingle && (
      <div className="w-full px-4 py-2.5 border-b flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
         <div className="relative flex-1 h-6 flex items-center">
            {/* Step dots background */}
            <div className="absolute inset-x-0 flex items-center justify-between px-1">
              {htmls.map((_, i) => {
                const currentStep = morphing && activeAnimsRef.current.length > 0 ? stepRef.current : step;
                const isPast = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div
                    key={i}
                    className="relative z-10 rounded-full transition-all duration-200"
                    style={{
                      width: isCurrent ? 8 : 5,
                      height: isCurrent ? 8 : 5,
                      background: isPast || isCurrent ? "var(--accent)" : "var(--text-muted)",
                      opacity: isPast ? 0.5 : isCurrent ? 1 : 0.25,
                      boxShadow: isCurrent ? "0 0 8px var(--accent)" : "none",
                    }}
                  />
                );
              })}
            </div>
            {/* Track line behind dots */}
            <div className="absolute inset-x-1 h-[2px] rounded-full" style={{ background: "var(--text-muted)", opacity: 0.15 }} />
            <div
              className="absolute left-1 h-[2px] rounded-full transition-all duration-150"
              style={{
                width: `${htmls.length > 1 ? ((morphing && activeAnimsRef.current.length > 0 ? stepRef.current : step) / (htmls.length - 1)) * 100 : 0}%`,
                background: "var(--accent)",
              }}
            />
            {/* Range input overlay */}
            <input
               type="range"
               min="0"
               max={Math.max(0, (htmls.length - 1) * 100)}
               step="0.1"
               value={morphing && activeAnimsRef.current.length > 0 ? (stepRef.current * 100) + scrubValue : (step * 100)}
               onChange={handleScrub}
               className="absolute inset-0 w-full opacity-0 cursor-pointer"
               style={{ margin: 0 }}
            />
            {/* Custom thumb */}
            <div
              className="absolute z-20 w-3 h-3 rounded-full border-2 pointer-events-none transition-all duration-150"
              style={{
                left: `calc(${htmls.length > 1 ? ((morphing && activeAnimsRef.current.length > 0 ? stepRef.current : step) / (htmls.length - 1)) * 100 : 0}% - 6px)`,
                borderColor: "var(--accent)",
                background: "var(--bg-card)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
         </div>
         <span className="text-[10px] font-mono font-bold tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
           {(morphing && activeAnimsRef.current.length > 0 ? stepRef.current : step) + 1}/{htmls.length}
         </span>
      </div>
      )}
      <div
        ref={containerRef}
        className="relative text-sm leading-relaxed overflow-x-auto"
        style={{ fontVariantLigatures: "none", maxHeight: "70vh", overflowY: "auto" }}
      >
        {!morphing && allAnnotations[step]?.map((ann, i) => {
          const pos = annotationBounds[ann.lineIndex];
          if (!pos) return null;
          return (
             <div 
               key={i} 
               className="absolute z-30 px-3 py-2 rounded-lg text-xs animate-in fade-in slide-in-from-top-2 duration-500 shadow-xl border pointer-events-none"
               style={{ 
                 top: pos.top, 
                 left: pos.left, 
                 background: "var(--bg-card)",
                 color: "var(--text-primary)",
                 borderColor: "var(--accent)",
                 maxWidth: "calc(100% - 64px)",
                 backdropFilter: "blur(8px)"
               }}
             >
               <div className="absolute -top-[5px] left-4 w-0 h-0 border-x-[5px] border-x-transparent border-b-[6px]" style={{ borderBottomColor: "var(--accent)" }} />
               <span className="font-bold text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--accent)" }}>Explainer</span>
               {ann.text}
             </div>
          );
        })}
        {playing && (
          <div
            className="absolute top-2 right-2 z-20 pointer-events-none"
            style={{ width: 30, height: 30 }}
            title="Next snapshot in…"
          >
            <svg width="30" height="30" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r="13" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="3" />
              <circle
                cx="15"
                cy="15"
                r="13"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={2 * Math.PI * 13 * (1 - countdown)}
                transform="rotate(-90 15 15)"
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums"
              style={{ color: "var(--accent)" }}
            >
              {Math.ceil((1 - countdown) * 5)}
            </span>
          </div>
        )}
        <div ref={stageRef} data-cm="stage" className={`cm-stage p-4 relative ${(allAnnotations[step]?.length > 0) ? 'pb-24' : ''}`} />

      </div>
      {/* Bottom accent sweep line */}
      <div className="relative overflow-hidden" style={{ height: "2px" }}>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
      </div>
      </div>
      </div>
    </>
  );
}
