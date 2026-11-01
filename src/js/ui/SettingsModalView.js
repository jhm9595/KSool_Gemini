/**
 * SettingsModalView - K-SOOL Settings & Environment Configuration Modal
 *
 * Provides users with:
 * 1. Graphic Icon Style Switcher (✨ 기본 이모지 / 👾 레트로 도트 / 💎 고화질 고급)
 * 2. Feature toggles (패러디명 vs 실제명, 4칸 슬롯 vs 무제한 슬롯, 정규 해금 vs 샌드박스 전체 해금)
 * 3. Icon comparison modal shortcut
 * 4. Data Reset options (전체 게임 진행도 초기화, 그림 힌트만 초기화)
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
      const isUnlimitedSlots = app?.config?.unlimitedSlotsMode || false;
      const isRealName = app?.config?.globalLicenseOverride || false;
      const isSandboxAll = app?.inventory?.unlockAllSandboxMode || false;

      content.innerHTML = `
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.25rem;">⚙️</span>
            <div class="modal-title">환경 설정</div>
          </div>
          <button class="modal-close-x" id="settings-close-btn" title="닫기">✕</button>
        </div>

        <div class="settings-modal-body">
          <!-- 1. 아이콘 그래픽 스타일 -->
          <div class="settings-section">
            <div class="settings-section-title">
              <span>🎨 아이콘 그래픽 스타일</span>
            </div>
            <div class="settings-desc">게임 전체의 재료 및 주류 아이콘 렌더링 방식을 선택합니다.</div>
            
            <div class="settings-theme-selector">
              <button type="button" class="settings-theme-chip ${currentTheme === 'emoji' ? 'active' : ''}" data-set-theme="emoji">
                <span class="theme-chip-icon">✨</span>
                <span class="theme-chip-label">기본 이모지</span>
                <span class="theme-chip-sub">Unicode</span>
              </button>
              <button type="button" class="settings-theme-chip ${currentTheme === 'dot' ? 'active' : ''}" data-set-theme="dot">
                <span class="theme-chip-icon">👾</span>
                <span class="theme-chip-label">레트로 도트</span>
                <span class="theme-chip-sub">16x16 Pixel</span>
              </button>
              <button type="button" class="settings-theme-chip ${currentTheme === 'hd' ? 'active' : ''}" data-set-theme="hd">
                <span class="theme-chip-icon">💎</span>
                <span class="theme-chip-label">고급 형태</span>
                <span class="theme-chip-sub">32x32 HD</span>
              </button>
            </div>

            <div style="margin-top:8px;">
              <button type="button" class="settings-sub-action-btn" id="settings-open-compare-btn">
                🔍 3종 스타일 한눈에 비교하기
              </button>
            </div>
          </div>

          <!-- 2. 게임플레이 기능 설정 -->
          <div class="settings-section">
            <div class="settings-section-title">
              <span>🛠️ 게임플레이 & 기능 설정</span>
            </div>

            <div class="settings-toggle-row">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">🎭 상표 표기 방식</div>
                <div class="settings-toggle-sub">${isRealName ? '제휴 실제 상표명 (참이슬, 테라 등)' : '재치있는 패러디명 (참방울, 테라피 등)'}</div>
              </div>
              <button type="button" class="settings-pill-btn ${isRealName ? 'active' : ''}" id="settings-toggle-license-btn">
                ${isRealName ? '🏷️ 실제명' : '🎭 패러디명'}
              </button>
            </div>

            <div class="settings-toggle-row">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">📦 주조실 조합 슬롯</div>
                <div class="settings-toggle-sub">${isUnlimitedSlots ? '무제한 확장 (원하는 만큼 추가)' : '기본 4슬롯 제한'}</div>
              </div>
              <button type="button" class="settings-pill-btn ${isUnlimitedSlots ? 'active' : ''}" id="settings-toggle-slots-btn">
                ${isUnlimitedSlots ? '♾️ 무제한' : '📦 4슬롯'}
              </button>
            </div>

            <div class="settings-toggle-row">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">🌱 재료 해금 방식</div>
                <div class="settings-toggle-sub">${isSandboxAll ? '샌드박스 모드 (모든 재료 즉시 사용)' : '정규 모드 (연쇄 조합 및 단계별 해금)'}</div>
              </div>
              <button type="button" class="settings-pill-btn ${isSandboxAll ? 'active' : ''}" id="settings-toggle-sandbox-btn">
                ${isSandboxAll ? '🔓 전체해금' : '🌱 연쇄해금'}
              </button>
            </div>
          </div>

          <!-- 3. 데이터 초기화 -->
          <div class="settings-section settings-danger-section">
            <div class="settings-section-title" style="color:#f87171;">
              <span>⚠️ 데이터 초기화</span>
            </div>

            <div class="settings-reset-card">
              <div class="settings-reset-info">
                <div class="settings-reset-title">🎨 그림 힌트(미니게임) 해금만 초기화</div>
                <div class="settings-reset-desc">도감에서 미니게임으로 해금했던 그림들을 다시 ❓로 되돌립니다. 조합 완성 기록은 유지되며, 미니게임을 다시 즐길 수 있습니다.</div>
              </div>
              <button type="button" class="settings-danger-btn" id="settings-reset-images-btn">그림만 리셋</button>
            </div>

            <div class="settings-reset-card">
              <div class="settings-reset-info">
                <div class="settings-reset-title">🔄 게임 진행도 전체 초기화</div>
                <div class="settings-reset-desc">해금된 모든 K-술 조합, 도감 기록, 연쇄 재료를 처음(Step 1) 상태로 완전히 리셋합니다.</div>
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

      // 스타일 비교 모달 열기
      const compareBtn = container.querySelector('#settings-open-compare-btn');
      if (compareBtn) {
        compareBtn.onclick = () => {
          app?.audio?.playTap();
          this.close();
          if (app?.iconCompareModalView) {
            app.iconCompareModalView.open('featured');
          }
        };
      }

      // 2. 상표 표기 토글
      const licenseBtn = container.querySelector('#settings-toggle-license-btn');
      if (licenseBtn) {
        licenseBtn.onclick = () => {
          if (app?.config) {
            app.config.globalLicenseOverride = !app.config.globalLicenseOverride;
            app?.audio?.playTap();
            app?.renderAll();
            this.render();
          }
        };
      }

      // 조합 슬롯 토글
      const slotBtn = container.querySelector('#settings-toggle-slots-btn');
      if (slotBtn) {
        slotBtn.onclick = () => {
          if (app?.config) {
            app.config.unlimitedSlotsMode = !app.config.unlimitedSlotsMode;
            app?.audio?.playTap();
            app?.renderAll();
            this.render();
          }
        };
      }

      // 재료 해금 방식 토글
      const sandboxBtn = container.querySelector('#settings-toggle-sandbox-btn');
      if (sandboxBtn) {
        sandboxBtn.onclick = () => {
          if (app?.inventory) {
            app.inventory.unlockAllSandboxMode = !app.inventory.unlockAllSandboxMode;
            app?.audio?.playTap();
            app?.renderAll();
            this.render();
          }
        };
      }

      // 3. 그림 해금만 리셋
      const resetImagesBtn = container.querySelector('#settings-reset-images-btn');
      if (resetImagesBtn) {
        resetImagesBtn.onclick = () => {
          if (confirm('미니게임으로 해금했던 모든 도감 그림을 다시 ❓로 리셋하시겠습니까?\n(레시피 조합 기록은 그대로 유지됩니다.)')) {
            if (app?.inventory) {
              app.inventory.unlockedImageRecipeIds.clear();
              app.inventory.save();
              app?.audio?.playTap();
              app?.renderAll();
              this.render();
              alert('그림 해금 기록이 리셋되었습니다! 이제 미니게임을 다시 도전해보실 수 있습니다.');
            }
          }
        };
      }

      // 4. 전체 진행도 리셋
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
