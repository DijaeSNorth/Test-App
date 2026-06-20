import type {
  CategoryOption,
  ForgeProcess,
  HourlyContract,
  PartOption,
  SkillId,
  SkillLesson,
  SkillPathDefinition,
  SkillPathNode
} from "./types";

export const categoryOptions: CategoryOption[] = [
  {
    id: "blade",
    label: "Blades",
    assetSlot: "weapon.primary",
    focus: "reaction",
    subtypes: ["Shortsword", "Axe", "Spear", "Katar", "Glaive"],
    silhouette: "strike edge"
  },
  {
    id: "tool",
    label: "Tools",
    assetSlot: "tool.active",
    focus: "speed",
    subtypes: ["Hammer", "Chisel", "Pick", "Tongs", "Compass"],
    silhouette: "utility head"
  },
  {
    id: "armor",
    label: "Armor",
    assetSlot: "armor.guard",
    focus: "memory",
    subtypes: ["Buckler", "Mask", "Gauntlet", "Pauldron", "Ward Plate"],
    silhouette: "defense shell"
  },
  {
    id: "instrument",
    label: "Instruments",
    assetSlot: "artifact.sound",
    focus: "music",
    subtypes: ["Bell Lyre", "War Drum", "Signal Horn", "Tuning Rod", "Echo Harp"],
    silhouette: "sound frame"
  },
  {
    id: "relic",
    label: "Relics",
    assetSlot: "artifact.relic",
    focus: "creativity",
    subtypes: ["Sigil Core", "Forge Lantern", "Rune Key", "Star Crucible", "Oath Totem"],
    silhouette: "mythic focus"
  }
];

export const materialOptions: PartOption[] = [
  { id: "meteoric-iron", label: "Meteoric Bloom Iron", tags: ["celestial", "carbon", "edge"], accent: "#a8b7c6" },
  { id: "verdant-copper", label: "Verdigris Living Copper", tags: ["conductive", "patina", "resonance"], accent: "#48b88f" },
  { id: "glass-steel", label: "Silica Glass Steel", tags: ["precise", "silica", "finesse"], accent: "#9dd6e2" },
  { id: "basalt-bronze", label: "Tin-Bronze Basalt", tags: ["alloy", "earth", "guard"], accent: "#b16e3a" },
  { id: "moon-silver", label: "Sterling Moon Silver", tags: ["clean", "tempered", "rune"], accent: "#d9deef" }
];

export const edgeOptions: PartOption[] = [
  { id: "crescent", label: "Crescent", tags: ["arc", "speed"] },
  { id: "split", label: "Split", tags: ["dual", "risk"] },
  { id: "hooked", label: "Hooked", tags: ["control", "guard"] },
  { id: "needle", label: "Needle", tags: ["precise", "finesse"] },
  { id: "broad", label: "Broad", tags: ["heavy", "force"] }
];

export const handleOptions: PartOption[] = [
  { id: "braided-leather", label: "Braided Leather", tags: ["grip", "warm"] },
  { id: "oiled-ash", label: "Oiled Ash", tags: ["balance", "natural"] },
  { id: "obsidian-wrap", label: "Obsidian Wrap", tags: ["sharp", "dark"] },
  { id: "wire-bound", label: "Wire Bound", tags: ["precise", "conductive"] },
  { id: "bone-inlay", label: "Bone Inlay", tags: ["ritual", "rare"] }
];

export const elementOptions: PartOption[] = [
  { id: "ember", label: "Ember", tags: ["heat", "force"], accent: "#ff7a2a" },
  { id: "tide", label: "Current", tags: ["flow", "balance"], accent: "#35b6c9" },
  { id: "storm", label: "Storm", tags: ["speed", "conductive"], accent: "#d7d568" },
  { id: "root", label: "Root", tags: ["guard", "living"], accent: "#69a861" },
  { id: "void", label: "Void", tags: ["quiet", "rune"], accent: "#9773d8" }
];

