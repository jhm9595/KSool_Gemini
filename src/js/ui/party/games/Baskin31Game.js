window.KSool = window.KSool || {};

/**
 * ⑧ 배불러라빈스 31 (Baskin Robbins 31 패러디 술게임)
 * - 1부터 31까지 턴마다 1~3개의 숫자를 순서대로 외치고, 마지막 31을 누른 사람이 패배!
 * - 메인 인터랙션: 화면에 현재 진행 중인 3개의 숫자 네모칸 + 하단 [확인] 버튼 (딱 4개 버튼)
 * - 첫 번째 칸부터 순서대로 눌러 1~3개 선택 후 확인을 누르면 다음 사람으로 턴 패스
 * - 대칭 없이 시원하고 큼직한 풀스크린 단독 뷰
 */
class Baskin31Game {
  constructor(hub) {
    this.hub = hub;
    this.currentNumber = 0; // 0부터 시작, 1~31
    this.selectedCount = 0; // 0, 1, 2, 3
    this.isFinished = false;
  }

  init() {
    this.reset();
  }

  reset() {
    this.currentNumber = 0;
    this.selectedCount = 0;
    this.isFinished = false;
    this.render();
  }

  /**
   * n번째 네모칸 클릭 (1, 2, 3)
   * 첫 번째 것부터 순서대로 누를 수 있게 처리
   */
  handleSlotClick(slotIndex) {
    if (this.isFinished) return;

    const targetNum = this.currentNumber + slotIndex;
    if (targetNum > 31) return;

    if (slotIndex === 1) {
      this.selectedCount = this.selectedCount === 1 ? 0 : 1;
    } else if (slotIndex === 2) {
      this.selectedCount = this.selectedCount === 2 ? 1 : 2;
    } else if (slotIndex === 3) {
      this.selectedCount = this.selectedCount === 3 ? 2 : 3;
    }

    this.hub.sound.playTap();
    this.hub.vibrateShort();
    this.render();
  }

  /**
   * [확인] 버튼 클릭 -> 선택한 숫자만큼 진행 및 다음 사람 차례
   */
  submitTurn() {
    if (this.isFinished) {
      this.reset();
      return;
    }

    if (this.selectedCount === 0) return;

    const nextNumber = this.currentNumber + this.selectedCount;

    // 31 도달 시 -> 탈락/벌칙 발동!
    if (nextNumber >= 31) {
      this.currentNumber = 31;
      this.isFinished = true;
      this.hub.sound.playExplosion();
      this.hub.triggerPenalty({
        title: '31 당첨! 원샷!',
        subtitle: '배불러라빈스 31 탈락!',
        accentColor: '#f43f5e',
        icon: '🍨'
      });
      this.render();
      return;
    }

    // 정상 진행 -> 다음 사람에게 넘김
    this.currentNumber = nextNumber;
    this.selectedCount = 0;
    this.hub.sound.playTap();
    this.render();
  }

  render() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    const progressPct = Math.min(100, (this.currentNumber / 31) * 100);
    const n1 = this.currentNumber + 1;
    const n2 = this.currentNumber + 2;
    const n3 = this.currentNumber + 3;

    // 슬롯 3개 메타데이터
    const slots = [
      { idx: 1, num: n1, available: n1 <= 31, active: this.selectedCount >= 1 },
      { idx: 2, num: n2, available: n2 <= 31, active: this.selectedCount >= 2 },
      { idx: 3, num: n3, available: n3 <= 31, active: this.selectedCount >= 3 }
    ];

    // 선택된 숫자 텍스트 (예: "14, 15 외치기")
    let chosenWords = [];
    for (let i = 1; i <= this.selectedCount; i++) {
      chosenWords.push(this.currentNumber + i);
    }
    const chosenSummary = chosenWords.length > 0 ? chosenWords.join(', ') : '';

    container.innerHTML = `
      <div class="party-game-box baskin-stage ${this.isFinished ? 'finished' : ''}">
        <!-- 1. 상단 미니 진행도 & 리셋 버튼 -->
        <div class="baskin-header-meta">
          <div class="baskin-progress-group">
            <div class="baskin-count-label">
              <span class="label-text">현재 숫자</span>
              <span class="label-nums"><strong>${this.currentNumber}</strong> / 31</span>
            </div>
            <div class="baskin-progress-track">
              <div class="baskin-progress-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>
          <button type="button" class="baskin-reset-btn" id="btn-baskin-reset" title="새 게임 시작">
            New
          </button>
        </div>

        <!-- 2. 중앙 메인: 현재 진행 중인 3개 숫자 네모칸 (첫 번째부터 순서대로 활성화) -->
        <div class="baskin-center-zone">
          <div class="baskin-slots-row">
            ${slots.map(s => {
              if (!s.available) {
                return `
                  <div class="baskin-slot disabled" aria-disabled="true">
                    <span class="slot-num">-</span>
                  </div>
                `;
              }
              const isDanger = s.num === 31;
              return `
                <button type="button" 
                        class="baskin-slot ${s.active ? 'active' : ''} ${isDanger ? 'danger' : ''}" 
                        data-baskin-slot="${s.idx}"
                        aria-label="${s.num} 선택">
                  <span class="slot-num">${s.num}</span>
                  ${isDanger ? '<span class="baskin-skull-pill">💀 31</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>

          <!-- 상태 힌트 문구 -->
          <div class="baskin-hint-text">
            ${this.isFinished 
              ? '<span class="hint-danger">💥 31에 당첨되었습니다! 벌칙 원샷!</span>'
              : (this.selectedCount > 0 
                  ? `<span class="hint-active">선택한 숫자: [ <strong>${chosenSummary}</strong> ]</span>`
                  : '숫자를 1~3개 선택한 후 확인을 누르세요')}
          </div>
        </div>

        <!-- 3. 하단 메인: [확인] 버튼 (딱 4번째 메인 버튼) -->
        <div class="baskin-action-zone">
          <button type="button" 
                  class="baskin-submit-btn ${this.selectedCount > 0 ? 'ready' : ''} ${this.isFinished ? 'restart' : ''}" 
                  id="btn-baskin-submit">
            ${this.isFinished 
              ? '🔄 새 게임 시작하기' 
              : (this.selectedCount > 0 
                  ? `👉 [ ${chosenSummary} ] 외치고 턴 넘기기` 
                  : '숫자를 선택해 주세요 (1~3개)')}
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const container = document.getElementById('party-game-stage');
    if (!container) return;

    // 슬롯 1, 2, 3 클릭 이벤트
    container.querySelectorAll('[data-baskin-slot]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-baskin-slot'));
        this.handleSlotClick(idx);
      };
    });

    // 하단 확인 / 턴 넘기기 버튼 이벤트
    const submitBtn = container.querySelector('#btn-baskin-submit');
    if (submitBtn) {
      submitBtn.onclick = (e) => {
        e.stopPropagation();
        this.submitTurn();
      };
    }

    // New 리셋 버튼
    const resetBtn = container.querySelector('#btn-baskin-reset');
    if (resetBtn) {
      resetBtn.onclick = (e) => {
        e.stopPropagation();
        this.hub.sound.playTap();
        this.reset();
      };
    }
  }

  destroy() {
    // 클린업
  }
}

window.KSool.Baskin31Game = Baskin31Game;
