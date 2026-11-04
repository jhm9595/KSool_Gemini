window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 핵심 경영·재고·난이도·가격 산정 엔진
 *
 * [핵심 메커니즘]
 * 1. 조합물 재고 축적 (Stockpile) & 재료 재고 실시간 연동:
 *    - 조합한 결과물(중간 재료 or 최종 완성품)이 [📦재고] 탭에 1개씩 쌓입니다.
 *    - 재고에 있는 제품이 재료에도 존재하는 경우(예: 소주, 맥주, 막걸리, 아이스크림 등),
 *      재료 탭에서도 재고 수량이 배지로 함께 표시되며 서빙 시 두 군데 수량이 동시에 차감됩니다!
 * 2. 1원 단위 정밀 가격 산정 (1-Won Precision Pricing):
 *    - 기본 단가 + 총 투입 개수(sumRatio) 비례 단가 + 재료 가짓수(slotCount) 보너스
 *      + 연쇄 합성 깊이(chainDepth) 보너스 + 난이도(EASY/NORMAL/MASTER) 배율
 *      + 단골 기억 주문('늘 먹던 걸로') 프리미엄 보너스
 *      + 연속 서빙 콤보 보너스를 합산하여 1원 단위(예: 29원, 68원, 143원)로 정확히 계산합니다.
 * 3. 주막 공간 & 좌석 안내 시스템 (Tavern Seating + Queue):
 *    - 입구 대기열에 손님이 찾아오면 빈 좌석(1~4번 테이블)을 눌러 안내(또는 자동 안내)하여 앉히고 주문을 받습니다.
 * 4. 난이도 상승 알고리즘 (Infinite Progressive Scaling):
 *    - [난이도 축 1: 다중/연쇄 조합] 2재료 기초 조합 -> 3~4재료 다중 혼합 & 중간 조합 재료 필수 레시피 -> 황금비율 & 특산 명주
 *    - [난이도 축 2: 고유 단골 손님의 "늘 먹던 걸로 주세요!" (Memory Order)]
 *      유니크하지만 헷갈리는 외형(모자/안경/수염/의상)을 가진 단골 손님이
 *      초반에는 자기 시그니처 메뉴를 말해주지만, 재방문 및 고난이도 웨이브에서는
 *      "늘 먹던 걸로 주세요!"(❓단골술)라고 주문합니다.
 */
class TycoonEngine {
  constructor({ config, recipeBook, brandResolver, audio }) {
    this.config = config;
    this.recipeBook = recipeBook;
    this.brandResolver = brandResolver;
    this.audio = audio;

    this.customerPool = new window.KSool.TycoonCustomerPool(recipeBook, brandResolver);
    this.leaderboard = new window.KSool.TycoonLeaderboardService();

    this.PERSIST_KEY = 'ksool_tycoon_persistent_v1';

    // 상시 누적 통계 및 주조실에서 미리 만들어 쌓아둔 선반 재고
    this.persistentWallet = 0; // 누적 보유 자금 (원)
    this.persistentBestTimeAttack = { servedCount: 0, totalEarnings: 0, maxCombo: 0 };
    this.persistentBestInfinite = { servedCount: 0, totalEarnings: 0, maxCombo: 0, maxWave: 1 };
    this.savedBrewStash = {}; // stockKey -> count
    this.knownRegularIds = new Set(); // 한 번 이상 대면하여 도감에 기록된 단골 손님 ID

    this._loadPersistentData();

    // 현재 진행 중인 게임 세션 상태
    this.resetSession('INFINITE');
  }