export const runeOptions: PartOption[] = [
  { id: "pulse", label: "Pulse", tags: ["rhythm", "speed"] },
  { id: "ratio", label: "Ratio", tags: ["math", "balance"] },
  { id: "mirror", label: "Mirror", tags: ["spatial", "guard"] },
  { id: "spark", label: "Spark", tags: ["reaction", "heat"] },
  { id: "voice", label: "Voice", tags: ["music", "resonance"] }
];

export const finishOptions: PartOption[] = [
  { id: "brushed", label: "Brushed", tags: ["clean", "craft"] },
  { id: "etched", label: "Etched", tags: ["rune", "detailed"] },
  { id: "charred", label: "Charred", tags: ["heat", "dark"] },
  { id: "polished", label: "Polished", tags: ["bright", "precise"] },
  { id: "patina", label: "Patina", tags: ["aged", "story"] }
];

export const motifOptions: PartOption[] = [
  { id: "duelist", label: "Duelist", tags: ["speed", "precise"] },
  { id: "warden", label: "Warden", tags: ["guard", "balance"] },
  { id: "chorus", label: "Chorus", tags: ["music", "resonance"] },
  { id: "navigator", label: "Navigator", tags: ["math", "celestial"] },
  { id: "wildsmith", label: "Wildsmith", tags: ["living", "story"] }
];

export const imaginationOptions = {
  origins: [
    { id: "triangle-reef", label: "Triangle Reef", tags: ["mystery", "reef", "vanishing"] },
    { id: "saltglass-cenote", label: "Saltglass Cenote", tags: ["water", "bright", "depth"] },
    { id: "widow-lighthouse", label: "Widow Lighthouse", tags: ["signal", "fog", "memory"] },
    { id: "crownless-atoll", label: "Crownless Atoll", tags: ["lost", "royal", "island"] },
    { id: "driftwood-observatory", label: "Driftwood Observatory", tags: ["celestial", "map", "old"] }
  ],
  mysteries: [
    { id: "missing-compass", label: "Missing Compass", tags: ["navigation", "lost", "math"] },
    { id: "whisper-tide", label: "Whisper Current", tags: ["music", "memory", "water"] },
    { id: "floating-bell", label: "Floating Bell", tags: ["sound", "warning", "rhythm"] },
    { id: "submerged-door", label: "Submerged Door", tags: ["spatial", "secret", "depth"] },
    { id: "starless-map", label: "Starless Map", tags: ["void", "celestial", "puzzle"] }
  ],
  purposes: [
    { id: "guide-lost-ships", label: "Guide Lost Ships", tags: ["guard", "signal", "compassion"] },
    { id: "seal-sea-rift", label: "Seal a Sea Rift", tags: ["force", "void", "ward"] },
    { id: "calm-storm-forge", label: "Calm Storm Forge", tags: ["balance", "storm", "craft"] },
    { id: "mark-honest-trade", label: "Mark Honest Trade", tags: ["trade", "token", "story"] },
    { id: "remember-forgotten-crew", label: "Remember Forgotten Crew", tags: ["memory", "oath", "relic"] }
  ],
  flaws: [
    { id: "hums-near-danger", label: "Hums Near Danger", tags: ["warning", "sound", "risk"] },
    { id: "dims-when-lied-to", label: "Dims When Lied To", tags: ["truth", "light", "social"] },
    { id: "burns-impatient-hands", label: "Burns Impatient Hands", tags: ["reaction", "heat", "restraint"] },
    { id: "heavy-in-fog", label: "Heavy in Fog", tags: ["fog", "weight", "mystery"] },
    { id: "demands-true-name", label: "Demands a True Name", tags: ["identity", "oath", "rare"] }
  ],
  sensory: [
    { id: "ozone-rain", label: "Ozone and Rain", tags: ["storm", "fresh", "air"] },
    { id: "cold-brass-tone", label: "Cold Brass Tone", tags: ["music", "metal", "quiet"] },
    { id: "coral-afterglow", label: "Coral Afterglow", tags: ["reef", "color", "living"] },
    { id: "salt-smoke-trail", label: "Salt Smoke Trail", tags: ["fog", "heat", "trail"] },
    { id: "moonlit-chime", label: "Moonlit Chime", tags: ["moon", "sound", "celestial"] }
  ]
};

