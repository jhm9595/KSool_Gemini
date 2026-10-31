window.KSool = window.KSool || {};

class KSoolApp {
  constructor() {
    this.config = new window.KSool.GameConfig();
    this.brandResolver = new window.KSool.BrandResolver(this.config);
    this.audio = new window.KSool.AudioService();
    this.storage = new window.KSool.StorageService();
    this.recipeBook = new window.KSool.RecipeBook();
    this.craftingPot = new window.KSool.CraftingPot(this.config);
    this.inventory = new window.KSool.InventoryManager(this.recipeBook, this.storage);
    this.feedbackStrategy = new window.KSool.NullFeedbackStrategy();

    this.baseballEngine = new window.KSool.BaseballHintEngine(this.recipeBook, this.inventory);
    this.ratioProvider = new window.KSool.UpDownRatioGameProvider(this.recipeBook, this.inventory);
    this.pickerRegistry = new window.KSool.DetailPickerRegistry(this.brandResolver, this.inventory, this.audio);
    this.suggestionService = new window.KSool.SuggestionService(this.recipeBook, this.inventory, this.brandResolver);
    this.fridgeEngine = new window.KSool.FridgeMatcherEngine(this.recipeBook, this.inventory, this.suggestionService);

    this.alchemyEngine = new window.KSool.AlchemyEngine({
      config: this.config,
      recipeBook: this.recipeBook,
      craftingPot: this.craftingPot,
      inventory: this.inventory,
      feedbackStrategy: this.feedbackStrategy,
      audio: this.audio
    });

    this.hintModalView = new window.KSool.HintModalView({
      recipeBook: this.recipeBook,
      inventory: this.inventory,
      baseballEngine: this.baseballEngine,
      ratioProvider: this.ratioProvider,
      brandResolver: this.brandResolver,
      audio: this.audio
    });

    this.suggestionBoardView = new window.KSool.SuggestionBoardView({
      config: this.config,
      recipeBook: this.recipeBook,
      craftingPot: this.craftingPot,
      suggestionService: this.suggestionService,
      brandResolver: this.brandResolver,
      audio: this.audio,
      onRecipePromoted: (newRecipe) => {
        this.renderHeader();
        this.renderCollectionView();
        this.fridgeRecommenderView.render();
        this.showCraftResultModal({
          isSuccess: true,
          recipe: newRecipe,
          isNewDiscovery: true,
          newlyUnlockedIngredient: null
        });
      }
    });

    this.fridgeRecommenderView = new window.KSool.FridgeRecommenderView({
      recipeBook: this.recipeBook,
      inventory: this.inventory,
      fridgeEngine: this.fridgeEngine,
      brandResolver: this.brandResolver,
      audio: this.audio,
      onShowRecipeDetail: (recipe) => {
        this.showCraftResultModal({
          isSuccess: true,
          recipe,
          isNewDiscovery: false,
          newlyUnlockedIngredient: null
        });
      }
    });

    this.currentTab = 'brew';
    this.selectedIngCategory = 'NATURE';
    this.selectedRecipeCategory = '전체';
  }

  async init() {
    const bundleData = await this._loadHybridData();
    // 1. 먼저 RecipeBook에 마스터 데이터를 로드해야 스타터(기초) 재료들을 인식할 수 있음
    this.recipeBook.load(bundleData, []);
    // 2. InventoryManager 초기화 (모든 리프 기초 재료 강제 해금 보장)
    this.inventory.init();
    if (this.inventory.promotedCustomRecipes.length > 0) {
      this.recipeBook.load(bundleData, this.inventory.promotedCustomRecipes);
    }
    this.inventory.save();
    this.suggestionService.init();
    this.fridgeEngine.init();

    this._bindGlobalEvents();
    this.renderAll();
  }

