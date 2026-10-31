window.KSool = window.KSool || {};

/**
 * ⑤ 훈민정음 시한폭탄 (미니멀 타이포그래피 + 커스텀 타이머 설정)
 * - 네모칸, 폭탄 그림, 부가 설명 일체 제거 -> 순수 [시간] + [초대형 자음 2개]만 표시
 * - 게임 시작 전 [원하는 제한시간] 및 [다른 자음 제시 시간] 선택 지원
 * - 제한시간: 3초, 5초, 7초, 10초, 15초, 무제한(∞)
 * - 다른 자음 제시: 매 턴마다(탭할 때), 15초마다, 30초마다, 무제한(수동)
 */
class HunminBombGame {
  constructor(hub) {
    this.hub = hub;

    // 게임 상태: 'setup' (설정) | 'playing' (진행)
    this.gameState = 'setup';

    // 시간 옵션 설정
    this.bombTimeSetting = 5.0; // 3, 5, 7, 10, 15, 'unlimited'
    this.choChangeSetting = 'turn'; // 'turn' (매 턴), 15, 30, 'manual' (무제한/수동)

    // 런타임 타이머
    this.remainingBombTime = 5.0;
    this.choElapsedSeconds = 0;
    this.bombTimerId = null;
    this.choTimerId = null;
    this.isExploded = false;

    // 초성 풀 (40여 종)
    this.currentCho = 'ㄱ ㅂ';
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
    this._clearAllTimers();
    this.gameState = 'setup';
    this.isExploded = false;
    this.remainingBombTime = this.bombTimeSetting === 'unlimited' ? Infinity : this.bombTimeSetting;
    this.choElapsedSeconds = 0;
    this.render();
  }

  _clearAllTimers() {
    if (this.bombTimerId) {
      clearInterval(this.bombTimerId);
      this.bombTimerId = null;
    }
    if (this.choTimerId) {
      clearInterval(this.choTimerId);
      this.choTimerId = null;
    }
  }

  _pickRandomCho() {
    const available = this.choPool.filter(c => c !== this.currentCho);
    return available[Math.floor(Math.random() * available.length)];
  }

  startGame() {
    this._clearAllTimers();
    this.gameState = 'playing';
    this.isExploded = false;
    this.remainingBombTime = this.bombTimeSetting === 'unlimited' ? Infinity : this.bombTimeSetting;
    this.choElapsedSeconds = 0;
    this.currentCho = this._pickRandomCho();

    this.hub.sound.playTap();
    this.hub.vibrateShort();

    this.render();
    this._startBombTimer();
    this._startChoChangeTimer();
  }

  _startBombTimer() {
    if (this.bombTimerId) clearInterval(this.bombTimerId);
    if (this.bombTimeSetting === 'unlimited') return;

    this.bombTimerId = setInterval(() => {
      this.remainingBombTime -= 0.1;
      if (this.remainingBombTime <= 0) {
        this.remainingBombTime = 0;
        this._clearAllTimers();
        this._triggerExplosion();
      } else {
        if (Math.round(this.remainingBombTime * 10) % 5 === 0) {
          this.hub.sound.playTick();
        }
        this._updatePlayingUI();
      }
    }, 100);
  }

  _startChoChangeTimer() {
    if (this.choTimerId) clearInterval(this.choTimerId);
    if (typeof this.choChangeSetting !== 'number') return;

    this.choElapsedSeconds = 0;
    this.choTimerId = setInterval(() => {
      this.choElapsedSeconds += 1;
      if (this.choElapsedSeconds >= this.choChangeSetting) {
        this.choElapsedSeconds = 0;
        this.changeCho(false);
      }
    }, 1000);
  }

  changeCho(playChime = true) {
    this.currentCho = this._pickRandomCho();
    this.choElapsedSeconds = 0;
    if (playChime) {
      this.hub.sound.playUp();
      this.hub.vibrateShort();
    }
    const choTextEl = document.getElementById('pure-chosung-text');
    if (choTextEl) {
      choTextEl.textContent = this.currentCho;
      choTextEl.classList.remove('pop-anim');
      void choTextEl.offsetWidth;
      choTextEl.classList.add('pop-anim');
    }
  }

