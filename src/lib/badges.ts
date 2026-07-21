export interface Badge {
  id: string;
  name: string;
  description: string;
  shape: 'hexagon' | 'octagon' | 'shield' | 'diamond' | 'star' | 'circle' | 'crown' | 'cross' | 'banner' | 'flame';
  color: string; // Tailwind/custom CSS gradient classes
  icon: string;  // Material symbols icon name
  reqLevel: number;
}

// Generate the 100 badges programmatically to guarantee unique shapes, names, and visual cues.
const badgeNames = [
  "Dawn Initiate", "Focus Spark", "Cognitive Seed", "Tempo Runner", "Aether Cadet",
  "Silicon Scout", "Zenith Novice", "Calm Wanderer", "Solitary Spark", "Epoch Starter",
  "Circuit Walker", "Mind Apprentice", "Quantum Squire", "Vanguard Scout", "Starlight Seeker",
  "Apex Initiate", "Silent Weaver", "Pristine Focal", "Digital Nomad", "Chrono Tracker",
  "Steel Sentry", "Cyber Vanguard", "Echo Warden", "Lobby Raider", "Glitch Specialist",
  "Tether Weaver", "Neon Striker", "Hyper Focus", "Synapse Architect", "Vortex Rider",
  "Spectral Guard", "Cognitive Blade", "Void Specter", "Quantum Keeper", "Matrix Sentinel",
  "Cipher Hacker", "Aurora Knight", "Solar Champion", "Luna Protector", "Cosmic Seeker",
  "Nebula Warden", "Eclipse Vanguard", "Chrono Guardian", "Infinity Squire", "Vector Ranger",
  "Pulse Gladiator", "Dynamo Breaker", "Apex Predator", "Prism Scholar", "Obsidian Shield",
  "Emerald Sentry", "Ruby Vanguard", "Sapphire Scholar", "Amber Knight", "Titan Warden",
  "Astral Monk", "Focal Zealot", "Deep Focus Master", "Horizon Walker", "Rune Weaver",
  "Cyber Knight", "Plasma Raider", "Solitary Titan", "Entropy Restorer", "Anomaly Hunter",
  "Gravity Bender", "Neutron Star", "Supernova Focal", "Void Walker", "Alpha Sentinel",
  "Omega Guardian", "Zenith Master", "Ether Catalyst", "Matrix Overlord", "Synapse Emperor",
  "Apex Overlord", "Quantum Sage", "Chrono Chronologist", "Cosmic Deity", "Infinity Overlord",
  "Monolith Sentinel", "Dark Matter Master", "Solar Flare Champion", "Void Harbinger", "Glitch Monarch",
  "Vector Warlord", "Aether Archon", "Focal Leviathan", "Lobby Warlord", "Starlight Empress",
  "Celestial Sovereign", "Abyss Emperor", "Epoch Overlord", "Neural Overlord", "Prime Catalyst",
  "Elysian Warden", "Chronos Monarch", "Vortex Sovereign", "Zenith Vanguard", "CogniSweep Legend"
];

const shapes: Badge['shape'][] = [
  'hexagon', 'octagon', 'shield', 'diamond', 'star',
  'circle', 'crown', 'cross', 'banner', 'flame'
];

const gradients = [
  "from-[#00ffa3] to-[#00b8ff]", // Neon cyan-blue
  "from-[#ffaa00] to-[#ff0055]", // Orange-red blaze
  "from-[#a020f0] to-[#ff00ff]", // Purple-pink glitch
  "from-[#00f2fe] to-[#4facfe]", // Cyber blue
  "from-[#f857a6] to-[#ff5858]", // Sunset cherry
  "from-[#11998e] to-[#38ef7d]", // Emerald flow
  "from-[#ffe259] to-[#ffa751]", // Golden sun
  "from-[#3a7bd5] to-[#3a6073]", // Steel metallic
  "from-[#ec008c] to-[#fc6767]", // Red-hot plasma
  "from-[#141e30] to-[#243b55]"  // Obsidian deep
];

const icons = [
  "local_fire_department", "bolt", "psychology", "insights", "military_tech",
  "workspace_premium", "emoji_events", "shield", "hourglass_empty", "camera_enhance",
  "speed", "verified", "star", "vpn_key", "school",
  "extension", "language", "spa", "wb_sunny", "nights_stay"
];

export const BADGES: Badge[] = Array.from({ length: 100 }).map((_, i) => {
  const levelRequirement = i < 20 ? 30 + i : 100 + (i - 20);
  return {
    id: `badge_${i + 1}`,
    name: badgeNames[i] || `Focus Badge ${i + 1}`,
    description: `Unlocked at Level ${levelRequirement} by completing high-focus study sprints in CogniSweep Arenas.`,
    shape: shapes[i % shapes.length],
    color: gradients[i % gradients.length],
    icon: icons[i % icons.length],
    reqLevel: levelRequirement
  };
});
