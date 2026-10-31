window.KSool = window.KSool || {};

/**
 * ④ 소주병 돌리기 & 손가락 랜덤 지목 (테이블 중앙 거치형)
 * 테이블 한가운데 폰을 눕혀두고 진행하는 진실게임, 흑기사 지목, 러시안룰렛용 도구.
 * - 모드 A: 소주병 돌리기 (Spin the Bottle)
 * - 모드 B: 손가락 멀티터치 룰렛 (Finger Roulette)
 */
class BottleSpinGame {
  constructor(hub) {
    this.hub = hub;
    this.mode = 'bottle'; // 'bottle' | 'finger'

    // 소주병 물리 엔진 변수
    this.bottleAngle = 0;
    this.angularVelocity = 0;
    this.friction = 0.978;
    this.isSpinning = false;
    this.animId = null;

    // 손가락 룰렛 상태
    this.touchesMap = new Map(); // identifier -> { x, y, color }
    this.fingerCountdownTimer = null;
    this.countdownSeconds = 3;
    this.isFingerChoosing = false;
    this.chosenFingerId = null;
    this.colors = ['#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
  }

  init() {
    this.reset();
  }

  reset() {
    this.isSpinning = false;
    this.angularVelocity = 0;
    this.touchesMap.clear();
    this.isFingerChoosing = false;
    this.chosenFingerId = null;
    if (this.fingerCountdownTimer) clearInterval(this.fingerCountdownTimer);
    this.render();
  }

  setMode(m) {
    this.mode = m;
    this.reset();
  }

  // --- 소주병 돌리기 로직 ---
  spinBottle(power = null) {
    if (this.isSpinning) return;
    this.isSpinning = true;
    // 시계방향 강한 회전 (초기 각속도 25 ~ 45 rad/sec)
    this.angularVelocity = power !== null ? power : (Math.random() * 20 + 26);
    this.hub.sound.playSpinWhir();
    this.hub.vibrateShort();

    const loop = () => {
      this.bottleAngle = (this.bottleAngle + this.angularVelocity) % 360;
      this.angularVelocity *= this.friction;

      const bottleEl = document.getElementById('soju-spinning-bottle');
      if (bottleEl) {
        bottleEl.style.transform = `rotate(${this.bottleAngle}deg)`;
      }

      if (this.angularVelocity > 0.15) {
        this.animId = requestAnimationFrame(loop);
      } else {
        // 병이 멈춤!
        this.isSpinning = false;
        this.angularVelocity = 0;
        this.hub.sound.playExplosion();
        this.hub.triggerPenalty({
          title: '🍾 병목이 가리킨 사람 당첨! 🍾',
          subtitle: `병 주둥이가 향한 쪽 참가자 원샷!`,
          accentColor: '#10b981'
        });
        const badge = document.getElementById('spin-status-badge');
        if (badge) badge.textContent = '🎯 지목 완료! 다시 돌리려면 터치!';
      }
    };

    this.animId = requestAnimationFrame(loop);
  }

  // --- 손가락 룰렛 로직 ---
  _startFingerCountdown() {
    if (this.isFingerChoosing || this.touchesMap.size < 2) return;
    this.isFingerChoosing = true;
    this.countdownSeconds = 3;
    this._renderFingerStage();

    this.fingerCountdownTimer = setInterval(() => {
      this.countdownSeconds--;
      this.hub.sound.playTick();
      this.hub.vibrateShort();

      if (this.countdownSeconds <= 0) {
        clearInterval(this.fingerCountdownTimer);
        this._pickRandomFinger();
      } else {
        this._renderFingerStage();
      }
    }, 1000);
  }

  _pickRandomFinger() {
    const ids = Array.from(this.touchesMap.keys());
    if (ids.length === 0) {
      this.reset();
      return;
    }
    const chosenIdx = Math.floor(Math.random() * ids.length);
    this.chosenFingerId = ids[chosenIdx];
    this.hub.sound.playExplosion();
    this.hub.triggerPenalty({
      title: '🎯 손가락 지목 당첨! 🎯',
      subtitle: `빨간 타깃에 걸린 참가자 원샷!`,
      accentColor: '#ef4444'
    });
    this._renderFingerStage();
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    container.innerHTML = `
      <div class="party-game-box bottle-box">
        <!-- 상단 모드 전환 탭 -->
        <div class="bottle-mode-tabs">
          <button type="button" class="bottle-tab-pill ${this.mode === 'bottle' ? 'active' : ''}" data-mode="bottle">
            🍾 소주병 돌리기
          </button>
          <button type="button" class="bottle-tab-pill ${this.mode === 'finger' ? 'active' : ''}" data-mode="finger">
            🖐️ 손가락 룰렛 지목
          </button>
        </div>

        <div id="bottle-game-substage" class="bottle-substage"></div>
      </div>
    `;

    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.onclick = (e) => {
        this.setMode(e.currentTarget.getAttribute('data-mode'));
      };
    });

