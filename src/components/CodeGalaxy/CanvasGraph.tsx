/**
 * CanvasGraph — a WebGL "code galaxy" renderer built on three.js.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE (read this first)
 * ─────────────────────────────────────────────────────────────────────────
 * This component renders the graph as a 3D scene:
 *
 *   • Nodes  → THREE.Sprite "orbs". The 5 highest-degree nodes are "god nodes"
 *              (central hubs). Every other node belongs to a community and is
 *              rendered as either a "planet" (the community's hub) or a "moon"
 *              (a member orbiting that planet).
 *   • Links  → a single THREE.LineSegments buffer. Only links touching the
 *              currently-selected node are drawn (plus travelling "packet"
 *              sprites along them), keeping the wireframe calm.
 *   • Scene  → additive star layers, a faint nebula, a slowly drifting
 *              background galaxy sphere, a "programmer" workstation diorama,
 *              and a black-hole sprite.
 *
 * DATA FLOW
 *   React (CodeGalaxyWindow) ──props──▶ CanvasGraph
 *     nodes / links / layout / selection / hover / visibleNodes / visibleLinks
 *   CanvasGraph builds the three.js scene ONCE in a useEffect keyed on
 *   `nodes.length > 0`. Per-frame work happens in `animate()` (the rAF loop).
 *
 * RENDER PIPELINE
 *   EffectComposer → RenderPass(scene) → UnrealBloomPass → screen.
 *   Bloom runs at HALF resolution and devicePixelRatio is capped at 1 to stay
 *   fill-rate friendly (see PERFORMANCE NOTES below).
 *
 * FILTERING
 *   `visibleNodes` / `visibleLinks` (Set/array from the parent) are mirrored
 *   into refs (`visibleNodesRef`) so the animation loop can read them without
 *   re-subscribing. Sprites simply toggle `.visible` / opacity each frame.
 *
 * PERFORMANCE NOTES
 *   • Pixel ratio capped at 1; bloom at ½ res.
 *   • Black-hole canvas is 1024² (redrawn periodically, not per frame).
 *   • No per-frame `new` allocations in `animate()` (reused temp objects).
 *   • The scene-setup effect runs once; see cleanup at the bottom.
 * ─────────────────────────────────────────────────────────────────────────
 */
import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import type { GraphNode, GraphLink } from "./constants";

/* ═══════════════════════════════════════════════════════════════════════════
 * SECTION 1 · CONSTANTS & PALETTE
 * Shared, module-level values. The community palette is indexed by
 * `node.community % palette.length` so every community gets a stable colour.
 * ═══════════════════════════════════════════════════════════════════════════ */
