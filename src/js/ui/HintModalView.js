window.KSool = window.KSool || {};

class HintModalView {
  constructor({ recipeBook, inventory, baseballEngine, ratioProvider, brandResolver, audio, onImageUnlocked, onAutoSetupBrew }) {
    this.recipeBook = recipeBook;
    this.inventory = inventory;
    this.baseballEngine = baseballEngine;
    this.ratioProvider = ratioProvider;
    this.brandResolver = brandResolver;
    this.audio = audio;
    this.onImageUnlocked = onImageUnlocked || null;
    this.onAutoSetupBrew = onAutoSetupBrew || null;

    this.activeRecipeId = null;
    this.viewMode = 'CHOICE'; // 'CHOICE' | 'BASEBALL' | 'MINIGAME_SELECT' | 'MINIGAME_PLAY'
    this.selectedMinigameType = 'BRICK_BREAKER'; // 'BRICK_BREAKER' | 'TERRITORY_QIX'
    this.minigameStatus = 'PLAYING'; // 'PLAYING' | 'WIN' | 'LOSE'
    this.minigameInstance = null;

    this.currentGuessSlots = []; // [{ token, emoji, name, label }]
    this.selectedStage2Category = null; // 2단계에서 선택된 (1단계 통과) 재료 유형 탭
    this.selectedUpDownSlotOrder = null; // 베이스볼 완료 후 상단 정답 슬롯 클릭 시 열림
    this.lastUpDownResult = null;
    this.showHelpGuide = false; // 베이스볼 게임 방법 간단 도움말 토글
  }

  open(recipeId, initialMode = null) {
    this._stopMinigame();
    this.activeRecipeId = Number(recipeId);
    this.lastUpDownResult = null;
    this.selectedUpDownSlotOrder = null;
    this.selectedStage2Category = null;
    this.showHelpGuide = false;
    this.minigameStatus = 'PLAYING';
    this._resetGuessSlots();
    this._clearActiveRecipeHistory();

    // initialMode가 지정된 경우 해당 모드로 직행 ('MINIGAME_SELECT' 등)
    if (initialMode === 'MINIGAME_SELECT' || initialMode === 'minigame') {
      this.viewMode = 'MINIGAME_SELECT';
    } else if (initialMode === 'BASEBALL' || initialMode === 'baseball') {
      this.viewMode = 'BASEBALL';
    } else {
      // 도감에서 미해금 카드를 누르면 [⚾ 베이스볼 / 🎮 그림 해금 게임 / (있을 경우 📺 힌트보기)] 선택 화면부터 노출
      // 전체 해금 모드(unlockAllSandboxMode)일 때는 즉시 100% 해금된 베이스볼 & 황금비율 화면으로 직행
      this.viewMode = this.inventory.unlockAllSandboxMode ? 'BASEBALL' : 'CHOICE';
    }

    this.render();
    document.getElementById('hint-modal').classList.add('active');
  }

  openMinigame(recipeId) {
    this.open(recipeId, 'MINIGAME_SELECT');
  }

  close() {
    this._stopMinigame();
    this._clearActiveRecipeHistory();
    document.getElementById('hint-modal').classList.remove('active');
  }

  _clearActiveRecipeHistory() {
    if (this.activeRecipeId) {
      const hintState = this.inventory.getHintState(this.activeRecipeId);
      if (hintState) {
        hintState.history = [];
      }
    }
  }

  _stopMinigame() {
    if (this.minigameInstance) {
      this.minigameInstance.stop();
      this.minigameInstance = null;
    }
  }

  _resetGuessSlots() {
    if (!this.activeRecipeId) return;
    if (this.baseballEngine.isAllStagesCleared(this.activeRecipeId)) {
      this.currentGuessSlots = [];
      return;
    }
    const currentStage = this.baseballEngine.getCurrentActiveStage(this.activeRecipeId);
    const answerTokens = this.baseballEngine.getAnswerTokens(this.activeRecipeId, currentStage);
    this.currentGuessSlots = answerTokens.map(() => null);
  }

