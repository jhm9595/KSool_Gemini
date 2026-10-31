window.KSool = window.KSool || {};

/**
 * 7) 내 냉장고 술 조합 추천기 & 랜덤 추첨 엔진 (FridgeMatcherEngine)
 * - 유저가 이미 해금한 재료(isIngredientAvailable)만 냉장고에서 선택 가능
 * - 미해금 레시피 카운트 등 일체의 힌트성 정보를 제공하지 않고,
 *   오직 '내가 해금한 레시피'만을 기준으로 가능한 조합을 필터링합니다.
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
          arr.forEach(id => {
            if (this.inventory.isIngredientAvailable(Number(id))) {
              this.selectedFridgeIngIds.add(Number(id));
            }
          });
        }
      }
    } catch (_) {}
  }

  toggleIngredient(ingredientId) {
    const id = Number(ingredientId);
    // 해금하지 않은 재료는 절대 선택 불가
    if (!this.inventory.isIngredientAvailable(id)) return false;

    if (this.selectedFridgeIngIds.has(id)) {
      this.selectedFridgeIngIds.delete(id);
    } else {
      this.selectedFridgeIngIds.add(id);
    }
    this._save();
    return true;
  }

  selectAllUnlocked() {
    for (const id of this.recipeBook.baseIngredients.keys()) {
      if (this.inventory.isIngredientAvailable(id)) {
        this.selectedFridgeIngIds.add(Number(id));
      }
    }
    this._save();
  }

  clearAll() {
    this.selectedFridgeIngIds.clear();
    this._save();
  }

  isSelected(ingredientId) {
    const id = Number(ingredientId);
    return this.inventory.isIngredientAvailable(id) && this.selectedFridgeIngIds.has(id);
  }

  /**
   * 오직 유저가 이미 해금한 레시피들 중에서만
   * 선택한 해금 재료들로 만들 수 있는 레시피 목록을 반환합니다. (힌트 악용 원천 차단)
   */
  findCraftableFromFridge() {
    const unlockedMatches = [];

    for (const rId of this.inventory.unlockedRecipeIds) {
      const recipe = this.recipeBook.getRecipe(rId);
      if (!recipe) continue;

      const reqItems = this.recipeBook.getRecipeItems(recipe.recipe_id);
      if (reqItems.length === 0) continue;

      const canMakeWithFridge = reqItems.every(item =>
        this.isSelected(item.ingredient_id)
      );

      if (canMakeWithFridge) {
        unlockedMatches.push(recipe);
      }
    }

    return unlockedMatches;
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
