import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForgeAudio } from "./audio";
import { ForgeTrial } from "./components/ForgeTrial";
import { Icon } from "./components/Icons";
import { WeaponPreview } from "./components/WeaponPreview";
import {
  edgeOptions,
  elementOptions,
  findCategory,
  finishOptions,
  formatDateLabel,
  generateSkillPathNodes,
  generateHourlyContracts,
  getDateKey,
  handleOptions,
  imaginationOptions,
  materialOptions,
  motifOptions,
  processOptions,
  runeOptions,
  skillLessons,
  skillPathDefinitions
} from "./gameData";
import {
  createCraftedItem,
  createInitialDraft,
  downloadJson,
  getDraftImagination,
  getDraftTags,
  getImaginationLabel,
  getPartLabel,
  optionGroups,
  scoreCreativity,
  stableHash
} from "./gameLogic";
import type { CategoryId, CraftedItem, CreativityBreakdown, HourlyContract, ImaginationRecipe, ItemDraft, Rarity, SkillId } from "./types";

type Tab = "forge" | "path" | "workshop" | "collection" | "profile";

const storageKey = "hourforge.collection.v1";
const claimedGoalKey = "hourforge.claimed-goals.v1";
const favoritesKey = "hourforge.favorites.v1";
const listedTokenKey = "hourforge.listed-tokens.v1";
const activityLogKey = "hourforge.activity-log.v1";
const settingsKey = "hourforge.player-settings.v1";
const challengeSeedKey = "hourforge.challenge-seed.v1";
const supplyKey = "eldertide.supplies.v1";
const previewAccessKey = "eldertide.preview-access.v1";
const previewAccessPin = "963852";
const testerSupplies: SupplyInventory = {
  common: 999,
  uncommon: 999,
  rare: 999,
  epic: 999,
  legendary: 999
};

const tabs: Array<{ id: Tab; label: string; icon: "forge" | "path" | "workshop" | "collection" | "profile" }> = [
  { id: "forge", label: "Forge", icon: "forge" },
  { id: "path", label: "Path", icon: "path" },
  { id: "workshop", label: "Market", icon: "workshop" },
  { id: "collection", label: "Items", icon: "collection" },
  { id: "profile", label: "Isles", icon: "profile" }
];

const marketOffers = [
  {
    id: "practice-box",
    title: "Practice Box",
    price: "$1.99",
    detail: "Materials, runes, and cosmetics. Contents and odds are visible before opening.",
    guardrail: "Does not set trial score."
  },
  {
    id: "material-bundle",
    title: "Material Bundle",
    price: "$2.99",
    detail: "Choose a focused material pack when you are short on time.",
    guardrail: "Expands recipes, not final grade."
  },
  {
    id: "catch-up-kit",
    title: "Catch-Up Kit",
    price: "$4.99",
    detail: "A box plus enough materials to try the selected collection route.",
    guardrail: "Skill trial still gates Masterwork."
  }
];

const makerOaths = [
  "I bind this relic to guide the lost without owning their path.",
  "I name the storm, but I do not let it choose the wielder.",
  "I leave one flaw visible so the next game can tell its own story.",
  "I shape this asset for trade, memory, and honest skill.",
  "I mark the isle so the island remembers who crafted it."
];

type BonusGoal = {
  id: string;
  label: string;
  detail: string;
  reward: string;
  complete: boolean;
};

type LootReveal = {
  offerTitle: string;
  rewards: string[];
  supplyRewards?: SupplyReward[];
};

type SupplyTierId = "common" | "uncommon" | "rare" | "epic" | "legendary";

type SupplyInventory = Record<SupplyTierId, number>;

type SupplyReward = {
  tier: SupplyTierId;
  label: string;
  amount: number;
  lesson: string;
};

const supplyTiers: Array<{
  id: SupplyTierId;
  label: string;
  real: string;
  magic: string;
  lesson: string;
  accent: string;
  baseAmount: number;
}> = [
  {
    id: "common",
    label: "Bog Iron + Wyrmcoal",
    real: "Bog iron and charcoal",
    magic: "Wyrmcoal keeps the bloom awake",
    lesson: "Smelting removes oxygen from ore with heat and carbon.",
    accent: "#a8b7c6",
    baseAmount: 4
  },
  {
    id: "uncommon",
    label: "Borax Starflux",
    real: "Borax flux",
    magic: "Star ash lifts scale from the metal",
    lesson: "Flux helps oxides flow away during joining and forge welding.",
    accent: "#48b88f",
    baseAmount: 3
  },
  {
    id: "rare",
    label: "Crucible Moonsteel",
    real: "Crucible steel",
    magic: "Moonstone dust steadies the grain",
    lesson: "Carbon, heat, and cooling rate change hardness and structure.",
    accent: "#35b6c9",
    baseAmount: 2
  },
  {
    id: "epic",
    label: "Leviathan Quench Oil",
    real: "Quench oil",
    magic: "Sea-beast oil drinks heat evenly",
    lesson: "Quenching hardens metal, but uneven cooling can warp or crack it.",
    accent: "#a980f1",
    baseAmount: 1
  },
  {
    id: "legendary",
    label: "Philosopher Temper Salt",
    real: "Tempering salts",
    magic: "Alchemical salt trades rage for resilience",
    lesson: "Tempering reduces brittleness by reheating hardened steel carefully.",
    accent: "#ffbf66",
    baseAmount: 1
  }
];

const supplyTierOrder: SupplyTierId[] = ["common", "uncommon", "rare", "epic", "legendary"];

const defaultSupplies: SupplyInventory = {
  common: 3,
  uncommon: 1,
  rare: 0,
  epic: 0,
  legendary: 0
};

type TrialPace = "relaxed" | "standard" | "challenge";
type CraftingMode = "drop" | "advanced";
type DropBoosterId = "starflux-lens" | "flux-gauge" | "temper-seal";
type DropOdds = Record<Rarity, number>;
type DropEconomyStats = {
  expectedGross: number;
  harborFee: number;
  expectedNet: number;
  highValueOdds: number;
  listingSpeed: "standard" | "fast" | "hot";
};

type PlayerSettings = {
  haptics: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  focusMode: boolean;
  trialPace: TrialPace;
};

type IslandCondition = {
  id: "fog" | "reef" | "squall" | "moon" | "calm";
  label: string;
  risk: "Low" | "Medium" | "High";
  accent: string;
  cue: string;
  hint: string;
  reward: string;
};

type TideSignal = {
  phase: string;
  channel: string;
  timing: string;
  lesson: string;
  riskClass: string;
  heatSync: "cold" | "ready" | "hot";
};

const defaultSettings: PlayerSettings = {
  haptics: true,
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  focusMode: false,
  trialPace: "standard"
};

const rarityRank = {
  Masterwork: 5,
  Expert: 4,
  Skilled: 3,
  Steady: 2,
  Practice: 1
};

const rarityOrder: Rarity[] = ["Practice", "Steady", "Skilled", "Expert", "Masterwork"];

const baseDropOdds: DropOdds = {
  Practice: 42,
  Steady: 32,
  Skilled: 17,
  Expert: 7,
  Masterwork: 2
};

const dropBoosterOptions: Array<{
  id: DropBoosterId;
  label: string;
  source: string;
  detail: string;
  marketEffect: string;
  delta: Partial<DropOdds>;
}> = [
  {
    id: "starflux-lens",
    label: "Starflux Lens",
    source: "Practice Box",
    detail: "Moves common outcomes toward Skilled without touching trial score.",
    marketEffect: "Better mid-tier resale floor.",
    delta: { Practice: -8, Skilled: 6, Expert: 2 }
  },
  {
    id: "flux-gauge",
    label: "Flux Gauge",
    source: "Material Bundle",
    detail: "Improves Steady and Skilled rolls by reducing wasted forge scale.",
    marketEffect: "More reliable quick-list inventory.",
    delta: { Practice: -5, Steady: 2, Skilled: 3 }
  },
  {
    id: "temper-seal",
    label: "Temper Seal",
    source: "Catch-Up Kit",
    detail: "Adds a small Expert/Masterwork chance, still never guaranteeing either.",
    marketEffect: "Higher high-value listing chance.",
    delta: { Steady: -5, Expert: 4, Masterwork: 1 }
  }
];

const offerBoostMap: Record<string, DropBoosterId> = {
  "practice-box": "starflux-lens",
  "material-bundle": "flux-gauge",
  "catch-up-kit": "temper-seal"
};

const quickCrafter = {
  name: "Hephaestus",
  bench: "Hephaestus' Bench",
  title: "Divine island crafter",
  fee: "2.5% harbor fee after sale",
  promise: "Bring supplies and offerings. Hephaestus rolls the gear while you skip manual shaping."
};

const advancedControlMilestones = [
  { node: 1, label: "category choice" },
  { node: 10, label: "material targeting" },
  { node: 25, label: "rune and motif shaping" },
  { node: 50, label: "stat tuning" },
  { node: 75, label: "lore imprint control" },
  { node: 100, label: "masterwork identity lock" }
];

function isTesterMode() {
  const params = new URLSearchParams(window.location.search);
  return import.meta.env.MODE === "tester" || params.get("tester") === "1";
}

function loadPreviewAccess() {
  return window.localStorage.getItem(previewAccessKey) === "unlocked";
}

