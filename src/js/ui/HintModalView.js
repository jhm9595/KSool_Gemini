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
    this.currentGuessSlots = []; // [{ token, label }]
    this.selectedUpDownSlotOrder = 1;
    this.lastUpDownResult = null;
  }

  open(recipeId) {
    this.activeRecipeId = Number(recipeId);
    this.lastUpDownResult = null;
    this.selectedUpDownSlotOrder = 1;
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
    const items = this.recipeBook.getRecipeItems(this.activeRecipeId);
    this.currentGuessSlots = items.map(() => null);
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

    // 우측 상단 3개의 네모 체크박스 렌더링
    // 대표 재료에서 끝나는 조합(maxStage === 2)은 2번째 체크까지만 진행되고 맞췄음 안내
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

    // 5-1: 숫자야구 섹션 HTML
    const stageLabels = {
      1: '1단계: 재료 유형 맞추기 (순서 포함)',
      2: '2단계: 대표 재료 맞추기 (순서 포함)',
      3: '3단계: 상세 재료 맞추기 (특산품)'
    };

    let baseballBodyHtml = '';
    if (isBaseballDone) {
      const discoveredNames = items.map(it => {
        const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
        const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
        const target = det || base;
        return `${target.emoji} ${this.brandResolver.resolveName(target)}`;
      }).join(' + ');

      baseballBodyHtml = `
        <div style="background:rgba(16,185,129,0.15); border:1px solid #10b981; border-radius:10px; padding:10px; text-align:center;">
          <div style="font-weight:900; color:#6ee7b7; font-size:0.84rem;">
            🎉 ${maxStage === 2 ? '대표 재료 조합 추리 완료! (2단계 최종 클리어)' : '3단계 상세 재료까지 모두 추리 완료!'}
          </div>
          <div style="font-size:0.78rem; color:#f8fafc; margin-top:4px; font-weight:800;">
            발견한 재료: ${discoveredNames}
          </div>
        </div>
      `;
    } else {
      const slotsHtml = this.currentGuessSlots.map((slot, idx) => `
        <div class="bb-slot ${slot ? 'filled' : ''}" data-bb-slot="${idx}">
          <span>${slot ? slot.label : `${idx + 1}번 칸`}</span>
        </div>
      `).join('');

      const options = this._getOptionsForStage(currentStage);
      const optionsHtml = options.map(opt => `
        <button class="bb-option-btn" data-bb-token="${opt.token}" data-bb-label="${opt.label}">
          ${opt.label}
        </button>
      `).join('');

      const canSubmit = this.currentGuessSlots.every(s => s !== null);

      baseballBodyHtml = `
        <div style="font-size:0.74rem; color:#fcd34d; font-weight:700;">
          ⚾ ${stageLabels[currentStage]} (총 ${items.length}칸 · 비율은 비공개)
        </div>
        <div class="baseball-slots">${slotsHtml}</div>
        <div class="bb-options-row">
          <div class="bb-options-pool">${optionsHtml}</div>
          <button class="bb-submit-icon-btn" id="bb-submit-btn" title="Strike / Ball / Out 판정하기" ${canSubmit ? '' : 'disabled'}>
            ⚾
          </button>
        </div>
      `;
    }

    const latestRecord = (hintState.history || [])[0];
    const historyHtml = latestRecord ? `
      <div class="bb-history-row">
        <span>[${latestRecord.stage}단계] ${latestRecord.guessLabels.join(' · ')}</span>
        <span class="bb-score-pills">
          <span class="pill-strike">${latestRecord.strikes}S</span>
          <span class="pill-ball">${latestRecord.balls}B</span>
          <span class="pill-out">${latestRecord.outs}O</span>
        </span>
      </div>
    ` : '';

    // 5-2: 비율 공개 힌트 (Up/Down 게임 & 광고 슬롯 구조)
    let ratioSectionHtml = '';
    if (!isBaseballDone) {
      ratioSectionHtml = `
        <div style="font-size:0.75rem; color:#64748b; text-align:center; padding:8px;">
          🔒 위의 [힌트 1: 재료 숫자야구]를 먼저 모두 맞추면 각 재료의 비율(Up/Down) 힌트가 열립니다!
        </div>
      `;
    } else {
      const ingButtonsHtml = items.map(it => {
        const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
        const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
        const target = det || base;
        const solvedVal = hintState.solvedRatios[String(it.slot_order)];
        const isSelected = Number(this.selectedUpDownSlotOrder) === Number(it.slot_order);

        return `
          <button class="updown-ing-btn ${isSelected ? 'selected' : ''} ${solvedVal ? 'solved' : ''}"
                  data-updown-slot="${it.slot_order}">
            <span>${target.emoji} ${this.brandResolver.resolveName(target)}</span>
            <span style="font-size:0.7rem; color:${solvedVal ? '#6ee7b7' : '#fbbf24'};">
              ${solvedVal ? `정답 비율: ${solvedVal}` : '비율 맞추기 (클릭)'}
            </span>
          </button>
        `;
      }).join('');

      const numpadHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
        <button class="num-btn" data-updown-num="${num}">${num}</button>
      `).join('');

      const feedbackBannerHtml = this.lastUpDownResult
        ? `<div class="updown-feedback-banner ${this.lastUpDownResult.status.toLowerCase()}">${this.lastUpDownResult.message}</div>`
        : `<div class="updown-feedback-banner">위 재료를 선택하고 1 ~ 10 숫자를 눌러 Up/Down으로 비율을 찾아보세요!</div>`;

      ratioSectionHtml = `
        <div class="updown-ing-list">${ingButtonsHtml}</div>
        ${feedbackBannerHtml}
        <div class="numpad-1to10">${numpadHtml}</div>
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

      <!-- 5-1: 3단계 숫자야구 -->
      <div class="hint-section-box">
        <div class="hint-section-title">
          <span>[힌트 1] 3단계 재료 숫자야구</span>
          <span style="font-size:0.68rem; color:#93c5fd;">
            ${maxStage === 2 ? '대표 재료 조합 (2번째 체크 시 완료)' : '특산 상세 재료 포함 (3번째 체크까지 진행)'}
          </span>
        </div>
        ${baseballBodyHtml}
        ${historyHtml ? `<div class="bb-history-list">${historyHtml}</div>` : ''}
      </div>

      <!-- 5-2: 비율 Up/Down (추후 광고 슬롯 호환) -->
      <div class="hint-section-box">
        <div class="hint-section-title">
          <span>[힌트 2] 황금비율 Up/Down 추리</span>
          <span style="font-size:0.64rem; background:rgba(245,158,11,0.2); color:#fcd34d; padding:2px 6px; border-radius:4px;">
            Ad-Ready (Up/Down 모드)
          </span>
        </div>
        ${ratioSectionHtml}
      </div>
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
          label: `${c.emoji} ${c.name}`
        }));
    }
    if (stage === 2) {
      return unlockedBaseIngs.map(ing => ({
        token: String(ing.ingredient_id),
        label: `${ing.emoji} ${this.brandResolver.resolveName(ing)}`
      }));
    }
    // Stage 3: 해금된 대표 재료의 상세 재료 + 기본 대표 재료 후보 표시
    const detailOpts = Array.from(this.recipeBook.detailIngredients.values())
      .filter(det => this.inventory.isIngredientAvailable(det.base_ingredient_id))
      .map(det => ({
        token: `D:${det.detail_id}`,
        label: `${det.emoji || '✨'} ${this.brandResolver.resolveName(det)}`
      }));
    const baseOpts = unlockedBaseIngs.map(ing => ({
      token: `B:${ing.ingredient_id}`,
      label: `${ing.emoji} ${this.brandResolver.resolveName(ing)}(기본)`
    }));
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
        const emptyIdx = this.currentGuessSlots.findIndex(s => s === null);
        if (emptyIdx === -1) return;
        this.currentGuessSlots[emptyIdx] = {
          token: btn.getAttribute('data-bb-token'),
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

    // 5-2 Up/Down 대상 재료 선택
    container.querySelectorAll('[data-updown-slot]').forEach(btn => {
      btn.onclick = () => {
        this.selectedUpDownSlotOrder = Number(btn.getAttribute('data-updown-slot'));
        this.lastUpDownResult = null;
        this.audio.playTap();
        this.render();
      };
    });

    // 5-2 Up/Down 1~10 숫자 버튼 클릭
    container.querySelectorAll('[data-updown-num]').forEach(btn => {
      btn.onclick = () => {
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
