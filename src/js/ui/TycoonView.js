window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 붕어빵 타이쿤 스타일 카운터·접시·서비스 벨 & 6단계 배경 뷰
 *
 * [레이아웃 & UX 핵심 구조]
 * 1. 화면 스크롤 제거 (1개 모바일 뷰포트에 100vh 고정):
 *    - 인게임 진행 중(`status === 'PLAYING'`)에는 하단 글로벌 탭바(`.tab-bar`) 및 상단 글로벌 헤더를 숨겨
 *      모바일 1화면(100dvh) 전체를 타이쿤 작업 영역으로 온전히 확보합니다.
 * 2. 상단 45% (붕어빵 타이쿤 스타일 1인 카운터 뷰):
 *    - 현재 선택된 점포 배경(`bg_stage_1.jpg` ~ `bg_stage_6.jpg`)이 카운터 바와 중앙 접시 위치에 맞춰 표시됩니다.
 *    - 카운터 뒤 중앙에 손님 1명이 등장하며, 말풍선 안에 [요구 주류 아이콘 x1 + 가격 + 대기시간 게이지 바]가 표시됩니다.
 *    - 카운터 중앙 접시(Plate): 하단에서 [⚗️조합]을 누르면 완성된 술/음료가 바로 중앙 접시 위로 올라갑니다.
 *      접시 위 아이템을 터치하면 [📦재고] 탭으로 보관할 수 있습니다.
 *    - 카운터 오른쪽 서비스 벨(🛎️ 종 모양 그래픽): 버튼이 아닌 실제 데스크 벨 이미지를 배치하며,
 *      종 위를 터치하면 "땡~!" 종소리가 울리면서 접시 위의 조합템을 손님에게 서빙합니다!
 * 3. 하단 55% (주조대 & [📦재고] 연동):
 *    - 가마솥 슬롯 + [⚗️조합]/[비우기] + [📦재고] 탭 및 재료 카테고리 탭.
 *    - [📦재고] 탭에서 아이템을 터치하면 카운터 중앙 접시 위로 즉시 올라옵니다.
 *    - 재고에 있는 제품이 재료에도 있으면 재료 카드에 에메랄드색 재고 배지(`.stock-count-badge`)로 동기화 표시됩니다.
 */
class TycoonView {
  constructor(containerId, { app, config, recipeBook, inventory, brandResolver, pickerRegistry, audio }) {
    this.containerId = containerId;
    this.app = app;
    this.config = config;
    this.recipeBook = recipeBook;
    this.inventory = inventory;
    this.brandResolver = brandResolver;
    this.pickerRegistry = pickerRegistry;
    this.audio = audio;

    this.engine = new window.KSool.TycoonEngine({
      config,
      recipeBook,
      brandResolver,
      audio
    });

    this.selectedIngCat = 'ALCOHOL'; // 'STOCK' 또는 카테고리 ID ('ALCOHOL', 'ELEMENT', ...)
    this.timerInterval = null;
    this.activeSubModal = null; // null | 'LEADERBOARD' | 'NOTEBOOK'
    this.notebookTab = 'STAGE_MENU'; // 'STAGE_MENU' | 'CUSTOMERS'
    this.leaderboardTab = 'TIME_ATTACK';
    this.isSubmittingRank = false;
    this.hasSubmittedCurrentGame = false;
    this._bellRingAnimActive = false;
  }

  onLeaveTab() {
    this._stopTimerLoop();
    this.audio?.stopTycoonBgm?.();
    this._syncGlobalTabBarVisibility(false);
  }

