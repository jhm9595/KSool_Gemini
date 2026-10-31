window.KSool = window.KSool || {};

class InventoryManager {
  constructor(recipeBook, storageService) {
    this.recipeBook = recipeBook;
    this.storage = storageService;

    this.userLevel = 1;
    this.unlockedRecipeIds = new Set();
    this.unlockedIngredientIds = new Set();
    this.hintProgressByRecipe = {}; // recipeId -> { stageCleared: [bool, bool, bool], solvedRatios: { ingId: ratio } }
    this.promotedCustomRecipes = [];
    this.unlockAllSandboxMode = false; // 모든 재료 즉시 실험해보기 토글용
  }

  init() {
    // 1. 기본 스타터 재료 등록
    for (const [id, ing] of this.recipeBook.baseIngredients.entries()) {
      if (ing.is_starter) {
        this.unlockedIngredientIds.add(id);
      }
    }

    // 2. 저장된 상태 복원
    const saved = this.storage.loadState();
    if (saved) {
      if (typeof saved.userLevel === 'number') this.userLevel = saved.userLevel;
      if (Array.isArray(saved.unlockedRecipeIds)) {
        saved.unlockedRecipeIds.forEach(id => this.unlockedRecipeIds.add(Number(id)));
      }
      if (Array.isArray(saved.unlockedIngredientIds)) {
        saved.unlockedIngredientIds.forEach(id => this.unlockedIngredientIds.add(Number(id)));
      }
      if (saved.hintProgressByRecipe && typeof saved.hintProgressByRecipe === 'object') {
        this.hintProgressByRecipe = saved.hintProgressByRecipe;
      }
      if (Array.isArray(saved.promotedCustomRecipes)) {
        this.promotedCustomRecipes = saved.promotedCustomRecipes;
      }
    }

    // 해금된 레시피가 해금시키는 하위 재료 동기화 보장
    for (const rId of this.unlockedRecipeIds) {
      const rec = this.recipeBook.getRecipe(rId);
      if (rec && rec.unlocks_ingredient_id) {
        this.unlockedIngredientIds.add(Number(rec.unlocks_ingredient_id));
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

  isRecipeChallengeable(recipe) {
    if (!recipe) return false;
    if (this.userLevel < (recipe.required_level || 1)) return false;
    // 해당 레시피를 구성하는 하위 대표 재료들이 모두 현재 해금되어 있어야 도전/힌트 추리 가능!
    const reqItems = this.recipeBook.getRecipeItems(recipe.recipe_id);
    if (!reqItems || reqItems.length === 0) return false;
    return reqItems.every(it => this.isIngredientAvailable(it.ingredient_id));
  }

  unlockRecipe(recipeId) {
    const rId = Number(recipeId);
    const isNew = !this.unlockedRecipeIds.has(rId);
    this.unlockedRecipeIds.add(rId);

    const recipe = this.recipeBook.getRecipe(rId);
    let newlyUnlockedIngredient = null;

    if (recipe && recipe.unlocks_ingredient_id) {
      const ingId = Number(recipe.unlocks_ingredient_id);
      if (!this.unlockedIngredientIds.has(ingId)) {
        this.unlockedIngredientIds.add(ingId);
        newlyUnlockedIngredient = this.recipeBook.getBaseIngredient(ingId);
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

  save() {
    this.storage.saveState({
      userLevel: this.userLevel,
      unlockedRecipeIds: Array.from(this.unlockedRecipeIds),
      unlockedIngredientIds: Array.from(this.unlockedIngredientIds),
      hintProgressByRecipe: this.hintProgressByRecipe,
      promotedCustomRecipes: this.promotedCustomRecipes
    });
  }
}

window.KSool.InventoryManager = InventoryManager;