  /**
   * 온라인/웹서버일 경우 data/*.json을 비동기 로드하고,
   * 오프라인이나 file:// 직접 실행 시 내장 SeedDataBundle로 즉시 폴백합니다.
   */
  async _loadHybridData() {
    if (window.location.protocol === 'file:') {
      return window.KSool.SeedDataBundle;
    }
    try {
      const [categories, ingredients_base, ingredients_detail, recipes, recipe_ingredients, external_hints] =
        await Promise.all([
          fetch('./data/categories.json').then(r => r.json()),
          fetch('./data/ingredients_base.json').then(r => r.json()),
          fetch('./data/ingredients_detail.json').then(r => r.json()),
          fetch('./data/recipes.json').then(r => r.json()),
          fetch('./data/recipe_ingredients.json').then(r => r.json()),
          fetch('./data/external_hints.json').then(r => r.json())
        ]);
      return { categories, ingredients_base, ingredients_detail, recipes, recipe_ingredients, external_hints };
    } catch (_) {
      return window.KSool.SeedDataBundle;
    }
  }

  renderAll() {
    this.renderHeader();
    this.renderBrewView();
    this.renderCollectionView();
    this.fridgeRecommenderView.render();
    this.suggestionBoardView.render();
  }

  renderHeader() {
    const totalRecipes = this.recipeBook.getAllRecipes().length;
    const unlockedCount = this.inventory.unlockedRecipeIds.size;

    document.getElementById('unlocked-count').textContent = `${unlockedCount} / ${totalRecipes}`;
    const levelPill = document.getElementById('user-level-pill');
    if (levelPill) {
      levelPill.textContent = `Lv.${this.inventory.userLevel} 주모`;
    }

    const licenseBtn = document.getElementById('toggle-license-btn');
    if (licenseBtn) {
      licenseBtn.classList.toggle('active', this.config.globalLicenseOverride);
      licenseBtn.textContent = this.config.globalLicenseOverride
        ? '🏷️ 실제명(제휴)'
        : '🎭 패러디명';
    }

    const slotBtn = document.getElementById('toggle-slots-btn');
    if (slotBtn) {
      slotBtn.classList.toggle('active', this.config.unlimitedSlotsMode);
      slotBtn.textContent = this.config.unlimitedSlotsMode
        ? '♾️ 무제한슬롯'
        : `📦 슬롯:${this.config.maxUniqueSlots}칸`;
    }

    const sandboxBtn = document.getElementById('toggle-sandbox-btn');
    if (sandboxBtn) {
      sandboxBtn.classList.toggle('active', this.inventory.unlockAllSandboxMode);
      sandboxBtn.textContent = this.inventory.unlockAllSandboxMode
        ? '🔓 전체해금중'
        : '🌱 연쇄해금';
    }
  }

  renderBrewView() {
    this._renderPotSlots();
    this._renderIngredientCategoryChips();
    this._renderIngredientsGrid();
  }

