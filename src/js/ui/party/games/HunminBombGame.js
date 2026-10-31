window.KSool = window.KSool || {};

/**
 * ⑤ 훈민정음 3초 초성 타이머 (폭탄 돌리기형)
 * 술자리 고전 게임인 훈민정음을 폰을 타이머 폭탄 삼아 진행하는 게임.
 * 무작위 초성 2개가 크게 뜨고 3초 안에 육성으로 단어를 외치고 화면을 탭해 다음 사람에게 넘김.
 */
class HunminBombGame {
  constructor(hub) {
    this.hub = hub;
    this.timerSeconds = 3.0; // 3초 기준
    this.remainingTime = 3.0;
    this.currentCho = 'ㄱ ㅂ';
    this.timerId = null;
    this.isExploded = false;
    this.passCount = 0;
    this.baseTimeSetting = 3.0; // 3초 or 4초

    // 한국어 초성 쌍 풀 (자주 쓰이는 흥미로운 초성 40여 종)
    this.choPool = [
      'ㄱ ㅂ', 'ㅅ ㅈ', 'ㅁ ㄱ', 'ㅇ ㄷ', 'ㅂ ㅂ', 'ㅊ ㄱ', 'ㅎ ㅅ', 'ㅈ ㄷ',
      'ㄱ ㅅ', 'ㄴ ㅂ', 'ㄷ ㅂ', 'ㅁ ㅈ', 'ㅂ ㅅ', 'ㅅ ㄷ', 'ㅇ ㅈ', 'ㅈ ㄱ',
      'ㅊ ㅂ', 'ㅋ ㅍ', 'ㅌ ㄱ', 'ㅍ ㅈ', 'ㅎ ㅁ', 'ㄱ ㄴ', 'ㄷ ㄹ', 'ㅁ ㅂ',
      'ㅅ ㄹ', 'ㅇ ㄹ', 'ㅈ ㄹ', 'ㅊ ㄹ', 'ㅋ ㄹ', 'ㅌ ㄹ', 'ㅍ ㄹ', 'ㅎ ㄹ',
      'ㄱ ㅈ', 'ㄴ ㄱ', 'ㄷ ㄱ', 'ㅁ ㄹ', 'ㅂ ㄹ', 'ㅅ ㅂ', 'ㅇ ㅂ', 'ㅈ ㅂ'
    ];
  }

  init() {
    this.reset();
  }

  reset() {
    if (this.timerId) clearInterval(this.timerId);
    this.isExploded = false;
    this.passCount = 0;
    this.remainingTime = this.baseTimeSetting;
    this.currentCho = this._pickRandomCho();
    this.render();
  }

  _pickRandomCho() {
    return this.choPool[Math.floor(Math.random() * this.choPool.length)];
  }

  startTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.isExploded = false;

