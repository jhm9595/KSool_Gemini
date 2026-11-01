/**
 * SettingsModalView - K-SOOL Settings Modal
 *
 * Contains strictly:
 * 1. Graphic Icon Style Switcher (✨ 기본 이모지 / 👾 레트로 도트 / 💎 고급 형태)
 * 2. Entire Game Progress Reset (전체 초기화)
 */
(function() {
  window.KSool = window.KSool || {};

  class SettingsModalView {
    constructor(modalId = 'settings-modal', contentId = 'settings-modal-content', app = null) {
      this.modalId = modalId;
      this.contentId = contentId;
      this.app = app;
      this.isOpen = false;
    }

    open() {
      const modal = document.getElementById(this.modalId);
      if (!modal) return;
      this.isOpen = true;
      modal.classList.add('active');
      this.render();
    }

    close() {
      const modal = document.getElementById(this.modalId);
      if (!modal) return;
      this.isOpen = false;
      modal.classList.remove('active');
    }

    render() {
      const content = document.getElementById(this.contentId);
      if (!content) return;

      const app = this.app;
      const currentTheme = window.KSool?.PixelIconRegistry?.getTheme() || 'hd';

      content.innerHTML = `
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">⚙️</span>
            <div class="modal-title">설정</div>
          </div>
          <button class="modal-close-x" id="settings-close-btn" title="닫기">✕</button>
        </div>

        <div class="settings-modal-body">
          <!-- 1. 아이콘 그래픽 스타일 -->
          <div class="settings-section">
            <div class="settings-section-title">아이콘 그래픽 스타일</div>
            <div class="settings-theme-selector">
              <button type="button" class="settings-theme-chip ${currentTheme === 'emoji' ? 'active' : ''}" data-set-theme="emoji">
                <span class="theme-chip-icon">✨</span>
                <span class="theme-chip-label">이모지</span>
              </button>
              <button type="button" class="settings-theme-chip ${currentTheme === 'dot' ? 'active' : ''}" data-set-theme="dot">
                <span class="theme-chip-icon">👾</span>
                <span class="theme-chip-label">도트</span>
              </button>
              <button type="button" class="settings-theme-chip ${currentTheme === 'hd' ? 'active' : ''}" data-set-theme="hd">
                <span class="theme-chip-icon">💎</span>
                <span class="theme-chip-label">고급</span>
              </button>
            </div>
          </div>

          <!-- 2. 전체 초기화 -->
          <div class="settings-section settings-danger-section">
            <div class="settings-section-title" style="color:#f87171;">진행도 초기화</div>
            <div class="settings-reset-card" style="border-bottom:none; padding:0;">
              <div class="settings-reset-info">
                <div class="settings-reset-desc">해금된 모든 조합과 재료를 처음 상태로 완전히 리셋합니다.</div>
              </div>
              <button type="button" class="settings-danger-btn full-reset" id="settings-reset-all-btn">전체 초기화</button>
            </div>
          </div>
        </div>
      `;

      this._bindEvents(content);
    }

    _bindEvents(container) {
      const app = this.app;

      // 닫기 버튼
      const closeBtn = container.querySelector('#settings-close-btn');
      if (closeBtn) {
        closeBtn.onclick = () => {
          app?.audio?.playTap();
          this.close();
        };
      }

      // 모달 바깥 배경 클릭 시 닫기
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.onclick = (e) => {
          if (e.target === modal) this.close();
        };
      }

      // 1. 아이콘 테마 변경
      container.querySelectorAll('[data-set-theme]').forEach(btn => {
        btn.onclick = () => {
          const theme = btn.getAttribute('data-set-theme');
          if (window.KSool?.PixelIconRegistry) {
            window.KSool.PixelIconRegistry.setTheme(theme);
            app?.audio?.playTap();
            app?.renderAll();
            this.render();
          }
        };
      });

      // 2. 전체 진행도 리셋
      const resetAllBtn = container.querySelector('#settings-reset-all-btn');
      if (resetAllBtn) {
        resetAllBtn.onclick = () => {
          if (confirm('정말로 모든 해금 기록을 초기 상태로 리셋하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
            if (app) {
              app.storage?.clearState();
              app.craftingPot?.clear();
              app.inventory.unlockAllSandboxMode = false;
              app.inventory.userLevel = 1;
              app.inventory.craftFailCount = 0;
              app.inventory.shownTabIntros = { collection: false, fridge: false, suggestions: false, detailPicker: false };
              app.pendingTabIntroQueue = [];
              app.inventory.unlockedImageRecipeIds.clear();
              app.inventory.unlockedDescRecipeIds?.clear();
              app.inventory.hintProgressByRecipe = {};
              app.inventory.promotedCustomRecipes = [];
              app.inventory.init();
              app.inventory.save();
              const nextQuiz = app.inventory.getNextQuizRecipe();
              app.quizTargetRecipeId = nextQuiz ? nextQuiz.recipe_id : 5;
              app.quizHintRevealed = false;
              app.brewMode = 'QUIZ';
              app.fridgeEngine?.clearAll();
              app.selectedIngCategory = 'NATURE';
              app.audio?.playTap();
              this.close();
              app.renderAll();
              alert('모든 진행도가 처음 상태로 초기화되었습니다.');
            }
          }
        };
      }
    }
  }

  window.KSool.SettingsModalView = SettingsModalView;
})();
