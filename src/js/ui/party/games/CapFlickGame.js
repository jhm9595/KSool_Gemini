window.KSool = window.KSool || {};

/**
 * ② 병뚜껑 꼬다리 치기 (미니멀 물리 타격형)
 * - 불필요한 참가자 설정, 턴 배너, 패스 버튼 전부 제거
 * - 소주 텍스트 없는 순수 초록 메탈 병뚜껑 + 2배 이상 길어진 실감 나는 알루미늄 꼬다리
 * - 피로도 퍼센티지 완전 은닉 (언제 끊어질지 모르는 극강의 긴장감)
 * - 누르고 있으면 파워가 왔다갔다(진동/스윙)하며 손을 떼는 순간 타이밍에 맞춰 [살살 톡 / 보통 딱 / 풀파워 빡!] 조절
 */
class CapFlickGame {
  constructor(hub) {
    this.hub = hub;
    this.maxFatigue = 22; // 18~28 랜덤 피로도 한계
    this.currentFatigue = 0; // 누적 피로도 (유저에게 절대 비공개)
    this.isBroken = false;
    this.angle = 14; // 현재 꼬다리 각도

    // 파워 차징 (왔다갔다 타이밍 조절 엔진)
    this.isCharging = false;
    this.chargeStartTime = 0;
    this.currentPower = 0.2; // 0.0 ~ 1.0
    this.animLoopId = null;
    this.lastHitPower = 'normal'; // 'light' | 'normal' | 'max'
  }

  init() {
    this.reset();
  }

  reset() {
    if (this.animLoopId) {
      cancelAnimationFrame(this.animLoopId);
      this.animLoopId = null;
    }
    this.maxFatigue = Math.floor(Math.random() * 11) + 18; // 18 ~ 28회 상당 피로도
    this.currentFatigue = 0;
    this.isBroken = false;
    this.isCharging = false;
    this.angle = 14;
    this.currentPower = 0.2;
    this.render();
  }

  // =========================================================================
  // 파워 차징 & 타이밍 오실레이션 엔진
  // =========================================================================

  _startCharging() {
    if (this.isBroken) {
      this.reset();
      return;
    }

    this.isCharging = true;
    this.chargeStartTime = performance.now();

    const meterEl = document.getElementById('flick-timing-meter');
    if (meterEl) meterEl.classList.add('charging');

    const updateLoop = () => {
      if (!this.isCharging) return;

      const elapsed = performance.now() - this.chargeStartTime;
      const cycleDuration = 620; // 620ms 주기 (리드미컬하게 왔다갔다)
      const phase = (elapsed % cycleDuration) / cycleDuration;

      // 0.0 -> 1.0 -> 0.0 삼각파 핑퐁
      this.currentPower = phase < 0.5 ? (phase * 2) : (2 - phase * 2);

      this._updateMeterUI(this.currentPower);
      this.animLoopId = requestAnimationFrame(updateLoop);
    };

    this.animLoopId = requestAnimationFrame(updateLoop);
  }

  _releaseAndFlick() {
    if (!this.isCharging) return;
    this.isCharging = false;

    if (this.animLoopId) {
      cancelAnimationFrame(this.animLoopId);
      this.animLoopId = null;
    }

    const meterEl = document.getElementById('flick-timing-meter');
    if (meterEl) meterEl.classList.remove('charging');

    const holdDuration = performance.now() - this.chargeStartTime;

    // 150ms 미만 짧은 탭은 안전한 [살살 톡]으로 기본 적용
    let powerLevel = 'normal';
    let fatigueIncrement = 2;

    if (holdDuration < 150 || this.currentPower <= 0.33) {
      powerLevel = 'light';
      fatigueIncrement = 1; // 살살 1회
    } else if (this.currentPower <= 0.72) {
      powerLevel = 'normal';
      fatigueIncrement = Math.random() < 0.5 ? 2 : 3; // 보통 2~3회
    } else {
      powerLevel = 'max';
      fatigueIncrement = Math.random() < 0.5 ? 4 : 5; // 풀파워 4~5회!
    }

    this.lastHitPower = powerLevel;
    this._executeFlickHit(fatigueIncrement, powerLevel);
  }

