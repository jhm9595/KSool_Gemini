window.KSool = window.KSool || {};

class AudioService {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('ksool_sound_muted') === 'true';
    const savedVol = localStorage.getItem('ksool_sound_volume');
    this.volume = savedVol !== null ? Math.max(0, Math.min(1, parseFloat(savedVol))) : 0.7;

    // 🏮 타이쿤 전용 주막 재즈/퓨전 국악 BGM 시퀀서 상태
    this.isBgmEnabled = localStorage.getItem('ksool_tycoon_bgm_enabled') !== 'false';
    this._bgmActive = false;
    this._bgmTimer = null;
    this._bgmStep = 0;
    this._bgmNextNoteTime = 0;
    this._bgmMasterGain = null;
    this._bgmWave = 1;
  }

  _getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  getVolume() {
    return this.volume;
  }

  getVolumePercent() {
    return Math.round(this.volume * 100);
  }

  isMutedState() {
    return this.isMuted || this.volume <= 0;
  }

  getEffectiveVolume() {
    if (this.isMutedState()) return 0;
    // 인체 청각 인지(Logarithmic) 특성에 맞춘 볼륨 보정 커브
    return Math.pow(this.volume, 1.5);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol)));
    if (this.volume === 0) {
      this.isMuted = true;
    } else if (this.isMuted && this.volume > 0) {
      this.isMuted = false;
    }
    try {
      localStorage.setItem('ksool_sound_volume', String(this.volume));
      localStorage.setItem('ksool_sound_muted', String(this.isMuted));
    } catch (_) {}
    this._syncBgmMasterVolume();
    return this.volume;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (!this.isMuted && this.volume === 0) {
      this.volume = 0.5;
      try {
        localStorage.setItem('ksool_sound_volume', '0.5');
      } catch (_) {}
    }
    try {
      localStorage.setItem('ksool_sound_muted', String(this.isMuted));
    } catch (_) {}
    this._syncBgmMasterVolume();
    return this.isMuted;
  }

  toggleTycoonBgm() {
    this.isBgmEnabled = !this.isBgmEnabled;
    try {
      localStorage.setItem('ksool_tycoon_bgm_enabled', String(this.isBgmEnabled));
    } catch (_) {}
    if (!this.isBgmEnabled) {
      this.stopTycoonBgm();
    }
    return this.isBgmEnabled;
  }

  setTycoonBgmWave(wave = 1) {
    this._bgmWave = Math.max(1, Number(wave) || 1);
  }

  _syncBgmMasterVolume() {
    if (this._bgmMasterGain && this.ctx) {
      const target = (this._bgmActive && this.isBgmEnabled) ? this.getEffectiveVolume() * 0.42 : 0.0001;
      try {
        this._bgmMasterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06);
      } catch (_) {
        this._bgmMasterGain.gain.value = target;
      }
    }
  }

  /**
   * 🏮 조선 주막 라운지 재즈 & 가야금 퓨전 BGM 시작
   * - 외부 음원 파일 없이 Web Audio API 멀티트랙(가야금 플럭 리드 + 로즈 일렉트릭 피아노 재즈 코드 + 어쿠스틱 워킹 베이스 + 브러시 스윙 드럼)을
   *   실시간 Lookahead 스케줄러로 연주합니다.
   */
  startTycoonBgm(wave = 1) {
    this._bgmWave = Math.max(1, Number(wave) || 1);
    if (!this.isBgmEnabled) return;
    const ctx = this._getContext();
    if (!ctx) return;

    if (this._bgmActive) {
      this._syncBgmMasterVolume();
      return;
    }

    this._bgmActive = true;
    this._bgmStep = 0;
    this._bgmNextNoteTime = ctx.currentTime + 0.05;

    if (!this._bgmMasterGain) {
      this._bgmMasterGain = ctx.createGain();
      // 부드러운 공간감을 위한 스테레오 딜레이(에코) 버스 연결
      const delay = ctx.createDelay(0.5);
      delay.delayTime.value = 0.24;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.22;
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.18;
      const delayFilter = ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 1800;

      this._bgmMasterGain.connect(ctx.destination);
      this._bgmMasterGain.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(wetGain);
      wetGain.connect(ctx.destination);
      delayFilter.connect(feedback);
      feedback.connect(delay);
    }

    this._syncBgmMasterVolume();

    if (this._bgmTimer) clearInterval(this._bgmTimer);
    this._bgmTimer = setInterval(() => {
      if (!this._bgmActive || !this.ctx) return;
      while (this._bgmNextNoteTime < this.ctx.currentTime + 0.16) {
        this._scheduleTycoonBgmStep(this._bgmStep, this._bgmNextNoteTime);
        this._advanceTycoonBgmStep();
      }
    }, 40);
  }

  stopTycoonBgm() {
    this._bgmActive = false;
    if (this._bgmTimer) {
      clearInterval(this._bgmTimer);
      this._bgmTimer = null;
    }
    if (this._bgmMasterGain && this.ctx) {
      try {
        this._bgmMasterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      } catch (_) {}
    }
  }

  _advanceTycoonBgmStep() {
    // 기본 108 BPM (웨이브가 올라갈수록 살짝 경쾌해짐, 최대 122 BPM)
    const bpm = Math.min(122, 108 + (this._bgmWave - 1) * 2.5);
    const sixteenth = (60 / bpm) / 4;
    // 재즈 스윙 필(Swing Feel): 짝수 스텝은 살짝 길게, 홀수 스텝은 살짝 짧게
    const swingOffset = (this._bgmStep % 2 === 0) ? sixteenth * 1.16 : sixteenth * 0.84;
    this._bgmNextNoteTime += swingOffset;
    this._bgmStep = (this._bgmStep + 1) % 64; // 4마디(64스텝) 루프, 매 사이클 변주 포함
  }

  _midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  _scheduleTycoonBgmStep(step, t) {
    if (this.isMutedState() || !this.isBgmEnabled || !this._bgmMasterGain) return;

    const bar = Math.floor(step / 16); // 0, 1, 2, 3
    const stepInBar = step % 16;

    // 4마디 재즈 코드 진행: Dm9 -> G13 -> Cmaj9 -> A7alt (따뜻하고 세련된 선술집/주막 무드)
    const chordVoicings = [
      [62, 65, 69, 72, 76], // Dm9 (D4, F4, A4, C5, E5)
      [59, 64, 65, 69, 74], // G13 (B3, E4, F4, A4, D5)
      [60, 64, 67, 71, 74], // Cmaj9 (C4, E4, G4, B4, D5)
      [57, 61, 67, 70, 74]  // A7(#9/b13) -> Dm9로 감칠맛 나게 연결
    ];

    // 4마디 어쿠스틱 워킹 베이스 라인 (마디당 8분음표/4분음표 그루브)
    const bassPattern = [
      // Bar 0 (Dm9)
      [38, 0.35], null, null, [41, 0.18], [45, 0.35], null, [48, 0.22], null,
      [50, 0.35], null, null, [48, 0.18], [45, 0.32], null, [42, 0.22], null,
      // Bar 1 (G13)
      [43, 0.35], null, null, [47, 0.18], [50, 0.35], null, [43, 0.22], null,
      [41, 0.35], null, null, [43, 0.18], [45, 0.32], null, [47, 0.22], null,
      // Bar 2 (Cmaj9)
      [36, 0.35], null, null, [40, 0.18], [43, 0.35], null, [47, 0.22], null,
      [48, 0.35], null, null, [47, 0.18], [43, 0.32], null, [40, 0.22], null,
      // Bar 3 (A7 -> Turnaround)
      [45, 0.35], null, null, [49, 0.18], [52, 0.35], null, [49, 0.22], null,
      [45, 0.32], null, [43, 0.24], null, [41, 0.24], null, [39, 0.24], null
    ];

    // 4마디 가야금/거문고 펜타토닉 + 블루노트 주막 멜로디 (64스텝)
    const melodyPattern = [
      // Bar 0: 흥겨운 도입부 (A5 - G5 - E5 - D5 - E5 - G5)
      81, null, 79, 76, 74, null, 76, null,
      79, null, 81, null, 76, null, null, null,
      // Bar 1: 주막의 정취 (D5 - E5 - G5 - A5 - B5 - A5 - G5 - E5)
      74, null, 76, null, 79, 81, 83, null,
      81, null, 79, 76, 74, null, null, null,
      // Bar 2: 서정적인 선율 (E5 - G5 - A5 - C6 - B5 - G5 - E5)
      76, null, 79, null, 81, null, 84, null,
      83, null, 79, null, 76, null, 74, 72,
      // Bar 3: 멋스러운 농현 마무리 (A4 - C5 - D5 - E5 - G5 - E5 - D5)
      69, null, 72, null, 74, 76, 79, null,
      76, 74, 72, null, 74, null, null, null
    ];

    // 1) 어쿠스틱 워킹 베이스
    const bassNote = bassPattern[step];
    if (bassNote) {
      this._playJazzBassNote(this._midiToFreq(bassNote[0]), t, bassNote[1]);
    }

    // 2) 따뜻한 로즈 일렉트릭 피아노 재즈 코드 컴핑 (마디 내 싱코페이션 리듬)
    const chord = chordVoicings[bar];
    if (stepInBar === 0 || stepInBar === 6 || stepInBar === 11) {
      const dur = stepInBar === 0 ? 0.55 : (stepInBar === 6 ? 0.38 : 0.42);
      const vel = stepInBar === 0 ? 0.16 : 0.12;
      this._playWarmRhodesChord(chord, t, dur, vel);
    }

    // 3) 국악 가야금 플럭 멜로디 (농현 비브라토 포함)
    const melMidi = melodyPattern[step];
    if (melMidi) {
      this._playGayageumPluck(this._midiToFreq(melMidi), t, 0.36);
      // 간헐적 옥타브 아래 화음 뜯기 (가야금 특유의 풍성한 울림)
      if (stepInBar === 0 || stepInBar === 8) {
        this._playGayageumPluck(this._midiToFreq(melMidi - 12), t + 0.018, 0.42, 0.55);
      }
    }

    // 4) 라운지 브러시 & 장구 스윙 퍼커션
    // 킥 드럼 (부드러운 우드 킥)
    if (stepInBar === 0 || stepInBar === 8 || (bar === 3 && stepInBar === 14)) {
      this._playSoftKick(t);
    }
    // 스윙 라이드 심벌 & 브러시 하이햇 (재즈 라이드 패턴: 0, 4, 7, 8, 12, 15)
    if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
      this._playBrushHat(t, 0.08, 0.07);
    } else if (stepInBar === 7 || stepInBar === 15) {
      this._playBrushHat(t, 0.045, 0.05);
    }
    // 림샷/장구 딱 소리 (백비트 4, 12)
    if (stepInBar === 4 || stepInBar === 12) {
      this._playWoodRim(t);
    }
  }

  _playJazzBassNote(freq, t, dur = 0.32) {
    const ctx = this.ctx;
    if (!ctx || !this._bgmMasterGain) return;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, t);
    filter.frequency.exponentialRampToValueAtTime(190, t + dur);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.34, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this._bgmMasterGain);

    osc.start(t);
    sub.start(t);
    osc.stop(t + dur + 0.02);
    sub.stop(t + dur + 0.02);
  }

  _playWarmRhodesChord(midiArray, t, dur = 0.45, velocity = 0.14) {
    const ctx = this.ctx;
    if (!ctx || !this._bgmMasterGain) return;

    midiArray.forEach((midi, idx) => {
      const freq = this._midiToFreq(midi);
      const osc = ctx.createOscillator();
      const bellOsc = ctx.createOscillator();
      const gain = ctx.createGain();
      const bellGain = ctx.createGain();

      const startT = t + idx * 0.008; // 살짝 아르페지오 스트럼 느낌
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      // 로즈 특유의 은은한 배음(Tine Bell)
      bellOsc.type = 'triangle';
      bellOsc.frequency.setValueAtTime(freq * 2, startT);

      gain.gain.setValueAtTime(0.001, startT);
      gain.gain.linearRampToValueAtTime(velocity * 0.45, startT + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0008, startT + dur);

      bellGain.gain.setValueAtTime(velocity * 0.12, startT);
      bellGain.gain.exponentialRampToValueAtTime(0.0005, startT + 0.09);

      osc.connect(gain);
      bellOsc.connect(bellGain);
      bellGain.connect(gain);
      gain.connect(this._bgmMasterGain);

      osc.start(startT);
      bellOsc.start(startT);
      osc.stop(startT + dur + 0.03);
      bellOsc.stop(startT + 0.11);
    });
  }

  _playGayageumPluck(freq, t, dur = 0.35, scale = 1.0) {
    const ctx = this.ctx;
    if (!ctx || !this._bgmMasterGain) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // 가야금 현을 뜯을 때의 어택 피치 벤드 & 은은한 농현(Vibrato)
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq * 1.025, t);
    osc1.frequency.exponentialRampToValueAtTime(freq, t + 0.025);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);

    // 현의 공명 필터 (밝게 시작해 따뜻하게 감쇠)
    filter.type = 'lowpass';
    filter.Q.value = 2.4;
    filter.frequency.setValueAtTime(freq * 5.5, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.3, t + dur);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22 * scale, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this._bgmMasterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur + 0.02);
    osc2.stop(t + dur + 0.02);
  }

  _playSoftKick(t) {
    const ctx = this.ctx;
    if (!ctx || !this._bgmMasterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(gain);
    gain.connect(this._bgmMasterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  _playWoodRim(t) {
    const ctx = this.ctx;
    if (!ctx || !this._bgmMasterGain) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(760, t);
    osc.frequency.exponentialRampToValueAtTime(310, t + 0.045);
    filter.type = 'bandpass';
    filter.frequency.value = 920;
    filter.Q.value = 2.2;
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this._bgmMasterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  _playBrushHat(t, dur = 0.06, vol = 0.06) {
    const ctx = this.ctx;
    if (!ctx || !this._bgmMasterGain) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(this._bgmMasterGain);
    src.start(t);
  }

  vibrate(pattern = 15) {
    if (navigator && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }

  /**
   * 은박지(복권) 긁는 소리: 짧은 고주파 노이즈 + 불규칙한 바스락 스파이크
   */
  playScratch(intensity = 1) {
    const effVol = this.getEffectiveVolume();
    if (effVol <= 0) return;
    const ctx = this._getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.07 + Math.random() * 0.06;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin(Math.PI * i / len);
      const crackle = Math.random() < 0.14 ? 1 : 0.32;
      data[i] = (Math.random() * 2 - 1) * env * crackle;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600 + Math.random() * 1400;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 5200 + Math.random() * 2800;
    bp.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.26 * effVol * intensity;
    src.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playTap() {
    const effVol = this.getEffectiveVolume();
    if (effVol <= 0) return;
    this.vibrate(10);
    const ctx = this._getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.06);
    gain.gain.setValueAtTime(0.12 * effVol, now);
    gain.gain.linearRampToValueAtTime(0.01 * effVol, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playSuccess() {
    const effVol = this.getEffectiveVolume();
    if (effVol <= 0) return;
    this.vibrate([30, 50, 60]);
    const ctx = this._getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.18 * effVol, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001 * effVol, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  playFail() {
    const effVol = this.getEffectiveVolume();
    if (effVol <= 0) return;
    this.vibrate([40, 40, 40]);
    const ctx = this._getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);
    gain.gain.setValueAtTime(0.15 * effVol, now);
    gain.gain.linearRampToValueAtTime(0.01 * effVol, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

class StorageService {
  constructor() {
    this.KEY = 'ksool_alchemy_v2_state';
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  saveState(stateObj) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(stateObj));
    } catch (e) {}
  }

  clearState() {
    try {
      localStorage.removeItem(this.KEY);
    } catch (e) {}
  }
}

window.KSool.AudioService = AudioService;
window.KSool.StorageService = StorageService;
