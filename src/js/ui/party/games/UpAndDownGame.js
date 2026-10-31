window.KSool = window.KSool || {};

/**
 * ① 소주 뚜껑 숫자 Up & Down (오프라인 술자리 낙장불입 버전)
 * - 상단 영역 박스 제거 -> 큼지막한 두 줄 [10 UP] [40 DOWN] 타이포그래피
 * - 3x4 12칸 스마트폰 다이얼 패드 (0 좌측: 새게임, 우측: 확인)
 * - 키보드 입력 차단 순수 터치 디스플레이
 * - 1~50 고정 (1~100 제거)
 * - 가운데 뚜껑 크기 대폭 확대 및 설명 문구 제거
 * - [낙장불입 규칙]: 범위 밖의 숫자나 범위에 올 수 없는 숫자로 시작하면 즉시 탈락(걸림) 처리!
 */
class UpAndDownGame {
  constructor(hub) {
    this.hub = hub;
    this.maxNumber = 50; // 1~50 고정
    this.secretNumber = 0;
    this.minRange = 1;
    this.maxRange = 50;
    this.lastUpVal = 0;
    this.lastDownVal = 51;
    this.inputVal = '';
    this.isFinished = false;
    this.lastResult = null; // 'UP' | 'DOWN' | 'BOMB'
  }

  init() {
    this.reset();
  }

  reset() {
    this.secretNumber = Math.floor(Math.random() * this.maxNumber) + 1;
    this.minRange = 1;
    this.maxRange = this.maxNumber;
    this.lastUpVal = 0;
    this.lastDownVal = this.maxNumber + 1; // 51
    this.inputVal = '';
    this.isFinished = false;
    this.lastResult = null;
    this.render();
  }

  // =========================================================================
  // 낙장불입 유효성 검사 엔진
  // =========================================================================

  /**
   * 입력된 접두사(prefix)가 현재 유효 범위 [minRange, maxRange] 내의 숫자를 만들 수 있는지 검사
   */
  _canPrefixBeValid(prefix) {
    if (!prefix) return true;
    const n = Number(prefix);
    if (isNaN(n)) return false;

    // 1자리 입력인 경우
    if (prefix.length === 1) {
      if (prefix === '0') return false; // 1~50 게임에서 0으로 시작하는 유효 숫자는 없음

      // 해당 1자리 숫자가 범위 안에 들어오는 경우 (예: 5 in [3, 9])
      if (n >= this.minRange && n <= this.maxRange) {
        return true;
      }

      // 십의 자리가 n인 2자리 수 [10*n, 10*n + 9]가 [minRange, maxRange]와 겹치는지 확인
      const lowest = n * 10;
      const highest = Math.min(this.maxNumber, n * 10 + 9);

      if (lowest <= highest) {
        const overlapStart = Math.max(lowest, this.minRange);
        const overlapEnd = Math.min(highest, this.maxRange);
        if (overlapStart <= overlapEnd) {
          return true; // 2자리 숫자를 완성했을 때 범위 안에 들어올 가능성 있음
        }
      }
      return false; // 이 숫자로 시작해서는 절대 범위 안의 숫자를 만들 수 없음 -> 탈락!
    }

    // 2자리 입력인 경우
    if (prefix.length === 2) {
      return n >= this.minRange && n <= this.maxRange;
    }

    // 3자리 이상 (50을 초과하므로 불가)
    return false;
  }

  handleDigitPress(digit) {
    if (this.isFinished) {
      this.reset();
      return;
    }

    const candidate = this.inputVal + String(digit);

    // 낙장불입 검사: 입력한 순간 사이에 올 수 없는 숫자라면 즉시 탈락!
    if (!this._canPrefixBeValid(candidate)) {
      this.inputVal = candidate;
      this._triggerOutOfRangeFail(candidate);
      return;
    }

    this.inputVal = candidate;
    this.hub.sound.playTap();
    this.hub.vibrateShort();
    this._updateDisplayOnly();
  }