export const skillLessons: SkillLesson[] = [
  {
    id: "reaction",
    title: "Strike Timing",
    realWorldSkill: "Reaction speed and hand-eye coordination",
    gameVerb: "Tap the hammer when heat and motion line up.",
    tiers: ["Hit broad heat zones", "Read faster marker motion", "Chain narrow perfect strikes"]
  },
  {
    id: "memory",
    title: "Pattern Recall",
    realWorldSkill: "Working memory and ordered recall",
    gameVerb: "Repeat longer forge sequences without rushing.",
    tiers: ["Recall three beats", "Track mixed forge cues", "Hold longer patterns under time pressure"]
  },
  {
    id: "speed",
    title: "Speed Control",
    realWorldSkill: "Speed training without sacrificing accuracy",
    gameVerb: "Complete fast strikes only when the timing window is right.",
    tiers: ["Move quickly on wide windows", "Cut hesitation on tighter windows", "Maintain accuracy while the pace rises"]
  },
  {
    id: "math",
    title: "Alloy Ratios",
    realWorldSkill: "Mental math, estimation, and proportional reasoning",
    gameVerb: "Balance ore ratios before the alloy destabilizes.",
    tiers: ["Read simple fractions", "Adjust mixed proportions", "Solve pressure ratios while heat shifts"]
  },
  {
    id: "rhythm",
    title: "Anvil Cadence",
    realWorldSkill: "Rhythmic precision, tempo control, and auditory sequencing",
    gameVerb: "Strike the anvil on beat to keep the forge cadence alive.",
    tiers: ["Follow a steady pulse", "Handle syncopated accents", "Maintain tempo through changing patterns"]
  },
  {
    id: "music",
    title: "Rune Rhythm",
    realWorldSkill: "Music timing, beat matching, and tempo memory",
    gameVerb: "Echo an anvil rhythm to tune the item's resonance.",
    tiers: ["Echo short beats", "Track mixed accents", "Compose longer rune phrases"]
  },
  {
    id: "spatial",
    title: "Form Geometry",
    realWorldSkill: "Spatial reasoning, symmetry, and mental rotation",
    gameVerb: "Align silhouettes, sockets, and counterweights into a readable item.",
    tiers: ["Match simple forms", "Mirror asymmetric shapes", "Rotate complex silhouettes under pressure"]
  },
  {
    id: "creativity",
    title: "Creative Synthesis",
    realWorldSkill: "Creative constraints, critique, and design intent",
    gameVerb: "Combine materials, motifs, notes, and challenge tags into a coherent item.",
    tiers: ["Use varied parts", "Fit the brief", "Make a distinctive export-ready identity"]
  }
];

export const skillPathOrder: SkillId[] = ["reaction", "memory", "speed", "math", "rhythm", "music", "spatial", "creativity"];

const pathUpgradeVerbs = [
  "Calibrate",
  "Temper",
  "Etch",
  "Balance",
  "Sharpen",
  "Thread",
  "Ignite",
  "Mirror",
  "Bind",
  "Crown"
];

