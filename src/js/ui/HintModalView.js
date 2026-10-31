window.KSool = window.KSool || {};

class HintModalView {
  constructor({ recipeBook, inventory, baseballEngine, ratioProvider, brandResolver, audio }) {
    this.recipeBook = recipeBook;
    this.inventory = inventory;
    this.baseballEngine = baseballEngine;
    this.ratioProvider = ratioProvider;
    this.brandResolver = brandResolver;
    this.audio = audio;

    this.activeRecipeId = null;
    this.viewMode = 'BASEBALL'; // 'CHOICE' | 'BASEBALL'
    this.currentGuessSlots = []; // [{ token, emoji, name, label }]
    this.selectedStage2Category = null; // 2단계에서 선택된 (1단계 통과) 재료 유형 탭
    this.selectedUpDownSlotOrder = null; // 베이스볼 완료 후 상단 정답 슬롯 클릭 시 열림
    this.lastUpDownResult = null;
  }

  open(recipeId) {
    this.activeRecipeId = Number(recipeId);
    this.lastUpDownResult = null;
    this.selectedUpDownSlotOrder = null;
    this.selectedStage2Category = null;
    this._resetGuessSlots();

    // 등록된 외부 힌트(영상/글)가 있으면 [베이스볼 / 힌트보기] 2버튼 선택 화면부터 노출,
    // 등록된 힌트가 없으면 즉시 베이스볼 게임 화면으로 진입
    const extHints = this.recipeBook.getExternalHints(this.activeRecipeId);
    this.viewMode = extHints && extHints.length > 0 ? 'CHOICE' : 'BASEBALL';

    this.render();
    document.getElementById('hint-modal').classList.add('active');
  }

  close() {
    document.getElementById('hint-modal').classList.remove('active');
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

    const items = this.recipeBook.getRecipeItems(this.activeRecipeId);
    const extHints = this.recipeBook.getExternalHints(this.activeRecipeId);
    const hasExtHint = extHints && extHints.length > 0;

    // 1) 등록된 힌트가 있을 때 처음 보여주는 큼지막한 2버튼 선택 화면 (베이스볼 / 힌트보기)
    if (this.viewMode === 'CHOICE' && hasExtHint) {
      const primaryHint = extHints[0];
      const isVideo = primaryHint.platform === 'YOUTUBE';
      const hintIcon = isVideo ? '📺' : '📝';
      const hintSubLabel = isVideo
        ? `영상 힌트 보러가기 (${window.KSool.ExternalHintLinker.formatTimestamp(primaryHint.start_time_sec)})`
        : '힌트 글 보러가기';

      container.innerHTML = `
        <div class="hint-top-header">
          <div>
            <div class="modal-title">🕵️ 미해금 비법 추리 (Lv.${recipe.required_level || 1} 도전)</div>
            <div style="font-size:0.72rem; color:#94a3b8;">
              난이도: <b>${recipe.difficulty}</b> · 총 재료 수: <b>${items.length}개</b>
            </div>
          </div>
          <button class="modal-close-x" id="hint-close-btn">✕</button>
        </div>

        <div class="hint-choice-grid">
          <button class="hint-big-choice-btn choice-baseball" id="choice-baseball-btn">
            <span class="choice-big-icon">⚾</span>
            <span class="choice-big-title">베이스볼</span>
            <span class="choice-big-sub">재료 & 황금비율 추리 게임</span>
          </button>

          <button class="hint-big-choice-btn choice-ext-hint" id="choice-ext-hint-btn">
            <span class="choice-big-icon">${hintIcon}</span>
            <span class="choice-big-title">힌트보기</span>
            <span class="choice-big-sub">${hintSubLabel}</span>
          </button>
        </div>
      `;

      this._bindEvents(container);
      return;
    }

    const hintState = this.inventory.getHintState(this.activeRecipeId);
    const maxStage = this.baseballEngine.getMaxStageForRecipe(recipe);
    const currentStage = this.baseballEngine.getCurrentActiveStage(this.activeRecipeId);
    const isBaseballDone = this.baseballEngine.isAllStagesCleared(this.activeRecipeId);
    const isOrderSensitive = Boolean(recipe.requires_order);

    // 슬롯 개수가 현재 단계의 정답 토큰 수와 다르면 동기화
    if (!isBaseballDone) {
      const expectedSlotLen = this.baseballEngine.getAnswerTokens(this.activeRecipeId, currentStage).length;
      if (this.currentGuessSlots.length !== expectedSlotLen) {
        this._resetGuessSlots();
      }
    }

    // 우측 상단 3개의 네모 체크박스 렌더링
    const checkboxesHtml = [1, 2, 3].map(st => {
      const isCleared = hintState.stageCleared[st - 1];
      const isSkipped = st === 3 && maxStage === 2;
      const isActive = !isBaseballDone && currentStage === st;
      let cls = 'stage-check-box';
      if (isCleared) cls += ' checked';
      else if (isSkipped) cls += ' skipped';
      else if (isActive) cls += ' active-stage';
      const icon = isCleared ? '✓' : (isSkipped ? '—' : st);
      return `<div class="${cls}" title="${st}단계">${icon}</div>`;
    }).join('');

    const orderNotice = isOrderSensitive ? '순서 중요(Ball 판정)' : '순서 무관 · 중복 불가';
    const stageLabels = {
      1: `1단계: 재료 유형 맞추기 (${orderNotice})`,
      2: `2단계: 대표 재료 맞추기 (${orderNotice})`,
      3: `3단계: 상세 재료 맞추기 (${orderNotice})`
    };

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

      // 2단계인 경우: 1단계에서 맞춘 재료 유형(Category) 탭만 주조실과 동일한 형태로 노출
      let stage2CatBarHtml = '';
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
                ${c.emoji} ${c.name}
              </button>
            `).join('')}
          </div>
        `;
      }

