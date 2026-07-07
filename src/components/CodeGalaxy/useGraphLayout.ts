import { useMemo, useEffect, useRef } from 'react';
import type { GraphNode, GraphLink } from './constants';
import { HUB_RADIUS } from './constants';

export type LayoutNode = GraphNode & {
  x: number;
  y: number;
  driftPhase: number;
  driftAngle: number;
};

export type LayoutState = {
  nodes: LayoutNode[];
  links: GraphLink[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
  vx: number;
  vy: number;
};

// Place communities on a logarithmic spiral around the origin.
function hubPosition(i: number, total: number) {
  const t = i / Math.max(total - 1, 1);
  const angle = t * Math.PI * 2 * 1.61803398875; // golden-angle rotation
  const radius = HUB_RADIUS * (0.35 + 0.65 * Math.sqrt(t));
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

// Layout is computed once per graph payload. Drift is animated at draw time using time-based phase.
export function useGraphLayout(
  nodes: GraphNode[],
  links: GraphLink[]
): { layout: LayoutState; layoutRef: React.MutableRefObject<LayoutState> } {
  const layout = useMemo<LayoutState>(() => {
    if (!nodes.length) {
      return {
        nodes: [],
        links,
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      };
    }

    // Group nodes by community
    const byCommunity = new Map<number, GraphNode[]>();
    for (const n of nodes) {
      if (!byCommunity.has(n.community)) byCommunity.set(n.community, []);
      byCommunity.get(n.community)!.push(n);
    }

    const communityIds = Array.from(byCommunity.keys()).sort((a, b) => {
      const sa = byCommunity.get(a)!.length;
      const sb = byCommunity.get(b)!.length;
      return sb - sa; // densest first, large communities toward center
    });

    const communityCenter = new Map<number, { x: number; y: number }>();
    communityIds.forEach((cid, i) => {
      communityCenter.set(cid, hubPosition(i, communityIds.length));
    });

    // Place nodes around each community hub in a mini-cluster
    const layoutNodes: LayoutNode[] = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const cid of communityIds) {
      const members = byCommunity.get(cid)!;
      const center = communityCenter.get(cid)!;
      const memberCount = members.length;

      // Presort by degree so the hub-ish appear at center
      const sorted = [...members].sort((a, b) => b.degree - a.degree);
      const radius = 30 + Math.sqrt(memberCount) * 18;

      sorted.forEach((n, i) => {
        const t = i / Math.max(memberCount - 1, 1);
        const a = t * Math.PI * 2 * 3.14159 + cid * 0.3;
        const inner = i === 0 ? 0 : radius * (0.3 + 0.7 * Math.sqrt(t));
        const x = center.x + Math.cos(a) * inner;
        const y = center.y + Math.sin(a) * inner;

        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);

        layoutNodes.push({
          ...n,
          x,
          y,
          driftPhase: Math.random() * Math.PI * 2,
          driftAngle: Math.random() * Math.PI * 2,
        });
      });
    }

    return {
      nodes: layoutNodes,
      links,
      bounds: {
        minX: minX === Infinity ? -500 : minX - 80,
        maxX: maxX === -Infinity ? 500 : maxX + 80,
        minY: minY === Infinity ? -500 : minY - 80,
        maxY: maxY === -Infinity ? 500 : maxY + 80,
      },
    };
  }, [nodes, links]);

  const layoutRef = useRef(layout);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  return { layout, layoutRef };
}