  passTurn() {
    if (this.isExploded) {
      this.startGame();
      return;
    }

    this.hub.sound.playTap();
    this.hub.vibrateShort();

    // 턴 제한시간 리셋
    if (this.bombTimeSetting !== 'unlimited') {
      this.remainingBombTime = this.bombTimeSetting;
      this._startBombTimer();
    }

    // 자음 변경 규칙이 [매 턴마다]인 경우 즉시 새 자음 제시
    if (this.choChangeSetting === 'turn') {
      this.changeCho(false);
    }

    this._updatePlayingUI();
  }

  _triggerExplosion() {
    this.isExploded = true;
    this.hub.sound.playExplosion();
    this.hub.triggerPenalty({
      title: '폭발! 원샷!',
      subtitle: '시간 초과',
      accentColor: '#ef4444',
      icon: '💣'
    });
    this.render();
  }

  // =========================================================================
  // 렌더링: 설정 모드 vs 미니멀 인게임 모드
  // =========================================================================

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    if (this.gameState === 'setup') {
      this._renderSetupStage(container);
    } else {
      this._renderPlayingStage(container);
    }
  }

  _renderSetupStage(container) {
    const bombOptions = [
      { label: '3초', val: 3.0 },
      { label: '5초', val: 5.0 },
      { label: '7초', val: 7.0 },
      { label: '10초', val: 10.0 },
      { label: '15초', val: 15.0 },
      { label: '무제한 (∞)', val: 'unlimited' }
    ];

    const choOptions = [
      { label: '매 턴마다 (기본)', val: 'turn' },
      { label: '15초마다 자동', val: 15 },
      { label: '30초마다 자동', val: 30 },
      { label: '무제한 (수동)', val: 'manual' }
    ];

    container.innerHTML = `
      <div class="party-game-box hunmin-setup-stage">
        <div class="hunmin-setup-card">
          <div class="hunmin-setup-header">
            <span class="hunmin-setup-badge">RULE SETUP</span>
            <h3 class="hunmin-setup-title">⏱️ 훈민정음 시간 설정</h3>
          </div>

          <!-- 1. 폭탄 제한시간 선택 -->
          <div class="hunmin-setup-section">
            <div class="hunmin-setup-label">
              <span>⏱️ 인당 제한시간 (폭탄 타이머)</span>
              <span class="hunmin-setup-current">${this.bombTimeSetting === 'unlimited' ? '무제한' : `${this.bombTimeSetting}초`}</span>
            </div>
            <div class="hunmin-pills-grid">
              ${bombOptions.map(opt => `
                <button type="button" 
                        class="hunmin-pill ${this.bombTimeSetting === opt.val ? 'active' : ''}" 
                        data-bomb-time="${opt.val}">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 2. 다른 자음 제시 시간 선택 -->
          <div class="hunmin-setup-section">
            <div class="hunmin-setup-label">
              <span>🔤 다른 자음 제시 시간 (교체 주기)</span>
              <span class="hunmin-setup-current">
                ${this.choChangeSetting === 'turn' ? '매 턴마다' : (this.choChangeSetting === 'manual' ? '무제한(수동)' : `${this.choChangeSetting}초마다`)}
              </span>
            </div>
            <div class="hunmin-pills-grid cols-2">
              ${choOptions.map(opt => `
                <button type="button" 
                        class="hunmin-pill ${this.choChangeSetting === opt.val ? 'active' : ''}" 
                        data-cho-time="${opt.val}">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 시작 버튼 -->
          <button type="button" class="hunmin-start-btn" id="btn-hunmin-start">
            🔥 게임 시작하기
          </button>
        </div>
      </div>
    `;

    // 이벤트 바인딩
    container.querySelectorAll('[data-bomb-time]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const raw = btn.getAttribute('data-bomb-time');
        this.bombTimeSetting = raw === 'unlimited' ? 'unlimited' : Number(raw);
        this.hub.sound.playTap();
        this.render();
      };
    });

    container.querySelectorAll('[data-cho-time]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const raw = btn.getAttribute('data-cho-time');
        if (raw === 'turn' || raw === 'manual') {
          this.choChangeSetting = raw;
        } else {
          this.choChangeSetting = Number(raw);
        }
        this.hub.sound.playTap();
        this.render();
      };
    });

    const startBtn = container.querySelector('#btn-hunmin-start');
    if (startBtn) {
      startBtn.onclick = (e) => {
        e.stopPropagation();
        this.startGame();
      };
    }
  }

  _renderPlayingStage(container) {
    const isUnlimited = this.bombTimeSetting === 'unlimited';
    const timePercent = isUnlimited ? 100 : Math.max(0, Math.min(100, (this.remainingBombTime / this.bombTimeSetting) * 100));
    const isUrgent = !isUnlimited && this.remainingBombTime <= 1.5 && !this.isExploded;

    container.innerHTML = `
      <div class="party-game-box hunmin-pure-stage ${isUrgent ? 'urgent' : ''}" id="hunmin-touch-screen">
        <!-- 1. 시간 표시 (타이머 바 & 남은 시간) -->
        <div class="hunmin-top-timer-pure">
          <div class="hunmin-timer-track">
            <div class="hunmin-timer-fill ${isUrgent ? 'danger' : ''}" id="hunmin-timer-fill" style="width:${timePercent}%;"></div>
          </div>
          <div class="hunmin-time-digits ${isUrgent ? 'danger' : ''}" id="hunmin-time-digits">
            ${isUnlimited ? '∞ 무제한' : `⏱️ ${this.remainingBombTime.toFixed(1)}초`}
          </div>
        </div>

        <!-- 2. 순수 초대형 자음 2개 (네모칸, 폭탄 그림, 설명문 일체 없음!) -->
        <div class="pure-chosung-display">
          <div class="pure-chosung-text pop-anim" id="pure-chosung-text">
            ${this.currentCho}
          </div>
        </div>

        <!-- 3. 상단 플로팅 퀵 버튼 (설정 변경 & 다른 자음 즉시 뽑기) -->
        <div class="hunmin-floating-actions">
          <button type="button" class="hunmin-float-btn" id="btn-shuffle-cho" title="다른 자음 즉시 제시">
            🔀 자음변경
          </button>
          <button type="button" class="hunmin-float-btn" id="btn-open-setup" title="시간 설정">
            ⚙️ 시간설정
          </button>
        </div>
      </div>
    `;

    this._bindPlayingEvents();
  }

  _updatePlayingUI() {
    const timeEl = document.getElementById('hunmin-time-digits');
    const fillEl = document.getElementById('hunmin-timer-fill');
    const stage = document.getElementById('hunmin-touch-screen');

    if (this.bombTimeSetting === 'unlimited') return;

    const isUrgent = this.remainingBombTime <= 1.5 && !this.isExploded;
    if (stage) {
      if (isUrgent) stage.classList.add('urgent');
      else stage.classList.remove('urgent');
    }

    if (timeEl) {
      timeEl.textContent = `⏱️ ${this.remainingBombTime.toFixed(1)}초`;
      if (isUrgent) timeEl.classList.add('danger');
      else timeEl.classList.remove('danger');
    }

    if (fillEl) {
      const timePercent = Math.max(0, Math.min(100, (this.remainingBombTime / this.bombTimeSetting) * 100));
      fillEl.style.width = `${timePercent}%`;
      if (isUrgent) fillEl.classList.add('danger');
      else fillEl.classList.remove('danger');
    }
  }

  _bindPlayingEvents() {
    const stage = document.getElementById('hunmin-touch-screen');
    const shuffleBtn = document.getElementById('btn-shuffle-cho');
    const setupBtn = document.getElementById('btn-open-setup');

    if (shuffleBtn) {
      shuffleBtn.onclick = (e) => {
        e.stopPropagation();
        this.changeCho(true);
      };
    }

    if (setupBtn) {
      setupBtn.onclick = (e) => {
        e.stopPropagation();
        this.reset();
      };
    }

    // 화면 어디든 탭하면 단어 통과 -> 다음 턴으로 패스
    if (stage) {
      stage.onclick = (e) => {
        e.preventDefault();
        this.passTurn();
      };
    }
  }

  destroy() {
    this._clearAllTimers();
  }
}

window.KSool.HunminBombGame = HunminBombGame;
