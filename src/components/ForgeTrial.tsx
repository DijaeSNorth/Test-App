import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { ForgeSoundCue } from "../audio";
import type { HourlyContract, ItemDraft } from "../types";
import { Icon } from "./Icons";
import { WeaponPreview } from "./WeaponPreview";

type TrialPace = "relaxed" | "standard" | "challenge";

interface ForgeTrialProps {
  contract: HourlyContract;
  draft: ItemDraft;
  forgeHeat: number;
  heatTarget: number;
  heatBonus: number;
  trialPace?: TrialPace;
  onComplete: (score: number) => void;
  onClose: () => void;
  onSound?: (cue: ForgeSoundCue) => void;
}

function paceMultiplier(pace: TrialPace) {
  if (pace === "relaxed") return 1.24;
  if (pace === "challenge") return 0.88;
  return 1;
}

function paceLabel(pace: TrialPace) {
  if (pace === "relaxed") return "relaxed timing";
  if (pace === "challenge") return "challenge timing";
  return "standard timing";
}

export function ForgeTrial({ contract, draft, forgeHeat, heatTarget, heatBonus, trialPace = "standard", onComplete, onClose, onSound }: ForgeTrialProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="trial-title">
      <div className="trial-modal">
        <div className="modal-titlebar">
          <div>
            <p className="overline">Tier {contract.difficulty} lesson</p>
            <h2 id="trial-title">{contract.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close trial">
            <Icon name="close" />
          </button>
        </div>
        <div className="trial-heat-note">
          <span>Heat {forgeHeat}%</span>
          <strong>
            target {heatTarget}% / final score {heatBonus >= 0 ? "+" : ""}
            {heatBonus}
          </strong>
          <em>{paceLabel(trialPace)}</em>
        </div>
        {(contract.skill === "reaction" || contract.skill === "speed") && (
          <ReactionTrial contract={contract} draft={draft} trialPace={trialPace} onComplete={onComplete} onSound={onSound} />
        )}
        {contract.skill === "math" && <RatioTrial contract={contract} onComplete={onComplete} onSound={onSound} />}
        {(contract.skill === "rhythm" || contract.skill === "memory" || contract.skill === "music") && (
          <RhythmTrial contract={contract} trialPace={trialPace} onComplete={onComplete} onSound={onSound} />
        )}
        {(contract.skill === "spatial" || contract.skill === "creativity") && (
          <BalanceTrial contract={contract} onComplete={onComplete} onSound={onSound} />
        )}
      </div>
    </div>
  );
}

type ForgeTarget = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type TapFeedback = {
  targetId: string;
  score: number;
  tone: "clean" | "good" | "miss";
  nonce: number;
};

const forgeTargets: ForgeTarget[] = [
  { id: "edge", label: "Edge", x: 50, y: 27 },
  { id: "core", label: "Core", x: 50, y: 49 },
  { id: "rune", label: "Rune", x: 65, y: 59 },
  { id: "grip", label: "Grip", x: 50, y: 76 }
];

