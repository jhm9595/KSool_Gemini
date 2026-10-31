window.KSool = window.KSool || {};

class InventoryManager {
  constructor(recipeBook, storageService) {
    this.recipeBook = recipeBook;
    this.storage = storageService;

    this.userLevel = 1;
    this.unlockedRecipeIds = new Set();
    this.unlockedIngredientIds = new Set();
    this.unlockedImageRecipeIds = new Set(); // 미니게임 클리어로 그림(아이콘)만 선해금된 레시피 ID 집합
    this.hintProgressByRecipe = {}; // recipeId -> { stageCleared: [bool, bool, bool], solvedRatios: { ingId: ratio } }
    this.promotedCustomRecipes = [];
    this.craftFailCount = 0; // 주조실 조합 실패 횟수 (10회 이상 시 도감·힌트 탭 오픈)
    this.shownTabIntros = {
      collection: false,
      fridge: false,
      suggestions: false
    };
    this.unlockAllSandboxMode = false; // 모든 재료 즉시 실험해보기 토글용
  }

  init() {
    this.unlockedRecipeIds.clear();
    this.unlockedIngredientIds.clear();
    this.unlockedImageRecipeIds.clear();
    this.craftFailCount = 0;
    this.shownTabIntros = {
      collection: false,
      fridge: false,
      suggestions: false
    };

    // 1. 저장된 상태 복원 (해금한 레시피 목록 기준)
    const saved = this.storage.loadState();
    if (saved) {
      if (typeof saved.userLevel === 'number') this.userLevel = saved.userLevel;
      if (Array.isArray(saved.unlockedRecipeIds)) {
        saved.unlockedRecipeIds.forEach(id => this.unlockedRecipeIds.add(Number(id)));
      }
      if (Array.isArray(saved.unlockedImageRecipeIds)) {
        saved.unlockedImageRecipeIds.forEach(id => this.unlockedImageRecipeIds.add(Number(id)));
      }
      if (saved.hintProgressByRecipe && typeof saved.hintProgressByRecipe === 'object') {
        this.hintProgressByRecipe = saved.hintProgressByRecipe;
      }
      if (Array.isArray(saved.promotedCustomRecipes)) {
        this.promotedCustomRecipes = saved.promotedCustomRecipes;
      }
      if (typeof saved.craftFailCount === 'number') {
        this.craftFailCount = saved.craftFailCount;
      }
      if (saved.shownTabIntros && typeof saved.shownTabIntros === 'object') {
        this.shownTabIntros = {
          collection: Boolean(saved.shownTabIntros.collection),
          fridge: Boolean(saved.shownTabIntros.fridge),
          suggestions: Boolean(saved.shownTabIntros.suggestions)
        };
      }
    }

    // 2. 하드코딩 없이 레시피 그래프(DAG)를 데이터 기반으로 분석하여
    //    어떤 레시피의 결과물도 아닌 '순수 리프(Leaf) 재료'를 자동으로 기본 해금 등록
    for (const [id] of this.recipeBook.baseIngredients.entries()) {
      if (this.recipeBook.isLeafIngredient(id)) {
        this.unlockedIngredientIds.add(Number(id));
      }
    }

    // 3. 실제로 해금한 레시피(unlockedRecipeIds)를 통해서만 비-리프(조합형) 재료 해금 동기화
    for (const rId of this.unlockedRecipeIds) {
      const unlockedIng = this.recipeBook.getUnlockedIngredientByRecipe(rId);
      if (unlockedIng) {
        this.unlockedIngredientIds.add(Number(unlockedIng.ingredient_id));
      }
    }

    this._recalculateLevel();
  }

  _recalculateLevel() {
    const count = this.unlockedRecipeIds.size;
    const computedLevel = Math.max(1, Math.min(5, Math.floor(count / 5) + 1));
    if (computedLevel > this.userLevel) {
      this.userLevel = computedLevel;
    }
  }

  isIngredientAvailable(ingredientId) {
    if (this.unlockAllSandboxMode) return true;
    return this.unlockedIngredientIds.has(Number(ingredientId));
  }

  isRecipeUnlocked(recipeId) {
    return this.unlockedRecipeIds.has(Number(recipeId));
  }