const COMMUNITY_PALETTE = [
  0xff3366, 0x33ccff, 0x99ff33, 0xffcc00, 0xcc33ff, 0x00ffcc, 0xff6600,
  0x6666ff, 0xff99cc, 0x3399ff,
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Reused to avoid per-frame allocation in the animation loop.
const ZERO_VECTOR = new THREE.Vector3();

/* ═══════════════════════════════════════════════════════════════════════════
 * SECTION 2 · TEXTURE FACTORIES
 * All visuals are procedurally drawn to <canvas> and wrapped in a
 * THREE.CanvasTexture — no external image assets required.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Radial glow sprite (used for stars, halos, the black-hole lens, packets…).
 * `isPlanet` switches to a tighter "solid core + soft falloff" profile that
 * reads more like a lit body than a fuzzy light.
 */
function createGlowTexture(
  r: number,
  g: number,
  b: number,
  size = 128,
  isPlanet = false,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const h = size / 2;
  const grad = ctx.createRadialGradient(h, h, 0, h, h, h);
  if (isPlanet) {
    grad.addColorStop(0, `rgba(255,255,255,1)`);
    grad.addColorStop(0.1, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.2, `rgba(${r},${g},${b},0.4)`);
    grad.addColorStop(0.35, `rgba(${r},${g},${b},0.05)`);
    grad.addColorStop(1, `rgba(0,0,0,0)`);
  } else {
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.2, `rgba(${r},${g},${b},0.4)`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.1)`);
    grad.addColorStop(1, `rgba(0,0,0,0)`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// Solid color-cored orb with a crisp rim + soft halo.
// Uses NormalBlending at render time so it reads as a distinct object
// in the starfield instead of additively blowing out into glare.
function createNodeTexture(
  r: number,
  g: number,
  b: number,
  size = 128,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const h = size / 2;
  const grad = ctx.createRadialGradient(h, h, 0, h, h, h);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.55)`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // Crisp bright rim to separate the node from stars/dust
  ctx.beginPath();
  ctx.arc(h, h, size * 0.22, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, size * 0.025);
  ctx.stroke();
  return new THREE.CanvasTexture(canvas);
}

// One-time generated starfield + faint galaxies backdrop.
// Used as scene.background so it is always visible (even when zoomed
// all the way out past the fog) at essentially zero per-frame cost.
function createSpaceBackgroundTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#04030a");
  base.addColorStop(0.5, "#020207");
  base.addColorStop(1, "#04030a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Soft nebula clouds — visible colour washes. Kept gentle (alpha well
  // under the bloom threshold) so they don't read as the "dirty" bright
  // dots from earlier; they're meant to be subtle, not glare.
  const nebulaColors = [
    [120, 60, 180],
    [60, 90, 200],
    [180, 80, 140],
    [50, 140, 180],
    [160, 100, 220],
  ];
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 160 + Math.random() * 360;
    const [cr, cg, cb] = nebulaColors[i % nebulaColors.length];
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},0.28)`);
    g.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.10)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint galaxies (elliptical smudges)
  const galColors = [
    [150, 120, 255],
    [120, 170, 255],
    [255, 150, 200],
    [140, 255, 220],
    [200, 160, 255],
  ];
  for (let i = 0; i < 10; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h * 0.9;
    const r = 40 + Math.random() * 90;
    const col = galColors[i % galColors.length];
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.5)`);
    g.addColorStop(0.4, `rgba(${col[0]},${col[1]},${col[2]},0.18)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.random() * Math.PI);
    ctx.scale(1, 0.5 + Math.random() * 0.4);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Background stars
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = Math.random() * 1.4;
    const a = 0.3 + Math.random() * 0.7;
    const tint = Math.random();
    const col =
      tint < 0.7
        ? `rgba(255,255,255,${a})`
        : tint < 0.85
          ? `rgba(180,200,255,${a})`
          : `rgba(255,210,180,${a})`;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, s, s);
  }

  // A few brighter stars with a soft glow
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 1 + Math.random() * 2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine star dust — many tiny, very faint specks for depth
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const a = 0.04 + Math.random() * 0.12;
    ctx.fillStyle = `rgba(200,210,255,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Asteroid flecks — small, dim, irregular grey rocks
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = 1 + Math.random() * 2.5;
    const shade = 80 + Math.floor(Math.random() * 70);
    const a = 0.15 + Math.random() * 0.2;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${a})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      s,
      s * (0.6 + Math.random() * 0.6),
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Draw a streak (comet / meteor): bright head fading to a faint tail.
  const drawStreak = (
    x: number,
    y: number,
    len: number,
    angle: number,
    headColor: string,
    tailColor: string,
  ) => {
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    const grad = ctx.createLinearGradient(x, y, ex, ey);
    grad.addColorStop(0, headColor);
    grad.addColorStop(1, tailColor);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    const hg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3);
    hg.addColorStop(0, tailColor);
    hg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  // Comets — longer, icy-blue streaks
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const len = 60 + Math.random() * 120;
    const angle = Math.PI + (Math.random() - 0.5) * 0.6;
    drawStreak(
      x,
      y,
      len,
      angle,
      "rgba(120,160,255,0)",
      `rgba(${180 + Math.floor(Math.random() * 60)},210,255,0.8)`,
    );
  }

  // Meteors — short, faint white streaks
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const len = 20 + Math.random() * 50;
    const angle = Math.PI * 1.25 + (Math.random() - 0.5) * 0.8;
    drawStreak(
      x,
      y,
      len,
      angle,
      "rgba(255,255,255,0)",
      `rgba(255,255,255,${0.4 + Math.random() * 0.4})`,
    );
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// === Programmer Workstation Builder ===
function createProgrammerWorkstation(parentGroup: THREE.Group) {
  const WORKSTATION_POS = new THREE.Vector3(0, 30, -20);

  const wsGroup = new THREE.Group();
  wsGroup.position.copy(WORKSTATION_POS);
  wsGroup.rotation.y = Math.PI;

  const deskGeo = new THREE.BoxGeometry(18, 0.6, 10);
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x1a1020,
    transparent: true,
    opacity: 0.95,
    roughness: 0.7,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.set(0, 0, 0);
  desk.receiveShadow = true;
  wsGroup.add(desk);

  const legGeo = new THREE.CylinderGeometry(0.25, 0.25, 8, 6);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a30,
    transparent: true,
    opacity: 0.7,
    roughness: 0.5,
    metalness: 0.4,
  });
  [
    [-7, -4, -4],
    [7, -4, -4],
    [-7, -4, 4],
    [7, -4, 4],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    wsGroup.add(leg);
  });

  const laptopBaseGeo = new THREE.BoxGeometry(6, 0.25, 4);
  const laptopBaseMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    transparent: true,
    opacity: 0.9,
    roughness: 0.3,
    metalness: 0.6,
  });
  // Group the laptop so base/screen/glow move as one unit.
  const laptopGroup = new THREE.Group();

  const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopBaseMat);
  laptopBase.position.set(1, 0.45, 3);
  laptopBase.castShadow = true;
  laptopBase.receiveShadow = true;
  laptopGroup.add(laptopBase);

  const laptopScreenGeo = new THREE.PlaneGeometry(5.5, 3.5);
  const laptopScreenMat = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    emissive: 0x0066ff,
    emissiveIntensity: 0.2,
  });
  const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopScreenMat);
  laptopScreen.position.set(1, 2.4, 1);
  laptopScreen.rotation.x = -0.15;
  laptopGroup.add(laptopScreen);

  const screenGlowTex = createGlowTexture(0, 170, 255, 256, false);
  const screenGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: screenGlowTex,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  screenGlow.scale.set(12, 8, 1);
  screenGlow.position.set(1, 2.5, -0.5);
  laptopGroup.add(screenGlow);

  // Nudge the whole laptop forward (away from the seated programmer at
  // local z ≈ 6) by a small amount so it no longer crowds them, while the
  // screen code-lines and keyboard lights travel with it.
  laptopGroup.position.set(0, 0, -0.6);
  wsGroup.add(laptopGroup);

  const codeLineColors = [0x00ff88, 0xffaa00, 0x00ccff, 0xff66aa, 0xaaff00];
  for (let i = 0; i < 8; i++) {
    const lineW = 1.5 + Math.random() * 2.5;
    const lineGeo = new THREE.PlaneGeometry(lineW, 0.12);
    const lineMat = new THREE.MeshBasicMaterial({
      color: codeLineColors[i % codeLineColors.length],
      transparent: true,
      opacity: 0.3 + Math.random() * 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(-0.5 + Math.random() * 3, 1.0 + i * 0.35, 1.05);
    laptopGroup.add(line);
  }

  const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
  const armMat = new THREE.MeshStandardMaterial({
    color: 0x333340,
    transparent: true,
    opacity: 0.8,
    roughness: 0.4,
    metalness: 0.5,
  });
  const arm = new THREE.Mesh(armGeo, armMat);
  arm.position.set(-7, 4, -2);
  arm.rotation.z = 0.15;
  arm.castShadow = true;
  wsGroup.add(arm);

  // Lamp head
  const lampHeadGeo = new THREE.ConeGeometry(2, 5, 8);
  const lampHeadMat = new THREE.MeshStandardMaterial({
    color: 0x222230,
    transparent: true,
    opacity: 0.8,
    roughness: 0.3,
    metalness: 0.6,
  });
  const lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
  lampHead.position.set(-6.5, 8.2, -2);
  lampHead.rotation.z = Math.PI;
  lampHead.castShadow = true;
  wsGroup.add(lampHead);

  // Light cone
  const lampConeGeo = new THREE.CylinderGeometry(0.2, 4, 10, 12, 1, true);
  const lampConeMat = new THREE.MeshBasicMaterial({
    color: 0xffcc66,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });
  const lampCone = new THREE.Mesh(lampConeGeo, lampConeMat);
  lampCone.position.set(-6.5, 4.5, -2);
  lampCone.rotation.x = 0;
  wsGroup.add(lampCone);

  // Spotlight
  const lampLight = new THREE.SpotLight(0xffcc66, 0.6);
  lampLight.position.set(-6.5, 7.5, -2);
  lampLight.angle = 0.5;
  lampLight.penumbra = 0.5;
  lampLight.decay = 1.5;
  lampLight.distance = 15;
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.width = 512;
  lampLight.shadow.mapSize.height = 512;
  const target = new THREE.Object3D();
  target.position.set(-6.5, 0, -2);
  wsGroup.add(target);
  lampLight.target = target;
  wsGroup.add(lampLight);

  // Light pool
  const lightPoolTex = createGlowTexture(255, 200, 100, 256, false);
  const lightPool = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: lightPoolTex,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    }),
  );
  lightPool.scale.set(10, 10, 1);
  lightPool.position.set(-6.5, 0.35, -2);
  wsGroup.add(lightPool);

  // Glow at the lamp
  const lampGlowTex = createGlowTexture(255, 200, 100, 128, false);
  const lampGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: lampGlowTex,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  lampGlow.scale.set(5, 5, 1);
  lampGlow.position.set(-6.5, 5, -2);
  wsGroup.add(lampGlow);

  const holoGeo = new THREE.RingGeometry(1.5, 2, 16);
  const holoMat = new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const holoRing = new THREE.Mesh(holoGeo, holoMat);
  holoRing.position.set(8, 3, 0);
  holoRing.rotation.x = Math.PI / 2;
  wsGroup.add(holoRing);

  const holoRing2 = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.2, 12),
    new THREE.MeshBasicMaterial({
      color: 0x33ccff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  holoRing2.position.set(8, 3, 0);
  holoRing2.rotation.x = Math.PI / 2;
  wsGroup.add(holoRing2);

  const orbPositions = [
    [9, 4.5, 1],
    [7, 5, -1],
    [10, 2, 0.5],
    [8.5, 1.5, 1.5],
    [9.5, 3.5, -0.5],
  ];
  const orbTex = createGlowTexture(0, 220, 255, 64, true);
  const orbs: THREE.Sprite[] = [];
  orbPositions.forEach(([ox, oy, oz]) => {
    const orb = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: orbTex,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    orb.scale.set(1.2, 1.2, 1);
    orb.position.set(ox, oy, oz);
    wsGroup.add(orb);
    orbs.push(orb);
  });

  // ============================================================
  // REACTIVE KEYBOARD LED LIGHTS
  // ============================================================
  const keyboardLights = new THREE.Group();

  // Create individual key lights (3 rows x 10 columns)
  const keyColors = [0x00ff88, 0x00ccff, 0xff66aa, 0xffcc00, 0x99ff33];
  const keyRows = 3;
  const keyCols = 10;
  const keySpacing = 0.4;

  for (let row = 0; row < keyRows; row++) {
    for (let col = 0; col < keyCols; col++) {
      const keyLight = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createGlowTexture(0, 255, 136, 32, true),
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );

      // Position on the keyboard
      const x = -1.5 + col * keySpacing;
      const z = 2 + row * keySpacing;
      keyLight.position.set(x, 0.6, z);
      keyLight.scale.set(0.15, 0.15, 1);

      // Store animation data
      keyLight.userData = {
        row,
        col,
        baseColor: keyColors[(row * keyCols + col) % keyColors.length],
        pulseIntensity: 0,
        pulseDecay: 2.0 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        isActive: false,
      };

      keyboardLights.add(keyLight);
    }
  }

  // Glowing base under keyboard
  const keyboardGlowTex = createGlowTexture(100, 200, 255, 128, false);
  const keyboardGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: keyboardGlowTex,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  keyboardGlow.scale.set(6, 2, 1);
  keyboardGlow.position.set(1, 0.3, 3);
  keyboardLights.add(keyboardGlow);

  laptopGroup.add(keyboardLights);

  // Store for animation
  (wsGroup as any).keyboardLights = keyboardLights;
  (wsGroup as any).keyboardLightKeys = keyboardLights.children.filter(
    (child) => child.userData && child.userData.row !== undefined,
  );

  // ============================================================
  // THE META HOLOGRAM (Mini Code Galaxy) - PURPLE & DIMMER
  // ============================================================
  // Use existing metaBase or create it if it doesn't exist
  let metaBase = wsGroup.getObjectByName("metaBase") as THREE.Mesh;
  if (!metaBase) {
    metaBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.2, 16),
      new THREE.MeshStandardMaterial({
        color: 0x1a0a2a,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x2a1a3a,
        emissiveIntensity: 0.3,
      }),
    );
    metaBase.name = "metaBase";
    metaBase.position.set(4, 0.5, -2);
    wsGroup.add(metaBase);
  }

  // Remove old galaxy if it exists
  const oldGalaxy = wsGroup.getObjectByName("metaGalaxy");
  if (oldGalaxy) {
    wsGroup.remove(oldGalaxy);
  }

  const metaGalaxy = new THREE.Group();
  metaGalaxy.name = "metaGalaxy";

  // 1. Spiral Galaxy Core (dense center) - PURPLE
  const coreCount = 800;
  const coreGeo = new THREE.BufferGeometry();
  const corePos = new Float32Array(coreCount * 3);
  const coreColors = new Float32Array(coreCount * 3);
  const coreSizes = new Float32Array(coreCount);

  for (let i = 0; i < coreCount; i++) {
    const radius = Math.pow(Math.random(), 1.5) * 0.8;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 0.3 * (1 - radius / 0.8);

    corePos[i * 3] = Math.cos(angle) * radius;
    corePos[i * 3 + 1] = height;
    corePos[i * 3 + 2] = Math.sin(angle) * radius;

    const brightness = 1 - radius / 0.8;
    // Purple tones
    coreColors[i * 3] = (0.6 * brightness + 0.3) * 0.6; // Dimmer red
    coreColors[i * 3 + 1] = (0.2 * brightness + 0.1) * 0.6; // Dimmer green
    coreColors[i * 3 + 2] = (0.8 * brightness + 0.4) * 0.6; // Dimmer blue

    coreSizes[i] = 0.02 + Math.random() * 0.04; // Smaller
  }

  coreGeo.setAttribute("position", new THREE.BufferAttribute(corePos, 3));
  coreGeo.setAttribute("color", new THREE.BufferAttribute(coreColors, 3));
  coreGeo.setAttribute("size", new THREE.BufferAttribute(coreSizes, 1));

  const coreMat = new THREE.PointsMaterial({
    size: 0.04, // Smaller
    vertexColors: true,
    transparent: true,
    opacity: 0.5, // Dimmer
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const corePoints = new THREE.Points(coreGeo, coreMat);
  metaGalaxy.add(corePoints);

  // 2. Spiral Arms - PURPLE
  const armCount = 2000;
  const armGeo2 = new THREE.BufferGeometry();
  const armPos2 = new Float32Array(armCount * 3);
  const armColors2 = new Float32Array(armCount * 3);
  const armSizes2 = new Float32Array(armCount);

  // Purple color palette (dimmer)
  const armColorsPalette = [
    new THREE.Color(0x4a1a6b), // Dark purple
    new THREE.Color(0x6d28d9), // Purple
    new THREE.Color(0x7c3aed), // Violet
    new THREE.Color(0x5b21b6), // Deep purple
    new THREE.Color(0x8b5cf6), // Light purple
    new THREE.Color(0x3b1a4a), // Very dark purple
  ];

  for (let i = 0; i < armCount; i++) {
    const arm = Math.floor(Math.random() * 3);
    const armOffset = (arm / 3) * Math.PI * 2;
    const radius = 0.3 + Math.pow(Math.random(), 0.7) * 2.2;
    const spiralAngle = radius * 3.0 + armOffset;
    const scatter = (0.3 + radius * 0.1) * (Math.random() - 0.5);
    const heightScatter = (0.1 + radius * 0.05) * (Math.random() - 0.5);

    armPos2[i * 3] = Math.cos(spiralAngle + scatter) * radius;
    armPos2[i * 3 + 1] = heightScatter;
    armPos2[i * 3 + 2] = Math.sin(spiralAngle + scatter) * radius;

    const colorIndex = Math.floor(Math.random() * armColorsPalette.length);
    const col = armColorsPalette[colorIndex];
    const brightness = 0.3 + (1 - radius / 2.5) * 0.4; // Dimmer
    armColors2[i * 3] = col.r * brightness * 0.7; // Dimmer
    armColors2[i * 3 + 1] = col.g * brightness * 0.7;
    armColors2[i * 3 + 2] = col.b * brightness * 0.7;

    armSizes2[i] = 0.015 + (1 - radius / 2.5) * 0.05 + Math.random() * 0.015; // Smaller
  }

  armGeo2.setAttribute("position", new THREE.BufferAttribute(armPos2, 3));
  armGeo2.setAttribute("color", new THREE.BufferAttribute(armColors2, 3));
  armGeo2.setAttribute("size", new THREE.BufferAttribute(armSizes2, 1));

  const armMat2 = new THREE.PointsMaterial({
    size: 0.04, // Smaller
    vertexColors: true,
    transparent: true,
    opacity: 0.4, // Dimmer
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const armPoints = new THREE.Points(armGeo2, armMat2);
  metaGalaxy.add(armPoints);

  // 3. Outer Halo Stars - PURPLE & DIMMER
  const haloCount = 600;
  const haloGeo = new THREE.BufferGeometry();
  const haloPos = new Float32Array(haloCount * 3);
  const haloColors = new Float32Array(haloCount * 3);

  for (let i = 0; i < haloCount; i++) {
    const radius = 1.8 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    haloPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    haloPos[i * 3 + 1] = radius * Math.cos(phi) * 0.4;
    haloPos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const brightness = 0.1 + Math.random() * 0.15; // Dimmer
    haloColors[i * 3] = 0.5 * brightness; // Purple-ish
    haloColors[i * 3 + 1] = 0.2 * brightness;
    haloColors[i * 3 + 2] = 0.6 * brightness;
  }

  haloGeo.setAttribute("position", new THREE.BufferAttribute(haloPos, 3));
  haloGeo.setAttribute("color", new THREE.BufferAttribute(haloColors, 3));

  const haloMat = new THREE.PointsMaterial({
    size: 0.025, // Smaller
    vertexColors: true,
    transparent: true,
    opacity: 0.15, // Dimmer
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const haloPoints = new THREE.Points(haloGeo, haloMat);
  metaGalaxy.add(haloPoints);

  // 4. Glowing Galaxy Core (Sprite) - PURPLE & DIMMER
  const coreGlowTex = createGlowTexture(100, 50, 200, 128, true); // Purple
  const coreGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: coreGlowTex,
      transparent: true,
      opacity: 0.2, // Dimmer
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  coreGlow.scale.set(0.8, 0.8, 1); // Smaller
  coreGlow.position.set(0, 0, 0);
  metaGalaxy.add(coreGlow);

  // 5. Outer Glow Ring - PURPLE & DIMMER
  const glowRingTex = createGlowTexture(80, 40, 160, 256, false); // Purple
  const glowRing = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowRingTex,
      transparent: true,
      opacity: 0.08, // Dimmer
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glowRing.scale.set(4, 4, 1); // Smaller
  glowRing.position.set(0, 0, 0);
  metaGalaxy.add(glowRing);

  // Position the galaxy
  metaGalaxy.position.set(4, 1.5, -2);
  metaGalaxy.rotation.x = Math.PI * 0.15;
  metaGalaxy.rotation.z = Math.PI * 0.05;

  wsGroup.add(metaGalaxy);
  (wsGroup as any).metaGalaxy = metaGalaxy;
  (wsGroup as any).metaGalaxyData = {
    corePoints,
    armPoints,
    haloPoints,
    coreGlow,
    glowRing,
    armColorsPalette,
  };

  // ============================================================
  // COFFEE MUG
  // ============================================================

  const mugGeo = new THREE.CylinderGeometry(0.5, 0.45, 1, 8);
  const mugMat = new THREE.MeshStandardMaterial({
    color: 0x442200,
    transparent: true,
    opacity: 0.8,
    roughness: 0.8,
    metalness: 0.2,
  });
  const mug = new THREE.Mesh(mugGeo, mugMat);
  mug.position.set(5, 0.9, 2);
  mug.castShadow = true;
  mug.receiveShadow = true;
  mug.userData = { isCoffeeMug: true }; // Flag for interaction
  wsGroup.add(mug);

  // ============================================================
  // CELLPHONE - WATCHING YOUTUBE
  // ============================================================
  const phoneCanvas = document.createElement("canvas");
  phoneCanvas.width = 128;
  phoneCanvas.height = 256;
  const phoneCtx = phoneCanvas.getContext("2d")!;

  const phoneBodyMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.6,
  });
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.1, 0.08),
    phoneBodyMat,
  );
  phoneBody.position.set(6, 1.2, 2.5);
  phoneBody.castShadow = true;
  wsGroup.add(phoneBody);

  const phoneTex = new THREE.CanvasTexture(phoneCanvas);
  const phoneScreenMat = new THREE.MeshStandardMaterial({
    map: phoneTex,
    emissive: new THREE.Color(0x4488ff),
    emissiveIntensity: 0.3,
  });
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.85),
    phoneScreenMat,
  );
  phoneScreen.position.set(6, 1.2, 2.542);
  wsGroup.add(phoneScreen);

  // Draw static phone frame (bezel) on canvas once
  function drawPhoneFrame() {
    phoneCtx.fillStyle = "#000";
    phoneCtx.fillRect(0, 0, 128, 256);
    phoneCtx.fillStyle = "#111";
    phoneCtx.beginPath();
    phoneCtx.roundRect(4, 4, 120, 248, 12);
    phoneCtx.fill();
    // notch
    phoneCtx.fillStyle = "#000";
    phoneCtx.beginPath();
    phoneCtx.roundRect(48, 0, 32, 20);
    phoneCtx.fill();
  }
  drawPhoneFrame();
  phoneTex.needsUpdate = true;
  // BOOK - WITH SHORTER TITLES AND TEXT WRAPPING
  // ============================================================

  // Position on the LEFT edge, near the programmer
  const bookPosX = -6;
  const bookPosZ = 3;

  // Book titles - SHORTER versions that fit on the cover
  const bookTitles = [
    // 5 Programming Books
    {
      title: "The Pragmatic Programmer",
      author: "Thomas & Hunt",
      year: "1999",
    },
    { title: "Clean Code", author: "R. Martin", year: "2008" },
    { title: "SICP", author: "Abelson & Sussman", year: "1985" },
    {
      title: "Design Patterns (GoF)",
      author: "Gamma, Helm, Johnson, Vlissides",
      year: "1994",
    },
    {
      title: "Introduction to Algorithms",
      author: "Cormen et al.",
      year: "1990",
    },

    // 3 System Design Books
    {
      title: "Designing Data-Intensive Applications",
      author: "M. Kleppmann",
      year: "2017",
    },
    { title: "System Design Interview", author: "Alex Xu", year: "2020" },
    { title: "Clean Architecture", author: "R. Martin", year: "2017" },

    // 2 Psychology Books
    {
      title: "Psychology of Computer Programming",
      author: "G. Weinberg",
      year: "1971",
    },
    { title: "The Mythical Man-Month", author: "F. Brooks", year: "1975" },

    // 4 Whatever Books
    {
      title: "Software Engineering at Google",
      author: "T. Winters et al.",
      year: "2020",
    },
    { title: "Refactoring", author: "M. Fowler", year: "1999" },
    {
      title: "Working Effectively with Legacy Code",
      author: "M. Feathers",
      year: "2004",
    },
    { title: "Domain-Driven Design", author: "E. Evans", year: "2003" },

    // 6 Science Books (Physics)
    { title: "Relativity", author: "Einstein", year: "1915" },
    {
      title: "Surely You're Joking, Mr. Feynman!",
      author: "R. Feynman",
      year: "1985",
    },
    { title: "The Elegant Universe", author: "B. Greene", year: "1999" },
    {
      title: "Quantum Mechanics: The Theoretical Minimum",
      author: "Susskind & Friedman",
      year: "2014",
    },
    { title: "A Brief History of Time", author: "S. Hawking", year: "1988" },
    { title: "The Fabric of the Cosmos", author: "B. Greene", year: "2004" },

    // 2 Science Fiction Books
    { title: "Dune", author: "F. Herbert", year: "1965" },
    { title: "1984", author: "G. Orwell", year: "1949" },

    // 3 AI Books
    { title: "Deep Learning", author: "Goodfellow et al.", year: "2016" },
    {
      title: "Neural Networks and Deep Learning",
      author: "M. Nielsen",
      year: "2015",
    },
    { title: "The Coming Wave", author: "M. Suleyman", year: "2023" },

    // 2 IT Books
    {
      title: "Computer Networks: A Systems Approach",
      author: "Peterson & Davie",
      year: "1996",
    },
    {
      title: "Site Reliability Engineering",
      author: "Beyer et al.",
      year: "2016",
    },

    // SOLID Principles Book
    {
      title: "Agile Principles, Patterns, and Practices in C#",
      author: "R. Martin",
      year: "2006",
    },
  ];

  // Create canvas with text wrapping
  const bookCanvas = document.createElement("canvas");
  bookCanvas.width = 1024;
  bookCanvas.height = 768;
  const ctx = bookCanvas.getContext("2d")!;

  function wrapText(text: string, maxWidth: number, fontSize: number) {
    ctx.font = `bold ${fontSize}px "Georgia", "Times New Roman", serif`;
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (let word of words) {
      const testLine = currentLine + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.trim());
    }
    return lines;
  }

  function updateBookCover(titleIndex: number) {
    // Dark background
    ctx.fillStyle = "#0a0515";
    ctx.fillRect(0, 0, 1024, 768);

    // Subtle gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 768);
    grad.addColorStop(0, "rgba(20, 10, 40, 0.3)");
    grad.addColorStop(0.5, "rgba(10, 5, 20, 0.1)");
    grad.addColorStop(1, "rgba(20, 10, 40, 0.3)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 768);

    // Border
    ctx.strokeStyle = "rgba(180, 150, 100, 0.2)";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 964, 708);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const bookData = bookTitles[titleIndex];
    const maxWidth = 800;

    // Title with wrapping
    const titleFontSize = Math.min(72, (800 / bookData.title.length) * 1.2);
    const titleLines = wrapText(bookData.title, maxWidth, titleFontSize);
    const titleY = 260 - (titleLines.length - 1) * 35;

    ctx.font = `bold ${titleFontSize}px "Georgia", "Times New Roman", serif`;
    ctx.fillStyle = "#f0e5ff";
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 512, titleY + i * 70);
    });

    // Author
    ctx.font = '40px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = "#d4c0e8";
    ctx.fillText(bookData.author, 512, 430);

    // Year
    ctx.font = '32px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = "rgba(180, 160, 200, 0.6)";
    ctx.fillText(bookData.year, 512, 530);

    // Decorative line
    ctx.beginPath();
    const lineY = 380;
    ctx.moveTo(200, lineY);
    ctx.lineTo(824, lineY);
    ctx.strokeStyle = "rgba(180, 150, 100, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Create the cover
  let currentTitleIndex = 0;
  updateBookCover(0);
  const bookCoverTex = new THREE.CanvasTexture(bookCanvas);
  bookCoverTex.needsUpdate = true;
  bookCoverTex.minFilter = THREE.LinearFilter;
  bookCoverTex.magFilter = THREE.LinearFilter;

  // Book cover - lying flat
  const coverGeo = new THREE.PlaneGeometry(4.5, 3.2);
  const coverMat = new THREE.MeshBasicMaterial({
    map: bookCoverTex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1.0,
  });
  const coverMesh = new THREE.Mesh(coverGeo, coverMat);
  coverMesh.position.set(bookPosX, 0.4, bookPosZ);
  coverMesh.rotation.x = -Math.PI / 2;
  coverMesh.rotation.z = 0.15;
  wsGroup.add(coverMesh);

  // Book thickness
  const thicknessGeo = new THREE.BoxGeometry(4.5, 0.3, 0.3);
  const thicknessMat = new THREE.MeshBasicMaterial({
    color: 0x150a20,
    side: THREE.DoubleSide,
  });
  const thickness = new THREE.Mesh(thicknessGeo, thicknessMat);
  thickness.position.set(bookPosX, 0.15, bookPosZ + 1.6);
  thickness.rotation.x = 0;
  thickness.rotation.z = 0.15;
  wsGroup.add(thickness);

  // Book pages edge
  const pagesEdgeGeo = new THREE.BoxGeometry(4.3, 0.25, 0.1);
  const pagesEdgeMat = new THREE.MeshBasicMaterial({
    color: 0xe8e0d0,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const pagesEdge = new THREE.Mesh(pagesEdgeGeo, pagesEdgeMat);
  pagesEdge.position.set(bookPosX, 0.15, bookPosZ + 1.45);
  pagesEdge.rotation.x = 0;
  pagesEdge.rotation.z = 0.15;
  wsGroup.add(pagesEdge);

  // Store book data
  const bookData = {
    coverTex: bookCoverTex,
    canvas: bookCanvas,
    titleIndex: currentTitleIndex,
    lastSwap: 0,
    updateCover: updateBookCover,
    bookTitles: bookTitles,
    coverMesh: coverMesh,
  };
  (wsGroup as any).bookData = bookData;

  // ============================================================
  // SMOKE
  // ============================================================

  const smokeCount = 16;
  const smokeSprites: THREE.Sprite[] = [];
  for (let i = 0; i < smokeCount; i++) {
    const steamTex = createGlowTexture(220, 220, 230, 32);
    const steamMat = new THREE.SpriteMaterial({
      map: steamTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const steam = new THREE.Sprite(steamMat);
    steam.position.set(
      5 + (Math.random() - 0.5) * 0.2,
      1.4,
      2 + (Math.random() - 0.5) * 0.2,
    );
    steam.scale.set(0.3, 0.3, 1);
    steam.userData = {
      life: Math.random() * 4,
      maxLife: 3 + Math.random() * 2,
      swirlSpeed: 1.2 + Math.random() * 0.8,
      swirlPhase: Math.random() * Math.PI * 2,
      riseSpeed: 0.4 + Math.random() * 0.3,
      driftX: (Math.random() - 0.5) * 1.2,
      driftZ: (Math.random() - 0.5) * 0.8,
      startX: 5,
      startZ: 2,
    };
    wsGroup.add(steam);
    smokeSprites.push(steam);
  }

  const seatGeo = new THREE.BoxGeometry(4, 0.5, 4);
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a20,
    transparent: true,
    opacity: 0.75,
    roughness: 0.9,
    metalness: 0.1,
  });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.set(1, -3.5, 7);
  seat.receiveShadow = true;
  seat.castShadow = true;
  wsGroup.add(seat);

  const backGeo = new THREE.BoxGeometry(4, 5, 0.5);
  const back = new THREE.Mesh(backGeo, seatMat.clone());
  back.position.set(1, -1.0, 9);
  back.castShadow = true;
  back.receiveShadow = true;
  wsGroup.add(back);

  parentGroup.add(wsGroup);

  return {
    laptopScreen,
    screenGlow,
    holoRing,
    holoRing2,
    orbs,
    WORKSTATION_POS,
    wsGroup,
    smokeSprites,
    lampLight,
    lightPool,
    bookData,
    phoneScreen,
    phoneTex,
    phoneCtx,
    drawPhoneFrame,
  };
}

interface CanvasGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  layout: any;
  layoutRef?: any;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  visibleNodes: Set<string>;
  visibleLinks: GraphLink[];
  tooltip: { x: number; y: number; node: GraphNode } | null;
  onTooltip: (t: { x: number; y: number; node: GraphNode } | null) => void;
}

