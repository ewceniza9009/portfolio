import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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

export function CanvasGraph({ nodes, links, selectedId, onSelect, hoveredId, onHover, onTooltip }: CanvasGraphProps) {
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
    links: GraphLink[];
    clock: THREE.Clock;
  } | null>(null);

  const selectedRef = useRef(selectedId);
  const hoveredRef = useRef(hoveredId);
  const isCanvasClickRef = useRef(false);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { hoveredRef.current = hoveredId; }, [hoveredId]);

  const flyToNode = (id: string | null) => {
    const c = sceneRef.current;
    if (!c) return;
    
    let targetPos = new THREE.Vector3(0, 0, 0); 
    let targetCam = new THREE.Vector3(50, 30, 70); 
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
    scene.fog = new THREE.FogExp2(0x020205, 0.002);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 4000);
    camera.position.set(50, 30, 70);

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
    scene.add(createStarLayer(12000, 1.0, 0.5, 900, 350, ['#ffffff', '#ffcc88', '#99ccff']));
    scene.add(createStarLayer(800, 2.5, 0.8, 700, 500, ['#ffffff', '#ffaa44', '#44aaff', '#ffddaa']));

    const createNebulaLayer = () => {
      const group = new THREE.Group();
      const colors = ['#882233', '#cc5533', '#115577', '#228899', '#442255', '#663322'];
      for (let i = 0; i < 20; i++) {
        const col = new THREE.Color(colors[i % colors.length]);
        const tex = createGlowTexture(col.r * 255, col.g * 255, col.b * 255, 256, false);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
        mat.rotation = Math.random() * Math.PI;
        const sprite = new THREE.Sprite(mat);
        
        // Emulate towering pillar-like shapes and deep clouds
        const width = 200 + Math.random() * 300;
        const height = 400 + Math.random() * 500;
        sprite.scale.set(width, height, 1);
        
        const px = (Math.random() - 0.5) * 800;
        const py = (Math.random() - 0.5) * 600;
        const pz = -400 - Math.random() * 400; // Far in the background
        sprite.position.set(px, py, pz);
        group.add(sprite);
      }
      return group;
    };
    scene.add(createNebulaLayer());

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
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 }));
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
      const pSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: pTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
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
        const mSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: mTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 }));
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
    sceneRef.current = {
      scene, camera, renderer, controls, composer, animFrame: 0, godNodes: godNodesMap, planetSprites, moonSprites, lineSegments, packetPoints, links, clock
    };

    const animate = () => {
      const c = sceneRef.current;
      if (!c) return;
      const elapsed = clock.getElapsedTime();
      
      for (const [, p] of c.planetSprites) {
        const ud = p.userData;
        const speed = 0.0002;
        const newAngle = ud.startAngle + elapsed * speed;
        p.position.x = Math.cos(newAngle) * ud.orbitR;
        p.position.z = Math.sin(newAngle) * ud.orbitR;
        p.position.y = Math.sin(newAngle + ud.phaseY) * (ud.orbitR * ud.incl);
        
        if (ud.node.id === selectedRef.current || ud.node.id === hoveredRef.current) {
          p.material.opacity = 0.8;
          p.scale.set(ud.baseSize * 1.2, ud.baseSize * 1.2, 1);
        } else {
          p.material.opacity = selectedRef.current ? 0.2 : 0.5;
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
            m.material.opacity = 1.0;
            m.scale.set(ud.baseSize * 1.5, ud.baseSize * 1.5, 1);
          } else {
            m.material.opacity = selectedRef.current ? 0.15 : 0.35;
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
        const shouldShow = isConnected;

        if (shouldShow) {
          const sGod = c.godNodes.get(link.source);
          const tGod = c.godNodes.get(link.target);
          let sx=0,sy=0,sz=0, tx=0,ty=0,tz=0;

          if (sGod) { sx=sGod.position.x; sy=sGod.position.y; sz=sGod.position.z; }
          else {
            const sMoon = c.moonSprites.find(m => m.userData.node.id === link.source);
            if (sMoon) { sx=sMoon.position.x; sy=sMoon.position.y; sz=sMoon.position.z; }
            else {
              const sPlanet = Array.from(c.planetSprites.values()).find(p => p.userData.node.id === link.source);
              if (sPlanet) { sx=sPlanet.position.x; sy=sPlanet.position.y; sz=sPlanet.position.z; }
            }
          }

          if (tGod) { tx=tGod.position.x; ty=tGod.position.y; tz=tGod.position.z; }
          else {
            const tMoon = c.moonSprites.find(m => m.userData.node.id === link.target);
            if (tMoon) { tx=tMoon.position.x; ty=tMoon.position.y; tz=tMoon.position.z; }
            else {
              const tPlanet = Array.from(c.planetSprites.values()).find(p => p.userData.node.id === link.target);
              if (tPlanet) { tx=tPlanet.position.x; ty=tPlanet.position.y; tz=tPlanet.position.z; }
            }
          }
          lp.setXYZ(lineIdx * 2, sx, sy, sz);
          lp.setXYZ(lineIdx * 2 + 1, tx, ty, tz);
          
          // Animate packets flowing from source to target
          for (let k = 0; k < 3; k++) {
            const progress = (elapsed * 0.4 + k * 0.33) % 1.0;
            // Ease-in-out curve for packet movement
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            const px = sx + (tx - sx) * ease;
            const py = sy + (ty - sy) * ease;
            const pz = sz + (tz - sz) * ease;
            pp.setXYZ(packetIdx++, px, py, pz);
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
          sprite.material.opacity = 0.8;
        } else if (id === hoveredRef.current) {
          sprite.scale.set(ud.baseSize * 1.1, ud.baseSize * 1.1, 1);
          sprite.material.opacity = 0.8;
        } else {
          sprite.scale.set(ud.baseSize, ud.baseSize, 1);
          sprite.material.opacity = selectedRef.current ? 0.2 : 0.6;
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

    let pointerDownPos = { x: 0, y: 0 };
    
    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 5) return; // It was a drag to pan the camera, ignore click
      
      const hitNode = getIntersectedNode(e);
      isCanvasClickRef.current = true;
      if (hitNode) {
        onSelect(hitNode.id);
      } else {
        onSelect(null);
      }
      setTimeout(() => { isCanvasClickRef.current = false; }, 100);
    };

    const handleDblClick = () => {
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
      sceneRef.current?.composer.dispose();
      sceneRef.current?.renderer.dispose();
      sceneRef.current?.controls.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, [nodes?.length > 0 ? true : false]);

  return <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'none' }} />;
}