      const options = this._getOptionsForStage(currentStage);
      const optionsHtml = options.map(opt => {
        const isPicked = this.currentGuessSlots.some(s => s && String(s.token) === String(opt.token));
        return `
          <div class="ing-card bb-ing-card ${isPicked ? 'in-pot' : ''}"
               data-bb-token="${opt.token}"
               data-bb-emoji="${opt.emoji}"
               data-bb-name="${opt.name}"
               data-bb-label="${opt.label}">
            <span class="ing-emoji">${opt.emoji}</span>
            <span class="ing-name">${opt.name}</span>
            ${isPicked ? '<span class="slot-count-badge">✓</span>' : ''}
          </div>
        `;
      }).join('');

      const canSubmit = this.currentGuessSlots.length > 0 && this.currentGuessSlots.every(s => s !== null);

      const latestRecord = (hintState.history || [])[0];
      const historyHtml = latestRecord ? `
        <div class="bb-history-row">
          <span>[${latestRecord.stage}단계] ${latestRecord.guessLabels.join(' · ')}</span>
          <span class="bb-score-pills">
            <span class="pill-strike">${latestRecord.strikes}S</span>
            ${isOrderSensitive ? `<span class="pill-ball">${latestRecord.balls}B</span>` : ''}
            <span class="pill-out">${latestRecord.outs}O</span>
          </span>
        </div>
      ` : '';

