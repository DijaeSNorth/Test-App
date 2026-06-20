import {
  categoryOptions,
  edgeOptions,
  elementOptions,
  findCategory,
  findOption,
  finishOptions,
  handleOptions,
  imaginationOptions,
  materialOptions,
  motifOptions,
  runeOptions
} from "./gameData";
import type { CraftedItem, CreativityBreakdown, HourlyContract, ImaginationRecipe, ItemDraft, Rarity } from "./types";

export function getDefaultImagination(contract: HourlyContract): ImaginationRecipe {
  return {
    origin: imaginationOptions.origins[contract.hour % imaginationOptions.origins.length].id,
    mystery: imaginationOptions.mysteries[(contract.hour + contract.difficulty) % imaginationOptions.mysteries.length].id,
    purpose: imaginationOptions.purposes[(contract.hour + 2) % imaginationOptions.purposes.length].id,
    flaw: imaginationOptions.flaws[(contract.hour + 3) % imaginationOptions.flaws.length].id,
    sensory: imaginationOptions.sensory[(contract.hour + 4) % imaginationOptions.sensory.length].id,
    oath: ""
  };
}

export function getDraftImagination(draft: ItemDraft): ImaginationRecipe {
  return {
    origin: draft.imagination?.origin ?? imaginationOptions.origins[0].id,
    mystery: draft.imagination?.mystery ?? imaginationOptions.mysteries[0].id,
    purpose: draft.imagination?.purpose ?? imaginationOptions.purposes[0].id,
    flaw: draft.imagination?.flaw ?? imaginationOptions.flaws[0].id,
    sensory: draft.imagination?.sensory ?? imaginationOptions.sensory[0].id,
    oath: draft.imagination?.oath ?? ""
  };
}

export function getImaginationLabel(type: keyof typeof imaginationOptions, id: string) {
  return findOption(imaginationOptions[type], id).label;
}

export function getImaginationTags(draft: ItemDraft) {
  const imagination = getDraftImagination(draft);
  const facets = [
    findOption(imaginationOptions.origins, imagination.origin),
    findOption(imaginationOptions.mysteries, imagination.mystery),
    findOption(imaginationOptions.purposes, imagination.purpose),
    findOption(imaginationOptions.flaws, imagination.flaw),
    findOption(imaginationOptions.sensory, imagination.sensory)
  ];
  const oathTags = imagination.oath
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4)
    .slice(0, 4)
    .map((word) => `oath.${word}`);
  return Array.from(new Set([...facets.flatMap((facet) => facet.tags), ...oathTags]));
}

export function createInitialDraft(contract: HourlyContract): ItemDraft {
  const category = findCategory(contract.category);
  const material = materialOptions[(contract.hour + contract.difficulty) % materialOptions.length];
  const element = elementOptions[(contract.hour + 2) % elementOptions.length];

  return {
    name: `${contract.title}`,
    category: category.id,
    subtype: category.subtypes[contract.hour % category.subtypes.length],
    material: material.id,
    edge: edgeOptions[contract.hour % edgeOptions.length].id,
    handle: handleOptions[(contract.hour + 1) % handleOptions.length].id,
    element: element.id,
    rune: runeOptions[(contract.hour + 2) % runeOptions.length].id,
    finish: finishOptions[(contract.hour + 3) % finishOptions.length].id,
    motif: motifOptions[(contract.hour + 4) % motifOptions.length].id,
    notes: "",
    imagination: getDefaultImagination(contract),
    stats: {
      force: 50 + contract.difficulty * 4,
      finesse: 48,
      balance: 52,
      resonance: 44 + contract.difficulty * 3
    }
  };
}

export function getDraftTags(draft: ItemDraft) {
  const category = findCategory(draft.category);
  const parts = [
    findOption(materialOptions, draft.material),
    findOption(edgeOptions, draft.edge),
    findOption(handleOptions, draft.handle),
    findOption(elementOptions, draft.element),
    findOption(runeOptions, draft.rune),
    findOption(finishOptions, draft.finish),
    findOption(motifOptions, draft.motif)
  ];
  return Array.from(new Set([category.silhouette, ...parts.flatMap((part) => part.tags), ...getImaginationTags(draft)]));
}

export function scoreCreativity(
  draft: ItemDraft,
  contract: HourlyContract,
  trialScore: number
): CreativityBreakdown {
  const tags = Array.from(new Set([...getDraftTags(draft), contract.process.importTag]));
  const uniqueParts = new Set([
    draft.category,
    draft.subtype,
    draft.material,
    draft.edge,
    draft.handle,
    draft.element,
    draft.rune,
    draft.finish,
    draft.motif
  ]).size;
  const tagHits = contract.targetTags.filter((tag) =>
    tags.some((draftTag) => draftTag.includes(tag) || tag.includes(draftTag))
  ).length;
  const statSpread = Math.max(...Object.values(draft.stats)) - Math.min(...Object.values(draft.stats));
  const named = draft.name.trim().length >= 6 ? 10 : 0;
  const noteScore = Math.min(12, Math.floor(draft.notes.trim().length / 8));
  const imagination = getDraftImagination(draft);
  const imaginativeFacets = [imagination.origin, imagination.mystery, imagination.purpose, imagination.flaw, imagination.sensory].filter(Boolean).length;
  const oathScore = Math.min(6, Math.floor(imagination.oath.trim().length / 10));
  const expression = Math.min(22, named + noteScore);
  const imaginationScore = Math.min(20, imaginativeFacets * 3 + oathScore);
  const novelty = Math.min(24, uniqueParts * 2 + Math.max(0, 8 - Math.floor(statSpread / 10)));
  const craftFit = Math.min(26, tagHits * 7 + (draft.category === contract.category ? 5 : 0));
  const mastery = Math.min(18, Math.round(trialScore * 0.18));

  return {
    novelty,
    craftFit,
    expression,
    imagination: imaginationScore,
    mastery,
    total: Math.min(100, novelty + craftFit + expression + imaginationScore + mastery)
  };
}