    this.timerId = setInterval(() => {
      this.remainingTime -= 0.1;
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        clearInterval(this.timerId);
        this._triggerExplosion();
      } else {
        // 째깍 사운드
        if (Math.round(this.remainingTime * 10) % 5 === 0) {
          this.hub.sound.playTick();
        }
        this._updateTimerDisplay();
      }
    }, 100);
  }

  passTurn() {
    if (this.isExploded) {
      this.reset();
      return;
    }

    this.passCount++;
    this.hub.sound.playTap();
    this.hub.vibrateShort();

    // 타이머 리셋 (점점 빨라지거나 3초 복원)
    this.remainingTime = Math.max(1.8, this.baseTimeSetting - Math.floor(this.passCount / 4) * 0.2);
    this.startTimer();
    this.render();
  }

  _triggerExplosion() {
    this.isExploded = true;
    this.hub.sound.playExplosion();
    this.hub.triggerPenalty({
      title: '💥 쾅! 폭탄이 터졌다! 💥',
      subtitle: `3초 안에 단어를 외치지 못한 사람 벌칙주 원샷!`,
      accentColor: '#ef4444'
    });
    this.render();
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    const timePercent = Math.max(0, Math.min(100, (this.remainingTime / this.baseTimeSetting) * 100));
    const isUrgent = this.remainingTime <= 1.2 && !this.isExploded;

    container.innerHTML = `
      <div class="party-game-box bomb-box ${isUrgent ? 'urgent' : ''}">
        <!-- 상단 턴/패스 안내 -->
        <div class="party-turn-indicator">
          <div class="party-turn-badge">
            <span class="pulse-dot"></span>
            <b>연속 ${this.passCount}회 성공!</b> (단어를 외치고 화면을 터치하세요)
          </div>
          <div class="bomb-timer-bar-wrap">
            <div class="bomb-timer-fill ${isUrgent ? 'danger' : ''}" style="width:${timePercent}%;"></div>
          </div>
          <div class="bomb-time-text ${isUrgent ? 'danger' : ''}" id="bomb-time-text">
            ⏱️ ${this.remainingTime.toFixed(1)}초
          </div>
        </div>

        <!-- 초대형 초성 표시판 (테이블 맞은편에서도 가독성 100%) -->
        <div class="hunmin-chosung-board ${this.isExploded ? 'exploded' : ''}" id="hunmin-touch-surface">
          <div class="bomb-flame-icon ${this.timerId ? 'burning' : ''}">
            ${this.isExploded ? '💥' : '💣'}
          </div>
          <div class="chosung-large-text">
            ${this.currentCho}
          </div>
          <div class="chosung-callout">
            ${this.isExploded 
              ? '❌ 타임오버! 벌칙 수행!' 
              : (!this.timerId ? '👆 터치하여 폭탄 카운트다운 시작!' : '👆 외친 후 터치하여 다음 사람에게 패스!')}
          </div>
        </div>

        <!-- 하단 시간 설정 & 재시작 버튼 -->
        <div class="party-bottom-controls">
          <button type="button" class="party-action-btn primary" id="btn-pass-bomb">
            ✋ 단어 외침! 다음 사람에게 패스!
          </button>
          <div class="party-range-toggle">
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:800; margin-right:4px;">제한시간:</span>
            <button type="button" class="range-pill ${this.baseTimeSetting === 3.0 ? 'active' : ''}" data-sec="3.0">3초</button>
            <button type="button" class="range-pill ${this.baseTimeSetting === 4.0 ? 'active' : ''}" data-sec="4.0">4초</button>
            <button type="button" class="range-pill ${this.baseTimeSetting === 5.0 ? 'active' : ''}" data-sec="5.0">5초</button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _updateTimerDisplay() {
    const textEl = document.getElementById('bomb-time-text');
    const fillEl = document.querySelector('.bomb-timer-fill');
    const boxEl = document.querySelector('.bomb-box');

    if (textEl) {
      textEl.textContent = `⏱️ ${this.remainingTime.toFixed(1)}초`;
      if (this.remainingTime <= 1.2) {
        textEl.classList.add('danger');
      }
    }
    if (fillEl) {
      const p = Math.max(0, Math.min(100, (this.remainingTime / this.baseTimeSetting) * 100));
      fillEl.style.width = `${p}%`;
      if (this.remainingTime <= 1.2) fillEl.classList.add('danger');
    }
    if (boxEl && this.remainingTime <= 1.2) {
      boxEl.classList.add('urgent');
    }
  }

  _bindEvents() {
    const surface = document.getElementById('hunmin-touch-surface');
    const passBtn = document.getElementById('btn-pass-bomb');

    const handleAction = () => {
      if (!this.timerId) {
        this.startTimer();
        this.render();
      } else {
        this.passTurn();
      }
    };

    if (surface) surface.onclick = handleAction;
    if (passBtn) passBtn.onclick = (e) => { e.stopPropagation(); handleAction(); };

    document.querySelectorAll('[data-sec]').forEach(btn => {
      btn.onclick = (e) => {
        this.baseTimeSetting = parseFloat(e.currentTarget.getAttribute('data-sec')) || 3.0;
        this.reset();
      };
    });
  }

  destroy() {
    if (this.timerId) clearInterval(this.timerId);
  }
}

window.KSool.HunminBombGame = HunminBombGame;
