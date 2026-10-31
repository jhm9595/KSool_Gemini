window.KSool = window.KSool || {};

/**
 * ⑤ 훈민정음 3초 초성 타이머 (미니멀 시한폭탄 돌리기형)
 * - 불필요한 참가자/패스 버튼 일체 제거
 * - 화면 중앙의 초대형 초성 보드와 타들어가는 시한폭탄 도화선
 * - 단어를 외치고 보드를 탭하면 즉시 새로운 초성과 함께 타이머가 리셋되어 다음 사람에게 물리적으로 패스
 */
class HunminBombGame {
  constructor(hub) {
    this.hub = hub;
    this.timerSeconds = 3.0; // 3초 기준
    this.remainingTime = 3.0;
    this.currentCho = 'ㄱ ㅂ';
    this.timerId = null;
    this.isExploded = false;

    // 한국어 초성 쌍 풀 (자주 쓰이는 흥미진진한 초성 40종)
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
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isExploded = false;
    this.remainingTime = this.timerSeconds;
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
        this.timerId = null;
        this._triggerExplosion();
      } else {
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

    this.hub.sound.playTap();
    this.hub.vibrateShort();

    this.remainingTime = this.timerSeconds;
    this.currentCho = this._pickRandomCho();
    this.startTimer();
    this.render();
  }

  _triggerExplosion() {
    this.isExploded = true;
    this.hub.sound.playExplosion();
    this.hub.triggerPenalty({
      title: '💥 쾅! 폭탄이 터졌다! 💥',
      subtitle: '3초 안에 단어를 외치지 못한 사람 벌칙주 원샷!',
      accentColor: '#ef4444'
    });
    this.render();
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    const timePercent = Math.max(0, Math.min(100, (this.remainingTime / this.timerSeconds) * 100));
    const isUrgent = this.remainingTime <= 1.2 && !this.isExploded;

    container.innerHTML = `
      <div class="party-game-box bomb-minimal-box ${isUrgent ? 'urgent' : ''}">
        <!-- 상단 초성 시한폭탄 타이머 바 -->
        <div class="bomb-top-timer-wrap">
          <div class="bomb-timer-bar-wrap">
            <div class="bomb-timer-fill ${isUrgent ? 'danger' : ''}" id="bomb-timer-fill" style="width:${timePercent}%;"></div>
          </div>
          <div class="bomb-time-text ${isUrgent ? 'danger' : ''}" id="bomb-time-text">
            ⏱️ ${this.remainingTime.toFixed(1)}초
          </div>
        </div>

        <!-- 초대형 초성 폭탄 보드 (터치 즉시 다음 초성 패스) -->
        <div class="hunmin-chosung-board ${this.isExploded ? 'exploded' : ''}" id="hunmin-touch-surface">
          <div class="bomb-flame-icon ${this.timerId ? 'burning' : ''}">
            ${this.isExploded ? '💥' : '💣'}
          </div>
          <div class="chosung-large-text">
            ${this.currentCho}
          </div>
          <div class="chosung-callout">
            ${this.isExploded 
              ? '❌ 폭탄 폭발! 화면 터치 시 재시작' 
              : (!this.timerId ? '👆 터치하여 폭탄 카운트다운 시작!' : '👆 외친 후 터치하면 즉시 패스!')}
          </div>
        </div>

        <!-- 하단 심플 힌트 문구 -->
        <div class="bomb-minimal-hint">
          🗣️ 큰 소리로 단어를 외치고 <b>보드를 탭하여</b> 폰을 넘기세요!
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _updateTimerDisplay() {
    const textEl = document.getElementById('bomb-time-text');
    const fillEl = document.getElementById('bomb-timer-fill');
    if (textEl) {
      textEl.textContent = `⏱️ ${this.remainingTime.toFixed(1)}초`;
      if (this.remainingTime <= 1.2) textEl.classList.add('danger');
      else textEl.classList.remove('danger');
    }
    if (fillEl) {
      const timePercent = Math.max(0, Math.min(100, (this.remainingTime / this.timerSeconds) * 100));
      fillEl.style.width = `${timePercent}%`;
      if (this.remainingTime <= 1.2) fillEl.classList.add('danger');
      else fillEl.classList.remove('danger');
    }
  }

  _bindEvents() {
    const board = document.getElementById('hunmin-touch-surface');
    if (board) {
      board.onclick = (e) => {
        e.preventDefault();
        if (!this.timerId && !this.isExploded) {
          this.startTimer();
          this.render();
        } else {
          this.passTurn();
        }
      };
    }
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isExploded = false;
  }
}

window.KSool.HunminBombGame = HunminBombGame;