    if (this.mode === 'bottle') {
      this._renderBottleStage();
    } else {
      this._renderFingerStage();
    }
  }

  _renderBottleStage() {
    const substage = document.getElementById('bottle-game-substage');
    if (!substage) return;

    substage.innerHTML = `
      <div class="bottle-arena" id="bottle-touch-arena">
        <!-- 360도 원형 나침반 링 -->
        <div class="bottle-compass-ring">
          <span class="compass-marker north">▲</span>
          <span class="compass-marker east">▶</span>
          <span class="compass-marker south">▼</span>
          <span class="compass-marker west">◀</span>
        </div>

        <!-- 회전 소주병 SVG -->
        <div class="soju-bottle-wrapper" id="soju-spinning-bottle" style="transform: rotate(${this.bottleAngle}deg);">
          <div class="soju-bottle-neck-pointer"></div>
          <svg class="soju-bottle-svg" viewBox="0 0 70 210" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 병목 & 뚜껑 -->
            <rect x="25" y="6" width="20" height="14" rx="3" fill="#15803D" stroke="#86EFAC" stroke-width="2"/>
            <path d="M27 20 L27 48 Q27 68 12 88 L12 188 Q12 198 22 198 L48 198 Q58 198 58 188 L58 88 Q43 68 43 48 L43 20 Z" 
                  fill="#16A34A" stroke="#4ADE80" stroke-width="3"/>
            <!-- 라벨 -->
            <rect x="18" y="96" width="34" height="60" rx="4" fill="#FFFFFF" opacity="0.95"/>
            <text x="35" y="125" text-anchor="middle" font-size="14" font-weight="900" fill="#0F172A">참</text>
            <text x="35" y="142" text-anchor="middle" font-size="10" font-weight="900" fill="#0284C7">이슬</text>
          </svg>
        </div>

        <div class="bottle-callout-text" id="spin-status-badge">
          ${this.isSpinning ? '🌀 쌩쌩 도는 중...' : '👆 병을 쓱 밀거나 아래 버튼을 누르세요!'}
        </div>
      </div>

      <div class="party-bottom-controls">
        <button type="button" class="party-action-btn primary" id="btn-spin-bottle">
          🔄 소주병 세게 돌리기!
        </button>
      </div>
    `;

    const arena = document.getElementById('bottle-touch-arena');
    const spinBtn = document.getElementById('btn-spin-bottle');

    if (arena) arena.onclick = () => this.spinBottle();
    if (spinBtn) spinBtn.onclick = (e) => { e.stopPropagation(); this.spinBottle(); };
  }

  _renderFingerStage() {
    const substage = document.getElementById('bottle-game-substage');
    if (!substage) return;

    let spotsHtml = '';
    this.touchesMap.forEach((pt, id) => {
      const isTarget = this.chosenFingerId === id;
      spotsHtml += `
        <div class="finger-touch-spot ${isTarget ? 'target-winner' : ''}" 
             style="left:${pt.x}px; top:${pt.y}px; border-color:${isTarget ? '#ef4444' : pt.color};">
          <div class="finger-inner-ripple" style="background:${isTarget ? '#ef4444' : pt.color};"></div>
          ${isTarget ? '<div class="target-skull">💥 당첨!</div>' : ''}
        </div>
      `;
    });

    const fingerCount = this.touchesMap.size;
    let guideMessage = '';
    if (fingerCount < 2) {
      guideMessage = '🖐️ <b>참가자 모두 화면에 손가락을 대세요!</b> (2명 이상)';
    } else if (this.isFingerChoosing && this.countdownSeconds > 0) {
      guideMessage = `⏳ <b>${this.countdownSeconds}초 뒤 지목!</b> (손 떼지 마세요!)`;
    } else if (this.chosenFingerId !== null) {
      guideMessage = '🎉 <b>벌칙자 지목 완료!</b> 화면을 터치해 다시 시작';
    }

    substage.innerHTML = `
      <div class="finger-touch-arena" id="finger-multi-arena">
        ${spotsHtml}
        <div class="finger-center-guide">
          ${guideMessage}
          <div style="font-size:0.75rem; color:#64748b; margin-top:6px;">
            (모바일 멀티터치 완벽 지원 · PC에서는 화면 클릭으로 테스트)
          </div>
        </div>
      </div>
    `;

    this._bindFingerTouchEvents();
  }

  _bindFingerTouchEvents() {
    const arena = document.getElementById('finger-multi-arena');
    if (!arena) return;

    // 모바일 터치 이벤트
    arena.ontouchstart = (e) => {
      e.preventDefault();
      if (this.chosenFingerId !== null) {
        this.reset();
        return;
      }
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const rect = arena.getBoundingClientRect();
        const color = this.colors[this.touchesMap.size % this.colors.length];
        this.touchesMap.set(t.identifier, {
          x: t.clientX - rect.left,
          y: t.clientY - rect.top,
          color
        });
      }
      this.hub.sound.playTap();
      this._renderFingerStage();

      if (this.touchesMap.size >= 2 && !this.isFingerChoosing) {
        this._startFingerCountdown();
      }
    };

    arena.ontouchmove = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (this.touchesMap.has(t.identifier)) {
          const rect = arena.getBoundingClientRect();
          const obj = this.touchesMap.get(t.identifier);
          obj.x = t.clientX - rect.left;
          obj.y = t.clientY - rect.top;
        }
      }
      this._renderFingerStage();
    };

    arena.ontouchend = arena.ontouchcancel = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.touchesMap.delete(t.identifier);
      }
      if (this.touchesMap.size < 2 && this.isFingerChoosing && this.chosenFingerId === null) {
        clearInterval(this.fingerCountdownTimer);
        this.isFingerChoosing = false;
      }
      this._renderFingerStage();
    };

    // PC 마우스 클릭 시뮬레이션 지원
    arena.onmousedown = (e) => {
      if ('ontouchstart' in window) return;
      if (this.chosenFingerId !== null) {
        this.reset();
        return;
      }
      const rect = arena.getBoundingClientRect();
      const mockId = 'mouse-' + Date.now();
      const color = this.colors[this.touchesMap.size % this.colors.length];
      this.touchesMap.set(mockId, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        color
      });
      this.hub.sound.playTap();
      this._renderFingerStage();

      if (this.touchesMap.size >= 2 && !this.isFingerChoosing) {
        this._startFingerCountdown();
      }
    };
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.fingerCountdownTimer) clearInterval(this.fingerCountdownTimer);
  }
}

window.KSool.BottleSpinGame = BottleSpinGame;