  _loadPersistentData() {
    try {
      const raw = localStorage.getItem(this.PERSIST_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.persistentWallet === 'number') this.persistentWallet = parsed.persistentWallet;
      if (parsed.persistentBestTimeAttack) this.persistentBestTimeAttack = parsed.persistentBestTimeAttack;
      if (parsed.persistentBestInfinite) this.persistentBestInfinite = parsed.persistentBestInfinite;
      if (parsed.savedBrewStash && typeof parsed.savedBrewStash === 'object') {
        const cleanStash = {};
        for (const [k, cnt] of Object.entries(parsed.savedBrewStash)) {
          const baseKey = k.split('_omit_')[0];
          if (baseKey.startsWith('rec_') && Number(cnt) > 0) {
            cleanStash[baseKey] = Math.min(99, (cleanStash[baseKey] || 0) + Number(cnt));
          }
        }
        this.savedBrewStash = cleanStash;
      }
      if (Array.isArray(parsed.knownRegularIds)) {
        parsed.knownRegularIds.forEach(id => this.knownRegularIds.add(id));
      }
    } catch (_) {}
  }

  savePersistentData() {
    try {
      localStorage.setItem(this.PERSIST_KEY, JSON.stringify({
        persistentWallet: this.persistentWallet,
        persistentBestTimeAttack: this.persistentBestTimeAttack,
        persistentBestInfinite: this.persistentBestInfinite,
        savedBrewStash: this.savedBrewStash,
        knownRegularIds: Array.from(this.knownRegularIds)
      }));
    } catch (_) {}
  }

  /**
   * 일반 주조실(탭 1)에서 조합을 완성했을 때도 타이쿤 재고에 +1개씩 쌓이도록 연동!
   */
  addCraftedFromMainBrewery(recipeId) {
    const key = this.buildStockKey(recipeId);
    this.savedBrewStash[key] = Math.min(99, (this.savedBrewStash[key] || 0) + 1);
    if (this.session && this.session.stockMap) {
      const cur = this.session.stockMap.get(key) || 0;
      this.session.stockMap.set(key, cur + 1);
    }
    this.savePersistentData();
  }

  /**
   * 스톡 키 생성: `rec_{recipeId}`
   */
  buildStockKey(recipeId) {
    const rId = Number(recipeId);
    return `rec_${rId}`;
  }

  parseStockKey(stockKey) {
    if (!stockKey || !stockKey.startsWith('rec_')) return null;
    const parts = stockKey.split('_omit_');
    const recipeId = Number(parts[0].replace('rec_', ''));
    return {
      stockKey: `rec_${recipeId}`,
      recipeId
    };
  }

  /**
   * 재고에 있는 제품이 대표 재료(ingredient_id)에도 존재하는 경우 그 재고 수량을 반환합니다.
   * 예: 재고에 소주(rec_5)가 10개 있으면 재료 탭의 소주(ing_101)도 10개로 표시되며,
   * 서빙을 하나 하면 두 군데 모두 9로 줄어듭니다.
   */
  getStockCountForIngredient(ingredientId) {
    if (!this.session || !this.session.stockMap || !this.recipeBook) return 0;
    const producers = this.recipeBook.producerRecipesByIngId?.get(Number(ingredientId)) || [];
    if (producers.length === 0) return 0;
    let total = 0;
    for (const rId of producers) {
      total += (this.session.stockMap.get(this.buildStockKey(rId)) || 0);
    }
    return total;
  }

