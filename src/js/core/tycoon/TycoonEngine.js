window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 핵심 경영·재고·난이도·가격 산정 엔진
 *
 * [핵심 메커니즘]
 * 1. 조합물 재고 축적 (Stockpile):
 *    - 조합한 결과물(중간 재료 or 최종 완성품)이 인벤토리 선반에 1개씩 쌓입니다.
 *    - 또한 주조실 탭에서 조합을 만들었을 때도 타이쿤 상시 선반 재고로 자동 누적되며,
 *      타이쿤 게임 내의 미니 양조장에서도 실시간으로 조합하여 즉시 선반에 쌓을 수 있습니다!
 * 2. 1원 단위 정밀 가격 산정 (1-Won Precision Pricing):
 *    - 기본 단가 + 총 투입 개수(sumRatio) 비례 단가 + 재료 가짓수(slotCount) 보너스
 *      + 연쇄 합성 깊이(chainDepth) 보너스 + 난이도(EASY/NORMAL/MASTER) 배율
 *      + 주문 특수 조건('빼기 주문' / '늘 먹던 걸로' 단골 기억 주문) 프리미엄 보너스
 *      + 연속 서빙 콤보 보너스를 합산하여 1원 단위(예: 29원, 68원, 143원)로 정확히 계산합니다.
 * 3. 주막 공간 & 좌석 안내 시스템 (Tavern Seating + Queue):
 *    - 입구 대기열에 손님이 찾아오면 빈 좌석(1~4번 테이블)을 눌러 안내(또는 자동 안내)하여 앉히고 주문을 받습니다.
 * 4. 3대 난이도 상승 알고리즘 (Infinite Progressive Scaling):
 *    - [난이도 축 1: 다중/연쇄 조합] 2재료 1:1 -> 3~4재료 다중 혼합 & 중간 조합 재료 필수 레시피 -> 황금비율 & 특산 명주
 *    - [난이도 축 2: 재료 빼기 주문 (Omission Tagging)]
 *      "전 [소맥] 마실 건데 [맥주]는 빼고 주세요!" -> 실제 빼고 조합하면 다른 레시피와 겹치므로,
 *      정석대로 슬롯에 재료를 모두 올린 뒤 해당 슬롯의 [➖빼기] 태그를 켜서 주조하면
 *      `소맥 (🚫맥주 빼기)` 전용 커스텀 스톡으로 안전하게 구분되어 제조·보관됩니다!
 *    - [난이도 축 3: 고유 단골 손님의 "늘 먹던 걸로 주세요!" (Memory Order)]
 *      유니크하지만 헷갈리는 외형(모자/안경/수염/의상)을 가진 단골 손님이
 *      초반에는 자기 시그니처 메뉴를 말해주지만, 재방문 및 고난이도 웨이브에서는
 *      "사장님, 늘 먹던 걸로 주세요!" 또는 "늘 먹던 거에서 [특정 재료] 빼고 주세요!"라고 주문합니다.
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
    this.savedBrewStash = {}; // stockKey -> count (주조실이나 이전 준비에서 미리 만들어 둔 초기 재고)
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
        this.savedBrewStash = parsed.savedBrewStash;
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
   * 일반 주조실(탭 1)에서 조합을 완성했을 때도 타이쿤 재고 선반에 +1개씩 쌓이도록 연동!
   */
  addCraftedFromMainBrewery(recipeId, omittedSlotKey = null) {
    const key = this.buildStockKey(recipeId, omittedSlotKey);
    this.savedBrewStash[key] = Math.min(99, (this.savedBrewStash[key] || 0) + 1);
    if (this.session && this.session.stockMap) {
      const cur = this.session.stockMap.get(key) || 0;
      this.session.stockMap.set(key, cur + 1);
    }
    this.savePersistentData();
  }

  /**
   * 스톡 키 생성: `rec_{recipeId}` 또는 빼기 태그가 있는 경우 `rec_{recipeId}_omit_{baseId}_{detailId}`
   */
  buildStockKey(recipeId, omittedSlotKey = null) {
    const rId = Number(recipeId);
    if (!omittedSlotKey) return `rec_${rId}`;
    return `rec_${rId}_omit_${omittedSlotKey}`;
  }

  parseStockKey(stockKey) {
    if (!stockKey || !stockKey.startsWith('rec_')) return null;
    const parts = stockKey.split('_omit_');
    const recipeId = Number(parts[0].replace('rec_', ''));
    const omittedSlotKey = parts[1] || null;
    let omittedBaseId = null;
    let omittedDetailId = null;
    if (omittedSlotKey) {
      const [bStr, dStr] = omittedSlotKey.split(':');
      omittedBaseId = Number(bStr);
      omittedDetailId = Number(dStr) || null;
    }
    return {
      stockKey,
      recipeId,
      omittedSlotKey,
      omittedBaseId,
      omittedDetailId
    };
  }

  /**
   * 1원 단위 정교한 가격 계산 공식
   * - 난이도(EASY/NORMAL/MASTER), 총 재료 개수(sumRatio), 슬롯 종류 수(itemCount),
   *   하위 조합 재료(중간재) 포함 개수, 특수 주문(빼기/단골 기억) 여부에 따라 1원 단위 산출
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

    // 3) 주문 특수 난이도 배율 (빼기 주문 / 늘 먹던 걸로 기억 주문 / 복합 주문)
    let orderTypeMultiplier = 1.0;
    let specialFlatBonus = 0;
    if (orderType === 'OMIT') {
      orderTypeMultiplier = 1.35;
      specialFlatBonus = 14;
    } else if (orderType === 'MEMORY') {
      orderTypeMultiplier = 1.55;
      specialFlatBonus = 23;
    } else if (orderType === 'MEMORY_OMIT') {
      orderTypeMultiplier = 1.95;
      specialFlatBonus = 41;
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

    // 주조실이나 사전 준비로 만들어둔 보관함 재고가 있으면 세션 시작 재고로 로드 (최대 종류당 3개까지 시작 보너스 반영)
    for (const [k, cnt] of Object.entries(this.savedBrewStash)) {
      if (cnt > 0) {
        stockMap.set(k, Math.min(3, cnt));
      }
    }

    // 기본 기초 재료(소주, 맥주, 얼음, 탄산수 등) 중 아직 선반에 하나도 없으면 초보 배려용 소주 1개, 맥주 1개 기본 비치
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
      autoSeatEnabled: true, // 손님이 오면 빈자리에 자동 착석 안내할지 여부 (수동 자리 클릭도 언제든 가능)
      waitingQueue: [], // 입구에서 대기 중인 손님 배열 (최대 3명)
      tables: [
        { tableIdx: 0, label: '1번석 (창가)', customer: null, order: null },
        { tableIdx: 1, label: '2번석 (중앙)', customer: null, order: null },
        { tableIdx: 2, label: '3번석 (바테이블)', customer: null, order: null },
        { tableIdx: 3, label: '4번석 (안쪽방)', customer: null, order: null }
      ],
      // 타이쿤 전용 미니 주조 가마솥 슬롯: [{ baseId, detailId, count, isOmitted }]
      potSlots: [],
      // 조합으로 만들어 쌓인 재고 선반: Map<stockKey, count>
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
      : '♾️ [무한모드 시작!] 목숨은 3개! 뒤로 갈수록 다중 조합·빼기 주문·단골 기억 주문이 등장합니다!';

    // 시작 시 입구 대기열에 손님 2명 생성 & 자동 안내가 켜져 있으면 1, 2번 테이블에 즉시 착석
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
   *
   * [난이도 상승 설계]
   * - Wave 1 (0~2회 서빙): 입문기 -> 2재료 기초 조합 위주, 일반 주문 100% (단골 손님들이 자기 취향을 소개함)
   * - Wave 2 (3~5회 서빙): 숙련기 -> 3재료 다중 조합 등장, '재료 빼기(OMIT)' 주문 35% 등장
   * - Wave 3 (6~9회 서빙): 단골기 -> 앞서 방문했던 단골 손님이 다시 찾아와 "늘 먹던 걸로 주세요!(MEMORY)" 35% 등장, 빼기 주문 35%
   * - Wave 4 (10~14회 서빙): 황금비율기 -> 2:1, 3:1 비율 조합 및 연쇄 합성 조합 등장, MEMORY 40%, OMIT 35%, 복합(MEMORY_OMIT) 15%
   * - Wave 5+ (15회 이상 무한 확장): 마스터 주막 -> 4재료·특산 명주·황금비율 총출동, MEMORY + MEMORY_OMIT 비중이 최대 75%까지 상승!
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
        probOmit: 0.0,
        probMemory: 0.0,
        probMemoryOmit: 0.0
      };
    } else if (wave === 2) {
      return {
        wave: 2,
        title: 'Wave 2 · 3재료 다중 조합 & [재료 빼기] 주문 등장!',
        maxRecipeStep: 4,
        probOmit: 0.45,
        probMemory: 0.0,
        probMemoryOmit: 0.0
      };
    } else if (wave === 3) {
      return {
        wave: 3,
        title: 'Wave 3 · 단골 손님 ["늘 먹던 걸로!"] 기억 테스트 시작!',
        maxRecipeStep: 5,
        probOmit: 0.35,
        probMemory: 0.40,
        probMemoryOmit: 0.0
      };
    } else if (wave === 4) {
      return {
        wave: 4,
        title: 'Wave 4 · 황금비율 & 단골 복합 주문',
        maxRecipeStep: 6,
        probOmit: 0.30,
        probMemory: 0.40,
        probMemoryOmit: 0.20
      };
    } else {
      const extra = Math.min(0.25, (wave - 5) * 0.05);
      return {
        wave,
        title: `Wave ${wave} · 전설의 대주막 (고난도 비율·특산·단골 기억 극한 도전)`,
        maxRecipeStep: 7,
        probOmit: 0.25,
        probMemory: 0.35,
        probMemoryOmit: Math.min(0.40, 0.25 + extra)
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
    let orderType = 'NORMAL'; // 'NORMAL' | 'OMIT' | 'MEMORY' | 'MEMORY_OMIT'

    const roll = Math.random();
    if (visitedCandidates.length > 0 && roll < (profile.probMemory + profile.probMemoryOmit)) {
      // 이미 최소 1번 이상 와서 얼굴과 메뉴를 알렸던 단골 손님이 재방문!
      chosenCustomer = visitedCandidates[Math.floor(Math.random() * visitedCandidates.length)];
      orderType = roll < profile.probMemoryOmit ? 'MEMORY_OMIT' : 'MEMORY';
    } else {
      const pool = stepMatchedCustomers.length > 0 ? stepMatchedCustomers : availableCustomers;
      // 아직 안 온 손님 우선 배정하여 다양한 단골을 학습하게 유도
      const unvisitedPool = pool.filter(c => !(this.session.sessionCustomerVisits.get(c.id) > 0));
      const finalPool = (unvisitedPool.length > 0 && Math.random() < 0.7) ? unvisitedPool : pool;
      chosenCustomer = finalPool[Math.floor(Math.random() * finalPool.length)];

      if (Math.random() < profile.probOmit) {
        orderType = 'OMIT';
      } else {
        orderType = 'NORMAL';
      }
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
    const items = this.recipeBook.getRecipeItems(recipeId);
    const recipeName = this.brandResolver.resolveName(rec);

    let omittedSlotKey = null;
    let omittedIngName = null;
    let omittedBaseId = null;

    if (orderType === 'OMIT' || orderType === 'MEMORY_OMIT') {
      // 이 손님이 선호하는 빼기 재료(또는 레시피의 특정 재료) 선택
      let targetItem = items.find(it => Number(it.ingredient_id) === Number(customer.preferredOmitIngId));
      if (!targetItem && items.length > 0) {
        targetItem = items[items.length - 1];
      }
      if (targetItem) {
        omittedBaseId = Number(targetItem.ingredient_id);
        const detId = targetItem.detail_ingredient_id ? Number(targetItem.detail_ingredient_id) : 0;
        omittedSlotKey = `${omittedBaseId}:${detId}`;
        const detObj = detId ? this.recipeBook.getDetailIngredient(detId) : null;
        const baseObj = this.recipeBook.getBaseIngredient(omittedBaseId);
        omittedIngName = this.brandResolver.resolveName(detObj || baseObj);
      } else {
        orderType = orderType === 'MEMORY_OMIT' ? 'MEMORY' : 'NORMAL';
      }
    }

    const requiredStockKey = this.buildStockKey(recipeId, omittedSlotKey);
    const price = this.calculateOrderPrice(recipeId, orderType, this.session.combo, wave);

    // 주문 대사 생성
    let dialogue = '';
    let orderBadge = '';
    if (orderType === 'NORMAL') {
      orderBadge = '📋 일반 주문';
      dialogue = `"사장님! 제 단골 메뉴인 [${recipeName}] 1잔 주세요! (${customer.traitHint} 기억해두세요~)"`;
    } else if (orderType === 'OMIT') {
      orderBadge = '➖ 재료 빼기 주문';
      dialogue = `"사장님! [${recipeName}] 1잔 주시는데, 거기서 [${omittedIngName}] 재료는 빼고(➖) 만들어 주세요!"`;
    } else if (orderType === 'MEMORY') {
      orderBadge = '🧠 단골 기억 주문';
      dialogue = `"사장님, 저 또 왔어요! 제가 누군지 아시죠? 늘 먹던 걸로 한 잔 주세요!"`;
    } else if (orderType === 'MEMORY_OMIT') {
      orderBadge = '👑 단골 기억 + 빼기';
      dialogue = `"사장님! 제가 늘 먹던 단골 술 아시죠? 오늘은 거기서 [${omittedIngName}]만 빼고(➖) 주세요!"`;
    }

    // 개별 손님 대기시간(Patience) 산출 (웨이브가 높아질수록 긴장감 있게 단축, 최소 24초 ~ 기본 45초)
    const maxPatienceSec = Math.max(24, 48 - (wave - 1) * 3);

    return {
      orderId: 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      orderType,
      orderBadge,
      recipeId,
      recipeName,
      omittedSlotKey,
      omittedBaseId,
      omittedIngName,
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

    // 단골 도감에 자동 등록 (한 번이라도 좌석에 앉은 손님은 단골 수첩에서 인상착의 확인 가능)
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
  // 타이쿤 전용 미니 주조 가마솥 (배율 투입 + [➖빼기] 태그 토글 + 조합 시 재고 축적)
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
      count: 1,
      isOmitted: false
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

  /**
   * [핵심 기능] 조합칸에 올라간 특정 재료를 '빼기(Omit)' 상태로 토글!
   * - 실제 슬롯에서 지워버리면 다른 레시피와 겹치거나 매칭이 안 되므로,
   *   슬롯에 재료와 비율은 그대로 올린 뒤 `isOmitted` 태그를 켜서
   *   "원래 이 레시피의 정석 재료이지만 손님 요청으로 제조 과정에서 뺐음"을 명확히 표기합니다!
   */
  toggleOmitOnTycoonPotSlot(slotIdx) {
    if (!this.session) return;
    const pot = this.session.potSlots;
    if (slotIdx < 0 || slotIdx >= pot.length) return;
    const target = pot[slotIdx];
    const nextState = !target.isOmitted;
    // 한 조합에서 빼기 태그는 1개 재료에만 지정 가능하도록 깔끔하게 제어
    pot.forEach(s => { s.isOmitted = false; });
    target.isOmitted = nextState;
    return target.isOmitted;
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

    const omittedSlot = slots.find(s => s.isOmitted);
    const omittedSlotKey = omittedSlot ? `${omittedSlot.baseId}:${omittedSlot.detailId || 0}` : null;
    const stockKey = this.buildStockKey(matchedRecipe.recipe_id, omittedSlotKey);

    let omittedIngName = null;
    if (omittedSlot) {
      const det = omittedSlot.detailId ? this.recipeBook.getDetailIngredient(omittedSlot.detailId) : null;
      const base = this.recipeBook.getBaseIngredient(omittedSlot.baseId);
      omittedIngName = this.brandResolver.resolveName(det || base);
    }

    return {
      recipe: matchedRecipe,
      recipeName: this.brandResolver.resolveName(matchedRecipe),
      omittedSlotKey,
      omittedIngName,
      stockKey,
      unlockedIng: this.recipeBook.getUnlockedIngredientByRecipe(matchedRecipe.recipe_id)
    };
  }

  /**
   * 타이쿤 가마솥에서 [⚗️ 조합하여 선반에 쌓기] 실행
   * - 성공 시 해당 조합(또는 빼기 특제 조합)이 선반 재고(stockMap)에 +1 쌓입니다!
   * - 만약 이 조합이 다른 상위 술의 재료가 되는 중간 조합물(예: 소주, 맥주, 막걸리, 아이스크림, 에이드 등)이라면,
   *   선반에 쌓아두었다가 손님에게 바로 팔 수도 있고 하위 재료로도 쓸 수 있습니다.
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

    const label = preview.omittedIngName
      ? `${preview.recipeName} (🚫${preview.omittedIngName} 빼기)`
      : preview.recipeName;

    this.session.lastLogMessage = `✨ [${label}] 1잔 완성! 재고 선반에 쌓였습니다 (보유: ${currentCount + 1}개)`;

    return {
      ok: true,
      crafted: preview,
      newCount: currentCount + 1,
      label
    };
  }

  /**
   * 재고 선반에 쌓인 특정 술/조합(stockKey)을 현재 선택된 테이블(또는 지정 테이블)의 손님에게 서빙!
   */
  serveStockToTable(stockKey, tableIdx = this.session.selectedTableIdx) {
    if (!this.session || this.session.status !== 'PLAYING') {
      return { ok: false, message: '현재 영업 중이 아닙니다.' };
    }

    const availableCount = this.session.stockMap.get(stockKey) || 0;
    if (availableCount <= 0) {
      return { ok: false, message: '해당 조합의 재고가 없습니다! 먼저 제조하여 선반에 쌓아주세요.' };
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

      // 해당 단골 손님의 세션 방문 횟수 +1 기록 (다음 재방문부터 "늘 먹던 걸로 주세요!" 가능)
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

      const servedLabel = order.omittedIngName
        ? `${order.recipeName}(🚫${order.omittedIngName} 빼기)`
        : order.recipeName;

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

      const expectedLabel = order.omittedIngName
        ? `${order.recipeName}(🚫${order.omittedIngName} 빼기)`
        : order.recipeName;

      if (this.session.mode === 'INFINITE') {
        this.session.lives -= 1;
        this.session.lastLogMessage = `💔 [주문 실수!] ${cust.name} 손님이 원한 건 [${expectedLabel}]였습니다! (남은 목숨: ${'❤️'.repeat(Math.max(0, this.session.lives))})`;

        // 실수한 테이블 손님은 화를 내며 퇴장하고 새 손님 입장
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
        // 타임어택 모드에서는 잘못 주면 5초 페널티 차감 및 손님 교체
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
   * 선반의 재고 아이템 설명 메타데이터 조회
   */
  getStockItemDisplayMeta(stockKey) {
    const parsed = this.parseStockKey(stockKey);
    if (!parsed) return null;
    const rec = this.recipeBook.getRecipe(parsed.recipeId);
    if (!rec) return null;

    const recipeName = this.brandResolver.resolveName(rec);
    let omittedName = null;
    if (parsed.omittedBaseId) {
      const det = parsed.omittedDetailId ? this.recipeBook.getDetailIngredient(parsed.omittedDetailId) : null;
      const base = this.recipeBook.getBaseIngredient(parsed.omittedBaseId);
      omittedName = this.brandResolver.resolveName(det || base);
    }

    const estPrice = this.calculateOrderPrice(
      parsed.recipeId,
      omittedName ? 'OMIT' : 'NORMAL',
      this.session ? this.session.combo : 0,
      this.session ? this.session.wave : 1
    );

    return {
      stockKey,
      recipe: rec,
      recipeName,
      omittedName,
      fullLabel: omittedName ? `${recipeName} (🚫${omittedName} 빼기)` : recipeName,
      estPrice,
      iconHtml: window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 28) : (rec.emoji || '🍶')
    };
  }
}

window.KSool.TycoonEngine = TycoonEngine;
