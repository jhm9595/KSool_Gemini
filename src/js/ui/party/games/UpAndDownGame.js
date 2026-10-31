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

    return `
      <svg class="soju-cap-svg-realistic" viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 뚜껑 메탈 그라데이션 (CapFlick과 100% 동일한 소주 캡 래커) -->
          <radialGradient id="cap-metal-grad-updown" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stop-color="#4ade80"/>
            <stop offset="35%" stop-color="#16a34a"/>
            <stop offset="70%" stop-color="#15803d"/>
            <stop offset="100%" stop-color="#052e16"/>
          </radialGradient>
          <radialGradient id="cap-exploded-grad-updown" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stop-color="#fca5a5"/>
            <stop offset="30%" stop-color="#ef4444"/>
            <stop offset="70%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#450a0a"/>
          </radialGradient>
        </defs>

        <!-- 1. 초록 메탈 병뚜껑 (CapFlick과 1:1 완벽 동일한 정중앙 100, 100 원형) -->
        <g class="soju-cap-main-group">
          <!-- 외곽 주름 톱니 (fluted rim 28개 엣지) -->
          <circle cx="100" cy="100" r="76" fill="#14532d"/>
          <circle cx="100" cy="100" r="73" fill="#16a34a" stroke="#86efac" stroke-width="2"/>
          <!-- 캡 돔 본체 -->
          <circle cx="100" cy="100" r="68" fill="${isExploded ? 'url(#cap-exploded-grad-updown)' : 'url(#cap-metal-grad-updown)'}" stroke="#22c55e" stroke-width="3"/>
          <!-- 캡 내부 메탈 음각 링 2겹 -->
          <circle cx="100" cy="100" r="54" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2.5"/>
          <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
          <circle cx="100" cy="100" r="24" fill="rgba(21,128,61,0.5)" stroke="rgba(134,239,172,0.4)" stroke-width="1.5"/>
        </g>

        <!-- 2. 꼬다리가 뜯겨나간 자국 (CapFlick에서 꼬다리가 뚝 끊어진 브래킷 조인트 스텀프) -->
        <g class="soju-cap-broken-stump" style="transform-origin: 100px 100px;">
          <path d="M92 33 L108 33 L105 25 L95 25 Z" fill="#15803d" stroke="#86efac" stroke-width="1.5"/>
          <!-- 끊어진 알루미늄 단면 은색 팁 -->
          <circle cx="100" cy="24" r="2.5" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
        </g>

        <!-- 3. 병뚜껑 중심 숫자 / 물음표 -->
        <g class="soju-cap-center-content">
          <text x="100" y="100" text-anchor="middle" dominant-baseline="central" class="soju-cap-center-num">
            ${this.isFinished ? this.secretNumber : '?'}
          </text>
        </g>
      </svg>
    `;
  }

  _renderStation(isTop = false) {
    const flipClass = isTop ? 'top-station' : 'bottom-station';
    return `
      <div class="updown-player-station ${flipClass}">
        <!-- 1. 병뚜껑 쪽 인접: UP / DOWN 대칭 표시 (세로 중앙축 맞춤 대형 타이포) -->
        <div class="updown-station-status-slot">
          <div class="updown-status-grid">
            <div class="updown-status-row up">
              <span class="status-num">${this.lastUpVal}</span>
              <span class="status-label">UP</span>
            </div>
            <div class="updown-status-row down">
              <span class="status-num">${this.lastDownVal}</span>
              <span class="status-label">DOWN</span>
            </div>
          </div>
        </div>

        <!-- 2. 입력된 숫자 디스플레이 -->
        <div class="party-number-display ${!this.inputVal ? 'placeholder' : ''}">
          ${this.inputVal || '· ·'}
        </div>

        <!-- 3. 3x4 스마트폰 다이얼 패드 -->
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
            New
          </button>
          <button type="button" class="party-num-key" data-digit="0">0</button>
          <button type="button" class="party-key-action submit btn-updown-submit" title="숫자 확인">
            확인
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
        <!-- 1. 상단: 상대방 플레이어 스테이션 (180도 회전 대칭) -->
        ${this._renderStation(true)}

        <!-- 2. 중앙: 극사실적 3D 소주 병뚜껑 (CapFlick과 1:1 완벽 동일한 정중앙 위치 및 크기) -->
        <div class="updown-center-cap-wrap">
          <div class="realistic-cap-container ${this.isFinished ? 'exploded' : ''}">
            ${this._getBottleCapSvg()}
          </div>
        </div>

        <!-- 3. 하단: 내 쪽 플레이어 스테이션 (정방향 0도) -->
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
