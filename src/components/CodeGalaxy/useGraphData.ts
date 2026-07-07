import { useEffect, useState, useMemo } from 'react';
import type { GraphPayload, GraphNode, GraphLink } from './constants';

// Base URL for the data file shipped to /public during build.
const DATA_URL = `${import.meta.env.BASE_URL || '/'}codegalaxy/graph.json`.replace(/\/\//g, '/').replace(':/', '://');

export type GraphData = {
  loading: boolean;
  error: string | null;
  payload: GraphPayload | null;
  nodesById: Map<string, GraphNode>;
  linksByNode: Map<string, GraphLink[]>;
  fileNodes: Map<string, GraphNode[]>;
  communityNodes: Map<number, GraphNode[]>;
  communities: { id: number; name: string; count: number }[];
  files: string[];
  topHubs: { id: string; label: string; degree: number; source_file: string }[];
};

export function useGraphData(): GraphData {
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GraphPayload) => {
        if (cancelled) return;
        setPayload({
          nodes: data.nodes || [],
          links: data.links || [],
          built_at_commit: data.built_at_commit,
        });
        setLoading(false);
      })
      .catch(e => {
        if (cancelled) return;
        setError(e.message || 'Failed to load graph');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const derived = useMemo(() => {
    if (!payload) {
      return {
        nodesById: new Map<string, GraphNode>(),
        linksByNode: new Map<string, GraphLink[]>(),
        fileNodes: new Map<string, GraphNode[]>(),
        communityNodes: new Map<number, GraphNode[]>(),
        communities: [] as { id: number; name: string; count: number }[],
        files: [] as string[],
        topHubs: [] as { id: string; label: string; degree: number; source_file: string }[],
      };
    }

    // Compute degree per node
    const degree = new Map<string, number>();
    for (const l of payload.links) {
      degree.set(l.source, (degree.get(l.source) || 0) + 1);
      degree.set(l.target, (degree.get(l.target) || 0) + 1);
    }

    const nodesWithDegree: GraphNode[] = payload.nodes.map(n => ({
      ...n,
      degree: degree.get(n.id) || 0,
    }));

    const nodesById = new Map<string, GraphNode>();
    nodesWithDegree.forEach(n => nodesById.set(n.id, n));

    // Adjacency
    const linksByNode = new Map<string, GraphLink[]>();
    for (const l of payload.links) {
      if (!linksByNode.has(l.source)) linksByNode.set(l.source, []);
      if (!linksByNode.has(l.target)) linksByNode.set(l.target, []);
      linksByNode.get(l.source)!.push(l);
      linksByNode.get(l.target)!.push(l);
    }

    // Group by source_file
    const fileNodes = new Map<string, GraphNode[]>();
    for (const n of nodesWithDegree) {
      if (!fileNodes.has(n.source_file)) fileNodes.set(n.source_file, []);
      fileNodes.get(n.source_file)!.push(n);
    }

    // Group by community
    const communityNodes = new Map<number, GraphNode[]>();
    for (const n of nodesWithDegree) {
      if (!communityNodes.has(n.community)) communityNodes.set(n.community, []);
      communityNodes.get(n.community)!.push(n);
    }

    const communities = Array.from(communityNodes.entries())
      .map(([id, ns]) => ({
        id,
        name: ns[0]?.community_name || `Community ${id}`,
        count: ns.length,
      }))
      .sort((a, b) => b.count - a.count);

    const files = Array.from(fileNodes.keys()).sort();

    // Top "god" hubs
    const topHubs = [...nodesWithDegree]
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 8)
      .map(n => ({ id: n.id, label: n.label, degree: n.degree, source_file: n.source_file }));

    return {
      nodesById,
      linksByNode,
      fileNodes,
      communityNodes,
      communities,
      files,
      topHubs,
    };
  }, [payload]);

  return {
    loading,
    error,
    payload,
    ...derived,
  };
}
