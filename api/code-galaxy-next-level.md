# Code Galaxy: Turning Your Codebase Into a Freaking Solar System

Look at your codebase. Go on, open your `src/` folder. What do you see?

Files. A sad pile of rectangles. Folders inside folders inside folders, like some kind of bureaucratic nesting doll. Maybe — *maybe* — you crack open a dependency graph plugin and get rewarded with a 2D spaghetti monster that eats 8 gigs of RAM and crashes your browser tab the moment you breathe on it.

Cool. Very productive. Much insight.

Now picture this instead: your **App.tsx** is a glowing blue star at the center of a solar system. Around it orbits a Jupiter-sized planet called `AuthModule`, painted in rusty red because it's "Mars" community. Around *that* planet spins a swarm of tiny moons — your `login()`, your `logout()`, the `hashPassword()` you wrote at 2am and never quite finished. In the distance, a black hole made of dead code slowly breathes. A tiny astronaut programmer — *literally you* — sits at a desk nearby, sipping coffee, steam rising off the mug, while a hologram of your latest commit flickers overhead like an offering to the code gods.

This is **Code Galaxy**. And it is, frankly, the most fun I've ever had staring at a dependency graph.

This is the story of how I built it — a walkthrough of the ridiculous, over-engineered, deeply entertaining way to graph your codebase.

---

## The Problem With Every Code Graph Ever

Let's be honest about what existing tools give us:

- **Dots and lines.** Always dots and lines.
- **Zoom = lag.** Want to see the big picture? Here's a slideshow. Want to zoom in? Here's a different slideshow.
- **No soul.** You can't *feel* a force-directed layout. You just squint at it.
- **No story.** Where's the drama? Where's the cinematic flythrough? Where's the *vibe*?

Worse: nothing about a 2D node-link diagram actually teaches you anything about your architecture that reading the README wouldn't. Communities sort of blob together. Hubs are slightly bigger. Cool. Filed under: *things I already knew*.

So I set out to build a graph that is not just informative, but **entertaining** — one you'd actually want to explore, the same way you wanted to explore every planet in *No Man's Sky* before you realized they were all the same planet.

The goal: if Code Galaxy doesn't make a visitor audibly go "ohhh", it has failed.

---

## The Big Idea: Code-as-Cosmos

Here's the metaphor that runs the whole show, from `constants.ts`:

```codehike typescript
// Each community maps to a real celestial body with its actual colors.
export const COMMUNITY_PALETTE = [
  '#b5b5b5', // 0  Mercury — grey cratered
  '#e8cda0', // 1  Venus — pale yellow-orange
  '#4a90d9', // 2  Earth — blue ocean
  '#c1440e', // 3  Mars — rusty red
  '#c88b3a', // 4  Jupiter — amber brown bands
  '#d4a843', // 5  Saturn — golden beige
  // ...Pluto, Ceres, Io, Europa, Titan, Triton, Enceladus...
];
```

Every code community detected from your repo gets mapped to an actual planet, moon, or dwarf planet. Earth-blue for your core domain logic. Rusty Mars-red for your auth cluster. Gas-giant amber for the giant `utils` folder everyone hates. The colors aren't random — they're *the real planets*. Your codebase becomes the solar system it deserves to be.

But the metaphor isn't just decoration — it's the design language for how every visual choice gets made:

| Cosmic metaphor  | Codebase reality                                |
| ---------------- | ----------------------------------------------- |
| Star             | A "god node" — your most-connected files (the hubs everything imports) |
| Planet           | A community's hub node (the centroid file of a cluster) |
| Moon             | A non-hub node in a community, orbiting its planet |
| Orbit radius     | How far a community sits from the origin (density-sorted) |
| Star size        | Node degree — how many edges connect to it      |
| Orbit tilt       | Random inclination — pure vibes                |
| Black hole       | Just a black hole. It breathes. Don't read into it. |
| Coffee mug       | You. The programmer. Steaming. Vibe-maxxing.    |

That last row is not a joke — there's literally a wsGroup with a desk, a lamp casting real shadow-mapped light, a hologram, a phone playing an animated YouTube video, and a coffee mug emitting 16 particle sprites of steam. We'll get there.

---

## Step 1: Pick a Renderer That Isn't From 2009

