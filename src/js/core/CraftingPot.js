window.KSool = window.KSool || {};

class CraftingPot {
  constructor(gameConfig) {
    this.config = gameConfig;
    /** @type {Array<{baseId: number, detailId: number|null, count: number}>} */
    this.slots = [];
  }

  getTotalCount() {
    return this.slots.reduce((sum, s) => sum + s.count, 0);
  }

  /**
   * 재료를 탭했을 때 호출 (Tap-to-Stack)
   * - 이미 같은 재료(대표+상세 조합)가 슬롯에 있으면 우측 하단 count + 1
   * - 없으면 새 슬롯에 count = 1로 추가
   * - 모든 재료 총합은 maxTotalCount(10) 이하로 제한
   */
  tapIngredient(baseId, detailId = null) {
    const total = this.getTotalCount();
    if (total >= this.config.maxTotalCount) {
      return {
        ok: false,
        reason: 'MAX_TOTAL_REACHED',
        message: `재료 총 개수 합계는 최대 ${this.config.maxTotalCount}개까지만 넣을 수 있습니다!`
      };
    }

    const existing = this.slots.find(
      s => s.baseId === Number(baseId) && (s.detailId || null) === (detailId ? Number(detailId) : null)
    );

    if (existing) {
      existing.count += 1;
      return { ok: true, action: 'INCREMENTED', slot: existing };
    }

    const maxSlots = this.config.getEffectiveMaxSlots();
    if (this.slots.length >= maxSlots) {
      return {
        ok: false,
        reason: 'MAX_SLOTS_REACHED',
        message: `현재 조합칸은 최대 ${maxSlots}종류까지 올릴 수 있습니다. (상단에서 슬롯 확장 가능)`
      };
    }

    const newSlot = {
      baseId: Number(baseId),
      detailId: detailId ? Number(detailId) : null,
      count: 1
    };
    this.slots.push(newSlot);
    return { ok: true, action: 'ADDED', slot: newSlot };
  }

  decrementSlot(index) {
    if (index < 0 || index >= this.slots.length) return;
    this.slots[index].count -= 1;
    if (this.slots[index].count <= 0) {
      this.slots.splice(index, 1);
    }
  }

  removeSlot(index) {
    if (index < 0 || index >= this.slots.length) return;
    this.slots.splice(index, 1);
  }

  clear() {
    this.slots = [];
  }

  getSlots() {
    return [...this.slots];
  }
}

window.KSool.CraftingPot = CraftingPot;
