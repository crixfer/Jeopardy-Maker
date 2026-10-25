// Web Audio API Synthesizer with granular volume controls and multi-track Game Show background music

export interface AudioSettings {
  isMuted: boolean;
  masterVolume: number; // 0.0 to 1.0
  correctVolume: number; // 0.0 to 1.0
  wrongVolume: number; // 0.0 to 1.0
  timerVolume: number; // 0.0 to 1.0
  buzzerVolume: number; // 0.0 to 1.0
  musicVolume: number; // 0.0 to 1.0
  musicMode: 'during_questions' | 'always' | 'off';
  musicTrack: 'auto' | 'think_classic' | 'arcade_groove' | 'mystery_wonders' | 'brassy_swing';
}

const DEFAULT_SETTINGS: AudioSettings = {
  isMuted: false,
  masterVolume: 0.8,
  correctVolume: 0.9,
  wrongVolume: 0.8,
  timerVolume: 0.7,
  buzzerVolume: 0.9,
  musicVolume: 0.45,
  musicMode: 'during_questions',
  musicTrack: 'auto',
};

let audioCtx: AudioContext | null = null;
let currentSettings: AudioSettings = { ...DEFAULT_SETTINGS };

// Music sequencer state
let musicInterval: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;
let isMusicActive = false;
let currentActiveTrack = 'think_classic';
let musicMasterGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getEffectiveVolume(typeVolume: number): number {
  if (currentSettings.isMuted) return 0;
  return Math.max(0, Math.min(1, currentSettings.masterVolume * typeVolume));
}