function loadSavedCollection() {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as CraftedItem[];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

function loadStringArray(key: string) {
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

function loadPlayerSettings(): PlayerSettings {
  const saved = window.localStorage.getItem(settingsKey);
  if (!saved) return defaultSettings;
  try {
    return { ...defaultSettings, ...(JSON.parse(saved) as Partial<PlayerSettings>) };
  } catch {
    window.localStorage.removeItem(settingsKey);
    return defaultSettings;
  }
}

function loadSupplyInventory(): SupplyInventory {
  const saved = window.localStorage.getItem(supplyKey);
  if (!saved) return defaultSupplies;
  try {
    return { ...defaultSupplies, ...(JSON.parse(saved) as Partial<SupplyInventory>) };
  } catch {
    window.localStorage.removeItem(supplyKey);
    return defaultSupplies;
  }
}

function createChallengeSeed(dayKey: string, hour: number, nonce = 0) {
  return `EIS-${dayKey.replace(/-/g, "")}-R${String(hour + 1).padStart(2, "0")}-${stableHash(`${dayKey}-${hour}-${nonce}`).slice(0, 6)}`;
}

const islandConditions: IslandCondition[] = [
  {
    id: "fog",
    label: "Fogbank Drift",
    risk: "Medium",
    accent: "#75d6ff",
    cue: "Lighthouse signals fade in pairs.",
    hint: "Use memory and shape cues; do not trust color alone.",
    reward: "fogglass chart"
  },
  {
    id: "reef",
    label: "Reefglow Shoal",
    risk: "Low",
    accent: "#38bdb0",
    cue: "Coral light reveals clean timing windows.",
    hint: "Tap when the glow crosses the relic, then hold rhythm.",
    reward: "reef prism"
  },
  {
    id: "squall",
    label: "Black-Sail Squall",
    risk: "High",
    accent: "#a980f1",
    cue: "Wind surges make false sparks look tempting.",
    hint: "Wait for the called part; speed without control loses grade.",
    reward: "storm sail"
  },
  {
    id: "moon",
    label: "Moon Gate",
    risk: "Medium",
    accent: "#d9deef",
    cue: "Silver surf lines mark stable ratios.",
    hint: "Balance math and spatial placement before committing.",
    reward: "moon shell"
  },
  {
    id: "calm",
    label: "Glasswater Calm",
    risk: "Low",
    accent: "#73bd6f",
    cue: "Still water makes design intent easier to read.",
    hint: "Use the calm route to refine lore, finish, and motif.",
    reward: "calm bead"
  }
];

function getIslandCondition(dayKey: string, hour: number) {
  const hash = parseInt(stableHash(`${dayKey}-isle-${hour}`).slice(0, 6), 36);
  return islandConditions[hash % islandConditions.length];
}

function getTideSignal(contract: HourlyContract, islandCondition: IslandCondition, forgeHeat: number): TideSignal {
  const timingBySkill: Record<SkillId, Pick<TideSignal, "channel" | "timing" | "lesson">> = {
    reaction: {
      channel: "lighthouse flash",
      timing: "tap on bright crest",
      lesson: "Reaction speed improves when the cue is specific and repeated."
    },
    speed: {
      channel: "reef spark",
      timing: "short strike chain",
      lesson: "Speed training rewards fast decisions without abandoning control."
    },
    memory: {
      channel: "fog echo",
      timing: "remember paired marks",
      lesson: "Memory improves when color is backed by shape and order."
    },
    math: {
      channel: "moon ratio",
      timing: "balance the alloy",
      lesson: "Math practice turns percentages into material tradeoffs."
    },
    rhythm: {
      channel: "anvil song",
      timing: "keep steady tempo",
      lesson: "Rhythm training builds timing prediction and consistency."
    },
    music: {
      channel: "rune chord",
      timing: "echo the motif",
      lesson: "Music practice links pattern, timing, and listening."
    },
    spatial: {
      channel: "tide map",
      timing: "match the silhouette",
      lesson: "Spatial reasoning compares shape, position, and balance."
    },
    creativity: {
      channel: "maker mark",
      timing: "commit the intent",
      lesson: "Creative practice rewards coherent choices, not random parts."
    }
  };
  const phases = ["ebbing gate", "reef rise", "lantern slack", "moon pull", "fog return"];
  const phase = phases[(contract.hour + contract.difficulty + islandConditions.indexOf(islandCondition)) % phases.length];
  const heatSync = forgeHeat < getHeatTarget(contract) - getHeatBand(contract) ? "cold" : forgeHeat > getHeatTarget(contract) + getHeatBand(contract) ? "hot" : "ready";

  return {
    phase,
    riskClass: islandCondition.risk.toLowerCase(),
    heatSync,
    ...timingBySkill[contract.skill]
  };
}

function getHeatTarget(contract: HourlyContract) {
  return Math.min(86, 48 + contract.difficulty * 7 + (contract.processImpact === "significant" ? 5 : 0));
}

function getHeatBand(contract: HourlyContract) {
  return Math.max(8, 20 - contract.difficulty * 2);
}

function getHeatBonus(contract: HourlyContract, heat: number) {
  const target = getHeatTarget(contract);
  const error = Math.abs(heat - target);
  if (error <= getHeatBand(contract) / 2) return 8;
  if (error <= getHeatBand(contract)) return 4;
  if (error <= getHeatBand(contract) + 10) return 0;
  return -6;
}

function heatLabel(contract: HourlyContract, heat: number) {
  const bonus = getHeatBonus(contract, heat);
  if (bonus >= 8) return "tempered";
  if (bonus > 0) return "stable";
  if (bonus === 0) return "rough";
  return "overworked";
}

function countTargetHits(draft: ItemDraft, contract: HourlyContract) {
  const tags = Array.from(new Set([...getDraftTags(draft), contract.process.importTag]));
  return contract.targetTags.filter((tag) => tags.some((draftTag) => draftTag.includes(tag) || tag.includes(draftTag))).length;
}

function buildBonusGoals(
  draft: ItemDraft,
  contract: HourlyContract,
  creativity: number,
  lastTrialScore: number,
  forgeHeat: number,
  islandCondition: IslandCondition
): BonusGoal[] {
  const hitCount = countTargetHits(draft, contract);
  const heatReady = getHeatBonus(contract, forgeHeat) >= 4;
  return [
    {
      id: `${contract.hour}-brief`,
      label: "Match the brief",
      detail: `${hitCount}/${Math.min(3, contract.targetTags.length)} target tags aligned`,
      reward: contract.reward,
      complete: hitCount >= Math.min(3, contract.targetTags.length)
    },
    {
      id: `${contract.hour}-intent`,
      label: "Write the intent",
      detail: `${draft.notes.trim().length}/48 design notes`,
      reward: "story seal",
      complete: draft.notes.trim().length >= 48
    },
    {
      id: `${contract.hour}-mastery`,
      label: "Temper the trial",
      detail: lastTrialScore > 0 ? `${lastTrialScore} trial / ${creativity} creativity` : `${heatLabel(contract, forgeHeat)} heat ready`,
      reward: "focus spark",
      complete: heatReady && (lastTrialScore >= 70 || creativity >= 70)
    },
    {
      id: `${contract.hour}-${islandCondition.id}-cache`,
      label: "Chart the cache",
      detail: `${islandCondition.label} risk ${islandCondition.risk.toLowerCase()}`,
      reward: islandCondition.reward,
      complete: heatReady && hitCount >= 2
    }
  ];
}

function pickOption<T>(options: T[]) {
  return options[Math.floor(Math.random() * options.length)];
}

function bestOption(options: typeof materialOptions, targetTags: string[]) {
  return options.reduce((best, option) => {
    const score = option.tags.filter((tag) => targetTags.some((target) => target.includes(tag) || tag.includes(target))).length;
    const bestScore = best.tags.filter((tag) => targetTags.some((target) => target.includes(tag) || tag.includes(target))).length;
    return score > bestScore ? option : best;
  }, options[0]);
}

function generateLootRewards(offerId: string) {
  const material = pickOption(materialOptions);
  const rune = pickOption(runeOptions);
  const motif = pickOption(motifOptions);
  const finish = pickOption(finishOptions);
  if (offerId === "material-bundle") {
    return [`Material: ${material.label}`, `Material: ${pickOption(materialOptions).label}`, `Finish: ${finish.label}`];
  }
  if (offerId === "catch-up-kit") {
    return [`Current process token`, `Material: ${material.label}`, `Rune: ${rune.label}`];
  }
  return [`Rune: ${rune.label}`, `Motif: ${motif.label}`, `Cosmetic finish: ${finish.label}`];
}

function getRequiredSupplyTier(contract: HourlyContract): SupplyTierId {
  return supplyTierOrder[Math.min(supplyTierOrder.length - 1, contract.difficulty - 1)];
}

function getSupplyTier(tier: SupplyTierId) {
  return supplyTiers.find((item) => item.id === tier) ?? supplyTiers[0];
}

function makeSupplyReward(tier: SupplyTierId, amount: number): SupplyReward {
  const supply = getSupplyTier(tier);
  return {
    tier,
    label: supply.label,
    amount,
    lesson: supply.lesson
  };
}

function getTotalSupplies(supplies: SupplyInventory) {
  return supplyTierOrder.reduce((total, tier) => total + supplies[tier], 0);
}

function getCraftedRouteCount(collection: CraftedItem[], dayKey: string) {
  return new Set(collection.filter((item) => item.dayKey === dayKey).map((item) => item.hour)).size;
}

function pickCollectedTier(difficulty: number): SupplyTierId {
  const roll = Math.random() * 100;
  const legendaryChance = 1 + difficulty * 0.9;
  const epicChance = legendaryChance + 4 + difficulty * 1.6;
  const rareChance = epicChance + 10 + difficulty * 2.4;
  const uncommonChance = rareChance + 26;
  if (roll < legendaryChance) return "legendary";
  if (roll < epicChance) return "epic";
  if (roll < rareChance) return "rare";
  if (roll < uncommonChance) return "uncommon";
  return "common";
}

function rollSupplyRewards(contract: HourlyContract): SupplyReward[] {
  const guaranteedTier = getRequiredSupplyTier(contract);
  const rewards: SupplyReward[] = [
    makeSupplyReward("common", getSupplyTier("common").baseAmount + contract.difficulty),
    makeSupplyReward(guaranteedTier, getSupplyTier(guaranteedTier).baseAmount)
  ];

  for (let roll = 0; roll < 2; roll += 1) {
    const tier = pickCollectedTier(contract.difficulty);
    rewards.push(makeSupplyReward(tier, getSupplyTier(tier).baseAmount));
  }

  return rewards;
}

function purchaseSupplyRewards(offerId: string): SupplyReward[] {
  if (offerId === "material-bundle") {
    return [
      makeSupplyReward("common", 8),
      makeSupplyReward("uncommon", 5),
      makeSupplyReward("rare", 2)
    ];
  }
  if (offerId === "catch-up-kit") {
    return [
      makeSupplyReward("common", 6),
      makeSupplyReward("uncommon", 4),
      makeSupplyReward("rare", 2),
      makeSupplyReward("epic", 1)
    ];
  }
  return [
    makeSupplyReward("common", 5),
    makeSupplyReward("uncommon", 2)
  ];
}

function addSupplyRewards(current: SupplyInventory, rewards: SupplyReward[]): SupplyInventory {
  return rewards.reduce(
    (next, reward) => ({
      ...next,
      [reward.tier]: next[reward.tier] + reward.amount
    }),
    current
  );
}

function consumeCraftingSupply(current: SupplyInventory, preferredTier: SupplyTierId): SupplyInventory {
  const preferredIndex = supplyTierOrder.indexOf(preferredTier);
  const fallback = [...supplyTierOrder]
    .sort((a, b) => Math.abs(supplyTierOrder.indexOf(a) - preferredIndex) - Math.abs(supplyTierOrder.indexOf(b) - preferredIndex))
    .find((tier) => current[tier] > 0);

  if (!fallback) return current;
  return {
    ...current,
    [fallback]: Math.max(0, current[fallback] - 1)
  };
}

function getDropOdds(activeBoosts: DropBoosterId[]): DropOdds {
  const odds = { ...baseDropOdds };
  activeBoosts.forEach((boostId) => {
    const booster = dropBoosterOptions.find((option) => option.id === boostId);
    if (!booster) return;
    rarityOrder.forEach((rarity) => {
      odds[rarity] += booster.delta[rarity] ?? 0;
    });
  });

  const clamped = rarityOrder.reduce(
    (next, rarity) => ({ ...next, [rarity]: Math.max(0, odds[rarity]) }),
    {} as DropOdds
  );
  const total = rarityOrder.reduce((sum, rarity) => sum + clamped[rarity], 0);
  let running = 0;

  return rarityOrder.reduce((normalized, rarity, index) => {
    const value = index === rarityOrder.length - 1 ? 100 - running : Math.round((clamped[rarity] / total) * 100);
    running += value;
    return { ...normalized, [rarity]: value };
  }, {} as DropOdds);
}

function rollDropRarity(odds: DropOdds): Rarity {
  const roll = Math.random() * 100;
  let cursor = 0;
  for (const rarity of rarityOrder) {
    cursor += odds[rarity];
    if (roll <= cursor) return rarity;
  }
  return "Practice";
}

function getDropRarityShellValue(rarity: Rarity) {
  const valueMap: Record<Rarity, number> = {
    Practice: 120,
    Steady: 220,
    Skilled: 390,
    Expert: 720,
    Masterwork: 1250
  };
  return valueMap[rarity];
}

function getDropEconomyStats(odds: DropOdds, activeBoosts: DropBoosterId[]): DropEconomyStats {
  const expectedGross = Math.round(
    rarityOrder.reduce((sum, rarity) => sum + getDropRarityShellValue(rarity) * (odds[rarity] / 100), 0)
  );
  const harborFee = Math.round(expectedGross * 0.025);
  const highValueOdds = odds.Expert + odds.Masterwork;
  const listingSpeed: DropEconomyStats["listingSpeed"] =
    activeBoosts.length >= 3 ? "hot" : activeBoosts.length >= 1 ? "fast" : "standard";

  return {
    expectedGross,
    harborFee,
    expectedNet: expectedGross - harborFee,
    highValueOdds,
    listingSpeed
  };
}

function getDropTrialScore(rarity: Rarity) {
  const baseScores: Record<Rarity, number> = {
    Practice: 26,
    Steady: 52,
    Skilled: 72,
    Expert: 88,
    Masterwork: 100
  };
  return Math.min(100, baseScores[rarity] + Math.floor(Math.random() * 5));
}

function createDropDraft(sourceDraft: ItemDraft, contract: HourlyContract, rarity: Rarity): ItemDraft {
  const category = findCategory(sourceDraft.category);
  const rank = rarityRank[rarity];
  return {
    ...sourceDraft,
    name: `${rarity} ${quickCrafter.name}-Forged ${contract.title}`,
    subtype: pickOption(category.subtypes),
    material: pickOption(materialOptions).id,
    edge: pickOption(edgeOptions).id,
    handle: pickOption(handleOptions).id,
    element: pickOption(elementOptions).id,
    rune: pickOption(runeOptions).id,
    finish: pickOption(finishOptions).id,
    motif: pickOption(motifOptions).id,
    notes: `${quickCrafter.name} commission from ${contract.label}. Rarity came from transparent odds; customization is limited and market listing is fast.`,
    stats: {
      force: Math.min(100, 38 + rank * 9 + Math.floor(Math.random() * 8)),
      finesse: Math.min(100, 36 + rank * 8 + Math.floor(Math.random() * 10)),
      balance: Math.min(100, 40 + rank * 7 + Math.floor(Math.random() * 8)),
      resonance: Math.min(100, 34 + rank * 9 + Math.floor(Math.random() * 9))
    }
  };
}

function getMarketShellPrice(item: CraftedItem) {
  return Math.max(120, rarityRank[item.rarity] * 90 + item.creativity.total * 3 + item.powerRating * 2);
}

export default function App() {
  const testerMode = isTesterMode();
  const [now] = useState(() => new Date());
  const dayKey = getDateKey(now);
  const dateLabel = formatDateLabel(now);
  const contracts = useMemo(() => generateHourlyContracts(now), [dayKey]);
  const [selectedHour, setSelectedHour] = useState(0);
  const contract = contracts[selectedHour] ?? contracts[0];
  const [activeTab, setActiveTab] = useState<Tab>("forge");
  const [draft, setDraft] = useState<ItemDraft>(() => createInitialDraft(contract));
  const [collection, setCollection] = useState<CraftedItem[]>(loadSavedCollection);
  const [trialOpen, setTrialOpen] = useState(false);
  const [lastTrialScore, setLastTrialScore] = useState(0);
  const [lastItem, setLastItem] = useState<CraftedItem | null>(null);
  const [forgeHeat, setForgeHeat] = useState(() => getHeatTarget(contract) - 8);
  const [supplies, setSupplies] = useState<SupplyInventory>(() => (testerMode ? testerSupplies : loadSupplyInventory()));
  const [lastSupplyRewards, setLastSupplyRewards] = useState<SupplyReward[]>([]);
  const [craftingMode, setCraftingMode] = useState<CraftingMode>("advanced");
  const [activeDropBoosts, setActiveDropBoosts] = useState<DropBoosterId[]>(() =>
    testerMode ? dropBoosterOptions.map((option) => option.id) : []
  );
  const [dropForgeResult, setDropForgeResult] = useState<CraftedItem | null>(null);
  const [autoListDrops, setAutoListDrops] = useState(true);
  const [claimedGoals, setClaimedGoals] = useState<string[]>(() => loadStringArray(claimedGoalKey));
  const [favorites, setFavorites] = useState<string[]>(() => loadStringArray(favoritesKey));
  const [listedTokens, setListedTokens] = useState<string[]>(() => loadStringArray(listedTokenKey));
  const [activityLog, setActivityLog] = useState<string[]>(() => loadStringArray(activityLogKey));
  const [lootReveal, setLootReveal] = useState<LootReveal | null>(null);
  const [settings, setSettings] = useState<PlayerSettings>(loadPlayerSettings);
  const [challengeSeed, setChallengeSeed] = useState(() => window.localStorage.getItem(challengeSeedKey) ?? createChallengeSeed(dayKey, selectedHour));
  const [previewUnlocked, setPreviewUnlocked] = useState(loadPreviewAccess);
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState("");
  const forgeAudio = useForgeAudio();

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    window.localStorage.setItem(claimedGoalKey, JSON.stringify(claimedGoals));
  }, [claimedGoals]);

  useEffect(() => {
    window.localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem(listedTokenKey, JSON.stringify(listedTokens));
  }, [listedTokens]);

  useEffect(() => {
    window.localStorage.setItem(activityLogKey, JSON.stringify(activityLog.slice(0, 12)));
  }, [activityLog]);

  useEffect(() => {
    window.localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (testerMode) return;
    window.localStorage.setItem(supplyKey, JSON.stringify(supplies));
  }, [supplies, testerMode]);

  useEffect(() => {
    window.localStorage.setItem(challengeSeedKey, challengeSeed);
  }, [challengeSeed]);

  useEffect(() => {
    setDraft(createInitialDraft(contract));
    setLastTrialScore(0);
    setForgeHeat(Math.max(20, getHeatTarget(contract) - 10));
  }, [contract.hour, dayKey]);

  function haptic(pattern: number | number[] = 12) {
    if (!settings.haptics || !("vibrate" in window.navigator)) return;
    window.navigator.vibrate(pattern);
  }

  function submitPreviewPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pinEntry.trim() === previewAccessPin) {
      window.localStorage.setItem(previewAccessKey, "unlocked");
      setPreviewUnlocked(true);
      setPinEntry("");
      setPinError("");
      void forgeAudio.play("reward");
      haptic([12, 18, 12]);
      return;
    }

    setPinEntry("");
    setPinError("Incorrect PIN");
    void forgeAudio.play("vent");
    haptic([8, 12, 8]);
  }

  function updatePinEntry(value: string) {
    setPinEntry(value.replace(/\D/g, "").slice(0, previewAccessPin.length));
    setPinError("");
  }

  const existingForHour = collection.find((item) => item.dayKey === dayKey && item.hour === contract.hour);
  const creativity = scoreCreativity(draft, contract, lastTrialScore);
  const category = findCategory(draft.category);
  const skill = skillLessons.find((lesson) => lesson.id === contract.skill) ?? skillLessons[0];
  const islandCondition = getIslandCondition(dayKey, contract.hour);
  const bonusGoals = buildBonusGoals(draft, contract, creativity.total, lastTrialScore, forgeHeat, islandCondition);
  const claimedCount = bonusGoals.filter((goal) => claimedGoals.includes(goal.id)).length;
  const craftedRouteCount = getCraftedRouteCount(collection, dayKey);
  const visibleSupplies = testerMode ? testerSupplies : supplies;
  const requiredSupplyTier = getRequiredSupplyTier(contract);
  const canForge = testerMode || getTotalSupplies(supplies) > 0;
  const dropOdds = getDropOdds(activeDropBoosts);
  const dropEconomy = getDropEconomyStats(dropOdds, activeDropBoosts);
  const advancedNodeCount = Math.min(
    100,
    Math.max(1, collection.filter((item) => item.contract.skill === contract.skill).length * 4 + 4)
  );
  const skillCounts = skillLessons.map((lesson) => ({
    ...lesson,
    count: collection.filter((item) => item.contract.skill === lesson.id).length
  }));

  function pushActivity(message: string) {
    const timestamp = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
    setActivityLog((current) => [`${timestamp} - ${message}`, ...current].slice(0, 12));
  }

  function updateSettings(patch: Partial<PlayerSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function chooseCraftingMode(mode: CraftingMode) {
    void forgeAudio.play("ui");
    setCraftingMode(mode);
  }

  function updateDraft<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateCategory(categoryId: CategoryId) {
    void forgeAudio.play("ui");
    const nextCategory = findCategory(categoryId);
    setDraft((current) => ({
      ...current,
      category: categoryId,
      subtype: nextCategory.subtypes[0]
    }));
  }

  function updateStat(key: keyof ItemDraft["stats"], value: number) {
    setDraft((current) => ({
      ...current,
      stats: {
        ...current.stats,
        [key]: value
      }
    }));
  }

  function updateImagination<K extends keyof ImaginationRecipe>(key: K, value: ImaginationRecipe[K]) {
    setDraft((current) => ({
      ...current,
      imagination: {
        ...getDraftImagination(current),
        [key]: value
      }
    }));
  }

  function finishTrial(score: number) {
    void forgeAudio.play("craft");
    haptic([18, 24, 32]);
    const heatBonus = getHeatBonus(contract, forgeHeat);
    const adjustedScore = Math.max(5, Math.min(100, score + heatBonus));
    const item = createCraftedItem({ ...draft, stats: { ...draft.stats } }, contract, dayKey, adjustedScore);
    setLastTrialScore(adjustedScore);
    if (!testerMode) {
      setSupplies((current) => consumeCraftingSupply(current, requiredSupplyTier));
    }
    setCollection((current) => [item, ...current]);
    setLastItem(item);
    setTrialOpen(false);
    pushActivity(`Forged ${item.rarity} ${item.draft.name} with ${getSupplyTier(requiredSupplyTier).label}`);
    setActiveTab("collection");
  }

  function exportItem(item: CraftedItem) {
    void forgeAudio.play("export");
    haptic(10);
    downloadJson(`${item.assetId}.eldertide-isles-item.json`, item);
    pushActivity(`Exported ${item.draft.name}`);
  }

  function exportDraft() {
    void forgeAudio.play("export");
    haptic(10);
    const preview = createCraftedItem({ ...draft, stats: { ...draft.stats } }, contract, dayKey, lastTrialScore);
    downloadJson(`${preview.assetId}.draft.eldertide-isles-item.json`, {
      ...preview,
      draftOnly: true,
      exportNote: "Draft export. Forge a trial to save a scored local tradable practice token."
    });
    pushActivity("Exported a draft practice token");
  }

  function buyMarketOffer(offerTitle: string) {
    void forgeAudio.play("loot");
    haptic([14, 20, 14]);
    const offer = marketOffers.find((marketOffer) => marketOffer.title === offerTitle) ?? marketOffers[0];
    const supplyRewards = purchaseSupplyRewards(offer.id);
    const boosterId = offerBoostMap[offer.id];
    const booster = dropBoosterOptions.find((option) => option.id === boosterId);
    const reveal = {
      offerTitle,
      rewards: [...generateLootRewards(offer.id), ...(booster ? [`Booster activated: ${booster.label}`] : [])],
      supplyRewards
    };
    if (boosterId) {
      setActiveDropBoosts((current) => (current.includes(boosterId) ? current : [...current, boosterId]));
    }
    setSupplies((current) => addSupplyRewards(current, supplyRewards));
    setLootReveal(reveal);
    pushActivity(`Opened ${offerTitle}`);
  }

  function toggleDropBoost(boostId: DropBoosterId) {
    void forgeAudio.play("ui");
    setActiveDropBoosts((current) => (current.includes(boostId) ? current.filter((id) => id !== boostId) : [...current, boostId]));
  }

  function toggleAutoListDrops() {
    void forgeAudio.play("ui");
    setAutoListDrops((current) => !current);
  }

  function runDropForge() {
    if (!canForge) {
      collectSupplies();
      pushActivity("Collected supplies before drop forging");
      return;
    }

    const rarity = rollDropRarity(dropOdds);
    const dropDraft = createDropDraft(draft, contract, rarity);
    const dropScore = getDropTrialScore(rarity);
    const item = createCraftedItem(dropDraft, contract, dayKey, dropScore);
    const dropItem: CraftedItem = {
      ...item,
      rarity,
      trialScore: dropScore,
      powerRating: Math.min(120, Math.max(item.powerRating, 36 + rarityRank[rarity] * 14 + Math.round(item.creativity.total * 0.18))),
      interoperability: {
        ...item.interoperability,
        importTags: Array.from(
          new Set([
            ...item.interoperability.importTags,
            "craft.mode.crafter",
            "craft.intent.profit",
            "crafter.hephaestus",
            autoListDrops ? "market.auto-listed" : "market.manual-listing",
            `drop.rarity.${rarity.toLowerCase()}`
          ])
        ),
        modelHints: {
          ...item.interoperability.modelHints,
          craftMode: "hephaestus-crafter-service",
          crafter: quickCrafter.name,
          dropRarity: rarity,
          activeBoosters: activeDropBoosts.length,
          expectedNetShells: dropEconomy.expectedNet,
          autoList: autoListDrops ? 1 : 0
        }
      }
    };

    void forgeAudio.play(rarity === "Masterwork" || rarity === "Expert" ? "reward" : "craft");
    haptic(rarity === "Masterwork" ? [24, 20, 36] : [12, 18, 12]);
    if (!testerMode) {
      setSupplies((current) => consumeCraftingSupply(current, requiredSupplyTier));
    }
    setCollection((current) => [dropItem, ...current]);
    if (autoListDrops) {
      setListedTokens((current) => (current.includes(dropItem.assetId) ? current : [dropItem.assetId, ...current]));
    }
    setLastItem(dropItem);
    setDropForgeResult(dropItem);
    setLastTrialScore(dropScore);
    pushActivity(`${autoListDrops ? "Hephaestus forged and listed" : "Hephaestus forged"} ${dropItem.rarity} ${dropItem.draft.name}`);
  }

  function collectSupplies() {
    void forgeAudio.play("loot");
    haptic([12, 18, 12]);
    const rewards = rollSupplyRewards(contract);
    setSupplies((current) => addSupplyRewards(current, rewards));
    setLastSupplyRewards(rewards);
    pushActivity(`Collected ${contract.label} supplies`);
  }

  function pumpBellows() {
    void forgeAudio.play("pump");
    haptic(8);
    setForgeHeat((heat) => Math.min(100, heat + 9));
  }

  function ventHeat() {
    void forgeAudio.play("vent");
    haptic(8);
    setForgeHeat((heat) => Math.max(0, heat - 7));
  }

  function claimGoal(goal: BonusGoal) {
    if (!goal.complete || claimedGoals.includes(goal.id)) return;
    void forgeAudio.play("reward");
    haptic([12, 18, 12]);
    setClaimedGoals((current) => [goal.id, ...current]);
    pushActivity(`Claimed ${goal.reward}`);
  }

  function randomizeDraft() {
    void forgeAudio.play("spark");
    haptic(10);
    const categoryOption = pickOption(optionGroups.categories);
    setDraft((current) => ({
      ...current,
      category: categoryOption.id,
      subtype: pickOption(categoryOption.subtypes),
      material: pickOption(materialOptions).id,
      edge: pickOption(edgeOptions).id,
      handle: pickOption(handleOptions).id,
      element: pickOption(elementOptions).id,
      rune: pickOption(runeOptions).id,
      finish: pickOption(finishOptions).id,
      motif: pickOption(motifOptions).id,
      imagination: {
        origin: pickOption(imaginationOptions.origins).id,
        mystery: pickOption(imaginationOptions.mysteries).id,
        purpose: pickOption(imaginationOptions.purposes).id,
        flaw: pickOption(imaginationOptions.flaws).id,
        sensory: pickOption(imaginationOptions.sensory).id,
        oath: pickOption(makerOaths)
      },
      stats: {
        force: 35 + Math.floor(Math.random() * 45),
        finesse: 35 + Math.floor(Math.random() * 45),
        balance: 35 + Math.floor(Math.random() * 45),
        resonance: 35 + Math.floor(Math.random() * 45)
      }
    }));
    pushActivity("Rolled a new recipe");
  }

  function fitBrief() {
    void forgeAudio.play("fit");
    haptic(10);
    const categoryOption = findCategory(contract.category);
    const purposeBySkill: Record<SkillId, string> = {
      reaction: "seal-sea-rift",
      speed: "calm-storm-forge",
      memory: "remember-forgotten-crew",
      math: "guide-lost-ships",
      rhythm: "calm-storm-forge",
      music: "guide-lost-ships",
      spatial: "seal-sea-rift",
      creativity: "mark-honest-trade"
    };
    setDraft((current) => ({
      ...current,
      category: categoryOption.id,
      subtype: categoryOption.subtypes[contract.hour % categoryOption.subtypes.length],
      material: bestOption(materialOptions, contract.targetTags).id,
      edge: bestOption(edgeOptions, contract.targetTags).id,
      handle: bestOption(handleOptions, contract.targetTags).id,
      element: bestOption(elementOptions, contract.targetTags).id,
      rune: bestOption(runeOptions, contract.targetTags).id,
      finish: bestOption(finishOptions, contract.targetTags).id,
      motif: bestOption(motifOptions, contract.targetTags).id,
      imagination: {
        ...getDraftImagination(current),
        origin: imaginationOptions.origins[contract.hour % imaginationOptions.origins.length].id,
        mystery: imaginationOptions.mysteries[(contract.hour + contract.difficulty) % imaginationOptions.mysteries.length].id,
        purpose: purposeBySkill[contract.skill],
        sensory: imaginationOptions.sensory[(contract.hour + contract.processLevel) % imaginationOptions.sensory.length].id
      }
    }));
    pushActivity("Fitted a recipe to the brief");
  }

  function toggleFavorite(assetId: string) {
    void forgeAudio.play("ui");
    setFavorites((current) => (current.includes(assetId) ? current.filter((id) => id !== assetId) : [assetId, ...current]));
  }

  function toggleListedToken(item: CraftedItem) {
    void forgeAudio.play("ui");
    setListedTokens((current) => {
      const listed = current.includes(item.assetId);
      pushActivity(listed ? `Unlisted ${item.draft.name}` : `Listed ${item.draft.name}`);
      return listed ? current.filter((id) => id !== item.assetId) : [item.assetId, ...current];
    });
  }

  function requestTrade(item: CraftedItem) {
    void forgeAudio.play("ui");
    pushActivity(`Drafted trade offer for ${item.draft.name}`);
  }

  function selectHour(hour: number) {
    void forgeAudio.play("navigate");
    setSelectedHour(hour);
  }

  function selectTab(tab: Tab) {
    void forgeAudio.play("navigate");
    setActiveTab(tab);
  }

  function openTrial() {
    if (!canForge) {
      collectSupplies();
      pushActivity("Collected supplies before forging");
      return;
    }
    void forgeAudio.play("forgeStart");
    haptic(12);
    setTrialOpen(true);
  }

  function rollChallenge() {
    const nextSeed = createChallengeSeed(dayKey, selectedHour, Date.now());
    void forgeAudio.play("spark");
    haptic([12, 16, 12]);
    setChallengeSeed(nextSeed);
    pushActivity(`Rolled challenge ${nextSeed}`);
  }

  async function copyChallenge() {
    const payload = `${challengeSeed} | ${contract.label} | ${contract.title} | ${contract.skill} | beat ${Math.max(70, creativity.total)} creativity or trial score`;
    try {
      await window.navigator.clipboard.writeText(payload);
      void forgeAudio.play("export");
      haptic(10);
      pushActivity(`Shared challenge ${challengeSeed}`);
    } catch {
      pushActivity(`Challenge seed ready ${challengeSeed}`);
    }
  }

  const appFrameClassName = [
    "app-frame",
    settings.highContrast ? "high-contrast" : "",
    settings.reduceMotion ? "reduce-motion" : "",
    settings.largeText ? "large-text" : "",
    settings.focusMode ? "focus-mode" : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (!previewUnlocked) {
    return (
      <main className={appFrameClassName} style={{ "--tide-accent": islandCondition.accent } as CSSProperties}>
        <AccessGate
          testerMode={testerMode}
          pinEntry={pinEntry}
          pinError={pinError}
          onPinEntry={updatePinEntry}
          onSubmit={submitPreviewPin}
        />
      </main>
    );
  }

  return (
    <main className={appFrameClassName} style={{ "--tide-accent": islandCondition.accent } as CSSProperties}>
      <div className="phone-shell">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark">
              <Icon name="spark" />
            </span>
            <div>
              <h1>Eldertide Isles</h1>
              <p>{testerMode ? "Tester build - unlimited supplies and shells" : dateLabel}</p>
            </div>
          </div>
          <div className="topbar-actions">
            {testerMode && <span className="tester-badge">TESTER INF</span>}
            <button
              className={forgeAudio.enabled ? "icon-button active" : "icon-button"}
              type="button"
              aria-label={forgeAudio.enabled ? "Disable forge sound" : "Enable forge sound"}
              aria-pressed={forgeAudio.enabled}
              onClick={() => void forgeAudio.toggle()}
            >
              <Icon name={forgeAudio.enabled ? "soundOn" : "soundOff"} />
            </button>
            <button className="icon-button" type="button" aria-label="Export current practice passport" onClick={exportDraft}>
              <Icon name="export" />
            </button>
          </div>
        </header>

        <div className="screen-scroll">
          {activeTab === "forge" && (
            <ForgeScreen
              contracts={contracts}
              selectedHour={selectedHour}
              dayKey={dayKey}
              collection={collection}
              onSelectHour={selectHour}
              contract={contract}
              islandCondition={islandCondition}
              skill={skill.title}
              draft={draft}
              categoryLabel={category.label}
              creativity={creativity.total}
              existingForHour={existingForHour}
              lastTrialScore={lastTrialScore}
              forgeHeat={forgeHeat}
              heatTarget={getHeatTarget(contract)}
              heatBonus={getHeatBonus(contract, forgeHeat)}
              bonusGoals={bonusGoals}
              claimedGoals={claimedGoals}
              claimedCount={claimedCount}
              craftedRouteCount={craftedRouteCount}
              supplies={visibleSupplies}
              requiredSupplyTier={requiredSupplyTier}
              lastSupplyRewards={lastSupplyRewards}
              canForge={canForge}
              advancedNodeCount={advancedNodeCount}
              onCollectSupplies={collectSupplies}
              onPumpBellows={pumpBellows}
              onVentHeat={ventHeat}
              onClaimGoal={claimGoal}
              onOpenTrial={openTrial}
              onExportExisting={existingForHour ? () => exportItem(existingForHour) : undefined}
            />
          )}

          {activeTab === "path" && <SkillPathScreen skillCounts={skillCounts} contract={contract} />}

          {activeTab === "workshop" && (
            <WorkshopScreen
              draft={draft}
              onUpdateDraft={updateDraft}
              onUpdateCategory={updateCategory}
              onUpdateImagination={updateImagination}
              onUpdateStat={updateStat}
              contract={contract}
              creativity={creativity}
              targetHitCount={countTargetHits(draft, contract)}
              onRandomize={randomizeDraft}
              onFitBrief={fitBrief}
              onBuyOffer={buyMarketOffer}
              lootReveal={lootReveal}
              onClearLootReveal={() => setLootReveal(null)}
              collection={collection}
              listedTokens={listedTokens}
              onToggleListed={toggleListedToken}
              onRequestTrade={requestTrade}
              craftingMode={craftingMode}
              onChooseCraftingMode={chooseCraftingMode}
              dropOdds={dropOdds}
              dropEconomy={dropEconomy}
              activeDropBoosts={activeDropBoosts}
              onToggleDropBoost={toggleDropBoost}
              onRunDropForge={runDropForge}
              dropForgeResult={dropForgeResult}
              autoListDrops={autoListDrops}
              onToggleAutoListDrops={toggleAutoListDrops}
              advancedNodeCount={advancedNodeCount}
              canForge={canForge}
            />
          )}

          {activeTab === "collection" && (
            <CollectionScreen
              collection={collection}
              lastItem={lastItem}
              favorites={favorites}
              listedTokens={listedTokens}
              onExport={exportItem}
              onToggleFavorite={toggleFavorite}
              onToggleListed={toggleListedToken}
              onRequestTrade={requestTrade}
              onForge={() => selectTab("forge")}
            />
          )}

          {activeTab === "profile" && (
            <ProfileScreen
              collection={collection}
              contracts={contracts}
              dayKey={dayKey}
              craftedRouteCount={craftedRouteCount}
              supplies={visibleSupplies}
              claimedCount={claimedCount}
              activityLog={activityLog}
              settings={settings}
              challengeSeed={challengeSeed}
              challengeContract={contract}
              challengeTarget={Math.max(70, creativity.total)}
              onUpdateSettings={updateSettings}
              onRollChallenge={rollChallenge}
              onCopyChallenge={() => void copyChallenge()}
            />
          )}
        </div>

        <nav className="bottom-nav" aria-label="Game sections">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "nav-item active" : "nav-item"}
              type="button"
              key={tab.id}
              onClick={() => selectTab(tab.id)}
            >
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {trialOpen && (
        <ForgeTrial
          contract={contract}
          draft={draft}
          forgeHeat={forgeHeat}
          heatTarget={getHeatTarget(contract)}
          heatBonus={getHeatBonus(contract, forgeHeat)}
          trialPace={settings.trialPace}
          onComplete={finishTrial}
          onClose={() => {
            void forgeAudio.play("ui");
            setTrialOpen(false);
          }}
          onSound={(cue) => void forgeAudio.play(cue)}
        />
      )}
    </main>
  );
}