  _executeFlickHit(fatigueInc, powerLevel) {
    this.currentFatigue += fatigueInc;

    // 반대 방향으로 꼬다리 꺾임 + 피로도에 따라 휘는 각도 증가
    const dir = this.angle >= 0 ? -1 : 1;
    const strainRatio = Math.min(1, this.currentFatigue / this.maxFatigue);
    const extraBend = powerLevel === 'max' ? 14 : (powerLevel === 'normal' ? 7 : 0);
    this.angle = dir * (16 + strainRatio * 42 + extraBend);

    // 오디오 & 진동 피드백
    if (powerLevel === 'light') {
      this.hub.sound.playMetalHit(strainRatio * 0.6);
      this.hub.vibrateShort();
    } else if (powerLevel === 'normal') {
      this.hub.sound.playMetalHit(strainRatio);
      this.hub.vibrateShort();
    } else {
      // 풀파워 빡!
      this.hub.sound.playMetalHit(1.2);
      if (navigator.vibrate) {
        try { navigator.vibrate([30, 40, 70]); } catch (_) {}
      }
    }

    // 시각 효과: 와이어 스프링 흔들림 & 타격 강도 배지
    const wireGroup = document.getElementById('cap-wire-transform-group');
    const arena = document.getElementById('cap-flick-arena');
    const feedbackBadge = document.getElementById('flick-feedback-badge');

    if (arena) {
      arena.classList.remove('hit-light', 'hit-normal', 'hit-max');
      void arena.offsetWidth; // reflow
      arena.classList.add(`hit-${powerLevel}`);
    }

    if (wireGroup) {
      wireGroup.style.transform = `rotate(${this.angle}deg)`;
      wireGroup.classList.remove('spring-shake');
      void wireGroup.offsetWidth;
      wireGroup.classList.add('spring-shake');
    }

    if (feedbackBadge) {
      if (powerLevel === 'light') {
        feedbackBadge.textContent = '🟢 톡! (살살)';
        feedbackBadge.className = 'flick-feedback-badge light show';
      } else if (powerLevel === 'normal') {
        feedbackBadge.textContent = '🟡 딱! (보통)';
        feedbackBadge.className = 'flick-feedback-badge normal show';
      } else {
        feedbackBadge.textContent = '💥 빡!! (풀파워)';
        feedbackBadge.className = 'flick-feedback-badge max show';
      }
    }

    // 부러짐 판정 체크 (피로도 한계 도달)
    if (this.currentFatigue >= this.maxFatigue) {
      this.isBroken = true;

      if (wireGroup) {
        wireGroup.classList.remove('spring-shake');
        wireGroup.classList.add('broken-fly');
      }

      this.hub.sound.playSnap();
      setTimeout(() => this.hub.sound.playExplosion(), 120);

      this.hub.triggerPenalty({
        title: '💥 꼬다리 끊어짐! 당첨! 💥',
        subtitle: '꼬다리를 날려버린 사람 시원하게 원샷!',
        accentColor: '#10b981'
      });
    }

    this._updateMeterUI(this.currentPower);
  }

  _updateMeterUI(power) {
    const cursor = document.getElementById('flick-meter-cursor');
    const fill = document.getElementById('flick-meter-fill');
    if (!cursor || !fill) return;

    const percent = Math.min(100, Math.max(0, power * 100));
    cursor.style.left = `${percent}%`;
    fill.style.width = `${percent}%`;

    if (percent <= 33) {
      fill.style.background = 'linear-gradient(90deg, #10b981, #22c55e)';
    } else if (percent <= 72) {
      fill.style.background = 'linear-gradient(90deg, #22c55e, #eab308)';
    } else {
      fill.style.background = 'linear-gradient(90deg, #eab308, #ef4444)';
    }
  }