  /**
   * 1원 단위 정교한 가격 계산 공식
   * - 난이도(EASY/NORMAL/MASTER), 총 재료 개수(sumRatio), 슬롯 종류 수(itemCount),
   *   하위 조합 재료(중간재) 포함 개수, 단골 기억 주문(MEMORY) 여부에 따라 1원 단위 산출
   */
  calculateOrderPrice(recipeId, orderType = 'NORMAL', combo = 0, wave = 1) {
    const rec = this.recipeBook.getRecipe(recipeId);
    const items = this.recipeBook.getRecipeItems(recipeId);
    if (!rec || !items) return 15;

    const sumRatio = items.reduce((acc, it) => acc + (Number(it.ratio) || 1), 0);
    const slotCount = items.length;

    // 중간 조합 재료(Non-leaf)가 몇 개 들어가는지 계산 (연쇄 조합 가중치)
    let craftedSubIngCount = 0;
    for (const it of items) {
      if (!this.recipeBook.isLeafIngredient(it.ingredient_id)) {
        craftedSubIngCount += 1;
      }
    }

    // 1) 기본 원가 (총 재료 개수 * 7원 + 슬롯 종류 수 * 5원 + 연쇄 중간재료 수 * 9원)
    const baseMaterialValue = (sumRatio * 7) + (slotCount * 5) + (craftedSubIngCount * 9);

    // 2) 레시피 난이도 배율
    let diffMultiplier = 1.0;
    if (rec.difficulty === 'NORMAL') diffMultiplier = 1.38;
    else if (rec.difficulty === 'MASTER') diffMultiplier = 1.85;
    else if (slotCount >= 3) diffMultiplier = 1.22;

    // 3) 주문 특수 난이도 배율 (늘 먹던 걸로 기억 주문)
    let orderTypeMultiplier = 1.0;
    let specialFlatBonus = 0;
    if (orderType === 'MEMORY') {
      orderTypeMultiplier = 1.55;
      specialFlatBonus = 23;
    }

    // 4) 웨이브 & 콤보 프리미엄 (1원 단위 정밀도 부여)
    const waveBonus = Math.max(0, (wave - 1) * 4);
    const comboTip = Math.min(50, combo * 3);

    const rawPrice = (baseMaterialValue * diffMultiplier * orderTypeMultiplier) + specialFlatBonus + waveBonus + comboTip;
    return Math.max(12, Math.round(rawPrice));
  }

  /**
   * 새로운 타이쿤 게임 세션 초기화
   * @param {'TIME_ATTACK' | 'INFINITE'} mode
   */
  resetSession(mode = 'INFINITE') {
    const stockMap = new Map();

    // 주조실이나 사전 준비로 만들어둔 보관함 재고가 있으면 세션 시작 재고로 로드
    for (const [k, cnt] of Object.entries(this.savedBrewStash)) {
      const cleanKey = k.split('_omit_')[0];
      if (cnt > 0 && cleanKey.startsWith('rec_')) {
        stockMap.set(cleanKey, (stockMap.get(cleanKey) || 0) + cnt);
      }
    }

    // 기본 기초 재료 중 아직 재고에 하나도 없으면 초보 배려용 소주 1개, 맥주 1개, 얼음 1개 기본 비치
    if (stockMap.size === 0) {
      stockMap.set('rec_5', 1);  // 소주 1개
      stockMap.set('rec_4', 1);  // 맥주 1개
      stockMap.set('rec_11', 1); // 얼음 1개
    }

    this.session = {
      mode, // 'TIME_ATTACK' | 'INFINITE'
      status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'GAMEOVER'
      lives: 3,
      maxLives: 3,
      timeLeftSec: mode === 'TIME_ATTACK' ? 180 : 0, // 타임어택 180초(3분)
      elapsedSec: 0,
      servedCount: 0,
      totalEarnings: 0,
      combo: 0,
      maxCombo: 0,
      wave: 1,
      selectedTableIdx: 0, // 현재 주조/서빙 타겟으로 선택된 테이블 (0 ~ 3)
      autoSeatEnabled: true,
      waitingQueue: [],
      tables: [
        { tableIdx: 0, label: '1번석 (창가)', customer: null, order: null },
        { tableIdx: 1, label: '2번석 (중앙)', customer: null, order: null },
        { tableIdx: 2, label: '3번석 (바테이블)', customer: null, order: null },
        { tableIdx: 3, label: '4번석 (안쪽방)', customer: null, order: null }
      ],
      // 타이쿤 전용 미니 주조 가마솥 슬롯: [{ baseId, detailId, count }]
      potSlots: [],
      // 조합으로 만들어 쌓인 재고: Map<stockKey, count>
      stockMap,
      // 이번 세션에서 이미 방문해 얼굴과 주문을 익힌 손님 ID -> 방문 횟수
      sessionCustomerVisits: new Map(),
      lastLogMessage: '🏮 주막 문을 열 준비가 되었습니다! 손님을 자리에 안내하고 주문을 맞춰 서빙하세요.'
    };
    return this.session;
  }

