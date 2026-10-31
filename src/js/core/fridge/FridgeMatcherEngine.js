window.KSool = window.KSool || {};

/**
 * 7) 내 냉장고 술 조합 추천기 & 랜덤 추첨 엔진 (FridgeMatcherEngine)
 * - 재료를 만드는 기초합성 레시피(소주, 맥주, 얼음, 탄산수, 누룩, 음료 등)는 완전히 제외하고,
 *   오직 '완성된 술 조합(주류 재료가 포함된 칵테일/꿀조합)'만을 기준으로 추천합니다.
 * - 유저가 이미 해금한 재료 및 해금한 술 조합 레시피만 대상으로 작동합니다.
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

  /**
   * 해당 레시피가 '재료를 만드는 기초합성'이 아니라
   * 실제로 마시는 '완성된 술 조합(주류 포함)'인지 판별합니다.
   */
  isRealAlcoholDrinkRecipe(recipe) {
    if (!recipe) return false;
    // 재료를 해금시키는 중간 합성 레시피나 기초합성 카테고리는 제외
    if (recipe.category === '기초합성' || recipe.unlocks_ingredient_id) {
      return false;
    }
    const reqItems = this.recipeBook.getRecipeItems(recipe.recipe_id);
    // 구성 재료 중 실제 주류(ALCOHOL: 소주, 맥주, 막걸리, 복분자주, 매실주 등)가 포함된 조합만 인정
    return reqItems.some(it => {
      const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
      return base && base.category_id === 'ALCOHOL';
    });
  }

  /**
   * 실제 술 조합에 사용되는 재료들 중 유저가 해금한 재료 목록만 반환합니다.
   * ('불', '공기', '눈', '누룩' 같은 비냉장고 기초 원소 제외)
   */
  getEligibleFridgeIngredients() {
    const usedInDrinkIds = new Set();
    for (const recipe of this.recipeBook.getAllRecipes()) {
      if (!this.isRealAlcoholDrinkRecipe(recipe)) continue;
      const items = this.recipeBook.getRecipeItems(recipe.recipe_id);
      items.forEach(it => usedInDrinkIds.add(Number(it.ingredient_id)));
    }

    return Array.from(this.recipeBook.baseIngredients.values()).filter(
      ing => usedInDrinkIds.has(Number(ing.ingredient_id)) && this.inventory.isIngredientAvailable(ing.ingredient_id)
    );
  }

  toggleIngredient(ingredientId) {
    const id = Number(ingredientId);
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
    this.getEligibleFridgeIngredients().forEach(ing => {
      this.selectedFridgeIngIds.add(Number(ing.ingredient_id));
    });
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
   * 오직 유저가 해금한 '실제 술 조합 레시피' 중에서만
   * 선택한 냉장고 재료들로 만들 수 있는 술 목록을 반환합니다. (재료 합성식 제외)
   */
  findCraftableFromFridge() {
    const unlockedAlcoholRecipes = [];

    for (const rId of this.inventory.unlockedRecipeIds) {
      const recipe = this.recipeBook.getRecipe(rId);
      if (!this.isRealAlcoholDrinkRecipe(recipe)) continue;

      const reqItems = this.recipeBook.getRecipeItems(recipe.recipe_id);
      if (reqItems.length === 0) continue;

      const canMakeWithFridge = reqItems.every(item =>
        this.isSelected(item.ingredient_id)
      );

      if (canMakeWithFridge) {
        unlockedAlcoholRecipes.push(recipe);
      }
    }

    return unlockedAlcoholRecipes;
  }

  /**
   * 가능한 해금 술 조합 목록 중에서 무작위로 1개를 뽑아줍니다.
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
