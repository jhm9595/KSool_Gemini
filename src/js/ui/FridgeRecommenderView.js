window.KSool = window.KSool || {};

/**
 * 7) 내 냉장고 술 조합 추천기 & 랜덤 뽑기 뷰 (FridgeRecommenderView)
 * - 실제 술 조합에 쓰이는 해금된 재료만 선택 목록에 노출 ('불', '공기', '눈' 등 제외)
 * - 오직 내가 해금한 '완성 술 조합' 레시피만 결과에 표시 (소주/얼음/탄산수 등 재료 제작식 제외)
 */
class FridgeRecommenderView {
  constructor({ containerId = 'view-fridge', recipeBook, inventory, fridgeEngine, brandResolver, audio, onShowRecipeDetail } = {}) {
    this.containerId = containerId;
    this.recipeBook = recipeBook;
    this.inventory = inventory;
    this.fridgeEngine = fridgeEngine;
    this.brandResolver = brandResolver;
    this.audio = audio;
    this.onShowRecipeDetail = onShowRecipeDetail;

    this.selectedCategory = 'ALCOHOL';
    this.lastRandomWinnerKey = null;
    this.filterMode = 'FULL';
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // 실제 술 조합에 쓰이는 해금된 냉장고 재료만 필터링
    const eligibleIngs = this.fridgeEngine.getEligibleFridgeIngredients();

    // 해금된 재료가 존재하는 재료 유형만 노출하고 '전체 재료'는 제일 마지막 탭으로 배치
    const visibleCategories = this.recipeBook.categories.filter(c =>
      eligibleIngs.some(ing => ing.category_id === c.category_id)
    );

    if (
      this.selectedCategory !== 'ALL' &&
      !visibleCategories.some(c => c.category_id === this.selectedCategory) &&
      visibleCategories.length > 0
    ) {
      this.selectedCategory = visibleCategories[0].category_id;
    }

    const filteredIngs = this.selectedCategory === 'ALL'
      ? eligibleIngs
      : eligibleIngs.filter(i => i.category_id === this.selectedCategory);

    const catChipsHtml = [
      ...visibleCategories.map(c => `
        <button class="cat-chip ${this.selectedCategory === c.category_id ? 'active' : ''}" data-fridge-cat="${c.category_id}">
          ${c.emoji} ${c.name}
        </button>
      `),
      `<button class="cat-chip ${this.selectedCategory === 'ALL' ? 'active' : ''}" data-fridge-cat="ALL">📦 전체 재료</button>`
    ].join('');

    const ingGridHtml = filteredIngs.map(ing => {
      const checked = this.fridgeEngine.isSelected(ing.ingredient_id);
      const name = this.brandResolver.resolveName(ing);
      return `
        <div class="fridge-ing-chip ${checked ? 'checked' : ''}" data-fridge-ing="${ing.ingredient_id}">
          ${checked ? '<span class="fridge-check-mark">✓</span>' : ''}
          <span style="display:flex; align-items:center; justify-content:center;">${window.KSool?.pixelIcon ? window.KSool.pixelIcon(ing, 26) : ing.emoji}</span>
          <span style="font-size:0.68rem; font-weight:700; color:#f1f5f9; text-align:center; word-break:keep-all;">
            ${name}
          </span>
        </div>
      `;
    }).join('');

    const unlockedAlcoholMatches = this.fridgeEngine.findCraftableFromFridge();
    const fullMatches = unlockedAlcoholMatches.filter(m => m.isFullMatch);
    const partialMatches = unlockedAlcoholMatches.filter(m => !m.isFullMatch);
    const selectedCount = eligibleIngs.filter(ing => this.fridgeEngine.isSelected(ing.ingredient_id)).length;
    const isSugUnlocked = this.inventory.isSuggestionTabUnlocked();

    const currentList = this.filterMode === 'FULL' ? fullMatches : unlockedAlcoholMatches;

    let matchesHtml = '';
    if (unlockedAlcoholMatches.length === 0) {
      matchesHtml = `
        <div style="text-align:center; padding:18px 10px; font-size:0.78rem; color:#94a3b8; line-height:1.5;">
          선택한 냉장고 재료가 들어간 <b>해금된 술 조합</b>${isSugUnlocked ? ' 및 <b>조합추천</b>' : ''}이 없습니다.<br/>
          (위에서 냉장고 재료를 1개 이상 선택해보세요!)
        </div>
      `;
    } else if (this.filterMode === 'FULL' && fullMatches.length === 0) {
      matchesHtml = `
        <div class="fridge-no-full-match-card">
          <div style="font-size:1.4rem; margin-bottom:4px;">🍶</div>
          <div style="font-weight:900; color:#f8fafc; font-size:0.86rem; margin-bottom:4px;">
            바로 만들 수 있는 술이 아직 없습니다
          </div>
          <div style="font-size:0.75rem; color:#94a3b8; line-height:1.45;">
            선택한 냉장고 재료만으로 완성 가능한 술이 없습니다.<br/>
            함께 조합할 주류나 음료를 1개 이상 더 선택해보세요!
          </div>
          ${partialMatches.length > 0 ? `
            <button class="fridge-mini-btn" id="fridge-view-all-sub-btn" style="margin-top:8px; padding:6px 12px; font-size:0.74rem;">
              🔍 재료 일부 일치 조합 보기 (${partialMatches.length}건)
            </button>
          ` : ''}
        </div>
      `;
    } else {
      matchesHtml = currentList.map(entry => {
        const isWinner = this.lastRandomWinnerKey === entry.entryKey;
        const slotsHtml = entry.items.map(it => {
          const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
          const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
          const target = det || base;
          const inFridge = this.fridgeEngine.isSelected(it.ingredient_id);
          const detailBadge = det ? `<span class="slot-detail-tag">특산</span>` : '';
          const ratioBadge = Number(it.ratio) > 1 ? `<span class="slot-count-badge">${it.ratio}</span>` : '';
          return `
            <div class="pot-slot filled sug-slot-card ${inFridge ? 'fridge-matched-slot' : 'fridge-missing-slot'}">
              ${detailBadge}
              <span class="slot-emoji">${target ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(target, 24) : target.emoji) : '🍶'}</span>
              <span class="slot-name">${target ? this.brandResolver.resolveName(target) : ''}</span>
              ${ratioBadge}
            </div>
          `;
        }).join('');

        const matchBadgeHtml = entry.isFullMatch
          ? `<span class="fridge-match-pill full">✅ ${entry.matchedCount}/${entry.totalCount} 재료 일치</span>`
          : `<span class="fridge-match-pill partial">🔍 ${entry.matchedCount}/${entry.totalCount} 재료 일치</span>`;

        if (entry.entryType === 'OFFICIAL') {
          const rec = entry.recipe;
          return `
            <div class="fridge-recipe-card ${isWinner ? 'highlighted-winner' : ''}" data-fridge-rec="${rec.recipe_id}">
              <div class="fridge-card-top">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:flex; align-items:center; justify-content:center;">${window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 28) : rec.emoji}</span>
                  <span style="font-size:0.86rem; font-weight:900; color:#f8fafc;">
                    ${isWinner ? '🎯 [당첨!] ' : ''}${this.brandResolver.resolveName(rec)}
                  </span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  ${matchBadgeHtml}
                  <span class="diff-badge diff-${rec.difficulty}" style="position:static;">${rec.difficulty}</span>
                </div>
              </div>
              <div class="suggestion-items-wrap">${slotsHtml}</div>
            </div>
          `;
        } else {
          const sug = entry.suggestion;
          return `
            <div class="fridge-recipe-card suggestion-origin ${isWinner ? 'highlighted-winner' : ''}">
              <div class="fridge-card-top">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="online-sug-badge">🌐 조합추천</span>
                  <span style="font-size:0.8rem; font-weight:800; color:#e2e8f0;">
                    ${isWinner ? '🎯 [당첨!] ' : ''}유저 추천 조합 (👍 ${sug.upvotes})
                  </span>
                </div>
                ${matchBadgeHtml}
              </div>
              <div class="suggestion-items-wrap">${slotsHtml}</div>
            </div>
          `;
        }
      }).join('');
    }

    container.innerHTML = `
      <div class="fridge-view-container">
        <!-- 1. 해금된 내 냉장고 재료 선택 박스 -->
        <div class="fridge-box">
          <div class="fridge-box-header">
            <div class="fridge-title">
              <span>🧊 내 냉장고 재료 선택 (${selectedCount}개 선택됨)</span>
            </div>
            <div class="fridge-quick-btns">
              <button class="fridge-mini-btn" id="fridge-select-all-btn">전체 선택</button>
              <button class="fridge-mini-btn" id="fridge-clear-all-btn">전체 해제</button>
            </div>
          </div>

          <div class="cat-filter-bar">${catChipsHtml}</div>
          <div class="fridge-ing-selector">${ingGridHtml}</div>
        </div>

        <!-- 2. 해금된 가능 술 조합 + 온라인 조합추천 목록 -->
        <div class="fridge-result-section">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.82rem; font-weight:900; color:#f8fafc;">
              🍸 추천 조합 (${this.filterMode === 'FULL' ? `재료 일치 ${fullMatches.length}건` : `전체 ${unlockedAlcoholMatches.length}건`})
            </span>
          </div>

          <button class="random-pick-btn" id="fridge-random-pick-btn" ${fullMatches.length === 0 ? 'disabled' : ''}>
            <span>${fullMatches.length > 0
              ? `🎲 오늘 마실 술 랜덤 추첨 (재료 일치 ${fullMatches.length}종 중 추첨)`
              : `🎲 오늘 마실 술 랜덤 추첨 (재료 일치 조합 없음)`}</span>
          </button>

          <div class="fridge-filter-tabs">
            <button class="fridge-filter-tab ${this.filterMode === 'FULL' ? 'active' : ''}" data-fridge-filter="FULL">
              ✅ 바로 제작 가능 (${fullMatches.length})
            </button>
            <button class="fridge-filter-tab ${this.filterMode === 'ALL' ? 'active' : ''}" data-fridge-filter="ALL">
              🔍 전체 조합 (${unlockedAlcoholMatches.length})
            </button>
          </div>

          <div class="fridge-match-list">
            ${matchesHtml}
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container, unlockedAlcoholMatches, fullMatches);
  }

  _bindEvents(container, unlockedAlcoholMatches, fullMatches) {
    container.querySelectorAll('[data-fridge-cat]').forEach(btn => {
      btn.onclick = () => {
        this.selectedCategory = btn.getAttribute('data-fridge-cat');
        this.audio.playTap();
        this.render();
      };
    });

    container.querySelectorAll('[data-fridge-filter]').forEach(btn => {
      btn.onclick = () => {
        this.filterMode = btn.getAttribute('data-fridge-filter');
        this.audio.playTap();
        this.render();
      };
    });

    const viewAllSubBtn = container.querySelector('#fridge-view-all-sub-btn');
    if (viewAllSubBtn) {
      viewAllSubBtn.onclick = () => {
        this.filterMode = 'ALL';
        this.audio.playTap();
        this.render();
      };
    }

    container.querySelectorAll('[data-fridge-ing]').forEach(chip => {
      chip.onclick = () => {
        const id = Number(chip.getAttribute('data-fridge-ing'));
        this.fridgeEngine.toggleIngredient(id);
        this.lastRandomWinnerKey = null;
        this.audio.playTap();
        this.render();
      };
    });

    const selectAllBtn = container.querySelector('#fridge-select-all-btn');
    if (selectAllBtn) {
      selectAllBtn.onclick = () => {
        this.fridgeEngine.selectAllUnlocked();
        this.lastRandomWinnerKey = null;
        this.audio.playTap();
        this.render();
      };
    }

    const clearAllBtn = container.querySelector('#fridge-clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        this.fridgeEngine.clearAll();
        this.lastRandomWinnerKey = null;
        this.audio.playTap();
        this.render();
      };
    }

    const randomBtn = container.querySelector('#fridge-random-pick-btn');
    if (randomBtn) {
      randomBtn.onclick = () => {
        if (!fullMatches || fullMatches.length === 0) return;
        const picked = this.fridgeEngine.pickRandomRecipe(fullMatches);
        if (!picked) return;
        this.lastRandomWinnerKey = picked.entryKey;
        this.audio.playSuccess();
        this.filterMode = 'FULL';
        this.render();
        if (picked.entryType === 'OFFICIAL' && picked.recipe && this.onShowRecipeDetail) {
          this.onShowRecipeDetail(picked.recipe);
        }
      };
    }

    container.querySelectorAll('[data-fridge-rec]').forEach(card => {
      card.onclick = () => {
        const rId = Number(card.getAttribute('data-fridge-rec'));
        const rec = this.recipeBook.getRecipe(rId);
        if (rec && this.onShowRecipeDetail) {
          this.audio.playTap();
          this.onShowRecipeDetail(rec);
        }
      };
    });
  }
}

window.KSool.FridgeRecommenderView = FridgeRecommenderView;
