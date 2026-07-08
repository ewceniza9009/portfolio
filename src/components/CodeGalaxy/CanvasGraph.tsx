import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { GraphNode, GraphLink } from './constants';

const COMMUNITY_PALETTE = [
  0xff3366, 0x33ccff, 0x99ff33, 0xffcc00, 0xcc33ff, 
  0x00ffcc, 0xff6600, 0x6666ff, 0xff99cc, 0x3399ff
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function createGlowTexture(r: number, g: number, b: number, size = 128, isPlanet = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
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

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// === Programmer Workstation Builder ===
// Creates a desk, laptop, lamp, and apparatus — all in a rotated group facing the spectator
function createProgrammerWorkstation(parentGroup: THREE.Group) {
  const WORKSTATION_POS = new THREE.Vector3(0, 55, -20);

  // Create a pivot group: everything is built in local coords, then the whole thing rotates
  const wsGroup = new THREE.Group();
  wsGroup.position.copy(WORKSTATION_POS);
  wsGroup.rotation.y = Math.PI; // Face toward spectator (camera at +Z)

  // --- DESK (at local origin) ---
  const deskGeo = new THREE.BoxGeometry(18, 0.6, 10);
  const deskMat = new THREE.MeshBasicMaterial({ color: 0x1a1020, transparent: true, opacity: 0.85 });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.set(0, 0, 0);
  wsGroup.add(desk);

  // Desk legs (reach down to y = -8)
  const legGeo = new THREE.CylinderGeometry(0.25, 0.25, 8, 6);
  const legMat = new THREE.MeshBasicMaterial({ color: 0x2a1a30, transparent: true, opacity: 0.7 });
  [[-7, -4, -4], [7, -4, -4], [-7, -4, 4], [7, -4, 4]].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    wsGroup.add(leg);
  });

  // --- LAPTOP ---
  const laptopBaseGeo = new THREE.BoxGeometry(6, 0.25, 4);
  const laptopBaseMat = new THREE.MeshBasicMaterial({ color: 0x111118, transparent: true, opacity: 0.9 });
  const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopBaseMat);
  laptopBase.position.set(0, 0.45, 0.5);
  wsGroup.add(laptopBase);

  // Screen (holographic glow)
  const laptopScreenGeo = new THREE.PlaneGeometry(5.5, 3.5);
  const laptopScreenMat = new THREE.MeshBasicMaterial({
    color: 0x00aaff, transparent: true, opacity: 0.35,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopScreenMat);
  laptopScreen.position.set(0, 2.4, -1.4);
  laptopScreen.rotation.x = -0.15;
  wsGroup.add(laptopScreen);

  // Screen glow aura
  const screenGlowTex = createGlowTexture(0, 170, 255, 256, false);
  const screenGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: screenGlowTex, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  screenGlow.scale.set(12, 8, 1);
  screenGlow.position.set(0, 2.5, -2);
  wsGroup.add(screenGlow);

  // Screen code lines
  const codeLineColors = [0x00ff88, 0xffaa00, 0x00ccff, 0xff66aa, 0xaaff00];
  for (let i = 0; i < 8; i++) {
    const lineW = 1.5 + Math.random() * 2.5;
    const lineGeo = new THREE.PlaneGeometry(lineW, 0.12);
    const lineMat = new THREE.MeshBasicMaterial({
      color: codeLineColors[i % codeLineColors.length],
      transparent: true, opacity: 0.3 + Math.random() * 0.2,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(-1.5 + Math.random() * 3, 1.0 + i * 0.35, -1.35);
    wsGroup.add(line);
  }

  // --- STYLISH LAMP ---
  const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
  const armMat = new THREE.MeshBasicMaterial({ color: 0x333340, transparent: true, opacity: 0.8 });
  const arm = new THREE.Mesh(armGeo, armMat);
  arm.position.set(-7, 4, -2);
  arm.rotation.z = 0.15;
  wsGroup.add(arm);

  const lampHeadGeo = new THREE.ConeGeometry(1.5, 2, 8);
  const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0x222230, transparent: true, opacity: 0.8 });
  const lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
  lampHead.position.set(-6.5, 8.2, -2);
  lampHead.rotation.z = Math.PI;
  wsGroup.add(lampHead);

  const lampGlowTex = createGlowTexture(255, 200, 100, 128, false);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lampGlowTex, transparent: true, opacity: 0.25,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  lampGlow.scale.set(5, 5, 1);
  lampGlow.position.set(-6.5, 7, -2);
  wsGroup.add(lampGlow);

  const lampConeGeo = new THREE.ConeGeometry(4, 10, 12, 1, true);
  const lampConeMat = new THREE.MeshBasicMaterial({
    color: 0xffcc66, transparent: true, opacity: 0.04,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const lampCone = new THREE.Mesh(lampConeGeo, lampConeMat);
  lampCone.position.set(-6.5, 2, -2);
  wsGroup.add(lampCone);

  // --- APPARATUS / TOOLS ---
  const holoGeo = new THREE.RingGeometry(1.5, 2, 16);
  const holoMat = new THREE.MeshBasicMaterial({
    color: 0x00ffcc, transparent: true, opacity: 0.15,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const holoRing = new THREE.Mesh(holoGeo, holoMat);
  holoRing.position.set(8, 3, 0);
  holoRing.rotation.x = Math.PI / 2;
  wsGroup.add(holoRing);

  const holoRing2 = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.2, 12),
    new THREE.MeshBasicMaterial({
      color: 0x33ccff, transparent: true, opacity: 0.12,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  holoRing2.position.set(8, 3, 0);
  holoRing2.rotation.x = Math.PI / 2;
  wsGroup.add(holoRing2);

  // Small floating orbs
  const orbPositions = [
    [9, 4.5, 1], [7, 5, -1], [10, 2, 0.5], [8.5, 1.5, 1.5], [9.5, 3.5, -0.5]
  ];
  const orbTex = createGlowTexture(0, 220, 255, 64, true);
  const orbs: THREE.Sprite[] = [];
  orbPositions.forEach(([ox, oy, oz]) => {
    const orb = new THREE.Sprite(new THREE.SpriteMaterial({
      map: orbTex, transparent: true, opacity: 0.2,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    orb.scale.set(1.2, 1.2, 1);
    orb.position.set(ox, oy, oz);
    wsGroup.add(orb);
    orbs.push(orb);
  });

  // Coffee mug
  const mugGeo = new THREE.CylinderGeometry(0.5, 0.45, 1, 8);
  const mugMat = new THREE.MeshBasicMaterial({ color: 0x442200, transparent: true, opacity: 0.8 });
  const mug = new THREE.Mesh(mugGeo, mugMat);
  mug.position.set(5, 0.9, 2);
  wsGroup.add(mug);

  // Mug steam
  const steamTex = createGlowTexture(200, 200, 220, 32, false);
  for (let i = 0; i < 3; i++) {
    const steam = new THREE.Sprite(new THREE.SpriteMaterial({
      map: steamTex, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    steam.scale.set(0.6, 0.6, 1);
    steam.position.set(5 + (Math.random() - 0.5) * 0.5, 1.8 + i * 0.6, 2);
    wsGroup.add(steam);
  }

  // --- SEAT / CHAIR ---
  const seatGeo = new THREE.BoxGeometry(4, 0.5, 4);
  const seatMat = new THREE.MeshBasicMaterial({ color: 0x1a0a20, transparent: true, opacity: 0.75 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  // Place chair at y = -3.5 (halfway between floor at -8 and desk at 0)
  // Push it back to z = 7 so it's behind the front edge of the desk (z = 5)
  seat.position.set(0, -3.5, 7);
  wsGroup.add(seat);

  const backGeo = new THREE.BoxGeometry(4, 5, 0.5);
  const back = new THREE.Mesh(backGeo, seatMat.clone());
  back.position.set(0, -1.0, 9);
  wsGroup.add(back);

  parentGroup.add(wsGroup);

  return { laptopScreen, screenGlow, holoRing, holoRing2, orbs, WORKSTATION_POS, wsGroup };
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

export const CanvasGraph = forwardRef<CanvasGraphHandle, CanvasGraphProps>(function CanvasGraph(
  { nodes, links, selectedId, onSelect, hoveredId, onHover, onTooltip }, ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    lineSegments: THREE.LineSegments;
    packetPoints: THREE.Points;
    starLayers: THREE.Points[];
    shipGroup: THREE.Group;
    links: GraphLink[];
    clock: THREE.Clock;
    programmerModel: THREE.Group | null;
    workstation: ReturnType<typeof createProgrammerWorkstation> | null;
    dataParticles: THREE.Points | null;
  } | null>(null);

  const selectedRef = useRef(selectedId);
  const hoveredRef = useRef(hoveredId);
  const isCanvasClickRef = useRef(false);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { hoveredRef.current = hoveredId; }, [hoveredId]);

  useImperativeHandle(ref, () => ({
    resetView: () => {
      const c = sceneRef.current;
      if (!c) return;
      // Default camera position and target - view pillars of creation
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
    }
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
        const sMoon = c.moonSprites.find(m => m.userData.node.id === id);
        if (sMoon) {
          targetPos.copy(sMoon.position);
          shouldAnimate = true;
        } else {
          const sPlanet = Array.from(c.planetSprites.values()).find(p => p.userData.node.id === id);
          if (sPlanet) {
            targetPos.copy(sPlanet.position);
            shouldAnimate = true;
          }
        }
      }
      if (shouldAnimate) targetCam = targetPos.clone().add(new THREE.Vector3(15, 10, 15));
    } else {
      shouldAnimate = false;
    }

    if (shouldAnimate) {
      const startPos = c.camera.position.clone();
      const endPos = targetCam;
      const startTarget = c.controls.target.clone();
      
      if (startPos.distanceTo(endPos) < 1 && startTarget.distanceTo(targetPos) < 1) return;
      
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

    // Lighting for GLB model (PBR materials need lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0x8888ff, 0.6);
    backLight.position.set(-10, 10, -20);
    scene.add(backLight);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 4000);
    camera.position.set(0, 0, 250);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.2, 0.8, 0.2);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const byCommunity = new Map<number, GraphNode[]>();
    nodes.forEach(n => {
      const arr = byCommunity.get(n.community) || [];
      arr.push(n);
      byCommunity.set(n.community, arr);
    });
    for (const arr of byCommunity.values()) arr.sort((a, b) => b.degree - a.degree);

    const communityIds = Array.from(byCommunity.keys());
    const orbitRadii = new Map<number, number>();
    communityIds.forEach((cid, idx) => orbitRadii.set(cid, 25 + Math.sqrt(idx + 1) * 20));

    const createStarLayer = (count: number, size: number, opacity: number, spreadR: number, spreadY: number, colors: string[]) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const parsedColors = colors.map(c => new THREE.Color(c));
      for (let i = 0; i < count; i++) {
        const r = 40 + Math.pow(Math.random(), 1.5) * spreadR;
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * spreadY * Math.pow(Math.random(), 2);
        pos[i * 3] = r * Math.cos(theta); pos[i * 3 + 1] = y; pos[i * 3 + 2] = r * Math.sin(theta);
        const color = parsedColors[Math.floor(Math.random() * parsedColors.length)];
        col[i * 3] = Math.min(1, color.r * (0.8 + Math.random() * 0.4));
        col[i * 3 + 1] = Math.min(1, color.g * (0.8 + Math.random() * 0.4));
        col[i * 3 + 2] = Math.min(1, color.b * (0.8 + Math.random() * 0.4));
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const starTex = createGlowTexture(255, 255, 255, 32);
      return new THREE.Points(geo, new THREE.PointsMaterial({
        size, map: starTex, vertexColors: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false
      }));
    };
    const starLayers: THREE.Points[] = [];
    const star1 = createStarLayer(6000, 1.0, 0.5, 900, 350, ['#ffffff', '#ffcc88', '#99ccff']);
    const star2 = createStarLayer(500, 2.5, 0.8, 700, 500, ['#ffffff', '#ffaa44', '#44aaff', '#ffddaa']);
    starLayers.push(star1, star2);
    scene.add(star1);
    scene.add(star2);

    const createBlackHoleLayer = () => {
      const group = new THREE.Group();
      
      // === Interstellar Gargantua — procedural canvas texture ===
      const bhSize = 1024;
      const bhCanvas = document.createElement('canvas');
      bhCanvas.width = bhSize; bhCanvas.height = bhSize;
      const bhCtx = bhCanvas.getContext('2d')!;
      const cx = bhSize / 2, cy = bhSize / 2;
      const ehR = 140; // event horizon radius

      // 1. Outer gravitational lensing glow (warm orange-gold halo)
      const lensGrad = bhCtx.createRadialGradient(cx, cy, ehR + 40, cx, cy, 500);
      lensGrad.addColorStop(0, 'rgba(255, 180, 60, 0.22)');
      lensGrad.addColorStop(0.3, 'rgba(255, 140, 40, 0.12)');
      lensGrad.addColorStop(0.7, 'rgba(200, 100, 30, 0.05)');
      lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bhCtx.fillStyle = lensGrad;
      bhCtx.fillRect(0, 0, bhSize, bhSize);

      // 2. Accretion disk — thin bright ellipse across the center
      //    Clip so it doesn't draw OVER the event horizon
      bhCtx.save();
      bhCtx.beginPath();
      bhCtx.rect(0, 0, bhSize, cy - ehR * 0.25);
      bhCtx.rect(0, cy + ehR * 0.25, bhSize, bhSize);
      bhCtx.clip();
      // Outer disk (deep red-orange)
      bhCtx.beginPath();
      bhCtx.ellipse(cx, cy, 480, 45, 0, 0, Math.PI * 2);
      const diskGrad1 = bhCtx.createRadialGradient(cx, cy, 0, cx, cy, 480);
      diskGrad1.addColorStop(0, 'rgba(255, 220, 150, 0.9)');
      diskGrad1.addColorStop(0.3, 'rgba(255, 180, 80, 0.8)');
      diskGrad1.addColorStop(0.6, 'rgba(255, 120, 30, 0.5)');
      diskGrad1.addColorStop(1, 'rgba(180, 60, 10, 0)');
      bhCtx.fillStyle = diskGrad1;
      bhCtx.fill();
      // Inner hot disk (blue-white core)
      bhCtx.beginPath();
      bhCtx.ellipse(cx, cy, 280, 22, 0, 0, Math.PI * 2);
      const diskGrad2 = bhCtx.createRadialGradient(cx, cy, 0, cx, cy, 280);
      diskGrad2.addColorStop(0, 'rgba(200, 220, 255, 0.9)');
      diskGrad2.addColorStop(0.5, 'rgba(255, 200, 140, 0.7)');
      diskGrad2.addColorStop(1, 'rgba(255, 140, 60, 0)');
      bhCtx.fillStyle = diskGrad2;
      bhCtx.fill();
      bhCtx.restore();

      // 3. Gravitationally lensed disk — wraps OVER the top of the event horizon
      //    This is the iconic Interstellar Gargantua visual
      bhCtx.save();
      bhCtx.beginPath();
      bhCtx.arc(cx, cy, ehR + 12, Math.PI + 0.2, -0.2, false);
      const topGrad = bhCtx.createLinearGradient(cx - ehR, cy, cx + ehR, cy);
      topGrad.addColorStop(0, 'rgba(255, 160, 50, 0)');
      topGrad.addColorStop(0.15, 'rgba(255, 200, 100, 0.7)');
      topGrad.addColorStop(0.5, 'rgba(255, 250, 200, 1)'); // Brighter core
      topGrad.addColorStop(0.85, 'rgba(255, 200, 100, 0.7)');
      topGrad.addColorStop(1, 'rgba(255, 160, 50, 0)');
      bhCtx.strokeStyle = topGrad;
      bhCtx.lineWidth = 14;
      bhCtx.stroke();
      // Dimmer second lensed arc
      bhCtx.beginPath();
      bhCtx.arc(cx, cy, ehR + 30, Math.PI + 0.3, -0.3, false);
      bhCtx.strokeStyle = 'rgba(255, 180, 80, 0.3)';
      bhCtx.lineWidth = 6;
      bhCtx.stroke();
      bhCtx.restore();

      // 4. Lensed disk wrapping UNDER the event horizon
      bhCtx.save();
      bhCtx.beginPath();
      bhCtx.arc(cx, cy, ehR + 12, 0.2, Math.PI - 0.2, false);
      const botGrad = bhCtx.createLinearGradient(cx - ehR, cy, cx + ehR, cy);
      botGrad.addColorStop(0, 'rgba(255, 140, 40, 0)');
      botGrad.addColorStop(0.15, 'rgba(255, 170, 80, 0.5)');
      botGrad.addColorStop(0.5, 'rgba(255, 220, 160, 0.85)'); // Brighter core
      botGrad.addColorStop(0.85, 'rgba(255, 170, 80, 0.5)');
      botGrad.addColorStop(1, 'rgba(255, 140, 40, 0)');
      bhCtx.strokeStyle = botGrad;
      bhCtx.lineWidth = 9;
      bhCtx.stroke();
      bhCtx.restore();

      // 5. Photon ring — ultra-thin bright ring at the edge of no return
      bhCtx.beginPath();
      bhCtx.arc(cx, cy, ehR + 3, 0, Math.PI * 2);
      bhCtx.strokeStyle = 'rgba(255, 230, 160, 0.85)';
      bhCtx.lineWidth = 2;
      bhCtx.stroke();

      // 6. Event Horizon — absolute blackness
      bhCtx.beginPath();
      bhCtx.arc(cx, cy, ehR, 0, Math.PI * 2);
      bhCtx.fillStyle = '#000000';
      bhCtx.fill();

      const bhTex = new THREE.CanvasTexture(bhCanvas);
      const bh = new THREE.Sprite(new THREE.SpriteMaterial({ map: bhTex, transparent: true, depthWrite: false }));
      bh.scale.set(1600, 1600, 1);
      group.add(bh);

      // Subtle relativistic jet (dimmer, more background)
      const jetTex = createGlowTexture(80, 120, 200, 128, false);
      const jetUp = new THREE.Sprite(new THREE.SpriteMaterial({ map: jetTex, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
      jetUp.scale.set(60, 1000, 1);
      jetUp.position.set(0, 700, 0);
      group.add(jetUp);

      // Position deeply BEHIND the pillars of creation
      group.position.set(0, 200, -800);
      return group;
    };

    const createSpiralGalaxyLayer = () => {
      const group = new THREE.Group();
      
      const pCount = 10000;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(pCount * 3);
      const col = new Float32Array(pCount * 3);
      
      const colors = [new THREE.Color('#ffbb77'), new THREE.Color('#77aaff'), new THREE.Color('#ffccff')];
      
      for (let i = 0; i < pCount; i++) {
        const arm = i % 3;
        const r = Math.pow(Math.random(), 2.0) * 700; // Dense center, spreads to 700
        const angle = r * 0.015 + (arm * Math.PI * 2 / 3);
        
        const disp = (700 - r) * 0.15 * (Math.random() - 0.5);
        const y = (Math.random() - 0.5) * (30 - r * 0.03); 
        
        pos[i*3] = Math.cos(angle + disp) * r;
        pos[i*3+1] = y;
        pos[i*3+2] = Math.sin(angle + disp) * r;
        
        const color = colors[arm];
        col[i*3] = color.r * (0.7 + Math.random()*0.5);
        col[i*3+1] = color.g * (0.7 + Math.random()*0.5);
        col[i*3+2] = color.b * (0.7 + Math.random()*0.5);
      }
      
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      
      const tex = createGlowTexture(255, 255, 255, 32, false);
      const points = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 3.5, map: tex, vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      
      // Central galactic bulge
      const bulgeTex = createGlowTexture(255, 220, 180, 256, false);
      const bulge = new THREE.Sprite(new THREE.SpriteMaterial({ map: bulgeTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      bulge.scale.set(250, 120, 1);
      
      group.add(points);
      group.add(bulge);

      group.position.set(-500, 250, -1100);
      group.rotation.x = 0.6; // Tilt to look elliptical
      group.rotation.z = -0.2;
      return group;
    };

    const createNebulaLayer = () => {
      const group = new THREE.Group();
      
      // 1. Deep ambient background glow
      const ambientTex = createGlowTexture(12, 45, 75, 256, false);
      const ambient = new THREE.Sprite(new THREE.SpriteMaterial({ map: ambientTex, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
      ambient.scale.set(3200, 2200, 1);
      ambient.position.set(0, 0, -200);
      group.add(ambient);

      // 2. Pillars of Creation — Eagle Nebula (M16), mimicking the Hubble SHO palette:
      //    SII = red-orange, H-alpha = pink-magenta, OIII = blue-green.
      //    Pillars are cold molecular hydrogen columns being photoevaporated by
      //    ultraviolet radiation from nearby massive O/B stars.

      const pillars = [
        { x: -200, h: 400, w: 120, y: -100, z: -150 },
        { x: 40, h: 350, w: 100, y: -100, z: -100 },
        { x: 200, h: 300, w: 80, y: -100, z: -120 }
      ];

      // === TEXTURES (all 256px — fast to create, smooth on screen) ===
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

      // === SHARED MATERIALS ===
      const matCore = new THREE.SpriteMaterial({ map: coreTex, transparent: true, opacity: 0.75, blending: THREE.NormalBlending, depthWrite: false });
      const matDustBase = new THREE.SpriteMaterial({ map: dustBaseTex, transparent: true, opacity: 0.55, blending: THREE.NormalBlending, depthWrite: false });
      const matDustMid = new THREE.SpriteMaterial({ map: dustMidTex, transparent: true, opacity: 0.45, blending: THREE.NormalBlending, depthWrite: false });
      const matDustUpper = new THREE.SpriteMaterial({ map: dustUpperTex, transparent: true, opacity: 0.25, blending: THREE.NormalBlending, depthWrite: false });
      const matHA = new THREE.SpriteMaterial({ map: haGlowTex, transparent: true, opacity: 0.20, blending: THREE.NormalBlending, depthWrite: false });
      const matOIII = new THREE.SpriteMaterial({ map: oiiiGlowTex, transparent: true, opacity: 0.15, blending: THREE.NormalBlending, depthWrite: false });
      const matSII = new THREE.SpriteMaterial({ map: siiGlowTex, transparent: true, opacity: 0.18, blending: THREE.NormalBlending, depthWrite: false });
      const matStarBlue = new THREE.SpriteMaterial({ map: starBlueTex, transparent: true, opacity: 0.80, blending: THREE.AdditiveBlending, depthWrite: false });
      const matStarWhite = new THREE.SpriteMaterial({ map: starWhiteTex, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
      const matTinyStar = new THREE.SpriteMaterial({ map: tinyStarTex, transparent: true, opacity: 0.60, blending: THREE.AdditiveBlending, depthWrite: false });

      pillars.forEach(p => {
        const numBlobs = Math.floor(p.h / 45);

        for (let i = 0; i < numBlobs; i++) {
          const blobY = p.y + (i * (p.h / numBlobs));
          const taper = 1.0 - (i / numBlobs) * 0.55;
          const blobW = p.w * taper;
          const blobH = 140 * taper;

          // Dense shadow core
          const core = new THREE.Sprite(matCore);
          core.scale.set(blobW * 0.35, blobH * 0.70, 1);
          core.position.set(p.x + (Math.random()-0.5)*25, blobY + (Math.random()-0.5)*10, p.z + 3);
          group.add(core);

          // Brown dusty mid-body
          const dustBase = new THREE.Sprite(matDustBase);
          dustBase.scale.set(blobW * 0.55, blobH * 0.85, 1);
          dustBase.position.set(p.x + (Math.random()-0.5)*18, blobY + (Math.random()-0.5)*7, p.z + 2);
          group.add(dustBase);

          // Warmer dust
          const dustMid = new THREE.Sprite(matDustMid);
          dustMid.scale.set(blobW * 0.70, blobH * 0.95, 1);
          dustMid.position.set(p.x + (Math.random()-0.5)*15, blobY + (Math.random()-0.5)*5, p.z + 1);
          group.add(dustMid);

          // Upper dust
          const dustUpper = new THREE.Sprite(matDustUpper);
          dustUpper.scale.set(blobW * 0.85, blobH * 1.05, 1);
          dustUpper.position.set(p.x + (Math.random()-0.5)*12, blobY + (Math.random()-0.5)*4, p.z);
          group.add(dustUpper);

          // H-alpha edge
          const haEdge = new THREE.Sprite(matHA);
          haEdge.scale.set(blobW * 1.15, blobH * 1.15, 1);
          haEdge.position.set(p.x + (Math.random()-0.5)*8 + 3, blobY + (Math.random()-0.5)*4, p.z - 5);
          group.add(haEdge);

          // OIII edge
          const oiiiEdge = new THREE.Sprite(matOIII);
          oiiiEdge.scale.set(blobW * 1.10, blobH * 1.10, 1);
          oiiiEdge.position.set(p.x + (Math.random()-0.5)*8 - 3, blobY + (Math.random()-0.5)*4, p.z - 5);
          group.add(oiiiEdge);

          // SII edge
          const siiEdge = new THREE.Sprite(matSII);
          siiEdge.scale.set(blobW * 1.20, blobH * 1.20, 1);
          siiEdge.position.set(p.x + (Math.random()-0.5)*10, blobY + (Math.random()-0.5)*5, p.z - 3);
          group.add(siiEdge);
        }

        // === Newborn stars at pillar tips ===
        const tipBlue = new THREE.Sprite(matStarBlue);
        tipBlue.scale.set(70, 70, 1);
        tipBlue.position.set(p.x - 5, p.y + p.h + 10, p.z + 8);
        group.add(tipBlue);

        const tipWhite = new THREE.Sprite(matStarWhite);
        tipWhite.scale.set(45, 45, 1);
        tipWhite.position.set(p.x + 8, p.y + p.h + 25, p.z + 12);
        group.add(tipWhite);

        // Scattered EGGs
        for (let s = 0; s < 6; s++) {
          const egg = new THREE.Sprite(matTinyStar);
          egg.scale.set(10 + Math.random() * 14, 10 + Math.random() * 14, 1);
          egg.position.set(
            p.x + (Math.random()-0.5)*p.w * 0.6,
            p.y + p.h * 0.2 + Math.random() * p.h * 0.7,
            p.z + (Math.random()-0.5)*20 + 2
          );
          group.add(egg);
        }
      });

      // === 3. Diffuse nebula backdrop — the Eagle's characteristic glow ===
      const matWisp1 = new THREE.SpriteMaterial({ map: siiGlowTex, transparent: true, opacity: 0.10, blending: THREE.NormalBlending, depthWrite: false });
      const matWisp2 = new THREE.SpriteMaterial({ map: oiiiGlowTex, transparent: true, opacity: 0.09, blending: THREE.NormalBlending, depthWrite: false });
      const w1 = new THREE.Sprite(matWisp1);
      w1.scale.set(650, 450, 1); w1.position.set(-80, -180, -160); group.add(w1);
      const w2 = new THREE.Sprite(matWisp2);
      w2.scale.set(580, 420, 1); w2.position.set(140, -220, -140); group.add(w2);
      const w3 = new THREE.Sprite(matWisp1);
      w3.scale.set(750, 550, 1); w3.position.set(30, -150, -170); group.add(w3);

      // === 4. Massive background outflow layers ===
      const bgTex1 = createGlowTexture(140, 70, 55, 1024, false);
      const bgTex2 = createGlowTexture(50, 130, 150, 1024, false);
      const matBg1 = new THREE.SpriteMaterial({ map: bgTex1, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false });
      const matBg2 = new THREE.SpriteMaterial({ map: bgTex2, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false });

      const bg1 = new THREE.Sprite(matBg1);
      bg1.scale.set(1300, 850, 1); bg1.position.set(30, -100, -180); group.add(bg1);
      const bg2 = new THREE.Sprite(matBg2);
      bg2.scale.set(1100, 720, 1); bg2.position.set(-25, -80, -175); group.add(bg2);
      const bg3 = new THREE.Sprite(matBg1);
      bg3.scale.set(900, 600, 1); bg3.position.set(10, -40, -170); group.add(bg3);

      // === 5. "Pillars of Creation" label ===
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 768; labelCanvas.height = 180;
      const lctx = labelCanvas.getContext('2d')!;
      lctx.textAlign = 'center'; lctx.textBaseline = 'middle';

      // Shadow/glow layers
      lctx.shadowColor = 'rgba(180, 120, 50, 0.10)'; lctx.shadowBlur = 10;
      lctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
      lctx.fillStyle = 'rgba(210, 155, 80, 0.25)';
      lctx.fillText('PILLARS OF CREATION', 384, 90);
      lctx.shadowBlur = 0;

      // Subtle outline for readability
      lctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
      lctx.strokeStyle = 'rgba(8, 4, 1, 0.20)'; lctx.lineWidth = 1;
      lctx.strokeText('PILLARS OF CREATION', 384, 90);
      lctx.fillStyle = 'rgba(220, 175, 95, 0.22)';
      lctx.fillText('PILLARS OF CREATION', 384, 90);

      const labelTex = new THREE.CanvasTexture(labelCanvas);
      labelTex.minFilter = THREE.LinearFilter;
      const matLabel = new THREE.SpriteMaterial({ map: labelTex, transparent: true, opacity: 0.5, blending: THREE.NormalBlending, depthWrite: false });
      const label = new THREE.Sprite(matLabel);
      label.scale.set(450, 110, 1);
      label.position.set(0, 80, -50);
      group.add(label);

      return group;
    };
    // === Programmer Workstation on Pillars of Creation ===
    const nebulaGroup = createNebulaLayer();
    scene.add(nebulaGroup);
    scene.add(createBlackHoleLayer());
    scene.add(createSpiralGalaxyLayer());
    const workstation = createProgrammerWorkstation(nebulaGroup);

    // Load the GLB programmer model
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/man_typing.glb', (gltf) => {
      const model = gltf.scene as THREE.Group;
      if (!model) return;
      // Scale proportionally to fit the chair
      model.scale.set(4, 4, 4);
      // Position the programmer to sit perfectly in the chair
      // Chair is at y = -3.5, z = 7. Floor is at y = -8.
      // Move him back to z = 6 (so hands reach keyboard at z = 0.5)
      // Drop him to y = -8 (floor) so his butt rests on the chair at y = -3.5
      model.position.set(0, -7.5, 6);
      // Model faces -Z in local space (towards the desk) → after group's Math.PI rotation → faces spectator
      model.rotation.y = Math.PI;
      workstation.wsGroup.add(model);

      // === Apply colors to the model meshes ===
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.7, metalness: 0.05 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3e, roughness: 0.6, metalness: 0.1 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.0 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.0 });
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.9, metalness: 0.0 });

      // Compute bounding box to determine head position
      const bbox = new THREE.Box3().setFromObject(model);
      const modelHeight = bbox.max.y - bbox.min.y;

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Determine body region from relative Y position of mesh center
          const meshBBox = new THREE.Box3().setFromObject(child);
          const meshCenterY = (meshBBox.min.y + meshBBox.max.y) / 2;
          const relativeY = (meshCenterY - bbox.min.y) / modelHeight;

          if (relativeY > 0.85) {
            // Head region — skin
            child.material = skinMat;
          } else if (relativeY > 0.55) {
            // Torso — shirt
            child.material = shirtMat;
          } else if (relativeY > 0.45) {
            // Hands/forearms — skin
            child.material = skinMat;
          } else if (relativeY > 0.1) {
            // Legs — pants
            child.material = pantsMat;
          } else {
            // Feet — shoes
            child.material = shoeMat;
          }
        }
      });

      // === Add procedural hair ===
      const headY = bbox.max.y;
      const headCenterX = (bbox.min.x + bbox.max.x) / 2;
      const headCenterZ = (bbox.min.z + bbox.max.z) / 2;
      const hairGeo = new THREE.SphereGeometry(0.28, 12, 8);
      hairGeo.scale(1.0, 0.45, 1.1); // Flatten into a hair-cap shape
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(headCenterX, headY - 0.02, headCenterZ);
      model.add(hair);

      // === Add invisible hitbox sphere for reliable click/hover detection ===
      const hitboxGeo = new THREE.SphereGeometry(2.5, 8, 6);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      // Place hitbox at the WORLD position of the model's torso
      // Local (0, -7.5, 6) -> World (0, 55 - (-7.5), -20 - 6) -> (0, 62.5, -26)
      // Then add 7 to Y for the torso height -> 62.5 + 7 = 69.5
      hitbox.position.set(
        workstation.WORKSTATION_POS.x,
        workstation.WORKSTATION_POS.y + 7.5 + 7,
        workstation.WORKSTATION_POS.z - 6
      );
      hitbox.userData = { isProgrammerHitbox: true };
      scene.add(hitbox);

      // Play the typing animation
      const mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length > 0) {
        const clip = gltf.animations[0];
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
      // Store for animation loop
      if (sceneRef.current) {
        (sceneRef.current as any).mixer = mixer;
        (sceneRef.current as any).programmerHitbox = hitbox;
        sceneRef.current.programmerModel = model;
      }
    }, undefined, (err) => {
      console.warn('Failed to load programmer model:', err);
    });

    const allNodesSorted = [...nodes].sort((a, b) => {
      const aIsApp = a.label.toLowerCase().includes('app.tsx') || a.label.toLowerCase().includes('app.jsx');
      const bIsApp = b.label.toLowerCase().includes('app.tsx') || b.label.toLowerCase().includes('app.jsx');
      if (aIsApp && !bIsApp) return -1;
      if (bIsApp && !aIsApp) return 1;
      return b.degree - a.degree;
    });
    const godNodesList = allNodesSorted.slice(0, 5);
    const godNodeIds = new Set(godNodesList.map(n => n.id));
    const godNodesMap = new Map<string, THREE.Sprite>();
    const PENTAGON_R = 15;
    
    for (let i = 0; i < godNodesList.length; i++) {
      const n = godNodesList[i];
      const col = new THREE.Color(COMMUNITY_PALETTE[n.community % COMMUNITY_PALETTE.length]);
      const tex = createGlowTexture(Math.round(col.r*255), Math.round(col.g*255), Math.round(col.b*255), 128, true);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.2 }));
      const gSize = 8.0 + Math.pow(n.degree, 0.6) * 2.0;
      sprite.scale.set(gSize, gSize, 1);
      
      if (i === 0) {
        sprite.position.set(0, 0, 0);
      } else {
        const angle = ((i - 1) / 4) * Math.PI * 2;
        const godY = (Math.random() - 0.5) * PENTAGON_R * 1.5;
        sprite.position.set(Math.cos(angle) * PENTAGON_R, godY, Math.sin(angle) * PENTAGON_R);
      }
      
      sprite.userData = { nodeId: n.id, isGod: true, node: n, baseSize: gSize };
      scene.add(sprite);
      godNodesMap.set(n.id, sprite);
    }

    // Spaceship orbiting the programmer workstation
    const shipGroup = new THREE.Group();
    const shipBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 2.5, 4),
      new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35 })
    );
    shipBody.rotation.x = Math.PI / 2;
    shipGroup.add(shipBody);

    // Ship engine glow
    const shipGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: createGlowTexture(100, 180, 255, 64, true),
      transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    shipGlow.scale.set(4, 4, 1);
    shipGroup.add(shipGlow);

    // Ship trail (engine exhaust)
    const shipTrail = new THREE.Sprite(new THREE.SpriteMaterial({
      map: createGlowTexture(60, 140, 255, 64, true),
      transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    shipTrail.scale.set(2, 6, 1);
    shipTrail.position.z = 1.5;
    shipGroup.add(shipTrail);

    shipGroup.position.set(
      workstation.WORKSTATION_POS.x + 15,
      workstation.WORKSTATION_POS.y + 5,
      workstation.WORKSTATION_POS.z
    );
    scene.add(shipGroup);

    // === Data Particles streaming between programmer and pillars ===
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = workstation.WORKSTATION_POS.x + (Math.random() - 0.5) * 40;
      particlePositions[i * 3 + 1] = workstation.WORKSTATION_POS.y + (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 2] = workstation.WORKSTATION_POS.z + (Math.random() - 0.5) * 30;
      particleSpeeds[i] = 0.3 + Math.random() * 0.7;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleTex = createGlowTexture(0, 200, 255, 32, true);
    const particleMat = new THREE.PointsMaterial({
      size: 1.2, map: particleTex, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const dataParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(dataParticles);

    const planetSprites = new Map<string, THREE.Sprite>();
    const moonSprites: THREE.Sprite[] = [];
    
    communityIds.forEach((cid, idx) => {
      const members = byCommunity.get(cid)!;
      const col = new THREE.Color(COMMUNITY_PALETTE[cid % COMMUNITY_PALETTE.length]);
      const orbitR = orbitRadii.get(cid)!;
      const startAngle = idx * GOLDEN_ANGLE;
      
      let localMembers = members.filter(n => !godNodeIds.has(n.id));
      if (localMembers.length === 0) return;
      localMembers.sort((a, b) => b.degree - a.degree);
      
      const hubNode = localMembers[0];
      const moonMembers = localMembers.slice(1);

      const pTex = createGlowTexture(Math.round(col.r*255), Math.round(col.g*255), Math.round(col.b*255), 128, true);
      const pSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: pTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.12 }));
      const pSize = 5.0 + Math.pow(hubNode.degree, 0.6) * 1.5 + Math.pow(localMembers.length, 0.4);
      pSprite.scale.set(pSize, pSize, 1);
      
      const pIncl = (Math.random() - 0.5) * 1.2;
      const pPhaseY = Math.random() * Math.PI * 2;
      
      pSprite.position.set(Math.cos(startAngle) * orbitR, Math.sin(startAngle + pPhaseY) * (orbitR * pIncl), Math.sin(startAngle) * orbitR);
      pSprite.userData = { communityId: cid, isPlanet: true, startAngle, orbitR, node: hubNode, baseSize: pSize, incl: pIncl, phaseY: pPhaseY };
      scene.add(pSprite);
      planetSprites.set(`community_${cid}`, pSprite);

      const mTex = createGlowTexture(Math.round(col.r*255), Math.round(col.g*255), Math.round(col.b*255), 64, false);
      moonMembers.forEach((n, mIdx) => {
        const ma = mIdx * GOLDEN_ANGLE;
        const mr = 4.0 + Math.pow(mIdx, 0.6) * 1.8;
        
        const mSize = 3.0 + Math.pow(n.degree, 0.5) * 1.5;
        const mSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: mTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.08 }));
        mSprite.scale.set(mSize, mSize, 1);
        mSprite.frustumCulled = false;
        
        const mIncl = (Math.random() - 0.5) * 2.0; // Huge 3D variance
        const mPhaseY = Math.random() * Math.PI * 2;
        
        mSprite.userData = { isMoon: true, node: n, angle: ma, r: mr, cid, baseSize: mSize, incl: mIncl, phaseY: mPhaseY };
        scene.add(mSprite);
        moonSprites.push(mSprite);
      });
    });

    const lineGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(links.length * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    lineSegments.frustumCulled = false;
    scene.add(lineSegments);

    const packetGeo = new THREE.BufferGeometry();
    const packetPos = new Float32Array(links.length * 3 * 3); // 3 packets per link
    packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPos, 3));
    const packetTex = createGlowTexture(150, 220, 255, 64, true);
    const packetMat = new THREE.PointsMaterial({ size: 1.5, map: packetTex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const packetPoints = new THREE.Points(packetGeo, packetMat);
    packetPoints.frustumCulled = false;
    scene.add(packetPoints);

    const clock = new THREE.Clock();
    let lastElapsed = 0;

    // === Performance: Build O(1) nodeId → sprite lookup map ===
    const nodeIdToSprite = new Map<string, THREE.Object3D>();
    for (const [id, s] of godNodesMap) nodeIdToSprite.set(id, s);
    for (const [, p] of planetSprites) nodeIdToSprite.set(p.userData.node.id, p);
    for (const m of moonSprites) nodeIdToSprite.set(m.userData.node.id, m);

    sceneRef.current = {
      scene, camera, renderer, controls, composer, animFrame: 0, godNodes: godNodesMap, planetSprites, moonSprites, lineSegments, packetPoints, starLayers, shipGroup, links, clock,
      programmerModel: null, workstation, dataParticles
    };

    const animate = () => {
      const c = sceneRef.current;
      if (!c) return;
      const elapsed = clock.getElapsedTime();
      const delta = elapsed - lastElapsed;
      lastElapsed = elapsed;
      
      c.starLayers[0].rotation.y = elapsed * 0.008;
      c.starLayers[0].rotation.x = Math.sin(elapsed * 0.003) * 0.05;
      c.starLayers[1].rotation.y = elapsed * 0.012;
      c.starLayers[1].rotation.x = Math.sin(elapsed * 0.005) * 0.08;

      const shipAngle = elapsed * 0.5;
      const shipR = 15 + Math.sin(elapsed * 0.3) * 3;
      const wp = c.workstation?.WORKSTATION_POS;
      if (wp) {
        c.shipGroup.position.x = wp.x + Math.cos(shipAngle) * shipR;
        c.shipGroup.position.z = wp.z + Math.sin(shipAngle) * shipR;
        c.shipGroup.position.y = wp.y + 5 + Math.sin(elapsed * 0.7) * 3;
      } else {
        c.shipGroup.position.x = Math.cos(shipAngle) * shipR;
        c.shipGroup.position.z = Math.sin(shipAngle) * shipR;
        c.shipGroup.position.y = Math.sin(elapsed * 0.7) * 2;
      }
      c.shipGroup.rotation.y = -shipAngle + Math.PI / 2;
      c.shipGroup.rotation.z = Math.sin(elapsed * 0.4) * 0.15;

      // Animate holographic rings and orbs
      if (c.workstation) {
        c.workstation.holoRing.rotation.z = elapsed * 0.3;
        c.workstation.holoRing2.rotation.z = -elapsed * 0.5;
        c.workstation.orbs.forEach((orb, i) => {
          orb.position.y = c.workstation!.WORKSTATION_POS.y + 2 + Math.sin(elapsed * 0.8 + i * 1.2) * 1.5;
          orb.material.opacity = 0.15 + Math.sin(elapsed * 1.5 + i) * 0.1;
        });
      }

      // Animate data particles
      if (c.dataParticles) {
        const pos = c.dataParticles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i);
          y += 0.15;
          if (y > (wp ? wp.y + 80 : 320)) {
            y = wp ? wp.y - 40 : 200;
            pos.setX(i, wp ? wp.x + (Math.random() - 0.5) * 40 : (Math.random() - 0.5) * 40);
            pos.setZ(i, wp ? wp.z + (Math.random() - 0.5) * 30 : (Math.random() - 0.5) * 30);
          }
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }

      // Update GLB animation mixer
      if ((c as any).mixer) {
        (c as any).mixer.update(delta);
      }
      
      for (const [, p] of c.planetSprites) {
        const ud = p.userData;
        const speed = 0.0002;
        const newAngle = ud.startAngle + elapsed * speed;
        p.position.x = Math.cos(newAngle) * ud.orbitR;
        p.position.z = Math.sin(newAngle) * ud.orbitR;
        p.position.y = Math.sin(newAngle + ud.phaseY) * (ud.orbitR * ud.incl);
        
        if (ud.node.id === selectedRef.current || ud.node.id === hoveredRef.current) {
          p.material.opacity = 0.25;
          p.scale.set(ud.baseSize * 1.2, ud.baseSize * 1.2, 1);
        } else {
          p.material.opacity = selectedRef.current ? 0.08 : 0.12;
          p.scale.set(ud.baseSize, ud.baseSize, 1);
        }
      }
      
      for (const m of c.moonSprites) {
        const ud = m.userData;
        const pSprite = c.planetSprites.get(`community_${ud.cid}`);
        if (pSprite) {
          const mSpeed = 0.0005 + (1 / ud.r) * 0.005;
          const a = ud.angle + elapsed * mSpeed;
          m.position.x = pSprite.position.x + Math.cos(a) * ud.r;
          m.position.z = pSprite.position.z + Math.sin(a) * ud.r;
          m.position.y = pSprite.position.y + Math.sin(a + ud.phaseY) * (ud.r * ud.incl);
          
          if (ud.node.id === selectedRef.current || ud.node.id === hoveredRef.current) {
            m.material.opacity = 0.3;
            m.scale.set(ud.baseSize * 1.5, ud.baseSize * 1.5, 1);
          } else {
            m.material.opacity = selectedRef.current ? 0.05 : 0.08;
            m.scale.set(ud.baseSize, ud.baseSize, 1);
          }
        }
      }
      
      // Update line and packet positions
      const lp = c.lineSegments.geometry.attributes.position as THREE.BufferAttribute;
      const pp = c.packetPoints.geometry.attributes.position as THREE.BufferAttribute;
      let lineIdx = 0;
      let packetIdx = 0;
      
      c.links.forEach(link => {
        const isSelected = !!selectedRef.current;
        const isConnected = isSelected && (link.source === selectedRef.current || link.target === selectedRef.current);

        if (isConnected) {
          // O(1) lookup instead of O(n) find()
          const sObj = nodeIdToSprite.get(link.source);
          const tObj = nodeIdToSprite.get(link.target);
          const sx = sObj ? sObj.position.x : 0, sy = sObj ? sObj.position.y : 0, sz = sObj ? sObj.position.z : 0;
          const tx = tObj ? tObj.position.x : 0, ty = tObj ? tObj.position.y : 0, tz = tObj ? tObj.position.z : 0;

          lp.setXYZ(lineIdx * 2, sx, sy, sz);
          lp.setXYZ(lineIdx * 2 + 1, tx, ty, tz);
          
          for (let k = 0; k < 3; k++) {
            const progress = (elapsed * 0.4 + k * 0.33) % 1.0;
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            pp.setXYZ(packetIdx++, sx + (tx - sx) * ease, sy + (ty - sy) * ease, sz + (tz - sz) * ease);
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
      
      controls.update();
      composer.render();
      c.animFrame = requestAnimationFrame(animate);
    };
    if (sceneRef.current) sceneRef.current.animFrame = requestAnimationFrame(animate);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 1.5;
    const mouse = new THREE.Vector2();

    const getIntersectedNode = (e: MouseEvent | PointerEvent) => {
      const c = sceneRef.current;
      if (!c || !container) return null;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left)/rect.width)*2-1;
      mouse.y = -((e.clientY - rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse, camera);
      
      const gods = Array.from(c.godNodes.values());
      const planets = Array.from(c.planetSprites.values());
      const allSprites = [...gods, ...planets, ...c.moonSprites];
      
      const hits = raycaster.intersectObjects(allSprites, false);
      for (const hit of hits) {
        if (hit.point && hit.object) {
          const dist = hit.point.distanceTo(hit.object.position);
          const normalizedDist = dist / hit.object.scale.x;
          // The glow is in the inner 40% of the quad (radius 0.2)
          if (normalizedDist <= 0.2) {
            return hit.object.userData.node as GraphNode;
          }
        }
      }
      return null;
    };

    const getIntersectedLink = (e: MouseEvent | PointerEvent) => {
      const c = sceneRef.current;
      if (!c || !container || !selectedRef.current || !c.links) return null;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left)/rect.width)*2-1;
      mouse.y = -((e.clientY - rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.params.Line = { threshold: 4.0 }; // Generous click area for lasers
      const hits = raycaster.intersectObject(c.lineSegments, false);
      if (hits.length > 0) {
        for (const hit of hits) {
          if (hit.index !== undefined) {
             const linkIdx = Math.floor(hit.index / 2);
             const link = c.links[linkIdx];
             if (link) {
               if (link.source === selectedRef.current || link.target === selectedRef.current) {
                 return link.source === selectedRef.current ? link.target : link.source;
               }
             }
          }
        }
      }
      return null;
    };

    const rideToNode = (targetId: string) => {
      const c = sceneRef.current;
      if (!c || !selectedRef.current) return;
      
      const getNodePos = (id: string) => {
        if (c.godNodes.has(id)) return c.godNodes.get(id)!.position;
        const moon = c.moonSprites.find(m => m.userData.node.id === id);
        if (moon) return moon.position;
        const planet = Array.from(c.planetSprites.values()).find(p => p.userData.node.id === id);
        if (planet) return planet.position;
        return new THREE.Vector3();
      };

      const startPos = getNodePos(selectedRef.current).clone();
      const targetPos = getNodePos(targetId).clone();
      
      const dir = targetPos.clone().sub(startPos).normalize();
      
      // Ride above the line like a roller coaster
      const up = new THREE.Vector3(0, 1, 0);
      const right = dir.clone().cross(up).normalize();
      const offset = up.clone().multiplyScalar(4).add(right.clone().multiplyScalar(2));
      
      const startCam = startPos.clone().add(offset);
      const endCam = targetPos.clone().sub(dir.clone().multiplyScalar(20)).add(offset);
      
      const startTarget = c.controls.target.clone();
      
      let progress = 0;
      const anim = () => {
        progress += 0.012; // slow, cinematic ride
        if (progress >= 1) {
          isCanvasClickRef.current = true;
          onSelect(targetId);
          setTimeout(() => { isCanvasClickRef.current = false; }, 100);
          flyToNode(targetId); // settle into final position
          return;
        }
        // Smooth sine ease in-out
        const t = (1 - Math.cos(progress * Math.PI)) / 2;
        c.camera.position.lerpVectors(startCam, endCam, t);
        // Look directly ahead along the line at the destination node
        c.controls.target.lerpVectors(startTarget, targetPos, t);
        requestAnimationFrame(anim);
      };
      anim();
    };

    let pointerDownPos = { x: 0, y: 0 };
    
    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 5) return; // It was a drag to pan the camera, ignore click
      
      const hitNode = getIntersectedNode(e);
      if (hitNode) {
        isCanvasClickRef.current = true;
        onSelect(hitNode.id);
        setTimeout(() => { isCanvasClickRef.current = false; }, 100);
      } else {
        // Check if clicked on programmer hitbox (reuse existing raycaster)
        const c = sceneRef.current;
        const hitbox = (c as any)?.programmerHitbox as THREE.Mesh | null;
        if (hitbox) {
          const hits = raycaster.intersectObject(hitbox, false);
          if (hits.length > 0) {
            // Single click on programmer: just show it's interactive, don't fly
            return;
          }
        }
        const hitLinkId = getIntersectedLink(e);
        if (hitLinkId) {
           rideToNode(hitLinkId);
        } else {
           isCanvasClickRef.current = true;
           onSelect(null);
           setTimeout(() => { isCanvasClickRef.current = false; }, 100);
        }
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      const c = sceneRef.current;
      if (!c) return;

      // Check if double-clicked on the programmer hitbox
      const hitbox = (c as any)?.programmerHitbox as THREE.Mesh | null;
      if (hitbox) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(hitbox, false);
        if (hits.length > 0) {
          const targetPos = hitbox.position.clone();
          const startPos = c.camera.position.clone();
          const endPos = targetPos.clone().add(new THREE.Vector3(15, 3, 25)); // Offset from the torso
          const startTarget = c.controls.target.clone();
          const endTarget = targetPos.clone();
          let progress = 0;
          const travelAnim = () => {
            progress += 0.02;
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
      const hitNode = getIntersectedNode(e);
      if (hitNode) {
        if (hoveredRef.current !== hitNode.id) {
          onHover(hitNode.id);
          onTooltip({ x: e.clientX, y: e.clientY, node: hitNode });
          document.body.style.cursor = 'pointer';
        } else {
          onTooltip({ x: e.clientX, y: e.clientY, node: hitNode });
        }
      } else {
        // Check if hovering over programmer hitbox (raycaster already set from getIntersectedNode)
        const c = sceneRef.current;
        const hitbox = (c as any)?.programmerHitbox as THREE.Mesh | null;
        if (hitbox) {
          const hHits = raycaster.intersectObject(hitbox, false);
          if (hHits.length > 0) {
            onTooltip({
              x: e.clientX,
              y: e.clientY,
              node: {
                id: '__programmer__',
                label: 'The Programmer',
                source_file: 'Creator of this codebase',
                degree: nodes.length,
                community: 0
              } as GraphNode
            });
            document.body.style.cursor = 'pointer';
            return;
          }
        }
        if (hoveredRef.current) {
          onHover(null);
          onTooltip(null);
          document.body.style.cursor = 'default';
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('dblclick', handleDblClick);
    container.addEventListener('pointermove', handlePointerMove);

    const handleResize = () => {
      const c = sceneRef.current;
      if (!c || !container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      c.camera.aspect = nw/nh; c.camera.updateProjectionMatrix();
      c.renderer.setSize(nw, nh); c.composer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('dblclick', handleDblClick);
      container.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(sceneRef.current?.animFrame || 0);
      window.removeEventListener('resize', handleResize);
      // Cleanup GLB model
      if (sceneRef.current?.programmerModel) {
        sceneRef.current.programmerModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      // Cleanup data particles
      if (sceneRef.current?.dataParticles) {
        sceneRef.current.dataParticles.geometry.dispose();
        (sceneRef.current.dataParticles.material as THREE.Material).dispose();
      }
      sceneRef.current?.composer.dispose();
      sceneRef.current?.renderer.dispose();
      sceneRef.current?.controls.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, [nodes?.length > 0 ? true : false]);

  return <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'none' }} />;
});
