window.KSool = window.KSool || {};

/**
 * ① 소주 뚜껑 숫자 Up & Down (벌칙자 지목형)
 * 테이블 중앙에 폰을 두고 순서대로 돌아가며 숫자를 입력해 병뚜껑 속 숫자를 맞히는 게임.
 * 정답을 맞힌 순간 걸린 사람이 술을 마시거나 벌칙을 수행.
 */
class UpAndDownGame {
  constructor(hub) {
    this.hub = hub;
    this.maxNumber = 50;
    this.secretNumber = 0;
    this.minRange = 1;
    this.maxRange = 50;
    this.currentTurn = 1;
    this.isFinished = false;
    this.lastResult = null; // 'UP', 'DOWN', 'BOMB'
  }

  init() {
    this.reset();
  }

  reset() {
    this.secretNumber = Math.floor(Math.random() * this.maxNumber) + 1;
    this.minRange = 1;
    this.maxRange = this.maxNumber;
    this.currentTurn = 1;
    this.isFinished = false;
    this.lastResult = null;
    this.render();
  }

  setMaxNumber(n) {
    this.maxNumber = Number(n) || 50;
    this.reset();
  }

  handleGuess(num) {
    if (this.isFinished) {
      this.reset();
      return;
    }

    const val = Number(num);
    if (isNaN(val) || val < this.minRange || val > this.maxRange) {
      return;
    }

    if (val === this.secretNumber) {
      // 당첨! 벌칙 폭발!
      this.isFinished = true;
      this.lastResult = 'BOMB';
      this.hub.sound.playExplosion();
      this.hub.triggerPenalty({
        title: '💥 뚜껑 당첨! 마셔라! 💥',
        subtitle: `정답 숫자 [ ${this.secretNumber} ]을(를) 맞힌 사람 당첨!`,
        accentColor: '#ef4444'
      });
      this.render();
      return;
    }

    if (val < this.secretNumber) {
      // UP!
      this.minRange = val + 1;
      this.lastResult = 'UP';
      this.hub.sound.playUp();
      this.hub.vibrateShort();
    } else {
      // DOWN!
      this.maxRange = val - 1;
      this.lastResult = 'DOWN';
      this.hub.sound.playDown();
      this.hub.vibrateShort();
    }

    this.currentTurn++;
    this.render();
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    // 범위 바 진행률
    const totalSpan = this.maxNumber;
    const currentSpan = Math.max(1, this.maxRange - this.minRange + 1);
    const leftPercent = ((this.minRange - 1) / totalSpan) * 100;
    const widthPercent = (currentSpan / totalSpan) * 100;

    let resultBadgeHtml = '';
    if (this.lastResult === 'UP') {
      resultBadgeHtml = `<div class="party-feedback-badge up animate-bounce-up">▲ UP! 더 높은 숫자!</div>`;
    } else if (this.lastResult === 'DOWN') {
      resultBadgeHtml = `<div class="party-feedback-badge down animate-bounce-down">▼ DOWN! 더 낮은 숫자!</div>`;
    } else if (this.lastResult === 'BOMB') {
      resultBadgeHtml = `<div class="party-feedback-badge bomb">💥 정답 ${this.secretNumber}! 벌칙 당첨! 💥</div>`;
    } else {
      resultBadgeHtml = `<div class="party-feedback-badge ready">테이블을 돌며 숫자를 입력하세요!</div>`;
    }

    container.innerHTML = `
      <div class="party-game-box updown-box">
        <!-- 상단 범위 게이지 -->
        <div class="party-turn-indicator">
          <div class="party-range-numbers">
            <span class="range-bound min">${this.minRange}</span>
            <span class="range-sep">~</span>
            <span class="range-bound max">${this.maxRange}</span>
          </div>
          <div class="party-range-track">
            <div class="party-range-fill" style="left:${leftPercent}%; width:${widthPercent}%;"></div>
          </div>
        </div>

        <!-- 병뚜껑 비주얼 & 피드백 -->
        <div class="party-cap-visual-wrap">
          <div class="soju-cap-circle ${this.isFinished ? 'exploded' : ''} ${this.lastResult ? this.lastResult.toLowerCase() : ''}">
            <div class="soju-cap-inner">
              <span class="soju-cap-label">K-SOOL</span>
              <span class="soju-cap-secret">${this.isFinished ? this.secretNumber : '?'}</span>
              <span class="soju-cap-star">★</span>
            </div>
          </div>
          ${resultBadgeHtml}
        </div>

        <!-- 숫자 입력 패드 (원터치 다이얼) -->
        <div class="party-numpad-section">
          <div class="party-quick-inputs-row">
            <button type="button" class="party-quick-btn" id="btn-quick-min">${this.minRange}</button>
            <input type="number" id="party-guess-input" class="party-number-display" 
                   min="${this.minRange}" max="${this.maxRange}" 
                   placeholder="${this.minRange} ~ ${this.maxRange}" autofocus inputmode="numeric" />
            <button type="button" class="party-quick-btn" id="btn-quick-max">${this.maxRange}</button>
          </div>

          <div class="party-numpad-grid">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => `
              <button type="button" class="party-num-key" data-digit="${digit}">${digit}</button>
            `).join('')}
            <button type="button" class="party-num-action-key clear" id="btn-input-clear">C</button>
            <button type="button" class="party-num-action-key submit" id="btn-input-submit">확인</button>
          </div>
        </div>

        <!-- 하단 빠른 재시작 / 설정 버튼 -->
        <div class="party-bottom-controls">
          <button type="button" class="party-action-btn restart" id="btn-updown-restart">🔄 새 게임 시작</button>
          <div class="party-range-toggle">
            <button type="button" class="range-pill ${this.maxNumber === 50 ? 'active' : ''}" data-max="50">1~50</button>
            <button type="button" class="range-pill ${this.maxNumber === 100 ? 'active' : ''}" data-max="100">1~100</button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const input = document.getElementById('party-guess-input');
    const submitBtn = document.getElementById('btn-input-submit');
    const clearBtn = document.getElementById('btn-input-clear');
    const restartBtn = document.getElementById('btn-updown-restart');
    const minBtn = document.getElementById('btn-quick-min');
    const maxBtn = document.getElementById('btn-quick-max');

    const submit = () => {
      if (!input || !input.value) return;
      this.handleGuess(input.value);
    };

    if (submitBtn) submitBtn.onclick = submit;
    if (clearBtn && input) {
      clearBtn.onclick = () => {
        input.value = '';
        this.hub.sound.playTap();
      };
    }

    if (minBtn && input) {
      minBtn.onclick = () => {
        input.value = this.minRange;
        this.hub.sound.playTap();
      };
    }
    if (maxBtn && input) {
      maxBtn.onclick = () => {
        input.value = this.maxRange;
        this.hub.sound.playTap();
      };
    }

    if (restartBtn) {
      restartBtn.onclick = () => {
        this.hub.sound.playTap();
        this.reset();
      };
    }

    document.querySelectorAll('.range-pill').forEach(pill => {
      pill.onclick = (e) => {
        const targetMax = Number(e.currentTarget.getAttribute('data-max'));
        this.setMaxNumber(targetMax);
      };
    });

    document.querySelectorAll('.party-num-key').forEach(key => {
      key.onclick = (e) => {
        const d = e.currentTarget.getAttribute('data-digit');
        if (input) {
          if (input.value.length < 3) {
            input.value += d;
            this.hub.sound.playTap();
          }
        }
      };
    });

    if (input) {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') submit();
      };
    }
  }

  destroy() {
    // UpAndDownGame has no running timers to cancel
  }
}

window.KSool.UpAndDownGame = UpAndDownGame;