The single most important decision: **do this in WebGL, not SVG.**

Every "interactive graph" you've ever hated was an SVG or Canvas2D force simulation that redrew ten thousand nodes at 8fps and made your laptop fan sound like a jet engine. Three.js (and WebGL generally) lets you push the *entire scene graph* to the GPU, where you have actual depth, actual lighting, actual post-processing, and honest-to-god 60fps on a machine that isn't a workstation.

Here's the canvas pipeline from `CanvasGraph.tsx`:

```codehike typescript
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Post-processing: bloom makes everything glow like a sci-fi movie
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  1.2, 0.8, 0.2
);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
```

That `UnrealBloomPass` is the move that takes us from "graph" to "galaxy". Bloom is what makes the stars *twinkle*, the planets *glow*, the data packets *streak through space like tiny comet trails*. It's the difference between a network diagram and a *vibe*.

---

## Step 2: Stop Computing Layout At Runtime

Force-directed layouts are the original sin of graph visualization. You feed the physics engine your nodes, it shudders to life, every node jitters for 30 seconds pretending to find equilibrium, and the user watches in nausea.

Code Galaxy computes layout **once**, deterministically, in `useGraphLayout.ts`:

```codehike typescript
// Place communities on a logarithmic spiral around the origin.
function hubPosition(i: number, total: number) {
  const t = i / Math.max(total - 1, 1);
  const angle = t * Math.PI * 2 * 1.61803398875; // golden-angle rotation
  const radius = HUB_RADIUS * (0.35 + 0.65 * Math.sqrt(t));
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}
```

- Communities sit on a **golden-angle spiral**, densest-first, largest clusters toward the center.
- Each community's member nodes get arranged in their own mini-cluster, with the highest-degree node at the center.
- Layout is computed in `useMemo` and stuffed into a ref so the renderer can read it without re-rendering React on every frame.

The trick: **layout is data, not animation**. The "drift" you see when nodes gently bob is a time-based sine wave applied at draw time, not actual physics. Cheap, smooth, no jank.

---

## Step 3: Build a Starfield You'd Actually Want to Live In

A graph floating in a black void is depressing. The first thing the scene builds is a proper **cosmic backdrop** — two layers of background stars with different colors and parallax rotation, plus a spiral galaxy way off in the distance, plus — because why not — the *Pillars of Creation* nebula from the Hubble telescope, rebuilt from procedurally generated dust sprites.

```codehike typescript
const star1 = createStarLayer(6000, 1.0, 0.5, 900, 350, [
  "#ffffff", "#ffcc88", "#99ccff",
]);
const star2 = createStarLayer(500, 2.5, 0.8, 700, 500, [
  "#ffffff", "#ffaa44", "#44aaff", "#ffddaa",
]);

scene.add(createSpiralGalaxyLayer());
scene.add(createNebulaLayer());
```

`createStarLayer` returns a `THREE.Points` with per-vertex color jitter so no two stars are exactly the same brightness. `createNebulaLayer` stacks something like a dozen different glow textures — H-alpha reds, OIII cyans, SII golds — to fake the multi-wavelength look of real nebula photography. There's even a barely-visible text label "CREATION PILLARS" baked onto a sprite, so if you fly *really* close you see it.

Is any of this necessary for "graphing your codebase"? Absolutely not. That's the point.

---

## Step 4: The Solar System Itself

Now the meat: turning nodes into celestial bodies. Here's the hierarchy:

### Tier 1 — Stars (the "god nodes")

Your top 5 most-connected files (with `App.tsx` always winning ties) become glowing stars arranged in a pentagon at the origin:

```codehike typescript
const allNodesSorted = [...nodes].sort((a, b) => {
  const aIsApp = a.label.toLowerCase().includes("app.tsx");
  const bIsApp = b.label.toLowerCase().includes("app.tsx");
  if (aIsApp && !bIsApp) return -1;
  if (bIsApp && !aIsApp) return 1;
  return b.degree - a.degree;
});
const godNodesList = allNodesSorted.slice(0, 5);
```

The pentagon arrangement isn't random — it gives the "center of the galaxy" feel a deliberate geometric anchor. Everything else orbits *around* something, but stars are the destination you fly toward.