  submitGuess() {
    if (this.isFinished) {
      this.reset();
      return;
    }

    if (!this.inputVal) return;

    const val = Number(this.inputVal);

    // 1자리만 누르고 확인을 눌렀는데 범위 미달인 경우 (예: 18~35 범위에서 '2' 누르고 확인)
    if (val < this.minRange || val > this.maxRange) {
      this._triggerOutOfRangeFail(this.inputVal);
      return;
    }

    // 정답 당첨!
    if (val === this.secretNumber) {
      this.isFinished = true;
      this.lastResult = 'BOMB';
      this.hub.sound.playExplosion();
      this.hub.triggerPenalty({
        title: '당첨! 원샷!',
        subtitle: `정답 [ ${this.secretNumber} ]`,
        accentColor: '#10b981',
        icon: '💥'
      });
      this.render();
      return;
    }

    if (val < this.secretNumber) {
      // UP!
      this.minRange = val + 1;
      this.lastUpVal = val;
      this.lastResult = 'UP';
      this.hub.sound.playUp();
      this.hub.vibrateShort();
    } else {
      // DOWN!
      this.maxRange = val - 1;
      this.lastDownVal = val;
      this.lastResult = 'DOWN';
      this.hub.sound.playDown();
      this.hub.vibrateShort();
    }

    this.inputVal = '';
    this.render();
    this._triggerFlashAnimation(this.lastResult);
  }

  _triggerFlashAnimation(type) {
    const box = document.querySelector('.updown-box');
    if (!box) return;

    // 이전 플래시 엘리먼트 정리
    box.querySelectorAll('.updown-flash-banner, .updown-flash-vignette').forEach(el => el.remove());

    const isUp = type === 'UP';
    const text = isUp ? '▲ UP' : '▼ DOWN';
    const typeClass = isUp ? 'up' : 'down';

    const vignette = document.createElement('div');
    vignette.className = `updown-flash-vignette ${typeClass}`;

    const banner = document.createElement('div');
    banner.className = `updown-flash-banner ${typeClass}`;
    banner.textContent = text;

    box.appendChild(vignette);
    box.appendChild(banner);

    setTimeout(() => {
      vignette.remove();
      banner.remove();
    }, 750);
  }

  _triggerOutOfRangeFail(wrongNum) {
    this.isFinished = true;
    this.lastResult = 'BOMB';
    this.hub.sound.playExplosion();
    this.hub.triggerPenalty({
      title: '탈락! 원샷!',
      subtitle: `[ ${wrongNum} ] 범위 이탈`,
      accentColor: '#ef4444',
      icon: '🚨'
    });
    this.render();
  }

  _updateDisplayOnly() {
    const displays = document.querySelectorAll('.party-number-display');
    displays.forEach(displayEl => {
      if (this.inputVal) {
        displayEl.textContent = this.inputVal;
        displayEl.classList.remove('placeholder');
      } else {
        displayEl.textContent = '· ·';
        displayEl.classList.add('placeholder');
      }
    });
  }

  // =========================================================================
  // 렌더링 & 이벤트 바인딩 (오프라인 양방향 대칭 테이블탑)
  // =========================================================================

  _getBottleCapSvg() {
    const isExploded = this.isFinished;
    const teeth = Array.from({ length: 24 }).map((_, i) => {
      const angle = i * 15;
      const isAlt = i % 2 === 0;
      return `<rect x="76.5" y="1" width="7" height="13" rx="2" fill="${isAlt ? '#15803d' : '#14532d'}" stroke="#86efac" stroke-width="0.8" transform="rotate(${angle} 80 80)"/>`;
    }).join('');

    return `
      <svg class="soju-cap-svg-realistic" viewBox="0 0 160 160" width="100%" height="100%">
        <defs>
          <radialGradient id="soju-cap-lacquer" cx="36%" cy="32%" r="68%">
            <stop offset="0%" stop-color="#4ade80"/>
            <stop offset="28%" stop-color="#22c55e"/>
            <stop offset="60%" stop-color="#16a34a"/>
            <stop offset="85%" stop-color="#15803d"/>
            <stop offset="100%" stop-color="#052e16"/>
          </radialGradient>
          <radialGradient id="soju-cap-exploded" cx="36%" cy="32%" r="68%">
            <stop offset="0%" stop-color="#fca5a5"/>
            <stop offset="30%" stop-color="#ef4444"/>
            <stop offset="70%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#450a0a"/>
          </radialGradient>
          <linearGradient id="soju-aluminum-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="35%" stop-color="#94a3b8"/>
            <stop offset="70%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>
          <linearGradient id="soju-specular-arc" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
            <stop offset="35%" stop-color="rgba(255,255,255,0.18)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
        </defs>

        <!-- 1. 알루미늄 톱니 주름 (24 fluted crimps) -->
        <g class="soju-fluted-teeth">
          ${teeth}
        </g>

        <!-- 2. 은색/금속 엣지 롤온 베벨 링 -->
        <circle cx="80" cy="80" r="70" fill="url(#soju-aluminum-rim)" stroke="#14532d" stroke-width="1.2"/>
        
        <!-- 3. 메탈릭 그린 래커 돔 본체 -->
        <circle cx="80" cy="80" r="66" fill="${isExploded ? 'url(#soju-cap-exploded)' : 'url(#soju-cap-lacquer)'}" stroke="#22c55e" stroke-width="2"/>

        <!-- 4. 금속 곡면 초승달 하이라이트 반사광 -->
        <path d="M 28 62 A 58 58 0 0 1 132 62 A 54 44 0 0 0 28 62 Z" fill="url(#soju-specular-arc)"/>

        <!-- 5. 엠보싱 메탈 음각 링 2겹 -->
        <circle cx="80" cy="80" r="48" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.2"/>
        <circle cx="80" cy="80" r="46" fill="none" stroke="rgba(0,0,0,0.38)" stroke-width="1.5"/>
        <circle cx="80" cy="80" r="42" fill="none" stroke="rgba(134,239,172,0.3)" stroke-width="1"/>

        <!-- 6. 중앙 시크릿 숫자 / 로고 텍스트 -->
        <text x="80" y="58" text-anchor="middle" font-size="8.5" font-weight="900" fill="#dcfce7" letter-spacing="1.2">
          K-SOOL
        </text>
        <text x="80" y="92" text-anchor="middle" font-size="34" font-weight="900" fill="#ffffff" 
              style="text-shadow: 0 2px 8px rgba(0,0,0,0.85);">
          ${this.isFinished ? this.secretNumber : '?'}
        </text>
        <text x="80" y="113" text-anchor="middle" font-size="10" fill="#fde047">
          ★
        </text>
      </svg>
    `;
  }

