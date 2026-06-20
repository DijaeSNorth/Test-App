import type { CSSProperties } from "react";
import { findCategory, findOption, materialOptions, elementOptions, runeOptions } from "../gameData";
import type { ItemDraft } from "../types";

interface WeaponPreviewProps {
  draft: ItemDraft;
  compact?: boolean;
}

export function WeaponPreview({ draft, compact = false }: WeaponPreviewProps) {
  const category = findCategory(draft.category);
  const material = findOption(materialOptions, draft.material);
  const element = findOption(elementOptions, draft.element);
  const rune = findOption(runeOptions, draft.rune);
  const metal = material.accent ?? "#c8d0d8";
  const glow = element.accent ?? "#ff7a2a";
  const attunement = [
    ["force", draft.stats.force],
    ["finesse", draft.stats.finesse],
    ["balance", draft.stats.balance],
    ["resonance", draft.stats.resonance]
  ] as const;

  return (
    <div className={compact ? "weapon-preview compact" : "weapon-preview"}>
      {!compact && (
        <>
          <div className="forge-ambience" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="attunement-lattice" aria-hidden="true">
            {attunement.map(([stat, value]) => (
              <span
                className={`attune-bar ${stat}`}
                key={stat}
                style={{ "--level": `${value}%`, "--attune-color": glow } as CSSProperties}
              />
            ))}
          </div>
        </>
      )}
      <span className={`weapon-art category-${category.id}`} role="img" aria-label={`${draft.name} ${category.label} art`} />
      <svg className="weapon-vector" viewBox="0 0 280 280" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`glow-${draft.element}`} cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.45" />
            <stop offset="70%" stopColor={glow} stopOpacity="0.08" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`metal-${draft.material}`} x1="0%" x2="100%">
            <stop offset="0%" stopColor="#eef4f2" />
            <stop offset="45%" stopColor={metal} />
            <stop offset="100%" stopColor="#5d686f" />
          </linearGradient>
        </defs>
        <circle cx="140" cy="138" r="116" fill={`url(#glow-${draft.element})`} />
        <circle cx="140" cy="140" r="88" fill="none" stroke={glow} strokeOpacity="0.22" strokeWidth="2" />
        {category.id === "blade" && <BladeShape metal={`url(#metal-${draft.material})`} glow={glow} />}
        {category.id === "tool" && <ToolShape metal={`url(#metal-${draft.material})`} glow={glow} />}
        {category.id === "armor" && <ArmorShape metal={`url(#metal-${draft.material})`} glow={glow} />}
        {category.id === "instrument" && <InstrumentShape metal={`url(#metal-${draft.material})`} glow={glow} />}
        {category.id === "relic" && <RelicShape metal={`url(#metal-${draft.material})`} glow={glow} />}
        <g className="rune-marks" stroke={glow} strokeWidth="4" strokeLinecap="round">
          <path d="M116 209l12-10 12 10 12-10 12 10" />
          <path d="M128 74l12-10 12 10" opacity="0.8" />
          <circle cx="140" cy="140" r="8" fill={glow} opacity="0.7" />
        </g>
      </svg>
      {!compact && (
        <div className="preview-caption">
          <span>{draft.subtype}</span>
          <strong>{rune.label}</strong>
          <em>{material.label} / {element.label}</em>
        </div>
      )}
    </div>
  );
}

function BladeShape({ metal, glow }: { metal: string; glow: string }) {
  return (
    <g>
      <path d="M140 31c20 40 29 75 22 111l-22 54-22-54c-7-36 2-71 22-111Z" fill={metal} />
      <path d="M140 46v137" stroke="#ffffff" strokeOpacity="0.42" strokeWidth="3" />
      <path d="M93 190h94l-14 18H107l-14-18Z" fill="#2b3436" stroke={glow} strokeOpacity="0.6" />
      <path d="M129 205h22l10 38h-42l10-38Z" fill="#5b4031" />
    </g>
  );
}

function ToolShape({ metal, glow }: { metal: string; glow: string }) {
  return (
    <g>
      <path d="M78 83c29-29 64-32 104-10l-20 26c-24-8-45-5-64 14L78 83Z" fill={metal} />
      <path d="M142 98l26 24-82 91-29-26 85-89Z" fill="#5b4031" />
      <path d="M159 77l47 45-26 26-47-45 26-26Z" fill={metal} stroke={glow} strokeOpacity="0.7" />
    </g>
  );
}

function ArmorShape({ metal, glow }: { metal: string; glow: string }) {
  return (
    <g>
      <path
        d="M140 42c29 22 59 28 83 29-2 78-29 127-83 165C86 198 59 149 57 71c24-1 54-7 83-29Z"
        fill={metal}
        stroke={glow}
        strokeOpacity="0.5"
        strokeWidth="4"
      />
      <path d="M140 61v153" stroke="#1d2424" strokeOpacity="0.36" strokeWidth="5" />
      <path d="M84 103h112M91 144h98" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="4" />
    </g>
  );
}

function InstrumentShape({ metal, glow }: { metal: string; glow: string }) {
  return (
    <g>
      <path d="M112 54c45 25 71 65 77 121-25 28-62 36-99 18-19-53-12-100 22-139Z" fill={metal} />
      <circle cx="133" cy="141" r="30" fill="#181e1d" stroke={glow} strokeWidth="5" />
      <path d="M91 88c37 39 69 82 97 129" stroke="#2d3535" strokeWidth="10" strokeLinecap="round" />
      <path d="M112 78c37 42 62 86 74 132" stroke="#f6eee0" strokeOpacity="0.7" strokeWidth="2" />
    </g>
  );
}

function RelicShape({ metal, glow }: { metal: string; glow: string }) {
  return (
    <g>
      <path d="M140 37l75 74-75 132-75-132 75-74Z" fill={metal} stroke={glow} strokeOpacity="0.6" strokeWidth="4" />
      <circle cx="140" cy="127" r="45" fill="#151b1a" stroke={glow} strokeWidth="6" />
      <path d="M112 127h56M140 99v56" stroke={glow} strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}