  // =========================================================================
  // 미니멀 렌더링 & 이벤트 바인딩
  // =========================================================================

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    container.innerHTML = `
      <div class="party-game-box capflick-minimal-box">
        <!-- 메인 인터랙션 아레나 (중앙 초록 병뚜껑 + 2배 길어진 꼬다리 와이어) -->
        <div class="capflick-center-stage" id="cap-flick-arena">
          <svg class="soju-cap-flick-svg" viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <!-- 뚜껑 메탈 그라데이션 -->
              <radialGradient id="cap-metal-grad" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stop-color="#4ade80"/>
                <stop offset="35%" stop-color="#16a34a"/>
                <stop offset="70%" stop-color="#15803d"/>
                <stop offset="100%" stop-color="#052e16"/>
              </radialGradient>
              <linearGradient id="cap-groove-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#86efac"/>
                <stop offset="100%" stop-color="#14532d"/>
              </linearGradient>
              <!-- 알루미늄 철사 그라데이션 -->
              <linearGradient id="wire-silver-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#94a3b8"/>
                <stop offset="35%" stop-color="#f8fafc"/>
                <stop offset="70%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
            </defs>

            <!-- 1. 초록 메탈 병뚜껑 (글자 일체 없이 깔끔하고 고급스러운 메탈릭 캡) -->
            <g class="soju-cap-main-group">
              <!-- 외곽 주름 톱니 (fluted rim 28개) -->
              <circle cx="160" cy="275" r="76" fill="#14532d"/>
              <circle cx="160" cy="275" r="73" fill="#16a34a" stroke="#86efac" stroke-width="2"/>
              <!-- 캡 돔 본체 -->
              <circle cx="160" cy="275" r="68" fill="url(#cap-metal-grad)" stroke="#22c55e" stroke-width="3"/>
              <!-- 캡 내부 메탈 음각 링 2겹 -->
              <circle cx="160" cy="275" r="54" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2.5"/>
              <circle cx="160" cy="275" r="38" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
              <circle cx="160" cy="275" r="24" fill="rgba(21,128,61,0.5)" stroke="rgba(134,239,172,0.4)" stroke-width="1.5"/>
            </g>

            <!-- 2. 길고 디테일한 알루미늄 꼬다리 와이어 (회전 중심점: 캡 상단 결합부 160, 206) -->
            <g id="cap-wire-transform-group" 
               class="${this.isBroken ? 'broken-fly' : ''}" 
               style="transform-origin: 160px 206px; transform: rotate(${this.angle}deg);">
              
              <!-- 캡과 이어지는 브래킷 조인트 -->
              <path d="M152 208 L168 208 L165 200 L155 200 Z" fill="#15803d" stroke="#86efac" stroke-width="1.5"/>
              
              <!-- 2배 길어진 꼬다리 와이어 (160px 길이의 현실적인 꼬임 알루미늄 스트랩) -->
              <!-- 와이어 본체 실루엣: 비틀림 굴곡 & 끝부분 살짝 휜 갈고리 -->
              <path d="M157 200 
                       C 155 170, 165 145, 158 115 
                       C 153 90, 166 65, 160 40 
                       C 158 26, 170 20, 175 28 
                       C 178 35, 171 42, 166 48
                       C 172 70, 159 95, 164 120
                       C 171 150, 161 175, 163 200 Z" 
                    fill="url(#wire-silver-grad)" 
                    stroke="#475569" 
                    stroke-width="1.5"
                    filter="drop-shadow(0 6px 12px rgba(0,0,0,0.55))"/>

              <!-- 와이어 하이라이트 반사선 -->
              <path d="M159 195 C 158 172, 164 148, 160 118 C 156 92, 165 67, 162 45" 
                    stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
              
              <!-- 끝부분 비틀림 컬 팁 -->
              <circle cx="172" cy="27" r="3.5" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
            </g>
          </svg>

          <!-- 실시간 타격 강도 팝업 배지 -->
          <div id="flick-feedback-badge" class="flick-feedback-badge"></div>
        </div>

        <!-- 하단: 왔다갔다 타이밍 파워 게이지 (설명 텍스트 없이 순수 게이지 정보만 유지) -->
        <div class="flick-power-section">
          <div class="flick-timing-meter" id="flick-timing-meter">
            <div class="flick-meter-zones">
              <span class="m-zone green">🟢 톡 (약)</span>
              <span class="m-zone yellow">🟡 딱 (중)</span>
              <span class="m-zone red">🔴 빡! (강)</span>
            </div>
            <div class="flick-meter-track">
              <div class="flick-meter-fill" id="flick-meter-fill" style="width: 20%;"></div>
              <div class="flick-meter-cursor" id="flick-meter-cursor" style="left: 20%;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindTouchEvents();
  }

  _bindTouchEvents() {
    const stage = document.querySelector('.capflick-minimal-box') || document.getElementById('cap-flick-arena');
    if (!stage) return;

    // 포인터 다운 (누르기 시작: 파워 차징 시작)
    const onStart = (e) => {
      e.preventDefault();
      this._startCharging();
    };

    // 포인터 업 (손 떼기: 파워 결정 및 타격)
    const onEnd = (e) => {
      e.preventDefault();
      this._releaseAndFlick();
    };

    // 모바일 터치 + PC 마우스 통합 지원
    if (window.PointerEvent) {
      stage.onpointerdown = onStart;
      window.onpointerup = onEnd;
      window.onpointercancel = onEnd;
    } else {
      stage.ontouchstart = onStart;
      window.ontouchend = onEnd;
      window.ontouchcancel = onEnd;
      stage.onmousedown = onStart;
      window.onmouseup = onEnd;
    }
  }

  destroy() {
    if (this.animLoopId) {
      cancelAnimationFrame(this.animLoopId);
      this.animLoopId = null;
    }
    this.isCharging = false;
  }
}

window.KSool.CapFlickGame = CapFlickGame;
