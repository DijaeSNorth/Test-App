import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export type ForgeSoundCue =
  | "ui"
  | "navigate"
  | "pump"
  | "vent"
  | "forgeStart"
  | "strikeClean"
  | "strikeGood"
  | "strikeMiss"
  | "reward"
  | "loot"
  | "export"
  | "craft"
  | "spark"
  | "fit";

const soundStorageKey = "hourforge.sound-enabled.v1";

type OscillatorTypeName = OscillatorType;

type AmbientNodes = {
  gain: GainNode;
  oscillators: OscillatorNode[];
  noise: AudioBufferSourceNode;
};

function getSavedSoundPreference() {
  return window.localStorage.getItem(soundStorageKey) === "true";
}

function createNoiseBuffer(context: AudioContext, duration = 1.8) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.55;
  }
  return buffer;
}

function envelope(gain: GainNode, now: number, peak: number, attack: number, release: number) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
}

function tone(
  context: AudioContext,
  output: AudioNode,
  frequency: number,
  duration: number,
  options: { type?: OscillatorTypeName; gain?: number; detune?: number; endFrequency?: number } = {}
) {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, now + duration);
  }
  oscillator.detune.value = options.detune ?? 0;
  envelope(gain, now, options.gain ?? 0.05, 0.012, duration);
  oscillator.connect(gain).connect(output);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.04);
}

function noiseHit(
  context: AudioContext,
  output: AudioNode,
  duration: number,
  options: { gain?: number; frequency?: number; q?: number; type?: BiquadFilterType } = {}
) {
  const now = context.currentTime;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createNoiseBuffer(context, duration);
  filter.type = options.type ?? "bandpass";
  filter.frequency.value = options.frequency ?? 900;
  filter.Q.value = options.q ?? 0.8;
  envelope(gain, now, options.gain ?? 0.04, 0.015, duration);
  source.connect(filter).connect(gain).connect(output);
  source.start(now);
  source.stop(now + duration + 0.04);
}

