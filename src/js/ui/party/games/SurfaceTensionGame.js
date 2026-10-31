window.KSool = window.KSool || {};

/**
 * ③ 표면장력 소주잔 채우기 (아웃 카운트형)
 * 잔에 술이 넘치기 직전까지 돌아가며 액체를 채워 넣다가,
 * 표면장력 한계를 넘겨 잔을 넘치게 만든 사람이 패배하는 게임.
 */
class SurfaceTensionGame {
  constructor(hub) {
    this.hub = hub;
    this.glassCapacity = 100; // 기준 100%
    this.currentLevel = 20; // 시작 시 약 20%
    this.overflowLimit = 100; // 101% ~ 107% 사이 랜덤 한계
    this.isPouring = false;
    this.isOverflowed = false;
    this.currentTurnPlayer = 1;
    this.totalPlayers = 4;
    this.animId = null;
    this.wavePhase = 0;
    this.pourInterval = null;
    this.heartbeatTimer = null;
  }

  init() {
    this.reset();
  }

  reset() {
    this.currentLevel = Math.floor(Math.random() * 10) + 15; // 15~24% 시작
    this.overflowLimit = 100 + Math.random() * 6.5; // 100.0% ~ 106.5% 표면장력 한계
    this.isPouring = false;
    this.isOverflowed = false;
    if (this.pourInterval) clearInterval(this.pourInterval);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.hub.sound.stopPour();
    this.render();
  }

  startPour() {
    if (this.isOverflowed) return;
    this.isPouring = true;
    this.hub.sound.startPour();
    this.hub.vibrateShort();

    this.pourInterval = setInterval(() => {
      if (!this.isPouring || this.isOverflowed) return;

      // 천천히 그러나 누를수록 긴장감 있게 차오름 (초당 약 8~12%)
      this.currentLevel += 0.35;
      this.hub.sound.updatePour(this.currentLevel / 100);

      if (this.currentLevel >= 85 && !this.heartbeatTimer) {
        this.heartbeatTimer = setInterval(() => {
          if (this.currentLevel >= 85 && !this.isOverflowed) {
            this.hub.sound.playHeartbeat();
          }
        }, 600);
      }

      if (this.currentLevel >= this.overflowLimit) {
        this.triggerOverflow();
      }
    }, 40);
  }

  stopPour() {
    if (!this.isPouring) return;
    this.isPouring = false;
    if (this.pourInterval) clearInterval(this.pourInterval);
    this.hub.sound.stopPour();

    if (!this.isOverflowed) {
      // 턴을 넘기며 안전 안내
      this.currentTurnPlayer = (this.currentTurnPlayer % this.totalPlayers) + 1;
      this._updateInfo();
    }
  }

  triggerOverflow() {
    this.isOverflowed = true;
    this.isPouring = false;
    if (this.pourInterval) clearInterval(this.pourInterval);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.hub.sound.stopPour();

    this.hub.sound.playExplosion();
    this.hub.triggerPenalty({
      title: '🌊 술이 넘쳤다! 🌊',
      subtitle: `[ 플레이어 ${this.currentTurnPlayer} ] 잔을 넘쳐버렸습니다! 벌칙주 원샷!`,
      accentColor: '#38bdf8'
    });

    this._updateInfo();
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    container.innerHTML = `
      <div class="party-game-box surface-box">
        <!-- 턴 안내 배너 -->
        <div class="party-turn-indicator">
          <div class="party-turn-badge">
            <span class="pulse-dot"></span>
            <b>플레이어 ${this.currentTurnPlayer} 차례!</b> ([따르기] 버튼을 꾹 누르세요)
          </div>
          <div class="tension-level-badge" id="tension-level-badge">
            수위: ${Math.round(this.currentLevel)}%
          </div>
        </div>

        <!-- 캔버스 표면장력 소주잔 렌더링 -->
        <div class="glass-canvas-wrap">
          <canvas id="tension-canvas" width="280" height="340"></canvas>
          <div class="tension-spill-fx ${this.isOverflowed ? 'active' : ''}"></div>
        </div>

        <!-- 하단 조작: 꾹 누르는 따르기 버튼 -->
        <div class="party-bottom-controls">
          <button type="button" class="party-hold-pour-btn ${this.isPouring ? 'pouring' : ''}" id="btn-hold-pour">
            <span class="pour-icon">🍶</span>
            <span class="pour-label">꾹 눌러서 따르기! (손 떼면 멈춤)</span>
          </button>
          <div class="party-range-toggle">
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:800; margin-right:4px;">참가자:</span>
            ${[2, 3, 4, 5, 6].map(n => `
              <button type="button" class="range-pill ${this.totalPlayers === n ? 'active' : ''}" data-players="${n}">${n}명</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
    this._startCanvasLoop();
  }