function ReactionTrial({
  contract,
  draft,
  trialPace,
  onComplete,
  onSound
}: {
  contract: HourlyContract;
  draft: ItemDraft;
  trialPace: TrialPace;
  onComplete: (score: number) => void;
  onSound?: (cue: ForgeSoundCue) => void;
}) {
  const [stepStartedAt, setStepStartedAt] = useState<number | null>(null);
  const [hits, setHits] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<TapFeedback | null>(null);
  const stepDuration = Math.max(680, Math.round((1580 - contract.difficulty * 150) * paceMultiplier(trialPace)));
  const sequence = useMemo(
    () =>
      Array.from({ length: Math.min(5, contract.difficulty + 2) }, (_, index) => {
        return forgeTargets[(contract.hour + contract.difficulty + index * 2) % forgeTargets.length];
      }),
    [contract]
  );
  const currentTarget = sequence[hits.length] ?? sequence[sequence.length - 1];

  function startChain() {
    onSound?.("forgeStart");
    setHits([]);
    setScore(null);
    setFeedback(null);
    setStepStartedAt(performance.now());
  }

  function tapTarget(target: ForgeTarget) {
    if (!stepStartedAt || score !== null) return;
    const elapsed = performance.now() - stepStartedAt;
    const phase = (elapsed % stepDuration) / stepDuration;
    const timingError = Math.abs(phase - 0.58);
    const timingScore = Math.max(0, 100 - timingError * (240 + contract.difficulty * 26));
    const partPenalty = target.id === currentTarget.id ? 0 : 38;
    const nextScore = Math.max(5, Math.round(timingScore - partPenalty));
    const nextHits = [...hits, nextScore];
    const tone = nextScore >= 78 ? "clean" : nextScore >= 48 ? "good" : "miss";
    onSound?.(tone === "clean" ? "strikeClean" : tone === "good" ? "strikeGood" : "strikeMiss");
    setHits(nextHits);
    setFeedback({ targetId: target.id, score: nextScore, tone, nonce: nextHits.length });
    setStepStartedAt(performance.now());
    if (nextHits.length >= sequence.length) {
      const averageScore = Math.round(nextHits.reduce((sum, hit) => sum + hit, 0) / nextHits.length);
      setScore(averageScore);
      window.setTimeout(() => onComplete(averageScore), 550);
    }
  }

  return (
    <div className="trial-body">
      <p className="lesson-copy">
        {contract.skill === "speed"
          ? "Speed training: tap the glowing part of the item as the forge pulse lands."
          : "Reaction training: wait for the pulse, then tap the called part of the forged item."}
      </p>

      <div className="forge-target-stage">
        <WeaponPreview draft={draft} />
        <div className="target-overlay" aria-label="Forged item tap targets">
          {forgeTargets.map((target) => {
            const active = stepStartedAt !== null && target.id === currentTarget.id && score === null;
            const impact = feedback?.targetId === target.id ? feedback.tone : "";
            return (
              <button
                key={target.id}
                className={["tap-target", active ? "active" : "", impact ? `impact ${impact}` : ""].join(" ")}
                style={{ left: `${target.x}%`, top: `${target.y}%`, animationDuration: `${stepDuration}ms` }}
                type="button"
                disabled={!stepStartedAt || score !== null}
                onClick={() => tapTarget(target)}
                aria-label={`Tap ${target.label}`}
              >
                <span>{target.label}</span>
                {feedback?.targetId === target.id && (
                  <i className="target-impact" key={`${target.id}-${feedback.nonce}`}>
                    {feedback.score}
                  </i>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="strike-sequence" aria-label="Forge strike order">
        {sequence.map((target, index) => {
          const state = index < hits.length ? "hit" : stepStartedAt && index === hits.length && score === null ? "current" : "pending";

          return (
            <span className={["sequence-chip", state].join(" ")} key={`${target.id}-${index}`}>
              <i>{index + 1}</i>
              {target.label}
            </span>
          );
        })}
      </div>

      <div className="target-readout">
        <span>Next part</span>
        <strong>{stepStartedAt ? currentTarget.label : "Heat item"}</strong>
        <em>{feedback ? `${feedback.tone} ${feedback.score}` : `${hits.length}/${sequence.length} strikes`}</em>
      </div>

      <div className={stepStartedAt && score === null ? "timing-window-lane active" : "timing-window-lane"} aria-label="Strike timing window">
        <span>early</span>
        <strong>crest</strong>
        <span>late</span>
        <i style={{ animationDuration: `${stepDuration}ms` }} />
      </div>

      <div className="trial-actions">
        <button className="secondary-button" type="button" onClick={startChain} disabled={score !== null}>
          {stepStartedAt ? "Restart" : "Heat Item"}
        </button>
        <button className="primary-button" type="button" onClick={() => tapTarget(currentTarget)} disabled={!stepStartedAt || score !== null}>
          Tap Cue
        </button>
      </div>
      {hits.length > 0 && (
        <div className="hit-chain">
          {hits.map((hit, index) => (
            <span key={`${hit}-${index}`}>{hit}</span>
          ))}
        </div>
      )}
      {score !== null && <ScoreFeedback label="Strike chain" score={score} />}
    </div>
  );
}

function RatioTrial({
  contract,
  onComplete,
  onSound
}: {
  contract: HourlyContract;
  onComplete: (score: number) => void;
  onSound?: (cue: ForgeSoundCue) => void;
}) {
  const target = useMemo(() => {
    const iron = 42 + contract.difficulty * 5;
    const carbon = 18 + ((contract.hour + contract.difficulty) % 18);
    return { iron, carbon, aether: 100 - iron - carbon };
  }, [contract]);
  const [mix, setMix] = useState({ iron: 45, carbon: 25, aether: 30 });
  const [score, setScore] = useState<number | null>(null);

  function update(key: keyof typeof mix, value: number) {
    setMix((current) => ({ ...current, [key]: value }));
  }

  function pour() {
    onSound?.("vent");
    const total = mix.iron + mix.carbon + mix.aether || 1;
    const normalized = {
      iron: Math.round((mix.iron / total) * 100),
      carbon: Math.round((mix.carbon / total) * 100),
      aether: Math.round((mix.aether / total) * 100)
    };
    const error =
      Math.abs(normalized.iron - target.iron) +
      Math.abs(normalized.carbon - target.carbon) +
      Math.abs(normalized.aether - target.aether);
    const nextScore = Math.max(5, Math.round(100 - error * (1.35 + contract.difficulty * 0.14)));
    setScore(nextScore);
    window.setTimeout(() => onComplete(nextScore), 450);
  }

  return (
    <div className="trial-body">
      <p className="lesson-copy">
        Mental math: match {target.iron}% iron, {target.carbon}% carbon, {target.aether}% aether.
      </p>
      <Slider label="Iron" value={mix.iron} onChange={(value) => update("iron", value)} />
      <Slider label="Carbon" value={mix.carbon} onChange={(value) => update("carbon", value)} />
      <Slider label="Aether" value={mix.aether} onChange={(value) => update("aether", value)} />
      <button className="primary-button wide" type="button" onClick={pour} disabled={score !== null}>
        Pour Alloy
      </button>
      {score !== null && <ScoreFeedback label="Alloy" score={score} />}
    </div>
  );
}

function RhythmTrial({
  contract,
  trialPace,
  onComplete,
  onSound
}: {
  contract: HourlyContract;
  trialPace: TrialPace;
  onComplete: (score: number) => void;
  onSound?: (cue: ForgeSoundCue) => void;
}) {
  const pads = ["Anvil", "Quench", "Bellows", "Rune"];
  const sequence = useMemo(
    () => Array.from({ length: contract.difficulty + 3 }, (_, index) => pads[(contract.hour + index * 2 + contract.difficulty) % pads.length]),
    [contract]
  );
  const [cursor, setCursor] = useState(0);
  const [started, setStarted] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState<number | null>(null);

  function tap(label: string) {
    if (done !== null) return;
    const firstStart = started ?? performance.now();
    if (!started) setStarted(firstStart);
    const expected = sequence[cursor];
    const nextMisses = label === expected ? misses : misses + 1;
    onSound?.(label === expected ? "strikeGood" : "strikeMiss");
    const nextCursor = cursor + 1;
    setMisses(nextMisses);
    setCursor(nextCursor);
    if (nextCursor >= sequence.length) {
      const elapsed = performance.now() - firstStart;
      const speedBonus = Math.max(0, 18 - Math.floor(elapsed / (650 * paceMultiplier(trialPace))));
      const nextScore = Math.max(5, Math.round(100 - nextMisses * (18 + contract.difficulty * 2) + speedBonus));
      setDone(nextScore);
      window.setTimeout(() => onComplete(nextScore), 450);
    }
  }

  return (
    <div className="trial-body">
      <p className="lesson-copy">
        {contract.skill === "memory"
          ? "Memory training: repeat the forge sequence in order."
          : "Music training: echo the rune rhythm and keep the tempo steady."}
      </p>
      <div className="sequence-strip">
        {sequence.map((step, index) => (
          <span key={`${step}-${index}`} className={index < cursor ? "sequence-step done" : "sequence-step"}>
            {step}
          </span>
        ))}
      </div>
      <div className="pad-grid">
        {pads.map((pad) => (
          <button type="button" className="pad-button" key={pad} onClick={() => tap(pad)}>
            {pad}
          </button>
        ))}
      </div>
      {done !== null && <ScoreFeedback label="Rhythm" score={done} />}
    </div>
  );
}

function BalanceTrial({
  contract,
  onComplete,
  onSound
}: {
  contract: HourlyContract;
  onComplete: (score: number) => void;
  onSound?: (cue: ForgeSoundCue) => void;
}) {
  const statKeys = ["force", "finesse", "balance", "resonance"] as const;
  type TrialStat = (typeof statKeys)[number];
  const target = useMemo(
    (): Record<TrialStat, number> => ({
      force: 42 + contract.difficulty * 8,
      finesse: 72 - contract.difficulty * 4,
      balance: 48 + ((contract.hour * 7) % 24),
      resonance: 40 + contract.difficulty * 7
    }),
    [contract]
  );
  const [stats, setStats] = useState<Record<TrialStat, number>>({ force: 55, finesse: 55, balance: 55, resonance: 55 });
  const [score, setScore] = useState<number | null>(null);

  function tune() {
    onSound?.("fit");
    const error = statKeys.reduce((sum, key) => sum + Math.abs(stats[key] - target[key]), 0);
    const nextScore = Math.max(5, Math.round(100 - error * (0.7 + contract.difficulty * 0.08)));
    setScore(nextScore);
    window.setTimeout(() => onComplete(nextScore), 450);
  }

  return (
    <div className="trial-body">
      <p className="lesson-copy">Spatial reasoning: match the target shape across four forge stats.</p>
      {statKeys.map((key) => (
        <Slider
          key={key}
          label={`${key} -> ${target[key]}`}
          value={stats[key]}
          onChange={(value) => setStats((current) => ({ ...current, [key]: value }))}
        />
      ))}
      <button className="primary-button wide" type="button" onClick={tune} disabled={score !== null}>
        Set Balance
      </button>
      {score !== null && <ScoreFeedback label="Balance" score={score} />}
    </div>
  );
}

function scoreText(score: number) {
  if (score >= 90) return "mastery";
  if (score >= 75) return "clean";
  if (score >= 55) return "steady";
  return "practice";
}

function ScoreFeedback({ label, score }: { label: string; score: number }) {
  return (
    <p className="trial-score">
      {label} score {score} - {scoreText(score)}
    </p>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="slider-row">
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input
        min="0"
        max="100"
        value={value}
        type="range"
        style={{ "--value": `${value}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