export function useForgeAudio() {
  const [enabled, setEnabled] = useState(getSavedSoundPreference);
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const ambientRef = useRef<AmbientNodes | null>(null);

  const ensureContext = useCallback(async () => {
    if (!contextRef.current) {
      const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      const context = new AudioContextCtor();
      const master = context.createGain();
      master.gain.value = 0.62;
      master.connect(context.destination);
      contextRef.current = context;
      masterRef.current = master;
    }

    if (contextRef.current.state !== "running") {
      await contextRef.current.resume();
    }

    if (!masterRef.current) return null;
    return { context: contextRef.current, master: masterRef.current };
  }, []);

  const stopAmbient = useCallback(() => {
    const ambient = ambientRef.current;
    if (!ambient) return;
    const context = contextRef.current;
    const now = context?.currentTime ?? 0;
    ambient.gain.gain.cancelScheduledValues(now);
    ambient.gain.gain.setTargetAtTime(0.0001, now, 0.12);
    window.setTimeout(() => {
      ambient.oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // Already stopped.
        }
      });
      try {
        ambient.noise.stop();
      } catch {
        // Already stopped.
      }
    }, 220);
    ambientRef.current = null;
  }, []);

  const startAmbient = useCallback(async () => {
    const audio = await ensureContext();
    if (!audio) return;
    const { context, master } = audio;
    if (ambientRef.current) return;

    const ambientGain = context.createGain();
    ambientGain.gain.value = 0.0001;

    const lowDrone = context.createOscillator();
    const emberDrone = context.createOscillator();
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();

    lowDrone.type = "sine";
    lowDrone.frequency.value = 58;
    emberDrone.type = "triangle";
    emberDrone.frequency.value = 116;
    emberDrone.detune.value = -9;

    noise.buffer = createNoiseBuffer(context, 3.2);
    noise.loop = true;
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 420;
    noiseFilter.Q.value = 0.7;
    noiseGain.gain.value = 0.024;

    lowDrone.connect(ambientGain);
    emberDrone.connect(ambientGain);
    noise.connect(noiseFilter).connect(noiseGain).connect(ambientGain);
    ambientGain.connect(master);

    const now = context.currentTime;
    ambientGain.gain.setTargetAtTime(0.038, now, 0.55);
    lowDrone.start(now);
    emberDrone.start(now);
    noise.start(now);

    ambientRef.current = { gain: ambientGain, oscillators: [lowDrone, emberDrone], noise };
  }, [ensureContext]);

  const play = useCallback(
    async (cue: ForgeSoundCue) => {
      if (!enabled) return;
      const audio = await ensureContext();
      if (!audio) return;
      const { context, master } = audio;
      if (!ambientRef.current) {
        void startAmbient();
      }
      const output = master;

      switch (cue) {
        case "ui":
          tone(context, output, 740, 0.08, { type: "triangle", gain: 0.025, endFrequency: 980 });
          break;
        case "navigate":
          tone(context, output, 360, 0.09, { type: "sine", gain: 0.018, endFrequency: 440 });
          break;
        case "pump":
          noiseHit(context, output, 0.32, { gain: 0.07, frequency: 260, q: 0.5, type: "lowpass" });
          tone(context, output, 92, 0.22, { type: "sine", gain: 0.035, endFrequency: 122 });
          break;
        case "vent":
          noiseHit(context, output, 0.46, { gain: 0.075, frequency: 1800, q: 0.75, type: "highpass" });
          tone(context, output, 220, 0.18, { type: "triangle", gain: 0.018, endFrequency: 140 });
          break;
        case "forgeStart":
          tone(context, output, 128, 0.18, { type: "sine", gain: 0.05, endFrequency: 82 });
          tone(context, output, 940, 0.22, { type: "triangle", gain: 0.035, endFrequency: 540 });
          noiseHit(context, output, 0.12, { gain: 0.05, frequency: 760, q: 1.2 });
          break;
        case "strikeClean":
          tone(context, output, 1180, 0.18, { type: "triangle", gain: 0.042, endFrequency: 760 });
          tone(context, output, 1760, 0.12, { type: "sine", gain: 0.018 });
          break;
        case "strikeGood":
          tone(context, output, 820, 0.16, { type: "triangle", gain: 0.034, endFrequency: 640 });
          break;
        case "strikeMiss":
          tone(context, output, 210, 0.16, { type: "sawtooth", gain: 0.028, endFrequency: 120 });
          noiseHit(context, output, 0.15, { gain: 0.034, frequency: 430, q: 0.8 });
          break;
        case "reward":
          [0, 0.07, 0.14].forEach((offset, index) => {
            window.setTimeout(() => tone(context, output, [523, 659, 880][index], 0.2, { type: "sine", gain: 0.026 }), offset * 1000);
          });
          break;
        case "loot":
          noiseHit(context, output, 0.38, { gain: 0.045, frequency: 2200, q: 1.1, type: "bandpass" });
          tone(context, output, 620, 0.22, { type: "triangle", gain: 0.028, endFrequency: 1240 });
          break;
        case "export":
          tone(context, output, 440, 0.12, { type: "sine", gain: 0.03 });
          tone(context, output, 880, 0.18, { type: "triangle", gain: 0.024 });
          break;
        case "craft":
          tone(context, output, 96, 0.24, { type: "sine", gain: 0.055, endFrequency: 128 });
          tone(context, output, 1320, 0.28, { type: "triangle", gain: 0.032, endFrequency: 990 });
          noiseHit(context, output, 0.18, { gain: 0.045, frequency: 920, q: 1.4 });
          break;
        case "spark":
          tone(context, output, 740, 0.1, { type: "triangle", gain: 0.025, endFrequency: 1420 });
          noiseHit(context, output, 0.2, { gain: 0.026, frequency: 2400, q: 1.5 });
          break;
        case "fit":
          tone(context, output, 330, 0.11, { type: "sine", gain: 0.023 });
          tone(context, output, 495, 0.13, { type: "sine", gain: 0.023 });
          break;
      }
    },
    [enabled, ensureContext, startAmbient]
  );

  const toggle = useCallback(async () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    window.localStorage.setItem(soundStorageKey, String(nextEnabled));
    if (nextEnabled) {
      const audio = await ensureContext();
      if (!audio) return;
      const { context, master } = audio;
      await startAmbient();
      tone(context, master, 523, 0.16, { type: "sine", gain: 0.028 });
      window.setTimeout(() => tone(context, master, 784, 0.18, { type: "triangle", gain: 0.024 }), 80);
    } else {
      stopAmbient();
    }
  }, [enabled, ensureContext, startAmbient, stopAmbient]);

  useEffect(() => {
    window.localStorage.setItem(soundStorageKey, String(enabled));
    if (!enabled) {
      stopAmbient();
    }
  }, [enabled, stopAmbient]);

  useEffect(() => {
    return () => {
      stopAmbient();
      void contextRef.current?.close();
    };
  }, [stopAmbient]);

  return { enabled, play, toggle };
}