export const skillPathDefinitions: Record<SkillId, SkillPathDefinition> = {
  reaction: {
    id: "reaction",
    constellation: "Hephaestus' Hammer",
    accent: "#ff9f43",
    anchor: "A star chain of heat cues, hammer arcs, and split-second impact reads.",
    thesis: "Trains the player to wait for the right moment, then commit cleanly.",
    upgradeSubjects: [
      "heat glints",
      "hammer shadows",
      "spark windows",
      "edge flashes",
      "impact rings",
      "bellows bursts",
      "quench flickers",
      "counterstrike cues",
      "master timing",
      "mythic reflex"
    ],
    practices: [
      "tap only when the item highlight crosses the sweet spot",
      "ignore false sparks before the clean strike",
      "read movement direction before committing",
      "chain two accurate hits without rushing",
      "recover after a missed tap without panic",
      "strike after a delayed audio cue",
      "separate hot-metal glow from target glow",
      "hold focus through shrinking timing windows",
      "finish a sequence with no early inputs",
      "turn reaction speed into controlled patience"
    ],
    mentors: ["Hephaestus", "Wayland Smith", "Daedalus", "Miyamoto Musashi", "Bruce Lee", "Martha Coston", "Katherine Johnson", "Ada Lovelace", "Alan Turing", "Nikola Tesla"]
  },
  memory: {
    id: "memory",
    constellation: "Mnemosyne's Chain",
    accent: "#75d6ff",
    anchor: "A linked memory chain for repeatable forge orders and longer recall spans.",
    thesis: "Builds working memory by turning forge sequences into structured patterns.",
    upgradeSubjects: [
      "three-beat orders",
      "ore-call glyphs",
      "tool sequences",
      "cooling chants",
      "pattern anchors",
      "dual cue stacks",
      "memory knots",
      "delayed recall",
      "pressure loops",
      "legendary sequence"
    ],
    practices: [
      "repeat a short order after the cue disappears",
      "group symbols into memorable chunks",
      "separate color cues from shape cues",
      "recall tool order after a brief distraction",
      "replay a sequence backward",
      "hold two parallel forge instructions",
      "use rhythm as a memory scaffold",
      "recover a missed cue from context",
      "extend recall length without adding speed",
      "turn a long pattern into a named ritual"
    ],
    mentors: ["Mnemosyne", "Brigid", "Ptah", "Hypatia", "Ibn Sina", "Mary Somerville", "Ada Lovelace", "Alan Turing", "Katherine Johnson", "Srinivasa Ramanujan"]
  },
  speed: {
    id: "speed",
    constellation: "Wayland's Bellows",
    accent: "#73bd6f",
    anchor: "A fast-moving line of bellows, tongs, and cooldown decisions.",
    thesis: "Rewards quick execution only when the player keeps accuracy intact.",
    upgradeSubjects: [
      "fast grip swaps",
      "bellows rhythm",
      "tongs routing",
      "cooldown lanes",
      "rapid sorting",
      "ore transfer",
      "strike pacing",
      "heat recovery",
      "precision sprint",
      "master flow"
    ],
    practices: [
      "complete actions under a short timer",
      "move quickly without double tapping",
      "choose the correct forge station fast",
      "route parts in the fewest inputs",
      "maintain accuracy while the pace climbs",
      "stop instantly when the heat changes",
      "reduce hesitation between clear cues",
      "avoid wasteful taps during cooldown",
      "finish fast with a clean final input",
      "turn speed into efficient craft flow"
    ],
    mentors: ["Wayland Smith", "Goibniu", "Ilmarinen", "Hermes", "Archimedes", "Benjamin Franklin", "Nikola Tesla", "Grace Hopper", "Hedy Lamarr", "Steve Wozniak"]
  },
  math: {
    id: "math",
    constellation: "Archimedes' Crucible",
    accent: "#ffc066",
    anchor: "A proportional alloy map of ratios, weights, and stable temperatures.",
    thesis: "Makes math useful by tying estimates and fractions directly to better alloys.",
    upgradeSubjects: [
      "ore fractions",
      "mass balance",
      "heat deltas",
      "ratio locks",
      "alloy curves",
      "probability seals",
      "geometry weights",
      "efficiency sums",
      "optimization marks",
      "master equation"
    ],
    practices: [
      "estimate the closest whole-number ratio",
      "balance two metals against a target",
      "adjust a percentage before heat decays",
      "compare expected value without gambling pressure",
      "solve a missing component from the total",
      "trade small precision loss for stable output",
      "spot when a recipe is over-weighted",
      "use symmetry to simplify a calculation",
      "optimize a recipe under resource limits",
      "make the math explain the final item"
    ],
    mentors: ["Archimedes", "Hypatia", "Aryabhata", "Al-Khwarizmi", "Omar Khayyam", "Srinivasa Ramanujan", "Emmy Noether", "Katherine Johnson", "Maryam Mirzakhani", "Alan Turing"]
  },
  rhythm: {
    id: "rhythm",
    constellation: "Goibniu's Anvil",
    accent: "#f47cc4",
    anchor: "A cadence map for pulse, syncopation, and forge timing under motion.",
    thesis: "Turns timing into embodied rhythm instead of random button pressing.",
    upgradeSubjects: [
      "steady pulse",
      "accent marks",
      "anvil rests",
      "syncopated hits",
      "tempo ladders",
      "call-response",
      "triplet sparks",
      "offbeat recovery",
      "polyrhythm rings",
      "master cadence"
    ],
    practices: [
      "tap a steady beat without visual help",
      "hit only accented forge marks",
      "leave intentional rests between strikes",
      "recover when a beat shifts early",
      "match tempo changes over eight beats",
      "answer an anvil phrase with the same rhythm",
      "separate main beat from background pulse",
      "repair an offbeat mistake on the next measure",
      "track two simple rhythms at once",
      "make the item sound like its function"
    ],
    mentors: ["Goibniu", "Orpheus", "Tubal-Cain", "Jubal", "Hildegard of Bingen", "J.S. Bach", "Ludwig van Beethoven", "Florence Price", "Duke Ellington", "Nina Simone"]
  },
  music: {
    id: "music",
    constellation: "Orpheus' Resonator",
    accent: "#a980f1",
    anchor: "A resonant star score for melody memory, tuning, and phrase building.",
    thesis: "Teaches musical structure by making crafted items sing with intent.",
    upgradeSubjects: [
      "tone matching",
      "interval sparks",
      "chord sockets",
      "resonance bends",
      "motif echoes",
      "harmonic seals",
      "phrase crafting",
      "countermelodies",
      "orchestral identity",
      "master resonance"
    ],
    practices: [
      "match a pitch contour by ear",
      "recognize whether the next tone rises or falls",
      "place rune notes into a stable chord",
      "bend a sound without losing the center",
      "repeat a short musical motif",
      "choose harmony that fits the item's role",
      "compose a phrase with a clear beginning and end",
      "hold a second melody against the first",
      "make sound feedback distinct from UI feedback",
      "turn music into a recognizable item signature"
    ],
    mentors: ["Orpheus", "Saraswati", "Pythagoras", "Hildegard of Bingen", "J.S. Bach", "Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Clara Schumann", "Florence Price", "Ryuichi Sakamoto"]
  },
  spatial: {
    id: "spatial",
    constellation: "Daedalus' Frame",
    accent: "#38bdb0",
    anchor: "A geometry constellation for silhouettes, rotations, sockets, and balance.",
    thesis: "Builds spatial reasoning by making form and function visible in the forge.",
    upgradeSubjects: [
      "mirror planes",
      "socket spacing",
      "silhouette reads",
      "rotation locks",
      "counterweight arcs",
      "negative space",
      "tessellated plates",
      "depth ordering",
      "blueprint memory",
      "master geometry"
    ],
    practices: [
      "mirror a shape without flipping the wrong axis",
      "place sockets at equal visual distances",
      "read an item from its outline alone",
      "rotate a part mentally before placing it",
      "balance weight across a central grip",
      "leave readable negative space around details",
      "fit repeated plates without overlap",
      "stack foreground and background marks clearly",
      "remember a blueprint after it fades",
      "make the silhouette understandable across games"
    ],
    mentors: ["Daedalus", "Ptah", "Ilmarinen", "Euclid", "Leonardo da Vinci", "M.C. Escher", "Buckminster Fuller", "Zaha Hadid", "Katherine Johnson", "Maryam Mirzakhani"]
  },
  creativity: {
    id: "creativity",
    constellation: "Ilmarinen's Skyforge",
    accent: "#ff7a2a",
    anchor: "A branching design constellation for critique, originality, and export identity.",
    thesis: "Rewards expressive choices that still fit the craft brief and skill challenge.",
    upgradeSubjects: [
      "material contrast",
      "motif intent",
      "lore hooks",
      "function signals",
      "visual hierarchy",
      "constraint play",
      "signature marks",
      "cross-game identity",
      "critique loops",
      "masterwork voice"
    ],
    practices: [
      "combine two unlike materials with a clear reason",
      "choose a motif that supports the item role",
      "write a short lore hook that affects design",
      "make the item function obvious at a glance",
      "rank details so the eye knows where to look",
      "turn a strict commission into an interesting choice",
      "add a recognizable maker's mark",
      "preserve identity when exported as an asset",
      "revise one weak choice after critique",
      "make the final weapon feel authored, not random"
    ],
    mentors: ["Ilmarinen", "Svarog", "Kaveh", "Brigid", "Leonardo da Vinci", "Michelangelo", "Ada Lovelace", "Isamu Noguchi", "Ray Eames", "Steve Jobs"]
  }
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function generateSkillPathNodes(skill: SkillId): SkillPathNode[] {
  const definition = skillPathDefinitions[skill];
  const skillOffset = Math.max(0, skillPathOrder.indexOf(skill));

  return Array.from({ length: 100 }, (_, index) => {
    const row = Math.floor(index / 10);
    const column = index % 10;
    const xWave = Math.sin((index + skillOffset * 13) * 0.94) * 4.1;
    const yWave = Math.cos((index + skillOffset * 7) * 0.71) * 1.9;
    const x = clamp(7 + column * 9.55 + (row % 2 === 0 ? 0 : 4.2) + xWave, 4, 96);
    const y = clamp(5 + row * 10.05 + yWave, 4, 97);
    const subject = definition.upgradeSubjects[row];
    const verb = pathUpgradeVerbs[column];
    const mentor = definition.mentors[(index + row) % definition.mentors.length];
    const practice = definition.practices[(column + row * 2) % definition.practices.length];
    const links = [
      index > 0 ? index - 1 : -1,
      index >= 10 && column % 3 === 1 ? index - 10 : -1,
      index >= 11 && column % 4 === 0 ? index - 11 : -1
    ].filter((link) => link >= 0);
    const nodeType: SkillPathNode["nodeType"] =
      index === 99 ? "legend" : (index + 1) % 25 === 0 ? "mastery" : column === 0 ? "spark" : column === 5 ? "process" : "technique";

    return {
      id: `${skill}-${String(index + 1).padStart(3, "0")}`,
      skill,
      index,
      title: `${verb} ${subject}`,
      upgrade: `${verb} ${subject} through ${mentor}'s reference.`,
      practice,
      mentor,
      tier: row + 1,
      nodeType,
      x,
      y,
      links
    };
  });
}

export const processOptions: ForgeProcess[] = [
  {
    id: "smelt",
    label: "Smelting",
    realWorldSkill: "Memory for safe process order",
    forgeAction: "Clean ore into a stable base",
    importTag: "process.smelted"
  },
  {
    id: "alloy",
    label: "Alloying",
    realWorldSkill: "Speed and accuracy under light pressure",
    forgeAction: "Blend metals into a useful profile",
    importTag: "process.alloyed"
  },
  {
    id: "shape",
    label: "Shaping",
    realWorldSkill: "Reaction timing and controlled force",
    forgeAction: "Hammer the silhouette into form",
    importTag: "process.shaped"
  },
  {
    id: "quench",
    label: "Quenching",
    realWorldSkill: "Pattern memory and cause-effect reasoning",
    forgeAction: "Lock the structure with heat control",
    importTag: "process.quenched"
  },
  {
    id: "engrave",
    label: "Engraving",
    realWorldSkill: "Fine motor speed and visual composition",
    forgeAction: "Cut readable marks and sockets",
    importTag: "process.engraved"
  },
  {
    id: "attune",
    label: "Attunement",
    realWorldSkill: "Music pattern, rhythm, and creative critique",
    forgeAction: "Tune the item into a portable asset",
    importTag: "process.attuned"
  }
];

const titles = [
  "Fogbound Edge",
  "Reef Bellows",
  "Triangle Core",
  "Mirror Shoal",
  "Pulse Lantern",
  "Cinder Compass",
  "Reefplate",
  "Storm Wreck"
];

const prompts = [
  "Forge for speed without losing control as the fog rolls in.",
  "Practice recall before the reef lights vanish.",
  "Keep the tempo steady and listen for the reef bell.",
  "Move fast only after the lighthouse cue is clear.",
  "Make the relic readable through storm rain and distance.",
  "Use a balanced recipe with a clear island purpose.",
  "Favor unusual parts that still fit the castaway commission.",
  "Build an item that feels portable across games and seas.",
  "Let the real-world lesson shape the final silhouette.",
  "Push the craft tier, then name the island rumor behind it.",
  "Design around one strong material contrast from shore and deep water."
];

const routeLabels = [
  "Reef Sweep",
  "Wreck Dive",
  "Lantern Walk",
  "Storm Net",
  "Cenote Descent",
  "Atoll Salvage",
  "Observatory Run",
  "Black-Sail Search"
];

const rewards = ["bog iron bloom", "borax starflux", "crucible moonsteel", "leviathan quench oil", "philosopher temper salt"];

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function seededIndex(seed: string, modulo: number) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % modulo;
}