  _renderStation(isTop = false) {
    const flipClass = isTop ? 'top-station' : 'bottom-station';
    return `
      <div class="updown-player-station ${flipClass}">
        <!-- 상단: UP/DOWN 상태 및 입력 디스플레이 -->
        <div class="station-meta-row">
          <div class="updown-status-pair">
            <div class="updown-badge-row up">
              <span class="badge-num">${this.lastUpVal}</span>
              <span class="badge-txt">UP</span>
            </div>
            <div class="updown-badge-row down">
              <span class="badge-num">${this.lastDownVal}</span>
              <span class="badge-txt">DOWN</span>
            </div>
          </div>
          <div class="party-number-display ${!this.inputVal ? 'placeholder' : ''}">
            ${this.inputVal || '· ·'}
          </div>
        </div>

        <!-- 3x4 스마트폰 다이얼 패드 -->
        <div class="party-numpad-grid compact">
          <button type="button" class="party-num-key" data-digit="1">1</button>
          <button type="button" class="party-num-key" data-digit="2">2</button>
          <button type="button" class="party-num-key" data-digit="3">3</button>

          <button type="button" class="party-num-key" data-digit="4">4</button>
          <button type="button" class="party-num-key" data-digit="5">5</button>
          <button type="button" class="party-num-key" data-digit="6">6</button>

          <button type="button" class="party-num-key" data-digit="7">7</button>
          <button type="button" class="party-num-key" data-digit="8">8</button>
          <button type="button" class="party-num-key" data-digit="9">9</button>

          <button type="button" class="party-key-action restart btn-updown-restart" title="새 게임 시작">
            🔄
          </button>
          <button type="button" class="party-num-key" data-digit="0">0</button>
          <button type="button" class="party-key-action submit btn-updown-submit" title="숫자 확인">
            ✅
          </button>
        </div>
      </div>
    `;
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    container.innerHTML = `
      <div class="party-game-box updown-box tabletop-symmetrical">
        <!-- 1. 상대방 플레이어 스테이션 (상단 180도 회전 대칭) -->
        ${this._renderStation(true)}

        <!-- 2. 중앙: 극사실적 3D 소주 병뚜껑 (테이블 중심축) -->
        <div class="updown-center-cap-wrap">
          <div class="realistic-cap-container ${this.isFinished ? 'exploded' : ''}">
            ${this._getBottleCapSvg()}
          </div>
        </div>

        <!-- 3. 내 쪽 플레이어 스테이션 (하단 정방향 0도) -->
        ${this._renderStation(false)}
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    document.querySelectorAll('.btn-updown-submit').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.submitGuess();
      };
    });

    document.querySelectorAll('.btn-updown-restart').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.hub.sound.playTap();
        this.reset();
      };
    });

    document.querySelectorAll('.party-num-key').forEach(key => {
      key.onclick = (e) => {
        e.stopPropagation();
        const d = e.currentTarget.getAttribute('data-digit');
        this.handleDigitPress(d);
      };
    });
  }

  destroy() {
    // UpAndDownGame has no background timers
  }
}

window.KSool.UpAndDownGame = UpAndDownGame;