  startGame(mode) {
    this.resetSession(mode);
    this.session.status = 'PLAYING';
    this.session.lastLogMessage = mode === 'TIME_ATTACK'
      ? '⏱️ [타임어택 시작!] 180초 동안 최대한 많은 손님에게 정확한 조합을 만들어 판매하세요!'
      : '♾️ [무한모드 시작!] 목숨은 3개! 뒤로 갈수록 다중 조합과 단골 기억 주문이 등장합니다!';

    this._spawnWaitingCustomer();
    this._spawnWaitingCustomer();
    if (this.session.autoSeatEnabled) {
      this.seatNextCustomerToTable(0);
      this.seatNextCustomerToTable(1);
    }
    this.session.selectedTableIdx = 0;
  }

  /**
   * 현재 서빙 횟수(servedCount)에 따른 무한 난이도 웨이브(Wave) 및 출제 확률 파라미터 계산
   */
  getDifficultyProfile() {
    const sc = this.session ? this.session.servedCount : 0;
    const wave = Math.floor(sc / 3) + 1;
    if (this.session) {
      this.session.wave = Math.max(this.session.wave, wave);
    }

    if (wave === 1) {
      return {
        wave: 1,
        title: 'Wave 1 · 초보 주막 (기본 주문 & 단골 얼굴 익히기)',
        maxRecipeStep: 2,
        probMemory: 0.0
      };
    } else if (wave === 2) {
      return {
        wave: 2,
        title: 'Wave 2 · 3재료 다중 조합 등장!',
        maxRecipeStep: 4,
        probMemory: 0.25
      };
    } else if (wave === 3) {
      return {
        wave: 3,
        title: 'Wave 3 · 단골 손님 ["늘 먹던 걸로!"] 기억 테스트 본격화!',
        maxRecipeStep: 5,
        probMemory: 0.45
      };
    } else if (wave === 4) {
      return {
        wave: 4,
        title: 'Wave 4 · 황금비율 & 단골 기억 주문',
        maxRecipeStep: 6,
        probMemory: 0.60
      };
    } else {
      const extra = Math.min(0.20, (wave - 5) * 0.05);
      return {
        wave,
        title: `Wave ${wave} · 전설의 대주막 (고난도 비율·특산·단골 기억 극한 도전)`,
        maxRecipeStep: 7,
        probMemory: Math.min(0.80, 0.60 + extra)
      };
    }
  }

  /**
   * 손님 1명과 그 손님의 주문을 생성하여 대기열(waitingQueue)에 추가
   */
  _spawnWaitingCustomer() {
    if (!this.session || this.session.waitingQueue.length >= 3) return null;

    const profile = this.getDifficultyProfile();
    const allCustomers = this.customerPool.getAllCustomers();

    // 현재 테이블이나 대기열에 이미 있는 손님은 중복 등장하지 않도록 필터링
    const activeCustIds = new Set();
    this.session.waitingQueue.forEach(w => activeCustIds.add(w.customer.id));
    this.session.tables.forEach(t => {
      if (t.customer) activeCustIds.add(t.customer.id);
    });

    const availableCustomers = allCustomers.filter(c => !activeCustIds.has(c.id));
    if (availableCustomers.length === 0) return null;

    // 이미 방문했던 단골 손님 목록 (메모리 주문 후보)
    const visitedCandidates = availableCustomers.filter(
      c => (this.session.sessionCustomerVisits.get(c.id) || 0) >= 1
    );

    // 현재 웨이브 난이도에 맞는 손님 필터링
    const stepMatchedCustomers = availableCustomers.filter(c => {
      const rec = this.recipeBook.getRecipe(c.preferredRecipeId);
      return rec && (rec.step_id || 1) <= profile.maxRecipeStep;
    });

    let chosenCustomer = null;
    let orderType = 'NORMAL'; // 'NORMAL' | 'MEMORY'

    const roll = Math.random();
    if (visitedCandidates.length > 0 && roll < profile.probMemory) {
      // 이미 최소 1번 이상 와서 얼굴과 메뉴를 알렸던 단골 손님이 재방문!
      chosenCustomer = visitedCandidates[Math.floor(Math.random() * visitedCandidates.length)];
      orderType = 'MEMORY';
    } else {
      const pool = stepMatchedCustomers.length > 0 ? stepMatchedCustomers : availableCustomers;
      const unvisitedPool = pool.filter(c => !(this.session.sessionCustomerVisits.get(c.id) > 0));
      const finalPool = (unvisitedPool.length > 0 && Math.random() < 0.75) ? unvisitedPool : pool;
      chosenCustomer = finalPool[Math.floor(Math.random() * finalPool.length)];
      orderType = 'NORMAL';
    }

    const order = this._createOrderForCustomer(chosenCustomer, orderType, profile.wave);
    const entry = {
      customer: chosenCustomer,
      order,
      arrivedAt: Date.now()
    };

    this.session.waitingQueue.push(entry);
    return entry;
  }

