window.KSool = window.KSool || {};

/**
 * 7) 내 냉장고 술 조합 추천기 & 랜덤 추첨 엔진 (FridgeMatcherEngine)
 * - 유저가 실제 집 냉장고에 보유한 재료들을 다중 선택
 * - 스포일러 원천 방지: 오직 유저가 '이미 해금한 레시피' 중에서만
 *   선택한 냉장고 재료의 부분집합(Subset)으로 만들 수 있는 모든 레시피를 반환합니다.
 * - 랜덤 고르기(pickRandomRecipe)로 가능한 목록 중 하나를 추첨합니다.
 */
class FridgeMatcherEngine {
  constructor(recipeBook, inventoryManager) {
    this.recipeBook = recipeBook;
    this.inventory = inventoryManager;
    this.STORAGE_KEY = 'ksool_alchemy_v2_my_fridge';
    this.selectedFridgeIngIds = new Set();
  }

  init() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach(id => this.selectedFridgeIngIds.add(Number(id)));
        }
      }
    } catch (_) {}

    // 처음 실행 시 흔한 집 냉장고 기본 재료(물, 얼음, 소주, 맥주, 사이다) 기본 체크
    if (this.selectedFridgeIngIds.size === 0) {
      [101, 102, 201, 202, 606].forEach(id => this.selectedFridgeIngIds.add(id));
      this._save();
    }
  }

  toggleIngredient(ingredientId) {
    const id = Number(ingredientId);
    if (this.selectedFridgeIngIds.has(id)) {
      this.selectedFridgeIngIds.delete(id);
    } else {
      this.selectedFridgeIngIds.add(id);
    }
    this._save();
  }

  selectAll() {
    for (const id of this.recipeBook.baseIngredients.keys()) {
      this.selectedFridgeIngIds.add(Number(id));
    }
    this._save();
  }

  clearAll() {
    this.selectedFridgeIngIds.clear();
    this._save();
  }

  isSelected(ingredientId) {
    return this.selectedFridgeIngIds.has(Number(ingredientId));
  }

  /**
   * 현재 선택한 냉장고 재료들로 만들 수 있는 레시피를 탐색합니다.
   * - unlockedMatches: 유저가 이미 해금한 레시피 중 제조 가능한 목록 (화면 노출)
   * - hiddenLockedCount: 내 냉장고 재료로 만들 수 있지만 아직 미해금 상태인 레시피 수 (힌트 스포일러 방지!)
   */
  findCraftableFromFridge() {
    const unlockedMatches = [];
    let hiddenLockedCount = 0;

    const allRecipes = this.recipeBook.getAllRecipes();

    for (const recipe of allRecipes) {
      const reqItems = this.recipeBook.getRecipeItems(recipe.recipe_id);
      if (reqItems.length === 0) continue;

      // 모든 필수 재료가 내 냉장고 선택 목록에 포함되어 있는지 검사 (Subset Check)
      const canMakeWithFridge = reqItems.every(item =>
        this.selectedFridgeIngIds.has(Number(item.ingredient_id))
      );

      if (!canMakeWithFridge) continue;

      if (this.inventory.isRecipeUnlocked(recipe.recipe_id)) {
        unlockedMatches.push(recipe);
      } else {
        hiddenLockedCount += 1;
      }
    }

    return { unlockedMatches, hiddenLockedCount };
  }

  /**
   * 가능한 해금 레시피 목록 중에서 무작위로 1개를 뽑아줍니다.
   */
  pickRandomRecipe(candidates) {
    if (!candidates || candidates.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.selectedFridgeIngIds)));
    } catch (_) {}
  }
}

window.KSool.FridgeMatcherEngine = FridgeMatcherEngine;