export const soundManager = {
  getSettings(): AudioSettings {
    return { ...currentSettings };
  },

  updateSettings(newSettings: Partial<AudioSettings>) {
    currentSettings = { ...currentSettings, ...newSettings };
    try {
      localStorage.setItem('edujeopardy_audio_settings', JSON.stringify(currentSettings));
    } catch {}

    // Update music gain live
    if (musicMasterGain && audioCtx) {
      const vol = getEffectiveVolume(currentSettings.musicVolume);
      musicMasterGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
    }
  },

  getIsMuted(): boolean {
    return currentSettings.isMuted;
  },

  setIsMuted(muted: boolean) {
    this.updateSettings({ isMuted: muted });
  },

  initSound() {
    try {
      const saved = localStorage.getItem('edujeopardy_audio_settings');
      if (saved) {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    getAudioContext();
  },

  // Correct Answer: Celebratory major chord arpeggio
  playCorrect() {
    const vol = getEffectiveVolume(currentSettings.correctVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.28 * vol, ctx.currentTime + index * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.08);
      osc.stop(ctx.currentTime + index * 0.08 + 0.45);
    });
  },

  // On-Fire Streak Sound: Escalating blazing whoosh & power chord
  playStreakFire(streak: number = 2) {
    const vol = getEffectiveVolume(currentSettings.correctVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Sizzling flame whoosh with noise buffer
    try {
      const bufferSize = ctx.sampleRate * 0.35;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800 + Math.min(streak * 200, 1600), ctx.currentTime + 0.3);
      filter.Q.value = 3.5;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.3 * vol, ctx.currentTime + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(ctx.currentTime);
      whiteNoise.stop(ctx.currentTime + 0.36);
    } catch {}

    // Blazing fanfare power chord
    const baseFreqs = streak >= 5 ? [587.33, 739.99, 880.0, 1174.66] : streak >= 3 ? [523.25, 659.25, 783.99, 1046.5] : [440.0, 554.37, 659.25];
    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = streak >= 5 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.08 + idx * 0.06);

      gain.gain.setValueAtTime(0, ctx.currentTime + 0.08 + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.25 * vol, ctx.currentTime + 0.08 + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08 + idx * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + 0.08 + idx * 0.06);
      osc.stop(ctx.currentTime + 0.08 + idx * 0.06 + 0.5);
    });
  },

  // Wrong Answer: Game show buzz

  playWrong() {
    const vol = getEffectiveVolume(currentSettings.wrongVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    // Dissonant low frequencies
    osc1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
    osc2.frequency.setValueAtTime(123.47, ctx.currentTime); // B2

    gain.gain.setValueAtTime(0.28 * vol, ctx.currentTime);
    gain.gain.setValueAtTime(0.28 * vol, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.28 * vol, ctx.currentTime + 0.26);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.7);
    osc2.stop(ctx.currentTime + 0.7);
  },

  // Buzzer Hit: Punchy arcade tone
  playBuzzer() {
    const vol = getEffectiveVolume(currentSettings.buzzerVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  },

  // Time Running Low Tick: Crisp woodblock tick (last 5 seconds)
  playTimeLowTick(speedUp: boolean = false) {
    const vol = getEffectiveVolume(currentSettings.timerVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(speedUp ? 1200 : 880, ctx.currentTime);

    gain.gain.setValueAtTime(0.25 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  },

  // Time Up: Round expired alarm
  playTimeUp() {
    const vol = getEffectiveVolume(currentSettings.timerVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    [0, 0.15, 0.3].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime + offset);

      gain.gain.setValueAtTime(0.28 * vol, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.13);
    });
  },

  // Card Flip / Select
  playFlip() {
    const vol = getEffectiveVolume(currentSettings.buzzerVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  },

  // Team Connected Chime in Waiting Room
  playTeamJoinedChime() {
    const vol = getEffectiveVolume(currentSettings.correctVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25 * vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  },

  // Daily Double Fanfare
  playDailyDouble() {
    const vol = getEffectiveVolume(currentSettings.correctVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.3 * vol, ctx.currentTime + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.5);
    });
  },

  // Game Victory Fanfare
  playVictory() {
    const vol = getEffectiveVolume(currentSettings.correctVolume);
    if (vol <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.4 },
      { f: 783.99, d: 0.4 },
      { f: 1046.5, d: 0.8 },
    ];

    let t = ctx.currentTime;
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35 * vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d + 0.05;
    });
  },

  // ==========================================
  // Game Show Background Music Sequencer
  // ==========================================

  selectTrackForGame(gameIdOrTitle: string): string {
    if (currentSettings.musicTrack !== 'auto') {
      return currentSettings.musicTrack;
    }
    // Auto map game themes
    const lower = gameIdOrTitle.toLowerCase();
    if (lower.includes('stem') || lower.includes('space') || lower.includes('tech') || lower.includes('cosmic')) {
      return 'arcade_groove';
    }
    if (lower.includes('history') || lower.includes('geography') || lower.includes('wonders')) {
      return 'mystery_wonders';
    }
    if (lower.includes('riddle') || lower.includes('puzzle') || lower.includes('math')) {
      return 'brassy_swing';
    }
    return 'think_classic';
  },

  startMusic(trackName?: string) {
    if (currentSettings.musicMode === 'off') return;
    const ctx = getAudioContext();
    if (!ctx) return;

    this.stopMusic();

    const track = trackName || currentActiveTrack;
    currentActiveTrack = track;
    isMusicActive = true;
    musicStep = 0;

    // Master gain for music
    musicMasterGain = ctx.createGain();
    const vol = getEffectiveVolume(currentSettings.musicVolume);
    musicMasterGain.gain.setValueAtTime(vol, ctx.currentTime);
    musicMasterGain.connect(ctx.destination);

    // Tempo in ms per 16th/8th note
    const tempoMap: Record<string, number> = {
      think_classic: 240, // ~125 BPM
      arcade_groove: 200, // ~150 BPM
      mystery_wonders: 300, // ~100 BPM
      brassy_swing: 220, // ~136 BPM
    };
    const stepInterval = tempoMap[track] || 240;

    // Start playback loop
    musicInterval = setInterval(() => {
      this.playMusicStep(track);
      musicStep = (musicStep + 1) % 32;
    }, stepInterval);
  },

  stopMusic() {
    isMusicActive = false;
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
    if (musicMasterGain && audioCtx) {
      try {
        musicMasterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      } catch {}
    }
  },

  isMusicPlaying(): boolean {
    return isMusicActive;
  },

  playMusicStep(track: string) {
    const ctx = getAudioContext();
    const masterGain = musicMasterGain;
    if (!ctx || !masterGain || currentSettings.isMuted) return;

    const step = musicStep;

    switch (track) {
      case 'arcade_groove': {
        // Upbeat 80s arcade synth groove (C minor / Eb)
        const bassNotes = [130.81, 0, 130.81, 155.56, 174.61, 0, 174.61, 196.0]; // C3, Eb3, F3, G3
        const leadNotes = [523.25, 0, 622.25, 0, 698.46, 783.99, 622.25, 0];

        const bassFreq = bassNotes[step % bassNotes.length];
        if (bassFreq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(bassFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }

        const leadFreq = leadNotes[step % leadNotes.length];
        if (leadFreq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(leadFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        }
        break;
      }

      case 'mystery_wonders': {
        // Atmospheric curiosity melody (A minor)
        const chords = [
          [220, 261.63, 329.63], // Am
          [174.61, 220, 261.63], // F
          [196, 246.94, 293.66], // G
          [164.81, 207.65, 246.94], // E
        ];
        const chordIndex = Math.floor(step / 8) % chords.length;
        const noteIndex = step % 3;
        const freq = chords[chordIndex][noteIndex];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        break;
      }

      case 'brassy_swing': {
        // Bright TV game show swing rhythm (F major)
        const swingBass = [87.31, 0, 109.99, 130.81, 146.83, 0, 130.81, 109.99]; // F2, A2, C3, D3
        const bFreq = swingBass[step % swingBass.length];
        if (bFreq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(bFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start();
          osc.stop(ctx.currentTime + 0.24);
        }

        // Brass stab every 4 steps
        if (step % 4 === 2) {
          [349.23, 440, 523.25].forEach((stabFreq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(stabFreq, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            osc.stop(ctx.currentTime + 0.17);
          });
        }
        break;
      }

      case 'think_classic':
      default: {
        // Classic Jeopardy 'Think!' cue syncopation (C Major thinking staccato)
        // Melody: C5, F5, C5, F4, C5, F5, C5...
        const thinkMelody = [
          523.25, 0, 698.46, 0, 523.25, 0, 349.23, 0,
          523.25, 0, 698.46, 0, 523.25, 0, 0, 0,
          523.25, 0, 698.46, 0, 783.99, 0, 698.46, 0,
          659.25, 0, 587.33, 0, 523.25, 0, 0, 0,
        ];

        const mFreq = thinkMelody[step];
        if (mFreq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(mFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.14, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }

        // Ticking metronome accompaniment
        if (step % 2 === 0) {
          const tickOsc = ctx.createOscillator();
          const tickGain = ctx.createGain();
          tickOsc.type = 'sine';
          tickOsc.frequency.setValueAtTime(step % 8 === 0 ? 800 : 400, ctx.currentTime);
          tickGain.gain.setValueAtTime(0.04, ctx.currentTime);
          tickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          tickOsc.connect(tickGain);
          tickGain.connect(masterGain);
          tickOsc.start();
          tickOsc.stop(ctx.currentTime + 0.05);
        }
        break;
      }
    }
  },
};
