export interface NavNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isVenue: boolean;
}

export interface NavEdge {
  from: string;
  to: string;
  distance: number;
  instruction: string;
}

export const nodes: Record<string, NavNode> = {
  F103: { id: 'F103', name: 'Room F103', lat: 17.54450810245184, lng: 78.57073213572195, isVenue: true },
  LTC: { id: 'LTC', name: 'Lecture Theater Complex', lat: 17.544643982667296, lng: 78.57100153696973, isVenue: true },
  F208: { id: 'F208', name: 'Room F208', lat: 17.545059068173963, lng: 78.57073994445379, isVenue: true },
  G206: { id: 'G206', name: 'Room G206', lat: 17.54567704126002, lng: 78.57120846836196, isVenue: true },
  G104: { id: 'G104', name: 'Room G104', lat: 17.545364332251765, lng: 78.57178436236919, isVenue: true },
  Ishtara: { id: 'Ishtara', name: 'Ishtara Cafe', lat: 17.54501329008211, lng: 78.57076922718065, isVenue: false },
  LibraryLawns: {id: 'LibraryLawns', name: 'Library Lawns', lat: 17.5451574523013, lng: 78.57134097529074, isVenue: true},
  Library: {id: 'Library', name: 'Library', lat: 17.54552316466743, lng: 78.57145631027102, isVenue: true},
};

export const edges: NavEdge[] = [
  { from: 'F103', to: 'LTC', distance: 10, instruction: 'Turn right towards the LTC Lobby' },
  { from: 'LTC', to: 'F103', distance: 10, instruction: 'Turn right towards F102 and F103' },
  
  { from: 'Ishtara', to: 'LTC', distance: 20, instruction: 'Walk south-east to the Lecture Theater Complex' },
  { from: 'LTC', to: 'Ishtara', distance: 20, instruction: 'Walk north-west towards Ishtara Cafe' },
  
  { from: 'G104', to: 'G206', distance: 20, instruction: 'Take the stairs up to the second floor, G206' },
  { from: 'G206', to: 'G104', distance: 20, instruction: 'Take the stairs down to the first floor, G104' },
  
  { from: 'Ishtara', to: 'F208', distance: 50, instruction: 'Go up the stairs, take left and right towards F208' },
  { from: 'F208', to: 'Ishtara', distance: 50, instruction: 'Go down the stairs towards Ishtara' },

  { from: 'LTC', to: 'LibraryLawns', distance: 20, instruction: 'Walk straight ahead towards the Library Lawns' },
  { from: 'LibraryLawns', to: 'LTC', distance: 20, instruction: 'Walk straight ahead towards the Lecture Theater Complex' },

  { from: 'LibraryLawns', to: 'Library', distance: 20, instruction: 'Walk straight ahead towards the Library' },
  { from: 'Library', to: 'LibraryLawns', distance: 20, instruction: 'Walk straight ahead towards the Library Lawns' },

  {from: 'Library', to: 'G104', distance: 30, instruction: 'Walk straight ahead towards the G104'},
  {from: 'G104', to: 'Library', distance: 30, instruction: 'Walk straight ahead towards the Library'},
];

/**
 * Dijkstra's Algorithm for Uniform Cost Search
 * Finds the shortest path considering physical edge 'distance'.
 */
export const findShortestPath = (startId: string, endId: string) => {
  if (!nodes[startId] || !nodes[endId]) return null;

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  Object.keys(nodes).forEach(nodeId => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  });

  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Pick unvisited node with lowest distance
    let currentId: string | null = null;
    let minDistance = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentId = nodeId;
      }
    }

    if (!currentId || minDistance === Infinity) break; // unreachable or done
    if (currentId === endId) break; // reached target

    unvisited.delete(currentId);

    // Evaluate neighbors
    const neighbors = edges.filter(e => e.from === currentId);
    for (const edge of neighbors) {
      if (unvisited.has(edge.to)) {
        const newDist = distances[currentId] + edge.distance;
        if (newDist < distances[edge.to]) {
          distances[edge.to] = newDist;
          previous[edge.to] = currentId;
        }
      }
    }
  }

  // Backtrack to build route
  const path: string[] = [];
  let current: string | null = endId;

  if (previous[current] || current === startId) {
    while (current) {
      path.unshift(current);
      current = previous[current];
    }
  }

  if (path.length === 0) return null;

  const instructions: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) {
      instructions.push(edge.instruction);
    }
  }

  return { path, instructions, totalDistance: distances[endId] };
};