  _createOrderForCustomer(customer, orderType, wave) {
    const recipeId = customer.preferredRecipeId;
    const rec = this.recipeBook.getRecipe(recipeId);
    const recipeName = this.brandResolver.resolveName(rec);

    const requiredStockKey = this.buildStockKey(recipeId);
    const price = this.calculateOrderPrice(recipeId, orderType, this.session.combo, wave);

    let dialogue = '';
    let orderBadge = '';
    if (orderType === 'MEMORY') {
      orderBadge = '🧠 단골 기억 주문';
      dialogue = `"사장님, 저 또 왔어요! 늘 먹던 걸로 한 잔 주세요!"`;
    } else {
      orderBadge = '📋 일반 주문';
      dialogue = `"사장님! 제 단골 메뉴인 [${recipeName}] 1잔 주세요!"`;
    }

    // 개별 손님 대기시간(Patience) 산출 (웨이브가 높아질수록 긴장감 있게 단축, 최소 24초 ~ 기본 48초)
    const maxPatienceSec = Math.max(24, 48 - (wave - 1) * 3);

    return {
      orderId: 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      orderType,
      orderBadge,
      recipeId,
      recipeName,
      requiredStockKey,
      price,
      dialogue,
      maxPatienceSec,
      patienceSec: maxPatienceSec
    };
  }

  /**
   * 대기열의 첫 번째 손님을 지정된 빈 좌석(tableIdx)으로 안내하여 착석시킵니다.
   */
  seatNextCustomerToTable(tableIdx) {
    if (!this.session || this.session.status !== 'PLAYING') return { ok: false, message: '영업 중이 아닙니다.' };
    const table = this.session.tables[tableIdx];
    if (!table) return { ok: false, message: '유효하지 않은 좌석입니다.' };
    if (table.customer) {
      this.session.selectedTableIdx = tableIdx;
      return { ok: true, action: 'SELECTED_EXISTING', table };
    }

    if (this.session.waitingQueue.length === 0) {
      this._spawnWaitingCustomer();
    }
    const nextGuest = this.session.waitingQueue.shift();
    if (!nextGuest) {
      return { ok: false, message: '대기 중인 손님이 없습니다.' };
    }

    table.customer = nextGuest.customer;
    table.order = nextGuest.order;

    // 단골 도감에 자동 등록
    this.knownRegularIds.add(nextGuest.customer.id);
    this.savePersistentData();

    // 대기열 보충
    if (this.session.waitingQueue.length < 2) {
      this._spawnWaitingCustomer();
    }

    return { ok: true, action: 'SEATED', table };
  }

  /**
   * 빈 좌석이 있으면 대기 손님을 자동으로 안내
   */
  autoSeatAvailableTables() {
    if (!this.session || !this.session.autoSeatEnabled) return;
    for (let i = 0; i < this.session.tables.length; i++) {
      if (!this.session.tables[i].customer) {
        if (this.session.waitingQueue.length === 0) {
          this._spawnWaitingCustomer();
        }
        if (this.session.waitingQueue.length > 0) {
          this.seatNextCustomerToTable(i);
        }
      }
    }
  }