export interface CanvasGraphHandle {
  resetView: () => void;
}

export const CanvasGraph = forwardRef<CanvasGraphHandle, CanvasGraphProps>(
  function CanvasGraph(
    {
      nodes,
      links,
      selectedId,
      onSelect,
      hoveredId,
      onHover,
      onTooltip,
      visibleNodes,
      visibleLinks,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Function to trigger keyboard lights
    const triggerKeyboardLight = (c: any) => {
      if (!c || !c.workstation) return;

      const keyboardLights = (c.workstation.wsGroup as any).keyboardLights;
      const keys = (c.workstation.wsGroup as any).keyboardLightKeys;

      if (!keys || keys.length === 0) return;

      // Random number of keys to light up (1-5)
      const numKeys = 1 + Math.floor(Math.random() * 4);

      for (let i = 0; i < numKeys; i++) {
        const keyIndex = Math.floor(Math.random() * keys.length);
        const key = keys[keyIndex];
        if (key && key.userData) {
          key.userData.pulseIntensity = 1.0;
          key.userData.isActive = true;
        }
      }

      // Subtle glow pulse on the keyboard base
      const glow = keyboardLights?.children?.find(
        (child: any) => child instanceof THREE.Sprite && child.scale.x > 5,
      );
      if (glow) {
        glow.material.opacity = 0.15;
      }
    };

    const sceneRef = useRef<{
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: OrbitControls;
      composer: EffectComposer;
      animFrame: number;
      godNodes: Map<string, THREE.Sprite>;
      planetSprites: Map<string, THREE.Sprite>;
      moonSprites: THREE.Sprite[];
      allSprites: THREE.Sprite[];
      lineSegments: THREE.LineSegments;
      hoverLine: THREE.Line;
      packetPoints: THREE.Points;
      starLayers: THREE.Points[];
      shipGroup: THREE.Group;
      links: GraphLink[];
      clock: THREE.Clock;
      programmerModel: THREE.Group | null;
      workstation: ReturnType<typeof createProgrammerWorkstation> | null;
      dataParticles: THREE.Points | null;
    } | null>(null);

    const isCanvasClickRef = useRef(false);
    const hoveredRef = useRef<string | null>(null);
    const selectedRef = useRef<string | null>(null);
    const hoveredLinkIdx = useRef<number>(-1);

    const visibleNodesRef = useRef<Set<string>>(visibleNodes);
    const visibleLinksRef = useRef<GraphLink[]>(visibleLinks || []);
    useEffect(() => {
      visibleNodesRef.current = visibleNodes;
    }, [visibleNodes]);
    useEffect(() => {
      visibleLinksRef.current = visibleLinks || [];
    }, [visibleLinks]);

    const [interactionMode, setInteractionMode] = useState<"rotate" | "pan">(
      "rotate",
    );

    useEffect(() => {
      if (sceneRef.current && sceneRef.current.controls) {
        sceneRef.current.controls.mouseButtons.LEFT =
          interactionMode === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
      }
    }, [interactionMode]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        if (sceneRef.current) {
          (sceneRef.current as any).typingActivity = true;
          (sceneRef.current as any).lastTypingTime = Date.now();
          triggerKeyboardLight(sceneRef.current);
        }

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          if (sceneRef.current) {
            (sceneRef.current as any).typingActivity = false;
          }
        }, 2000);
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }, []);

    useEffect(() => {
      selectedRef.current = selectedId;
    }, [selectedId]);
    useEffect(() => {
      hoveredRef.current = hoveredId;
    }, [hoveredId]);

    useImperativeHandle(ref, () => ({
      resetView: () => {
        const c = sceneRef.current;
        if (!c) return;
        const startPos = c.camera.position.clone();
        const endPos = new THREE.Vector3(0, 0, 180);
        const startTarget = c.controls.target.clone();
        const endTarget = new THREE.Vector3(0, 0, 0);
        let progress = 0;
        const anim = () => {
          progress += 0.03;
          if (progress >= 1) {
            c.camera.position.copy(endPos);
            c.controls.target.copy(endTarget);
            return;
          }
          const t = easeInOut(progress);
          c.camera.position.lerpVectors(startPos, endPos, t);
          c.controls.target.lerpVectors(startTarget, endTarget, t);
          requestAnimationFrame(anim);
        };
        anim();
      },
    }));

    const flyToNode = (id: string | null) => {
      const c = sceneRef.current;
      if (!c) return;

      let targetPos = new THREE.Vector3(0, 0, 0);
      let targetCam = new THREE.Vector3(0, 0, 250);
      let shouldAnimate = false;

      if (id) {
        if (c.godNodes.has(id)) {
          targetPos.copy(c.godNodes.get(id)!.position);
          shouldAnimate = true;
        } else {
          const sMoon = c.moonSprites.find((m) => m.userData.node.id === id);
          if (sMoon) {
            targetPos.copy(sMoon.position);
            shouldAnimate = true;
          } else {
            const sPlanet = Array.from(c.planetSprites.values()).find(
              (p) => p.userData.node.id === id,
            );
            if (sPlanet) {
              targetPos.copy(sPlanet.position);
              shouldAnimate = true;
            }
          }
        }
        if (shouldAnimate)
          targetCam = targetPos.clone().add(new THREE.Vector3(15, 10, 15));
      } else {
        shouldAnimate = false;
      }

      if (shouldAnimate) {
        const startPos = c.camera.position.clone();
        const endPos = targetCam;
        const startTarget = c.controls.target.clone();

        if (
          startPos.distanceTo(endPos) < 1 &&
          startTarget.distanceTo(targetPos) < 1
        )
          return;

        let progress = 0;
        const travelAnim = () => {
          progress += 0.02;
          if (progress >= 1) {
            c.camera.position.copy(endPos);
            c.controls.target.copy(targetPos);
            return;
          }
          const t = easeInOut(progress);
          c.camera.position.lerpVectors(startPos, endPos, t);
          c.controls.target.lerpVectors(startTarget, targetPos, t);
          requestAnimationFrame(travelAnim);
        };
        travelAnim();
      }
    };

    useEffect(() => {
      if (!isCanvasClickRef.current) {
        flyToNode(selectedId);
      }
    }, [selectedId]);

    useEffect(() => {
      if (!containerRef.current || !nodes || nodes.length === 0) return;
      const container = containerRef.current;
      const width = container.clientWidth || window.innerWidth || 1000;
      const height = container.clientHeight || window.innerHeight || 800;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020205, 0.003);

      // Faint, slowly drifting galaxy backdrop.
      // A large inward-facing sphere (fog disabled, drawn first) so it is
      // always visible behind the graph — even at max zoom-out — and can be
      // rotated each frame for gentle motion. Negligible per-frame cost.
      const bgTex = createSpaceBackgroundTexture();
      const bgSphere = new THREE.Mesh(
        new THREE.SphereGeometry(4000, 32, 32),
        new THREE.MeshBasicMaterial({
          map: bgTex,
          side: THREE.BackSide,
          fog: false,
          depthWrite: false,
          depthTest: false,
        }),
      );
      bgSphere.renderOrder = -1;
      scene.add(bgSphere);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(10, 30, 20);
      scene.add(dirLight);
      const backLight = new THREE.DirectionalLight(0x8888ff, 0.6);
      backLight.position.set(-10, 10, -20);
      scene.add(backLight);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 9000);
      camera.position.set(0, 0, 250);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = false;
      controls.target.set(0, 0, 0);
      controls.maxDistance = 3500;

      const renderScene = new RenderPass(scene, camera);
      // Half-resolution bloom: visually near-identical but far cheaper,
      // since the bloom pass shades every pixel of its render targets.
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(Math.floor(width / 2), Math.floor(height / 2)),
        1.2,
        0.8,
        0.2,
      );
      const composer = new EffectComposer(renderer);
      composer.addPass(renderScene);
      composer.addPass(bloomPass);

      const byCommunity = new Map<number, GraphNode[]>();
      nodes.forEach((n) => {
        const arr = byCommunity.get(n.community) || [];
        arr.push(n);
        byCommunity.set(n.community, arr);
      });
      for (const arr of byCommunity.values())
        arr.sort((a, b) => b.degree - a.degree);

      const communityIds = Array.from(byCommunity.keys());
      const orbitRadii = new Map<number, number>();
      communityIds.forEach((cid, idx) =>
        orbitRadii.set(cid, 25 + Math.sqrt(idx + 1) * 20),
      );

      const createStarLayer = (
        count: number,
        size: number,
        opacity: number,
        spreadR: number,
        spreadY: number,
        colors: string[],
      ) => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const parsedColors = colors.map((c) => new THREE.Color(c));
        for (let i = 0; i < count; i++) {
          const r = 40 + Math.pow(Math.random(), 1.5) * spreadR;
          const theta = Math.random() * Math.PI * 2;
          const y =
            (Math.random() - 0.5) * spreadY * Math.pow(Math.random(), 2);
          pos[i * 3] = r * Math.cos(theta);
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = r * Math.sin(theta);
          const color =
            parsedColors[Math.floor(Math.random() * parsedColors.length)];
          col[i * 3] = Math.min(1, color.r * (0.8 + Math.random() * 0.4));
          col[i * 3 + 1] = Math.min(1, color.g * (0.8 + Math.random() * 0.4));
          col[i * 3 + 2] = Math.min(1, color.b * (0.8 + Math.random() * 0.4));
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const starTex = createGlowTexture(255, 255, 255, 32);
        return new THREE.Points(
          geo,
          new THREE.PointsMaterial({
            size,
            map: starTex,
            vertexColors: true,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
      };
      const starLayers: THREE.Points[] = [];
      // Finer background star field only. The old bright size-2.5 "large white
      // dots" layer (star2) was removed — with bloom it bloomed into a dirty
      // haze across the background and washed out the view.
      const star1 = createStarLayer(6000, 1.0, 0.5, 900, 350, [
        "#ffffff",
        "#ffcc88",
        "#99ccff",
      ]);
      starLayers.push(star1);
      scene.add(star1);

      const createNebulaBackgroundLayer = () => {
        const group = new THREE.Group();
        const colors = [
          { r: 255, g: 100, b: 200 },
          { r: 100, g: 150, b: 255 },
          { r: 150, g: 100, b: 255 },
          { r: 255, g: 150, b: 100 },
        ];

        for (let i = 0; i < 15; i++) {
          const col = colors[Math.floor(Math.random() * colors.length)];
          const tex = createGlowTexture(col.r, col.g, col.b, 256, false);
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: tex,
              transparent: true,
              opacity: 0.15 + Math.random() * 0.1,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );

          const angle1 = Math.random() * Math.PI * 2;
          const angle2 = (Math.random() - 0.5) * Math.PI;
          const radius = 800 + Math.random() * 400;

          sprite.position.x = Math.cos(angle1) * Math.cos(angle2) * radius;
          sprite.position.y = Math.sin(angle2) * radius;
          sprite.position.z = Math.sin(angle1) * Math.cos(angle2) * radius;

          const scale = 500 + Math.random() * 800;
          sprite.scale.set(scale, scale, 1);
          group.add(sprite);
        }
        return group;
      };

      const nebulaBackgroundLayer = createNebulaBackgroundLayer();
      scene.add(nebulaBackgroundLayer);

      const createNebulaLayer = () => {
        const group = new THREE.Group();

        const ambientTex = createGlowTexture(12, 45, 75, 256, false);
        const ambient = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: ambientTex,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        ambient.scale.set(3200, 2200, 1);
        ambient.position.set(0, 0, -200);
        group.add(ambient);

        const pillars = [
          { x: -200, h: 400, w: 120, y: -100, z: -150 },
          { x: 40, h: 350, w: 100, y: -100, z: -100 },
          { x: 200, h: 300, w: 80, y: -100, z: -120 },
        ];

        const coreTex = createGlowTexture(4, 2, 1, 256, false);
        const dustBaseTex = createGlowTexture(30, 14, 6, 256, false);
        const dustMidTex = createGlowTexture(65, 35, 16, 256, false);
        const dustUpperTex = createGlowTexture(110, 55, 24, 256, false);
        const haGlowTex = createGlowTexture(230, 50, 80, 256, false);
        const oiiiGlowTex = createGlowTexture(30, 175, 190, 256, false);
        const siiGlowTex = createGlowTexture(210, 110, 40, 256, false);
        const starBlueTex = createGlowTexture(160, 200, 255, 128, true);
        const starWhiteTex = createGlowTexture(255, 252, 240, 128, true);
        const tinyStarTex = createGlowTexture(220, 210, 245, 16, true);

        const matCore = new THREE.SpriteMaterial({
          map: coreTex,
          transparent: true,
          opacity: 0.75,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matDustBase = new THREE.SpriteMaterial({
          map: dustBaseTex,
          transparent: true,
          opacity: 0.55,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matDustMid = new THREE.SpriteMaterial({
          map: dustMidTex,
          transparent: true,
          opacity: 0.45,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matDustUpper = new THREE.SpriteMaterial({
          map: dustUpperTex,
          transparent: true,
          opacity: 0.25,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matHA = new THREE.SpriteMaterial({
          map: haGlowTex,
          transparent: true,
          opacity: 0.2,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matOIII = new THREE.SpriteMaterial({
          map: oiiiGlowTex,
          transparent: true,
          opacity: 0.15,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matSII = new THREE.SpriteMaterial({
          map: siiGlowTex,
          transparent: true,
          opacity: 0.18,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matStarBlue = new THREE.SpriteMaterial({
          map: starBlueTex,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const matStarWhite = new THREE.SpriteMaterial({
          map: starWhiteTex,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const matTinyStar = new THREE.SpriteMaterial({
          map: tinyStarTex,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        pillars.forEach((p) => {
          const numBlobs = Math.floor(p.h / 45);

          for (let i = 0; i < numBlobs; i++) {
            const blobY = p.y + i * (p.h / numBlobs);
            const taper = 1.0 - (i / numBlobs) * 0.55;
            const blobW = p.w * taper;
            const blobH = 140 * taper;

            const core = new THREE.Sprite(matCore);
            core.scale.set(blobW * 0.35, blobH * 0.7, 1);
            core.position.set(
              p.x + (Math.random() - 0.5) * 25,
              blobY + (Math.random() - 0.5) * 10,
              p.z + 3,
            );
            group.add(core);

            const dustBase = new THREE.Sprite(matDustBase);
            dustBase.scale.set(blobW * 0.55, blobH * 0.85, 1);
            dustBase.position.set(
              p.x + (Math.random() - 0.5) * 18,
              blobY + (Math.random() - 0.5) * 7,
              p.z + 2,
            );
            group.add(dustBase);

            const dustMid = new THREE.Sprite(matDustMid);
            dustMid.scale.set(blobW * 0.7, blobH * 0.95, 1);
            dustMid.position.set(
              p.x + (Math.random() - 0.5) * 15,
              blobY + (Math.random() - 0.5) * 5,
              p.z + 1,
            );
            group.add(dustMid);

            const dustUpper = new THREE.Sprite(matDustUpper);
            dustUpper.scale.set(blobW * 0.85, blobH * 1.05, 1);
            dustUpper.position.set(
              p.x + (Math.random() - 0.5) * 12,
              blobY + (Math.random() - 0.5) * 4,
              p.z,
            );
            group.add(dustUpper);

            const haEdge = new THREE.Sprite(matHA);
            haEdge.scale.set(blobW * 1.15, blobH * 1.15, 1);
            haEdge.position.set(
              p.x + (Math.random() - 0.5) * 8 + 3,
              blobY + (Math.random() - 0.5) * 4,
              p.z - 5,
            );
            group.add(haEdge);

            const oiiiEdge = new THREE.Sprite(matOIII);
            oiiiEdge.scale.set(blobW * 1.1, blobH * 1.1, 1);
            oiiiEdge.position.set(
              p.x + (Math.random() - 0.5) * 8 - 3,
              blobY + (Math.random() - 0.5) * 4,
              p.z - 5,
            );
            group.add(oiiiEdge);

            const siiEdge = new THREE.Sprite(matSII);
            siiEdge.scale.set(blobW * 1.2, blobH * 1.2, 1);
            siiEdge.position.set(
              p.x + (Math.random() - 0.5) * 10,
              blobY + (Math.random() - 0.5) * 5,
              p.z - 3,
            );
            group.add(siiEdge);
          }

          const tipBlue = new THREE.Sprite(matStarBlue);
          tipBlue.scale.set(70, 70, 1);
          tipBlue.position.set(p.x - 5, p.y + p.h + 10, p.z + 8);
          group.add(tipBlue);

          const tipWhite = new THREE.Sprite(matStarWhite);
          tipWhite.scale.set(45, 45, 1);
          tipWhite.position.set(p.x + 8, p.y + p.h + 25, p.z + 12);
          group.add(tipWhite);

          for (let s = 0; s < 6; s++) {
            const egg = new THREE.Sprite(matTinyStar);
            egg.scale.set(10 + Math.random() * 14, 10 + Math.random() * 14, 1);
            egg.position.set(
              p.x + (Math.random() - 0.5) * p.w * 0.6,
              p.y + p.h * 0.2 + Math.random() * p.h * 0.7,
              p.z + (Math.random() - 0.5) * 20 + 2,
            );
            group.add(egg);
          }
        });

        const matWisp1 = new THREE.SpriteMaterial({
          map: siiGlowTex,
          transparent: true,
          opacity: 0.1,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const matWisp2 = new THREE.SpriteMaterial({
          map: oiiiGlowTex,
          transparent: true,
          opacity: 0.09,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const w1 = new THREE.Sprite(matWisp1);
        w1.scale.set(650, 450, 1);
        w1.position.set(-80, -180, -160);
        group.add(w1);
        const w2 = new THREE.Sprite(matWisp2);
        w2.scale.set(580, 420, 1);
        w2.position.set(140, -220, -140);
        group.add(w2);
        const w3 = new THREE.Sprite(matWisp1);
        w3.scale.set(750, 550, 1);
        w3.position.set(30, -150, -170);
        group.add(w3);

        const bgTex1 = createGlowTexture(140, 70, 55, 1024, false);
        const bgTex2 = createGlowTexture(50, 130, 150, 1024, false);
        const matBg1 = new THREE.SpriteMaterial({
          map: bgTex1,
          transparent: true,
          opacity: 0.07,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const matBg2 = new THREE.SpriteMaterial({
          map: bgTex2,
          transparent: true,
          opacity: 0.06,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const bg1 = new THREE.Sprite(matBg1);
        bg1.scale.set(1300, 850, 1);
        bg1.position.set(30, -100, -180);
        group.add(bg1);
        const bg2 = new THREE.Sprite(matBg2);
        bg2.scale.set(1100, 720, 1);
        bg2.position.set(-25, -80, -175);
        group.add(bg2);
        const bg3 = new THREE.Sprite(matBg1);
        bg3.scale.set(900, 600, 1);
        bg3.position.set(10, -40, -170);
        group.add(bg3);

        const labelCanvas = document.createElement("canvas");
        labelCanvas.width = 768;
        labelCanvas.height = 180;
        const lctx = labelCanvas.getContext("2d")!;
        lctx.textAlign = "center";
        lctx.textBaseline = "middle";

        lctx.shadowColor = "rgba(180, 120, 50, 0.10)";
        lctx.shadowBlur = 10;
        lctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
        lctx.fillStyle = "rgba(210, 155, 80, 0.25)";
        //lctx.fillText("CREATION PILLARS", 384, 90);
        lctx.shadowBlur = 0;

        lctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
        lctx.strokeStyle = "rgba(8, 4, 1, 0.20)";
        lctx.lineWidth = 1;
        //lctx.strokeText("CREATION PILLARS", 384, 90);
        lctx.fillStyle = "rgba(220, 175, 95, 0.22)";
        //lctx.fillText("CREATION PILLARS", 384, 90);

        const labelTex = new THREE.CanvasTexture(labelCanvas);
        labelTex.minFilter = THREE.LinearFilter;
        const matLabel = new THREE.SpriteMaterial({
          map: labelTex,
          transparent: true,
          opacity: 0.5,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const label = new THREE.Sprite(matLabel);
        label.scale.set(450, 110, 1);
        label.position.set(0, 80, -50);
        group.add(label);

        return group;
      };

      const nebulaGroup = createNebulaLayer();
      scene.add(nebulaGroup);

      // ============================================================
      // GARGANTUA BLACK HOLE - WILL ENGULF EVERYTHING
      // ============================================================
      const blackHoleGroup = new THREE.Group();

      const bhCanvas = document.createElement("canvas");
      // Half the previous 2048 resolution: the redraw + GPU re-upload was a
      // periodic stall that showed up as stutter during camera motion. The
      // black hole is a soft glow, so the lower res is imperceptible.
      bhCanvas.width = 1024;
      bhCanvas.height = 1024;
      const bhCtx = bhCanvas.getContext("2d")!;
      // Keep the existing 2048-based drawing coordinates intact.
      bhCtx.scale(0.5, 0.5);

      function drawBlackHole(time: number) {
        const cx = 1024,
          cy = 1024;
        const ehR = 200;
        bhCtx.clearRect(0, 0, 2048, 2048);

        const lensGrad = bhCtx.createRadialGradient(
          cx,
          cy,
          ehR + 50,
          cx,
          cy,
          800,
        );
        lensGrad.addColorStop(0, "rgba(255, 200, 100, 0.3)");
        lensGrad.addColorStop(0.2, "rgba(255, 180, 80, 0.2)");
        lensGrad.addColorStop(0.5, "rgba(200, 120, 50, 0.1)");
        lensGrad.addColorStop(0.8, "rgba(100, 60, 30, 0.05)");
        lensGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        bhCtx.fillStyle = lensGrad;
        bhCtx.fillRect(0, 0, 2048, 2048);

        const tiltAngle = 0;
        bhCtx.save();
        bhCtx.translate(cx, cy);
        bhCtx.rotate(tiltAngle);

        for (let layer = 0; layer < 12; layer++) {
          const progress = layer / 12;
          const radius = ehR + 50 + progress * 350;
          const width = 30 + (1 - progress) * 40;
          const opacity = 0.4 - progress * 0.35;
          bhCtx.beginPath();
          bhCtx.ellipse(0, 0, radius, radius * 0.08, 0, 0, Math.PI * 2);
          const temp = 1 - progress;
          const r = Math.round(80 + 175 * temp);
          const g = Math.round(60 + 195 * temp * temp);
          const b = Math.round(40 + 215 * temp * temp * temp);
          bhCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * (0.8 + Math.sin(time * 0.1 + layer) * 0.2)})`;
          bhCtx.lineWidth = width;
          bhCtx.stroke();
        }
        bhCtx.restore();

        const ringPulse = 0.8 + Math.sin(time * 0.1) * 0.2;
        bhCtx.save();
        bhCtx.beginPath();
        bhCtx.arc(
          cx,
          cy,
          ehR + 15,
          Math.PI + 0.3 + Math.sin(time * 0.05) * 0.05,
          -0.3 + Math.sin(time * 0.04) * 0.05,
          false,
        );
        const topGrad = bhCtx.createLinearGradient(cx - ehR, cy, cx + ehR, cy);
        topGrad.addColorStop(0, "rgba(255, 180, 80, 0)");
        topGrad.addColorStop(0.15, `rgba(255, 220, 150, ${0.6 * ringPulse})`);
        topGrad.addColorStop(0.3, `rgba(255, 240, 200, ${0.8 * ringPulse})`);
        topGrad.addColorStop(0.5, `rgba(255, 255, 220, ${0.9 * ringPulse})`);
        topGrad.addColorStop(0.7, `rgba(255, 240, 200, ${0.8 * ringPulse})`);
        topGrad.addColorStop(0.85, `rgba(255, 220, 150, ${0.6 * ringPulse})`);
        topGrad.addColorStop(1, "rgba(255, 180, 80, 0)");
        bhCtx.strokeStyle = topGrad;
        bhCtx.lineWidth = 12 + Math.sin(time * 0.08) * 2;
        bhCtx.stroke();
        bhCtx.restore();

        const breathe = 1 + Math.sin(time * 0.03) * 0.02;
        const currentEhR = ehR * breathe;
        const ehGrad = bhCtx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          currentEhR + 10,
        );
        ehGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
        ehGrad.addColorStop(0.6, "rgba(0, 0, 0, 1)");
        ehGrad.addColorStop(0.85, "rgba(0, 0, 0, 0.95)");
        ehGrad.addColorStop(
          0.95,
          `rgba(20, 10, 5, ${0.5 + Math.sin(time * 0.05) * 0.2})`,
        );
        ehGrad.addColorStop(1, "rgba(40, 20, 10, 0)");
        bhCtx.beginPath();
        bhCtx.arc(cx, cy, currentEhR + 10, 0, Math.PI * 2);
        bhCtx.fillStyle = ehGrad;
        bhCtx.fill();

        const ringBrightness = 0.7 + Math.sin(time * 0.1) * 0.3;
        bhCtx.beginPath();
        bhCtx.arc(cx, cy, currentEhR + 2, 0, Math.PI * 2);
        bhCtx.strokeStyle = `rgba(255, 240, 180, ${0.9 * ringBrightness})`;
        bhCtx.lineWidth = 3 + Math.sin(time * 0.12) * 0.5;
        bhCtx.stroke();

        bhCtx.beginPath();
        bhCtx.arc(cx, cy, currentEhR + 6, 0, Math.PI * 2);
        bhCtx.strokeStyle = `rgba(255, 210, 150, ${0.5 * ringBrightness})`;
        bhCtx.lineWidth = 2 + Math.sin(time * 0.09 + 0.3) * 0.5;
        bhCtx.stroke();

        bhCtx.beginPath();
        bhCtx.arc(cx, cy, currentEhR + 12, 0, Math.PI * 2);
        bhCtx.strokeStyle = `rgba(255, 180, 120, ${0.3 * ringBrightness})`;
        bhCtx.lineWidth = 1.5 + Math.sin(time * 0.07 + 0.6) * 0.5;
        bhCtx.stroke();

        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 + time * 0.005;
          const dist = currentEhR + 20 + Math.sin(i * 1.7 + time * 0.03) * 15;
          const x = cx + Math.cos(angle + time * 0.003) * dist;
          const y = cy + Math.sin(angle + time * 0.003) * dist * 0.4;
          const size = 20 + Math.sin(i * 2.3 + time * 0.04) * 10;
          const brightness =
            0.08 + Math.sin(i * 1.7 + time * 0.05) * 0.05 + 0.08;
          const grad = bhCtx.createRadialGradient(x, y, 0, x, y, size);
          grad.addColorStop(
            0,
            `rgba(255, 220, 150, ${brightness * ringBrightness})`,
          );
          grad.addColorStop(
            0.5,
            `rgba(255, 200, 120, ${brightness * ringBrightness * 0.5})`,
          );
          grad.addColorStop(1, `rgba(255, 200, 100, 0)`);
          bhCtx.fillStyle = grad;
          bhCtx.beginPath();
          bhCtx.arc(x, y, size, 0, Math.PI * 2);
          bhCtx.fill();
        }
      }

      drawBlackHole(0);
      const bhTexture = new THREE.CanvasTexture(bhCanvas);
      const bhSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: bhTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.65,
          blending: THREE.AdditiveBlending,
        }),
      );
      bhSprite.scale.set(600, 600, 1);
      blackHoleGroup.add(bhSprite);

      (blackHoleGroup as any).texture = bhTexture;
      (blackHoleGroup as any).canvas = bhCanvas;
      (blackHoleGroup as any).drawFunction = drawBlackHole;
      (blackHoleGroup as any).sprite = bhSprite;

      blackHoleGroup.position.set(0, 30, -300);
      scene.add(blackHoleGroup);

      const workstation = createProgrammerWorkstation(nebulaGroup);

      // Load the GLB programmer model
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        "https://unpkg.com/three@0.184.0/examples/jsm/libs/draco/",
      );
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);
      // Replace the GLTF loader callback section with this:

      gltfLoader.load(
        "/man_typing.glb",
        (gltf) => {
          const model = gltf.scene as THREE.Group;
          if (!model) return;
          model.scale.set(4, 4, 4);
          model.position.set(1, -5.5, 6);
          model.rotation.y = Math.PI;

          // ============================================================
          // TRANSCENDENT BEING - ETHEREAL HOLOGRAPHIC FORM
          // ============================================================

          // Colors: deep mystical purple with subtle energy
          const PRIMARY = new THREE.Color(0x6d28d9);
          const ENERGY = new THREE.Color(0x7c3aed);

          // 1. Transform the model with holographic/ethereal materials
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (Array.isArray(child.material)) {
                child.material = child.material.map((m) => {
                  const mat = (m as THREE.MeshStandardMaterial).clone();

                  // Make it look like a hologram - slightly transparent
                  mat.transparent = true;
                  mat.opacity = 0.85;

                  // Color tint - deep purple
                  if (mat.color) mat.color.lerp(PRIMARY, 0.6);

                  // Subtle emissive - not bright, just a gentle inner glow
                  mat.emissive = ENERGY;
                  mat.emissiveIntensity = 0.08; // Very subtle!

                  // Make it a bit metallic/shiny for ethereal look
                  mat.metalness = 0.4;
                  mat.roughness = 0.3;

                  mat.needsUpdate = true;
                  return mat;
                });
              } else {
                const mat = (
                  child.material as THREE.MeshStandardMaterial
                ).clone();
                mat.transparent = true;
                mat.opacity = 0.85;
                if (mat.color) mat.color.lerp(PRIMARY, 0.6);
                mat.emissive = ENERGY;
                mat.emissiveIntensity = 0.08;
                mat.metalness = 0.4;
                mat.roughness = 0.3;
                mat.needsUpdate = true;
                child.material = mat;
              }
            }
          });

          // 2. Subtle Aura (like a faint energy field around the being)
          const auraGroup = new THREE.Group();

          // Very faint outer glow - not blinding!
          const auraTex = createGlowTexture(100, 50, 200, 128, false);
          const aura = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: auraTex,
              transparent: true,
              opacity: 0.08, // Very subtle
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          aura.scale.set(10, 10, 1);
          aura.position.set(0, 3, 0);
          auraGroup.add(aura);

          // 3. Energy particles (like floating dust, not bright)
          const particleCount = 80;
          const particleGeo = new THREE.BufferGeometry();
          const particlePos = new Float32Array(particleCount * 3);
          for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 3 + Math.random() * 4;

            particlePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            particlePos[i * 3 + 1] = radius * Math.cos(phi) + 3;
            particlePos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
          }
          particleGeo.setAttribute(
            "position",
            new THREE.BufferAttribute(particlePos, 3),
          );

          const particleTex = createGlowTexture(150, 100, 255, 16, true);
          const particleMat = new THREE.PointsMaterial({
            size: 0.15,
            map: particleTex,
            transparent: true,
            opacity: 0.3, // Very subtle
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0x8b5cf6,
          });

          const particles = new THREE.Points(particleGeo, particleMat);
          particles.position.copy(model.position);
          particles.position.y += 3;
          scene.add(particles);

          // 4. One simple ring
          const RING_RADIUS = 0.3;
          const RING_THICKNESS = 0.03;
          const RING_OPACITY = 0.5;
          // ===========================

          const ringGeo = new THREE.TorusGeometry(
            RING_RADIUS,
            RING_THICKNESS,
            8,
            48,
          );
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0x7c3aed,
            transparent: true,
            opacity: RING_OPACITY,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.set(0, 3, 0); // Height of the ring
          ring.rotation.x = Math.PI / 3;
          model.add(ring);

          model.add(auraGroup);

          // Store for animation
          (model as any).transcendentData = {
            aura,
            particles,
            ring,
          };

          workstation.wsGroup.add(model);

          // Store references
          if (sceneRef.current) {
            (sceneRef.current as any).transcendentParticles = particles;
            (sceneRef.current as any).transcendentModel = model;
          }

          // ============================================================
          // HITBOX - For click detection
          // ============================================================
          const hitboxGeo = new THREE.SphereGeometry(2.5, 8, 6);
          const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
          const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
          hitbox.position.set(
            workstation.WORKSTATION_POS.x,
            workstation.WORKSTATION_POS.y - 7.5 + 7,
            workstation.WORKSTATION_POS.z - 6,
          );
          hitbox.userData = { isProgrammerHitbox: true };
          scene.add(hitbox);

          // ============================================================
          // ANIMATION MIXER
          // ============================================================
          const mixer = new THREE.AnimationMixer(model);
          if (gltf.animations.length > 0) {
            const clip = gltf.animations[0];
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
          }
          if (sceneRef.current) {
            (sceneRef.current as any).mixer = mixer;
            (sceneRef.current as any).programmerHitbox = hitbox;
            (sceneRef.current as any).nebulaBackground = nebulaBackgroundLayer;
            (sceneRef.current as any).constellationGlows = constellationGlows;
            sceneRef.current.programmerModel = model;
          }
        },
        undefined,
        (err) => {
          console.warn("Failed to load programmer model:", err);
        },
      );

      const allNodesSorted = [...nodes].sort((a, b) => {
        const aIsApp =
          a.label.toLowerCase().includes("app.tsx") ||
          a.label.toLowerCase().includes("app.jsx");
        const bIsApp =
          b.label.toLowerCase().includes("app.tsx") ||
          b.label.toLowerCase().includes("app.jsx");
        if (aIsApp && !bIsApp) return -1;
        if (bIsApp && !aIsApp) return 1;
        return b.degree - a.degree;
      });
      const godNodesList = allNodesSorted.slice(0, 5);
      const godNodeIds = new Set(godNodesList.map((n) => n.id));
      const godNodesMap = new Map<string, THREE.Sprite>();
      const constellationGlows: THREE.Sprite[] = [];
      const GOD_R = 50;

      for (let i = 0; i < godNodesList.length; i++) {
        const n = godNodesList[i];
        const col = new THREE.Color(
          COMMUNITY_PALETTE[n.community % COMMUNITY_PALETTE.length],
        );
        const tex = createNodeTexture(
          Math.round(col.r * 255),
          Math.round(col.g * 255),
          Math.round(col.b * 255),
          128,
        );
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
            opacity: 0.85,
          }),
        );
        const gSize = 8.0 + Math.pow(n.degree, 0.6) * 2.0;
        sprite.scale.set(gSize, gSize, 1);

        if (i === 0) {
          sprite.position.set(0, 0, 0);
        } else {
          // 3D Fibonacci-sphere distribution: spreads the top hubs through
          // volume instead of a flat circle, so they never collapse into a
          // straight line when viewed edge-on and have room between them.
          const total = godNodesList.length;
          const t = i / (total - 1);
          const phi = Math.PI * (3 - Math.sqrt(5));
          const y = 1 - 2 * t;
          const r = Math.sqrt(Math.max(0, 1 - y * y));
          const theta = phi * i;
          sprite.position.set(
            Math.cos(theta) * r * GOD_R,
            y * GOD_R,
            Math.sin(theta) * r * GOD_R,
          );
        }

        sprite.userData = {
          nodeId: n.id,
          isGod: true,
          node: n,
          baseSize: gSize,
        };
        scene.add(sprite);
        godNodesMap.set(n.id, sprite);

        // Community Constellation Glow
        const constellationTex = createGlowTexture(
          Math.round(col.r * 255),
          Math.round(col.g * 255),
          Math.round(col.b * 255),
          256,
          false,
        );
        const constellationSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: constellationTex,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        constellationSprite.scale.set(150, 150, 1);
        constellationSprite.position.copy(sprite.position);
        scene.add(constellationSprite);
        constellationGlows.push(constellationSprite);
      }

      // ============================================================
      // THE SCANNING DRONE (Removed per user request)
      // ============================================================
      const shipGroup = new THREE.Group();
      scene.add(shipGroup);

      // Data Particles
      const particleCount = 200;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleSpeeds = new Float32Array(particleCount);
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] =
          workstation.WORKSTATION_POS.x + (Math.random() - 0.5) * 40;
        particlePositions[i * 3 + 1] =
          workstation.WORKSTATION_POS.y + (Math.random() - 0.5) * 60;
        particlePositions[i * 3 + 2] =
          workstation.WORKSTATION_POS.z + (Math.random() - 0.5) * 30;
        particleSpeeds[i] = 0.3 + Math.random() * 0.7;
      }
      particleGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(particlePositions, 3),
      );
      const particleTex = createGlowTexture(0, 200, 255, 32, true);
      const particleMat = new THREE.PointsMaterial({
        size: 1.2,
        map: particleTex,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dataParticles = new THREE.Points(particleGeo, particleMat);
      scene.add(dataParticles);

      const planetSprites = new Map<string, THREE.Sprite>();
      const moonSprites: THREE.Sprite[] = [];

      communityIds.forEach((cid, idx) => {
        const members = byCommunity.get(cid)!;
        const col = new THREE.Color(
          COMMUNITY_PALETTE[cid % COMMUNITY_PALETTE.length],
        );
        const orbitR = orbitRadii.get(cid)!;
        const startAngle = idx * GOLDEN_ANGLE;

        let localMembers = members.filter((n) => !godNodeIds.has(n.id));
        if (localMembers.length === 0) return;
        localMembers.sort((a, b) => b.degree - a.degree);

        const hubNode = localMembers[0];
        const moonMembers = localMembers.slice(1);

        const pTex = createGlowTexture(
          Math.round(col.r * 255),
          Math.round(col.g * 255),
          Math.round(col.b * 255),
          128,
          true,
        );
        const pSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: pTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.12,
          }),
        );
        const pSize =
          5.0 +
          Math.pow(hubNode.degree, 0.6) * 1.5 +
          Math.pow(localMembers.length, 0.4);
        pSprite.scale.set(pSize, pSize, 1);

        const pIncl = (Math.random() - 0.5) * 1.2;
        const pPhaseY = Math.random() * Math.PI * 2;

        pSprite.position.set(
          Math.cos(startAngle) * orbitR,
          Math.sin(startAngle + pPhaseY) * (orbitR * pIncl),
          Math.sin(startAngle) * orbitR,
        );
        pSprite.userData = {
          communityId: cid,
          isPlanet: true,
          startAngle,
          orbitR,
          node: hubNode,
          baseSize: pSize,
          incl: pIncl,
          phaseY: pPhaseY,
        };
        scene.add(pSprite);
        planetSprites.set(`community_${cid}`, pSprite);

        const mTex = createGlowTexture(
          Math.round(col.r * 255),
          Math.round(col.g * 255),
          Math.round(col.b * 255),
          64,
          false,
        );
        moonMembers.forEach((n, mIdx) => {
          const ma = mIdx * GOLDEN_ANGLE;
          const mr = 4.0 + Math.pow(mIdx, 0.6) * 1.8;

          const mSize = 3.0 + Math.pow(n.degree, 0.5) * 1.5;
          const mSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: mTex,
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              opacity: 0.08,
            }),
          );
          mSprite.scale.set(mSize, mSize, 1);
          mSprite.frustumCulled = false;

          const mIncl = (Math.random() - 0.5) * 2.0;
          const mPhaseY = Math.random() * Math.PI * 2;

          mSprite.userData = {
            isMoon: true,
            node: n,
            angle: ma,
            r: mr,
            cid,
            baseSize: mSize,
            incl: mIncl,
            phaseY: mPhaseY,
            // Cache the parent planet so the per-frame moon loop avoids a
            // `community_${cid}` string concat + Map lookup for every moon.
            planet: pSprite,
          };
          scene.add(mSprite);
          moonSprites.push(mSprite);
        });
      });

      const lineGeo = new THREE.BufferGeometry();
      const linePos = new Float32Array(links.length * 6);
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
      lineGeo.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(0, 0, 0),
        1000000,
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
      lineSegments.frustumCulled = false;
      scene.add(lineSegments);

      const hGeo = new THREE.BufferGeometry();
      const hPos = new Float32Array(6);
      hGeo.setAttribute("position", new THREE.BufferAttribute(hPos, 3));
      const hMat = new THREE.LineBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const hoverLine = new THREE.Line(hGeo, hMat);
      hoverLine.visible = false;
      scene.add(hoverLine);

      const packetGeo = new THREE.BufferGeometry();
      const packetPos = new Float32Array(links.length * 3 * 3);
      packetGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(packetPos, 3),
      );
      const packetTex = createGlowTexture(150, 220, 255, 64, true);
      const packetMat = new THREE.PointsMaterial({
        size: 1.5,
        map: packetTex,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const packetPoints = new THREE.Points(packetGeo, packetMat);
      packetPoints.frustumCulled = false;
      scene.add(packetPoints);

      const clock = new THREE.Clock();
      let lastElapsed = 0;

      const nodeIdToSprite = new Map<string, THREE.Object3D>();
      for (const [id, s] of godNodesMap) nodeIdToSprite.set(id, s);
      for (const [, p] of planetSprites)
        nodeIdToSprite.set(p.userData.node.id, p);
      for (const m of moonSprites) nodeIdToSprite.set(m.userData.node.id, m);

      const allSpritesCache = [
        ...Array.from(godNodesMap.values()),
        ...Array.from(planetSprites.values()),
        ...moonSprites,
      ];

      sceneRef.current = {
        scene,
        camera,
        renderer,
        controls,
        composer,
        animFrame: 0,
        godNodes: godNodesMap,
        planetSprites,
        moonSprites,
        allSprites: allSpritesCache,
        lineSegments,
        hoverLine,
        packetPoints,
        starLayers,
        shipGroup,
        links,
        clock,
        programmerModel: null,
        workstation,
        dataParticles,
      };

      const animate = () => {
        const c = sceneRef.current;
        if (!c) return;
        const elapsed = clock.getElapsedTime();
        const delta = elapsed - lastElapsed;
        lastElapsed = elapsed;

        c.starLayers[0].rotation.y = elapsed * 0.008;
        c.starLayers[0].rotation.x = Math.sin(elapsed * 0.003) * 0.05;

        // Slowly drift the background galaxy sphere
        bgSphere.rotation.y = elapsed * 0.006;
        bgSphere.rotation.x = Math.sin(elapsed * 0.02) * 0.02;

        const overclocked = (c as any).isOverclocked;
        const timeScale = overclocked ? 1.5 : 0.5;
        const scaledElapsed = elapsed * timeScale;

        const wp = c.workstation?.WORKSTATION_POS ?? ZERO_VECTOR;

        // ============================================================
        // REACTIVE KEYBOARD LIGHTS ANIMATION
        // ============================================================
        const keyboardLights = (c.workstation?.wsGroup as any)?.keyboardLights;
        const keys = (c.workstation?.wsGroup as any)?.keyboardLightKeys;

        if (keyboardLights && keys) {
          const isTyping = (c as any).typingActivity || false;
          const time = elapsed;

          // Animate each key
          keys.forEach((key: THREE.Sprite) => {
            const ud = key.userData;

            // Decay the pulse intensity
            if (ud.pulseIntensity > 0) {
              ud.pulseIntensity -= 0.015 * ud.pulseDecay;
              if (ud.pulseIntensity < 0) ud.pulseIntensity = 0;
            }

            // Calculate pulse effect
            const intensity = ud.pulseIntensity;
            const basePulse = isTyping ? 0.1 : 0;
            const totalIntensity = Math.max(intensity, basePulse);

            // Set opacity and color
            if (totalIntensity > 0.01) {
              key.material.opacity = totalIntensity * 0.8;
              key.material.color.set(ud.baseColor);
              key.scale.set(
                0.15 + totalIntensity * 0.15,
                0.15 + totalIntensity * 0.15,
                1,
              );
            } else {
              key.material.opacity = 0;
              key.scale.set(0.15, 0.15, 1);
              ud.isActive = false;
            }

            // Store wave state
            if (!(c as any).keyboardWave) {
              (c as any).keyboardWave = {
                active: false,
                position: 0,
                speed: 0,
              };
            }

            const wave = (c as any).keyboardWave;

            // When typing, trigger wave
            if (isTyping && !wave.active) {
              wave.active = true;
              wave.position = 0;
              wave.speed = 0.3;
            }

            if (wave.active) {
              wave.position += wave.speed;

              // Light up keys in a wave pattern
              keys.forEach((key: THREE.Sprite) => {
                const col = key.userData.col;
                const row = key.userData.row;
                const keyPos = (col + row * 0.5) / 10;
                const dist = Math.abs(keyPos - wave.position);

                if (dist < 0.3) {
                  const intensity = 1 - dist / 0.3;
                  key.userData.pulseIntensity = Math.max(
                    key.userData.pulseIntensity,
                    intensity * 0.8,
                  );
                }
              });

              if (wave.position > 1.5) {
                wave.active = false;
              }
            }
          });

          // Pulse the keyboard base glow
          const glow = keyboardLights.children.find(
            (child: any) => child instanceof THREE.Sprite && child.scale.x > 5,
          );
          if (glow) {
            if (isTyping) {
              glow.material.opacity = 0.08 + Math.sin(time * 8) * 0.05;
            } else {
              glow.material.opacity *= 0.99;
              if (glow.material.opacity < 0.02) glow.material.opacity = 0.02;
            }
          }
        }

        if ((c as any).mixer) {
          (c as any).mixer.update(delta * (overclocked ? 3.0 : 1.0));
          const now = Date.now() / 1000;
          if (!(c as any).lastAnimTrigger) {
            (c as any).lastAnimTrigger = now;
          }

          // Trigger every 0.4 seconds (typing speed)
          if (now - (c as any).lastAnimTrigger > 0.4) {
            triggerKeyboardLight(c);
            (c as any).typingActivity = true;
            (c as any).lastAnimTrigger = now;

            // Reset typing activity after a moment
            clearTimeout((c as any).animTimeout);
            (c as any).animTimeout = setTimeout(() => {
              if (c) {
                (c as any).typingActivity = false;
              }
            }, 300);
          }
        }

        // Meta Galaxy spin
        if (c.workstation && (c.workstation as any).metaGalaxy) {
          (c.workstation as any).metaGalaxy.rotation.y = scaledElapsed * 0.5;
        }

        if (c.workstation) {
          c.workstation.holoRing.rotation.z = elapsed * 0.3;
          c.workstation.holoRing2.rotation.z = -elapsed * 0.5;
          c.workstation.orbs.forEach((orb, i) => {
            orb.position.y =
              c.workstation!.WORKSTATION_POS.y +
              2 +
              Math.sin(elapsed * 0.8 + i * 1.2) * 1.5;
            orb.material.opacity = 0.15 + Math.sin(elapsed * 1.5 + i) * 0.1;
          });
        }

        if (c.dataParticles) {
          const pos = c.dataParticles.geometry.attributes
            .position as THREE.BufferAttribute;
          for (let i = 0; i < pos.count; i++) {
            let y = pos.getY(i);
            y += 0.15;
            if (y > (wp ? wp.y + 80 : 320)) {
              y = wp ? wp.y - 40 : 200;
              pos.setX(
                i,
                wp
                  ? wp.x + (Math.random() - 0.5) * 40
                  : (Math.random() - 0.5) * 40,
              );
              pos.setZ(
                i,
                wp
                  ? wp.z + (Math.random() - 0.5) * 30
                  : (Math.random() - 0.5) * 30,
              );
            }
            pos.setY(i, y);
          }
          pos.needsUpdate = true;
        }

        if ((c as any).mixer) {
          // Trigger keyboard lights while typing animation plays
          const now = Date.now();
          if (!(c as any).lastKeyPressTime) {
            (c as any).lastKeyPressTime = now;
          }

          if (now - (c as any).lastKeyPressTime > 600) {
            triggerKeyboardLight(c);
            (c as any).typingActivity = true;
            (c as any).lastKeyPressTime = now;

            clearTimeout((c as any).typingTimeout);
            (c as any).typingTimeout = setTimeout(() => {
              if (c) {
                (c as any).typingActivity = false;
              }
            }, 100);
          }
        }

        // GARGANTUA BLACK HOLE ANIMATION
        if ((blackHoleGroup as any).canvas) {
          const bhData = blackHoleGroup as any;
          const tex = bhData.texture as THREE.CanvasTexture;
          const drawFn = bhData.drawFunction;
          const sprite = bhData.sprite;

          if (!bhData.lastUpdate || elapsed - bhData.lastUpdate > 0.05) {
            drawFn(elapsed);
            tex.needsUpdate = true;
            bhData.lastUpdate = elapsed;
          }

          const engulfPulse = 1 + Math.sin(elapsed * 0.02) * 0.03;
          sprite.scale.set(600 * engulfPulse, 600 * engulfPulse, 1);

          const sway = Math.sin(elapsed * 0.01) * 5;
          blackHoleGroup.position.x = sway;
          blackHoleGroup.position.y = 30 + Math.sin(elapsed * 0.015) * 3;
        }

        // Slowly rotate the ambient nebula background to make it feel alive
        if (sceneRef.current) {
          const bg = (sceneRef.current as any).nebulaBackground as THREE.Group;
          if (bg) {
            bg.rotation.y = elapsed * 0.005;
            bg.rotation.z = elapsed * 0.002;
          }

          const glows = (sceneRef.current as any)
            .constellationGlows as THREE.Sprite[];
          if (glows) {
            glows.forEach((glow, i) => {
              glow.material.opacity = 0.08 + Math.sin(elapsed * 1.2 + i) * 0.03;
            });
          }
        }

        const smokeSprites = (workstation as any)?.smokeSprites as
          | THREE.Sprite[]
          | undefined;
        if (smokeSprites) {
          smokeSprites.forEach((spr) => {
            const ud = spr.userData;
            ud.life += delta;
            if (ud.life > ud.maxLife) {
              ud.life = 0;
              spr.position.x = ud.startX + (Math.random() - 0.5) * 0.3;
              spr.position.z = ud.startZ + (Math.random() - 0.5) * 0.3;
              spr.position.y = 1.4;
              spr.scale.set(0.3, 0.3, 1);
            }
            const lifeRatio = ud.life / ud.maxLife;
            const swirlAngle = ud.life * ud.swirlSpeed + ud.swirlPhase;
            spr.position.x =
              ud.startX + Math.sin(swirlAngle) * ud.driftX * lifeRatio;
            spr.position.z =
              ud.startZ + Math.cos(swirlAngle) * ud.driftZ * lifeRatio;

            const riseFactor = overclocked ? 3.0 : 1.5;
            spr.position.y = 1.4 + ud.life * ud.riseSpeed * riseFactor;

            const scale = 0.3 + lifeRatio * 1.4;
            spr.scale.set(scale, scale, 1);

            const opacity =
              lifeRatio < 0.2
                ? (lifeRatio / 0.2) * 0.5
                : lifeRatio > 0.7
                  ? (1 - (lifeRatio - 0.7) / 0.3) * 0.5
                  : 0.5;

            const mat = spr.material as THREE.SpriteMaterial;
            mat.opacity = opacity;
            mat.color.setHex(overclocked ? 0xff5522 : 0xcccccc);
          });
        }

        // Phone YouTube screen animation
        const phoneCtx = (c.workstation as any)?.phoneCtx as
          | CanvasRenderingContext2D
          | undefined;
        const phoneTex = (c.workstation as any)?.phoneTex as
          | THREE.CanvasTexture
          | undefined;
        if (phoneCtx && phoneTex) {
          const pData = c.workstation as any;
          if (
            !pData.lastPhoneUpdate ||
            elapsed - pData.lastPhoneUpdate > 0.033
          ) {
            phoneCtx.clearRect(8, 8, 112, 236);
            const sy = (elapsed * 80) % 256;
            const colors = [
              "#ff6b6b",
              "#48dbfb",
              "#ff9ff3",
              "#feca57",
              "#54a0ff",
              "#5f27cd",
            ];
            for (let i = 0; i < 12; i++) {
              const y = ((i * 22 + sy) % 256) - 22;
              const bw = 40 + Math.sin(elapsed * 2 + i * 0.7) * 20;
              const bx = 64 - bw / 2 + Math.sin(elapsed * 1.3 + i * 0.5) * 10;
              phoneCtx.fillStyle = colors[i % colors.length];
              phoneCtx.globalAlpha = 0.6 + Math.sin(elapsed * 3 + i) * 0.2;
              phoneCtx.beginPath();
              phoneCtx.roundRect(bx, y, bw, 16, 4);
              phoneCtx.fill();
            }
            phoneCtx.globalAlpha = 1;
            phoneCtx.fillStyle = "#ff0000";
            phoneCtx.beginPath();
            phoneCtx.roundRect(
              10,
              220,
              30 + Math.sin(elapsed * 0.5) * 20 + 50,
              4,
              2,
            );
            phoneCtx.fill();
            phoneCtx.fillStyle = "#fff";
            phoneCtx.font = "7px sans-serif";
            phoneCtx.fillText("▶ playing", 14, 212);
            if (pData.phoneScreen) {
              pData.phoneScreen.material.emissiveIntensity =
                0.2 + Math.sin(elapsed * 1.5) * 0.1;
            }
            phoneTex.needsUpdate = true;
            pData.lastPhoneUpdate = elapsed;
          }
        }

        // ============================================================
        // TRANSCENDENT BEING - SUBTLE ANIMATION
        // ============================================================
        const tModel = (c as any).transcendentModel as THREE.Group | null;
        if (tModel) {
          const td = (tModel as any).transcendentData;
          if (td) {
            // Very subtle aura pulse - almost imperceptible
            const pulse = 1 + Math.sin(elapsed * 0.3) * 0.03;
            td.aura.scale.set(10 * pulse, 10 * pulse, 1);
            td.aura.material.opacity = 0.07 + Math.sin(elapsed * 0.2) * 0.02;

            // Ring slowly rotates
            td.ring.rotation.z = elapsed * 0.1;
            td.ring.rotation.x = Math.PI / 3 + Math.sin(elapsed * 0.05) * 0.1;
          }
        }

        // Floating particles - slow drift
        const tParticles = (c as any)
          .transcendentParticles as THREE.Points | null;
        if (tParticles) {
          const pos = tParticles.geometry.attributes.position
            .array as Float32Array;
          for (let i = 0; i < pos.length / 3; i++) {
            // Very slow orbital drift
            const x = pos[i * 3];
            const z = pos[i * 3 + 2];
            const angle = Math.atan2(z, x);
            const radius = Math.sqrt(x * x + z * z);
            const newAngle = angle + elapsed * 0.01;
            pos[i * 3] = radius * Math.cos(newAngle);
            pos[i * 3 + 2] = radius * Math.sin(newAngle);
            // Gentle up/down float
            pos[i * 3 + 1] += Math.sin(elapsed * 0.02 + i) * 0.001;
          }
          tParticles.geometry.attributes.position.needsUpdate = true;
          if (tParticles.material instanceof THREE.PointsMaterial) {
            tParticles.material.opacity = 0.25 + Math.sin(elapsed * 0.1) * 0.05;
          }
        }

        // Planet and moon animations
        for (const [, p] of c.planetSprites) {
          const ud = p.userData;
          const isFiltered = visibleNodesRef.current.has(ud.node.id);
          p.visible = isFiltered;
          if (!isFiltered) continue;
          const speed = 0.0002;
          const newAngle = ud.startAngle + elapsed * speed;
          p.position.x = Math.cos(newAngle) * ud.orbitR;
          p.position.z = Math.sin(newAngle) * ud.orbitR;
          p.position.y = Math.sin(newAngle + ud.phaseY) * (ud.orbitR * ud.incl);

          if (
            ud.node.id === selectedRef.current ||
            ud.node.id === hoveredRef.current
          ) {
            p.material.opacity = 0.25;
            p.scale.set(ud.baseSize * 1.2, ud.baseSize * 1.2, 1);
          } else {
            p.material.opacity = selectedRef.current ? 0.08 : 0.12;
            p.scale.set(ud.baseSize, ud.baseSize, 1);
          }
        }

        for (const m of c.moonSprites) {
          const ud = m.userData;
          const isFiltered = visibleNodesRef.current.has(ud.node.id);
          if (!isFiltered) {
            m.visible = false;
            continue;
          }
          const pSprite = ud.planet;
          if (pSprite) {
            const mSpeed = 0.0005 + (1 / ud.r) * 0.005;
            const a = ud.angle + elapsed * mSpeed;
            m.position.x = pSprite.position.x + Math.cos(a) * ud.r;
            m.position.z = pSprite.position.z + Math.sin(a) * ud.r;
            m.position.y =
              pSprite.position.y + Math.sin(a + ud.phaseY) * (ud.r * ud.incl);

            const dist = c.camera.position.distanceTo(pSprite.position);
            let lodMultiplier = 1.0;
            const FADE_START = 80;
            const FADE_END = 150;
            if (dist > FADE_START) {
              lodMultiplier =
                1.0 -
                Math.min(1.0, (dist - FADE_START) / (FADE_END - FADE_START));
            }

            if (
              lodMultiplier <= 0 &&
              ud.node.id !== selectedRef.current &&
              ud.node.id !== hoveredRef.current
            ) {
              m.visible = false;
            } else {
              m.visible = true;
              if (
                ud.node.id === selectedRef.current ||
                ud.node.id === hoveredRef.current
              ) {
                m.material.opacity = 0.3;
                m.scale.set(ud.baseSize * 1.5, ud.baseSize * 1.5, 1);
              } else {
                m.material.opacity =
                  (selectedRef.current ? 0.05 : 0.08) * lodMultiplier;
                m.scale.set(ud.baseSize, ud.baseSize, 1);
              }
            }
          }
        }

        // Lines and packets
        const lp = c.lineSegments.geometry.attributes
          .position as THREE.BufferAttribute;
        const pp = c.packetPoints.geometry.attributes
          .position as THREE.BufferAttribute;
        let lineIdx = 0;
        let packetIdx = 0;

        c.hoverLine.visible = false;
        c.links.forEach((link) => {
          const isSelected = !!selectedRef.current;
          const isLinkVisible =
            visibleNodesRef.current.has(link.source) &&
            visibleNodesRef.current.has(link.target);
          const isConnected =
            isSelected &&
            isLinkVisible &&
            (link.source === selectedRef.current ||
              link.target === selectedRef.current);

          if (isConnected) {
            const sObj = nodeIdToSprite.get(link.source);
            const tObj = nodeIdToSprite.get(link.target);
            const sx = sObj ? sObj.position.x : 0,
              sy = sObj ? sObj.position.y : 0,
              sz = sObj ? sObj.position.z : 0;
            const tx = tObj ? tObj.position.x : 0,
              ty = tObj ? tObj.position.y : 0,
              tz = tObj ? tObj.position.z : 0;

            lp.setXYZ(lineIdx * 2, sx, sy, sz);
            lp.setXYZ(lineIdx * 2 + 1, tx, ty, tz);

            for (let k = 0; k < 3; k++) {
              const progress = (elapsed * 0.4 + k * 0.33) % 1.0;
              const ease =
                progress < 0.5
                  ? 2 * progress * progress
                  : -1 + (4 - 2 * progress) * progress;
              pp.setXYZ(
                packetIdx++,
                sx + (tx - sx) * ease,
                sy + (ty - sy) * ease,
                sz + (tz - sz) * ease,
              );
            }
            if (hoveredLinkIdx.current === lineIdx) {
              const hp = c.hoverLine.geometry.attributes.position
                .array as Float32Array;
              hp[0] = sx;
              hp[1] = sy;
              hp[2] = sz;
              hp[3] = tx;
              hp[4] = ty;
              hp[5] = tz;
              c.hoverLine.geometry.attributes.position.needsUpdate = true;
              c.hoverLine.visible = true;
            }
          } else {
            lp.setXYZ(lineIdx * 2, 0, 0, 0);
            lp.setXYZ(lineIdx * 2 + 1, 0, 0, 0);
          }
          lineIdx++;
        });
        lp.needsUpdate = true;

        while (packetIdx < pp.count) {
          pp.setXYZ(packetIdx++, 0, 0, 0);
        }
        pp.needsUpdate = true;

        for (const [id, sprite] of c.godNodes) {
          const ud = sprite.userData;
          const isFiltered = visibleNodesRef.current.has(id);
          sprite.visible = isFiltered;
          if (!isFiltered) continue;
          if (id === selectedRef.current) {
            sprite.scale.set(ud.baseSize * 1.2, ud.baseSize * 1.2, 1);
            sprite.material.opacity = 0.35;
          } else if (id === hoveredRef.current) {
            sprite.scale.set(ud.baseSize * 1.1, ud.baseSize * 1.1, 1);
            sprite.material.opacity = 0.35;
          } else {
            sprite.scale.set(ud.baseSize, ud.baseSize, 1);
            sprite.material.opacity = selectedRef.current ? 0.1 : 0.2;
          }
        }

        // Rotate book titles every 10 seconds
        if (c.workstation && (c.workstation.wsGroup as any).bookData) {
          const bookData = (c.workstation.wsGroup as any).bookData;
          if (elapsed - bookData.lastSwap > 10) {
            bookData.lastSwap = elapsed;
            bookData.titleIndex =
              (bookData.titleIndex + 1) % bookData.bookTitles.length;
            bookData.updateCover(bookData.titleIndex);
            bookData.coverTex.needsUpdate = true;
          }
        }

        // Meta Galaxy spin
        if (c.workstation && (c.workstation as any).metaGalaxy) {
          const galaxy = (c.workstation as any).metaGalaxy;
          const data = (c.workstation as any).metaGalaxyData;

          // Slow rotation of the entire galaxy
          galaxy.rotation.y = scaledElapsed * 0.15;

          // Subtle wobble
          galaxy.rotation.x =
            Math.PI * 0.15 + Math.sin(scaledElapsed * 0.05) * 0.05;
          galaxy.rotation.z =
            Math.PI * 0.05 + Math.cos(scaledElapsed * 0.07) * 0.03;

          if (data) {
            // Pulse the core glow
            const corePulse = 1 + Math.sin(scaledElapsed * 0.8) * 0.1;
            data.coreGlow.scale.set(1.2 * corePulse, 1.2 * corePulse, 1);
            data.coreGlow.material.opacity =
              0.35 + Math.sin(scaledElapsed * 0.6) * 0.1;

            // Pulse the outer glow ring
            const ringPulse = 1 + Math.sin(scaledElapsed * 0.4 + 0.5) * 0.05;
            data.glowRing.scale.set(5 * ringPulse, 5 * ringPulse, 1);
            data.glowRing.material.opacity =
              0.12 + Math.sin(scaledElapsed * 0.5 + 1) * 0.05;

            // Animate individual stars in the spiral arms (subtle twinkling)
            data.armPoints.rotation.y = Math.sin(scaledElapsed * 0.02) * 0.1;
            data.armPoints.rotation.x =
              Math.sin(scaledElapsed * 0.015 + 0.5) * 0.05;

            // Core stars rotate at different speed
            data.corePoints.rotation.y = Math.sin(scaledElapsed * 0.03) * 0.2;

            // Halo stars drift slowly
            data.haloPoints.rotation.y = scaledElapsed * 0.01;
            data.haloPoints.rotation.x = Math.sin(scaledElapsed * 0.005) * 0.1;
          }
        }

        controls.update();
        composer.render();
        c.animFrame = requestAnimationFrame(animate);
      };
      if (sceneRef.current)
        sceneRef.current.animFrame = requestAnimationFrame(animate);

      const raycaster = new THREE.Raycaster();
      raycaster.params.Points.threshold = 1.5;
      const mouse = new THREE.Vector2();

      const getIntersectedNode = (e: MouseEvent | PointerEvent) => {
        const c = sceneRef.current;
        if (!c || !container) return null;
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const hits = raycaster.intersectObjects(c.allSprites, false);
        for (const hit of hits) {
          if (hit.point && hit.object) {
            const node = hit.object.userData.node as GraphNode;
            if (node && !visibleNodesRef.current.has(node.id)) continue;
            const dist = hit.point.distanceTo(hit.object.position);
            const normalizedDist = dist / hit.object.scale.x;
            if (normalizedDist <= 0.2) {
              return node;
            }
          }
        }
        return null;
      };

      const getIntersectedLinkInfo = (e: MouseEvent | PointerEvent) => {
        const c = sceneRef.current;
        if (!c || !container || !selectedRef.current || !c.links) return null;
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        raycaster.params.Line = { threshold: 6.0 };
        const hits = raycaster.intersectObject(c.lineSegments, false);

        let bestHitInfo = null;
        let minRayDist = Infinity;

        if (hits.length > 0) {
          for (const hit of hits) {
            if (hit.index !== undefined) {
              const rayDist =
                hit.distanceToRay !== undefined
                  ? hit.distanceToRay
                  : hit.distance;
              const linkIdx = Math.floor(hit.index / 2);
              const link = c.links[linkIdx];
              if (link) {
                if (
                  link.source === selectedRef.current ||
                  link.target === selectedRef.current
                ) {
                  if (rayDist < minRayDist) {
                    minRayDist = rayDist;
                    bestHitInfo = {
                      targetId:
                        link.source === selectedRef.current
                          ? link.target
                          : link.source,
                      index: linkIdx,
                    };
                  }
                }
              }
            }
          }
        }
        return bestHitInfo;
      };

      const rideToNode = (targetId: string) => {
        const c = sceneRef.current;
        if (!c || !selectedRef.current) return;

        const getNodePos = (id: string) => {
          if (c.godNodes.has(id)) return c.godNodes.get(id)!.position;
          const moon = c.moonSprites.find((m) => m.userData.node.id === id);
          if (moon) return moon.position;
          const planet = Array.from(c.planetSprites.values()).find(
            (p) => p.userData.node.id === id,
          );
          if (planet) return planet.position;
          return new THREE.Vector3();
        };

        const startPos = getNodePos(selectedRef.current).clone();
        const targetPos = getNodePos(targetId).clone();
        const currentCamPos = c.camera.position.clone();
        const currentTarget = c.controls.target.clone();

        const dir = targetPos.clone().sub(startPos).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = dir.clone().cross(up);
        if (right.lengthSq() < 0.001) right.set(1, 0, 0);
        right.normalize();

        const offsetVec = up
          .clone()
          .multiplyScalar(4)
          .add(right.clone().multiplyScalar(3));

        const p0 = currentCamPos;
        const p1 = startPos.clone().add(offsetVec);
        const p2 = targetPos
          .clone()
          .sub(dir.clone().multiplyScalar(10))
          .add(offsetVec);
        const p3 = targetPos.clone().add(new THREE.Vector3(15, 10, 15));

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        curve.curveType = "centripetal";

        let progress = 0;
        const speed = 1.0;

        const anim = () => {
          progress += 0.015 * speed;
          if (progress >= 1) {
            c.camera.position.copy(p3);
            c.controls.target.copy(targetPos);
            c.camera.fov = 45;
            c.camera.updateProjectionMatrix();

            isCanvasClickRef.current = true;
            onSelect(targetId);
            setTimeout(() => {
              isCanvasClickRef.current = false;
            }, 100);
            return;
          }

          const t =
            progress < 0.5
              ? 2 * progress * progress
              : -1 + (4 - 2 * progress) * progress;

          const nextPos = curve.getPointAt(t);
          c.camera.position.copy(nextPos);

          const targetT = Math.min(1.0, t * 1.5);
          c.controls.target.lerpVectors(currentTarget, targetPos, targetT);

          const warpFactor = Math.sin(t * Math.PI);
          c.camera.fov = 45 + warpFactor * 50;
          c.camera.updateProjectionMatrix();

          requestAnimationFrame(anim);
        };
        anim();
      };

      let pointerDownPos = { x: 0, y: 0 };

      const handlePointerDown = (e: PointerEvent) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
      };

      const handlePointerUp = (e: PointerEvent) => {
        const dist = Math.hypot(
          e.clientX - pointerDownPos.x,
          e.clientY - pointerDownPos.y,
        );
        if (dist > 5) return;

        const hitNode = getIntersectedNode(e);
        if (hitNode) {
          isCanvasClickRef.current = true;
          onSelect(hitNode.id);
          setTimeout(() => {
            isCanvasClickRef.current = false;
          }, 100);
        } else {
          const c = sceneRef.current;
          const hitbox = (c as any)?.programmerHitbox as THREE.Mesh | null;
          if (hitbox) {
            const hits = raycaster.intersectObject(hitbox, false);
            if (hits.length > 0) {
              return;
            }
          }
          const hitLinkInfo = getIntersectedLinkInfo(e);
          if (hitLinkInfo) {
            rideToNode(hitLinkInfo.targetId);
          } else {
            isCanvasClickRef.current = true;
            onSelect(null);
            setTimeout(() => {
              isCanvasClickRef.current = false;
            }, 100);
          }
        }
      };

      const handleDblClick = (e: MouseEvent) => {
        const c = sceneRef.current;
        if (!c) return;

        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // Check for Coffee Mug Overclock Mode
        if (c.workstation && c.workstation.wsGroup) {
          const wsHits = raycaster.intersectObject(c.workstation.wsGroup, true);
          if (wsHits.length > 0) {
            const clickedMug = wsHits.find(
              (h) => h.object.userData?.isCoffeeMug,
            );
            if (clickedMug) {
              (c as any).isOverclocked = !(c as any).isOverclocked;
              return; // Skip normal zoom if clicked mug
            }
          }
        }

        const hitbox = (c as any)?.programmerHitbox as THREE.Mesh | null;
        if (hitbox) {
          const hits = raycaster.intersectObject(hitbox, false);
          if (hits.length > 0) {
            const targetPos = hitbox.position.clone();
            const startPos = c.camera.position.clone();
            const endPos = targetPos.clone().add(new THREE.Vector3(0, 50, 35));
            const startTarget = c.controls.target.clone();
            const endTarget = targetPos.clone();
            let progress = 0;
            const travelAnim = () => {
              progress += 0.015;
              if (progress >= 1) {
                c.camera.position.copy(endPos);
                c.controls.target.copy(endTarget);
                return;
              }
              const t = easeInOut(progress);
              c.camera.position.lerpVectors(startPos, endPos, t);
              c.controls.target.lerpVectors(startTarget, endTarget, t);
              requestAnimationFrame(travelAnim);
            };
            travelAnim();
            return;
          }
        }
        flyToNode(selectedRef.current);
      };

      const handlePointerMove = (e: PointerEvent) => {
        let cursorSet = false;
        const hitNode = getIntersectedNode(e);
        if (hitNode) {
          if (hoveredRef.current !== hitNode.id) {
            onHover(hitNode.id);
            onTooltip({ x: e.clientX, y: e.clientY, node: hitNode });
          } else {
            onTooltip({ x: e.clientX, y: e.clientY, node: hitNode });
          }
          document.body.style.cursor = "pointer";
          hoveredLinkIdx.current = -1;
          cursorSet = true;
        } else {
          const c = sceneRef.current;
          const hitbox = (c as any)?.programmerHitbox as THREE.Mesh | null;
          if (hitbox) {
            const hHits = raycaster.intersectObject(hitbox, false);
            if (hHits.length > 0) {
              onTooltip({
                x: e.clientX,
                y: e.clientY,
                node: {
                  id: "__programmer__",
                  label: "Erwin Wilson Ceniza",
                  source_file: "Dev",
                  norm_label: "Created nodes: " + nodes.length,
                  degree: nodes.length,
                  community: 0,
                } as GraphNode,
              });
              document.body.style.cursor = "pointer";
              hoveredLinkIdx.current = -1;
              return;
            }
          }

          const hitLinkInfo = getIntersectedLinkInfo(e);
          if (hitLinkInfo) {
            if (hoveredLinkIdx.current !== hitLinkInfo.index) {
              hoveredLinkIdx.current = hitLinkInfo.index;
            }
            document.body.style.cursor = "pointer";
            cursorSet = true;
          } else {
            hoveredLinkIdx.current = -1;
          }

          if (hoveredRef.current) {
            onHover(null);
            onTooltip(null);
          }
        }

        if (!cursorSet) {
          document.body.style.cursor = "default";
        }
      };

      const handlePointerLeave = () => {
        hoveredRef.current = null;
        onHover(null);
        onTooltip(null);
        document.body.style.cursor = "default";
        hoveredLinkIdx.current = -1;
      };

      container.addEventListener("pointerdown", handlePointerDown);
      container.addEventListener("pointerup", handlePointerUp);
      container.addEventListener("dblclick", handleDblClick);
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);

      const handleResize = () => {
        const c = sceneRef.current;
        if (!c || !container) return;
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        c.camera.aspect = nw / nh;
        c.camera.updateProjectionMatrix();
        c.renderer.setSize(nw, nh);
        c.composer.setSize(nw, nh);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        container.removeEventListener("pointerdown", handlePointerDown);
        container.removeEventListener("pointerup", handlePointerUp);
        container.removeEventListener("dblclick", handleDblClick);
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerleave", handlePointerLeave);
        cancelAnimationFrame(sceneRef.current?.animFrame || 0);
        window.removeEventListener("resize", handleResize);
        if (sceneRef.current?.programmerModel) {
          sceneRef.current.programmerModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
        if (sceneRef.current?.dataParticles) {
          sceneRef.current.dataParticles.geometry.dispose();
          (sceneRef.current.dataParticles.material as THREE.Material).dispose();
        }
        sceneRef.current?.composer.dispose();
        sceneRef.current?.renderer.dispose();
        sceneRef.current?.controls.dispose();
        if (container.contains(renderer.domElement))
          container.removeChild(renderer.domElement);
        sceneRef.current = null;
      };
    }, [nodes?.length > 0 ? true : false]);

    return (
      <div className="relative w-full h-full">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ touchAction: "none" }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Interaction Mode Toggle */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 bg-[#1a1020]/80 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
          <button
            onClick={() => setInteractionMode("rotate")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              interactionMode === "rotate"
                ? "bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            🔄 Rotate (R)
          </button>
          <button
            onClick={() => setInteractionMode("pan")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              interactionMode === "pan"
                ? "bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            ✋ Pan (P)
          </button>
        </div>
      </div>
    );
  },
);
