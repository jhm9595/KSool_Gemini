window.KSool = window.KSool || {};

/**
 * ③ 표면장력 소주잔 채우기 (극강 미니멀 화면 터치형)
 * - 버튼, 설명, 수위 퍼센티지 일체 제거!
 * - 잔을 화면 정중앙에 큼직하게 거치
 * - 화면 아무 곳이나 누르고 있으면 술이 쪼르륵 채워지고, 손을 떼면 즉시 멈춤
 * - 수면의 볼록한 표면장력 돔만 직접 눈으로 보고 판단
 * - 넘쳐버리면 즉시 벌칙 발동, 다시 탭하면 새 잔 시작
 */
class SurfaceTensionGame {
  constructor(hub) {
    this.hub = hub;
    this.glassCapacity = 100; // 기준 100%
    this.currentLevel = 20; // 시작 시 약 20%
    this.overflowLimit = 100; // 100.5% ~ 106.5% 사이 무작위 표면장력 한계
    this.isPouring = false;
    this.isOverflowed = false;
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
    if (this.isOverflowed) {
      this.reset();
      return;
    }
    this.isPouring = true;
    this.hub.sound.startPour();
    this.hub.vibrateShort();

    const stageBox = document.getElementById('surface-screen-touch-area');
    if (stageBox) stageBox.classList.add('pouring');

    this.pourInterval = setInterval(() => {
      if (!this.isPouring || this.isOverflowed) return;

      // 누르고 있는 동안 점점 긴장감 있게 차오름 (초당 약 8~11%)
      this.currentLevel += 0.35;
      this.hub.sound.updatePour(this.currentLevel / 100);

      // 잔이 위험 수위에 도달하면 심장박동 효과음 가속
      if (this.currentLevel >= 88 && !this.heartbeatTimer) {
        this.heartbeatTimer = setInterval(() => {
          if (this.currentLevel >= 88 && !this.isOverflowed) {
            this.hub.sound.playHeartbeat();
          }
        }, 520);
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

    const stageBox = document.getElementById('surface-screen-touch-area');
    if (stageBox) stageBox.classList.remove('pouring');
  }

  triggerOverflow() {
    this.isOverflowed = true;
    this.isPouring = false;
    if (this.pourInterval) clearInterval(this.pourInterval);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.hub.sound.stopPour();

    const stageBox = document.getElementById('surface-screen-touch-area');
    if (stageBox) stageBox.classList.remove('pouring');

    this.hub.sound.playExplosion();
    this.hub.triggerPenalty({
      title: '🌊 술이 넘쳤다! 🌊',
      subtitle: '잔을 넘쳐버린 사람 시원하게 벌칙주 원샷!',
      accentColor: '#38bdf8'
    });
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    container.innerHTML = `
      <div class="party-game-box surface-minimal-box" id="surface-screen-touch-area">
        <!-- 화면 정중앙 캔버스 소주잔 (버튼/설명 일체 없이 화면 전체가 터치 영역) -->
        <div class="glass-canvas-wrap">
          <canvas id="tension-canvas" width="310" height="390"></canvas>
          <div class="tension-spill-fx ${this.isOverflowed ? 'active' : ''}"></div>
        </div>
      </div>
    `;

    this._bindEvents();
    this._startCanvasLoop();
  }

  _bindEvents() {
    const stage = document.getElementById('surface-screen-touch-area');
    if (!stage) return;

    const onDown = (e) => {
      e.preventDefault();
      if (this.isOverflowed) {
        this.reset();
        return;
      }
      this.startPour();
    };

    const onUp = (e) => {
      e.preventDefault();
      this.stopPour();
    };

    if (window.PointerEvent) {
      stage.onpointerdown = onDown;
      window.onpointerup = onUp;
      window.onpointercancel = onUp;
    } else {
      stage.ontouchstart = onDown;
      window.ontouchend = onUp;
      window.ontouchcancel = onUp;
      stage.onmousedown = onDown;
      window.onmouseup = onUp;
    }
  }

  _startCanvasLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const canvas = document.getElementById('tension-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderFrame = () => {
      this.wavePhase += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const glassTopY = 70;
      const glassBottomY = 340;
      const glassHeight = glassBottomY - glassTopY;
      const glassWidthTop = 220;
      const glassWidthBottom = 150;
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
      const meniscusBulge = fillRatio > 0.94 ? (fillRatio - 0.94) * 70 : 0;

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
      if (fillRatio > 0.92) {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.8;
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        for (let x = leftX; x <= rightX; x += 5) {
          const norm = (x - cx) / (glassWidthTop / 2);
          const dome = (1 - norm * norm) * meniscusBulge;
          const y = currentLiquidY - dome;
          if (x === leftX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();

      // 3. 유리잔 외곽 및 하이라이트 반사광
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - glassWidthTop / 2, glassTopY);
      ctx.lineTo(cx - glassWidthBottom / 2, glassBottomY);
      ctx.stroke();

      // 우측 하이라이트
      ctx.beginPath();
      ctx.moveTo(cx + glassWidthTop / 2, glassTopY);
      ctx.lineTo(cx + glassWidthBottom / 2, glassBottomY);
      ctx.stroke();

      // 잔 바닥 두꺼운 유리
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(cx - glassWidthBottom / 2, glassBottomY - 8, glassWidthBottom, 8);

      ctx.restore();

      if (!this.isOverflowed) {
        this.animId = requestAnimationFrame(renderFrame);
      }
    };

    this.animId = requestAnimationFrame(renderFrame);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.pourInterval) clearInterval(this.pourInterval);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.hub.sound.stopPour();
    this.isPouring = false;
  }
}

window.KSool.SurfaceTensionGame = SurfaceTensionGame;
