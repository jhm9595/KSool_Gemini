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
    this.showQuestionMark = false;
    this.breakTimestamp = 0;
    this.baseAngle = 0; // 최초 생성 시 병뚜껑 본체 & 꼬다리 연결 부위의 무작위 배치 각도 (0° ~ 360°)
    this.bendAngle = 0; // 꼬다리와 뚜껑 접점(100px 25px)을 축으로 한 좌우 휨 각도

    // 파워 차징 (왔다갔다 타이밍 조절 엔진)
    this.isCharging = false;
    this.chargeStartTime = 0;
    this.currentPower = 0.2; // 0.0 ~ 1.0
    this.animLoopId = null;
    this.lastHitPower = 'normal'; // 'light' | 'normal' | 'max'
    this.hitTextTimeout = null;
  }

  init() {
    this.reset();
  }

  reset() {
    if (this.animLoopId) {
      cancelAnimationFrame(this.animLoopId);
      this.animLoopId = null;
    }
    if (this.hitTextTimeout) {
      clearTimeout(this.hitTextTimeout);
      this.hitTextTimeout = null;
    }
    const oldWire = document.getElementById('cap-wire-transform-group');
    if (oldWire && oldWire.currentAnimation) {
      try { oldWire.currentAnimation.cancel(); } catch (_) {}
      oldWire.currentAnimation = null;
    }
    this.maxFatigue = Math.floor(Math.random() * 11) + 18; // 18 ~ 28회 상당 피로도
    this.currentFatigue = 0;
    this.isBroken = false;
    this.showQuestionMark = false;
    this.breakTimestamp = 0;
    this.isCharging = false;
    
    // 1. 최초 병뚜껑 본체와 꼬다리가 돌아가 있는 지점: 360도 무작위 각도로 결정
    this.baseAngle = Math.floor(Math.random() * 360);
    window.KSool = window.KSool || {};
    window.KSool.lastCapAngle = this.baseAngle;

    // 2. 꼬다리 자체의 접점 기준 휨 각도: 초기 0도 부근 자연스러운 상태
    this.bendAngle = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 6));

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

    document.querySelectorAll('.flick-timing-meter').forEach(el => el.classList.add('charging'));

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

    document.querySelectorAll('.flick-timing-meter').forEach(el => el.classList.remove('charging'));

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

    const startAngle = this.bendAngle || 0;

    // 1. 타격 방향(Direction) 결정:
    // - 거의 중립(중심 ±10도 이내)일 때는 좌/우 50% 확률로 결정
    // - 이미 한쪽으로 휘어 있다면: 70%는 휜 방향으로 더 깊게 꺾고, 30%는 반대편에서 강타하여 반대쪽으로 크게 젖힘
    let dir = 1;
    if (Math.abs(startAngle) < 10) {
      dir = Math.random() < 0.5 ? 1 : -1;
    } else {
      const curSign = Math.sign(startAngle);
      if (Math.random() < 0.7) {
        dir = curSign; // 순방향 심화
      } else {
        dir = -curSign; // 역방향 강타 (대폭 스윙)
      }
    }

    // 2. 파워 등급별 [순간 최대 튕김 각도(Peak)] 및 [영구 휨 변형 각도(Permanent Delta)]
    // - 톡 (light): 순간 18° ~ 26° 가볍게 튕김, 영구 변형 +8° ~ 14°
    // - 딱 (normal): 순간 52° ~ 74° 탄력 있게 크게 튕김, 영구 변형 +30° ~ 46°
    // - 빡! (max): 순간 105° ~ 138° (90도 직각 초과!) 사정없이 확 젖힘, 영구 변형 +70° ~ 92°
    let peakImpulse = 0;
    let permDelta = 0;

    if (powerLevel === 'light') {
      peakImpulse = 18 + Math.floor(Math.random() * 9); // 18° ~ 26°
      permDelta = 8 + Math.floor(Math.random() * 7);    // 8° ~ 14°
    } else if (powerLevel === 'normal') {
      peakImpulse = 52 + Math.floor(Math.random() * 23); // 52° ~ 74°
      permDelta = 30 + Math.floor(Math.random() * 17);   // 30° ~ 46°
    } else {
      // 풀파워 빡! 90도 직각을 넘어 105° ~ 138°까지 사정없이 홱 꺾임
      peakImpulse = 105 + Math.floor(Math.random() * 34); // 105° ~ 138°
      permDelta = 70 + Math.floor(Math.random() * 23);    // 70° ~ 92°
    }

    // 최종 목표 안착 각도 계산 (현실적인 알루미늄 철사 최대 휨 한계: ±125°)
    let targetBend = startAngle + (dir * permDelta);
    targetBend = Math.max(-125, Math.min(125, targetBend));
    this.bendAngle = Math.round(targetBend);

    // 순간 최대 피크 각도 계산 (최대 ±138°까지 순간 튕김 허용)
    let peakAngle = startAngle + (dir * peakImpulse);
    peakAngle = Math.max(-138, Math.min(138, peakAngle));

    const strainRatio = Math.min(1, this.currentFatigue / this.maxFatigue);

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

    // 시각 효과: 뚜껑 본체는 고정되어 있고, 꼬다리 와이어만 접점(100px 25px)을 축으로 물리 탄성 감쇠 진동!
    const wireGroup = document.getElementById('cap-wire-transform-group');
    const arena = document.getElementById('cap-flick-arena');

    if (arena) {
      arena.classList.remove('hit-light', 'hit-normal', 'hit-max');
      void arena.offsetWidth; // reflow
      arena.classList.add(`hit-${powerLevel}`);
    }

    if (wireGroup) {
      wireGroup.style.transformOrigin = '100px 25px';

      // 기존 진행 중인 애니메이션 정리
      if (wireGroup.currentAnimation) {
        try { wireGroup.currentAnimation.cancel(); } catch (_) {}
        wireGroup.currentAnimation = null;
      }

      // 파워 레벨별 물리 탄성 감쇠 진동(Spring-Damper Keyframes)
      let keyframes = [];
      let duration = 300;

      if (powerLevel === 'light') {
        // 톡: 0.26초 가볍고 빠른 1.5회 미세 바운스
        duration = 260;
        keyframes = [
          { transform: `rotate(${startAngle}deg)` },
          { transform: `rotate(${peakAngle}deg)`, offset: 0.3, easing: 'cubic-bezier(0.12, 0.9, 0.3, 1)' },
          { transform: `rotate(${this.bendAngle - (dir * 3)}deg)`, offset: 0.68 },
          { transform: `rotate(${this.bendAngle}deg)`, offset: 1.0 }
        ];
      } else if (powerLevel === 'normal') {
        // 딱: 0.42초 탄력 있게 촥 젖혀지며 2회 바운스
        duration = 420;
        const overshoot = (peakAngle - this.bendAngle) * 0.45;
        keyframes = [
          { transform: `rotate(${startAngle}deg)` },
          { transform: `rotate(${peakAngle}deg)`, offset: 0.22, easing: 'cubic-bezier(0.08, 0.95, 0.2, 1)' },
          { transform: `rotate(${this.bendAngle - overshoot}deg)`, offset: 0.52 },
          { transform: `rotate(${this.bendAngle + overshoot * 0.3}deg)`, offset: 0.78 },
          { transform: `rotate(${this.bendAngle}deg)`, offset: 1.0 }
        ];
      } else {
        // 빡!: 0.58초 90도 직각을 넘어 105°~138°까지 사정없이 확 젖혀진 후 3회 거칠게 요동치고 깊숙이 꺾임!
        duration = 580;
        const overshoot = (peakAngle - this.bendAngle) * 0.55;
        keyframes = [
          { transform: `rotate(${startAngle}deg)` },
          { transform: `rotate(${peakAngle}deg)`, offset: 0.18, easing: 'cubic-bezier(0.05, 0.98, 0.15, 1)' },
          { transform: `rotate(${this.bendAngle - overshoot}deg)`, offset: 0.45 },
          { transform: `rotate(${this.bendAngle + overshoot * 0.38}deg)`, offset: 0.68 },
          { transform: `rotate(${this.bendAngle - overshoot * 0.14}deg)`, offset: 0.85 },
          { transform: `rotate(${this.bendAngle}deg)`, offset: 1.0 }
        ];
      }

      wireGroup.style.setProperty('--fly-angle', `${this.bendAngle}deg`);

      try {
        const anim = wireGroup.animate(keyframes, {
          duration: duration,
          fill: 'forwards'
        });
        wireGroup.currentAnimation = anim;
        anim.onfinish = () => {
          wireGroup.style.transform = `rotate(${this.bendAngle}deg)`;
          if (wireGroup.currentAnimation === anim) {
            wireGroup.currentAnimation = null;
          }
        };
      } catch (_) {
        // Web Animations API 비지원 환경 폴백
        wireGroup.style.transform = `rotate(${this.bendAngle}deg)`;
      }
    }

    // 괄호 없이 임팩트 있는 톡, 딱!, 빡! 텍스트 (게이지와 뚜껑 사이 대칭 표시)
    let hitWord = '';
    let hitClass = '';

    if (powerLevel === 'light') {
      hitWord = '톡';
      hitClass = 'tok';
    } else if (powerLevel === 'normal') {
      hitWord = '딱!';
      hitClass = 'ttak';
    } else {
      hitWord = '빡!';
      hitClass = 'ppak';
    }

    const hitWordEls = document.querySelectorAll('.flick-hit-word');
    hitWordEls.forEach(el => {
      el.textContent = hitWord;
      el.className = `flick-hit-word ${hitClass} show`;
      el.classList.remove('pop-anim');
      void el.offsetWidth;
      el.classList.add('pop-anim');
    });

    clearTimeout(this.hitTextTimeout);
    this.hitTextTimeout = setTimeout(() => {
      hitWordEls.forEach(el => el.classList.remove('show'));
    }, 750);

    // 부러짐 판정 체크 (피로도 한계 도달)
    if (this.currentFatigue >= this.maxFatigue) {
      this.isBroken = true;
      this.showQuestionMark = true;
      this.breakTimestamp = performance.now();
      window.KSool = window.KSool || {};
      window.KSool.lastCapAngle = this.baseAngle;

      if (wireGroup) {
        if (wireGroup.currentAnimation) {
          try { wireGroup.currentAnimation.cancel(); } catch (_) {}
          wireGroup.currentAnimation = null;
        }
        wireGroup.style.transformOrigin = '100px 25px';
        const flyAngle = peakAngle || this.bendAngle || 0;
        wireGroup.style.setProperty('--fly-angle', `${flyAngle}deg`);
        wireGroup.classList.add('broken-fly');
      }

      // 부러진 단면 스텀프는 접점에 그대로 표시
      const stump = document.getElementById('soju-cap-broken-stump');
      if (stump) {
        stump.style.opacity = '1';
      }

      this.hub.sound.playSnap();
      setTimeout(() => this.hub.sound.playExplosion(), 120);
      this.hub.vibratePenalty();

      hitWordEls.forEach(el => {
        el.textContent = '빡!';
        el.className = 'flick-hit-word ppak show pop-anim';
      });

      clearTimeout(this.hitTextTimeout);
      this.hitTextTimeout = setTimeout(() => {
        hitWordEls.forEach(el => el.classList.remove('show'));
      }, 900);

      // 300ms 후 병뚜껑 가운데 ? 버튼 등장 (불필요한 하단 텍스트/버튼 없이 뚜껑에만 표시)
      setTimeout(() => {
        const qBtn = document.getElementById('cap-question-btn');
        if (qBtn) qBtn.classList.add('show');
      }, 300);
    }

    this._updateMeterUI(this.currentPower);
  }

  /**
   * 병뚜껑 가운데 ? 클릭 시 Up & Down 게임으로 매끄럽게 전환
   */
  _goToUpDown() {
    this.hub.sound.playTap();
    this.hub.vibrateShort();
    this.showQuestionMark = false;
    this.isBroken = false;
    this.hub.playGame('updown');
  }

  _updateMeterUI(power) {
    const cursors = document.querySelectorAll('.flick-meter-cursor');
    const fills = document.querySelectorAll('.flick-meter-fill');
    if (!cursors.length || !fills.length) return;

    const percent = Math.min(100, Math.max(0, power * 100));
    cursors.forEach(cursor => {
      cursor.style.left = `${percent}%`;
    });
    fills.forEach(fill => {
      fill.style.width = `${percent}%`;
      if (percent <= 33) {
        fill.style.background = 'linear-gradient(90deg, #10b981, #22c55e)';
      } else if (percent <= 72) {
        fill.style.background = 'linear-gradient(90deg, #22c55e, #eab308)';
      } else {
        fill.style.background = 'linear-gradient(90deg, #eab308, #ef4444)';
      }
    });
  }

  // =========================================================================
  // 미니멀 렌더링 & 이벤트 바인딩 (오프라인 양방향 대칭 게이지)
  // =========================================================================

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    const meterHtml = `
      <div class="flick-timing-meter">
        <div class="flick-meter-zones">
          <span class="m-zone green">🟢 톡 (약)</span>
          <span class="m-zone yellow">🟡 딱 (중)</span>
          <span class="m-zone red">🔴 빡! (강)</span>
        </div>
        <div class="flick-meter-track">
          <div class="flick-meter-fill" style="width: 20%;"></div>
          <div class="flick-meter-cursor" style="left: 20%;"></div>
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="party-game-box capflick-minimal-box tabletop-symmetrical">
        <!-- 1. 상단: 대칭 타이밍 파워 게이지 (상대방 플레이어용 180도 회전) -->
        <div class="flick-power-section top-symmetrical">
          ${meterHtml}
        </div>

        <!-- 2. 상단 타격 강도 피드백 (게이지와 뚜껑 사이, 대칭 180도 회전, 정중앙 세로줄) -->
        <div class="flick-hit-slot top-symmetrical">
          <div class="flick-hit-word" id="flick-hit-top"></div>
        </div>

        <!-- 3. 메인 인터랙션 아레나 (중앙 초록 병뚜껑 + 2배 길어진 꼬다리 와이어) -->
        <div class="capflick-center-stage" id="cap-flick-arena">
          <svg class="soju-cap-flick-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
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

            <!-- 전체 캡 어셈블리 (최초에만 360도 중 랜덤 각도로 위치가 정해지고, 게임 도중에는 고정됨) -->
            <g id="soju-cap-assembly" style="transform-origin: 100px 100px; transform: rotate(${this.baseAngle || 0}deg);">
              <!-- 1. 초록 메탈 병뚜껑 (화면 정중앙 100, 100 기준) -->
              <g class="soju-cap-main-group">
                <!-- 외곽 주름 톱니 (fluted rim 28개) -->
                <circle cx="100" cy="100" r="76" fill="#14532d"/>
                <circle cx="100" cy="100" r="73" fill="#16a34a" stroke="#86efac" stroke-width="2"/>
                <!-- 캡 돔 본체 -->
                <circle cx="100" cy="100" r="68" fill="url(#cap-metal-grad)" stroke="#22c55e" stroke-width="3"/>
                <!-- 캡 내부 메탈 음각 링 2겹 -->
                <circle cx="100" cy="100" r="54" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2.5"/>
                <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
                <circle cx="100" cy="100" r="24" fill="rgba(21,128,61,0.5)" stroke="rgba(134,239,172,0.4)" stroke-width="1.5"/>
              </g>

              <!-- 2. 꼬다리가 뜯겨나간 단면 스텀프 (접점 위치에 고정) -->
              <g id="soju-cap-broken-stump" 
                 class="soju-cap-broken-stump" 
                 style="opacity: ${this.isBroken ? 1 : 0};">
                <path d="M92 33 L108 33 L105 25 L95 25 Z" fill="#15803d" stroke="#86efac" stroke-width="1.5"/>
                <circle cx="100" cy="24" r="2.5" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
              </g>

              <!-- 3. 길고 디테일한 알루미늄 꼬다리 와이어 (회전 중심점: 병뚜껑과의 접점 100px 25px!) -->
              <g id="cap-wire-transform-group" 
                 class="${this.isBroken ? 'broken-fly' : ''}" 
                 style="transform-origin: 100px 25px; transform: rotate(${this.bendAngle || 0}deg); --fly-angle: ${this.bendAngle || 0}deg;">
                
                <!-- 캡과 이어지는 브래킷 조인트 -->
                <path d="M92 33 L108 33 L105 25 L95 25 Z" fill="#15803d" stroke="#86efac" stroke-width="1.5"/>
                
                <!-- 2배 길어진 꼬다리 와이어 (현실적인 꼬임 알루미늄 스트랩) -->
                <path d="M97 25 
                         C 95 -5, 105 -30, 98 -60 
                         C 93 -85, 106 -110, 100 -135 
                         C 98 -149, 110 -155, 115 -147 
                         C 118 -140, 111 -133, 106 -127
                         C 112 -105, 99 -80, 104 -55
                         C 111 -25, 101 0, 103 25 Z" 
                      fill="url(#wire-silver-grad)" 
                      stroke="#475569" 
                      stroke-width="1.5"
                      filter="drop-shadow(0 6px 12px rgba(0,0,0,0.55))"/>

                <!-- 와이어 하이라이트 반사선 -->
                <path d="M99 20 C 98 -3, 104 -27, 100 -57 C 96 -83, 105 -108, 102 -130" 
                      stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
                
                <!-- 끝부분 비틀림 컬 팁 -->
                <circle cx="112" cy="-148" r="3.5" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
              </g>
            </g>

            <!-- 4. 병뚜껑 가운데 ? 버튼 (꼬다리 끊어지면 등장하는 숫자게임 바로가기) -->
            <g id="cap-question-btn" 
               class="cap-question-btn ${this.showQuestionMark ? 'show' : ''}" 
               role="button" 
               aria-label="Up & Down 숫자 게임으로 이동"
               style="transform-origin: 100px 100px;">
              <!-- 펄스 회전 글로우 헤일로 -->
              <circle cx="100" cy="100" r="42" class="q-pulse-halo"/>
              <!-- 메인 골드 디스크 -->
              <circle cx="100" cy="100" r="32" class="q-main-disc"/>
              <!-- 내부 엠보스 림 -->
              <circle cx="100" cy="100" r="28" class="q-inner-rim"/>
              <!-- ? 텍스트 -->
              <text x="100" y="100" text-anchor="middle" dominant-baseline="central" class="q-mark-char">?</text>
            </g>
          </svg>
        </div>

        <!-- 4. 하단 타격 강도 피드백 (뚜껑과 게이지 사이, 정방향 0도, 정중앙 세로줄) -->
        <div class="flick-hit-slot bottom-symmetrical">
          <div class="flick-hit-word" id="flick-hit-bottom"></div>
        </div>

        <!-- 5. 하단: 대칭 타이밍 파워 게이지 (내 쪽 플레이어용 정방향) -->
        <div class="flick-power-section bottom-symmetrical">
          ${meterHtml}
        </div>
      </div>
    `;

    this._bindTouchEvents();
  }

  _bindTouchEvents() {
    const stage = document.querySelector('.capflick-minimal-box') || document.getElementById('cap-flick-arena');
    if (!stage) return;

    // 포인터 다운 (누르기 시작: 파워 차징 시작 또는 ? 버튼 처리)
    const onStart = (e) => {
      // 1. 병뚜껑 가운데 ? 버튼 클릭 시 Up & Down 화면으로 즉시 전환
      if (e.target && e.target.closest('#cap-question-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this._goToUpDown();
        return;
      }

      // 2. ? 버튼이 떠 있는 상태에서 화면의 다른 곳을 터치하면: ? 사라지고 꼬다리 치기 계속 (리셋)
      if (this.showQuestionMark) {
        if (performance.now() - this.breakTimestamp < 350) return;
        e.preventDefault();
        e.stopPropagation();
        this.hub.sound.playTap();
        this.reset();
        return;
      }

      // 3. 정상 상태: 파워 차징 시작
      e.preventDefault();
      this._startCharging();
    };

    // 포인터 업 (손 떼기: 파워 결정 및 타격)
    const onEnd = (e) => {
      if (this.showQuestionMark) return;
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

    // SVG ? 버튼에 직접 클릭 이벤트도 보강
    const qBtn = document.getElementById('cap-question-btn');
    if (qBtn) {
      const handleQ = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._goToUpDown();
      };
      qBtn.onclick = handleQ;
      qBtn.ontouchend = handleQ;
    }
  }

  destroy() {
    if (this.animLoopId) {
      cancelAnimationFrame(this.animLoopId);
      this.animLoopId = null;
    }
    if (this.hitTextTimeout) {
      clearTimeout(this.hitTextTimeout);
      this.hitTextTimeout = null;
    }
    this.isCharging = false;
    this.showQuestionMark = false;
    if (window.PointerEvent) {
      window.onpointerup = null;
      window.onpointercancel = null;
    } else {
      window.ontouchend = null;
      window.ontouchcancel = null;
      window.onmouseup = null;
    }
  }
}

window.KSool.CapFlickGame = CapFlickGame;
