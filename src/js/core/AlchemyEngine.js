window.KSool = window.KSool || {};

class AlchemyEngine {
  constructor({ config, recipeBook, craftingPot, inventory, feedbackStrategy, audio }) {
    this.config = config;
    this.recipeBook = recipeBook;
    this.craftingPot = craftingPot;
    this.inventory = inventory;
    this.feedbackStrategy = feedbackStrategy;
    this.audio = audio;
  }

  executeCraft() {
    const slots = this.craftingPot.getSlots();
    if (slots.length < 2) {
      return { ok: false, message: '재료를 최소 2종류 이상 넣어주세요.' };
    }

    const matchedRecipe = this.recipeBook.matchRecipe(slots, this.inventory.unlockedRecipeIds);

    if (matchedRecipe) {
      this.audio.playSuccess();
      const unlockInfo = this.inventory.unlockRecipe(matchedRecipe.recipe_id);
      const usedSlots = [...slots];
      this.craftingPot.clear();
      return {
        ok: true,
        isSuccess: true,
        recipe: matchedRecipe,
        isNewDiscovery: unlockInfo.isNew,
        newlyUnlockedIngredient: unlockInfo.newlyUnlockedIngredient,
        usedSlots
      };
    } else {
      this.audio.playFail();
      // 요구사항 5: 실패 시 힌트 피드백은 구조만 두고 현재 NullFeedbackStrategy가 null 반환
      const optionalFeedback = this.feedbackStrategy
        ? this.feedbackStrategy.getFailFeedback(slots, this.recipeBook)
        : null;
      const usedSlots = [...slots];
      this.craftingPot.clear();
      return {
        ok: true,
        isSuccess: false,
        optionalFeedback,
        usedSlots
      };
    }
  }
}

window.KSool.AlchemyEngine = AlchemyEngine;