export function generateHourlyContracts(date = new Date()): HourlyContract[] {
  const dayKey = getDateKey(date);
  return routeLabels.map((routeLabel, hour) => {
    const processIndex = Math.floor(hour / 2);
    const process = processOptions[processIndex % processOptions.length];
    const category = categoryOptions[seededIndex(`${dayKey}-${hour}-cat`, categoryOptions.length)];
    const skillPool: SkillId[] = [category.focus, "reaction", "memory", "speed", "math", "rhythm", "music", "spatial", "creativity"];
    const skill = skillPool[seededIndex(`${dayKey}-${hour}-skill`, skillPool.length)];
    const material = materialOptions[seededIndex(`${dayKey}-${hour}-material`, materialOptions.length)];
    const element = elementOptions[seededIndex(`${dayKey}-${hour}-element`, elementOptions.length)];
    const processImpact = hour !== 0 && hour % 4 === 0 ? "significant" : "standard";
    const difficulty = Math.min(5, 1 + processIndex + (processImpact === "significant" ? 1 : 0));
    const processEvent = hour % 2 !== 0 ? "practice" : processIndex === 0 ? "added" : "improved";
    return {
      hour,
      label: routeLabel,
      category: category.id,
      skill,
      difficulty,
      process,
      processLevel: processIndex + 1,
      processEvent,
      processImpact,
      title: `${titles[seededIndex(`${dayKey}-${hour}-title`, titles.length)]} ${category.label.slice(0, -1)}`,
      prompt:
        hour % 2 === 0
          ? `${processImpact === "significant" ? "High-yield " : ""}${process.label} ${processEvent}. ${process.forgeAction}.`
          : prompts[seededIndex(`${dayKey}-${hour}-prompt`, prompts.length)],
      targetTags: [...material.tags.slice(0, 2), ...element.tags.slice(0, 2), category.silhouette, process.importTag],
      reward: rewards[seededIndex(`${dayKey}-${hour}-reward`, rewards.length)]
    };
  });
}

export function findOption<T extends { id: string }>(options: T[], id: string): T {
  return options.find((option) => option.id === id) ?? options[0];
}

export function findCategory(id: string): CategoryOption {
  return categoryOptions.find((category) => category.id === id) ?? categoryOptions[0];
}
