window.KSool = window.KSool || {};

/**
 * 7) 내 냉장고 술 조합 추천기 & 랜덤 뽑기 뷰 (FridgeRecommenderView)
 * - 실제 술 조합에 쓰이는 해금된 재료만 선택 목록에 노출 ('불', '공기', '눈' 등 제외)
 * - 오직 내가 해금한 '완성 술 조합' 레시피만 결과에 표시 (소주/얼음/탄산수 등 재료 제작식 제외)
 */
class FridgeRecommenderView {
  constructor({ recipeBook, inventory, fridgeEngine, brandResolver, audio, onShowRecipeDetail }) {
    this.recipeBook = recipeBook;
    this.inventory = inventory;
    this.fridgeEngine = fridgeEngine;
    this.brandResolver = brandResolver;
    this.audio = audio;
    this.onShowRecipeDetail = onShowRecipeDetail;

    this.selectedCategory = 'ALCOHOL';
    this.lastRandomWinnerId = null;
  }

  render() {
    const container = document.getElementById('view-fridge');
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
          <span style="font-size:1.35rem;">${ing.emoji}</span>
          <span style="font-size:0.68rem; font-weight:700; color:#f1f5f9; text-align:center; word-break:keep-all;">
            ${name}
          </span>
        </div>
      `;
    }).join('');

    const unlockedAlcoholMatches = this.fridgeEngine.findCraftableFromFridge();
    const selectedCount = eligibleIngs.filter(ing => this.fridgeEngine.isSelected(ing.ingredient_id)).length;

    const matchesHtml = unlockedAlcoholMatches.length === 0
      ? `<div style="text-align:center; padding:18px 10px; font-size:0.78rem; color:#94a3b8; line-height:1.5;">
           선택한 냉장고 재료로 만들 수 있는 <b>해금된 술 조합</b>이 없습니다.<br/>
           (주조실에서 소주·맥주·막걸리 등 주류와 술 조합 레시피를 해금한 뒤 재료를 선택해보세요!)
         </div>`
      : unlockedAlcoholMatches.map(rec => {
          const items = this.recipeBook.getRecipeItems(rec.recipe_id);
          const formulaStr = items.map(it => {
            const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
            const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
            const target = det || base;
            return `${target.emoji}${this.brandResolver.resolveName(target)}(${it.ratio})`;
          }).join(' + ');

          const isWinner = this.lastRandomWinnerId === rec.recipe_id;

          return `
            <div class="fridge-recipe-card ${isWinner ? 'highlighted-winner' : ''}" data-fridge-rec="${rec.recipe_id}">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.75rem;">${rec.emoji}</span>
                <div>
                  <div style="font-size:0.84rem; font-weight:900; color:#f8fafc;">
                    ${isWinner ? '🎯 [당첨!] ' : ''}${this.brandResolver.resolveName(rec)}
                  </div>
                  <div style="font-size:0.72rem; color:#fcd34d; font-weight:700; margin-top:2px;">
                    ${formulaStr}
                  </div>
                </div>
              </div>
              <span class="diff-badge diff-${rec.difficulty}" style="position:static;">${rec.difficulty}</span>
            </div>
          `;
        }).join('');

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

        <!-- 2. 해금된 가능 술 조합 목록 & 랜덤 뽑기 -->
        <div class="fridge-result-section">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.84rem; font-weight:900; color:#f8fafc;">
              🍸 가능한 술 조합 (${unlockedAlcoholMatches.length}종 · 해금된 술 기준)
            </span>
          </div>

          <button class="random-pick-btn" id="fridge-random-pick-btn" ${unlockedAlcoholMatches.length === 0 ? 'disabled' : ''}>
            <span>🎲 오늘 마실 술 랜덤 고르기 (${unlockedAlcoholMatches.length}종 중 추첨)</span>
          </button>

          <div class="fridge-match-list">
            ${matchesHtml}
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container, unlockedAlcoholMatches);
  }

  _bindEvents(container, unlockedAlcoholMatches) {
    container.querySelectorAll('[data-fridge-cat]').forEach(btn => {
      btn.onclick = () => {
        this.selectedCategory = btn.getAttribute('data-fridge-cat');
        this.audio.playTap();
        this.render();
      };
    });

    container.querySelectorAll('[data-fridge-ing]').forEach(chip => {
      chip.onclick = () => {
        const id = Number(chip.getAttribute('data-fridge-ing'));
        this.fridgeEngine.toggleIngredient(id);
        this.lastRandomWinnerId = null;
        this.audio.playTap();
        this.render();
      };
    });

    const selectAllBtn = container.querySelector('#fridge-select-all-btn');
    if (selectAllBtn) {
      selectAllBtn.onclick = () => {
        this.fridgeEngine.selectAllUnlocked();
        this.lastRandomWinnerId = null;
        this.audio.playTap();
        this.render();
      };
    }

    const clearAllBtn = container.querySelector('#fridge-clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        this.fridgeEngine.clearAll();
        this.lastRandomWinnerId = null;
        this.audio.playTap();
        this.render();
      };
    }

    const randomBtn = container.querySelector('#fridge-random-pick-btn');
    if (randomBtn) {
      randomBtn.onclick = () => {
        const picked = this.fridgeEngine.pickRandomRecipe(unlockedAlcoholMatches);
        if (!picked) return;
        this.lastRandomWinnerId = picked.recipe_id;
        this.audio.playSuccess();
        this.render();
        if (this.onShowRecipeDetail) {
          this.onShowRecipeDetail(picked);
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