### Tier 2 — Planets (community hubs)

For every remaining community, the highest-degree non-god node becomes a planet placed on its own orbit, with golden-angle spacing so distribution looks natural:

```codehike typescript
const orbitR = 25 + Math.sqrt(idx + 1) * 20;
const startAngle = idx * GOLDEN_ANGLE;

pSprite.position.set(
  Math.cos(startAngle) * orbitR,
  Math.sin(startAngle + pPhaseY) * (orbitR * pIncl),
  Math.sin(startAngle) * orbitR,
);
```

Every planet gets a random orbital inclination — some orbits are nearly flat, some are wildly tilted. This creates the "view from above the ecliptic" feel of real solar systems, where you can instantly tell which worlds belong to which orbit just by the angle.

### Tier 3 — Moons (every other node)

Everything else orbits its community's planet, distributed on the golden angle again, sized by their own degree:

```codehike typescript
moonMembers.forEach((n, mIdx) => {
  const ma = mIdx * GOLDEN_ANGLE;
  const mr = 4.0 + Math.pow(mIdx, 0.6) * 1.8;
  const mSize = 3.0 + Math.pow(n.degree, 0.5) * 1.5;
  // ...orbits the planet at radius mr
});
```

So when you see a planet flanked by twenty glowing motes, *that's actually twenty files in your codebase, each sized proportionally to how much it's imported, each orbiting the hub file it conceptually belongs to*. The graph is communicating structure through orbital mechanics. That's the whole pitch.

### The Golden Ratio is doing real work

You'll notice `GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))` repeated everywhere — orbit spacing, moon distribution, even the spiral galaxy arms. The golden angle is the math behind sunflower seeds and pinecones: distribute points by it and you get maximally-even coverage with zero clumping. It's why Code Galaxy's orbits never look like cluttered rings — they look like *nature*.

---

## Step 5: Edges That Don't Look Like Tangled Hair

Every graph tool draws every edge all the time. That's why your screen turns into a solid block of grey the moment your project grows past 200 files.

Code Galaxy draws **only the edges connected to the currently selected node**, and animates them as flowing packets of light — like data physically transiting a wire:

```codehike typescript
for (let k = 0; k < 3; k++) {
  const progress = (elapsed * 0.4 + k * 0.33) % 1.0;
  const ease =
    progress < 0.5 ? 2 * progress * progress
                   : -1 + (4 - 2 * progress) * progress;
  pp.setXYZ(
    packetIdx++,
    sx + (tx - sx) * ease,
    sy + (ty - sy) * ease,
    sz + (tz - sz) * ease,
  );
}
```

Three packets per edge, staggered 33% apart in phase, easing in over the line — they read as a steady stream of *relations happening*, not a static line. Select any node and its entire connection fan lights up like a switchboard. Everything else dims to a faint backdrop. The signal-to-noise ratio flips from "everything is highlighted" to "this is what you asked about".

Bonus: this means edge rendering cost scales with the *selected node's degree*, not the total edge count. A 50,000-edge graph runs just as smoothly as a 500-edge one.

---

## Step 6: The Spaceship Camera

Graph tools let you pan and zoom. Cool. Code Galaxy lets you **fly**.

Click a node → focus softly. Double-click → the camera banks toward it like an X-Wing making a run on the Death Star. Click an *edge* → the camera rides the connection to the target node along a Catmull-Rom spline, with the field of view widening to a "warp" 50°+ at the apex of the curve before snapping back:

```codehike typescript
const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
curve.curveType = "centripetal";

const warpFactor = Math.sin(t * Math.PI);
c.camera.fov = 45 + warpFactor * 50;
c.camera.updateProjectionMatrix();
```

That FOV kick — physically distorting the perspective mid-travel — is the single most important piece of feedback that tells your brain "I am *moving*, this thing has *speed*". It's the same trick Star Fox uses. Try it once and you'll never want to scroll a node graph again.

The whole `rideToNode` функции builds the curve from current camera position → angled midpoint → approach vector → final orbit position, so every ride feels hand-choreographed even though it's procedural.

---

## Step 7: The Programmer (Yes, There's a Guy)

Here's where it gets unhinged.