  /**
   * 각 좌석 손님의 개별 대기시간 게이지 차감 및 타임아웃 처리
   */
  tickPatience(dtSec = 1) {
    if (!this.session || this.session.status !== 'PLAYING') return { expiredCount: 0, isGameOver: false };
    let expiredCount = 0;

    for (let i = 0; i < this.session.tables.length; i++) {
      const t = this.session.tables[i];
      if (!t.customer || !t.order) continue;
      t.order.patienceSec = Math.max(0, (t.order.patienceSec || 0) - dtSec);

      if (t.order.patienceSec <= 0) {
        expiredCount++;
        const custName = t.customer.name;
        this.session.combo = 0;
        this.audio?.playFail?.();

        t.customer = null;
        t.order = null;

        if (this.session.mode === 'INFINITE') {
          this.session.lives -= 1;
          this.session.lastLogMessage = `⏰ [${custName}] 대기시간 초과! (남은 목숨: ${'❤️'.repeat(Math.max(0, this.session.lives))})`;
          if (this.session.lives <= 0) {
            this.session.status = 'GAMEOVER';
            this.session.lastLogMessage = `🏁 대기시간 초과로 목숨 3개를 모두 소진했습니다! (${this.session.servedCount}잔 · ${this.session.totalEarnings.toLocaleString()}원)`;
            return { expiredCount, isGameOver: true };
          }
        } else {
          this.session.timeLeftSec = Math.max(0, this.session.timeLeftSec - 5);
          this.session.lastLogMessage = `⏰ [${custName}] 대기시간 초과! (-5초 페널티)`;
          if (this.session.timeLeftSec <= 0) {
            this.session.status = 'GAMEOVER';
            return { expiredCount, isGameOver: true };
          }
        }

        this._spawnWaitingCustomer();
        if (this.session.autoSeatEnabled) {
          this.seatNextCustomerToTable(i);
        }
      }
    }

    return { expiredCount, isGameOver: false };
  }

  // =========================================================================
  // 타이쿤 전용 미니 주조 가마솥 (배율 투입 + 조합 시 재고 축적)
  // =========================================================================

  tapIngredientInTycoonPot(baseId, detailId = null) {
    if (!this.session) return { ok: false };
    const bId = Number(baseId);
    const dId = detailId ? Number(detailId) : null;
    const pot = this.session.potSlots;

    const existing = pot.find(s => s.baseId === bId && (s.detailId || null) === dId);
    const totalCount = pot.reduce((acc, s) => acc + s.count, 0);

    if (existing) {
      if (existing.count >= 10 || totalCount >= 12) {
        return { ok: false, message: '더 이상 재료를 추가할 수 없습니다.' };
      }
      existing.count += 1;
      return { ok: true, slot: existing };
    }

    if (pot.length >= 6) {
      return { ok: false, message: '한 번에 최대 6종류 재료까지 올릴 수 있습니다.' };
    }

    const newSlot = {
      baseId: bId,
      detailId: dId,
      count: 1
    };
    pot.push(newSlot);
    return { ok: true, slot: newSlot };
  }

  decrementTycoonPotSlot(slotIdx) {
    if (!this.session) return;
    const pot = this.session.potSlots;
    if (slotIdx < 0 || slotIdx >= pot.length) return;
    pot[slotIdx].count -= 1;
    if (pot[slotIdx].count <= 0) {
      pot.splice(slotIdx, 1);
    }
  }

  clearTycoonPot() {
    if (!this.session) return;
    this.session.potSlots = [];
  }

  /**
   * 현재 가마솥 슬롯으로 어떤 레시피가 만들어지는지 실시간 미리보기 판별
   */
  previewTycoonPotMatch() {
    if (!this.session || this.session.potSlots.length < 2) return null;
    const slots = this.session.potSlots;

    // 현재 선택된 테이블의 주문 레시피가 후보군에 있으면 우선 매칭되도록 지원
    const activeTable = this.session.tables[this.session.selectedTableIdx];
    const preferredRecipeId = activeTable?.order?.recipeId || null;

    const matchedRecipe = this.recipeBook.matchRecipe(
      slots,
      new Set(),
      preferredRecipeId
    );
    if (!matchedRecipe) return null;

    const stockKey = this.buildStockKey(matchedRecipe.recipe_id);

    return {
      recipe: matchedRecipe,
      recipeName: this.brandResolver.resolveName(matchedRecipe),
      stockKey,
      unlockedIng: this.recipeBook.getUnlockedIngredientByRecipe(matchedRecipe.recipe_id)
    };
  }

