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
  Auditorium: {id: 'Auditorium', name: 'Auditorium', lat: 17.545351148607924, lng: 78.5709805627085, isVenue: false},
  RockGarden: {id: 'Rock Garden', name: 'Rock Garden', lat: 17.544369093209248, lng: 78.57305659407868, isVenue: false},
  ChessGarden: {id: 'Chess Garden', name: 'Chess Garden', lat: 17.545930587388355, lng: 78.56969696331403, isVenue: false},
  OAT: {id: 'OAT', name: 'Amphitheatre', lat:17.544387044647223, lng: 78.57097449067834, isVenue: true},
  Fountain: {id: 'Fountain', name: 'Entry Fountain', lat: 17.544387044647223, lng: 78.57097449067834, isVenue: false},
  RoundAbout1: {id: 'RoundAbout1', name: 'Roundabout 1', lat: 17.544568120347215, lng: 78.57367126290178, isVenue: false},
  RoundAbout2: {id: 'RoundAbout2', name: 'Roundabout 2', lat: 17.544568120347215, lng: 78.57367126290178, isVenue: false},
  EBlockEntrance: {id: 'EBlockEntrance', name: 'E Block Entrance', lat: 17.543628273937063, lng: 78.5719744069708, isVenue: true},
  Stage1: {id: 'Stage1', name: 'Stage 1', lat: 17.543628273937063, lng: 78.5719744069708, isVenue: true},
  PublicGardens: {id: 'PublicGardens', name: 'Public Garden', lat: 17.543628273937063, lng: 78.5719744069708, isVenue: false},
  CBlockEntrance: {id: 'CBlockEntrance', name: 'C Block Entrance', lat: 17.54483719029753, lng: 78.57194108337292, isVenue:false},
  Mess1: {id: 'Mess1', name: 'Mess 1', lat: 17.54259499008356, lng: 78.57403812515173, isVenue: false},
  CentralWorkshop: {id: 'CentralWorkshop', name: 'Central Workshop', lat: 17.54358865399951, lng: 78.57046185447192, isVenue: false},
  DBlockEntrance: {id: 'DBlockEntrance', name: 'D Block Entrance', lat: 17.544332499159808, lng: 78.57200108827854, isVenue: false}
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

  {from: 'LibraryLawns', to: 'Auditorium', distance: 20, instruction: 'Walk straight towards auditorium'},
  {from: 'Auditorium', to: 'LibraryLawns', distance: 20, instruction: 'Walk straight ahead towards LibraryLawns'},

  {from: 'Fountain', to: 'PublicGardens', distance: 100, instruction: 'Take the second exit from the main gate towards the gardens'},
  {from: 'PublicGardens', to: 'Fountain', distance: 100, instruction: 'Walk straight ahead towards the main gate with back to roundabout 1'},

  {from: 'PublicGardens', to: 'RoundAbout1', distance: 50, instruction: 'Walk straight towards the roundabout'},
  {from: 'Auditorium', to: 'LibraryLawns', distance: 50, instruction: 'Walk straight towards the public gardens'},

  {from: 'RoundAbout1', to: 'RoundAbout2', distance: 20, instruction: 'Walk straight towards the second roundabout in front of rock garden'},
  {from: 'RoundAbout2', to: 'RoundAbout1', distance: 20, instruction: 'Walk straight towards the first roundabout in front of rock garden, near public gardens'},

  {from: 'RoundAbout2', to: 'DBlockEntrance', distance: 25, instruction: 'Walk through the rock gardens, past the waterfall, up the stairs.'},
  {from: 'DBlockEntrance', to: 'RoundAbout2', distance: 25, instruction: 'Walk through the stairs that lead to the rock gardens, and through the rock gardens'},    

  {from: 'OAT', to: 'Central Workshop', distance: 10, instruction: 'Walk past the OAT through the side passage and into the ground, continue straight'},
  {from: 'Cenral Workshop', to: 'OAT', distance: 10, instruction: 'Walk into the grounds right in front of Workshop and continue straight'},    

  {from: 'LTC', to: 'OAT', distance: 10, instruction: 'Walk straight towards the open area with back towards the library lawns.'},
  {from: 'OAT', to: 'LTC', distance: 10, instruction: 'With back towards OAT, walk towards library lawns.'},

  {from: 'Mess1', to: 'RoundAbout1', distance: 20, instruction: 'Walk straight towards the roundabout'},
  {from: 'RoundAbout1', to: 'Mess1', distance: 20, instruction: 'Walk straight towards the mess'},
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
