import type { GraphNode, GraphPayload } from './constants';

export function buildCodebaseContext(
  payload: GraphPayload,
  selectedNode: GraphNode,
  neighbors: GraphNode[],
): string {
  const lines: string[] = [];

  lines.push('CODEBASE STRUCTURE (from Code Galaxy graph analysis):');
  lines.push(`Total files/modules: ${payload.nodes.length} nodes, ${payload.links.length} connections.`);

  // Community summary
  const communityMap = new Map<number, { name: string; count: number; files: Set<string> }>();
  for (const n of payload.nodes) {
    if (!communityMap.has(n.community)) {
      communityMap.set(n.community, { name: n.community_name, count: 0, files: new Set() });
    }
    const c = communityMap.get(n.community)!;
    c.count++;
    c.files.add(n.source_file);
  }

  lines.push('\nCOMMUNITIES (code clusters):');
  const sortedCommunities = [...communityMap.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [id, c] of sortedCommunities.slice(0, 15)) {
    lines.push(`- ${c.name} (comm ${id}): ${c.count} nodes across ${c.files.size} files`);
  }

  // Selected node detail
  lines.push(`\nSELECTED NODE: "${selectedNode.label}"`);
  lines.push(`  File: ${selectedNode.source_file}`);
  lines.push(`  Location: ${selectedNode.source_location}`);
  lines.push(`  Type: ${selectedNode.file_type}`);
  lines.push(`  Community: ${selectedNode.community_name}`);
  lines.push(`  Connections: ${selectedNode.degree}`);

  // Neighbors
  if (neighbors.length > 0) {
    lines.push('\nCONNECTED TO:');
    for (const n of neighbors.slice(0, 15)) {
      lines.push(`  - "${n.label}" (${n.source_file}) [${n.community_name}]`);
    }
  }

  // Key files (top hubs) — single-pass computation
  const idToFile = new Map<string, string>();
  for (const n of payload.nodes) {
    idToFile.set(n.id, n.source_file);
  }
  const fileDegree = new Map<string, number>();
  for (const l of payload.links) {
    const srcFile = idToFile.get(l.source);
    const tgtFile = idToFile.get(l.target);
    if (srcFile) fileDegree.set(srcFile, (fileDegree.get(srcFile) || 0) + 1);
    if (tgtFile) fileDegree.set(tgtFile, (fileDegree.get(tgtFile) || 0) + 1);
  }
  const topFiles = [...fileDegree.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  lines.push('\nKEY FILES (most connected):');
  for (const [file, deg] of topFiles) {
    lines.push(`  - ${file} (${deg} connections)`);
  }

  // File type breakdown
  const typeCounts = new Map<string, number>();
  for (const n of payload.nodes) {
    typeCounts.set(n.file_type, (typeCounts.get(n.file_type) || 0) + 1);
  }
  lines.push('\nFILE TYPES:');
  for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`  - ${type}: ${count}`);
  }

  return lines.join('\n');
}