export function rarityFromScore(score: number): Rarity {
  if (score >= 95) return "Masterwork";
  if (score >= 84) return "Expert";
  if (score >= 70) return "Skilled";
  if (score >= 52) return "Steady";
  return "Practice";
}

export function stableHash(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

export function createCraftedItem(
  draft: ItemDraft,
  contract: HourlyContract,
  dayKey: string,
  trialScore: number
): CraftedItem {
  const creativity = scoreCreativity(draft, contract, trialScore);
  const rating = Math.round(creativity.total * 0.65 + trialScore * 0.35 + contract.difficulty * 3);
  const rarity = rarityFromScore(Math.min(100, rating));
  const category = findCategory(draft.category);
  const tags = Array.from(
    new Set([
      ...getDraftTags(draft),
      contract.process.importTag,
      `process.level.${contract.processLevel}`,
      "loot.earned-or-purchased",
      "token.local-tradable"
    ])
  );
  const imagination = getDraftImagination(draft);
  const loreSeed = {
    origin: getImaginationLabel("origins", imagination.origin),
    mystery: getImaginationLabel("mysteries", imagination.mystery),
    purpose: getImaginationLabel("purposes", imagination.purpose),
    flaw: getImaginationLabel("flaws", imagination.flaw),
    sensory: getImaginationLabel("sensory", imagination.sensory),
    oath: imagination.oath.trim()
  };
  const hash = stableHash(JSON.stringify({ dayKey, hour: contract.hour, draft, rating }));
  const tradeTokenId = `HFT-${dayKey.replace(/-/g, "")}-${String(contract.hour).padStart(2, "0")}-${hash}`;

  return {
    assetId: `HF-${dayKey.replace(/-/g, "")}-${String(contract.hour).padStart(2, "0")}-${hash}`,
    assetKind: "hourforge-portable-item",
    createdAt: new Date().toISOString(),
    dayKey,
    hour: contract.hour,
    draft,
    contract,
    rarity,
    trialScore,
    creativity,
    powerRating: Math.min(120, rating),
    interoperability: {
      assetType: category.assetSlot,
      category: draft.category,
      importTags: tags,
      slots: ["name", "category", "subtype", "material", "visualRecipe", "stats", "lore", "imagination", "makerOath", "grade"],
      modelHints: {
        silhouette: category.silhouette,
        material: findOption(materialOptions, draft.material).label,
        edge: findOption(edgeOptions, draft.edge).label,
        element: findOption(elementOptions, draft.element).label,
        loreOrigin: loreSeed.origin,
        lorePurpose: loreSeed.purpose,
        loreFlaw: loreSeed.flaw,
        color: findOption(elementOptions, draft.element).accent ?? "#ff7a2a",
        scale: 1,
        difficulty: contract.difficulty
      },
      loreSeed,
      process: {
        id: contract.process.id,
        label: contract.process.label,
        level: contract.processLevel,
        event: contract.processEvent,
        impact: contract.processImpact
      },
      practiceDesign: {
        monetization: "optional-catch-up-purchases-and-market-fee",
        ownership: "local-file",
        purpose: "skill-practice",
        lootBoxes: "earned-or-purchased-transparent",
        tradeTokens: "local-off-chain"
      },
      monetization: {
        paidPower: false,
        paidLootBoxes: true,
        purchasableMaterials: true,
        forcedAds: false,
        optionalCosmetics: true,
        optionalLessonPacks: true,
        marketplaceFeePercent: 2.5,
        advantageType: "time-and-choice",
        gradeRequiresSkillTrial: true
      },
      tradeToken: {
        id: tradeTokenId,
        transferable: true,
        network: "local-off-chain",
        realMoneyValue: false
      },
      lootBox: {
        source: "earned-or-purchased-practice",
        reward: contract.reward,
        purchaseable: true,
        oddsVisible: true,
        purchasePurpose: "catch-up-or-material-choice"
      },
      tokenStyle: "local-tradable-practice-token",
      onChain: false
    }
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getPartLabel(type: "material" | "edge" | "handle" | "element" | "rune" | "finish" | "motif", id: string) {
  const map = {
    material: materialOptions,
    edge: edgeOptions,
    handle: handleOptions,
    element: elementOptions,
    rune: runeOptions,
    finish: finishOptions,
    motif: motifOptions
  };
  return findOption(map[type], id).label;
}

export const optionGroups = {
  categories: categoryOptions,
  materials: materialOptions,
  edges: edgeOptions,
  handles: handleOptions,
  elements: elementOptions,
  runes: runeOptions,
  finishes: finishOptions,
  motifs: motifOptions
};