  /**
   * 타이쿤 가마솥에서 [⚗️ 조합] 실행
   * - 성공 시 해당 조합이 재고(stockMap)에 +1 쌓이며,
   *   만약 이 조합이 재료에도 존재하는 제품(예: 소주, 맥주 등)이면 재료 탭의 재고 배지 수량도 함께 올라갑니다!
   */
  craftToStockpile() {
    const preview = this.previewTycoonPotMatch();
    if (!preview) {
      this.audio?.playFail?.();
      return {
        ok: false,
        message: '일치하는 레시피가 없습니다! 재료와 황금비율을 다시 확인해주세요.'
      };
    }

    const currentCount = this.session.stockMap.get(preview.stockKey) || 0;
    this.session.stockMap.set(preview.stockKey, currentCount + 1);

    // 상시 보관함에도 함께 동기화
    this.savedBrewStash[preview.stockKey] = Math.min(99, (this.savedBrewStash[preview.stockKey] || 0) + 1);
    this.savePersistentData();

    this.clearTycoonPot();
    this.audio?.playSuccess?.();

    const label = preview.recipeName;
    this.session.lastLogMessage = `✨ [${label}] 1잔 완성! 재고에 쌓였습니다 (보유: ${currentCount + 1}개)`;

    return {
      ok: true,
      crafted: preview,
      newCount: currentCount + 1,
      label
    };
  }

