window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 붕어빵 타이쿤 스타일 카운터·접시·종 서빙 & 6단계 점포 해금 엔진
 *
 * [핵심 메커니즘]
 * 1. 1인 카운터 대면 & 말풍선 주문 (x1 고정):
 *    - 상단 45% 카운터 배경 앞에 손님 1명이 찾아와 말풍선으로 원하는 주류/음료 1개(x1)를 주문합니다.
 * 2. 중앙 접시(Center Serving Plate) & [📦재고] 양방향 연동:
 *    - 하단 주조대에서 [⚗️조합]을 누르면 완성품이 카운터 중앙 접시(platedStockKey) 위로 바로 올라갑니다.
 *      (만약 접시에 이미 다른 완성품이 올려져 있었다면 기존 접시 아이템은 자동으로 [📦재고]로 이동하여 유실되지 않습니다.)
 *    - 접시 위의 아이템을 터치하면 [📦재고] 탭으로 보관되며, 반대로 [📦재고] 탭의 아이템을 터치하면 접시 위로 올라옵니다.
 * 3. 오른쪽 서비스 벨(🛎️ 종 이미지) 터치 서빙:
 *    - 카운터 오른쪽의 종 이미지를 터치하면 "땡~!" 종소리가 울리며 접시 위의 음료를 손님에게 전달합니다.
 * 4. 6단계 점포 배경 해금 & 판매 가능 메뉴 확장:
 *    - 1단계 [길거리 노점](무료)에서는 미국 아이들이 길거리에서 레모네이드를 팔듯 초보 음료/기초 조합만 주문받으며,
 *      장사로 번 자금(💰자산)으로 2단계 포장마차 ~ 6단계 사이버펑크 미래도시 바를 해금할수록
 *      배경이 바뀌고 판매 가능한 주류/음료 종류와 판매 단가 배율이 함께 상승합니다!
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

    // 6단계 점포(배경) 정의: 길거리 노점 -> 포장마차 -> 목조 주막 -> 크래프트 비어 펍 -> 스카이라인 라운지 -> 미래도시 바
    this.MAP_STAGES = [
      {
        id: 'stage_1',
        stageNum: 1,
        icon: '🍋',
        name: '길거리 노점',
        subtitle: '미국 골목길 레모네이드 & 기초 음료 노점',
        bgImage: './assets/tycoon/bg_stage_1.jpg?v=2',
        bellLeftPct: 66.8,
        bellBottomPct: 16.4,
        plateLeftPct: 50.8,
        plateBottomPct: 16.0,
        plateWidthPct: 20.8,
        plateHeightPct: 14.3,
        barTopBottomPct: 26.2,
        unlockCost: 0,
        priceMultiplier: 1.0,
        maxRecipeStep: 1,
        extraRecipeIds: [14, 15, 58, 34, 35, 36, 37, 53, 59, 65, 3, 23, 32, 66, 16, 20],
        menuSummary: '레몬에이드·사이다·우유·아메리카노·소맥 등 초보 조합 (22종)'
      },
      {
        id: 'stage_2',
        stageNum: 2,
        icon: '⛺',
        name: '이모네 포장마차',
        subtitle: '정겨운 밤거리 주황 천막 포차',
        bgImage: './assets/tycoon/bg_stage_2.jpg?v=2',
        bellLeftPct: 72.9,
        bellBottomPct: 9.5,
        plateLeftPct: 50.1,
        plateBottomPct: 10.5,
        plateWidthPct: 23.6,
        plateHeightPct: 12.7,
        barTopBottomPct: 18.6,
        unlockCost: 300,
        priceMultiplier: 1.15,
        maxRecipeStep: 3,
        extraRecipeIds: [],
        menuSummary: '밀키스주·레몬소주·링겔주·아이스바 칵테일 해금 (35종)'
      },
      {
        id: 'stage_3',
        stageNum: 3,
        icon: '🏮',
        name: '동네 목조 주막',
        subtitle: '따뜻한 조명과 나무 향기가 가득한 전통 주막',
        bgImage: './assets/tycoon/bg_stage_3.jpg?v=2',
        bellLeftPct: 72.9,
        bellBottomPct: 9.5,
        plateLeftPct: 50.1,
        plateBottomPct: 10.5,
        plateWidthPct: 23.6,
        plateHeightPct: 12.7,
        barTopBottomPct: 18.6,
        unlockCost: 800,
        priceMultiplier: 1.30,
        maxRecipeStep: 4,
        extraRecipeIds: [],
        menuSummary: '막걸리·과일막걸리·복분자주·태극주·초코주 해금 (54종)'
      },
      {
        id: 'stage_4',
        stageNum: 4,
        icon: '🍺',
        name: '크래프트 비어 펍',
        subtitle: '네온사인과 브루어리 탱크가 빛나는 수제맥주 펍',
        bgImage: './assets/tycoon/bg_stage_4.jpg?v=2',
        bellLeftPct: 72.9,
        bellBottomPct: 9.5,
        plateLeftPct: 50.1,
        plateBottomPct: 10.5,
        plateWidthPct: 23.6,
        plateHeightPct: 12.7,
        barTopBottomPct: 18.6,
        unlockCost: 1800,
        priceMultiplier: 1.50,
        maxRecipeStep: 5,
        extraRecipeIds: [],
        menuSummary: '더치 라거·막사·복소사·에너자이저주·홍차주 해금 (62종)'
      },
      {
        id: 'stage_5',
        stageNum: 5,
        icon: '🥂',
        name: '스카이라인 라운지 바',
        subtitle: '도심 야경이 내려다보이는 럭셔리 호텔 라운지',
        bgImage: './assets/tycoon/bg_stage_5.jpg?v=2',
        bellLeftPct: 68.2,
        bellBottomPct: 10.5,
        plateLeftPct: 50.5,
        plateBottomPct: 13.6,
        plateWidthPct: 19.6,
        plateHeightPct: 10.5,
        barTopBottomPct: 22.3,
        unlockCost: 3500,
        priceMultiplier: 1.75,
        maxRecipeStep: 6,
        extraRecipeIds: [],
        menuSummary: '소토닉·고진감래주·만능열쇠 홍차주 등 고급 연쇄 칵테일 해금 (68종)'
      },
      {
        id: 'stage_6',
        stageNum: 6,
        icon: '🚀',
        name: '사이버펑크 미래도시 바',
        subtitle: '홀로그램 메뉴와 비행선이 오가는 미래도시 주막',
        bgImage: './assets/tycoon/bg_stage_6.jpg?v=2',
        bellLeftPct: 68.2,
        bellBottomPct: 10.5,
        plateLeftPct: 49.8,
        plateBottomPct: 11.8,
        plateWidthPct: 20.7,
        plateHeightPct: 8.4,
        barTopBottomPct: 19.3,
        unlockCost: 6500,
        priceMultiplier: 2.10,
        maxRecipeStep: 7,
        extraRecipeIds: [],
        menuSummary: '황금비율 명주 & 전국 특산주 포함 도감 100% 전 메뉴 해금 (80종)'
      }
    ];

    // 상시 누적 통계 및 해금 상태
    this.persistentWallet = 0; // 누적 보유 자금 (원)
    this.unlockedMapStageIds = new Set(['stage_1']);
    this.selectedMapStageId = 'stage_1';
    this.persistentBestTimeAttack = { servedCount: 0, totalEarnings: 0, maxCombo: 0 };
    this.persistentBestInfinite = { servedCount: 0, totalEarnings: 0, maxCombo: 0, maxWave: 1 };
    this.savedBrewStash = {}; // stockKey -> count
    this.knownRegularIds = new Set();

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
      if (Array.isArray(parsed.unlockedMapStageIds)) {
        parsed.unlockedMapStageIds.forEach(id => this.unlockedMapStageIds.add(id));
      }
      this.unlockedMapStageIds.add('stage_1');
      if (parsed.selectedMapStageId && this.unlockedMapStageIds.has(parsed.selectedMapStageId)) {
        this.selectedMapStageId = parsed.selectedMapStageId;
      }
    } catch (_) {}
  }

  savePersistentData() {
    try {
      localStorage.setItem(this.PERSIST_KEY, JSON.stringify({
        persistentWallet: this.persistentWallet,
        unlockedMapStageIds: Array.from(this.unlockedMapStageIds),
        selectedMapStageId: this.selectedMapStageId,
        persistentBestTimeAttack: this.persistentBestTimeAttack,
        persistentBestInfinite: this.persistentBestInfinite,
        savedBrewStash: this.savedBrewStash,
        knownRegularIds: Array.from(this.knownRegularIds)
      }));
    } catch (_) {}
  }

  // =========================================================================
  // 6단계 점포 배경(맵) 조회 · 해금 · 선택
  // =========================================================================

  getCurrentMapStage() {
    return this.MAP_STAGES.find(m => m.id === this.selectedMapStageId) || this.MAP_STAGES[0];
  }

  getStageAllowedRecipes(stageId = this.selectedMapStageId) {
    const stage = this.MAP_STAGES.find(m => m.id === stageId) || this.MAP_STAGES[0];
    const allRecipes = this.recipeBook ? this.recipeBook.getAllRecipes() : [];
    const extraSet = new Set(stage.extraRecipeIds || []);
    return allRecipes.filter(r => {
      const step = Number(r.step_id) || 1;
      return step <= stage.maxRecipeStep || extraSet.has(Number(r.recipe_id));
    });
  }

  getMapStagesWithStatus() {
    return this.MAP_STAGES.map(stage => {
      const unlocked = this.unlockedMapStageIds.has(stage.id);
      const selected = this.selectedMapStageId === stage.id;
      const allowedRecipes = this.getStageAllowedRecipes(stage.id);
      return {
        ...stage,
        unlocked,
        selected,
        allowedRecipeCount: allowedRecipes.length
      };
    });
  }

  unlockMapStage(stageId) {
    const stage = this.MAP_STAGES.find(m => m.id === stageId);
    if (!stage) return { ok: false, message: '존재하지 않는 점포입니다.' };
    if (this.unlockedMapStageIds.has(stageId)) {
      this.selectedMapStageId = stageId;
      this.savePersistentData();
      return { ok: true, alreadyUnlocked: true, stage };
    }
    if (this.persistentWallet < stage.unlockCost) {
      this.audio?.playFail?.();
      return {
        ok: false,
        message: `자금이 부족합니다! (필요: ${stage.unlockCost.toLocaleString()}원 / 보유: ${this.persistentWallet.toLocaleString()}원)`
      };
    }

    this.persistentWallet -= stage.unlockCost;
    this.unlockedMapStageIds.add(stageId);
    this.selectedMapStageId = stageId;
    this.savePersistentData();
    this.audio?.playSuccess?.();

    return {
      ok: true,
      stage,
      remainingWallet: this.persistentWallet
    };
  }

  selectMapStage(stageId) {
    const stage = this.MAP_STAGES.find(m => m.id === stageId);
    if (!stage) return { ok: false, message: '존재하지 않는 점포입니다.' };
    if (!this.unlockedMapStageIds.has(stageId)) {
      return { ok: false, message: '아직 해금되지 않은 점포입니다.' };
    }
    this.selectedMapStageId = stageId;
    this.savePersistentData();
    return { ok: true, stage };
  }

  /**
   * 일반 주조실(탭 1)에서 조합을 완성했을 때도 타이쿤 재고에 +1개씩 쌓이도록 연동!
   */
  addCraftedFromMainBrewery() {
    // 무한모드 및 타임어택은 항상 초기 재고 0개에서 시작합니다.
  }

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
   * 1원 단위 정교한 가격 계산 공식 (점포 단계별 배율 priceMultiplier 반영)
   */
  calculateOrderPrice(recipeId, orderType = 'NORMAL', combo = 0, wave = 1) {
    const rec = this.recipeBook.getRecipe(recipeId);
    const items = this.recipeBook.getRecipeItems(recipeId);
    if (!rec || !items) return 15;

    const sumRatio = items.reduce((acc, it) => acc + (Number(it.ratio) || 1), 0);
    const slotCount = items.length;

    let craftedSubIngCount = 0;
    for (const it of items) {
      if (!this.recipeBook.isLeafIngredient(it.ingredient_id)) {
        craftedSubIngCount += 1;
      }
    }

    // 1) 기본 원가
    const baseMaterialValue = (sumRatio * 7) + (slotCount * 5) + (craftedSubIngCount * 9);

    // 2) 레시피 난이도 배율
    let diffMultiplier = 1.0;
    if (rec.difficulty === 'NORMAL') diffMultiplier = 1.38;
    else if (rec.difficulty === 'MASTER') diffMultiplier = 1.85;
    else if (slotCount >= 3) diffMultiplier = 1.22;

    // 3) 단골 기억 주문 배율
    let orderTypeMultiplier = 1.0;
    let specialFlatBonus = 0;
    if (orderType === 'MEMORY') {
      orderTypeMultiplier = 1.55;
      specialFlatBonus = 23;
    }

    // 4) 현재 선택된 점포(배경) 프리미엄 배율
    const stage = this.getCurrentMapStage();
    const stageMultiplier = stage ? (stage.priceMultiplier || 1.0) : 1.0;

    // 5) 웨이브 & 콤보 프리미엄
    const waveBonus = Math.max(0, (wave - 1) * 4);
    const comboTip = Math.min(50, combo * 3);

    const rawPrice = ((baseMaterialValue * diffMultiplier * orderTypeMultiplier) + specialFlatBonus + waveBonus + comboTip) * stageMultiplier;
    return Math.max(12, Math.round(rawPrice));
  }

  /**
   * 새로운 타이쿤 게임 세션 초기화
   * @param {'TIME_ATTACK' | 'INFINITE'} mode
   */
  resetSession(mode = 'INFINITE') {
    const stockMap = new Map();
    this.savedBrewStash = {};

    this.session = {
      mode, // 'TIME_ATTACK' | 'INFINITE'
      status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'GAMEOVER'
      mapStageId: this.selectedMapStageId,
      lives: 3,
      maxLives: 3,
      timeLeftSec: mode === 'TIME_ATTACK' ? 180 : 0,
      elapsedSec: 0,
      servedCount: 0,
      totalEarnings: 0,
      combo: 0,
      maxCombo: 0,
      wave: 1,
      // 1인 카운터 손님 & 주문 (붕어빵 타이쿤 방식, 주문 수량 x1 고정)
      activeCustomer: null,
      activeOrder: null,
      // 카운터 중앙 접시 위에 현재 올려진 완성품 스톡 키 (없으면 null)
      platedStockKey: null,
      // 타이쿤 전용 미니 주조 가마솥 슬롯: [{ baseId, detailId, count }]
      potSlots: [],
      // [📦 재고] 탭에 보관된 완성품 재고: Map<stockKey, count>
      stockMap,
      // 이번 세션에서 방문한 손님 ID -> 방문 횟수 & 해당 손님이 이번 점포에서 시킨 고정 메뉴 ID
      sessionCustomerVisits: new Map(),
      customerSessionRecipeMap: new Map(),
      lastLogMessage: '🏮 카운터 영업 준비가 완료되었습니다! 조합해서 접시에 올리고 종을 울려 서빙하세요!'
    };
    return this.session;
  }

  startGame(mode) {
    this.resetSession(mode);
    this.session.status = 'PLAYING';
    this.session.mapStageId = this.selectedMapStageId;
    const stage = this.getCurrentMapStage();
    this.session.lastLogMessage = `${stage.icon} [${stage.name}] 영업 시작! 조합을 완성해 접시에 올리고 오른쪽 종(🛎️)을 치세요!`;

    this._spawnCounterCustomer();
  }

  /**
   * 현재 서빙 횟수(servedCount)에 따른 무한 난이도 웨이브(Wave) 계산
   */
  getDifficultyProfile() {
    const sc = this.session ? this.session.servedCount : 0;
    const wave = Math.floor(sc / 3) + 1;
    if (this.session) {
      this.session.wave = Math.max(this.session.wave, wave);
    }

    const stage = this.getCurrentMapStage();
    const stageCeiling = stage ? stage.maxRecipeStep : 2;

    if (wave === 1) {
      return {
        wave: 1,
        maxRecipeStep: Math.min(stageCeiling, 2),
        probMemory: 0.0
      };
    } else if (wave === 2) {
      return {
        wave: 2,
        maxRecipeStep: Math.min(stageCeiling, 4),
        probMemory: 0.22
      };
    } else if (wave === 3) {
      return {
        wave: 3,
        maxRecipeStep: Math.min(stageCeiling, 5),
        probMemory: 0.35
      };
    } else if (wave === 4) {
      return {
        wave: 4,
        maxRecipeStep: Math.min(stageCeiling, 6),
        probMemory: 0.45
      };
    } else {
      const extra = Math.min(0.20, (wave - 5) * 0.05);
      return {
        wave,
        maxRecipeStep: stageCeiling,
        probMemory: Math.min(0.65, 0.45 + extra)
      };
    }
  }

  /**
   * 카운터에 찾아올 손님 1명과 주문(x1) 생성
   */
  _spawnCounterCustomer() {
    if (!this.session) return null;

    const profile = this.getDifficultyProfile();
    const stage = this.getCurrentMapStage();
    const stageAllowedRecipes = this.getStageAllowedRecipes(stage.id);
    const stageAllowedIds = new Set(stageAllowedRecipes.map(r => Number(r.recipe_id)));
    const extraIds = new Set(stage.extraRecipeIds || []);

    // 현재 웨이브 단계에 맞는 레시피 후보군 (해당 점포 허용 범위 내)
    const waveAllowedRecipes = stageAllowedRecipes.filter(r => {
      const step = Number(r.step_id) || 1;
      return step <= profile.maxRecipeStep || extraIds.has(Number(r.recipe_id));
    });
    const recipePool = waveAllowedRecipes.length > 0 ? waveAllowedRecipes : stageAllowedRecipes;

    const allCustomers = this.customerPool.getAllCustomers();
    const prevCustId = this.session.activeCustomer?.id || null;
    const candidates = allCustomers.filter(c => c.id !== prevCustId);
    const availableCustomers = candidates.length > 0 ? candidates : allCustomers;

    // 이미 이번 세션에 방문해 시그니처 주문을 남긴 손님 중 기억 주문 후보
    const visitedCandidates = availableCustomers.filter(
      c => (this.session.sessionCustomerVisits.get(c.id) || 0) >= 1 &&
           this.session.customerSessionRecipeMap.has(c.id)
    );

    let chosenCustomer = null;
    let chosenRecipeId = null;
    let orderType = 'NORMAL';

    const roll = Math.random();
    if (visitedCandidates.length > 0 && roll < profile.probMemory) {
      chosenCustomer = visitedCandidates[Math.floor(Math.random() * visitedCandidates.length)];
      chosenRecipeId = this.session.customerSessionRecipeMap.get(chosenCustomer.id);
      orderType = 'MEMORY';
    } else {
      // 현재 점포 허용 레시피가 기본 선호 레시피인 손님 우선, 혹은 점포 메뉴 풀에서 배정
      const stageMatchedCusts = availableCustomers.filter(c => stageAllowedIds.has(Number(c.preferredRecipeId)));
      const custPool = (stageMatchedCusts.length > 0 && Math.random() < 0.7) ? stageMatchedCusts : availableCustomers;
      chosenCustomer = custPool[Math.floor(Math.random() * custPool.length)];

      if (this.session.customerSessionRecipeMap.has(chosenCustomer.id)) {
        chosenRecipeId = this.session.customerSessionRecipeMap.get(chosenCustomer.id);
      } else if (stageAllowedIds.has(Number(chosenCustomer.preferredRecipeId)) && Math.random() < 0.65) {
        chosenRecipeId = Number(chosenCustomer.preferredRecipeId);
      } else if (recipePool.length > 0) {
        const pickedRec = recipePool[Math.floor(Math.random() * recipePool.length)];
        chosenRecipeId = Number(pickedRec.recipe_id);
      } else {
        chosenRecipeId = Number(chosenCustomer.preferredRecipeId) || 5;
      }

      this.session.customerSessionRecipeMap.set(chosenCustomer.id, chosenRecipeId);
      orderType = 'NORMAL';
    }

    const order = this._createOrderForCustomer(chosenCustomer, chosenRecipeId, orderType, profile.wave);
    this.session.activeCustomer = chosenCustomer;
    this.session.activeOrder = order;

    this.knownRegularIds.add(chosenCustomer.id);
    this.savePersistentData();

    return { customer: chosenCustomer, order };
  }

  _createOrderForCustomer(customer, recipeId, orderType, wave) {
    const rId = Number(recipeId) || Number(customer.preferredRecipeId) || 5;
    const rec = this.recipeBook.getRecipe(rId);
    const recipeName = rec ? this.brandResolver.resolveName(rec) : '소주';
    const requiredStockKey = this.buildStockKey(rId);
    const price = this.calculateOrderPrice(rId, orderType, this.session.combo, wave);

    const maxPatienceSec = Math.max(22, 42 - (wave - 1) * 2);

    return {
      orderId: 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      orderType,
      quantity: 1, // 손님 1명당 주문 개수 무조건 1개 (x1)
      recipeId: rId,
      recipeName,
      requiredStockKey,
      price,
      maxPatienceSec,
      patienceSec: maxPatienceSec
    };
  }

  /**
   * 이전 버전 호환용 메서드 (자동 착석 호출 시 카운터 손님이 없으면 생성)
   */
  autoSeatAvailableTables() {
    if (!this.session || this.session.status !== 'PLAYING') return;
    if (!this.session.activeCustomer || !this.session.activeOrder) {
      this._spawnCounterCustomer();
    }
  }

  /**
   * 카운터 손님의 대기시간(Patience) 실시간 감소 및 타임아웃 처리
   */
  tickPatience(dtSec = 1) {
    if (!this.session || this.session.status !== 'PLAYING') return { expiredCount: 0, isGameOver: false };
    const cust = this.session.activeCustomer;
    const ord = this.session.activeOrder;
    if (!cust || !ord) return { expiredCount: 0, isGameOver: false };

    ord.patienceSec = Math.max(0, (ord.patienceSec || 0) - dtSec);
    if (ord.patienceSec > 0) {
      return { expiredCount: 0, isGameOver: false };
    }

    // 대기시간 초과!
    const custName = cust.name;
    this.session.combo = 0;
    this.audio?.playFail?.();

    if (this.session.mode === 'INFINITE') {
      this.session.lives -= 1;
      this.session.lastLogMessage = `⏰ [${custName}] 손님이 기다리다 화가 나서 돌아갔습니다! (남은 목숨: ${'❤️'.repeat(Math.max(0, this.session.lives))})`;
      if (this.session.lives <= 0) {
        this.session.status = 'GAMEOVER';
        return { expiredCount: 1, isGameOver: true };
      }
    } else {
      this.session.timeLeftSec = Math.max(0, this.session.timeLeftSec - 5);
      this.session.lastLogMessage = `⏰ [${custName}] 대기시간 초과! (-5초 페널티)`;
      if (this.session.timeLeftSec <= 0) {
        this.session.status = 'GAMEOVER';
        return { expiredCount: 1, isGameOver: true };
      }
    }

    this._spawnCounterCustomer();
    return { expiredCount: 1, isGameOver: false };
  }

  // =========================================================================
  // 타이쿤 전용 주조 가마솥 & 중앙 접시(Plate) <-> [📦 재고] 연동
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

  previewTycoonPotMatch() {
    if (!this.session || this.session.potSlots.length < 2) return null;
    const slots = this.session.potSlots;

    const preferredRecipeId = this.session.activeOrder?.recipeId || null;

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
   * [핵심 1] [⚗️조합] 버튼 클릭 시:
   * - 완성된 조합템이 카운터 중앙 접시(platedStockKey) 위로 바로 올라갑니다!
   * - 만약 접시 위에 이미 다른 아이템이 올려져 있었다면, 기존 아이템은 자동으로 [📦재고](stockMap)로 들어갑니다.
   */
  craftToPlate() {
    const preview = this.previewTycoonPotMatch();
    if (!preview) {
      this.audio?.playFail?.();
      return {
        ok: false,
        message: '일치하는 레시피가 없습니다! 재료와 비율을 확인해주세요.'
      };
    }

    let movedPrevToStock = null;
    if (this.session.platedStockKey) {
      const prevKey = this.session.platedStockKey;
      const prevCnt = this.session.stockMap.get(prevKey) || 0;
      this.session.stockMap.set(prevKey, prevCnt + 1);
      this.savedBrewStash[prevKey] = Math.min(99, (this.savedBrewStash[prevKey] || 0) + 1);
      movedPrevToStock = prevKey;
    }

    this.session.platedStockKey = preview.stockKey;
    this.savePersistentData();
    this.clearTycoonPot();
    this.audio?.playSuccess?.();

    const label = preview.recipeName;
    this.session.lastLogMessage = `🍽️ [${label}] 완성! 중앙 접시 위에 올려졌습니다. 오른쪽 종(🛎️)을 눌러 서빙하세요!`;

    return {
      ok: true,
      crafted: preview,
      platedStockKey: preview.stockKey,
      movedPrevToStock,
      label
    };
  }

  // 기존 호출부 호환용 별칭
  craftToStockpile() {
    return this.craftToPlate();
  }

  /**
   * [핵심 2] 접시 위의 아이템을 터치하여 [📦 재고] 탭으로 보관하기
   */
  storePlateToStock() {
    if (!this.session || !this.session.platedStockKey) {
      return { ok: false, message: '현재 접시 위에 올려진 음료/술이 없습니다.' };
    }

    const stockKey = this.session.platedStockKey;
    const cur = this.session.stockMap.get(stockKey) || 0;
    const newCount = cur + 1;
    this.session.stockMap.set(stockKey, newCount);
    this.savedBrewStash[stockKey] = Math.min(99, (this.savedBrewStash[stockKey] || 0) + 1);
    this.session.platedStockKey = null;
    this.savePersistentData();

    const meta = this.getStockItemDisplayMeta(stockKey);
    const label = meta ? meta.recipeName : '완성품';
    this.session.lastLogMessage = `📦 접시 위의 [${label}]을(를) [📦재고]에 보관했습니다! (보유: ${newCount}개)`;

    return {
      ok: true,
      storedStockKey: stockKey,
      label,
      newCount
    };
  }

  /**
   * [핵심 3] [📦 재고] 탭의 아이템을 터치하여 카운터 중앙 접시 위로 올리기
   * - 만약 접시 위에 이미 다른 아이템이 있으면 서로 맞교환(기존 접시 아이템은 [📦재고]로 복귀)합니다.
   */
  moveStockToPlate(stockKey) {
    if (!this.session) return { ok: false, message: '세션이 없습니다.' };
    const availableCount = this.session.stockMap.get(stockKey) || 0;
    if (availableCount <= 0) {
      return { ok: false, message: '해당 아이템의 재고가 없습니다.' };
    }

    // 선택한 재고 1개 차감
    if (availableCount <= 1) {
      this.session.stockMap.delete(stockKey);
    } else {
      this.session.stockMap.set(stockKey, availableCount - 1);
    }
    if (this.savedBrewStash[stockKey] > 0) {
      this.savedBrewStash[stockKey] -= 1;
      if (this.savedBrewStash[stockKey] <= 0) delete this.savedBrewStash[stockKey];
    }

    // 기존에 접시에 있던 아이템이 있으면 재고로 복귀
    let swappedBackKey = null;
    if (this.session.platedStockKey) {
      swappedBackKey = this.session.platedStockKey;
      const prevCnt = this.session.stockMap.get(swappedBackKey) || 0;
      this.session.stockMap.set(swappedBackKey, prevCnt + 1);
      this.savedBrewStash[swappedBackKey] = Math.min(99, (this.savedBrewStash[swappedBackKey] || 0) + 1);
    }

    this.session.platedStockKey = stockKey;
    this.savePersistentData();

    const meta = this.getStockItemDisplayMeta(stockKey);
    const label = meta ? meta.recipeName : '완성품';
    this.session.lastLogMessage = `🍽️ [📦재고]에서 [${label}]을(를) 꺼내 중앙 접시 위에 올렸습니다!`;

    return {
      ok: true,
      platedStockKey: stockKey,
      swappedBackKey,
      label
    };
  }

  /**
   * [핵심 4] 오른쪽 종(🛎️) 이미지를 터치했을 때:
   * - 접시(platedStockKey) 위에 올려진 조합템을 현재 카운터 손님에게 서빙합니다!
   */
  ringBellToServe() {
    if (!this.session || this.session.status !== 'PLAYING') {
      return { ok: false, message: '현재 영업 중이 아닙니다.' };
    }

    if (!this.session.platedStockKey) {
      return {
        ok: false,
        emptyPlate: true,
        message: '접시가 비어 있습니다! 조합하거나 [📦재고]에서 꺼내 접시 위에 먼저 올려주세요.'
      };
    }

    const cust = this.session.activeCustomer;
    const order = this.session.activeOrder;
    if (!cust || !order) {
      return { ok: false, message: '현재 주문 대기 중인 손님이 없습니다!' };
    }

    const servedStockKey = this.session.platedStockKey;
    this.session.platedStockKey = null;

    const isCorrect = (servedStockKey === order.requiredStockKey);

    if (isCorrect) {
      this.session.servedCount += 1;
      this.session.combo += 1;
      if (this.session.combo > this.session.maxCombo) {
        this.session.maxCombo = this.session.combo;
      }

      const earned = order.price;
      this.session.totalEarnings += earned;
      this.persistentWallet += earned;

      const prevVisits = this.session.sessionCustomerVisits.get(cust.id) || 0;
      this.session.sessionCustomerVisits.set(cust.id, prevVisits + 1);
      this.knownRegularIds.add(cust.id);

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

      const servedLabel = order.recipeName;
      this.session.lastLogMessage = `🛎️ 땡~! [${cust.name}] 손님에게 [${servedLabel}] 서빙 성공! +${earned.toLocaleString()}원 (${this.session.combo}🔥)`;

      this._spawnCounterCustomer();

      return {
        ok: true,
        isCorrect: true,
        earned,
        customer: cust,
        order,
        servedStockKey
      };
    } else {
      // 오답 서빙!
      this.session.combo = 0;
      const expectedLabel = order.recipeName;

      if (this.session.mode === 'INFINITE') {
        this.session.lives -= 1;
        this.session.lastLogMessage = `💔 [주문 실수!] ${cust.name} 손님이 원한 건 [${expectedLabel}]였습니다! (남은 목숨: ${'❤️'.repeat(Math.max(0, this.session.lives))})`;

        if (this.session.lives <= 0) {
          this.session.status = 'GAMEOVER';
          return {
            ok: true,
            isCorrect: false,
            isGameOver: true,
            expectedLabel,
            customer: cust,
            order
          };
        }
        this._spawnCounterCustomer();
      } else {
        this.session.timeLeftSec = Math.max(0, this.session.timeLeftSec - 5);
        this.session.lastLogMessage = `⚠️ [서빙 실수! -5초] ${cust.name} 손님이 원한 건 [${expectedLabel}]였습니다!`;
        if (this.session.timeLeftSec <= 0) {
          this.session.status = 'GAMEOVER';
        } else {
          this._spawnCounterCustomer();
        }
      }

      return {
        ok: true,
        isCorrect: false,
        isGameOver: this.session.status === 'GAMEOVER',
        expectedLabel,
        customer: cust,
        order
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