      mainSectionHtml = `
        <div class="hint-section-box">
          <div class="hint-section-title">
            <span>⚾ 3단계 재료 숫자야구</span>
            <span style="font-size:0.68rem; color:#93c5fd;">
              ${maxStage === 2 ? '대표 재료 조합 (2단계 완료 시 비율 열림)' : '특산 재료 조합 (3단계 완료 시 비율 열림)'}
            </span>
          </div>
          <div style="font-size:0.74rem; color:#fcd34d; font-weight:700;">
            ⚾ ${stageLabels[currentStage]} (총 ${this.currentGuessSlots.length}종 선택)
          </div>
          <div class="baseball-slots">${slotsHtml}</div>
          ${stage2CatBarHtml}
          <div class="bb-options-row">
            <div class="bb-options-pool bb-grid-pool">${optionsHtml}</div>
            <button class="bb-submit-icon-btn" id="bb-submit-btn" title="판정하기" ${canSubmit ? '' : 'disabled'}>
              ⚾
            </button>
          </div>
          ${historyHtml ? `<div class="bb-history-list">${historyHtml}</div>` : ''}
        </div>
      `;
    } else {
      // [B] 베이스볼 모두 클리어 완료!
      // 상단 영역에 내가 푼 정답 재료들을 주조실 슬롯과 동일한 UI로 보여주되,
      // 우측 하단 배지에 숫자 대신 물음표(?)를 표시(맞춘 재료는 정답 숫자 표시)하고,
      // 재료를 클릭하면 아래에서 Up/Down 영역이 열리도록 구성
      const solvedSlotsHtml = items.map(it => {
        const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
        const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
        const target = det || base;
        const solvedVal = hintState.solvedRatios[String(it.slot_order)];
        const isSelected = Number(this.selectedUpDownSlotOrder) === Number(it.slot_order);
        const detailBadge = det ? `<span class="slot-detail-tag">특산</span>` : '';

        return `
          <div class="pot-slot filled sug-slot-card hint-ratio-slot ${isSelected ? 'active-ratio-slot' : ''} ${solvedVal ? 'solved-ratio-slot' : ''}"
               data-updown-slot="${it.slot_order}"
               title="클릭하여 비율 Up/Down 추리하기">
            ${detailBadge}
            <span class="slot-emoji">${target ? target.emoji : '🍶'}</span>
            <span class="slot-name">${target ? this.brandResolver.resolveName(target) : ''}</span>
            <span class="slot-count-badge ${solvedVal ? 'is-solved' : 'is-question'}">${solvedVal ? solvedVal : '?'}</span>
          </div>
        `;
      }).join('');

      let upDownDrawerHtml = '';
      if (this.selectedUpDownSlotOrder !== null) {
        const selectedItem = items.find(it => Number(it.slot_order) === Number(this.selectedUpDownSlotOrder)) || items[0];
        const det = this.recipeBook.getDetailIngredient(selectedItem.detail_ingredient_id);
        const base = this.recipeBook.getBaseIngredient(selectedItem.ingredient_id);
        const target = det || base;
        const targetName = target ? this.brandResolver.resolveName(target) : '';
        const solvedVal = hintState.solvedRatios[String(selectedItem.slot_order)];

        const numpadHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
          <button class="num-btn ${Number(solvedVal) === num ? 'correct-num' : ''}" data-updown-num="${num}">${num}</button>
        `).join('');

        const feedbackBannerHtml = this.lastUpDownResult
          ? `<div class="updown-feedback-banner ${this.lastUpDownResult.status.toLowerCase()}">${this.lastUpDownResult.message}</div>`
          : `<div class="updown-feedback-banner">${target.emoji} <b>${targetName}</b>의 투입 비율(1 ~ 10)을 눌러 Up/Down을 확인하세요!</div>`;

        upDownDrawerHtml = `
          <div class="hint-section-box updown-drawer-box">
            <div class="hint-section-title">
              <span>🔢 [${target.emoji} ${targetName}] 황금비율 Up/Down</span>
              <span style="font-size:0.68rem; color:#fcd34d;">1 ~ 10 숫자 선택</span>
            </div>
            ${feedbackBannerHtml}
            <div class="numpad-1to10">${numpadHtml}</div>
          </div>
        `;
      }

      mainSectionHtml = `
        <div class="hint-section-box">
          <div class="hint-section-title">
            <span>🎉 재료 추리 완료! (비율 ? 맞추기)</span>
            <span style="font-size:0.68rem; color:#6ee7b7;">재료를 눌러 ? 비율을 추리하세요</span>
          </div>
          <div class="baseball-slots">${solvedSlotsHtml}</div>
          ${this.selectedUpDownSlotOrder === null ? `
            <div style="font-size:0.75rem; color:#fcd34d; text-align:center; padding:4px 0; font-weight:700;">
              👆 위 정답 재료 카드 중 하나를 클릭하면 아래에 비율 Up/Down 추리창이 열립니다!
            </div>
          ` : ''}
        </div>
        ${upDownDrawerHtml}
      `;
    }

    container.innerHTML = `
      <div class="hint-top-header">
        <div style="display:flex; align-items:center; gap:8px;">
          ${hasExtHint ? `<button class="hint-back-choice-btn" id="hint-back-choice-btn" title="선택 화면으로">←</button>` : ''}
          <div>
            <div class="modal-title">🕵️ 미해금 비법 추리 (Lv.${recipe.required_level || 1} 도전)</div>
            <div style="font-size:0.72rem; color:#94a3b8;">
              난이도: <b>${recipe.difficulty}</b> · 총 재료 수: <b>${items.length}개</b>
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="stage-checkboxes" title="1:유형 -> 2:대표 -> 3:상세">${checkboxesHtml}</div>
          <button class="modal-close-x" id="hint-close-btn">✕</button>
        </div>
      </div>

      ${mainSectionHtml}
    `;

    this._bindEvents(container);
  }

  _getOptionsForStage(stage) {
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
      // 1단계에서 맞춘 재료 유형(Category)에 속한 해금 재료만 주조실 형태로 표시
      const solvedCatIds = this.baseballEngine.getAnswerTokens(this.activeRecipeId, 1);
      const activeCat = this.selectedStage2Category || solvedCatIds[0];
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

    // Stage 3: 2단계에서 맞춘 대표 재료들의 상세 재료 + 기본 재료 후보만 표시
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

    // 초기 선택 화면: [베이스볼] 버튼 클릭 -> 베이스볼 게임 화면으로 전환
    const choiceBaseballBtn = container.querySelector('#choice-baseball-btn');
    if (choiceBaseballBtn) {
      choiceBaseballBtn.onclick = () => {
        this.viewMode = 'BASEBALL';
        this.audio.playTap();
        this.render();
      };
    }

    // 초기 선택 화면: [힌트보기] 버튼 클릭 -> 등록된 영상(유튜브 타임스탬프) 또는 힌트 글(블로그)로 즉시 이동
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

    // 베이스볼 화면에서 다시 초기 2버튼 선택 화면으로 돌아가기
    const backChoiceBtn = container.querySelector('#hint-back-choice-btn');
    if (backChoiceBtn) {
      backChoiceBtn.onclick = () => {
        this.viewMode = 'CHOICE';
        this.audio.playTap();
        this.render();
      };
    }

    // 2단계 카테고리 탭 전환 (1단계에서 푼 재료유형 탭)
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

    // 숫자야구 후보 선택 (중복 선택 방지: 이미 선택된 항목을 다시 누르면 슬롯에서 해제)
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

    // 베이스볼 완료 후 상단 정답 슬롯(? 배지) 클릭 -> 하단 Up/Down 추리창 오픈
    container.querySelectorAll('[data-updown-slot]').forEach(slotEl => {
      slotEl.onclick = () => {
        this.selectedUpDownSlotOrder = Number(slotEl.getAttribute('data-updown-slot'));
        this.lastUpDownResult = null;
        this.audio.playTap();
        this.render();
      };
    });

    // Up/Down 1~10 숫자 버튼 클릭
    container.querySelectorAll('[data-updown-num]').forEach(btn => {
      btn.onclick = () => {
        if (this.selectedUpDownSlotOrder === null) return;
        const num = Number(btn.getAttribute('data-updown-num'));
        const res = this.ratioProvider.checkRatioGuess(this.activeRecipeId, this.selectedUpDownSlotOrder, num);
        this.lastUpDownResult = res;
        if (res.status === 'CORRECT') this.audio.playSuccess();
        else this.audio.playTap();
        this.render();
      };
    });
  }
}

window.KSool.HintModalView = HintModalView;
