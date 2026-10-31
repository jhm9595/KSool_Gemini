window.KSool = window.KSool || {};

/**
 * 5-2) 비율 공개 힌트 프로바이더 (Up/Down 미니게임 & 향후 보상형 광고 어댑터)
 * - 5-1 숫자야구를 모두 맞춘 후에만 활성화됩니다.
 * - 현재는 UpDownRatioGameProvider가 동작하며(예: 정답 9일 때 4 누르면 UP, 10 누르면 DOWN),
 *   추후 광고 연동 시 RewardAdRatioProvider로 설정만 바꾸면 즉시 전환됩니다.
 */
class RatioHintProvider {
  checkRatioGuess(recipeId, slotOrder, guessedNumber) {
    throw new Error('Not implemented');
  }
}

class UpDownRatioGameProvider extends RatioHintProvider {
  constructor(recipeBook, inventoryManager) {
    super();
    this.recipeBook = recipeBook;
    this.inventory = inventoryManager;
  }

  checkRatioGuess(recipeId, slotOrder, guessedNumber) {
    const items = this.recipeBook.getRecipeItems(recipeId);
    const targetItem = items.find(it => Number(it.slot_order) === Number(slotOrder)) || items[0];
    if (!targetItem) return { status: 'ERROR' };

    const answer = Number(targetItem.ratio);
    const guess = Number(guessedNumber);

    if (guess === answer) {
      const hintState = this.inventory.getHintState(recipeId);
      hintState.solvedRatios[String(slotOrder)] = answer;
      this.inventory.save();
      return {
        status: 'CORRECT',
        answer,
        message: `🎉 정답입니다! 이 재료의 황금비율은 [${answer}] 입니다!`
      };
    } else if (guess < answer) {
      return {
        status: 'UP',
        guess,
        message: `🔼 [ ${guess} ] 보다 UP! (더 높은 숫자입니다)`
      };
    } else {
      return {
        status: 'DOWN',
        guess,
        message: `🔽 [ ${guess} ] 보다 DOWN! (더 낮은 숫자입니다)`
      };
    }
  }
}

class RewardAdRatioProvider extends RatioHintProvider {
  constructor(recipeBook, inventoryManager) {
    super();
    this.recipeBook = recipeBook;
    this.inventory = inventoryManager;
  }

  // 향후 광고 SDK 연동 시 호출될 메서드 구조
  unlockRatioByWatchingAd(recipeId, slotOrder, onComplete) {
    const items = this.recipeBook.getRecipeItems(recipeId);
    const targetItem = items.find(it => Number(it.slot_order) === Number(slotOrder));
    if (!targetItem) return;
    const hintState = this.inventory.getHintState(recipeId);
    hintState.solvedRatios[String(slotOrder)] = Number(targetItem.ratio);
    this.inventory.save();
    if (onComplete) onComplete(Number(targetItem.ratio));
  }
}

/**
 * 5-3) 외부 힌트 링크 생성기 (유튜브 타임스탬프 자동 부착 & 블로그 이동)
 */
class ExternalHintLinker {
  static buildTargetUrl(hintMeta) {
    if (!hintMeta || !hintMeta.url) return '#';
    let url = hintMeta.url;
    if (hintMeta.platform === 'YOUTUBE' && hintMeta.start_time_sec > 0) {
      const sep = url.includes('?') ? '&' : '?';
      if (!url.includes('t=')) {
        url = `${url}${sep}t=${Number(hintMeta.start_time_sec)}s`;
      }
    }
    return url;
  }

  static formatTimestamp(seconds) {
    if (!seconds || seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

window.KSool.RatioHintProvider = RatioHintProvider;
window.KSool.UpDownRatioGameProvider = UpDownRatioGameProvider;
window.KSool.RewardAdRatioProvider = RewardAdRatioProvider;
window.KSool.ExternalHintLinker = ExternalHintLinker;