  _updateInfo() {
    const badge = document.getElementById('tension-level-badge');
    if (badge) {
      badge.textContent = `수위: ${Math.round(this.currentLevel)}%`;
      if (this.currentLevel >= 85) {
        badge.classList.add('danger');
      } else {
        badge.classList.remove('danger');
      }
    }
    const turnBadge = document.querySelector('.party-turn-badge b');
    if (turnBadge) {
      turnBadge.textContent = `플레이어 ${this.currentTurnPlayer} 차례!`;
    }
  }

  _bindEvents() {
    const btn = document.getElementById('btn-hold-pour');
    if (btn) {
      // 마우스 및 터치 이벤트 모두 지원 (롱 프레스)
      btn.onmousedown = (e) => { e.preventDefault(); this.startPour(); };
      btn.onmouseup = (e) => { e.preventDefault(); this.stopPour(); };
      btn.onmouseleave = (e) => { e.preventDefault(); this.stopPour(); };

      btn.ontouchstart = (e) => { e.preventDefault(); this.startPour(); };
      btn.ontouchend = (e) => { e.preventDefault(); this.stopPour(); };
      btn.ontouchcancel = (e) => { e.preventDefault(); this.stopPour(); };
    }

    document.querySelectorAll('[data-players]').forEach(pBtn => {
      pBtn.onclick = (e) => {
        this.totalPlayers = Number(e.currentTarget.getAttribute('data-players'));
        this.reset();
      };
    });
  }

  _startCanvasLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const canvas = document.getElementById('tension-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderFrame = () => {
      this.wavePhase += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const glassTopY = 60;
      const glassBottomY = 280;
      const glassHeight = glassBottomY - glassTopY;
      const glassWidthTop = 190;
      const glassWidthBottom = 130;
      const cx = canvas.width / 2;

      // 1. 유리잔 배경 윤곽 그리기
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';

      ctx.beginPath();
      ctx.moveTo(cx - glassWidthTop / 2, glassTopY);
      ctx.lineTo(cx - glassWidthBottom / 2, glassBottomY);
      ctx.lineTo(cx + glassWidthBottom / 2, glassBottomY);
      ctx.lineTo(cx + glassWidthTop / 2, glassTopY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. 소주 액체 채우기
      const fillRatio = Math.min(1.08, this.currentLevel / 100);
      const currentLiquidY = glassBottomY - glassHeight * Math.min(1, fillRatio);

      ctx.beginPath();
      // 하단 클리핑 마스크
      ctx.moveTo(cx - glassWidthBottom / 2 + 3, glassBottomY - 2);
      ctx.lineTo(cx - glassWidthTop / 2 + 3, glassTopY);
      ctx.lineTo(cx + glassWidthTop / 2 - 3, glassTopY);
      ctx.lineTo(cx + glassWidthBottom / 2 - 3, glassBottomY - 2);
      ctx.closePath();
      ctx.clip();

      // 액체 그라데이션 (투명 소주빛 하늘/에메랄드 틴트)
      const grad = ctx.createLinearGradient(0, currentLiquidY, 0, glassBottomY);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
      grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.7)');
      grad.addColorStop(1, 'rgba(2, 132, 199, 0.85)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      const waveAmp = this.isPouring ? 4.5 : 1.5;
      const leftX = cx - glassWidthTop / 2;
      const rightX = cx + glassWidthTop / 2;

      ctx.moveTo(leftX, glassBottomY);
      // 수면 곡선 (표면장력일 때 볼록해지는 효과)
      const meniscusBulge = fillRatio > 0.95 ? (fillRatio - 0.95) * 60 : 0;

      for (let x = leftX; x <= rightX; x += 5) {
        const norm = (x - cx) / (glassWidthTop / 2);
        // 중심이 볼록한 돔 형태
        const dome = (1 - norm * norm) * meniscusBulge;
        const wave = Math.sin(this.wavePhase + (x / 20)) * waveAmp;
        const y = currentLiquidY - dome + wave;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(rightX, glassBottomY);
      ctx.closePath();
      ctx.fill();

      // 표면장력 하이라이트 림
      if (fillRatio > 0.9) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();

      // 3. 유리잔 외곽선 및 입체 광택
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - glassWidthTop / 2, glassTopY);
      ctx.lineTo(cx - glassWidthBottom / 2, glassBottomY);
      ctx.lineTo(cx + glassWidthBottom / 2, glassBottomY);
      ctx.lineTo(cx + glassWidthTop / 2, glassTopY);
      ctx.stroke();

      // 림 상단 타원
      ctx.beginPath();
      ctx.ellipse(cx, glassTopY, glassWidthTop / 2, 8, 0, 0, Math.PI * 2);
      ctx.strokeStyle = fillRatio > 0.98 ? '#ef4444' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = fillRatio > 0.98 ? 3 : 2;
      ctx.stroke();
      ctx.restore();

      if (this.animId) {
        this.animId = requestAnimationFrame(renderFrame);
      }
    };

    this.animId = requestAnimationFrame(renderFrame);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.pourInterval) clearInterval(this.pourInterval);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.hub.sound.stopPour();
  }
}

window.KSool.SurfaceTensionGame = SurfaceTensionGame;
