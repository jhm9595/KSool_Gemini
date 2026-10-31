window.KSool = window.KSool || {};

/**
 * 7) 내 냉장고 술 조합 추천기 & 랜덤 뽑기 뷰 (FridgeRecommenderView)
 */
class FridgeRecommenderView {
  constructor({ recipeBook, inventory, fridgeEngine, brandResolver, audio, onShowRecipeDetail }) {
    this.recipeBook = recipeBook;
    this.inventory = inventory;
    this.fridgeEngine = fridgeEngine;
    this.brandResolver = brandResolver;
    this.audio = audio;
    this.onShowRecipeDetail = onShowRecipeDetail;

    this.selectedCategory = 'ALL';
    this.lastRandomWinnerId = null;
  }

  render() {
    const container = document.getElementById('view-fridge');
    if (!container) return;

    const allBase = Array.from(this.recipeBook.baseIngredients.values());
    const filteredIngs = this.selectedCategory === 'ALL'
      ? allBase
      : allBase.filter(i => i.category_id === this.selectedCategory);

    const catChipsHtml = [
      `<button class="cat-chip ${this.selectedCategory === 'ALL' ? 'active' : ''}" data-fridge-cat="ALL">전체</button>`,
      ...this.recipeBook.categories.map(c => `
        <button class="cat-chip ${this.selectedCategory === c.category_id ? 'active' : ''}" data-fridge-cat="${c.category_id}">
          ${c.emoji} ${c.name}
        </button>
      `)
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

    const { unlockedMatches, hiddenLockedCount } = this.fridgeEngine.findCraftableFromFridge();

    const matchesHtml = unlockedMatches.length === 0
      ? `<div style="text-align:center; padding:18px 10px; font-size:0.78rem; color:#94a3b8; line-height:1.5;">
           조건에 맞는 <b>해금된 레시피</b>가 아직 없습니다.<br/>
           냉장고 재료를 더 선택하거나, 주조실에서 새로운 술을 먼저 해금해보세요!
         </div>`
      : unlockedMatches.map(rec => {
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

    const spoilerBannerHtml = hiddenLockedCount > 0
      ? `<div class="spoiler-protect-banner">
           🔒 스포일러 방지: 현재 고르신 냉장고 재료로 만들 수 있는 <b>미해금 레시피가 ${hiddenLockedCount}가지</b> 더 숨겨져 있습니다! (해금한 레시피만 공개됩니다)
         </div>`
      : '';

    container.innerHTML = `
      <div class="fridge-view-container">
        <!-- 1. 우리 집 냉장고 재료 선택 박스 -->
        <div class="fridge-box">
          <div class="fridge-box-header">
            <div class="fridge-title">
              <span>🧊 내 냉장고 재료 선택 (${this.fridgeEngine.selectedFridgeIngIds.size}개 보유중)</span>
            </div>
            <div class="fridge-quick-btns">
              <button class="fridge-mini-btn" id="fridge-select-all-btn">전체 선택</button>
              <button class="fridge-mini-btn" id="fridge-clear-all-btn">전체 해제</button>
            </div>
          </div>

          <div class="cat-filter-bar">${catChipsHtml}</div>
          <div class="fridge-ing-selector">${ingGridHtml}</div>
        </div>

        <!-- 2. 해금된 가능 레시피 목록 & 랜덤 뽑기 -->
        <div class="fridge-result-section">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.84rem; font-weight:900; color:#f8fafc;">
              🍸 지금 바로 만들 수 있는 내 도감 술 (${unlockedMatches.length}종)
            </span>
          </div>

          <button class="random-pick-btn" id="fridge-random-pick-btn" ${unlockedMatches.length === 0 ? 'disabled' : ''}>
            <span>🎲 오늘 마실 술 랜덤 고르기! (${unlockedMatches.length}종 중 추첨)</span>
          </button>

          ${spoilerBannerHtml}

          <div class="fridge-match-list">
            ${matchesHtml}
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container, unlockedMatches);
  }

  _bindEvents(container, unlockedMatches) {
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
        this.fridgeEngine.selectAll();
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
        const picked = this.fridgeEngine.pickRandomRecipe(unlockedMatches);
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