function AccessGate({
  testerMode,
  pinEntry,
  pinError,
  onPinEntry,
  onSubmit
}: {
  testerMode: boolean;
  pinEntry: string;
  pinError: string;
  onPinEntry: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="access-shell" aria-label="Eldertide Isles preview access">
      <div className="access-brand">
        <span className="brand-mark">
          <Icon name="spark" />
        </span>
        <div>
          <p className="overline">Preview Harbor</p>
          <h1>Eldertide Isles</h1>
        </div>
      </div>

      <div className="access-copy">
        <h2>Enter the island passcode</h2>
        <p>Tester gates open to the forge sandbox, Hephaestus rolls, market mockups, and exportable local relic assets.</p>
      </div>

      <form className="pin-form" onSubmit={onSubmit}>
        <label className="pin-field">
          <span>Access PIN</span>
          <input
            value={pinEntry}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={previewAccessPin.length}
            autoComplete="one-time-code"
            placeholder="000000"
            aria-invalid={pinError ? "true" : "false"}
            onChange={(event) => onPinEntry(event.target.value)}
          />
        </label>
        <button className="primary-button wide" type="submit" disabled={pinEntry.length < previewAccessPin.length}>
          Enter Isles
        </button>
        <p className={pinError ? "pin-status error" : "pin-status"}>{pinError || (testerMode ? "Tester build ready." : "Public preview ready.")}</p>
      </form>

      <div className="access-runes" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function ForgeScreen({
  contracts,
  selectedHour,
  dayKey,
  collection,
  onSelectHour,
  contract,
  islandCondition,
  skill,
  draft,
  categoryLabel,
  creativity,
  existingForHour,
  lastTrialScore,
  forgeHeat,
  heatTarget,
  heatBonus,
  bonusGoals,
  claimedGoals,
  claimedCount,
  craftedRouteCount,
  supplies,
  requiredSupplyTier,
  lastSupplyRewards,
  canForge,
  advancedNodeCount,
  onCollectSupplies,
  onPumpBellows,
  onVentHeat,
  onClaimGoal,
  onOpenTrial,
  onExportExisting
}: {
  contracts: HourlyContract[];
  selectedHour: number;
  dayKey: string;
  collection: CraftedItem[];
  onSelectHour: (hour: number) => void;
  contract: HourlyContract;
  islandCondition: IslandCondition;
  skill: string;
  draft: ItemDraft;
  categoryLabel: string;
  creativity: number;
  existingForHour?: CraftedItem;
  lastTrialScore: number;
  forgeHeat: number;
  heatTarget: number;
  heatBonus: number;
  bonusGoals: BonusGoal[];
  claimedGoals: string[];
  claimedCount: number;
  craftedRouteCount: number;
  supplies: SupplyInventory;
  requiredSupplyTier: SupplyTierId;
  lastSupplyRewards: SupplyReward[];
  canForge: boolean;
  advancedNodeCount: number;
  onCollectSupplies: () => void;
  onPumpBellows: () => void;
  onVentHeat: () => void;
  onClaimGoal: (goal: BonusGoal) => void;
  onOpenTrial: () => void;
  onExportExisting?: () => void;
}) {
  const requiredSupply = getSupplyTier(requiredSupplyTier);
  const tideSignal = getTideSignal(contract, islandCondition, forgeHeat);
  const totalSupplies = getTotalSupplies(supplies);

  return (
    <section className="forge-panel">
      <div className="forge-status-dock" aria-label="Forge status">
        <article className="status-chip heat">
          <span>Heat</span>
          <strong>{forgeHeat}%</strong>
          <em>{heatLabel(contract, forgeHeat)}</em>
        </article>
        <article className="status-chip tide">
          <span>{islandCondition.risk} risk</span>
          <strong>{islandCondition.label}</strong>
          <em>{tideSignal.phase}</em>
        </article>
        <article className="status-chip supplies">
          <span>Cache</span>
          <strong>{totalSupplies}</strong>
          <em>{requiredSupplyTier}</em>
        </article>
      </div>

      <div className="route-rail" aria-label="Collection routes">
        {contracts.map((hourContract) => {
          const crafted = collection.some((item) => item.dayKey === dayKey && item.hour === hourContract.hour);
          return (
            <button
              key={hourContract.hour}
              type="button"
              className={[
                "route-chip",
                selectedHour === hourContract.hour ? "active" : "",
                crafted ? "crafted" : ""
              ].join(" ")}
              onClick={() => onSelectHour(hourContract.hour)}
              aria-label={`${hourContract.label} ${hourContract.title} tier ${hourContract.difficulty}`}
            >
              <span>{hourContract.label}</span>
              <small>{crafted ? "crafted" : `tier ${hourContract.difficulty}`}</small>
            </button>
          );
        })}
      </div>

      <section className="forge-console" aria-label="Live forge console">
        <div className="contract-banner">
          <div>
            <p className="overline">Collection Route - Tier {contract.difficulty}</p>
            <h2>{contract.title}</h2>
            <p>{contract.prompt}</p>
          </div>
          <div className="banner-chips">
            <div className="isle-chip">{islandCondition.label}</div>
            <div className="reward-chip">Find: {contract.reward}</div>
          </div>
        </div>

        <div className="forge-graphic-panel" data-condition={islandCondition.id}>
          <div className="isle-atmosphere" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="scene-resource-orbs" aria-label="Material supply quick view">
            {supplyTiers.map((tier) => (
              <div
                className={["resource-orb", `tier-${tier.id}`, tier.id === requiredSupplyTier ? "required" : ""].join(" ")}
                key={tier.id}
                style={{ "--supply-accent": tier.accent } as CSSProperties}
              >
                <span />
                <strong>{supplies[tier.id]}</strong>
              </div>
            ))}
          </div>
          <div className="forge-touch-map" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="scene-action-wheel" aria-label="Forge actions">
            <button className="round-action quench" type="button" onClick={onVentHeat}>
              <span>Quench</span>
            </button>
            <button className="round-action temper" type="button" onClick={onPumpBellows}>
              <span>Temper</span>
            </button>
            <button className="round-action craft" type="button" onClick={onOpenTrial}>
              <span>{!canForge ? "Collect" : existingForHour ? "Reforge" : "Craft"}</span>
            </button>
          </div>
          <WeaponPreview draft={draft} />
          <div className="forge-heat-arc" aria-label={`Heat ${forgeHeat} percent, target ${heatTarget} percent`}>
            <i>
              <b style={{ width: `${forgeHeat}%` }} />
              <em style={{ left: `${heatTarget}%` }} />
            </i>
            <strong>{heatLabel(contract, forgeHeat)}</strong>
            <span>
              target {heatTarget}% / {heatBonus >= 0 ? "+" : ""}
              {heatBonus}
            </span>
          </div>
          <div className="graphic-hud top">
            <span>{skill}</span>
            <strong>{categoryLabel}</strong>
          </div>
          <div className="graphic-hud bottom">
            <span>Creativity</span>
            <strong>{creativity}</strong>
          </div>
          <div className="graphic-hud route">
            <span>{islandCondition.risk} risk</span>
            <strong>{requiredSupply.label}</strong>
          </div>
        </div>

        <SkillTreePreview contract={contract} unlockedCount={advancedNodeCount} />

        <section
          className="tide-language-strip"
          data-risk={tideSignal.riskClass}
          data-heat={tideSignal.heatSync}
          aria-label="Tide signal color guide"
        >
          <div className="tide-signal-main">
            <span>Tide</span>
            <strong>{tideSignal.phase}</strong>
            <em>{islandCondition.label}</em>
          </div>
          <div className="tide-signal-lane" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="tide-signal-detail">
            <span>{tideSignal.channel}</span>
            <strong>{tideSignal.timing}</strong>
            <em>{tideSignal.lesson}</em>
          </div>
        </section>

        <div className="forge-readout compact-readout">
          <Metric label="Process" value={`${contract.process.label} ${contract.processLevel}`} />
          <Metric label="Trial" value={lastTrialScore ? `${lastTrialScore}` : "open"} />
          <Metric label="Routes" value={`${craftedRouteCount}/${contracts.length}`} />
          <Metric label="Claims" value={`${claimedCount}/4`} />
        </div>
      </section>

      <div className="forge-control-grid">
        <div className="process-strip">
          <span>
            {contract.processImpact === "significant"
              ? "Significant"
              : contract.processEvent === "practice"
                ? "Practice"
                : contract.processEvent}
          </span>
          <strong>{contract.process.label} Lv {contract.processLevel}</strong>
          <em>{contract.process.forgeAction}</em>
        </div>

        <section className="heat-panel" aria-label="Bellows heat control">
          <div className="heat-copy">
            <span>{heatLabel(contract, forgeHeat)} heat</span>
            <strong>{forgeHeat}%</strong>
            <small>
              target {heatTarget}% - trial {heatBonus >= 0 ? "+" : ""}
              {heatBonus}
            </small>
          </div>
          <div className="heat-meter">
            <span className="heat-target" style={{ left: `${heatTarget}%`, width: `${getHeatBand(contract)}%` }} />
            <span className="heat-fill" style={{ width: `${forgeHeat}%` }} />
          </div>
        </section>

        <section className="condition-panel" aria-label="Island condition">
          <span>{islandCondition.cue}</span>
          <strong>{islandCondition.hint}</strong>
        </section>
      </div>

      <section className="supply-cache-panel" aria-label="Crafting supply cache">
        <div className="supply-cache-heading">
          <div>
            <span>Collection Cache</span>
            <strong>{totalSupplies} crafting items ready</strong>
          </div>
          <button className="primary-button small" type="button" onClick={onCollectSupplies}>
            Collect
          </button>
        </div>
        <div className="supply-tier-grid">
          {supplyTiers.map((tier) => (
            <article
              className={tier.id === requiredSupplyTier ? "supply-tier required" : "supply-tier"}
              key={tier.id}
              style={{ "--supply-accent": tier.accent } as CSSProperties}
            >
              <span>{tier.label}</span>
              <small>{tier.real}</small>
              <strong>{supplies[tier.id]}</strong>
            </article>
          ))}
        </div>
        <div className="science-magic-note">
          <span>Science & Magic</span>
          <strong>{requiredSupply.label}</strong>
          <p>{requiredSupply.lesson}</p>
          <em>Magic: {requiredSupply.magic}</em>
        </div>
        {lastSupplyRewards.length > 0 && (
          <div className="supply-reveal" aria-live="polite">
            {lastSupplyRewards.map((reward, index) => (
              <span key={`${reward.tier}-${reward.amount}-${index}`} title={reward.lesson}>
                +{reward.amount} {reward.label}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="goal-board" aria-label="Bonus goals">
        {bonusGoals.map((goal) => {
          const claimed = claimedGoals.includes(goal.id);
          return (
            <article className={goal.complete ? "goal-card complete" : "goal-card"} key={goal.id}>
              <div>
                <strong>{goal.label}</strong>
                <span>{goal.detail}</span>
              </div>
              <button className="secondary-button small" type="button" disabled={!goal.complete || claimed} onClick={() => onClaimGoal(goal)}>
                {claimed ? "Claimed" : goal.reward}
              </button>
            </article>
          );
        })}
      </div>

      {existingForHour && (
        <button className="secondary-button wide export-strip" type="button" onClick={onExportExisting}>
          Export forged relic asset
        </button>
      )}
    </section>
  );
}

function SkillTreePreview({ contract, unlockedCount }: { contract: HourlyContract; unlockedCount: number }) {
  const definition = skillPathDefinitions[contract.skill];
  const nodes = useMemo(() => generateSkillPathNodes(contract.skill), [contract.skill]);
  const safeUnlockedCount = Math.min(100, Math.max(1, unlockedCount));
  const visibleNodeCount = 16;
  const windowStart = Math.max(0, Math.min(nodes.length - visibleNodeCount, safeUnlockedCount - 7));
  const visibleNodes = nodes.slice(windowStart, windowStart + visibleNodeCount);
  const visibleIndexes = new Set(visibleNodes.map((node) => node.index));
  const currentNode = nodes[safeUnlockedCount - 1] ?? nodes[0];
  const pathStyle = { "--path-accent": definition.accent } as CSSProperties;

  return (
    <section className="mini-skill-tree" style={pathStyle} aria-label={`${definition.constellation} current skill tree`}>
      <div className="mini-tree-copy">
        <span>Skill Tree</span>
        <strong>{definition.constellation}</strong>
        <em>{safeUnlockedCount}/100 nodes</em>
      </div>
      <svg className="mini-tree-map" viewBox="0 0 100 58" preserveAspectRatio="none" aria-hidden="true">
        {visibleNodes.flatMap((node) =>
          node.links
            .filter((link) => visibleIndexes.has(link))
            .map((link) => {
              const target = nodes[link];
              return (
                <line
                  className={node.index < safeUnlockedCount && target.index < safeUnlockedCount ? "unlocked" : ""}
                  key={`${node.id}-${target.id}`}
                  x1={node.x}
                  y1={5 + node.y * 0.48}
                  x2={target.x}
                  y2={5 + target.y * 0.48}
                />
              );
            })
        )}
        {visibleNodes.map((node) => {
          const unlocked = node.index < safeUnlockedCount;
          const current = node.index === currentNode.index;
          return (
            <circle
              className={[unlocked ? "unlocked" : "locked", current ? "current" : "", node.nodeType].join(" ")}
              cx={node.x}
              cy={5 + node.y * 0.48}
              key={node.id}
              r={node.nodeType === "legend" || node.nodeType === "mastery" ? 2.6 : current ? 2.4 : 1.8}
            />
          );
        })}
      </svg>
      <div className="mini-tree-node">
        <span>Node {currentNode.index + 1}</span>
        <strong>{currentNode.title}</strong>
        <em>{currentNode.mentor}</em>
      </div>
    </section>
  );
}

function SkillPathScreen({
  skillCounts,
  contract
}: {
  skillCounts: Array<(typeof skillLessons)[number] & { count: number }>;
  contract: HourlyContract;
}) {
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId>(contract.skill);
  const selectedLesson = skillCounts.find((lesson) => lesson.id === selectedSkillId) ?? skillCounts[0];
  const definition = skillPathDefinitions[selectedSkillId];
  const nodes = useMemo(() => generateSkillPathNodes(selectedSkillId), [selectedSkillId]);
  const unlockedCount = Math.min(100, Math.max(1, selectedLesson.count * 4 + (selectedSkillId === contract.skill ? 4 : 0)));
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(Math.max(0, unlockedCount - 1));
  const selectedNode = nodes[selectedNodeIndex] ?? nodes[0];
  const progressPercent = Math.round((unlockedCount / 100) * 100);
  const pathStyle = { "--path-accent": definition.accent } as CSSProperties;

  useEffect(() => {
    setSelectedSkillId(contract.skill);
  }, [contract.skill]);

  useEffect(() => {
    setSelectedNodeIndex(Math.max(0, unlockedCount - 1));
  }, [selectedSkillId, unlockedCount]);

  return (
    <section className="stack-panel path-screen" style={pathStyle}>
      <div className="section-heading">
        <p className="overline">Skill Path</p>
        <h2>100-node forge constellations</h2>
      </div>
      <article className="ethics-card">
        <strong>Fair loot, tokens, and revenue</strong>
        <p>Players can buy transparent loot boxes or materials to catch up or experiment. Purchases never set trial scores, guarantee Masterwork, add paid-only power, force ads, or create stamina pressure.</p>
      </article>

      <div className="path-selector" role="tablist" aria-label="Skill constellations">
        {skillCounts.map((lesson) => {
          const active = lesson.id === selectedSkillId;
          const lessonDefinition = skillPathDefinitions[lesson.id];
          const lessonUnlocked = Math.min(100, Math.max(1, lesson.count * 4 + (lesson.id === contract.skill ? 4 : 0)));
          return (
            <button
              aria-selected={active}
              className={active ? "path-tab active" : "path-tab"}
              key={lesson.id}
              onClick={() => setSelectedSkillId(lesson.id)}
              role="tab"
              style={{ "--path-accent": lessonDefinition.accent } as CSSProperties}
              type="button"
            >
              <span>{lesson.title}</span>
              <strong>{lessonUnlocked}/100</strong>
            </button>
          );
        })}
      </div>

      <div className="path-command-dock" aria-label="Selected path summary">
        <article>
          <span>Active constellation</span>
          <strong>{definition.constellation}</strong>
        </article>
        <article>
          <span>Unlocked</span>
          <strong>{unlockedCount}/100</strong>
        </article>
        <article>
          <span>Current mentor</span>
          <strong>{selectedNode.mentor}</strong>
        </article>
      </div>

      <section className="constellation-card" aria-label={`${selectedLesson.title} constellation`}>
        <div className="constellation-header">
          <div>
            <p className="overline">{definition.constellation}</p>
            <h3>{selectedLesson.title}</h3>
            <p>{definition.anchor}</p>
          </div>
          <div className="path-score">
            <span>{progressPercent}%</span>
            <strong>{unlockedCount}/100</strong>
          </div>
        </div>

        <div className="path-progress" aria-label={`${selectedLesson.title} progress ${unlockedCount} of 100`}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="constellation-layout">
          <div className="constellation-stage" aria-label={`${selectedLesson.title} 100 node constellation`}>
            <svg className="constellation-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {nodes.flatMap((node) =>
                node.links.map((link) => {
                  const target = nodes[link];
                  const unlocked = node.index < unlockedCount && target.index < unlockedCount;
                  return (
                    <line
                      className={unlocked ? "unlocked" : ""}
                      key={`${node.id}-${target.id}`}
                      x1={target.x}
                      y1={target.y}
                      x2={node.x}
                      y2={node.y}
                    />
                  );
                })
              )}
            </svg>

            {nodes.map((node) => {
              const unlocked = node.index < unlockedCount;
              const selected = node.index === selectedNode.index;
              const current = node.index + 1 === unlockedCount;
              return (
                <button
                  aria-label={`${node.index + 1} of 100, ${node.title}, ${unlocked ? "unlocked" : "locked preview"}`}
                  className={[
                    "constellation-node",
                    node.nodeType,
                    unlocked ? "unlocked" : "locked",
                    selected ? "selected" : "",
                    current ? "current" : ""
                  ].join(" ")}
                  key={node.id}
                  onClick={() => setSelectedNodeIndex(node.index)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  type="button"
                >
                  <span>{node.index + 1}</span>
                </button>
              );
            })}
          </div>

          <article className={selectedNode.index < unlockedCount ? "node-detail unlocked" : "node-detail locked"}>
            <div className="node-detail-title">
              <span>
                Node {selectedNode.index + 1}/100 - Tier {selectedNode.tier}
              </span>
              <h3>{selectedNode.title}</h3>
            </div>
            <p>{selectedNode.upgrade}</p>
            <strong>{selectedNode.practice}</strong>
            <div className="node-meta-row">
              <span>{selectedNode.nodeType}</span>
              <span>Mentor: {selectedNode.mentor}</span>
              <span>{selectedNode.index < unlockedCount ? "Unlocked" : "Preview"}</span>
            </div>
          </article>
        </div>
      </section>

      <div className="path-lore-strip" aria-label="Path philosophy and milestone references">
        <article>
          <span>Path thesis</span>
          <p>{definition.thesis}</p>
        </article>
        <article>
          <span>Milestone mentors</span>
          <p>{nodes.filter((node) => node.nodeType === "mastery" || node.nodeType === "legend").map((node) => node.mentor).join(" - ")}</p>
        </article>
      </div>

      <div className="path-summary-grid">
        {skillCounts.map((lesson) => {
          const active = lesson.id === contract.skill;
          const lessonDefinition = skillPathDefinitions[lesson.id];
          const lessonUnlocked = Math.min(100, Math.max(1, lesson.count * 4 + (active ? 4 : 0)));
          return (
            <article className={active ? "path-summary active" : "path-summary"} key={lesson.id} style={{ "--path-accent": lessonDefinition.accent } as CSSProperties}>
              <div className="summary-orb">{lessonUnlocked}</div>
              <div>
                <div className="summary-title">
                  <h3>{lesson.title}</h3>
                  <span>{lesson.count} clears</span>
                </div>
                <p>{lesson.realWorldSkill}</p>
                <strong>{lesson.gameVerb}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function WorkshopScreen({
  draft,
  onUpdateDraft,
  onUpdateCategory,
  onUpdateImagination,
  onUpdateStat,
  contract,
  creativity,
  targetHitCount,
  onRandomize,
  onFitBrief,
  onBuyOffer,
  lootReveal,
  onClearLootReveal,
  collection,
  listedTokens,
  onToggleListed,
  onRequestTrade,
  craftingMode,
  onChooseCraftingMode,
  dropOdds,
  dropEconomy,
  activeDropBoosts,
  onToggleDropBoost,
  onRunDropForge,
  dropForgeResult,
  autoListDrops,
  onToggleAutoListDrops,
  advancedNodeCount,
  canForge
}: {
  draft: ItemDraft;
  onUpdateDraft: <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) => void;
  onUpdateCategory: (category: CategoryId) => void;
  onUpdateImagination: <K extends keyof ImaginationRecipe>(key: K, value: ImaginationRecipe[K]) => void;
  onUpdateStat: (key: keyof ItemDraft["stats"], value: number) => void;
  contract: HourlyContract;
  creativity: CreativityBreakdown;
  targetHitCount: number;
  onRandomize: () => void;
  onFitBrief: () => void;
  onBuyOffer: (offerTitle: string) => void;
  lootReveal: LootReveal | null;
  onClearLootReveal: () => void;
  collection: CraftedItem[];
  listedTokens: string[];
  onToggleListed: (item: CraftedItem) => void;
  onRequestTrade: (item: CraftedItem) => void;
  craftingMode: CraftingMode;
  onChooseCraftingMode: (mode: CraftingMode) => void;
  dropOdds: DropOdds;
  dropEconomy: DropEconomyStats;
  activeDropBoosts: DropBoosterId[];
  onToggleDropBoost: (boostId: DropBoosterId) => void;
  onRunDropForge: () => void;
  dropForgeResult: CraftedItem | null;
  autoListDrops: boolean;
  onToggleAutoListDrops: () => void;
  advancedNodeCount: number;
  canForge: boolean;
}) {
  const category = findCategory(draft.category);
  const imagination = getDraftImagination(draft);
  const tags = Array.from(new Set([...getDraftTags(draft), contract.process.importTag]));
  const listedItems = collection.filter((item) => listedTokens.includes(item.assetId));
  const unlockedControls = advancedControlMilestones.filter((milestone) => advancedNodeCount >= milestone.node);
  const loreLine = `${getImaginationLabel("purposes", imagination.purpose)} from ${getImaginationLabel(
    "origins",
    imagination.origin
  )}, marked by ${getImaginationLabel("mysteries", imagination.mystery).toLowerCase()} and ${getImaginationLabel(
    "flaws",
    imagination.flaw
  ).toLowerCase()}.`;
  const sandboxTags = [
    `asset.${draft.category}`,
    `skill.${contract.skill}`,
    `process.${contract.process.id}`,
    `origin.${imagination.origin}`,
    `purpose.${imagination.purpose}`,
    `token.local-off-chain`
  ];
  return (
    <section className="stack-panel">
      <div className="section-heading">
        <p className="overline">Market & Workshop</p>
        <h2>Trade choices, craft identity</h2>
      </div>

      <section className="crafting-choice-panel" aria-label="Crafting style">
        <div className="crafting-mode-toggle" role="tablist" aria-label="Crafting mode">
          <button
            aria-selected={craftingMode === "drop"}
            className={craftingMode === "drop" ? "active" : ""}
            onClick={() => onChooseCraftingMode("drop")}
            role="tab"
            type="button"
          >
            Hephaestus
          </button>
          <button
            aria-selected={craftingMode === "advanced"}
            className={craftingMode === "advanced" ? "active" : ""}
            onClick={() => onChooseCraftingMode("advanced")}
            role="tab"
            type="button"
          >
            Skill Forge
          </button>
        </div>

        {craftingMode === "drop" ? (
          <div className="drop-forge-panel">
            <section className="crafter-service-card" aria-label="Hephaestus crafter service">
              <div className="crafter-sigil" aria-hidden="true">H</div>
              <div>
                <span>{quickCrafter.title}</span>
                <strong>{quickCrafter.bench}</strong>
                <p>{quickCrafter.promise}</p>
              </div>
            </section>

            <div className="crafting-choice-copy">
              <strong>Commission quick gear rolls from {quickCrafter.name}</strong>
              <p>Use offerings to improve visible odds, then auto-list the result if you want a fast market loop. No offering guarantees Masterwork.</p>
            </div>

            <div className="profit-summary-grid" aria-label="Hephaestus commission economy estimate">
              <article>
                <span>Resale estimate</span>
                <strong>{dropEconomy.expectedGross} shells</strong>
              </article>
              <article>
                <span>Net after fee</span>
                <strong>{dropEconomy.expectedNet} shells</strong>
              </article>
              <article>
                <span>Expert+ blessing</span>
                <strong>{dropEconomy.highValueOdds}%</strong>
              </article>
              <article>
                <span>Market speed</span>
                <strong>{dropEconomy.listingSpeed}</strong>
              </article>
            </div>

            <button className={autoListDrops ? "profit-toggle active" : "profit-toggle"} type="button" onClick={onToggleAutoListDrops} aria-pressed={autoListDrops}>
              <span>Auto-list Hephaestus rolls</span>
              <strong>{autoListDrops ? "On" : "Off"}</strong>
              <em>{quickCrafter.fee} shown in net shell estimate</em>
            </button>

            <div className="drop-odds-grid" aria-label="Hephaestus gear roll rarity odds">
              {[...rarityOrder].reverse().map((rarity) => (
                <div className={`drop-odd-row rarity-${rarity.toLowerCase()}`} key={rarity}>
                  <span>{rarity}</span>
                  <i aria-hidden="true">
                    <b style={{ width: `${dropOdds[rarity]}%` }} />
                  </i>
                  <strong>{dropOdds[rarity]}%</strong>
                </div>
              ))}
            </div>
            <div className="drop-booster-grid" aria-label="Hephaestus offerings">
              {dropBoosterOptions.map((booster) => {
                const active = activeDropBoosts.includes(booster.id);
                return (
                  <button
                    aria-pressed={active}
                    className={active ? "drop-booster active" : "drop-booster"}
                    key={booster.id}
                    onClick={() => onToggleDropBoost(booster.id)}
                    type="button"
                  >
                    <span>{booster.label}</span>
                    <strong>{booster.source}</strong>
                    <em>{booster.detail}</em>
                    <small>{booster.marketEffect}</small>
                  </button>
                );
              })}
            </div>
            <div className="action-row">
              <button className="primary-button" type="button" onClick={onRunDropForge}>
                {canForge ? `Ask ${quickCrafter.name} to Forge` : "Collect Supplies"}
              </button>
              {dropForgeResult && (
                <div className="drop-result-card">
                  <span>{autoListDrops ? "Listed roll" : "Last roll"}</span>
                  <strong>{dropForgeResult.rarity} / {getMarketShellPrice(dropForgeResult)} shells</strong>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="advanced-forge-panel">
            <div className="crafting-choice-copy">
              <strong>Advanced crafting by skill, nodes, and customization</strong>
              <p>Use the workshop, path nodes, and forge minigames to control the item instead of letting odds decide.</p>
            </div>
            <div className="advanced-node-meter">
              <span>Current skill path</span>
              <strong>{advancedNodeCount}/100 nodes</strong>
              <i aria-hidden="true">
                <b style={{ width: `${advancedNodeCount}%` }} />
              </i>
            </div>
            <div className="advanced-control-list">
              {advancedControlMilestones.map((milestone) => (
                <span className={advancedNodeCount >= milestone.node ? "unlocked" : ""} key={milestone.label}>
                  {milestone.node} - {milestone.label}
                </span>
              ))}
            </div>
            <p className="microcopy">
              {unlockedControls.length}/{advancedControlMilestones.length} control layers unlocked for {contract.skill}. Advanced outcomes still require the forge trial.
            </p>
          </div>
        )}
      </section>

      <section className="market-panel" aria-label="Item shop">
        <div className="market-copy">
          <span>Item Shop</span>
          <strong>Pay to keep up, not pay to win</strong>
          <p>Boxes and materials save time and unlock more experiments. Item grade still comes from reaction, memory, speed, music, creativity, and the forge trial score.</p>
        </div>
        <div className="market-offers">
          {marketOffers.map((offer) => (
            <article className="market-offer" key={offer.id}>
              <div>
                <h3>{offer.title}</h3>
                <p>{offer.detail}</p>
                <small>{offer.guardrail}</small>
              </div>
              <button className="secondary-button small" type="button" onClick={() => onBuyOffer(offer.title)}>
                {offer.price}
              </button>
            </article>
          ))}
        </div>
        {lootReveal && (
          <div className="loot-reveal" aria-live="polite">
            <div>
              <strong>{lootReveal.offerTitle} opened</strong>
              <span>Odds: common 70%, rare 25%, cosmetic wildcard 5%</span>
            </div>
            <ul>
              {lootReveal.rewards.map((reward) => (
                <li key={reward}>{reward}</li>
              ))}
              {lootReveal.supplyRewards?.map((reward, index) => (
                <li key={`${reward.tier}-${index}`}>
                  <span>+{reward.amount} {reward.label}</span>
                  <small>{reward.lesson}</small>
                </li>
              ))}
            </ul>
            <button className="secondary-button small" type="button" onClick={onClearLootReveal}>
              Stash
            </button>
          </div>
        )}
      </section>

      <section className="harbor-market-panel" aria-label="Local harbor marketplace">
        <div className="market-copy">
          <span>Harbor Market</span>
          <strong>{listedItems.length} local token{listedItems.length === 1 ? "" : "s"} listed</strong>
          <p>Crafted relics carry export metadata, shell prices, and trade requests while staying local and off-chain.</p>
        </div>

        <div className="market-rule-grid" aria-label="Market charter">
          <span>2.5% harbor fee</span>
          <span>skill grade locked</span>
          <span>local off-chain tokens</span>
        </div>

        {listedItems.length > 0 ? (
          <div className="market-listings">
            {listedItems.slice(0, 4).map((item) => (
              <article className="market-listing" key={item.assetId}>
                <WeaponPreview draft={item.draft} compact />
                <div>
                  <div className="listing-title">
                    <h3>{item.draft.name}</h3>
                    <strong>{getMarketShellPrice(item)} shells</strong>
                  </div>
                  <p>{item.rarity} / {item.powerRating} PR / {item.creativity.total} creativity</p>
                  <div className="listing-tags">
                    <span>{getPartLabel("material", item.draft.material)}</span>
                    <span>{item.interoperability.tradeToken.id}</span>
                  </div>
                  <div className="item-actions">
                    <button className="secondary-button small" type="button" onClick={() => onRequestTrade(item)}>
                      Offer
                    </button>
                    <button className="secondary-button small" type="button" onClick={() => onToggleListed(item)}>
                      Unlist
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="market-empty">
            <strong>No local listings yet</strong>
            <p>The harbor board is waiting for its first player-made relic.</p>
          </div>
        )}
      </section>

      <div className="workshop-actions">
        <button className="secondary-button" type="button" onClick={onRandomize}>
          Spark Roll
        </button>
        <button className="secondary-button" type="button" onClick={onFitBrief}>
          Fit Brief
        </button>
      </div>

      <section className="synergy-panel" aria-label="Recipe synergy">
        <div className="synergy-score">
          <span>Live synergy</span>
          <strong>{creativity.total}</strong>
        </div>
        <div className="synergy-bars">
          <Meter label="Novelty" value={creativity.novelty} max={24} />
          <Meter label="Fit" value={creativity.craftFit} max={26} />
          <Meter label="Intent" value={creativity.expression} max={22} />
          <Meter label="Myth" value={creativity.imagination} max={20} />
          <Meter label="Mastery" value={creativity.mastery} max={18} />
        </div>
        <p>
          {targetHitCount}/{contract.targetTags.length} commission tags matched. Better fit raises creativity, but the
          final grade still needs a skill trial.
        </p>
      </section>

      <section className="asset-sandbox-panel" aria-label="Game asset sandbox metadata">
        <div className="asset-sandbox-heading">
          <div>
            <span>Asset Sandbox</span>
            <strong>
              {category.assetSlot} / {draft.subtype}
            </strong>
          </div>
          <em>local token</em>
        </div>
        <p>{loreLine}</p>
        <div className="asset-chip-row">
          {sandboxTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className="imagination-panel" aria-label="Relic imagination recipe">
        <div className="imagination-heading">
          <div>
            <span>Relic Imagination</span>
            <strong>{creativity.imagination}/20 myth depth</strong>
          </div>
          <em>{getImaginationLabel("sensory", imagination.sensory)}</em>
        </div>

        <div className="field-grid">
          <SelectField
            label="Origin isle"
            value={imagination.origin}
            options={imaginationOptions.origins}
            onChange={(value) => onUpdateImagination("origin", value)}
          />
          <SelectField
            label="Mystery"
            value={imagination.mystery}
            options={imaginationOptions.mysteries}
            onChange={(value) => onUpdateImagination("mystery", value)}
          />
          <SelectField
            label="Purpose"
            value={imagination.purpose}
            options={imaginationOptions.purposes}
            onChange={(value) => onUpdateImagination("purpose", value)}
          />
          <SelectField
            label="Flaw"
            value={imagination.flaw}
            options={imaginationOptions.flaws}
            onChange={(value) => onUpdateImagination("flaw", value)}
          />
          <SelectField
            label="Sensory mark"
            value={imagination.sensory}
            options={imaginationOptions.sensory}
            onChange={(value) => onUpdateImagination("sensory", value)}
          />
        </div>

        <label className="text-field">
          <span>Maker oath</span>
          <textarea
            value={imagination.oath}
            onChange={(event) => onUpdateImagination("oath", event.target.value)}
            maxLength={160}
            rows={3}
            placeholder="Give the relic a rule, promise, cost, or warning."
          />
        </label>
      </section>

      <label className="text-field">
        <span>Item name</span>
        <input value={draft.name} onChange={(event) => onUpdateDraft("name", event.target.value)} maxLength={36} />
      </label>

      <div className="field-grid">
        <SelectField
          label="Category"
          value={draft.category}
          options={optionGroups.categories.map((item) => ({ id: item.id, label: item.label }))}
          onChange={(value) => onUpdateCategory(value as CategoryId)}
        />
        <SelectField
          label="Subtype"
          value={draft.subtype}
          options={category.subtypes.map((item) => ({ id: item, label: item }))}
          onChange={(value) => onUpdateDraft("subtype", value)}
        />
        <SelectField
          label="Material"
          value={draft.material}
          options={optionGroups.materials}
          onChange={(value) => onUpdateDraft("material", value)}
        />
        <SelectField label="Edge" value={draft.edge} options={optionGroups.edges} onChange={(value) => onUpdateDraft("edge", value)} />
        <SelectField
          label="Handle"
          value={draft.handle}
          options={optionGroups.handles}
          onChange={(value) => onUpdateDraft("handle", value)}
        />
        <SelectField
          label="Element"
          value={draft.element}
          options={optionGroups.elements}
          onChange={(value) => onUpdateDraft("element", value)}
        />
        <SelectField label="Rune" value={draft.rune} options={optionGroups.runes} onChange={(value) => onUpdateDraft("rune", value)} />
        <SelectField
          label="Finish"
          value={draft.finish}
          options={optionGroups.finishes}
          onChange={(value) => onUpdateDraft("finish", value)}
        />
        <SelectField
          label="Motif"
          value={draft.motif}
          options={optionGroups.motifs}
          onChange={(value) => onUpdateDraft("motif", value)}
        />
      </div>

      <div className="stat-editor">
        {(Object.keys(draft.stats) as Array<keyof ItemDraft["stats"]>).map((stat) => (
          <label className="slider-row" key={stat}>
            <span>
              {stat}
              <strong>{draft.stats[stat]}</strong>
            </span>
            <input min="0" max="100" type="range" value={draft.stats[stat]} onChange={(event) => onUpdateStat(stat, Number(event.target.value))} />
          </label>
        ))}
      </div>

      <label className="text-field">
        <span>Design intent</span>
        <textarea
          value={draft.notes}
          onChange={(event) => onUpdateDraft("notes", event.target.value)}
          maxLength={180}
          rows={3}
          placeholder="Name the combat role, sound, or story behind the item."
        />
      </label>

      <div className="tag-cloud" aria-label="Current import tags">
        {contract.targetTags.map((tag) => (
          <span className={tags.includes(tag) ? "tag hit" : "tag"} key={tag}>
            {tag}
          </span>
        ))}
        {tags.slice(0, 10).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

function CollectionScreen({
  collection,
  lastItem,
  favorites,
  listedTokens,
  onExport,
  onToggleFavorite,
  onToggleListed,
  onRequestTrade,
  onForge
}: {
  collection: CraftedItem[];
  lastItem: CraftedItem | null;
  favorites: string[];
  listedTokens: string[];
  onExport: (item: CraftedItem) => void;
  onToggleFavorite: (assetId: string) => void;
  onToggleListed: (item: CraftedItem) => void;
  onRequestTrade: (item: CraftedItem) => void;
  onForge: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const visibleItems = collection
    .filter((item) => categoryFilter === "all" || item.draft.category === categoryFilter)
    .sort((a, b) => {
      if (sortMode === "power") return b.powerRating - a.powerRating;
      if (sortMode === "creativity") return b.creativity.total - a.creativity.total;
      if (sortMode === "rarity") return rarityRank[b.rarity] - rarityRank[a.rarity];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (collection.length === 0) {
    return (
      <section className="empty-state">
        <Icon name="collection" />
        <h2>No island relics bound yet</h2>
        <button className="primary-button" type="button" onClick={onForge}>
          Light the Forge
        </button>
      </section>
    );
  }

  return (
    <section className="stack-panel">
      <div className="section-heading">
        <p className="overline">Collection</p>
        <h2>{collection.length} saved practice items</h2>
      </div>
      <div className="collection-tools">
        <SelectField
          label="Filter"
          value={categoryFilter}
          options={[{ id: "all", label: "All items" }, ...optionGroups.categories.map((item) => ({ id: item.id, label: item.label }))]}
          onChange={setCategoryFilter}
        />
        <SelectField
          label="Sort"
          value={sortMode}
          options={[
            { id: "newest", label: "Newest" },
            { id: "rarity", label: "Rarity" },
            { id: "power", label: "Power" },
            { id: "creativity", label: "Creativity" }
          ]}
          onChange={setSortMode}
        />
      </div>
      <div className="collection-list">
        {visibleItems.map((item) => {
          const isSaved = favorites.includes(item.assetId);
          const isListed = listedTokens.includes(item.assetId);
          const rarityClass = `rarity-${item.rarity.toLowerCase()}`;

          return (
            <article
              className={["item-card", rarityClass, lastItem?.assetId === item.assetId ? "fresh" : "", isSaved ? "saved" : "", isListed ? "listed" : ""]
                .filter(Boolean)
                .join(" ")}
              key={item.assetId}
            >
              <WeaponPreview draft={item.draft} compact />
              <div className="item-copy">
                <div className="item-title">
                  <h3>{item.draft.name}</h3>
                  <span className="rarity-seal">{isSaved ? `Saved ${item.rarity}` : item.rarity}</span>
                </div>
                <p>{item.assetId}</p>
                <div className="item-meta">
                  <span>{getPartLabel("material", item.draft.material)}</span>
                  <span>{item.powerRating} PR</span>
                  <span>{item.creativity.total} creativity</span>
                  <span>{item.interoperability.tradeToken?.id ?? item.assetId}</span>
                  <span>box {item.interoperability.lootBox?.reward ?? item.contract.reward}</span>
                  {isListed && <span>listed</span>}
                </div>
                <div className="item-actions">
                  <button className="secondary-button small" type="button" onClick={() => onToggleFavorite(item.assetId)}>
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <button className="secondary-button small" type="button" onClick={() => onToggleListed(item)}>
                    {isListed ? "Unlist" : "List"}
                  </button>
                  <button className="secondary-button small" type="button" onClick={() => onRequestTrade(item)}>
                    Trade
                  </button>
                  <button className="secondary-button small" type="button" onClick={() => onExport(item)}>
                    Export
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProfileScreen({
  collection,
  contracts,
  dayKey,
  craftedRouteCount,
  supplies,
  claimedCount,
  activityLog,
  settings,
  challengeSeed,
  challengeContract,
  challengeTarget,
  onUpdateSettings,
  onRollChallenge,
  onCopyChallenge
}: {
  collection: CraftedItem[];
  contracts: HourlyContract[];
  dayKey: string;
  craftedRouteCount: number;
  supplies: SupplyInventory;
  claimedCount: number;
  activityLog: string[];
  settings: PlayerSettings;
  challengeSeed: string;
  challengeContract: HourlyContract;
  challengeTarget: number;
  onUpdateSettings: (patch: Partial<PlayerSettings>) => void;
  onRollChallenge: () => void;
  onCopyChallenge: () => void;
}) {
  const completedToday = collection.filter((item) => item.dayKey === dayKey);
  const rarePlus = supplies.rare + supplies.epic + supplies.legendary;
  const averageCreativity =
    completedToday.length > 0
      ? Math.round(completedToday.reduce((sum, item) => sum + item.creativity.total, 0) / completedToday.length)
      : 0;
  return (
    <section className="stack-panel">
      <div className="section-heading">
        <p className="overline">Isles Record</p>
        <h2>Supply and route ledger</h2>
      </div>
      <div className="profile-grid">
        <Metric label="Routes" value={`${craftedRouteCount}/${contracts.length}`} />
        <Metric label="Supplies" value={`${getTotalSupplies(supplies)}`} />
        <Metric label="Crafted" value={`${completedToday.length}`} />
        <Metric label="Avg creativity" value={`${averageCreativity}`} />
        <Metric label="Masterworks" value={`${completedToday.filter((item) => item.rarity === "Masterwork").length}`} />
        <Metric label="Rare+" value={`${rarePlus}`} />
        <Metric label="Claims" value={`${claimedCount}/4`} />
      </div>
      <SettingsPanel settings={settings} onUpdateSettings={onUpdateSettings} />
      <ChallengePanel
        challengeSeed={challengeSeed}
        contract={challengeContract}
        target={challengeTarget}
        completedToday={completedToday}
        onRollChallenge={onRollChallenge}
        onCopyChallenge={onCopyChallenge}
      />
      <ProcessBoard contracts={contracts} completedToday={completedToday} />
      <section className="activity-panel" aria-label="Recent forge activity">
        <div className="section-heading compact">
          <p className="overline">Forge Log</p>
          <h2>Expedition actions</h2>
        </div>
        {activityLog.length > 0 ? (
          <div className="activity-list">
            {activityLog.slice(0, 6).map((entry, index) => (
              <p key={`${entry}-${index}`}>{entry}</p>
            ))}
          </div>
        ) : (
          <p className="microcopy">Forge, claim, export, or list a relic to start the log.</p>
        )}
      </section>
      <div className="timeline-list">
        {contracts.map((contract) => {
          const item = completedToday.find((crafted) => crafted.hour === contract.hour);
          return (
            <div className={item ? "timeline-row now" : "timeline-row"} key={contract.hour}>
              <span>{contract.label}</span>
              <strong>{item ? item.draft.name : contract.title}</strong>
              <em>{item ? item.rarity : `tier ${contract.difficulty}`}</em>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SettingsPanel({
  settings,
  onUpdateSettings
}: {
  settings: PlayerSettings;
  onUpdateSettings: (patch: Partial<PlayerSettings>) => void;
}) {
  return (
    <section className="settings-panel" aria-label="Mobile comfort settings">
      <div className="section-heading compact">
        <p className="overline">Quality of Life</p>
        <h2>Mobile comfort</h2>
      </div>
      <div className="settings-grid">
        <ToggleRow label="Haptics" value={settings.haptics} onChange={(value) => onUpdateSettings({ haptics: value })} />
        <ToggleRow label="Reduce motion" value={settings.reduceMotion} onChange={(value) => onUpdateSettings({ reduceMotion: value })} />
        <ToggleRow label="High contrast" value={settings.highContrast} onChange={(value) => onUpdateSettings({ highContrast: value })} />
        <ToggleRow label="Large text" value={settings.largeText} onChange={(value) => onUpdateSettings({ largeText: value })} />
        <ToggleRow label="Focus mode" value={settings.focusMode} onChange={(value) => onUpdateSettings({ focusMode: value })} />
      </div>
      <SelectField
        label="Trial pace"
        value={settings.trialPace}
        options={[
          { id: "relaxed", label: "Relaxed timing" },
          { id: "standard", label: "Standard timing" },
          { id: "challenge", label: "Challenge timing" }
        ]}
        onChange={(value) => onUpdateSettings({ trialPace: value as TrialPace })}
      />
    </section>
  );
}

function ChallengePanel({
  challengeSeed,
  contract,
  target,
  completedToday,
  onRollChallenge,
  onCopyChallenge
}: {
  challengeSeed: string;
  contract: HourlyContract;
  target: number;
  completedToday: CraftedItem[];
  onRollChallenge: () => void;
  onCopyChallenge: () => void;
}) {
  const bestSimilar = completedToday
    .filter((item) => item.contract.skill === contract.skill)
    .sort((a, b) => b.trialScore + b.creativity.total - (a.trialScore + a.creativity.total))[0];

  return (
    <section className="challenge-panel" aria-label="Async forge challenge">
      <div>
        <p className="overline">Async Challenge</p>
        <h2>{contract.title}</h2>
        <p>
          Share the seed, forge the same commission, then compare trial score, creativity, and item identity. This is
          async-first social play, so it works without live matchmaking.
        </p>
      </div>
      <div className="challenge-code" aria-label="Challenge seed">
        <span>{challengeSeed}</span>
        <strong>{contract.skill} / target {target}</strong>
      </div>
      <div className="challenge-meta">
        <span>Best local ghost: {bestSimilar ? `${bestSimilar.trialScore} trial / ${bestSimilar.creativity.total} creativity` : "none yet"}</span>
        <span>Skill fairness: score still requires the forge trial</span>
      </div>
      <div className="action-row challenge-actions">
        <button className="secondary-button" type="button" onClick={onRollChallenge}>
          Roll
        </button>
        <button className="primary-button" type="button" onClick={onCopyChallenge}>
          Copy
        </button>
      </div>
    </section>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button className={value ? "toggle-row active" : "toggle-row"} type="button" aria-pressed={value} onClick={() => onChange(!value)}>
      <span>{label}</span>
      <strong>{value ? "On" : "Off"}</strong>
    </button>
  );
}

function ProcessBoard({ contracts, completedToday }: { contracts: HourlyContract[]; completedToday: CraftedItem[] }) {
  const processMilestones = processOptions.slice(0, 5);
  return (
    <div className="process-board" aria-label="Collection process progression">
      {processMilestones.map((process, index) => {
        const routeGroup = contracts.filter((contract) => contract.process.id === process.id);
        const unlocked = routeGroup.length > 0;
        const significant = routeGroup.some((contract) => contract.processImpact === "significant");
        const craftedCount = completedToday.filter((item) => item.contract.process.id === process.id).length;
        const highestTier = routeGroup.reduce((tier, contract) => Math.max(tier, contract.difficulty), index + 1);
        return (
          <article className={[unlocked ? "process-node unlocked" : "process-node", significant ? "significant" : ""].join(" ")} key={process.id}>
            <span>Tier {highestTier}</span>
            <strong>{process.label}</strong>
            <em>{significant ? "high-yield" : index === 0 ? "starter" : "refined"} route</em>
            <small>{craftedCount}/{Math.max(1, routeGroup.length)} items</small>
          </article>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="meter-row">
      <span>{label}</span>
      <div className="mini-meter" aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