  render() {
    const container = document.getElementById('hint-modal-content');
    const recipe = this.recipeBook.getRecipe(this.activeRecipeId);
    if (!recipe || !container) return;

    if (this.viewMode !== 'MINIGAME_PLAY') {
      this._stopMinigame();
    }

    const items = this.recipeBook.getRecipeItems(this.activeRecipeId);
    const extHints = this.recipeBook.getExternalHints(this.activeRecipeId);
    const hasExtHint = extHints && extHints.length > 0;
    const isImageUnlocked = this.inventory.isRecipeImageUnlocked(this.activeRecipeId);
    const resolvedName = this.brandResolver.resolveName(recipe);
    const targetBadgeHtml = `<span style="color:#60a5fa; font-weight:900; font-size:0.78rem;">${recipe.formatted_number || ''}</span> <span style="color:#fde047; font-weight:900; font-size:0.84rem;">${resolvedName}</span>`;

    // =========================================================================
    // [모드 1] 진입 선택 화면 (⚾ 베이스볼 or 🎯 업앤다운 / 🎮 그림 해금 미니게임 / 📺 외부 힌트)
    // =========================================================================
    if (this.viewMode === 'CHOICE') {
      const isBaseballDoneChoice = this.baseballEngine.isAllStagesCleared(this.activeRecipeId);
      const needsRatioGameChoice = this.ratioProvider.requiresRatioGame(this.activeRecipeId);
      const isUpAndDownChoice = isBaseballDoneChoice && needsRatioGameChoice;

      let extHintCardHtml = '';
      if (hasExtHint) {
        const primaryHint = extHints[0];
        const isVideo = primaryHint.platform === 'YOUTUBE';
        const hintIcon = isVideo ? '📺' : '📝';
        const hintSubLabel = isVideo
          ? `영상 힌트 보러가기 (${window.KSool.ExternalHintLinker.formatTimestamp(primaryHint.start_time_sec)})`
          : '힌트 글 보러가기';

        extHintCardHtml = `
          <button class="hint-big-choice-btn choice-ext-hint choice-span-full" id="choice-ext-hint-btn">
            <span class="choice-big-icon">${hintIcon}</span>
            <span class="choice-big-title">힌트보기</span>
            <span class="choice-big-sub">${hintSubLabel}</span>
          </button>
        `;
      }

      const unlockedPreviewBanner = isImageUnlocked ? `
        <div class="unlocked-img-preview-banner">
          <span class="unlocked-img-emoji">${window.KSool?.pixelIcon ? window.KSool.pixelIcon(recipe, 32) : recipe.emoji}</span>
          <div class="unlocked-img-text">
            <div style="font-weight:900; color:#e9d5ff; font-size:0.82rem;">🖼️ 그림 힌트 해금 완료!</div>
            <div style="font-size:0.7rem; color:#cbd5e1;">이 술의 외형(그림)이 도감에 공개되었습니다. 이제 베이스볼로 재료를 추리해보세요!</div>
          </div>
        </div>
      ` : '';

      container.innerHTML = `
        <div class="hint-top-header">
          <div class="modal-title">🕵️ 추리</div>
          <button class="modal-close-x" id="hint-close-btn">✕</button>
        </div>

        <div class="bb-target-info-card" style="margin-bottom:8px;">
          <div class="bb-target-title-row">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="bb-target-num">${recipe.formatted_number || ''}</span>
              <span class="bb-target-name">${resolvedName}</span>
            </div>
          </div>
          ${recipe.unlock_hint ? `
            <div class="bb-target-hint">
              <span class="hint-bulb">💡</span> ${recipe.unlock_hint}
            </div>
          ` : ''}
        </div>

        ${unlockedPreviewBanner}

        <div class="hint-choice-grid">
          <button class="hint-big-choice-btn choice-baseball" id="choice-baseball-btn">
            <span class="choice-big-icon">${isUpAndDownChoice ? '🎯' : '⚾'}</span>
            <span class="choice-big-title">${isUpAndDownChoice ? '업앤다운' : '베이스볼'}</span>
            <span class="choice-big-sub">${isUpAndDownChoice ? '황금비율 추리 게임' : '재료 & 황금비율 추리 게임'}</span>
          </button>

          <button class="hint-big-choice-btn choice-minigame" id="choice-minigame-btn">
            <span class="choice-badge-tag ${isImageUnlocked ? 'cleared' : ''}">${isImageUnlocked ? '✅ 해금됨' : '🎮 아케이드'}</span>
            <span class="choice-big-icon">${isImageUnlocked ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(recipe, 32) : recipe.emoji) : '🕹️'}</span>
            <span class="choice-big-title">그림 해금 게임</span>
            <span class="choice-big-sub">벽돌깨기 · 땅따먹기</span>
          </button>

          ${extHintCardHtml}
        </div>
      `;

      this._bindEvents(container);
      return;
    }

    // =========================================================================
    // [모드 2] 그림 해금 미니게임 선택 화면
    // =========================================================================
    if (this.viewMode === 'MINIGAME_SELECT') {
      container.innerHTML = `
        <div class="hint-top-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="hint-back-choice-btn" id="hint-back-choice-btn" title="선택 화면으로">←</button>
            <div class="modal-title">🕹️ 그림 해금 아케이드</div>
          </div>
          <button class="modal-close-x" id="hint-close-btn">✕</button>
        </div>

        <div class="minigame-select-intro">
          미니게임 중 <b>원하는 게임을 클리어</b>해도 도감에서 <b>❓ 대신 실제 술 그림(${isImageUnlocked ? recipe.emoji : '🖼️'})</b>이 즉시 해금됩니다!
        </div>

        <div class="minigame-cards-list">
          <div class="minigame-select-card mg-card-brick" data-start-minigame="BRICK_BREAKER">
            <div class="mg-card-left">
              <span class="mg-card-icon">🧱</span>
            </div>
            <div class="mg-card-body">
              <div class="mg-card-title-row">
                <span class="mg-card-title">1. 벽돌깨기</span>
                <span class="mg-diff-pill hard">100% 클리어</span>
              </div>
              <div class="mg-card-desc">
                단단한 벽돌과 강철 범퍼를 돌파하세요! 깨진 벽돌에서 떨어지는 <b>☠️독방울(라이프 감소)</b>과 <b>❄️냉기(패들 축소)</b>를 피해야 합니다.
              </div>
            </div>
            <button class="mg-play-btn">도전 ➔</button>
          </div>

          <div class="minigame-select-card mg-card-qix" data-start-minigame="TERRITORY_QIX">
            <div class="mg-card-left">
              <span class="mg-card-icon">📐</span>
            </div>
            <div class="mg-card-body">
              <div class="mg-card-title-row">
                <span class="mg-card-title">2. 땅따먹기</span>
                <span class="mg-diff-pill vhard">100% 점령</span>
              </div>
              <div class="mg-card-desc">
                어둠 속을 질주하는 <b>보스 코어 + 고속 화염구 2기</b>가 내 궤적(선)에 닿기 전에 안전지대로 복귀해 <b>뒤에 숨겨진 그림 영역을 뚫어 완전히 드러내세요!</b>
              </div>
            </div>
            <button class="mg-play-btn">도전 ➔</button>
          </div>
        </div>
      `;

      this._bindEvents(container);
      return;
    }

    // =========================================================================
    // [모드 3] 미니게임 아케이드 플레이 화면 (60fps HTML5 Canvas)
    // =========================================================================
    if (this.viewMode === 'MINIGAME_PLAY') {
      const gameTitles = {
        BRICK_BREAKER: '🧱 벽돌깨기',
        TERRITORY_QIX: '📐 땅따먹기'
      };

      const canvasHeight = 440;

      container.innerHTML = `
        <div class="hint-top-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="hint-back-choice-btn" id="mg-back-select-top-btn" title="게임 선택 화면으로">←</button>
            <div class="modal-title">${gameTitles[this.selectedMinigameType] || '🕹️ 미니게임'}</div>
          </div>
          <button class="modal-close-x" id="hint-close-btn">✕</button>
        </div>

        <div class="arcade-cabinet-box">
          <canvas id="minigame-canvas" width="380" height="${canvasHeight}" class="minigame-canvas"></canvas>
        </div>
      `;

      this._bindEvents(container);
      this._startCanvasMinigame(recipe);
      return;
    }

    // =========================================================================
    // [모드 4] ⚾ 베이스볼 & 황금비율 Up/Down 추리 화면
    // =========================================================================
    const hintState = this.inventory.getHintState(this.activeRecipeId);
    const maxStage = this.baseballEngine.getMaxStageForRecipe(recipe);
    const currentStage = this.baseballEngine.getCurrentActiveStage(this.activeRecipeId);
    const isBaseballDone = this.baseballEngine.isAllStagesCleared(this.activeRecipeId);

    // 슬롯 개수가 현재 단계의 정답 토큰 수와 다르면 동기화
    if (!isBaseballDone) {
      const expectedSlotLen = this.baseballEngine.getAnswerTokens(this.activeRecipeId, currentStage).length;
      if (this.currentGuessSlots.length !== expectedSlotLen) {
        this._resetGuessSlots();
      }
    }

    const needsRatioGame = this.ratioProvider.requiresRatioGame(this.activeRecipeId);
    const isAllRatiosSolved = !needsRatioGame || items.every(it => Boolean(hintState.solvedRatios[String(it.slot_order)]));
    const isUpAndDown = isBaseballDone && needsRatioGame;

    // 업앤다운 기능이 처음 공개되면 자동으로 설명 팝오버를 노출
    if (isUpAndDown && !localStorage.getItem('ksool_seen_updown_guide')) {
      this.showHelpGuide = true;
      localStorage.setItem('ksool_seen_updown_guide', 'true');
    }

    // 우측 상단 3개의 네모 체크박스 렌더링
    const checkboxesHtml = [1, 2, 3].map(st => {
      let isCleared = hintState.stageCleared[st - 1];
      let isSkipped = false;
      let isActive = false;

      if (st <= 2) {
        isActive = !hintState.stageCleared[0] && st === 1 || (hintState.stageCleared[0] && !hintState.stageCleared[1] && st === 2);
      } else if (st === 3) {
        if (recipe.requires_detail_ingredient) {
          isCleared = hintState.stageCleared[2];
          isActive = hintState.stageCleared[1] && !hintState.stageCleared[2];
        } else if (needsRatioGame) {
          isCleared = isAllRatiosSolved;
          isActive = isBaseballDone && !isAllRatiosSolved;
        } else {
          isSkipped = true;
        }
      }
      let cls = 'stage-check-box';
      if (isCleared) cls += ' checked';
      else if (isSkipped) cls += ' skipped';
      else if (isActive) cls += ' active-stage';
      const icon = isCleared ? '✓' : (isSkipped ? '—' : (st === 3 && needsRatioGame && !recipe.requires_detail_ingredient ? '🔢' : st));
      return `<div class="${cls}" title="${st === 3 && needsRatioGame ? '3단계: 황금비율 Up/Down' : `${st}단계`}">${icon}</div>`;
    }).join('');

    let mainSectionHtml = '';

    if (!isBaseballDone) {
      // [A] 베이스볼 진행 중 (비율 영역은 완전히 숨김!)
      const slotsHtml = this.currentGuessSlots.map((slot, idx) => {
        if (slot) {
          return `
            <div class="pot-slot filled sug-slot-card bb-slot-card" data-bb-slot="${idx}" title="클릭하면 비워집니다">
              <span class="slot-emoji">${slot.emoji}</span>
              <span class="slot-name">${slot.name}</span>
            </div>
          `;
        }
        return `
          <div class="pot-slot empty sug-slot-card bb-slot-card">
            <span style="font-size:1rem; opacity:0.35;">➕</span>
            <span style="font-size:0.62rem;">${idx + 1}번 칸</span>
          </div>
        `;
      }).join('');

      let stage2CatBarHtml = '';
      let optionsPoolHtml = '';

      const renderOptionBtn = (opt) => {
        const isPicked = this.currentGuessSlots.some(s => s && String(s.token) === String(opt.token));
        return `
          <button class="bb-option-btn ${isPicked ? 'picked' : ''}"
                  data-bb-token="${opt.token}"
                  data-bb-emoji="${opt.emoji}"
                  data-bb-name="${opt.name}"
                  data-bb-label="${opt.label}">
            ${opt.label}
          </button>
        `;
      };

      if (currentStage === 2) {
        const solvedCatIds = this.baseballEngine.getAnswerTokens(this.activeRecipeId, 1);
        const solvedCategories = this.recipeBook.categories.filter(c => solvedCatIds.includes(c.category_id));
        if (!this.selectedStage2Category || !solvedCategories.some(c => c.category_id === this.selectedStage2Category)) {
          this.selectedStage2Category = solvedCategories[0] ? solvedCategories[0].category_id : null;
        }
        stage2CatBarHtml = `
          <div class="cat-filter-bar">
            ${solvedCategories.map(c => `
              <button class="cat-chip ${this.selectedStage2Category === c.category_id ? 'active' : ''}" data-bb-stage2-cat="${c.category_id}">
                ${c.name}
              </button>
            `).join('')}
          </div>
        `;

        const panesHtml = solvedCategories.map(c => {
          const isActivePane = this.selectedStage2Category === c.category_id;
          const catOpts = this._getOptionsForStage(2, c.category_id);
          return `
            <div class="bb-cat-pane ${isActivePane ? 'active-pane' : 'hidden-pane'}">
              ${catOpts.map(renderOptionBtn).join('')}
            </div>
          `;
        }).join('');

        optionsPoolHtml = `<div class="bb-options-pool bb-stacked-pool">${panesHtml}</div>`;
      } else {
        const options = this._getOptionsForStage(currentStage);
        optionsPoolHtml = `<div class="bb-options-pool">${options.map(renderOptionBtn).join('')}</div>`;
      }

      const canSubmit = this.currentGuessSlots.length > 0 && this.currentGuessSlots.every(s => s !== null);

      const stageTitles = {
        1: '재료유형 추리',
        2: '대표재료 추리',
        3: '상세재료 추리'
      };
      const stageTitle = stageTitles[currentStage] || '재료 추리';

      const latestRecord = (hintState.history || [])[0];
      const historyHtml = latestRecord ? `
        <div class="bb-history-row">
          <span class="bb-score-pills">
            <span class="pill-strike">${latestRecord.strikes}S</span>
            <span class="pill-ball">${latestRecord.balls}B</span>
            <span class="pill-out">${latestRecord.outs}O</span>
          </span>
        </div>
      ` : '';

      mainSectionHtml = `
        <div class="hint-section-box">
          <div class="baseball-slots">${slotsHtml}</div>
          <div class="bb-stage-subtitle-bar">
            <span class="bb-stage-num-badge">${currentStage}단계</span>
            <span class="bb-stage-subtitle-title">${stageTitle}</span>
          </div>
          ${stage2CatBarHtml}
          <div class="bb-options-row">
            ${optionsPoolHtml}
            <button class="bb-submit-icon-btn" id="bb-submit-btn" title="판정하기" ${canSubmit ? '' : 'disabled'}>
              ⚾
            </button>
          </div>
          ${historyHtml ? `<div class="bb-history-list">${historyHtml}</div>` : ''}
        </div>
      `;
    } else {
      // [B] 베이스볼 모두 클리어 완료! (황금비율 Up/Down 추리 화면)
      this.ratioProvider.ensureUnitRatiosAutoSolved(this.activeRecipeId);
      if (needsRatioGame && !isAllRatiosSolved) {
        if (this.selectedUpDownSlotOrder === null) {
          const firstRatioSlot = items.find(it => Number(it.ratio) > 1 && !hintState.solvedRatios[String(it.slot_order)]) ||
                                 items.find(it => Number(it.ratio) > 1) ||
                                 items[0];
          this.selectedUpDownSlotOrder = firstRatioSlot ? Number(firstRatioSlot.slot_order) : Number(items[0].slot_order);
        }
      } else {
        this.selectedUpDownSlotOrder = null;
      }

      const solvedSlotsHtml = items.map(it => {
        const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
        const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
        const target = det || base;
        const isUnitRatio = Number(it.ratio) === 1;
        const solvedVal = hintState.solvedRatios[String(it.slot_order)];
        const isSelected = !isUnitRatio && !isAllRatiosSolved && Number(this.selectedUpDownSlotOrder) === Number(it.slot_order);
        const detailBadge = det ? `<span class="slot-detail-tag">특산</span>` : '';

        // 비율이 1인 재료는 숫자 배지를 표시하지 않음 (2 이상이거나 미해결 ? 상태일 때만 표시)
        let badgeHtml = '';
        if (!isUnitRatio) {
          badgeHtml = `<span class="slot-count-badge ${solvedVal ? 'is-solved' : 'is-question'}">${solvedVal ? solvedVal : '?'}</span>`;
        }

        return `
          <div class="pot-slot filled sug-slot-card hint-ratio-slot ${isSelected ? 'active-ratio-slot' : ''} ${solvedVal ? 'solved-ratio-slot' : ''}"
               ${(!isUnitRatio && !isAllRatiosSolved) ? `data-updown-slot="${it.slot_order}" title="클릭하여 비율 Up/Down 추리하기"` : `style="cursor:default;"`}>
            ${detailBadge}
            <span class="slot-emoji">${target ? target.emoji : '🍶'}</span>
            <span class="slot-name">${target ? this.brandResolver.resolveName(target) : ''}</span>
            ${badgeHtml}
          </div>
        `;
      }).join('');

      let upDownDrawerHtml = '';
      if (needsRatioGame && !isAllRatiosSolved && this.selectedUpDownSlotOrder !== null) {
        const selectedItem = items.find(it => Number(it.slot_order) === Number(this.selectedUpDownSlotOrder)) || items[0];
        const solvedVal = hintState.solvedRatios[String(selectedItem.slot_order)];
        const isCurrentSlotSolved = Boolean(solvedVal);

        const numpadHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
          <button class="num-btn ${Number(solvedVal) === num ? 'correct-num' : ''}"
                  data-updown-num="${num}"
                  ${isCurrentSlotSolved ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
            ${num}
          </button>
        `).join('');

        let resultRowHtml = '';
        if (this.lastUpDownResult) {
          const st = this.lastUpDownResult.status;
          const cls = st === 'UP' ? 'pill-up' : (st === 'DOWN' ? 'pill-down' : 'pill-correct');
          const text = st === 'UP' ? 'Up' : (st === 'DOWN' ? 'Down' : `✨ 정답! (비율: ${this.lastUpDownResult.answer || solvedVal})`);
          resultRowHtml = `
            <div class="bb-history-row updown-score-row" id="updown-score-container">
              <span class="bb-score-pills"><span class="${cls} animate-pop">${text}</span></span>
            </div>
          `;
        } else if (solvedVal) {
          resultRowHtml = `
            <div class="bb-history-row updown-score-row" id="updown-score-container">
              <span class="bb-score-pills"><span class="pill-correct animate-pop">✨ 정답! (비율: ${solvedVal})</span></span>
            </div>
          `;
        } else {
          resultRowHtml = `
            <div class="bb-history-row updown-score-row" id="updown-score-container">
              <span class="bb-score-pills"><span class="pill-guide animate-pop">비율을 맞춰보세요</span></span>
            </div>
          `;
        }

        upDownDrawerHtml = `
          <div class="hint-section-box updown-drawer-box">
            <div class="numpad-1to10">${numpadHtml}</div>
            ${resultRowHtml}
          </div>
        `;
      }

      const allSolvedBannerHtml = isAllRatiosSolved ? `
        <div class="bb-all-solved-card animate-pop">
          <div class="bb-all-solved-title">🎉 모든 재료의 황금비율 완성!</div>
          <div class="bb-all-solved-desc">모든 재료와 비율을 완벽히 알아냈습니다. 아래 버튼을 눌러 주조실에 자동 세팅해보세요!</div>
        </div>
      ` : '';

      const goToBrewBtnHtml = isAllRatiosSolved ? `
        <button class="mix-btn bb-go-brew-btn" id="bb-go-brew-btn">
          ⚗️ 주조실로 가기 (자동 세팅)
        </button>
      ` : '';

      mainSectionHtml = `
        <div class="hint-section-box">
          <div class="baseball-slots">${solvedSlotsHtml}</div>
          ${allSolvedBannerHtml}
          ${goToBrewBtnHtml}
        </div>
        ${upDownDrawerHtml}
      `;
    }

    const helpGuideHtml = this.showHelpGuide ? `
      <div class="bb-help-popover updown-help-popover">
        ${isUpAndDown ? `
          <div style="font-size:0.86rem; color:#fde047; font-weight:900; margin-bottom:5px;">
            🎯 업앤다운 규칙
          </div>
          <div style="line-height:1.6; font-size:0.78rem; color:#cbd5e1; word-break:keep-all;">
            • <b>Up</b>: 실제 비율이 선택한 숫자보다 큼<br>
            • <b>Down</b>: 실제 비율이 선택한 숫자보다 작음<br>
            • <b>정답</b>: 해당 재료의 황금비율 일치!
          </div>
          <div style="color:#6ee7b7; font-size:0.72rem; margin-top:6px; font-weight:700; word-break:keep-all;">
            💡 모든 재료의 비율을 맞추면 최종 레시피가 완성됩니다.
          </div>
        ` : `
          <div style="font-size:0.86rem; color:#fde047; font-weight:900; margin-bottom:6px;">
            ⚾ 베이스볼 판정 규칙
          </div>
          <div style="line-height:1.65; font-size:0.78rem; color:#cbd5e1; word-break:keep-all;">
            • <b style="color:#60a5fa;">S (스트라이크)</b>: 재료와 위치 모두 일치<br>
            • <b style="color:#fbbf24;">B (볼)</b>: 재료는 맞으나 위치가 다름<br>
            • <b style="color:#f87171;">O (아웃)</b>: 레시피에 없는 재료
          </div>
          <div style="color:#94a3b8; font-size:0.72rem; margin-top:6px; word-break:keep-all;">
            ※ 순서 없는 레시피는 맞는 재료가 모두 S로 판정됩니다.
          </div>
        `}
      </div>
    ` : '';

    const targetInfoCardHtml = `
      <div class="bb-target-info-card">
        <div class="bb-target-title-row">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="bb-target-num">${recipe.formatted_number || ''}</span>
            <span class="bb-target-name">${resolvedName}</span>
          </div>
        </div>
        ${recipe.unlock_hint ? `
          <div class="bb-target-hint">
            <span class="hint-bulb">💡</span> ${recipe.unlock_hint}
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = `
      <div class="hint-top-header">
        <div style="display:flex; align-items:center; gap:6px; min-width:0;">
          <button class="hint-back-choice-btn" id="hint-back-choice-btn" title="선택 화면으로">←</button>
          <div class="modal-title" style="display:flex; align-items:center; gap:5px;">
            <span>${isUpAndDown ? '🎯 업앤다운' : '⚾ 베이스볼'}</span>
          </div>
          <button class="bb-help-btn ${this.showHelpGuide ? 'active' : ''}" id="bb-help-toggle-btn" title="${isUpAndDown ? '업앤다운 게임 설명 보기' : '베이스볼 게임 설명 보기'}">?</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <div class="stage-checkboxes" title="1:유형 -> 2:대표 -> 3:상세">${checkboxesHtml}</div>
          <button class="modal-close-x" id="hint-close-btn">✕</button>
        </div>
      </div>
      ${helpGuideHtml}

      ${targetInfoCardHtml}

      ${mainSectionHtml}
    `;

    this._bindEvents(container);
  }

  _startCanvasMinigame(recipe) {
    this._stopMinigame();
    const canvas = document.getElementById('minigame-canvas');
    if (!canvas) return;

    this.minigameStatus = 'PLAYING';
    this.minigameInstance = new window.KSool.ImageMinigameSuite(
      canvas,
      recipe,
      this.audio,
      () => {
        // 클리어 성공 시 도감 그림만 선해금 저장 & 도감 그리드 즉시 갱신!
        this.minigameStatus = 'WIN';
        this.inventory.unlockRecipeImage(this.activeRecipeId);
        if (this.onImageUnlocked) {
          this.onImageUnlocked();
        }
        this._updateMinigameControlsOnly(recipe);
      },
      () => {
        this.minigameStatus = 'LOSE';
        this._updateMinigameControlsOnly(recipe);
      }
    );
    this.minigameInstance.start(this.selectedMinigameType);
  }

  _updateMinigameControlsOnly(recipe) {
    // 캔버스 내부 터치 상호작용으로 완전 일원화되어 불필요한 하단 DOM 슬롯을 사용하지 않음
  }

  _getOptionsForStage(stage, overrideCatId = null) {
    const unlockedBaseIngs = Array.from(this.recipeBook.baseIngredients.values()).filter(ing =>
      this.inventory.isIngredientAvailable(ing.ingredient_id)
    );

    if (stage === 1) {
      return this.recipeBook.categories
        .filter(c => unlockedBaseIngs.some(ing => ing.category_id === c.category_id))
        .map(c => ({
          token: c.category_id,
          emoji: c.emoji,
          name: c.name,
          label: `${c.emoji} ${c.name}`
        }));
    }

    if (stage === 2) {
      const solvedCatIds = this.baseballEngine.getAnswerTokens(this.activeRecipeId, 1);
      const activeCat = overrideCatId || this.selectedStage2Category || solvedCatIds[0];
      return unlockedBaseIngs
        .filter(ing => solvedCatIds.includes(ing.category_id) && (!activeCat || ing.category_id === activeCat))
        .sort((a, b) => a.ingredient_id - b.ingredient_id)
        .map(ing => {
          const resolvedName = this.brandResolver.resolveName(ing);
          return {
            token: String(ing.ingredient_id),
            emoji: ing.emoji,
            name: resolvedName,
            label: `${ing.emoji} ${resolvedName}`
          };
        });
    }

    const solvedBaseIds = this.baseballEngine.getAnswerTokens(this.activeRecipeId, 2).map(Number);
    const detailOpts = Array.from(this.recipeBook.detailIngredients.values())
      .filter(det => solvedBaseIds.includes(Number(det.base_ingredient_id)) && this.inventory.isIngredientAvailable(det.base_ingredient_id))
      .map(det => {
        const resolvedName = this.brandResolver.resolveName(det);
        return {
          token: `D:${det.detail_id}`,
          emoji: det.emoji || '✨',
          name: resolvedName,
          label: `${det.emoji || '✨'} ${resolvedName}`
        };
      });
    const baseOpts = unlockedBaseIngs
      .filter(ing => solvedBaseIds.includes(Number(ing.ingredient_id)))
      .map(ing => {
        const resolvedName = `${this.brandResolver.resolveName(ing)}(기본)`;
        return {
          token: `B:${ing.ingredient_id}`,
          emoji: ing.emoji,
          name: resolvedName,
          label: `${ing.emoji} ${resolvedName}`
        };
      });
    return [...detailOpts, ...baseOpts];
  }

  _bindEvents(container) {
    const closeBtn = container.querySelector('#hint-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const helpBtn = container.querySelector('#bb-help-toggle-btn');
    if (helpBtn) {
      helpBtn.onclick = () => {
        this.showHelpGuide = !this.showHelpGuide;
        this.audio.playTap();
        this.render();
      };
    }

    // 초기 선택 화면: [베이스볼] 버튼 클릭
    const choiceBaseballBtn = container.querySelector('#choice-baseball-btn');
    if (choiceBaseballBtn) {
      choiceBaseballBtn.onclick = () => {
        this._clearActiveRecipeHistory();
        this._resetGuessSlots();
        this.viewMode = 'BASEBALL';
        this.audio.playTap();
        this.render();
      };
    }

    // 초기 선택 화면: [그림 해금 게임] 버튼 클릭 -> 3종 미니게임 선택 화면
    const choiceMinigameBtn = container.querySelector('#choice-minigame-btn');
    if (choiceMinigameBtn) {
      choiceMinigameBtn.onclick = () => {
        this.viewMode = 'MINIGAME_SELECT';
        this.audio.playTap();
        this.render();
      };
    }

    // 초기 선택 화면: [힌트보기] 버튼 클릭
    const choiceExtHintBtn = container.querySelector('#choice-ext-hint-btn');
    if (choiceExtHintBtn) {
      choiceExtHintBtn.onclick = () => {
        const extHints = this.recipeBook.getExternalHints(this.activeRecipeId);
        if (extHints && extHints.length > 0) {
          const targetUrl = window.KSool.ExternalHintLinker.buildTargetUrl(extHints[0]);
          this.audio.playTap();
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      };
    }

    // 선택 화면으로 돌아가기
    const backChoiceBtn = container.querySelector('#hint-back-choice-btn');
    if (backChoiceBtn) {
      backChoiceBtn.onclick = () => {
        this._clearActiveRecipeHistory();
        this.viewMode = 'CHOICE';
        this.audio.playTap();
        this.render();
      };
    }

    // 미니게임 카드 클릭 -> 해당 미니게임 즉시 시작
    container.querySelectorAll('[data-start-minigame]').forEach(card => {
      card.onclick = () => {
        this.selectedMinigameType = card.getAttribute('data-start-minigame');
        this.minigameStatus = 'PLAYING';
        this.viewMode = 'MINIGAME_PLAY';
        this.audio.playTap();
        this.render();
      };
    });

    // 미니게임 플레이 화면 -> 미니게임 목록으로 돌아가기
    const backSelectTopBtn = container.querySelector('#mg-back-select-top-btn');
    if (backSelectTopBtn) {
      backSelectTopBtn.onclick = () => {
        this.viewMode = 'MINIGAME_SELECT';
        this.audio.playTap();
        this.render();
      };
    }

    const backSelectBtn = container.querySelector('#mg-back-select-btn');
    if (backSelectBtn) {
      backSelectBtn.onclick = () => {
        this.viewMode = 'MINIGAME_SELECT';
        this.audio.playTap();
        this.render();
      };
    }

    // 미니게임 재도전 버튼
    const retryBtn = container.querySelector('#mg-retry-btn');
    if (retryBtn) {
      retryBtn.onclick = () => {
        this.minigameStatus = 'PLAYING';
        this.audio.playTap();
        this.render();
      };
    }

    // 미니게임 클리어 후 바로 베이스볼 추리로 이동
    const goBaseballBtn = container.querySelector('#mg-go-baseball-btn');
    if (goBaseballBtn) {
      goBaseballBtn.onclick = () => {
        this._clearActiveRecipeHistory();
        this._resetGuessSlots();
        this.viewMode = 'BASEBALL';
        this.audio.playTap();
        this.render();
      };
    }

    // 땅따먹기(QIX) 온스크린 방향키 D-Pad 조작
    container.querySelectorAll('[data-qix-dir]').forEach(btn => {
      const handleDir = (e) => {
        if (e.cancelable) e.preventDefault();
        const [dc, dr] = btn.getAttribute('data-qix-dir').split(',').map(Number);
        if (this.minigameInstance) {
          this.minigameInstance.setQixDirection(dc, dr);
        }
      };
      btn.onmousedown = handleDir;
      btn.ontouchstart = handleDir;
    });

    // 2단계 카테고리 탭 전환
    container.querySelectorAll('[data-bb-stage2-cat]').forEach(btn => {
      btn.onclick = () => {
        this.selectedStage2Category = btn.getAttribute('data-bb-stage2-cat');
        this.audio.playTap();
        this.render();
      };
    });

    // 숫자야구 슬롯 비우기
    container.querySelectorAll('[data-bb-slot]').forEach(el => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-bb-slot'));
        this.currentGuessSlots[idx] = null;
        this.audio.playTap();
        this.render();
      };
    });

    // 숫자야구 후보 선택
    container.querySelectorAll('[data-bb-token]').forEach(btn => {
      btn.onclick = () => {
        const token = btn.getAttribute('data-bb-token');
        const existingIdx = this.currentGuessSlots.findIndex(s => s && String(s.token) === String(token));
        if (existingIdx !== -1) {
          this.currentGuessSlots[existingIdx] = null;
          this.audio.playTap();
          this.render();
          return;
        }

        const emptyIdx = this.currentGuessSlots.findIndex(s => s === null);
        if (emptyIdx === -1) return;

        this.currentGuessSlots[emptyIdx] = {
          token,
          emoji: btn.getAttribute('data-bb-emoji'),
          name: btn.getAttribute('data-bb-name'),
          label: btn.getAttribute('data-bb-label')
        };
        this.audio.playTap();
        this.render();
      };
    });

    // 숫자야구 판정 제출
    const submitBtn = container.querySelector('#bb-submit-btn');
    if (submitBtn) {
      submitBtn.onclick = () => {
        const currentStage = this.baseballEngine.getCurrentActiveStage(this.activeRecipeId);
        const tokens = this.currentGuessSlots.map(s => s.token);
        const labels = this.currentGuessSlots.map(s => s.label);
        const res = this.baseballEngine.evaluateGuess(this.activeRecipeId, currentStage, tokens, labels);

        if (res.isStageCleared) {
          this.audio.playSuccess();
          this._resetGuessSlots();
        } else {
          this.audio.playTap();
        }
        this.render();
      };
    }

    // 베이스볼 완료 후 상단 정답 슬롯(? 배지) 클릭 -> 하단 Up/Down 추리 슬롯 선택 (깜빡임 없이 in-place 갱신)
    container.querySelectorAll('[data-updown-slot]').forEach(slotEl => {
      slotEl.onclick = () => {
        const order = Number(slotEl.getAttribute('data-updown-slot'));
        this._selectUpDownSlot(order, container);
      };
    });

    // 베이스볼 & 비율 추리 완료 후 [주조실로 가기] 버튼 클릭 -> 주조실 슬롯 자동 세팅 및 탭 이동
    const goBrewBtn = container.querySelector('#bb-go-brew-btn');
    if (goBrewBtn) {
      goBrewBtn.onclick = () => {
        const rId = this.activeRecipeId;
        this.audio.playTap();
        this.close();
        if (this.onAutoSetupBrew && rId) {
          this.onAutoSetupBrew(rId);
        }
      };
    }

    // Up/Down 1~10 숫자 버튼 클릭 (깜빡임 없이 깔끔한 in-place 결과 갱신)
    container.querySelectorAll('[data-updown-num]').forEach(btn => {
      btn.onclick = () => {
        if (this.selectedUpDownSlotOrder === null) return;
        const num = Number(btn.getAttribute('data-updown-num'));
        const res = this.ratioProvider.checkRatioGuess(this.activeRecipeId, this.selectedUpDownSlotOrder, num);
        this.lastUpDownResult = res;

        const scoreContainer = container.querySelector('#updown-score-container');
        if (res.status === 'CORRECT') {
          this.audio.playSuccess();
          // 정답 번호 버튼 강조
          container.querySelectorAll('[data-updown-num]').forEach(b => {
            b.classList.toggle('correct-num', Number(b.getAttribute('data-updown-num')) === num);
          });
          // 슬롯 배지 업데이트
          const targetSlotEl = container.querySelector(`[data-updown-slot="${this.selectedUpDownSlotOrder}"]`);
          if (targetSlotEl) {
            targetSlotEl.classList.add('solved-ratio-slot');
            const badge = targetSlotEl.querySelector('.slot-count-badge');
            if (badge) {
              badge.textContent = num;
              badge.classList.remove('is-question');
              badge.classList.add('is-solved');
            }
          }
          // 모든 슬롯이 정답인지 검사
          const recipe = this.recipeBook.getRecipe(this.activeRecipeId);
          const items = this.recipeBook.getRecipeItems(recipe.recipe_id);
          const hintState = this.inventory.getHintState(this.activeRecipeId);
          const isAllSolved = items.every(it => Boolean(hintState.solvedRatios[String(it.slot_order)]));

          if (scoreContainer) {
            if (isAllSolved) {
              scoreContainer.innerHTML = `<span class="bb-score-pills"><span class="pill-all-solved animate-pop">🎉 정답! 황금비율 완성</span></span>`;
            } else {
              scoreContainer.innerHTML = `<span class="bb-score-pills"><span class="pill-correct animate-pop">✨ 정답! (비율: ${num})</span></span>`;
            }
          }

          if (isAllSolved) {
            // 모든 비율을 맞춘 상태이므로 즉시 모든 숫자 패드 버튼 비활성화
            container.querySelectorAll('[data-updown-num]').forEach(b => {
              b.disabled = true;
              b.style.pointerEvents = 'none';
              if (Number(b.getAttribute('data-updown-num')) === num) {
                b.classList.add('correct-num');
                b.style.opacity = '1';
              } else {
                b.style.opacity = '0.35';
              }
            });

            const checkBoxes = container.querySelectorAll('.stage-check-box');
            if (checkBoxes && checkBoxes[2]) {
              checkBoxes[2].classList.remove('active-stage');
              checkBoxes[2].classList.add('checked');
              checkBoxes[2].textContent = '✓';
            }
            setTimeout(() => {
              this.render();
            }, 500);
          } else {
            // 정답 번호 버튼 강조
            container.querySelectorAll('[data-updown-num]').forEach(b => {
              b.classList.toggle('correct-num', Number(b.getAttribute('data-updown-num')) === num);
            });
            // 아직 미해결된 다음 비율 슬롯으로 자동 이동
            const nextUnsolved = items.find(it => Number(it.ratio) > 1 && !hintState.solvedRatios[String(it.slot_order)]);
            if (nextUnsolved) {
              setTimeout(() => {
                this._selectUpDownSlot(nextUnsolved.slot_order, container);
              }, 600);
            }
          }
        } else {
          this.audio.playTap();
          if (scoreContainer) {
            const cls = res.status === 'UP' ? 'pill-up' : 'pill-down';
            const text = res.status === 'UP' ? 'Up' : 'Down';
            scoreContainer.innerHTML = `<span class="bb-score-pills"><span class="${cls} animate-pop">${text}</span></span>`;
          }
        }
      };
    });
  }

  _selectUpDownSlot(slotOrder, container) {
    this.selectedUpDownSlotOrder = Number(slotOrder);
    this.lastUpDownResult = null;
    this.audio.playTap();

    container.querySelectorAll('[data-updown-slot]').forEach(el => {
      const order = Number(el.getAttribute('data-updown-slot'));
      el.classList.toggle('active-ratio-slot', order === this.selectedUpDownSlotOrder);
    });

    const hintState = this.inventory.getHintState(this.activeRecipeId);
    const solvedVal = hintState.solvedRatios[String(this.selectedUpDownSlotOrder)];
    container.querySelectorAll('[data-updown-num]').forEach(btn => {
      const n = Number(btn.getAttribute('data-updown-num'));
      const isCorrect = Boolean(solvedVal && Number(solvedVal) === n);
      btn.classList.toggle('correct-num', isCorrect);
      btn.disabled = Boolean(solvedVal);
      btn.style.opacity = solvedVal ? (isCorrect ? '1' : '0.4') : '1';
      btn.style.cursor = solvedVal ? 'not-allowed' : 'pointer';
    });

    const recipe = this.recipeBook.getRecipe(this.activeRecipeId);
    const items = this.recipeBook.getRecipeItems(recipe.recipe_id);
    const isAllSolved = items.every(it => Boolean(hintState.solvedRatios[String(it.slot_order)]));

    const scoreContainer = container.querySelector('#updown-score-container');
    if (scoreContainer) {
      if (isAllSolved) {
        scoreContainer.innerHTML = `<span class="bb-score-pills"><span class="pill-all-solved animate-pop">🎉 정답! 황금비율 완성</span></span>`;
      } else if (solvedVal) {
        scoreContainer.innerHTML = `<span class="bb-score-pills"><span class="pill-correct animate-pop">✨ 정답! (비율: ${solvedVal})</span></span>`;
      } else {
        scoreContainer.innerHTML = `<span class="bb-score-pills"><span class="pill-guide animate-pop">비율을 맞춰보세요</span></span>`;
      }
    }
  }
}

window.KSool.HintModalView = HintModalView;