  /**
   * 재고에 쌓인 특정 술/조합(stockKey)을 지정 테이블 손님에게 서빙!
   * - 서빙 시 재고 탭과 재료 탭(동일 제품이 있는 경우) 양쪽의 표시 수량이 함께 1개 차감됩니다.
   */
  serveStockToTable(stockKey, tableIdx = this.session.selectedTableIdx) {
    if (!this.session || this.session.status !== 'PLAYING') {
      return { ok: false, message: '현재 영업 중이 아닙니다.' };
    }

    const availableCount = this.session.stockMap.get(stockKey) || 0;
    if (availableCount <= 0) {
      return { ok: false, message: '해당 주류의 재고가 없습니다! 먼저 조합하여 재고를 만들어주세요.' };
    }

    const table = this.session.tables[tableIdx];
    if (!table || !table.customer || !table.order) {
      return { ok: false, message: '선택한 좌석에 주문 대기 중인 손님이 없습니다!' };
    }

    // 재고 1개 차감
    if (availableCount <= 1) {
      this.session.stockMap.delete(stockKey);
    } else {
      this.session.stockMap.set(stockKey, availableCount - 1);
    }
    if (this.savedBrewStash[stockKey] > 0) {
      this.savedBrewStash[stockKey] -= 1;
      if (this.savedBrewStash[stockKey] <= 0) delete this.savedBrewStash[stockKey];
    }

    const cust = table.customer;
    const order = table.order;
    const isCorrect = (stockKey === order.requiredStockKey);

    if (isCorrect) {
      // 정답 서빙!
      this.session.servedCount += 1;
      this.session.combo += 1;
      if (this.session.combo > this.session.maxCombo) {
        this.session.maxCombo = this.session.combo;
      }

      const earned = order.price;
      this.session.totalEarnings += earned;
      this.persistentWallet += earned;

      // 해당 단골 손님의 세션 방문 횟수 +1 기록
      const prevVisits = this.session.sessionCustomerVisits.get(cust.id) || 0;
      this.session.sessionCustomerVisits.set(cust.id, prevVisits + 1);
      this.knownRegularIds.add(cust.id);

      // 최고 기록 갱신 체크
      if (this.session.mode === 'TIME_ATTACK') {
        if (
          this.session.servedCount > this.persistentBestTimeAttack.servedCount ||
          (this.session.servedCount === this.persistentBestTimeAttack.servedCount &&
           this.session.totalEarnings > this.persistentBestTimeAttack.totalEarnings)
        ) {
          this.persistentBestTimeAttack = {
            servedCount: this.session.servedCount,
            totalEarnings: this.session.totalEarnings,
            maxCombo: this.session.maxCombo
          };
        }
      } else {
        if (
          this.session.servedCount > this.persistentBestInfinite.servedCount ||
          (this.session.servedCount === this.persistentBestInfinite.servedCount &&
           this.session.totalEarnings > this.persistentBestInfinite.totalEarnings)
        ) {
          this.persistentBestInfinite = {
            servedCount: this.session.servedCount,
            totalEarnings: this.session.totalEarnings,
            maxCombo: this.session.maxCombo,
            maxWave: this.session.wave
          };
        }
      }

      this.savePersistentData();
      this.audio?.playSuccess?.();

      const servedLabel = order.recipeName;
      this.session.lastLogMessage = `💰 [${cust.name}] 손님에게 [${servedLabel}] 서빙 대성공! +${earned.toLocaleString()}원 (${this.session.combo}연속 콤보🔥)`;

      // 손님 퇴장 및 다음 손님 대기열 생성
      table.customer = null;
      table.order = null;
      this._spawnWaitingCustomer();
      if (this.session.autoSeatEnabled) {
        this.seatNextCustomerToTable(tableIdx);
      }

      return {
        ok: true,
        isCorrect: true,
        earned,
        customer: cust,
        order
      };
    } else {
      // 오답 서빙!
      this.session.combo = 0;
      this.audio?.playFail?.();

      const expectedLabel = order.recipeName;

      if (this.session.mode === 'INFINITE') {
        this.session.lives -= 1;
        this.session.lastLogMessage = `💔 [주문 실수!] ${cust.name} 손님이 원한 건 [${expectedLabel}]였습니다! (남은 목숨: ${'❤️'.repeat(Math.max(0, this.session.lives))})`;

        table.customer = null;
        table.order = null;

        if (this.session.lives <= 0) {
          this.session.status = 'GAMEOVER';
          this.session.lastLogMessage = `🏁 목숨 3개를 모두 소진하여 영업이 종료되었습니다! (총 ${this.session.servedCount}잔 서빙 · ${this.session.totalEarnings.toLocaleString()}원 달성)`;
          return {
            ok: true,
            isCorrect: false,
            isGameOver: true,
            expectedLabel
          };
        }

        this._spawnWaitingCustomer();
        if (this.session.autoSeatEnabled) {
          this.seatNextCustomerToTable(tableIdx);
        }
      } else {
        this.session.timeLeftSec = Math.max(0, this.session.timeLeftSec - 5);
        this.session.lastLogMessage = `⚠️ [서빙 실수! -5초] ${cust.name} 손님이 원한 건 [${expectedLabel}]였습니다!`;
        table.customer = null;
        table.order = null;
        this._spawnWaitingCustomer();
        if (this.session.autoSeatEnabled) {
          this.seatNextCustomerToTable(tableIdx);
        }
        if (this.session.timeLeftSec <= 0) {
          this.session.status = 'GAMEOVER';
        }
      }

      return {
        ok: true,
        isCorrect: false,
        isGameOver: this.session.status === 'GAMEOVER',
        expectedLabel
      };
    }
  }

  /**
   * 재고 아이템 설명 메타데이터 조회
   */
  getStockItemDisplayMeta(stockKey) {
    const parsed = this.parseStockKey(stockKey);
    if (!parsed) return null;
    const rec = this.recipeBook.getRecipe(parsed.recipeId);
    if (!rec) return null;

    const recipeName = this.brandResolver.resolveName(rec);
    const estPrice = this.calculateOrderPrice(
      parsed.recipeId,
      'NORMAL',
      this.session ? this.session.combo : 0,
      this.session ? this.session.wave : 1
    );

    return {
      stockKey,
      recipe: rec,
      recipeName,
      fullLabel: recipeName,
      estPrice,
      iconHtml: window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 28) : (rec.emoji || '🍶')
    };
  }
}

window.KSool.TycoonEngine = TycoonEngine;