  _renderPotSlots() {
    const slotsGrid = document.getElementById('pot-slots-grid');
    const countPill = document.getElementById('total-count-pill');
    const mixBtn = document.getElementById('mix-btn');
    if (!slotsGrid) return;

    const slots = this.craftingPot.getSlots();
    const totalCount = this.craftingPot.getTotalCount();
    const maxCount = this.config.maxTotalCount;

    countPill.textContent = `총 투입 개수: ${totalCount} / ${maxCount}개`;
    countPill.classList.toggle('full', totalCount >= maxCount);
    slotsGrid.classList.toggle('has-items', slots.length > 0);
    mixBtn.disabled = slots.length < 2;

    // 기본적으로 최소 4칸을 보여주되, 4칸 이상 담기면 동적으로 계속 늘어남
    const displaySlotCount = Math.max(this.config.maxUniqueSlots, slots.length + (this.config.unlimitedSlotsMode ? 1 : 0));

    const html = [];
    for (let i = 0; i < displaySlotCount; i++) {
      const slot = slots[i];
      if (slot) {
        const baseIng = this.recipeBook.getBaseIngredient(slot.baseId);
        const detIng = this.recipeBook.getDetailIngredient(slot.detailId);
        const target = detIng || baseIng;
        const name = this.brandResolver.resolveName(target);
        const detailBadge = detIng ? `<span class="slot-detail-tag">특산</span>` : '';

        html.push(`
          <div class="pot-slot filled" data-pot-slot-idx="${i}" title="클릭하면 개수가 1 줄어듭니다">
            ${detailBadge}
            <span class="slot-emoji">${target ? target.emoji : '🍶'}</span>
            <span class="slot-name">${name}</span>
            <span class="slot-count-badge">${slot.count}</span>
          </div>
        `);
      } else {
        html.push(`
          <div class="pot-slot empty">
            <span style="font-size:1.1rem; opacity:0.35;">➕</span>
            <span style="font-size:0.62rem;">빈 슬롯 ${i + 1}</span>
          </div>
        `);
      }
    }

    slotsGrid.innerHTML = html.join('');

    slotsGrid.querySelectorAll('[data-pot-slot-idx]').forEach(el => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-pot-slot-idx'));
        this.craftingPot.decrementSlot(idx);
        this.audio.playTap();
        this._renderPotSlots();
        this._renderIngredientsGrid();
        this.suggestionBoardView.render();
      };
    });
  }

  _renderIngredientCategoryChips() {
    const bar = document.getElementById('ing-cat-bar');
    if (!bar) return;

    const allBase = Array.from(this.recipeBook.baseIngredients.values());

    // 해금된 재료가 1개 이상 존재하는 재료 유형(Category)만 노출 (미해금 재료 유형 탭 자체 숨김)
    const visibleCategories = this.recipeBook.categories.filter(c =>
      allBase.some(ing => ing.category_id === c.category_id && this.inventory.isIngredientAvailable(ing.ingredient_id))
    );

    if (
      this.selectedIngCategory !== 'ALL' &&
      !visibleCategories.some(c => c.category_id === this.selectedIngCategory) &&
      visibleCategories.length > 0
    ) {
      this.selectedIngCategory = visibleCategories[0].category_id;
    }

    const catChips = visibleCategories.map(c => `
      <button class="cat-chip ${this.selectedIngCategory === c.category_id ? 'active' : ''}" data-ing-cat="${c.category_id}">
        ${c.emoji} ${c.name}
      </button>
    `).join('');

    // '전체 재료' 탭은 제일 마지막 탭으로 배치
    const allChip = `<button class="cat-chip ${this.selectedIngCategory === 'ALL' ? 'active' : ''}" data-ing-cat="ALL">📦 전체 재료</button>`;

    bar.innerHTML = catChips + allChip;
    bar.querySelectorAll('[data-ing-cat]').forEach(btn => {
      btn.onclick = () => {
        this.selectedIngCategory = btn.getAttribute('data-ing-cat');
        this.audio.playTap();
        this._renderIngredientCategoryChips();
        this._renderIngredientsGrid();
      };
    });
  }

  _renderIngredientsGrid() {
    const grid = document.getElementById('ingredients-grid');
    if (!grid) return;

    // 미해금된 재료는 화면에 아예 보이지 않도록 필터링
    const unlockedBase = Array.from(this.recipeBook.baseIngredients.values()).filter(ing =>
      this.inventory.isIngredientAvailable(ing.ingredient_id)
    );

    const filtered = this.selectedIngCategory === 'ALL'
      ? unlockedBase
      : unlockedBase.filter(i => i.category_id === this.selectedIngCategory);

    filtered.sort((a, b) => a.ingredient_id - b.ingredient_id);

    const potSlots = this.craftingPot.getSlots();

    grid.innerHTML = filtered.map(ing => {
      const inPotCount = potSlots
        .filter(s => s.baseId === ing.ingredient_id)
        .reduce((acc, s) => acc + s.count, 0);
      const details = this.recipeBook.getDetailsForBase(ing.ingredient_id);
      const hasCustomPicker = details.length > 0 && ing.picker_component && ing.picker_component !== 'NONE';

      let pickerLabel = '';
      if (hasCustomPicker) {
        if (ing.picker_component === 'KOREA_MAP_PICKER') pickerLabel = '🗺️팔도지도';
        else if (ing.picker_component === 'SOJU_BRAND_PICKER') pickerLabel = '🍾브랜드';
        else if (ing.picker_component === 'BEER_TAP_PICKER') pickerLabel = '🍺브루어리';
        else pickerLabel = '✨상세';
      }

      const name = this.brandResolver.resolveName(ing);

      return `
        <div class="ing-card ${inPotCount > 0 ? 'in-pot' : ''}"
             data-base-ing-id="${ing.ingredient_id}">
          ${pickerLabel ? `<span class="ing-picker-indicator">${pickerLabel}</span>` : ''}
          <span class="ing-emoji">${ing.emoji}</span>
          <span class="ing-name">${name}</span>
          ${inPotCount > 0 ? `<span class="slot-count-badge">${inPotCount}</span>` : ''}
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-base-ing-id]').forEach(card => {
      card.onclick = () => {
        const baseId = Number(card.getAttribute('data-base-ing-id'));
        const baseIng = this.recipeBook.getBaseIngredient(baseId);
        const details = this.recipeBook.getDetailsForBase(baseId);

        if (details.length > 0 && baseIng.picker_component && baseIng.picker_component !== 'NONE') {
          this.audio.playTap();
          this.openDetailPickerModal(baseIng, details);
        } else {
          this._addIngredientToPot(baseId, null);
        }
      };
    });
  }

  _addIngredientToPot(baseId, detailId = null) {
    const res = this.craftingPot.tapIngredient(baseId, detailId);
    if (!res.ok) {
      this.audio.playFail();
      alert(res.message);
      return;
    }
    this.audio.playTap();
    this._renderPotSlots();
    this._renderIngredientsGrid();
    this.suggestionBoardView.render();
  }

  /**
   * 대표 재료 클릭 시 전용 상세 선택 모달 오픈 (팔도 지도 / 소주 쇼케이스 등)
   */
  openDetailPickerModal(baseIng, details) {
    const modal = document.getElementById('detail-picker-modal');
    const content = document.getElementById('detail-picker-content');
    const picker = this.pickerRegistry.getPicker(baseIng.picker_component);

    content.innerHTML = picker.render(baseIng, details);
    modal.classList.add('active');

    const closeBtn = content.querySelector('#picker-close-btn');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

    const defaultBtn = content.querySelector('#picker-select-default');
    if (defaultBtn) {
      defaultBtn.onclick = () => {
        modal.classList.remove('active');
        this._addIngredientToPot(baseIng.ingredient_id, null);
      };
    }

    content.querySelectorAll('[data-detail-id]').forEach(el => {
      el.onclick = () => {
        const isLocked = el.getAttribute('data-locked') === 'true';
        const detId = Number(el.getAttribute('data-detail-id'));
        const det = this.recipeBook.getDetailIngredient(detId);
        if (isLocked) {
          this.audio.playFail();
          alert(`이 특산 상세 재료는 주모 레벨 Lv.${det.required_user_level} 이상부터 선택할 수 있습니다! (상단 Lv 배지를 눌러 레벨업 테스트 가능)`);
          return;
        }
        modal.classList.remove('active');
        this._addIngredientToPot(baseIng.ingredient_id, detId);
      };
    });
  }

  renderCollectionView() {
    const filterBar = document.getElementById('recipe-cat-bar');
    const grid = document.getElementById('sool-grid');
    if (!filterBar || !grid) return;

    const allRecipes = this.recipeBook.getAllRecipes();
    const categories = ['전체', '기초합성', '소맥/폭탄주', '과일/편의점주', '막걸리꿀조합', '특산명주', '유저추천꿀조합'];

    filterBar.innerHTML = categories.map(cat => `
      <button class="cat-chip ${this.selectedRecipeCategory === cat ? 'active' : ''}" data-rec-cat="${cat}">
        ${cat}
      </button>
    `).join('');

    filterBar.querySelectorAll('[data-rec-cat]').forEach(btn => {
      btn.onclick = () => {
        this.selectedRecipeCategory = btn.getAttribute('data-rec-cat');
        this.audio.playTap();
        this.renderCollectionView();
      };
    });

    const filtered = this.selectedRecipeCategory === '전체'
      ? allRecipes
      : allRecipes.filter(r => r.category === this.selectedRecipeCategory);

    grid.innerHTML = filtered.map(rec => {
      const isUnlocked = this.inventory.isRecipeUnlocked(rec.recipe_id);
      const isChallengeable = this.inventory.isRecipeChallengeable(rec);
      const hintState = this.inventory.getHintState(rec.recipe_id);
      const clearedCount = hintState.stageCleared.filter(Boolean).length;

      let cardStateClass = 'level-locked';
      let statusLabel = `🔒 Lv.${rec.required_level || 1} 필요`;
      if (isUnlocked) {
        cardStateClass = 'unlocked';
        statusLabel = `✅ 해금 완료`;
      } else if (isChallengeable) {
        cardStateClass = 'challengeable';
        statusLabel = clearedCount > 0 ? `⚾ 힌트 ${clearedCount}단계 성공` : `🕵️ 힌트 추리 가능`;
      }

      const displayName = isUnlocked
        ? this.brandResolver.resolveName(rec)
        : (isChallengeable ? `미지의 ${rec.category}` : '잠긴 비전서');

      return `
        <div class="sool-card ${cardStateClass}" data-recipe-card="${rec.recipe_id}">
          <span class="diff-badge diff-${rec.difficulty}">${rec.difficulty}</span>
          <span class="sool-emoji">${isUnlocked ? rec.emoji : (isChallengeable ? '❓' : '🔒')}</span>
          <span class="sool-name">${displayName}</span>
          <span class="sool-hint-status">${statusLabel}</span>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-recipe-card]').forEach(card => {
      card.onclick = () => {
        const rId = Number(card.getAttribute('data-recipe-card'));
        const rec = this.recipeBook.getRecipe(rId);
        const isUnlocked = this.inventory.isRecipeUnlocked(rId);
        const isChallengeable = this.inventory.isRecipeChallengeable(rec);

        if (isUnlocked) {
          this.audio.playTap();
          this.showCraftResultModal({ isSuccess: true, recipe: rec, isNewDiscovery: false });
        } else if (isChallengeable) {
          this.audio.playTap();
          this.hintModalView.open(rId);
        } else {
          this.audio.playFail();
          alert(`이 레시피는 Lv.${rec.required_level}부터 힌트 추리 및 해금 도전을 할 수 있습니다!\n(더 많은 술을 해금하거나 상단 Lv 배지를 눌러 레벨을 올려보세요.)`);
        }
      };
    });
  }

  showCraftResultModal(result) {
    const modal = document.getElementById('result-modal');
    const content = document.getElementById('result-modal-content');
    if (!modal || !content) return;

    if (result.isSuccess && result.recipe) {
      const rec = result.recipe;
      const items = this.recipeBook.getRecipeItems(rec.recipe_id);
      const recipeFormula = items.map(it => {
        const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
        const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
        const target = det || base;
        return `${target.emoji}${this.brandResolver.resolveName(target)}(${it.ratio})`;
      }).join(' + ');

      const chainUnlockBanner = result.newlyUnlockedIngredient
        ? `<div style="background:rgba(16,185,129,0.18); border:1px solid #10b981; border-radius:10px; padding:8px; font-size:0.78rem; color:#6ee7b7; font-weight:800; text-align:center;">
             🔓 연쇄 크래프팅 재료 해금! 이제 주조실에서 [${result.newlyUnlockedIngredient.emoji} ${this.brandResolver.resolveName(result.newlyUnlockedIngredient)}] 재료를 사용할 수 있습니다!
           </div>`
        : '';

      content.innerHTML = `
        <div style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px;">
          <span class="diff-badge diff-${rec.difficulty}" style="position:static; font-size:0.7rem; padding:3px 9px;">
            ${rec.category} · ${rec.difficulty}
          </span>
          <div style="font-size:3.4rem;">${rec.emoji}</div>
          <div style="font-size:1.25rem; font-weight:900; color:#f8fafc;">
            ${this.brandResolver.resolveName(rec)}
          </div>
          <div style="font-size:0.82rem; color:#cbd5e1; line-height:1.5;">
            ${rec.description}
          </div>
          <div style="width:100%; background:#0f172a; border:1px solid #334155; border-radius:10px; padding:10px; font-size:0.78rem; color:#fcd34d; font-weight:800;">
            황금비율 레시피: ${recipeFormula}
          </div>
          ${chainUnlockBanner}
          <button class="mix-btn" id="result-close-btn" style="width:100%; margin-top:4px;">확인</button>
        </div>
      `;
    } else {
      const triedStr = (result.usedSlots || []).map(s => {
        const det = this.recipeBook.getDetailIngredient(s.detailId);
        const base = this.recipeBook.getBaseIngredient(s.baseId);
        const target = det || base;
        return `${target.emoji}${this.brandResolver.resolveName(target)}(${s.count})`;
      }).join(' + ');

      content.innerHTML = `
        <div style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div style="font-size:3.2rem;">🧪</div>
          <div style="font-size:1.15rem; font-weight:900; color:#fca5a5;">괴식 폭탄주 (조합 실패)</div>
          <div style="font-size:0.8rem; color:#94a3b8; line-height:1.45;">
            비율이나 재료 조합이 맞지 않습니다! 도감에서 미해금 술을 눌러 숫자야구 & Up/Down 힌트를 확인해보세요.
          </div>
          <div style="width:100%; background:#0f172a; border:1px solid #334155; border-radius:10px; padding:10px; font-size:0.75rem; color:#cbd5e1;">
            시도한 조합: ${triedStr}
          </div>
          <button class="mix-btn" id="result-close-btn" style="width:100%;">다시 도전하기</button>
        </div>
      `;
    }

    modal.classList.add('active');
    const closeBtn = content.querySelector('#result-close-btn');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
  }

  _bindGlobalEvents() {
    // 탭 전환
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.onclick = () => {
        const target = btn.getAttribute('data-tab-target');
        this.currentTab = target;
        this.audio.playTap();

        document.querySelectorAll('[data-tab-target]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-tab-target') === target);
        });
        document.querySelectorAll('.view').forEach(v => {
          v.classList.toggle('active', v.id === `view-${target}`);
        });

        this.renderAll();
      };
    });

    // 술 빚기 실행
    const mixBtn = document.getElementById('mix-btn');
    if (mixBtn) {
      mixBtn.onclick = () => {
        const res = this.alchemyEngine.executeCraft();
        if (!res.ok) {
          alert(res.message);
          return;
        }
        this.renderAll();
        this.showCraftResultModal(res);
      };
    }

    // 조합칸 비우기
    const clearBtn = document.getElementById('clear-pot-btn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        this.craftingPot.clear();
        this.audio.playTap();
        this.renderBrewView();
        this.suggestionBoardView.render();
      };
    }

    // 상단 토글 1: 패러디 가짜명 <-> 실제 상표명 전환
    const licenseBtn = document.getElementById('toggle-license-btn');
    if (licenseBtn) {
      licenseBtn.onclick = () => {
        this.config.globalLicenseOverride = !this.config.globalLicenseOverride;
        this.audio.playTap();
        this.renderAll();
      };
    }

    // 상단 토글 2: 슬롯 4칸 <-> 무제한 확장
    const slotBtn = document.getElementById('toggle-slots-btn');
    if (slotBtn) {
      slotBtn.onclick = () => {
        this.config.unlimitedSlotsMode = !this.config.unlimitedSlotsMode;
        this.audio.playTap();
        this.renderAll();
      };
    }

    // 상단 토글 3: 연쇄 해금 <-> 전체 재료 열기
    const sandboxBtn = document.getElementById('toggle-sandbox-btn');
    if (sandboxBtn) {
      sandboxBtn.onclick = () => {
        this.inventory.unlockAllSandboxMode = !this.inventory.unlockAllSandboxMode;
        this.audio.playTap();
        this.renderAll();
      };
    }

    // 상단 4: 진행도 초기화 버튼
    const resetBtn = document.getElementById('reset-progress-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('모든 해금 기록을 초기 상태로 리셋할까요?')) {
          this.storage.clearState();
          this.craftingPot.clear();
          this.inventory.unlockAllSandboxMode = false;
          this.inventory.userLevel = 1;
          this.inventory.hintProgressByRecipe = {};
          this.inventory.promotedCustomRecipes = [];
          this.inventory.init();
          this.inventory.save();
          this.fridgeEngine.clearAll();
          this.selectedIngCategory = 'NATURE';
          this.audio.playTap();
          this.renderAll();
        }
      };
    }

    // 레벨 배지 클릭 시 테스트용 레벨 변경 (Lv.1 -> Lv.5 순환)
    const levelPill = document.getElementById('user-level-pill');
    if (levelPill) {
      levelPill.onclick = () => {
        this.inventory.userLevel = (this.inventory.userLevel % 5) + 1;
        this.inventory.save();
        this.audio.playTap();
        this.renderAll();
      };
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new KSoolApp();
  window.ksoolApp = app;
  app.init();
});
