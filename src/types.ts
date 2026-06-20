export type SkillId = "reaction" | "memory" | "speed" | "music" | "creativity" | "math" | "rhythm" | "spatial";

export type CategoryId = "blade" | "tool" | "armor" | "instrument" | "relic";

export type Rarity = "Practice" | "Steady" | "Skilled" | "Expert" | "Masterwork";

export interface CategoryOption {
  id: CategoryId;
  label: string;
  assetSlot: string;
  focus: SkillId;
  subtypes: string[];
  silhouette: string;
}

export interface PartOption {
  id: string;
  label: string;
  tags: string[];
  accent?: string;
}

export interface SkillLesson {
  id: SkillId;
  title: string;
  realWorldSkill: string;
  gameVerb: string;
  tiers: string[];
}

export interface SkillPathDefinition {
  id: SkillId;
  constellation: string;
  accent: string;
  anchor: string;
  thesis: string;
  upgradeSubjects: string[];
  practices: string[];
  mentors: string[];
}

export interface SkillPathNode {
  id: string;
  skill: SkillId;
  index: number;
  title: string;
  upgrade: string;
  practice: string;
  mentor: string;
  tier: number;
  nodeType: "spark" | "technique" | "process" | "mastery" | "legend";
  x: number;
  y: number;
  links: number[];
}

export interface ForgeProcess {
  id: string;
  label: string;
  realWorldSkill: string;
  forgeAction: string;
  importTag: string;
}

export interface HourlyContract {
  hour: number;
  label: string;
  category: CategoryId;
  skill: SkillId;
  difficulty: number;
  process: ForgeProcess;
  processLevel: number;
  processEvent: "added" | "improved" | "practice";
  processImpact: "standard" | "significant";
  title: string;
  prompt: string;
  targetTags: string[];
  reward: string;
}

export interface ImaginationRecipe {
  origin: string;
  mystery: string;
  purpose: string;
  flaw: string;
  sensory: string;
  oath: string;
}

export interface ItemDraft {
  name: string;
  category: CategoryId;
  subtype: string;
  material: string;
  edge: string;
  handle: string;
  element: string;
  rune: string;
  finish: string;
  motif: string;
  notes: string;
  imagination: ImaginationRecipe;
  stats: {
    force: number;
    finesse: number;
    balance: number;
    resonance: number;
  };
}

export interface CreativityBreakdown {
  total: number;
  novelty: number;
  craftFit: number;
  expression: number;
  imagination: number;
  mastery: number;
}

export interface CraftedItem {
  assetId: string;
  assetKind: "hourforge-portable-item";
  createdAt: string;
  dayKey: string;
  hour: number;
  draft: ItemDraft;
  contract: HourlyContract;
  rarity: Rarity;
  trialScore: number;
  creativity: CreativityBreakdown;
  powerRating: number;
  interoperability: {
    assetType: string;
    category: CategoryId;
    importTags: string[];
    slots: string[];
    modelHints: Record<string, string | number>;
    loreSeed: {
      origin: string;
      mystery: string;
      purpose: string;
      flaw: string;
      sensory: string;
      oath: string;
    };
    process: {
      id: string;
      label: string;
      level: number;
      event: "added" | "improved" | "practice";
      impact: "standard" | "significant";
    };
    practiceDesign: {
      monetization: "optional-catch-up-purchases-and-market-fee";
      ownership: "local-file";
      purpose: "skill-practice";
      lootBoxes: "earned-or-purchased-transparent";
      tradeTokens: "local-off-chain";
    };
    monetization: {
      paidPower: false;
      paidLootBoxes: true;
      purchasableMaterials: true;
      forcedAds: false;
      optionalCosmetics: true;
      optionalLessonPacks: true;
      marketplaceFeePercent: number;
      advantageType: "time-and-choice";
      gradeRequiresSkillTrial: true;
    };
    tradeToken: {
      id: string;
      transferable: true;
      network: "local-off-chain";
      realMoneyValue: false;
    };
    lootBox: {
      source: "earned-or-purchased-practice";
      reward: string;
      purchaseable: true;
      oddsVisible: true;
      purchasePurpose: "catch-up-or-material-choice";
    };
    tokenStyle: "local-tradable-practice-token";
    onChain: false;
  };
}
