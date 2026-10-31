window.KSool = window.KSool || {};

/**
 * ② 병뚜껑 꼬다리 치기 (릴레이 타격형)
 * 실제 소주 뚜껑의 철사 꼬다리를 손가락 튕기기로 날리듯,
 * 폰 화면 속 꼬다리를 1인당 정해진 횟수만큼 튕겨서 완전히 날려버리는 사람이 당첨되는 릴레이 게임.
 */
class CapFlickGame {
  constructor(hub) {
    this.hub = hub;
    this.maxHits = 20; // 15~28 랜덤
    this.currentHits = 0;
    this.turnHitsAllowed = 2; // 턴당 1~3회
    this.turnHitsUsed = 0;
    this.totalPlayers = 4;
    this.currentTurnPlayer = 1;
    this.isBroken = false;
    this.angle = 12; // 꼬다리 각도
    this.wobble = false;
  }

  init() {
    this.reset();
  }

  reset() {
    this.maxHits = Math.floor(Math.random() * 12) + 16; // 16 ~ 27회
    this.currentHits = 0;
    this.turnHitsUsed = 0;
    this.isBroken = false;
    this.angle = 15;
    this.render();
  }

  flick() {
    if (this.isBroken) {
      this.reset();
      return;
    }

    this.currentHits++;
    this.turnHitsUsed++;

    const strainRatio = this.currentHits / this.maxHits;
    this.angle = (this.angle > 0 ? -1 : 1) * (15 + strainRatio * 65);

    // 사운드 및 진동 피드백
    this.hub.sound.playMetalHit(strainRatio);
    this.hub.vibrateShort();

    if (this.currentHits >= this.maxHits) {
      // 꼬다리 똑 부러짐!
      this.isBroken = true;
      this.hub.sound.playSnap();
      setTimeout(() => this.hub.sound.playExplosion(), 120);
      this.hub.triggerPenalty({
        title: '💥 꼬다리가 날아갔다! 💥',
        subtitle: `[ 플레이어 ${this.currentTurnPlayer} ] 당첨! 시원하게 원샷!`,
        accentColor: '#10b981'
      });
      this.render();
      return;
    }

    // 턴 넘김 체크
    if (this.turnHitsUsed >= this.turnHitsAllowed) {
      this.nextPlayer();
    } else {
      this.render();
    }
  }

  nextPlayer() {
    this.turnHitsUsed = 0;
    this.currentTurnPlayer = (this.currentTurnPlayer % this.totalPlayers) + 1;
    this.render();
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    const strainPercent = Math.min(100, Math.round((this.currentHits / this.maxHits) * 100));
    // 피로도 누적 시 색상 (초록 -> 밝은 흰색빛/노랑)
    const capBendAngle = this.isBroken ? 180 : this.angle;

    container.innerHTML = `
      <div class="party-game-box capflick-box">
        <!-- 턴 안내 배너 -->
        <div class="party-turn-indicator">
          <div class="party-turn-badge">
            <span class="pulse-dot"></span>
            <b>플레이어 ${this.currentTurnPlayer} 차례!</b> (남은 튕기기: ${this.turnHitsAllowed - this.turnHitsUsed}회)
          </div>
          <div class="flick-fatigue-bar-wrap">
            <div class="flick-fatigue-label">
              <span>꼬다리 피로도</span>
              <span>${strainPercent >= 75 ? '⚠️ 곧 부러짐!' : `${strainPercent}%`}</span>
            </div>
            <div class="flick-fatigue-track">
              <div class="flick-fatigue-fill ${strainPercent >= 75 ? 'danger' : ''}" style="width:${strainPercent}%;"></div>
            </div>
          </div>
        </div>

        <!-- 병뚜껑 & 꼬다리 3D 인터랙션 존 -->
        <div class="flick-stage-arena" id="flick-target-area">
          <div class="soju-cap-body">
            <div class="cap-grooves"></div>
            <div class="cap-core-ring">
              <span class="cap-korean-text">소 주</span>
            </div>
          </div>

          <!-- 구부러지는 꼬다리 알루미늄 철사 -->
          <div class="cap-tail-wire ${this.isBroken ? 'broken-fly' : ''}" 
               style="transform: rotate(${capBendAngle}deg);">
            <div class="cap-wire-joint"></div>
            <div class="cap-wire-segment ${strainPercent >= 60 ? 'whitened' : ''}">
              <div class="cap-wire-tip"></div>
            </div>
          </div>

          <!-- 타격 터치 가이드 -->
          <div class="flick-tap-callout ${this.isBroken ? 'hide' : ''}">
            👆 <b>꼬다리를 튕기세요!</b> (화면 터치/스와이프)
          </div>
        </div>

        <!-- 하단 컨트롤 & 인원수 설정 -->
        <div class="party-bottom-controls">
          <button type="button" class="party-action-btn primary" id="btn-manual-flick">
            👊 튕기기 (${this.turnHitsAllowed - this.turnHitsUsed}/${this.turnHitsAllowed})
          </button>
          <button type="button" class="party-action-btn next-turn" id="btn-pass-turn">
            👉 다음 사람 패스
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
  }

  _bindEvents() {
    const stage = document.getElementById('flick-target-area');
    const manualBtn = document.getElementById('btn-manual-flick');
    const passBtn = document.getElementById('btn-pass-turn');

    const handleAction = () => {
      this.flick();
    };

    if (stage) {
      stage.onclick = handleAction;
    }
    if (manualBtn) {
      manualBtn.onclick = (e) => {
        e.stopPropagation();
        handleAction();
      };
    }
    if (passBtn) {
      passBtn.onclick = (e) => {
        e.stopPropagation();
        this.nextPlayer();
      };
    }

    document.querySelectorAll('[data-players]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.totalPlayers = Number(e.currentTarget.getAttribute('data-players'));
        this.reset();
      };
    });
  }
}

window.KSool.CapFlickGame = CapFlickGame;