  isRecipeImageUnlocked(recipeId) {
    const rId = Number(recipeId);
    return this.unlockedRecipeIds.has(rId) || this.unlockedImageRecipeIds.has(rId);
  }

  unlockRecipeImage(recipeId) {
    const rId = Number(recipeId);
    const isNew = !this.unlockedImageRecipeIds.has(rId);
    this.unlockedImageRecipeIds.add(rId);
    this.save();
    return isNew;
  }

  isRecipeChallengeable(recipe) {
    if (!recipe) return false;
    // 해당 레시피를 구성하는 하위 재료들이 현재 주조실에서 모두 사용 가능(해금)한 상태여야 지금 당장 조합/힌트 도전 가능!
    const reqItems = this.recipeBook.getRecipeItems(recipe.recipe_id);
    if (!reqItems || reqItems.length === 0) return false;
    return reqItems.every(it => {
      if (!this.isIngredientAvailable(it.ingredient_id)) return false;
      if (it.detail_ingredient_id && !this.unlockAllSandboxMode) {
        const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
        if (det && this.userLevel < (det.required_user_level || 1)) return false;
      }
      return true;
    });
  }

  unlockRecipe(recipeId) {
    const rId = Number(recipeId);
    const isNew = !this.unlockedRecipeIds.has(rId);
    this.unlockedRecipeIds.add(rId);

    const unlockedIng = this.recipeBook.getUnlockedIngredientByRecipe(rId);
    let newlyUnlockedIngredient = null;

    if (unlockedIng) {
      const ingId = Number(unlockedIng.ingredient_id);
      if (!this.unlockedIngredientIds.has(ingId)) {
        this.unlockedIngredientIds.add(ingId);
        newlyUnlockedIngredient = unlockedIng;
      }
    }

    this._recalculateLevel();
    this.save();

    return { isNew, newlyUnlockedIngredient };
  }

  getHintState(recipeId) {
    const key = String(recipeId);
    if (!this.hintProgressByRecipe[key]) {
      this.hintProgressByRecipe[key] = {
        stageCleared: [false, false, false],
        solvedRatios: {},
        history: []
      };
    }
    return this.hintProgressByRecipe[key];
  }

  recordCraftFailure() {
    this.craftFailCount = (this.craftFailCount || 0) + 1;
    this.save();
    return this.craftFailCount;
  }

  getUnlockProgressRatio() {
    const total = this.recipeBook.getAllRecipes().length;
    if (total === 0) return 0;
    return this.unlockedRecipeIds.size / total;
  }

  isCollectionTabUnlocked() {
    return Boolean(this.unlockAllSandboxMode || this.craftFailCount >= 10 || this.shownTabIntros.collection);
  }

  isFridgeTabUnlocked() {
    return Boolean(this.unlockAllSandboxMode || this.getUnlockProgressRatio() >= 0.5 || this.shownTabIntros.fridge);
  }

  isSuggestionTabUnlocked() {
    const total = this.recipeBook.getAllRecipes().length;
    return Boolean(
      this.unlockAllSandboxMode ||
      (total > 0 && this.unlockedRecipeIds.size >= total) ||
      this.shownTabIntros.suggestions
    );
  }

  isTabUnlocked(tabKey) {
    if (tabKey === 'brew') return true;
    if (tabKey === 'collection') return this.isCollectionTabUnlocked();
    if (tabKey === 'fridge') return this.isFridgeTabUnlocked();
    if (tabKey === 'suggestions') return this.isSuggestionTabUnlocked();
    return false;
  }

  save() {
    this.storage.saveState({
      userLevel: this.userLevel,
      unlockedRecipeIds: Array.from(this.unlockedRecipeIds),
      unlockedIngredientIds: Array.from(this.unlockedIngredientIds),
      unlockedImageRecipeIds: Array.from(this.unlockedImageRecipeIds),
      hintProgressByRecipe: this.hintProgressByRecipe,
      promotedCustomRecipes: this.promotedCustomRecipes,
      craftFailCount: this.craftFailCount,
      shownTabIntros: this.shownTabIntros
    });
  }
}

window.KSool.InventoryManager = InventoryManager;