Floating off to one side of the scene is a tiny **workstation**: a desk with shadow-cast legs, a laptop whose screen softly glows blue with a halo of holographic particles behind it, a desk lamp casting a real `THREE.SpotLight` with shadow maps onto a coffee mug that is, in fact, steaming.

```codehike typescript
const mug = new THREE.Mesh(mugGeo, mugMat);
mug.position.set(5, 0.9, 2);
mug.castShadow = true;
mug.receiveShadow = true;

// 16 steam sprites that loop with swirl + rise physics
for (let i = 0; i < smokeCount; i++) {
  const steam = new THREE.Sprite(steamMat);
  steam.userData = {
    life: Math.random() * 4,
    maxLife: 3 + Math.random() * 2,
    swirlSpeed: 1.2 + Math.random() * 0.8,
    riseSpeed: 0.4 + Math.random() * 0.3,
  };
}
```

There's a phone on the desk playing an *animated YouTube video* (random scrolling colored bars plus a red progress bar, looped on a canvas texture). There's a book lying open whose cover *changes every 10 seconds* — cycling through pristine serif-title renderings of *The Pragmatic Programmer*, *Clean Code*, *SICP*, *Designing Data-Intensive Applications*, half the GoF catalogue, *Surely You're Joking, Mr. Feynman!*, even *Dune* and *1984*, all hand-rendered with text wrapping on a 1024×768 offscreen canvas.

And sitting at the desk? An actual rigged GLB model of a programmer typing, loaded via DRACOLoader, with an `AnimationMixer` running the typing loop on infinite repeat:

```codehike typescript
const mixer = new THREE.AnimationMixer(model);
if (gltf.animations.length > 0) {
  const action = mixer.clipAction(gltf.animations[0]);
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
}
```

