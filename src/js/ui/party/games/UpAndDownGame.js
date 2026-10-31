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
    this.lastUpVal = 1;
    this.lastDownVal = 50;
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
    this.lastUpVal = 1;
    this.lastDownVal = this.maxNumber;
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
    const displayEl = document.getElementById('party-number-display');
    if (displayEl) {
      if (this.inputVal) {
        displayEl.textContent = this.inputVal;
        displayEl.classList.remove('placeholder');
      } else {
        displayEl.textContent = '· ·';
        displayEl.classList.add('placeholder');
      }
    }
  }

  // =========================================================================
  // 렌더링 & 이벤트 바인딩
  // =========================================================================

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    container.innerHTML = `
      <div class="party-game-box updown-box">
        <!-- 1. 맨 위: 숫자는 좌측 세로줄, UP/DOWN은 우측 세로줄에 맞춘 대형 타이포그래피 (2x2 그리드) -->
        <div class="updown-status-large">
          <span class="updown-num up">${this.lastUpVal}</span>
          <span class="updown-tag up">UP</span>
          <span class="updown-num down">${this.lastDownVal}</span>
          <span class="updown-tag down">DOWN</span>
        </div>

        <!-- 2. 가운데: 대폭 커진 초록 메탈 병뚜껑 (설명 텍스트 일체 없음) -->
        <div class="party-cap-visual-wrap">
          <div class="soju-cap-circle ${this.isFinished ? 'exploded' : ''} ${this.lastResult ? this.lastResult.toLowerCase() : ''}">
            <div class="soju-cap-inner">
              <span class="soju-cap-label">K-SOOL</span>
              <span class="soju-cap-secret">${this.isFinished ? this.secretNumber : '?'}</span>
              <span class="soju-cap-star">★</span>
            </div>
          </div>
        </div>

        <!-- 3. 입력된 숫자 표시창 (키보드 팝업 없는 순수 뷰포트) -->
        <div class="updown-display-row">
          <div id="party-number-display" class="party-number-display ${!this.inputVal ? 'placeholder' : ''}">
            ${this.inputVal || '· ·'}
          </div>
        </div>

        <!-- 4. 3x4 = 12칸 스마트폰 다이얼 패드 (0 좌측: 새게임, 우측: 확인) -->
        <div class="party-numpad-grid">
          <button type="button" class="party-num-key" data-digit="1">1</button>
          <button type="button" class="party-num-key" data-digit="2">2</button>
          <button type="button" class="party-num-key" data-digit="3">3</button>

          <button type="button" class="party-num-key" data-digit="4">4</button>
          <button type="button" class="party-num-key" data-digit="5">5</button>
          <button type="button" class="party-num-key" data-digit="6">6</button>

          <button type="button" class="party-num-key" data-digit="7">7</button>
          <button type="button" class="party-num-key" data-digit="8">8</button>
          <button type="button" class="party-num-key" data-digit="9">9</button>

          <button type="button" class="party-key-action restart" id="btn-updown-restart">
            🔄 새게임
          </button>
          <button type="button" class="party-num-key" data-digit="0">0</button>
          <button type="button" class="party-key-action submit" id="btn-input-submit">
            ✅ 확인
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const submitBtn = document.getElementById('btn-input-submit');
    const restartBtn = document.getElementById('btn-updown-restart');

    if (submitBtn) {
      submitBtn.onclick = (e) => {
        e.stopPropagation();
        this.submitGuess();
      };
    }

    if (restartBtn) {
      restartBtn.onclick = (e) => {
        e.stopPropagation();
        this.hub.sound.playTap();
        this.reset();
      };
    }

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
