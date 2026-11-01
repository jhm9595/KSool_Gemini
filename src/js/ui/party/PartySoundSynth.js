window.KSool = window.KSool || {};

/**
 * 오프라인 술자리 소음 속에서도 귀에 쏙 꽂히는 Web Audio API 신디사이저
 * 외부 오디오 파일 없이 순수 브라우저 오디오 오실레이터로 고출력 효과음 합성
 */
class PartySoundSynth {
  constructor() {
    this.ctx = null;
    this.pourOsc = null;
    this.pourGain = null;
    this.isMuted = false;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTap() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playSuccess() {
    this.playUp();
  }

  playUp() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playDown() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playMetalHit(strainRatio = 0.5) {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // 고주파 메탈 핑 소리 + 피로도에 따라 음정 상승
    const baseFreq = 950 + strainRatio * 600;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.08);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.1);
    osc2.stop(now + 0.1);
  }

  playSnap() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // 철사 꼬다리 뚝 끊어지는 날카로운 소리
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  startPour() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx || this.pourOsc) return;
    const now = this.ctx.currentTime;
    this.pourOsc = this.ctx.createOscillator();
    this.pourGain = this.ctx.createGain();
    this.pourOsc.type = 'triangle';
    this.pourOsc.frequency.setValueAtTime(380, now);
    this.pourGain.gain.setValueAtTime(0.12, now);
    this.pourOsc.connect(this.pourGain);
    this.pourGain.connect(this.ctx.destination);
    this.pourOsc.start(now);
  }

  updatePour(heightRatio) {
    if (!this.pourOsc || !this.ctx) return;
    // 잔이 찰수록 매끄럽게 음정 상승 (380Hz ~ 700Hz)
    const targetFreq = 380 + heightRatio * 320;
    this.pourOsc.frequency.setValueAtTime(targetFreq, this.ctx.currentTime);
  }

  stopPour() {
    if (this.pourOsc && this.ctx) {
      try {
        if (this.pourGain) {
          this.pourGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        }
        this.pourOsc.stop(this.ctx.currentTime + 0.05);
      } catch (_) {}
      this.pourOsc = null;
      this.pourGain = null;
    }
  }

  playPour(duration = 0.8) {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + duration);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  playCurtainReveal() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // 화려하게 올라가는 커튼 오픈 사운드 아르페지오 (도-미-솔-도)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.18, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.25);
    });
  }

  playHeartbeat() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // 쿵... 쿵... 저주파 심장박동
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playTick() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playSpinWhir() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.4);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.43);
  }

  playExplosion() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. 깊은 저음 폭발
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // 2. 고주파 사이렌 비프
    const sirenOsc = this.ctx.createOscillator();
    const sirenGain = this.ctx.createGain();
    sirenOsc.type = 'square';
    sirenOsc.frequency.setValueAtTime(880, now + 0.1);
    sirenOsc.frequency.setValueAtTime(1100, now + 0.25);
    sirenOsc.frequency.setValueAtTime(880, now + 0.4);
    sirenGain.gain.setValueAtTime(0.3, now + 0.1);
    sirenGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    sirenOsc.connect(sirenGain);
    sirenGain.connect(this.ctx.destination);
    sirenOsc.start(now + 0.1);
    sirenOsc.stop(now + 0.65);
  }
}

window.KSool.PartySoundSynth = PartySoundSynth;