If you fly toward the programmer (click his invisible hitbox — there's an invisible `SphereGeometry` raycast target around him), you discover that **he is you**. Hover him and the tooltip says his role is "Dev" and that he created every node you're looking at.

This is not "cute". This is the joke that *ties the whole piece together.* Your codebase is a galaxy. The programmer is a god quietly running the simulation. The coffee is steam-particle physics. The book is a tiny lit review of the entire field. It's a love letter to the act of writing software, hidden inside what could've just been a force-directed graph.

---

## Step 8: Ask the Black Hole a Question

The final layer: every node has an **Ask AI** button. Click it and Code Galaxy hands the AI not just the file's name — it builds a complete structural context from the graph itself:

```codehike typescript
const codebaseContext = buildCodebaseContext(data.payload, node, neighbors);
onOpenChat(prompt, codebaseContext);
```

The `buildCodebaseContext.ts` function emits a structured summary including:
- Total nodes & edges in the codebase
- The top 15 communities by size
- The selected node's file, location, type, community, and degree
- Its connected neighbors (capped at 15, each with file + community)
- The top 10 most-connected "key files" in the whole repo
- A file-type breakdown across the project

That goes to the chat as `codebaseContext` so the AI isn't answering "what does this function do" — it's answering *in context of the entire architecture around it*. You can ask "why does this matter" and get an actual answer grounded in graph topology instead of vibes.

This is the genuine "next level" part of the gimmick: the graph isn't just decoration. It's an **index** into the codebase that an LLM can use to reason about your project as a system, not as a pile of text.

---

## Step 9: Black Holes, because Rule of Cool

Did I mention there's a Gargantua-style black hole in the background? Because there is. Off at `(0, 30, -300)` sits a sprite whose texture is dynamically redrawn on a 30fps schedule with a procedurally animated accretion disk, event-horizon breathing, gravitational lensing falloff, photon ring pulse, and sixteen swirling emission blobs orbiting the event horizon:

```codehike typescript
const engulfPulse = 1 + Math.sin(elapsed * 0.02) * 0.03;
sprite.scale.set(600 * engulfPulse, 600 * engulfPulse, 1);

const sway = Math.sin(elapsed * 0.01) * 5;
blackHoleGroup.position.x = sway;
blackHoleGroup.position.y = 30 + Math.sin(elapsed * 0.015) * 3;
```

Does the black hole do anything? No. Does it *mean* anything? No. Is the whole thing strictly less interesting without it? Also no.

When in doubt: add a black hole. The rule of cool is undefeated.

---

## The Surprising Part: It's Actually Useful

Here's where I'll stop being a goofball for a second.

I built Code Galaxy as a flex — a portfolio showpiece, a "look what I can render in a browser" party trick. But somewhere around the third project I imported into it, I noticed something: **I was actually finding things in my codebase by exploring the graph.**

- Spotted a "fat god node" because it was the only star in an otherwise healthy-looking galaxy — restaurants of imports all funneled into one file.
- Spotted a community of files that should've merged with another but didn't, because their orbits were weirdly far apart for files that called each other constantly.
- Used the filter bar to isolate one community and immediately understood which moon orbits which planet — i.e., which helpers depended on which core types.
- Asked the AI about an orphan moon floating suspiciously far from its planet and got pointed straight at some legacy file with one remaining caller I'd completely forgotten about.

The visual metaphors aren't theater. **Star size really does correlate with hubness. Orbit distance really does reflect community density. Edge fan-out from a selected node really does reveal blast radius.** Those are real signals, made legible by mapping them onto things the human visual system is already evolved to parse — bright things, dim things, near things, far things, things that move together.

That's the actual lesson here, and it's worth saying out loud:

> A graph doesn't have to be ugly to be useful. It doesn't have to be boring to be honest.
> A graph is a *visualization*. **Make it visualize.**

---

## How to Build Your Own

If you want to replicate the recipe, the stack is laughably accessible:

1. **Three.js** for the WebGL scene and `OrbitControls`.
2. **EffectComposer + UnrealBloomPass** for the glow that sells the whole aesthetic.
3. **Pre-compute layout** with whatever community detection you like (Louvain, Leiden, label propagation — anything that gives you integer cluster IDs). Don't run force sim at runtime. Never.
4. **Map communities → color palettes**. I used real planets, but anything consistent works — seasons, gemstones, RGB cubes, your call.
5. **Two-tier node hierarchy**: a "hub" sprite per community, with the rest as orbiters. This is what makes the graph *read*.
6. **Selective edge rendering**: only draw edges from the selected node. Only animate packet streams along them.
7. **One piece of narrative set dressing**: a workstation, a signpost, a tiny astronaut — something that grounds the abstraction in a story.
8. **Warp-FOV camera rides on edge-click**. Non-negotiable. Go re-read Step 6 if you skipped it.
9. **LLM context bridge**: feed the LLM the structural summary, not just the prompt. Watch the answers get smarter.
10. **One thing that's purely vibes.** A black hole. A comet. A nebula. The thing that makes people go "wait, is that..." and lean in.

That's it. That's the whole playbook. The Code Galaxy source is right here in `src/components/CodeGalaxy/` — every file is small, single-purpose, and readable in one sitting:

- `useGraphData.ts` — fetch + index the graph payload (nodesById, linksByNode, communities, topHubs)
- `useGraphLayout.ts` — deterministic spiral layout, computed once
- `CanvasGraph.tsx` — the entire 3D scene (god nodes, planets, moons, edges, workstation, black hole, raycaster, camera rides)
- `SidePanel.tsx` — node detail drawer with grouped-by-relation neighbor list and the Ask AI button
- `FilterBar.tsx` — search (`/` shortcut), community filter, file filter, stats overlay with top "god nodes"
- `CodeGalaxyWindow.tsx` — the React container; memoizes selection, hover, filter state, and bridges to the AI chat
- `buildCodebaseContext.ts` — the prompt-context builder
- `constants.ts` — all the shared magic numbers, palettes, and types

Read them in that order. You'll have the whole thing in twenty minutes.

---

## Closing Thought

Your codebase isn't a flat list of files. It's a **place**. It has centers of gravity, dead rings, busy hubs, lonely outposts, and at least one god object that everyone pretends isn't there. The reason most code graphs feel like homework is that they refuse to honor that.

Code Galaxy takes the architecture you've *actually* built — the one you have an intuitive feel for but can never quite describe — and instead of flattening it, **leans into the metaphor**. Makes it grand. Makes it visual. Makes it a place you can *fly to*.

And then it puts a little guy at a desk drinking coffee in the corner — just so you remember: this whole improbable galaxy only exists because somebody sat down and made it.

That's the next level.

Go graph something ridiculous.

— *the little programmer at the desk*