  _syncGlobalTabBarVisibility(isPlayingInTycoon) {
    const isTycoonTabActive = this.app && this.app.currentTab === 'tycoon';
    const shouldHideGlobalBars = Boolean(isTycoonTabActive && isPlayingInTycoon);

    document.body.classList.toggle('tycoon-playing-fullscreen', shouldHideGlobalBars);

    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) {
      tabBar.style.display = shouldHideGlobalBars ? 'none' : '';
    }
  }

  _startTimerLoop() {
    this._stopTimerLoop();
    this.timerInterval = setInterval(() => {
      const s = this.engine.session;
      if (!s || s.status !== 'PLAYING') return;

      s.elapsedSec += 1;

      // 1) 타임어택 전체 제한시간 감소
      if (s.mode === 'TIME_ATTACK') {
        s.timeLeftSec = Math.max(0, s.timeLeftSec - 1);
        const timerEl = document.getElementById('tycoon-live-timer');
        if (timerEl) {
          timerEl.textContent = this._formatSeconds(s.timeLeftSec);
          timerEl.classList.toggle('urgent', s.timeLeftSec <= 20);
        }
        if (s.timeLeftSec <= 0) {
          s.status = 'GAMEOVER';
          this.audio?.stopTycoonBgm?.();
          this.audio?.playSuccess?.();
          this._stopTimerLoop();
          this.render();
          return;
        }
      }

      // 2) 카운터 손님 대기시간 게이지(Patience) 실시간 감소
      const prevPct = s.activeOrder
        ? Math.round(((s.activeOrder.patienceSec || 0) / (s.activeOrder.maxPatienceSec || 40)) * 100)
        : 100;

      const tickRes = this.engine.tickPatience(1);
      if (tickRes.isGameOver || tickRes.expiredCount > 0) {
        if (tickRes.isGameOver) {
          this.audio?.stopTycoonBgm?.();
          this._stopTimerLoop();
        } else {
          this.app?.showToast?.('⏰ 손님이 기다리다 화가 나서 돌아갔습니다!');
        }
        this.render();
        return;
      }

      const curPct = s.activeOrder
        ? Math.round(((s.activeOrder.patienceSec || 0) / (s.activeOrder.maxPatienceSec || 40)) * 100)
        : 100;

      // 손님 표정이 일반 -> 화남(💢, 30% 이하)으로 바뀔 때는 아바타 표정 갱신을 위해 리렌더
      if ((prevPct > 30 && curPct <= 30) || (prevPct > 55 && curPct <= 55)) {
        this.render();
        return;
      }

      this._updatePatienceBarInDom();
    }, 1000);
  }

  _stopTimerLoop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _updatePatienceBarInDom() {
    const s = this.engine.session;
    if (!s || s.status !== 'PLAYING' || !s.activeOrder) return;

    const fillEl = document.querySelector('[data-counter-gauge-fill="1"]');
    const secEl = document.querySelector('[data-counter-gauge-sec="1"]');
    const bubbleEl = document.querySelector('.counter-order-bubble');
    if (!fillEl) return;

    const maxP = s.activeOrder.maxPatienceSec || 40;
    const curP = Math.max(0, s.activeOrder.patienceSec || 0);
    const pct = Math.max(0, Math.min(100, Math.round((curP / maxP) * 100)));

    fillEl.style.width = `${pct}%`;
    fillEl.classList.toggle('warn', pct <= 55 && pct > 30);
    fillEl.classList.toggle('danger', pct <= 30);

    if (secEl) {
      secEl.textContent = `${Math.ceil(curP)}s`;
    }
    if (bubbleEl) {
      bubbleEl.classList.toggle('urgent-bubble', pct <= 30);
    }
  }

  _formatSeconds(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const s = this.engine.session;
    const isPlaying = s.status === 'PLAYING';
    this._syncGlobalTabBarVisibility(isPlaying);

    if (s.status === 'LOBBY') {
      container.innerHTML = `
        <div class="tycoon-shell lobby-mode">
          ${this._renderTopHud(s)}
          <div class="tycoon-lobby-body">
            ${this._renderLobbyScreen(s)}
          </div>
          ${this.activeSubModal ? this._renderSubModal(s) : ''}
        </div>
      `;
      this._bindEvents(container);
      return;
    }

    if (s.status === 'GAMEOVER') {
      container.innerHTML = `
        <div class="tycoon-shell gameover-mode">
          ${this._renderTopHud(s)}
          <div class="tycoon-lobby-body">
            ${this._renderGameOverScreen(s)}
          </div>
          ${this.activeSubModal ? this._renderSubModal(s) : ''}
        </div>
      `;
      this._bindEvents(container);
      return;
    }

    // [인게임 PLAYING 모드: 100vh 노스크롤 고정 · 상단 45% 카운터 씬 / 하단 55% 주조대]
    container.innerHTML = `
      <div class="tycoon-shell playing-100vh">
        <!-- [상단 45%] 붕어빵 타이쿤 스타일 카운터 씬 (배경 + 1인 손님 & 말풍선 + 중앙 접시 + 오른쪽 서비스 종) -->
        <section class="tycoon-top-45">
          ${this._renderTopHud(s)}
          ${this._renderCounterScene(s)}
        </section>

        <!-- [하단 55%] 주조대 (가마솥 슬롯 + [재고/재료 카테고리 탭] + 선택 그리드) -->
        <section class="tycoon-bottom-55">
          ${this._renderCompactPotRow(s)}
          ${this._renderCompactIngredientsArea(s)}
        </section>

        ${this.activeSubModal ? this._renderSubModal(s) : ''}
      </div>
    `;

    this._bindEvents(container);
  }

  _renderTopHud(s) {
    const isPlaying = s.status === 'PLAYING';
    const stage = this.engine.getCurrentMapStage();
    const isBgmOn = this.audio ? (this.audio.isBgmEnabled && !this.audio.isMutedState()) : true;
    const statusRightHtml = s.mode === 'TIME_ATTACK'
      ? `<span class="hud-pill timer-pill" id="tycoon-live-timer">${this._formatSeconds(s.timeLeftSec)}</span>`
      : `<span class="hud-pill lives-pill">${'❤️'.repeat(Math.max(0, s.lives))}${'🖤'.repeat(Math.max(0, s.maxLives - s.lives))}</span>`;

    return `
      <header class="tycoon-compact-hud">
        <div class="hud-left">
          <span class="hud-stage-pill" title="${stage.name} (단가 x${stage.priceMultiplier})">${stage.icon} ${stage.name}</span>
          <span class="hud-stat">🍶<b>${s.servedCount}</b></span>
          <span class="hud-stat gold">💰<b>${(isPlaying ? s.totalEarnings : this.engine.persistentWallet).toLocaleString()}</b>원</span>
          ${isPlaying && s.combo > 1 ? `<span class="hud-combo">${s.combo}🔥</span>` : ''}
          ${isPlaying ? statusRightHtml : ''}
        </div>
        <div class="hud-right">
          <button type="button" class="hud-icon-btn ${isBgmOn ? 'bgm-on' : 'bgm-off'}" id="tycoon-toggle-bgm-btn" title="주막 배경음악 켜기/끄기">${isBgmOn ? '🎵' : '🔇'}</button>
          <button type="button" class="hud-icon-btn" id="tycoon-open-notebook-btn" title="메뉴판 & 단골 수첩">📖</button>
          <button type="button" class="hud-icon-btn" id="tycoon-open-rank-btn" title="Top 100 랭킹">🏆</button>
          ${isPlaying
            ? `<button type="button" class="hud-icon-btn exit-btn" id="tycoon-back-lobby-btn" title="로비로 나가기">✕</button>`
            : ''
          }
        </div>
      </header>
    `;
  }

  /**
   * [상단 45% 카운터 씬]
   * - 배경: 현재 선택된 점포 이미지 (`./assets/tycoon/bg_stage_1.jpg` ~ `bg_stage_6.jpg`)
   * - 중앙 뒤편: 찾아온 손님 1명 아바타 + 붕어빵 타이쿤 스타일 말풍선 (요구 주류 아이콘 x1 + 가격 + 대기시간 게이지)
   * - 카운터 왼쪽: 메뉴판 핫스팟 (터치 시 점포 메뉴판/단골 수첩 오픈)
   * - 카운터 정중앙: 접시(Center Serving Plate) 오버레이 (조합 완성품이 올라오며, 터치 시 [📦재고]로 이동)
   * - 카운터 오른쪽: 데스크 서비스 벨(🛎️ 종 모양 이미지, 터치 시 "땡~!" 소리와 함께 손님에게 서빙)
   */
  _renderCounterScene(s) {
    const stage = this.engine.getCurrentMapStage();
    const cust = s.activeCustomer;
    const ord = s.activeOrder;

    // 1) 손님 & 주문 말풍선 렌더링
    let customerZoneHtml = '';
    if (cust && ord) {
      const maxP = ord.maxPatienceSec || 40;
      const curP = Math.max(0, ord.patienceSec ?? maxP);
      const pct = Math.max(0, Math.min(100, Math.round((curP / maxP) * 100)));
      const mood = pct <= 30 ? 'ANGRY' : (pct <= 55 ? 'WARN' : 'NORMAL');
      const gaugeStateCls = pct <= 30 ? 'danger' : (pct <= 55 ? 'warn' : '');

      const avatarSvg = this.engine.customerPool.renderCustomerAvatarSvg(cust, 76, mood);
      const rec = this.recipeBook.getRecipe(ord.recipeId);

      const isMemory = (ord.orderType === 'MEMORY');
      const isRevealed = Boolean(this._memoryHintRevealedForOrderId?.[ord.orderId]);

      let drinkIconHtml = '';
      let drinkShortName = '';
      if (isMemory && !isRevealed) {
        drinkIconHtml = `<span class="order-mystery-icon" data-reveal-memory="${ord.orderId}" title="터치하면 단골 주류 확인">❓</span>`;
        drinkShortName = '단골술(터치)';
      } else {
        drinkIconHtml = rec
          ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 34) : `<span style="font-size:1.6rem;">${rec.emoji || '🍶'}</span>`)
          : '🍶';
        drinkShortName = ord.recipeName;
      }

      customerZoneHtml = `
        <div class="counter-customer-stage">
          <!-- 손님 캐릭터 (카운터 너머 중앙) -->
          <div class="counter-cust-figure" id="tycoon-counter-customer" title="${cust.name} (${cust.title})">
            <div class="counter-cust-avatar-wrap">
              ${avatarSvg}
            </div>
            <div class="counter-cust-name-tag">${cust.name}</div>
          </div>

          <!-- 붕어빵 타이쿤 스타일 주문 말풍선 (x1 고정 + 대기시간 게이지) -->
          <div class="counter-order-bubble ${pct <= 30 ? 'urgent-bubble' : ''}" id="tycoon-order-bubble" title="터치하면 가마솥에 레시피 재료가 자동 세팅됩니다!">
            <div class="bubble-top-row">
              <div class="bubble-drink-icon">
                ${drinkIconHtml}
              </div>
              <div class="bubble-drink-meta">
                <div class="bubble-qty-row">
                  <span class="bubble-drink-name">${drinkShortName}</span>
                  <span class="bubble-qty-badge">x1</span>
                </div>
                <div class="bubble-price-row">
                  <span class="bubble-price-tag">💰 ${ord.price.toLocaleString()}원</span>
                  <span class="bubble-sec-tag" data-counter-gauge-sec="1">${Math.ceil(curP)}s</span>
                </div>
              </div>
            </div>
            <div class="bubble-patience-track">
              <div class="bubble-patience-fill ${gaugeStateCls}" data-counter-gauge-fill="1" style="width:${pct}%;"></div>
            </div>
          </div>
        </div>
      `;
    }

    // 2) 카운터 중앙 접시(Center Serving Plate) 렌더링
    let plateContentHtml = '';
    const platedKey = s.platedStockKey;
    const isOrderMatchOnPlate = Boolean(platedKey && ord && platedKey === ord.requiredStockKey);

    if (platedKey) {
      const meta = this.engine.getStockItemDisplayMeta(platedKey);
      const platedIcon = meta && meta.recipe
        ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(meta.recipe, 40) : `<span style="font-size:1.9rem;">${meta.recipe.emoji || '🍶'}</span>`)
        : '🍶';
      const platedName = meta ? meta.recipeName : '완성품';

      plateContentHtml = `
        <div class="counter-plate-zone has-item ${isOrderMatchOnPlate ? 'match-glow' : ''}"
             id="tycoon-center-plate-btn"
             title="터치하면 [📦재고] 탭으로 보관합니다">
          <div class="plated-drink-visual">
            ${platedIcon}
          </div>
          <span class="plated-drink-label">${platedName}</span>
          <span class="plate-store-hint">📦재고보관</span>
        </div>
      `;
    } else {
      plateContentHtml = `
        <div class="counter-plate-zone empty-plate" id="tycoon-center-plate-empty" title="조합을 완성하거나 [📦재고]에서 누르면 이 접시 위에 올라옵니다">
          <span class="empty-plate-hint">접시 위 대기</span>
        </div>
      `;
    }

    // 3) 카운터 오른쪽 데스크 서비스 벨 (버튼이 아닌 리얼한 황동 데스크 벨 SVG 이미지)
    const bellReadyCls = platedKey ? (isOrderMatchOnPlate ? 'bell-ready-match' : 'bell-ready-any') : '';
    const bellRingCls = this._bellRingAnimActive ? 'bell-ringing' : '';

    const serviceBellSvgHtml = `
      <div class="counter-service-bell-spot ${bellReadyCls} ${bellRingCls}"
           id="tycoon-service-bell-img"
           role="img"
           aria-label="서비스 종 (터치하면 땡 소리와 함께 손님에게 서빙)"
           title="종을 터치하면 '땡~!' 소리와 함께 접시 위의 음료를 손님에게 드립니다!">
        <div class="bell-sound-waves">
          <span class="bell-wave w1"></span>
          <span class="bell-wave w2"></span>
        </div>
        <svg class="service-bell-svg" width="66" height="58" viewBox="0 0 80 70" style="overflow:visible;">
          <defs>
            <radialGradient id="bellGoldGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="45%" stop-color="#f59e0b"/>
              <stop offset="85%" stop-color="#b45309"/>
              <stop offset="100%" stop-color="#78350f"/>
            </radialGradient>
            <linearGradient id="bellBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#1e293b"/>
              <stop offset="50%" stop-color="#475569"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <linearGradient id="bellSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f8fafc"/>
              <stop offset="60%" stop-color="#94a3b8"/>
              <stop offset="100%" stop-color="#475569"/>
            </linearGradient>
          </defs>
          <!-- 바닥 그림자 -->
          <ellipse cx="40" cy="61" rx="34" ry="7" fill="rgba(0,0,0,0.55)"/>
          <!-- 받침대(검은 금속 베이스) -->
          <path d="M10 55 Q40 50 70 55 L73 60 Q40 65 7 60 Z" fill="url(#bellBaseGrad)" stroke="#0f172a" stroke-width="1.8"/>
          <ellipse cx="40" cy="55" rx="30" ry="4.5" fill="#334155" stroke="#1e293b" stroke-width="1.2"/>
          <!-- 황동 종 돔(Dome) -->
          <path d="M14 54 C14 26, 66 26, 66 54 Z" fill="url(#bellGoldGrad)" stroke="#78350f" stroke-width="2"/>
          <!-- 종 하단 테두리 림 -->
          <ellipse cx="40" cy="54" rx="27" ry="4" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
          <!-- 종 표면 하이라이트 광택 -->
          <path d="M23 48 C23 33, 33 29, 37 28" fill="none" stroke="rgba(255,255,255,0.68)" stroke-width="3" stroke-linecap="round"/>
          <!-- 상단 타격 핀(Clapper Button) -->
          <g class="bell-top-pin">
            <rect x="37.5" y="18" width="5" height="8" rx="1.5" fill="url(#bellSilverGrad)" stroke="#1e293b" stroke-width="1.2"/>
            <ellipse cx="40" cy="17.5" rx="9" ry="3.6" fill="url(#bellSilverGrad)" stroke="#1e293b" stroke-width="1.5"/>
          </g>
        </svg>
        ${platedKey ? `<span class="bell-ting-badge">🛎️ 땡!</span>` : ''}
      </div>
    `;

    return `
      <div class="tycoon-counter-scene" style="background-image: url('${stage.bgImage}');">
        <div class="counter-scene-vignette"></div>

        <!-- 손님 & 주문 말풍선 (상단 중앙) -->
        ${customerZoneHtml}

        <!-- 카운터 테이블 위 인터랙션 레이어 (왼쪽 메뉴판 / 중앙 접시 / 오른쪽 서비스 종) -->
        <div class="counter-bar-interactive-layer">
          <!-- 왼쪽 메뉴판 핫스팟 -->
          <button type="button" class="counter-menu-hotspot" id="tycoon-counter-menu-hotspot" title="터치하면 현재 점포 메뉴판 & 단골 수첩을 엽니다">
            <span>📋 메뉴판</span>
          </button>

          <!-- 정중앙 서빙 접시 (완성품 안착 위치) -->
          ${plateContentHtml}

          <!-- 오른쪽 서비스 종 이미지 (터치 시 땡~! 서빙) -->
          ${serviceBellSvgHtml}
        </div>
      </div>
    `;
  }

  /**
   * [하단 55% - 파트 1] 가마솥 슬롯 + 조합/비우기 버튼 한 줄 배치
   */
  _renderCompactPotRow(s) {
    const potSlots = s.potSlots;
    const preview = this.engine.previewTycoonPotMatch();

    const slotsHtml = [];
    for (let i = 0; i < 4; i++) {
      const slot = potSlots[i];
      if (slot) {
        const det = slot.detailId ? this.recipeBook.getDetailIngredient(slot.detailId) : null;
        const base = this.recipeBook.getBaseIngredient(slot.baseId);
        const target = det || base;
        const name = this.brandResolver.resolveName(target);
        const icon = window.KSool?.pixelIcon ? window.KSool.pixelIcon(target, 22) : (target?.emoji || '🍶');

        slotsHtml.push(`
          <div class="cp-slot filled" data-dec-slot-idx="${i}">
            <span class="cp-icon">${icon}</span>
            <span class="cp-name">${name}</span>
            <span class="slot-count-badge">${slot.count}</span>
          </div>
        `);
      } else {
        slotsHtml.push(`
          <div class="cp-slot empty">
            <span>➕</span>
          </div>
        `);
      }
    }

    const previewLabel = preview ? `🍽️${preview.recipeName}` : '접시로 조합';

    return `
      <div class="tycoon-compact-pot-row">
        <div class="cp-slots-wrap">
          ${slotsHtml.join('')}
        </div>
        <div class="cp-actions-col">
          <button type="button" class="cp-craft-btn ${preview ? 'ready' : ''}" id="tycoon-craft-stock-btn" ${potSlots.length < 2 ? 'disabled' : ''}>
            <span>⚗️조합</span>
            <small>${previewLabel}</small>
          </button>
          <button type="button" class="cp-clear-btn" id="tycoon-clear-pot-btn">비우기</button>
        </div>
      </div>
    `;
  }

  /**
   * [하단 55% - 파트 2] 카테고리 탭 ([📦재고] 탭 포함) + 재료/재고 그리드
   */
  _renderCompactIngredientsArea(s) {
    const potSlots = s.potSlots;
    const categories = this.recipeBook.categories;
    const totalStockCount = Array.from(s.stockMap.values()).reduce((a, b) => a + b, 0);

    const stockTabHtml = `
      <button type="button" class="cat-chip tycoon-cat-chip stock-tab-chip ${this.selectedIngCat === 'STOCK' ? 'active' : ''}" data-tycoon-ing-cat="STOCK">
        📦 재고 <b class="stock-tab-cnt">${totalStockCount}</b>
      </button>
    `;

    const catChipsHtml = categories.map(c => `
      <button type="button" class="cat-chip tycoon-cat-chip ${this.selectedIngCat === c.category_id ? 'active' : ''}" data-tycoon-ing-cat="${c.category_id}">
        ${c.name}
      </button>
    `).join('');

    let gridContentHtml = '';

    if (this.selectedIngCat === 'STOCK') {
      const entries = Array.from(s.stockMap.entries()).filter(([, cnt]) => cnt > 0);
      const targetOrderKey = s.activeOrder?.requiredStockKey || null;

      if (entries.length === 0) {
        gridContentHtml = `
          <div class="tycoon-stock-empty-msg">
            📦 보관 중인 재고가 없습니다.<br/>
            <b>[⚗️조합]</b>하면 카운터 중앙 접시에 올라가며, 접시 위 음료를 터치하면 이곳 <b>[📦재고]</b>에 보관됩니다!
          </div>
        `;
      } else {
        gridContentHtml = entries.map(([stockKey, count]) => {
          const meta = this.engine.getStockItemDisplayMeta(stockKey);
          if (!meta) return '';
          const isMatch = targetOrderKey && targetOrderKey === stockKey;
          const icon = window.KSool?.pixelIcon ? window.KSool.pixelIcon(meta.recipe, 26) : (meta.recipe.emoji || '🍶');

          return `
            <div class="ing-card tycoon-compact-ing stock-item-card ${isMatch ? 'is-order-match' : ''}"
                 data-stock-tab-item="${stockKey}"
                 title="터치하면 카운터 중앙 접시 위로 올립니다!">
              <span class="stock-count-badge" title="보유 재고 수량">${count}</span>
              <span class="ing-emoji">${icon}</span>
              <span class="ing-name">${meta.recipeName}</span>
              <span class="stock-match-tag">${isMatch ? '🍽️주문일치!' : '🍽️접시올리기'}</span>
            </div>
          `;
        }).join('');
      }
    } else {
      const allIngs = Array.from(this.recipeBook.baseIngredients.values())
        .filter(ing => ing.category_id === this.selectedIngCat)
        .sort((a, b) => a.ingredient_id - b.ingredient_id);

      gridContentHtml = allIngs.map(ing => {
        const inPotCount = potSlots
          .filter(sl => sl.baseId === ing.ingredient_id)
          .reduce((acc, sl) => acc + sl.count, 0);

        const stockCount = this.engine.getStockCountForIngredient(ing.ingredient_id);

        const details = this.recipeBook.getDetailsForBase(ing.ingredient_id);
        const hasPicker = details.length > 0 && ing.picker_component && ing.picker_component !== 'NONE';
        const name = this.brandResolver.resolveName(ing);
        const icon = window.KSool?.pixelIcon ? window.KSool.pixelIcon(ing, 24) : ing.emoji;

        return `
          <div class="ing-card tycoon-compact-ing ${inPotCount > 0 ? 'in-pot' : ''} ${stockCount > 0 ? 'has-stock' : ''}" data-tycoon-base-ing="${ing.ingredient_id}">
            ${hasPicker ? `<button type="button" class="ing-picker-btn" data-tycoon-detail-picker="${ing.ingredient_id}">상세▾</button>` : ''}
            ${inPotCount > 0 ? `<span class="slot-count-badge" title="가마솥 투입 비율">${inPotCount}</span>` : ''}
            ${stockCount > 0 ? `<span class="stock-count-badge ${hasPicker ? 'shifted-left' : ''}" title="보유 재고 수량">${stockCount}</span>` : ''}
            <span class="ing-emoji">${icon}</span>
            <span class="ing-name">${name}</span>
          </div>
        `;
      }).join('');
    }

    return `
      <div class="tycoon-compact-ings-area">
        <div class="tycoon-cat-strip cat-filter-bar">
          ${stockTabHtml}
          ${catChipsHtml}
        </div>
        <div class="tycoon-ings-scroll-grid">
          ${gridContentHtml}
        </div>
      </div>
    `;
  }

  /**
   * [로비 화면] 6단계 점포 배경 해금/선택 카드 + 무한/타임어택 시작 버튼
   */
  _renderLobbyScreen(s) {
    const bestTA = this.engine.persistentBestTimeAttack;
    const bestInf = this.engine.persistentBestInfinite;
    const stashCount = Array.from(s.stockMap.values()).reduce((a, b) => a + b, 0);
    const stages = this.engine.getMapStagesWithStatus();
    const currentStage = this.engine.getCurrentMapStage();

    const stagesCardsHtml = stages.map(st => {
      const canAfford = this.engine.persistentWallet >= st.unlockCost;
      let actionBtnHtml = '';
      if (st.selected) {
        actionBtnHtml = `<button type="button" class="stage-card-btn selected" disabled>✅ 영업 중</button>`;
      } else if (st.unlocked) {
        actionBtnHtml = `<button type="button" class="stage-card-btn select" data-select-stage="${st.id}">점포 선택</button>`;
      } else {
        actionBtnHtml = `
          <button type="button" class="stage-card-btn unlock ${canAfford ? 'can-buy' : 'locked'}" data-unlock-stage="${st.id}">
            🔓 ${st.unlockCost.toLocaleString()}원 해금
          </button>
        `;
      }

      return `
        <div class="tycoon-stage-card ${st.selected ? 'is-selected' : ''} ${!st.unlocked ? 'is-locked' : ''}">
          <div class="stage-thumb" style="background-image:url('${st.bgImage}');">
            <span class="stage-num-badge">STAGE ${st.stageNum}</span>
            <span class="stage-mult-badge">단가 x${st.priceMultiplier.toFixed(2)}</span>
          </div>
          <div class="stage-info-col">
            <div class="stage-title-row">
              <span class="stage-name">${st.icon} ${st.name}</span>
              <span class="stage-recipe-cnt">메뉴 ${st.allowedRecipeCount}종</span>
            </div>
            <div class="stage-desc">${st.menuSummary}</div>
            <div class="stage-action-row">
              ${actionBtnHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="tycoon-lobby-container">
        <div class="tycoon-hero-banner" style="background-image: linear-gradient(180deg, rgba(9,13,22,0.72), rgba(9,13,22,0.92)), url('${currentStage.bgImage}'); background-size: cover; background-position: center;">
          <div class="hero-badge">${currentStage.icon} 현재 점포: ${currentStage.name} (단가 x${currentStage.priceMultiplier})</div>
          <h2>🏮 주막 타이쿤 : 길거리 노점에서 미래도시까지</h2>
          <p>조합하면 <b>중앙 접시</b>에 올라가고, 오른쪽 <b>종(🛎️)</b>을 치면 손님에게 서빙됩니다!</p>
          <div class="tycoon-wallet-pill">
            💰 보유 자산: <b>${this.engine.persistentWallet.toLocaleString()}원</b>
            <span style="margin:0 6px; opacity:0.4;">|</span>
            📦 보유 재고: <b>${stashCount}개</b>
          </div>
        </div>

        <div class="tycoon-mode-cards-grid two-cols">
          <div class="tycoon-mode-card mode-infinite-card">
            <div class="mode-card-header">
              <span class="mode-icon">♾️</span>
              <div>
                <div class="mode-name">무한 서바이벌</div>
                <div class="mode-tag">목숨 ❤️❤️❤️ · 최고 ${bestInf.servedCount}명</div>
              </div>
            </div>
            <button type="button" class="tycoon-start-btn start-infinite" data-start-mode="INFINITE">
              ♾️ 무한모드 영업 시작
            </button>
          </div>

          <div class="tycoon-mode-card mode-timeattack-card">
            <div class="mode-card-header">
              <span class="mode-icon">⏱️</span>
              <div>
                <div class="mode-name">타임어택 (180초)</div>
                <div class="mode-tag">Top 100 랭킹 · 최고 ${bestTA.servedCount}명</div>
              </div>
            </div>
            <button type="button" class="tycoon-start-btn start-timeattack" data-start-mode="TIME_ATTACK">
              ⏱️ 타임어택 영업 시작
            </button>
          </div>
        </div>

        <div class="tycoon-stage-shop-section">
          <div class="stage-shop-hdr">
            <span>🗺️ 점포 배경 해금 & 변경 (6단계)</span>
            <small>번 돈으로 상위 점포를 열면 판매 주류와 단가가 늘어납니다!</small>
          </div>
          <div class="tycoon-stages-list">
            ${stagesCardsHtml}
          </div>
        </div>
      </div>
    `;
  }

  _renderGameOverScreen(s) {
    const savedName = this.engine.leaderboard.getSavedPlayerName() || '';
    const modeLabel = s.mode === 'TIME_ATTACK' ? '⏱️ 타임어택 (180초)' : '♾️ 무한 서바이벌 모드';

    return `
      <div class="tycoon-gameover-card">
        <div class="gameover-badge">${modeLabel} 종료</div>
        <h2 class="gameover-title">🏮 오늘의 주막 정산서</h2>
        <div class="gameover-stats-grid">
          <div class="go-stat-box">
            <span class="go-label">서빙 손님</span>
            <span class="go-val sky">${s.servedCount}명</span>
          </div>
          <div class="go-stat-box">
            <span class="go-label">판매 수익</span>
            <span class="go-val gold">+${s.totalEarnings.toLocaleString()}원</span>
          </div>
          <div class="go-stat-box">
            <span class="go-label">누적 자산</span>
            <span class="go-val amber">${this.engine.persistentWallet.toLocaleString()}원</span>
          </div>
        </div>

        <div class="gameover-rank-submit-box">
          <div class="rank-submit-title">🏆 글로벌 Top 100 랭킹 등록</div>
          ${this.hasSubmittedCurrentGame
            ? `<div class="rank-submitted-done">✅ 등록 완료! 상단 [🏆] 버튼에서 순위를 확인하세요.</div>`
            : `<div class="rank-submit-form">
                 <input type="text" id="tycoon-rank-nickname" class="rank-nick-input" maxlength="12" placeholder="닉네임 (최대 12자)" value="${savedName}" />
                 <button type="button" class="rank-submit-btn" id="tycoon-submit-rank-btn" ${this.isSubmittingRank ? 'disabled' : ''}>
                   ${this.isSubmittingRank ? '등록 중...' : '🏆 등록'}
                 </button>
               </div>`
          }
        </div>

        <div class="gameover-actions">
          <button type="button" class="tycoon-start-btn start-infinite" id="tycoon-retry-btn">🔄 다시 도전</button>
          <button type="button" class="tycoon-secondary-btn" id="tycoon-go-lobby-btn">🏠 점포/로비로</button>
        </div>
      </div>
    `;
  }

  _renderSubModal() {
    if (this.activeSubModal === 'LEADERBOARD') {
      const list = this.engine.leaderboard.cachedRankings[this.leaderboardTab] || [];
      const rowsHtml = list.slice(0, 100).map((r, i) => {
        const rank = i + 1;
        const medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `${rank}위`));
        return `
          <div class="tycoon-rank-row ${rank <= 3 ? 'top-rank' : ''}">
            <span class="r-pos">${medal}</span>
            <span class="r-user">${r.badge_emoji || '🍶'} ${r.player_name}</span>
            <span class="r-served"><b>${r.served_count}</b>명</span>
            <span class="r-earn">${Number(r.total_earnings || 0).toLocaleString()}원</span>
          </div>
        `;
      }).join('');

      return `
        <div class="tycoon-submodal-overlay" id="tycoon-submodal-overlay">
          <div class="tycoon-submodal-card">
            <div class="submodal-hdr">
              <h3>🏆 글로벌 Top 100 순위</h3>
              <button type="button" class="submodal-close-btn" id="tycoon-close-submodal">✕</button>
            </div>
            <div class="submodal-tabs">
              <button type="button" class="submodal-tab ${this.leaderboardTab === 'TIME_ATTACK' ? 'active' : ''}" data-lb-tab="TIME_ATTACK">⏱️ 타임어택</button>
              <button type="button" class="submodal-tab ${this.leaderboardTab === 'INFINITE' ? 'active' : ''}" data-lb-tab="INFINITE">♾️ 무한모드</button>
            </div>
            <div class="tycoon-rank-list">
              ${rowsHtml || '<div style="padding:20px; text-align:center; color:#94a3b8;">등록된 랭킹이 없습니다.</div>'}
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeSubModal === 'NOTEBOOK') {
      const stage = this.engine.getCurrentMapStage();
      let bodyHtml = '';

      if (this.notebookTab === 'STAGE_MENU') {
        const allowedRecipes = this.engine.getStageAllowedRecipes(stage.id);
        bodyHtml = allowedRecipes.map(rec => {
          const recName = this.brandResolver.resolveName(rec);
          const recIcon = window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 24) : (rec.emoji || '🍶');
          const items = this.recipeBook.getRecipeItems(rec.recipe_id) || [];
          const formulaStr = items.map(it => {
            const det = it.detail_ingredient_id ? this.recipeBook.getDetailIngredient(it.detail_ingredient_id) : null;
            const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
            const ingName = this.brandResolver.resolveName(det || base);
            return `${ingName}×${it.ratio || 1}`;
          }).join(' + ');

          return `
            <div class="notebook-cust-card">
              <div class="nb-avatar">${recIcon}</div>
              <div class="nb-info" style="flex-direction:column; align-items:flex-start; gap:2px;">
                <div class="nb-top" style="width:100%; justify-content:space-between;">
                  <span class="nb-name">${recName}</span>
                  <span class="nb-group">Step ${rec.step_id || 1}</span>
                </div>
                <div style="font-size:0.64rem; color:#cbd5e1;">레시피: <b style="color:#fde047;">${formulaStr}</b></div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        const allCustomers = this.engine.customerPool.getAllCustomers();
        bodyHtml = allCustomers.map(c => {
          const sessionRecId = this.engine.session?.customerSessionRecipeMap?.get(c.id) || c.preferredRecipeId;
          const rec = this.recipeBook.getRecipe(sessionRecId);
          const recName = rec ? this.brandResolver.resolveName(rec) : '비전주';
          const recIcon = rec && window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 22) : (rec?.emoji || '🍶');
          const avatar = this.engine.customerPool.renderCustomerAvatarSvg(c, 42);

          return `
            <div class="notebook-cust-card">
              <div class="nb-avatar">${avatar}</div>
              <div class="nb-info">
                <div class="nb-top">
                  <span class="nb-name">${c.name}</span>
                  <span class="nb-group">${c.group}</span>
                </div>
                <div class="nb-fav">${recIcon} <b>${recName}</b></div>
              </div>
            </div>
          `;
        }).join('');
      }

      return `
        <div class="tycoon-submodal-overlay" id="tycoon-submodal-overlay">
          <div class="tycoon-submodal-card notebook-modal-card">
            <div class="submodal-hdr">
              <h3>📖 ${stage.icon} ${stage.name} 메뉴판 & 단골 수첩</h3>
              <button type="button" class="submodal-close-btn" id="tycoon-close-submodal">✕</button>
            </div>
            <div class="submodal-tabs">
              <button type="button" class="submodal-tab ${this.notebookTab === 'STAGE_MENU' ? 'active' : ''}" data-nb-tab="STAGE_MENU">📋 점포 판매 메뉴</button>
              <button type="button" class="submodal-tab ${this.notebookTab === 'CUSTOMERS' ? 'active' : ''}" data-nb-tab="CUSTOMERS">🧑 단골 손님 도감</button>
            </div>
            <div class="notebook-cust-list">
              ${bodyHtml}
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  _bindEvents(container) {
    // 1. 모드 시작
    container.querySelectorAll('[data-start-mode]').forEach(btn => {
      btn.onclick = () => {
        const mode = btn.getAttribute('data-start-mode');
        this.audio?.playTap?.();
        this.hasSubmittedCurrentGame = false;
        this._memoryHintRevealedForOrderId = {};
        this.engine.startGame(mode);
        this.audio?.startTycoonBgm?.(1);
        this._startTimerLoop();
        this.render();
      };
    });

    // 1-2. 로비 점포 배경 해금 및 선택
    container.querySelectorAll('[data-unlock-stage]').forEach(btn => {
      btn.onclick = () => {
        const stageId = btn.getAttribute('data-unlock-stage');
        const res = this.engine.unlockMapStage(stageId);
        if (!res.ok) {
          this.app?.showToast?.(`⚠️ ${res.message}`);
        } else {
          this.app?.showToast?.(`🎉 [${res.stage.name}] 해금 완료! 새로운 메뉴가 추가되었습니다!`);
        }
        this.render();
      };
    });

    container.querySelectorAll('[data-select-stage]').forEach(btn => {
      btn.onclick = () => {
        const stageId = btn.getAttribute('data-select-stage');
        const res = this.engine.selectMapStage(stageId);
        if (res.ok) {
          this.audio?.playTap?.();
          this.app?.showToast?.(`${res.stage.icon} [${res.stage.name}] 점포로 변경되었습니다.`);
          this.render();
        }
      };
    });

    // 2. 상단 HUD 아이콘 버튼 (BGM 토글 포함)
    const bgmBtn = container.querySelector('#tycoon-toggle-bgm-btn');
    if (bgmBtn) {
      bgmBtn.onclick = () => {
        if (!this.audio) return;
        const enabled = this.audio.toggleTycoonBgm();
        if (enabled && this.engine.session.status === 'PLAYING') {
          this.audio.startTycoonBgm(this.engine.session.wave || 1);
        }
        this.audio.playTap();
        this.render();
      };
    }

    const nbBtn = container.querySelector('#tycoon-open-notebook-btn');
    if (nbBtn) {
      nbBtn.onclick = () => {
        this.audio?.playTap?.();
        this.activeSubModal = 'NOTEBOOK';
        this.render();
      };
    }

    const menuHotspotBtn = container.querySelector('#tycoon-counter-menu-hotspot');
    if (menuHotspotBtn) {
      menuHotspotBtn.onclick = () => {
        this.audio?.playTap?.();
        this.notebookTab = 'STAGE_MENU';
        this.activeSubModal = 'NOTEBOOK';
        this.render();
      };
    }

    const rankBtn = container.querySelector('#tycoon-open-rank-btn');
    if (rankBtn) {
      rankBtn.onclick = async () => {
        this.audio?.playTap?.();
        this.activeSubModal = 'LEADERBOARD';
        this.render();
        await this.engine.leaderboard.fetchTop100(this.leaderboardTab);
        if (this.activeSubModal === 'LEADERBOARD') this.render();
      };
    }

    const lobbyBtn = container.querySelector('#tycoon-back-lobby-btn');
    if (lobbyBtn) {
      lobbyBtn.onclick = () => {
        this.audio?.playTap?.();
        this._stopTimerLoop();
        this.audio?.stopTycoonBgm?.();
        this.engine.session.status = 'LOBBY';
        this._syncGlobalTabBarVisibility(false);
        this.render();
      };
    }

    const closeSubBtn = container.querySelector('#tycoon-close-submodal');
    if (closeSubBtn) {
      closeSubBtn.onclick = () => {
        this.audio?.playTap?.();
        this.activeSubModal = null;
        this.render();
      };
    }

    container.querySelectorAll('[data-lb-tab]').forEach(tabBtn => {
      tabBtn.onclick = async () => {
        this.leaderboardTab = tabBtn.getAttribute('data-lb-tab');
        this.audio?.playTap?.();
        this.render();
        await this.engine.leaderboard.fetchTop100(this.leaderboardTab);
        if (this.activeSubModal === 'LEADERBOARD') this.render();
      };
    });

    container.querySelectorAll('[data-nb-tab]').forEach(tabBtn => {
      tabBtn.onclick = () => {
        this.notebookTab = tabBtn.getAttribute('data-nb-tab');
        this.audio?.playTap?.();
        this.render();
      };
    });

    // 3. 카운터 주문 말풍선 터치 (단골 기억 힌트 공개 또는 가마솥 자동 세팅)
    const orderBubble = container.querySelector('#tycoon-order-bubble');
    if (orderBubble) {
      orderBubble.onclick = (e) => {
        const peekEl = e.target.closest('[data-reveal-memory]');
        if (peekEl) {
          e.stopPropagation();
          const ordId = peekEl.getAttribute('data-reveal-memory');
          if (!this._memoryHintRevealedForOrderId) this._memoryHintRevealedForOrderId = {};
          this._memoryHintRevealedForOrderId[ordId] = true;
          this.audio?.playTap?.();
          this.render();
          return;
        }
        if (this.engine.session.activeOrder) {
          this.audio?.playTap?.();
          this._autoFillOrderToPot(this.engine.session.activeOrder);
          this.render();
        }
      };
    }

    // 4. 카운터 중앙 접시(Plate) 위 아이템 터치 -> [📦 재고] 탭으로 보관!
    const plateBtn = container.querySelector('#tycoon-center-plate-btn');
    if (plateBtn) {
      plateBtn.onclick = () => {
        const res = this.engine.storePlateToStock();
        if (res.ok) {
          this.audio?.playTap?.();
          this.app?.showToast?.(`📦 [${res.label}] 재고 보관! (보유: ${res.newCount}개)`);
          this.render();
        }
      };
    }

    // 5. 카운터 오른쪽 데스크 서비스 종(🛎️ 이미지) 터치 -> "땡~!" 종소리 + 접시 위 음료 서빙!
    const bellImg = container.querySelector('#tycoon-service-bell-img');
    if (bellImg) {
      bellImg.onclick = () => {
        this._handleBellRingServe();
      };
    }

    // 6. [📦 재고] 탭의 아이템 카드 터치 -> 카운터 중앙 접시 위로 올리기!
    container.querySelectorAll('[data-stock-tab-item]').forEach(stockCard => {
      stockCard.onclick = () => {
        const stockKey = stockCard.getAttribute('data-stock-tab-item');
        const res = this.engine.moveStockToPlate(stockKey);
        if (res.ok) {
          this.audio?.playTap?.();
          this.app?.showToast?.(`🍽️ [${res.label}] 중앙 접시 위에 올렸습니다! 종(🛎️)을 눌러 서빙하세요.`);
          this.render();
        } else {
          this.audio?.playFail?.();
          this.app?.showToast?.(`⚠️ ${res.message}`);
        }
      };
    });

    // 7. 가마솥 슬롯 차감
    container.querySelectorAll('[data-dec-slot-idx]').forEach(slotBody => {
      slotBody.onclick = () => {
        const idx = Number(slotBody.getAttribute('data-dec-slot-idx'));
        this.engine.decrementTycoonPotSlot(idx);
        this.audio?.playTap?.();
        this.render();
      };
    });

    // 8. [⚗️조합] 버튼 클릭 -> 완성품이 바로 카운터 중앙 접시 위로 올라감!
    const craftBtn = container.querySelector('#tycoon-craft-stock-btn');
    if (craftBtn) {
      craftBtn.onclick = () => {
        const res = this.engine.craftToPlate();
        if (!res.ok) {
          this.app?.showToast?.(`⚠️ ${res.message}`);
        } else if (res.movedPrevToStock) {
          this.app?.showToast?.(`🍽️ [${res.label}] 접시 완성! (기존 접시 음료는 📦재고로 보관됨)`);
        } else {
          this.app?.showToast?.(`🍽️ [${res.label}] 중앙 접시에 완성! 오른쪽 종(🛎️)을 치세요!`);
        }
        this.render();
      };
    }

    const clearBtn = container.querySelector('#tycoon-clear-pot-btn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        this.engine.clearTycoonPot();
        this.audio?.playTap?.();
        this.render();
      };
    }

    // 9. 카테고리 & 재료 그리드
    container.querySelectorAll('[data-tycoon-ing-cat]').forEach(catBtn => {
      catBtn.onclick = () => {
        this.selectedIngCat = catBtn.getAttribute('data-tycoon-ing-cat');
        this.audio?.playTap?.();
        this.render();
      };
    });

    container.querySelectorAll('[data-tycoon-base-ing]').forEach(ingCard => {
      ingCard.onclick = (e) => {
        const pickerBtn = e.target.closest('[data-tycoon-detail-picker]');
        if (pickerBtn) {
          e.stopPropagation();
          const baseId = Number(pickerBtn.getAttribute('data-tycoon-detail-picker'));
          this._openTycoonDetailPicker(baseId);
          return;
        }
        const baseId = Number(ingCard.getAttribute('data-tycoon-base-ing'));
        this.engine.tapIngredientInTycoonPot(baseId, null);
        this.audio?.playTap?.();
        this.render();
      };
    });

    // 10. 게임오버 랭킹 등록 & 재시작
    const submitRankBtn = container.querySelector('#tycoon-submit-rank-btn');
    if (submitRankBtn) {
      submitRankBtn.onclick = async () => {
        if (this.isSubmittingRank || this.hasSubmittedCurrentGame) return;
        const nickInput = container.querySelector('#tycoon-rank-nickname');
        const playerName = nickInput ? nickInput.value.trim() : '익명주모';
        this.isSubmittingRank = true;
        this.render();

        const s = this.engine.session;
        const res = await this.engine.leaderboard.submitScore({
          playerName,
          mode: s.mode,
          servedCount: s.servedCount,
          totalEarnings: s.totalEarnings,
          maxCombo: s.maxCombo,
          maxWave: s.wave,
          badgeEmoji: s.mode === 'TIME_ATTACK' ? '⚡' : '👑'
        });

        this.isSubmittingRank = false;
        this.hasSubmittedCurrentGame = true;
        this.leaderboardTab = s.mode;
        this.app?.showToast?.(res.rank ? `🎉 Top 100 [${res.rank}위] 등재!` : `🎉 랭킹 등록 완료!`);
        this.render();
      };
    }

    const retryBtn = container.querySelector('#tycoon-retry-btn');
    if (retryBtn) {
      retryBtn.onclick = () => {
        this.audio?.playTap?.();
        this.hasSubmittedCurrentGame = false;
        this._memoryHintRevealedForOrderId = {};
        this.engine.startGame(this.engine.session.mode);
        this.audio?.startTycoonBgm?.(1);
        this._startTimerLoop();
        this.render();
      };
    }

    const goLobbyBtn = container.querySelector('#tycoon-go-lobby-btn');
    if (goLobbyBtn) {
      goLobbyBtn.onclick = () => {
        this.audio?.playTap?.();
        this._stopTimerLoop();
        this.audio?.stopTycoonBgm?.();
        this.engine.session.status = 'LOBBY';
        this._syncGlobalTabBarVisibility(false);
        this.render();
      };
    }
  }

  _autoFillOrderToPot(ord) {
    if (!ord) return;
    const reqItems = this.recipeBook.getRecipeItems(ord.recipeId);
    this.engine.clearTycoonPot();
    reqItems.forEach(it => {
      const ratio = Math.max(1, Number(it.ratio) || 1);
      const detId = it.detail_ingredient_id ? Number(it.detail_ingredient_id) : null;
      for (let i = 0; i < ratio; i++) {
        this.engine.tapIngredientInTycoonPot(it.ingredient_id, detId);
      }
    });
  }

  /**
   * 오른쪽 종(🛎️) 이미지를 터치했을 때:
   * - 항상 "땡~!" 황동 데스크 벨 소리(playServiceBell)와 흔들림 애니메이션을 재생하고,
   * - 접시 위에 올라간 음료를 손님에게 서빙합니다.
   */
  _handleBellRingServe() {
    this.audio?.playServiceBell?.();
    this._bellRingAnimActive = true;
    setTimeout(() => {
      this._bellRingAnimActive = false;
      const bellEl = document.getElementById('tycoon-service-bell-img');
      if (bellEl) bellEl.classList.remove('bell-ringing');
    }, 450);

    const res = this.engine.ringBellToServe();
    if (!res.ok) {
      this.app?.showToast?.(`🛎️ ${res.message}`);
      this.render();
      return;
    }

    if (res.isCorrect) {
      this.audio?.setTycoonBgmWave?.(this.engine.session.wave || 1);
      this.app?.showToast?.(`🛎️ 땡~! +${res.earned.toLocaleString()}원 (${this.engine.session.combo}연속 콤보🔥)`);
    } else {
      this.audio?.playFail?.();
      this.app?.showToast?.(`💔 주문 불일치! 손님이 원한 건 [${res.expectedLabel}]였습니다.`);
      if (res.isGameOver) {
        this.audio?.stopTycoonBgm?.();
        this._stopTimerLoop();
      }
    }
    this.render();
  }

  _openTycoonDetailPicker(baseId) {
    const baseIng = this.recipeBook.getBaseIngredient(baseId);
    const details = this.recipeBook.getDetailsForBase(baseId);
    if (!baseIng || !details || details.length === 0) return;

    const modal = document.getElementById('detail-picker-modal');
    const content = document.getElementById('detail-picker-content');
    const picker = this.pickerRegistry.getPicker(baseIng.picker_component);
    if (!modal || !content || !picker) return;

    content.innerHTML = picker.render(baseIng, details);
    modal.classList.add('active');
    this.audio?.playTap?.();

    const closeBtn = content.querySelector('#picker-close-btn');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

    const defaultBtn = content.querySelector('#picker-select-default');
    if (defaultBtn) {
      defaultBtn.onclick = () => {
        modal.classList.remove('active');
        this.engine.tapIngredientInTycoonPot(baseId, null);
        this.audio?.playTap?.();
        this.render();
      };
    }

    content.querySelectorAll('[data-detail-id]').forEach(el => {
      el.onclick = () => {
        const detId = Number(el.getAttribute('data-detail-id'));
        modal.classList.remove('active');
        this.engine.tapIngredientInTycoonPot(baseId, detId);
        this.audio?.playTap?.();
        this.render();
      };
    });
  }
}

window.KSool.TycoonView = TycoonView;
