window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 붕어빵 타이쿤 스타일 카운터·접시·서비스 벨 & 6단계 점포 성장 뷰
 *
 * [핵심 게임 루프]
 * 1. 프롤로그 스토리 & 가이드 튜토리얼 확인
 * 2. [🔬 연구실]에서 무료 기본 재료(물·눈·공기·설탕)로 첫 길거리 음료(얼음·탄산수·사이다) 해금
 * 3. [🏪 점포]에서 성장 영업 시작 -> 내가 해금한 음료만 손님이 주문 -> 외워서 제조 후 중앙 접시 -> 오른쪽 종(🛎️) 서빙!
 * 4. 판매 수익(💰)으로 [🛒 재료 상점]에서 새 재료를 하나씩 구매 -> [🔬 연구실]에서 해당 구역 음료를 모두 해금
 * 5. 구역 재료 100% 구매 + 구역 레시피 100% 해금 + 개업 자금 달성 시 다음 점포(2~6단계) 해금!
 * 6. 6단계 미래도시 바까지 모든 음료를 해금하면 목숨 3개(❤️❤️❤️) 서바이벌 [♾️ 무한모드] 오픈!
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
      inventory,
      brandResolver,
      audio
    });

    this.selectedIngCat = 'ELEMENT'; // 'STOCK' 또는 카테고리 ID
    this.timerInterval = null;
    this.activeSubModal = null; // null | 'LEADERBOARD' | 'NOTEBOOK' | 'SHOP'
    this.notebookTab = 'STAGE_MENU'; // 'STAGE_MENU' | 'CUSTOMERS'
    this.leaderboardTab = 'INFINITE';
    this.isSubmittingRank = false;
    this.hasSubmittedCurrentGame = false;
    this._bellRingAnimActive = false;
    this._bellNudgeVisible = false;
    this._bellNudgeTimer = null;
  }

  onLeaveTab() {
    this._stopTimerLoop();
    this._clearBellNudgeTimer();
    this.audio?.stopTycoonBgm?.();
    this._syncGlobalTabBarVisibility(false);
  }

  _clearBellNudgeTimer() {
    if (this._bellNudgeTimer) {
      clearTimeout(this._bellNudgeTimer);
      this._bellNudgeTimer = null;
    }
    this._bellNudgeVisible = false;
  }

  _resetAndStartBellNudgeTimer() {
    this._clearBellNudgeTimer();
    this._bellNudgeTimer = setTimeout(() => {
      this._bellNudgeTimer = null;
      const s = this.engine.session;
      if (s && s.status === 'PLAYING' && s.platedStockKey) {
        this._bellNudgeVisible = true;
        const bellEl = document.getElementById('tycoon-service-bell-img');
        if (bellEl && !bellEl.querySelector('.bell-nudge-bubble')) {
          const bubble = document.createElement('div');
          bubble.className = 'bell-nudge-bubble';
          bubble.textContent = '종 터치!';
          bellEl.appendChild(bubble);
        }
      }
    }, 2800);
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
          const msg = s.mode === 'INFINITE'
            ? '⏰ 손님이 기다리다 돌아갔습니다! (-❤️)'
            : '⏰ 손님이 기다리다 돌아갔습니다! (콤보 초기화)';
          this.app?.showToast?.(msg);
        }
        this.render();
        return;
      }

      const curPct = s.activeOrder
        ? Math.round(((s.activeOrder.patienceSec || 0) / (s.activeOrder.maxPatienceSec || 40)) * 100)
        : 100;

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
    const bubbleEl = document.querySelector('.counter-order-bubble');
    if (!fillEl) return;

    const maxP = s.activeOrder.maxPatienceSec || 40;
    const curP = Math.max(0, s.activeOrder.patienceSec || 0);
    const pct = Math.max(0, Math.min(100, Math.round((curP / maxP) * 100)));

    fillEl.style.width = `${pct}%`;
    fillEl.classList.toggle('warn', pct <= 55 && pct > 30);
    fillEl.classList.toggle('danger', pct <= 30);

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

  openIngredientShopModal() {
    this.activeSubModal = 'SHOP';
    this.render();
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

    // [인게임 PLAYING 모드: 100vh 노스크롤 고정 · 상단 50% 카운터 씬 / 하단 50% 주조대]
    container.innerHTML = `
      <div class="tycoon-shell playing-100vh">
        <section class="tycoon-top-45">
          ${this._renderTopHud(s)}
          ${this._renderCounterScene(s)}
        </section>

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

    let statusRightHtml = '';
    if (isPlaying) {
      if (s.mode === 'TIME_ATTACK') {
        statusRightHtml = `<span class="hud-pill timer-pill" id="tycoon-live-timer">${this._formatSeconds(s.timeLeftSec)}</span>`;
      } else if (s.mode === 'INFINITE') {
        statusRightHtml = `<span class="hud-pill lives-pill" title="남은 목숨">${'❤️'.repeat(Math.max(0, s.lives))}${'🖤'.repeat(Math.max(0, s.maxLives - s.lives))}</span>`;
      } else {
        statusRightHtml = `<span class="hud-pill growth-pill" title="일반 영업 모드 (목숨 제한 없이 자금을 모으세요)">🏪 영업중</span>`;
      }
    }

    return `
      <div class="tycoon-compact-hud">
        <div class="hud-left">
          <span class="hud-stage-pill" title="${stage.name} (단가 x${stage.priceMultiplier})">${stage.icon} ${stage.name}</span>
          ${isPlaying ? `<span class="hud-stat">🍶<b>${s.servedCount}</b></span>` : ''}
          <span class="hud-stat gold">💰<b>${this.engine.persistentWallet.toLocaleString()}</b>원</span>
          ${isPlaying && s.combo > 1 ? `<span class="hud-combo">${s.combo}🔥</span>` : ''}
        </div>
        <div class="hud-right">
          ${statusRightHtml}
          ${!isPlaying
            ? `<button type="button" class="hud-icon-btn" id="tycoon-open-story-btn" title="프롤로그 스토리 & 튜토리얼 다시보기">🎬</button>
               <button type="button" class="hud-icon-btn" id="tycoon-open-shop-hud-btn" title="재료 구매 상점">🛒</button>`
            : ''
          }
          <button type="button" class="hud-icon-btn" id="tycoon-open-rank-btn" title="Top 100 랭킹">🏆</button>
          ${isPlaying
            ? `<button type="button" class="hud-icon-btn" id="tycoon-open-global-settings-btn" title="게임 설정 (음량 조절)">⚙️</button>
               <button type="button" class="hud-icon-btn exit-btn" id="tycoon-back-lobby-btn" title="영업 마치고 점포 로비로 나가기">✕</button>`
            : ''
          }
        </div>
      </div>
    `;
  }

  _renderCounterScene(s) {
    const stage = this.engine.getCurrentMapStage();
    const cust = s.activeCustomer;
    const ord = s.activeOrder;
    const plateLeftPct = stage.plateLeftPct || 50.1;
    const barTopBottomPct = stage.barTopBottomPct || 20.0;

    let customerZoneHtml = '';
    if (cust && ord) {
      const maxP = ord.maxPatienceSec || 40;
      const curP = Math.max(0, ord.patienceSec ?? maxP);
      const pct = Math.max(0, Math.min(100, Math.round((curP / maxP) * 100)));
      const mood = pct <= 30 ? 'ANGRY' : (pct <= 55 ? 'WARN' : 'NORMAL');
      const gaugeStateCls = pct <= 30 ? 'danger' : (pct <= 55 ? 'warn' : '');

      const avatarSvg = this.engine.customerPool.renderCustomerAvatarSvg(cust, 126, mood);
      const rec = this.recipeBook.getRecipe(ord.recipeId);

      const isMemory = (ord.orderType === 'MEMORY');
      const isRevealed = Boolean(this._memoryHintRevealedForOrderId?.[ord.orderId]);

      let drinkIconHtml = '';
      let drinkShortName = '';
      if (isMemory && !isRevealed) {
        drinkIconHtml = `<span class="order-mystery-icon" data-reveal-memory="${ord.orderId}" title="터치하면 단골 주문 확인">❓</span>`;
        drinkShortName = '단골주문(터치)';
      } else {
        drinkIconHtml = rec
          ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 34) : `<span style="font-size:1.6rem;">${rec.emoji || '🍶'}</span>`)
          : '🍶';
        drinkShortName = ord.recipeName;
      }

      customerZoneHtml = `
        <div class="counter-customer-stage">
          <div class="counter-cust-figure"
               id="tycoon-counter-customer"
               style="left:${plateLeftPct}%; bottom:${barTopBottomPct}%;"
               title="${cust.name} (${cust.title})">
            <div class="counter-cust-avatar-wrap">
              ${avatarSvg}
            </div>
          </div>

          <div class="counter-order-bubble ${pct <= 30 ? 'urgent-bubble' : ''}"
               id="tycoon-order-bubble"
               style="bottom:calc(${barTopBottomPct}% + 44px);"
               title="외운 레시피로 직접 조합해 중앙 접시에 올린 뒤 오른쪽 종을 울려주세요!">
            <div class="bubble-top-row">
              <div class="bubble-drink-icon">
                ${drinkIconHtml}
              </div>
              <span class="bubble-drink-name">${drinkShortName}</span>
            </div>
            <div class="bubble-patience-track">
              <div class="bubble-patience-fill ${gaugeStateCls}" data-counter-gauge-fill="1" style="width:${pct}%;"></div>
            </div>
          </div>
        </div>
      `;
    }

    let plateContentHtml = '';
    const platedKey = s.platedStockKey;
    const isOrderMatchOnPlate = Boolean(platedKey && ord && platedKey === ord.requiredStockKey);
    const plateBottomPct = stage.plateBottomPct || 11.5;
    const plateWidthPct = stage.plateWidthPct || 21.5;
    const plateHeightPct = stage.plateHeightPct || 12.5;
    const plateStyleStr = `left:${plateLeftPct}%; bottom:${plateBottomPct}%; width:${plateWidthPct}%; height:${plateHeightPct}%;`;

    if (platedKey) {
      const meta = this.engine.getStockItemDisplayMeta(platedKey);
      const platedIcon = meta && meta.recipe
        ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(meta.recipe, 40) : `<span style="font-size:1.9rem;">${meta.recipe.emoji || '🍶'}</span>`)
        : '🍶';
      const platedName = meta ? meta.recipeName : '완성품';

      plateContentHtml = `
        <div class="counter-plate-zone has-item ${isOrderMatchOnPlate ? 'match-glow' : ''}"
             id="tycoon-center-plate-btn"
             style="${plateStyleStr}"
             title="터치하면 [📦] 탭으로 보관합니다">
          <div class="plated-drink-visual">
            ${platedIcon}
          </div>
          <span class="plated-drink-label">${platedName}</span>
          <span class="plate-store-hint">📦보관</span>
        </div>
      `;
    } else {
      plateContentHtml = `
        <div class="counter-plate-zone empty-plate"
             id="tycoon-center-plate-empty"
             style="${plateStyleStr}"
             title="조합을 완성하거나 [📦] 탭에서 누르면 이 접시 위에 올라옵니다">
        </div>
      `;
    }

    const bellReadyCls = platedKey ? (isOrderMatchOnPlate ? 'bell-ready-match' : 'bell-ready-any') : '';
    const bellRingCls = this._bellRingAnimActive ? 'bell-ringing' : '';
    const bellLeftPct = stage.bellLeftPct || 70;
    const bellBottomPct = stage.bellBottomPct || 11;
    const showBellNudge = Boolean(platedKey && this._bellNudgeVisible);

    const serviceBellHotspotHtml = `
      <div class="counter-service-bell-spot ${bellReadyCls} ${bellRingCls}"
           id="tycoon-service-bell-img"
           style="left:${bellLeftPct}%; bottom:${bellBottomPct}%;"
           role="button"
           tabindex="0"
           aria-label="카운터 종 (터치하면 손님에게 서빙)"
           title="배경의 종을 터치하면 접시 위의 음료를 손님에게 드립니다!">
        <div class="bell-sound-waves">
          <span class="bell-wave w1"></span>
          <span class="bell-wave w2"></span>
        </div>
        ${showBellNudge ? `<div class="bell-nudge-bubble">종 터치!</div>` : ''}
      </div>
    `;

    return `
      <div class="tycoon-counter-scene" style="background-image: url('${stage.bgImage}');">
        <div class="counter-scene-vignette"></div>
        ${customerZoneHtml}
        <div class="counter-bar-interactive-layer">
          <button type="button" class="counter-menu-hotspot" id="tycoon-counter-menu-hotspot" title="터치하면 현재 점포 메뉴판 & 단골 수첩을 엽니다">
            <span>📋 메뉴판</span>
          </button>
          ${plateContentHtml}
          ${serviceBellHotspotHtml}
        </div>
      </div>
    `;
  }

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

  _renderCompactIngredientsArea(s) {
    const potSlots = s.potSlots;
    const allBase = Array.from(this.recipeBook.baseIngredients.values());

    // 해금/구매된 재료가 1개 이상 있는 카테고리만 표시
    const visibleCategories = this.recipeBook.categories.filter(c =>
      allBase.some(ing => ing.category_id === c.category_id && (!this.inventory || this.inventory.isIngredientAvailable(ing.ingredient_id)))
    );

    if (
      this.selectedIngCat !== 'STOCK' &&
      !visibleCategories.some(c => c.category_id === this.selectedIngCat) &&
      visibleCategories.length > 0
    ) {
      this.selectedIngCat = visibleCategories[0].category_id;
    }

    const stockTabHtml = `
      <button type="button" class="cat-chip tycoon-cat-chip stock-tab-chip ${this.selectedIngCat === 'STOCK' ? 'active' : ''}" data-tycoon-ing-cat="STOCK" title="보관함">
        📦
      </button>
    `;

    const catChipsHtml = visibleCategories.map(c => `
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
            📦 보관 중인 주류/음료가 없습니다.<br/>
            <b>[⚗️조합]</b>하면 카운터 중앙 접시에 올라가며, 접시 위 음료를 터치하면 이곳 <b>[📦]</b> 탭에 보관됩니다!
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
      const allIngs = allBase
        .filter(ing => ing.category_id === this.selectedIngCat && (!this.inventory || this.inventory.isIngredientAvailable(ing.ingredient_id)))
        .sort((a, b) => a.ingredient_id - b.ingredient_id);

      gridContentHtml = allIngs.map(ing => {
        const inPotCount = potSlots
          .filter(sl => sl.baseId === ing.ingredient_id)
          .reduce((acc, sl) => acc + sl.count, 0);

        const stockCount = this.engine.getStockCountForIngredient(ing.ingredient_id);

        const details = this.recipeBook.getDetailsForBase(ing.ingredient_id);
        const hasPicker =
          (!this.inventory || this.inventory.isDetailPickerUnlocked()) &&
          details.length > 0 &&
          ing.picker_component &&
          ing.picker_component !== 'NONE';
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
          ${catChipsHtml}
          ${stockTabHtml}
        </div>
        <div class="tycoon-ings-scroll-grid">
          ${gridContentHtml}
        </div>
      </div>
    `;
  }

  /**
   * [점포 메인 로비 화면]
   * - 현재 점포 마스터 현황 (재료 구매 / 레시피 연구 / 판매 가능 메뉴)
   * - [🔬 연구실 이동] & [🛒 재료 구매 상점] 바로가기
   * - [🏪 점포 영업 시작 (돈 벌기)] & [♾️ 무한모드 (전 점포·음료 마스터 시 해금)]
   * - 6단계 점포 해금 조건 카드 리스트
   */
  _renderLobbyScreen(s) {
    const bestInf = this.engine.persistentBestInfinite;
    const stashCount = Array.from(s.stockMap.values()).reduce((a, b) => a + b, 0);
    const stages = this.engine.getMapStagesWithStatus();
    const currentStage = stages.find(st => st.id === this.engine.selectedMapStageId) || stages[0];
    const curComp = currentStage.completion || {
      purchasedShopCount: 0,
      totalShopCount: 0,
      unlockedRecipeCount: 0,
      totalRecipeCount: 0,
      unpurchasedShopList: []
    };

    const isInfiniteUnlocked = this.inventory ? this.inventory.isInfiniteModeUnlocked() : false;
    const totalUnlockedRecipes = this.inventory ? this.inventory.unlockedRecipeIds.size : 0;
    const totalRecipesCount = this.recipeBook.getAllRecipes().length;

    const stagesCardsHtml = stages.map((st, idx) => {
      const prevStage = idx > 0 ? stages[idx - 1] : null;
      const prevComp = prevStage?.completion;
      const isPrevMastered = !prevStage || (prevComp && prevComp.isAllShopPurchased && prevComp.isAllRecipesUnlocked);
      const canAfford = this.engine.persistentWallet >= st.unlockCost;
      const canUnlockNow = !st.unlocked && isPrevMastered && canAfford;

      const cardDataAttr = st.unlocked
        ? `data-select-stage="${st.id}"`
        : `data-unlock-stage="${st.id}"`;

      let rightBadgeHtml = '';
      if (st.selected) {
        rightBadgeHtml = `<span class="stage-status-chip selected">✅ 영업 점포</span>`;
      } else if (st.unlocked) {
        rightBadgeHtml = `<span class="stage-status-chip unlocked">판매메뉴 ${st.orderableUnlockedCount}/${st.allowedRecipeCount}종</span>`;
      } else {
        rightBadgeHtml = `<span class="stage-status-chip unlock ${canUnlockNow ? 'can-buy' : 'locked'}">🔓 ${st.unlockCost.toLocaleString()}원 해금</span>`;
      }

      const comp = st.completion || { purchasedShopCount: 0, totalShopCount: 0, unlockedRecipeCount: 0, totalRecipeCount: 0 };

      let lockReqHtml = '';
      if (!st.unlocked && prevStage) {
        const req1Done = Boolean(prevComp?.isAllShopPurchased);
        const req2Done = Boolean(prevComp?.isAllRecipesUnlocked);
        const req3Done = canAfford;
        lockReqHtml = `
          <div class="stage-unlock-reqs">
            <span class="req-pill ${req1Done ? 'done' : 'pending'}">${req1Done ? '✅' : '🔒'} 이전 구역 재료 (${prevComp?.purchasedShopCount || 0}/${prevComp?.totalShopCount || 0})</span>
            <span class="req-pill ${req2Done ? 'done' : 'pending'}">${req2Done ? '✅' : '🔒'} 이전 구역 레시피 (${prevComp?.unlockedRecipeCount || 0}/${prevComp?.totalRecipeCount || 0})</span>
            <span class="req-pill ${req3Done ? 'done' : 'pending'}">${req3Done ? '✅' : '💰'} 자금 ${st.unlockCost.toLocaleString()}원</span>
          </div>
        `;
      } else {
        lockReqHtml = `
          <div class="stage-unlock-reqs">
            <span class="req-pill ${comp.isAllShopPurchased ? 'done' : 'active-prog'}">🛒 구역 재료 ${comp.purchasedShopCount}/${comp.totalShopCount}</span>
            <span class="req-pill ${comp.isAllRecipesUnlocked ? 'done' : 'active-prog'}">🔬 구역 레시피 ${comp.unlockedRecipeCount}/${comp.totalRecipeCount} (${st.formattedRange})</span>
          </div>
        `;
      }

      return `
        <div class="tycoon-stage-card ${st.selected ? 'is-selected' : ''} ${!st.unlocked ? 'is-locked' : ''}"
             ${cardDataAttr}
             role="button"
             tabindex="0">
          <div class="stage-thumb" style="background-image:url('${st.bgImage}');">
            <span class="stage-num-badge">STAGE ${st.stageNum}</span>
            <span class="stage-mult-badge">단가 x${st.priceMultiplier.toFixed(2)}</span>
          </div>
          <div class="stage-info-col">
            <div class="stage-title-row">
              <span class="stage-name">${st.icon} ${st.name}</span>
              ${rightBadgeHtml}
            </div>
            <div class="stage-desc">${st.menuSummary}</div>
            ${lockReqHtml}
          </div>
        </div>
      `;
    }).join('');

    const needsFirstResearch = currentStage.orderableUnlockedCount === 0;

    return `
      <div class="tycoon-lobby-container">
        <!-- 상단 현재 점포 & 자금/연구 현황 배너 -->
        <div class="tycoon-hero-banner" style="background-image: linear-gradient(180deg, rgba(9,13,22,0.68), rgba(9,13,22,0.94)), url('${currentStage.bgImage}'); background-size: cover; background-position: center;">
          <div class="hero-top-row">
            <div class="hero-badge">${currentStage.icon} STAGE ${currentStage.stageNum} : ${currentStage.name} (단가 x${currentStage.priceMultiplier})</div>
            <button type="button" class="hero-story-replay-btn" id="tycoon-replay-intro-btn">🎬 스토리·튜토리얼</button>
          </div>
          <h2>🏪 ${currentStage.name} 영업 준비</h2>
          <p>연구실에서 해금한 메뉴(<b>현재 ${currentStage.orderableUnlockedCount}종</b>)만 손님이 주문합니다!</p>

          <div class="tycoon-wallet-pill">
            💰 보유 자금: <b>${this.engine.persistentWallet.toLocaleString()}원</b>
            <span style="margin:0 6px; opacity:0.4;">|</span>
            📦 보관 재고: <b>${stashCount}개</b>
          </div>

          <!-- 현재 점포 마스터 게이지 & 연구실/재료상점 바로가기 -->
          <div class="stage-mastery-box">
            <div class="mastery-stat-row">
              <span class="m-label">🛒 구역 재료 구매</span>
              <span class="m-val ${curComp.isAllShopPurchased ? 'is-clear' : ''}">${curComp.purchasedShopCount} / ${curComp.totalShopCount}종</span>
              <span class="m-divider">·</span>
              <span class="m-label">🔬 구역 음료 해금 (${currentStage.formattedRange})</span>
              <span class="m-val ${curComp.isAllRecipesUnlocked ? 'is-clear' : ''}">${curComp.unlockedRecipeCount} / ${curComp.totalRecipeCount}종</span>
            </div>
            <div class="mastery-actions-row">
              <button type="button" class="lobby-prep-btn prep-lab-btn" id="tycoon-go-lab-btn">
                🔬 연구실에서 음료 해금하기
              </button>
              <button type="button" class="lobby-prep-btn prep-shop-btn" id="tycoon-open-shop-btn">
                🛒 재료 구매 상점 (${curComp.unpurchasedShopList.length}개 남음)
              </button>
            </div>
          </div>
        </div>

        <!-- 영업 시작 카드 (일반 점포 영업 vs 최종 무한모드) -->
        <div class="tycoon-mode-cards-grid two-cols">
          <div class="tycoon-mode-card mode-growth-card ${needsFirstResearch ? 'needs-research-pulse' : ''}">
            <div class="mode-card-header">
              <span class="mode-icon">🏪</span>
              <div>
                <div class="mode-name">${currentStage.name} 영업</div>
                <div class="mode-tag">목숨 제한 없음 · 판매 메뉴 ${currentStage.orderableUnlockedCount}종</div>
              </div>
            </div>
            <button type="button" class="tycoon-start-btn start-growth" data-start-mode="GROWTH">
              ${needsFirstResearch ? '🔬 첫 음료 해금하러 가기' : '🏪 점포 영업 시작 (자금 모으기)'}
            </button>
          </div>

          <div class="tycoon-mode-card mode-infinite-card ${!isInfiniteUnlocked ? 'is-locked-mode' : ''}">
            <div class="mode-card-header">
              <span class="mode-icon">${isInfiniteUnlocked ? '♾️' : '🔒'}</span>
              <div>
                <div class="mode-name">무한모드 서바이벌</div>
                <div class="mode-tag">
                  ${isInfiniteUnlocked
                    ? `목숨 ❤️❤️❤️ · 단골 주문 등장 · 최고 ${bestInf.servedCount}명`
                    : `전 레시피 해금 시 오픈 (${totalUnlockedRecipes}/${totalRecipesCount})`
                  }
                </div>
              </div>
            </div>
            <button type="button" class="tycoon-start-btn start-infinite" data-start-mode="INFINITE">
              ${isInfiniteUnlocked ? '♾️ 무한모드 영업 시작' : '🔒 전체 음료 마스터 필요'}
            </button>
          </div>
        </div>

        <!-- 6단계 점포 확장 로드맵 -->
        <div class="tycoon-stage-shop-section">
          <div class="stage-shop-hdr">
            <span>🗺️ 점포 확장 로드맵 (6단계)</span>
            <small>구역 재료 구매 + 구역 레시피 100% 해금 + 개업 자금을 모아 다음 점포로 진출하세요!</small>
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
    const isRankingMode = s.mode === 'INFINITE' || s.mode === 'TIME_ATTACK';
    const modeLabel = s.mode === 'TIME_ATTACK'
      ? '⏱️ 타임어택 (180초)'
      : (s.mode === 'INFINITE' ? '♾️ 무한 서바이벌 모드' : '🏪 점포 영업');

    return `
      <div class="tycoon-gameover-card">
        <div class="gameover-badge">${modeLabel} 종료</div>
        <h2 class="gameover-title">🏮 오늘의 점포 정산서</h2>
        <div class="gameover-stats-grid">
          <div class="go-stat-box">
            <span class="go-label">서빙 손님</span>
            <span class="go-val sky">${s.servedCount}명</span>
          </div>
          <div class="go-stat-box">
            <span class="go-label">이번 영업 수익</span>
            <span class="go-val gold">+${s.totalEarnings.toLocaleString()}원</span>
          </div>
          <div class="go-stat-box">
            <span class="go-label">현재 보유 자금</span>
            <span class="go-val amber">${this.engine.persistentWallet.toLocaleString()}원</span>
          </div>
        </div>

        ${isRankingMode ? `
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
        ` : ''}

        <div class="gameover-actions">
          <button type="button" class="tycoon-start-btn start-infinite" id="tycoon-retry-btn">🔄 다시 영업하기</button>
          <button type="button" class="tycoon-secondary-btn" id="tycoon-go-lobby-btn">🏠 점포 로비로</button>
        </div>
      </div>
    `;
  }

  _renderSubModal() {
    if (this.activeSubModal === 'SHOP') {
      const stages = this.engine.getMapStagesWithStatus();
      const wallet = this.engine.persistentWallet;

      const stageSectionsHtml = stages.filter(st => st.unlocked).map(st => {
        const shopList = window.KSool.ProgressionEngine.getShopIngredientsForStage(st.stepId);
        if (shopList.length === 0) return '';

        const itemsHtml = shopList.map(item => {
          const baseIng = this.recipeBook.getBaseIngredient(item.id);
          const ingName = baseIng ? this.brandResolver.resolveName(baseIng) : item.name;
          const icon = baseIng && window.KSool?.pixelIcon
            ? window.KSool.pixelIcon(baseIng, 28)
            : (baseIng?.emoji || '🧪');
          const isPurchased = this.inventory ? this.inventory.isBaseIngredientPurchased(item.id) : false;
          const canBuy = !isPurchased && wallet >= item.price;

          return `
            <div class="shop-ing-row ${isPurchased ? 'is-owned' : ''}">
              <div class="shop-ing-icon">${icon}</div>
              <div class="shop-ing-info">
                <div class="shop-ing-title">
                  <span class="shop-ing-name">${ingName}</span>
                  <span class="shop-ing-price">💰 ${item.price.toLocaleString()}원</span>
                </div>
                <div class="shop-ing-hint">${item.unlocksHint || item.hint || ''}</div>
              </div>
              <div class="shop-ing-action">
                ${isPurchased
                  ? `<span class="shop-owned-badge">✅ 보유중</span>`
                  : `<button type="button" class="shop-buy-btn ${canBuy ? 'can-afford' : 'no-funds'}" data-buy-shop-ing="${item.id}">
                       구매
                     </button>`
                }
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="shop-stage-group">
            <div class="shop-stage-title">${st.icon} STAGE ${st.stageNum}. ${st.name} 재료 (${st.formattedRange})</div>
            <div class="shop-stage-items">
              ${itemsHtml}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="tycoon-submodal-overlay" id="tycoon-submodal-overlay">
          <div class="tycoon-submodal-card shop-modal-card">
            <div class="submodal-hdr">
              <h3>🛒 연구·제조 재료 상점</h3>
              <button type="button" class="submodal-close-btn" id="tycoon-close-submodal">✕</button>
            </div>
            <div class="shop-wallet-bar">
              <span>💰 현재 보유 자금: <b>${wallet.toLocaleString()}원</b></span>
              <small>구매한 재료는 [🔬 연구실]과 [🏪 점포]에 즉시 추가됩니다</small>
            </div>
            <div class="notebook-cust-list shop-scroll-list">
              <div class="shop-free-starter-notice">
                🎁 기본 무료 지급 재료: <b>물 · 눈 · 공기 · 설탕</b> (No.01 얼음, No.02 탄산수, No.03 사이다 연구 가능)
              </div>
              ${stageSectionsHtml}
            </div>
          </div>
        </div>
      `;
    }

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
              <button type="button" class="submodal-tab ${this.leaderboardTab === 'INFINITE' ? 'active' : ''}" data-lb-tab="INFINITE">♾️ 무한모드</button>
              <button type="button" class="submodal-tab ${this.leaderboardTab === 'TIME_ATTACK' ? 'active' : ''}" data-lb-tab="TIME_ATTACK">⏱️ 타임어택</button>
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
          const isUnlocked = !this.inventory || this.inventory.isRecipeUnlocked(rec.recipe_id);
          const recName = this.brandResolver.resolveName(rec);
          const recIcon = isUnlocked
            ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 24) : (rec.emoji || '🍶'))
            : '🔒';
          const menuPrice = this.engine.calculateOrderPrice(rec.recipe_id, 'NORMAL', 0, 1);

          if (!isUnlocked) {
            return `
              <div class="notebook-cust-card is-locked-menu">
                <div class="nb-avatar">${recIcon}</div>
                <div class="nb-info" style="flex-direction:column; align-items:flex-start; gap:3px;">
                  <div class="nb-top" style="width:100%; justify-content:space-between; align-items:center;">
                    <span class="nb-name" style="color:#94a3b8;">${rec.formatted_number || ''} ${recName}</span>
                    <span class="nb-price-badge" style="opacity:0.6;">💰 ${menuPrice.toLocaleString()}원</span>
                  </div>
                  <div style="font-size:0.64rem; color:#64748b;">[🔬 연구실]에서 해금하면 손님이 주문합니다</div>
                </div>
              </div>
            `;
          }

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
              <div class="nb-info" style="flex-direction:column; align-items:flex-start; gap:3px;">
                <div class="nb-top" style="width:100%; justify-content:space-between; align-items:center;">
                  <span class="nb-name">${rec.formatted_number || ''} ${recName}</span>
                  <span class="nb-price-badge">💰 ${menuPrice.toLocaleString()}원</span>
                </div>
                <div style="font-size:0.64rem; color:#cbd5e1;">조합법: <b style="color:#fde047;">${formulaStr}</b></div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        const allCustomers = this.engine.customerPool.getAllCustomers();
        bodyHtml = allCustomers.map(c => {
          const sessionRecId = this.engine.session?.customerSessionRecipeMap?.get(c.id) || c.preferredRecipeId;
          const rec = this.recipeBook.getRecipe(sessionRecId);
          const recName = rec ? this.brandResolver.resolveName(rec) : '비전 음료';
          const recIcon = rec && window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 22) : (rec?.emoji || '🍶');
          const favPrice = rec ? this.engine.calculateOrderPrice(rec.recipe_id, 'NORMAL', 0, 1) : 15;
          const avatar = this.engine.customerPool.renderCustomerAvatarSvg(c, 42);

          return `
            <div class="notebook-cust-card">
              <div class="nb-avatar">${avatar}</div>
              <div class="nb-info">
                <div class="nb-top">
                  <span class="nb-name">${c.name}</span>
                  <span class="nb-price-badge">💰 ${favPrice.toLocaleString()}원</span>
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
    // 0. 스토리/튜토리얼 다시보기 & 연구실/상점 이동 버튼
    const storyBtn = container.querySelector('#tycoon-open-story-btn') || container.querySelector('#tycoon-replay-intro-btn');
    if (storyBtn) {
      storyBtn.onclick = () => {
        this.audio?.playTap?.();
        this.app?.storyTutorialModalView?.openIntroFlow?.();
      };
    }

    const replayIntroBtn = container.querySelector('#tycoon-replay-intro-btn');
    if (replayIntroBtn) {
      replayIntroBtn.onclick = () => {
        this.audio?.playTap?.();
        this.app?.storyTutorialModalView?.openIntroFlow?.();
      };
    }

    const goLabBtn = container.querySelector('#tycoon-go-lab-btn');
    if (goLabBtn) {
      goLabBtn.onclick = () => {
        this.audio?.playTap?.();
        this.app?.switchTab?.('brew');
      };
    }

    const openShopBtn = container.querySelector('#tycoon-open-shop-btn');
    if (openShopBtn) {
      openShopBtn.onclick = () => {
        this.audio?.playTap?.();
        this.openIngredientShopModal();
      };
    }

    const openShopHudBtn = container.querySelector('#tycoon-open-shop-hud-btn');
    if (openShopHudBtn) {
      openShopHudBtn.onclick = () => {
        this.audio?.playTap?.();
        this.openIngredientShopModal();
      };
    }

    // 상점 모달 내 재료 구매 버튼
    container.querySelectorAll('[data-buy-shop-ing]').forEach(buyBtn => {
      buyBtn.onclick = () => {
        const ingId = Number(buyBtn.getAttribute('data-buy-shop-ing'));
        if (!this.inventory) return;
        const res = this.inventory.purchaseBaseIngredient(ingId, this.engine);
        if (!res.ok) {
          this.audio?.playFail?.();
          this.app?.showToast?.(`⚠️ ${res.message}`);
        } else {
          this.audio?.playSuccess?.();
          this.app?.showToast?.(`🎉 ${res.message}`);
          this.app?.renderBrewView?.();
          this.app?.renderCollectionView?.();
        }
        this.render();
      };
    });

    // 1. 모드 시작 (GROWTH / INFINITE / TIME_ATTACK)
    container.querySelectorAll('[data-start-mode]').forEach(btn => {
      btn.onclick = () => {
        const mode = btn.getAttribute('data-start-mode');
        this.audio?.playTap?.();

        if (mode === 'INFINITE' && this.inventory && !this.inventory.isInfiniteModeUnlocked()) {
          this.audio?.playFail?.();
          this.app?.showToast?.('🔒 6단계 모든 점포와 전체 음료(84종)를 모두 해금하면 무한모드가 열립니다!');
          return;
        }

        const currentStage = this.engine.getCurrentMapStage();
        const unlockedOrders = this.engine.getStageOrderableUnlockedRecipes(currentStage.id);
        if (unlockedOrders.length === 0) {
          this.app?.showToast?.('🔬 아직 판매할 음료를 해금하지 않았습니다! 연구실에서 첫 음료를 조합해보세요!');
          this.app?.switchTab?.('brew');
          return;
        }

        this.hasSubmittedCurrentGame = false;
        this._memoryHintRevealedForOrderId = {};
        const startRes = this.engine.startGame(mode);
        if (startRes && startRes.ok === false) {
          this.audio?.playFail?.();
          this.app?.showToast?.(`⚠️ ${startRes.message}`);
          return;
        }
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
          this.app?.showToast?.(`🎉 [${res.stage.name}] 해금 완료! 연구실에서 새 구역의 음료를 연구해보세요!`);
          this.app?.renderBrewView?.();
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
          this.render();
        }
      };
    });

    // 2. 상단 HUD 아이콘 버튼
    const globalSettingsBtn = container.querySelector('#tycoon-open-global-settings-btn');
    if (globalSettingsBtn) {
      globalSettingsBtn.onclick = () => {
        this.audio?.playTap?.();
        const headerSettingsBtn = document.getElementById('open-settings-btn');
        if (headerSettingsBtn) {
          headerSettingsBtn.click();
        }
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

    // 3. 카운터 주문 말풍선 터치 (단골 기억 힌트 공개만 수행, 자동 세팅 없음 -> 외워서 직접 조합!)
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
        this.audio?.playTap?.();
        this.app?.showToast?.('💡 외운 조합법으로 직접 제조하거나 왼쪽 [📋 메뉴판]을 확인해보세요!');
      };
    }

    // 4. 카운터 중앙 접시(Plate) 위 아이템 터치 -> [📦] 탭으로 보관!
    const plateBtn = container.querySelector('#tycoon-center-plate-btn');
    if (plateBtn) {
      plateBtn.onclick = () => {
        const res = this.engine.storePlateToStock();
        if (res.ok) {
          this._clearBellNudgeTimer();
          this.audio?.playTap?.();
          this.render();
        }
      };
    }

    // 5. 카운터 오른쪽 데스크 서비스 종(🛎️ 이미지) 터치 -> 종소리 + 접시 위 음료 서빙!
    const bellImg = container.querySelector('#tycoon-service-bell-img');
    if (bellImg) {
      bellImg.onclick = () => {
        this._handleBellRingServe();
      };
    }

    // 6. [📦] 탭의 아이템 카드 터치 -> 카운터 중앙 접시 위로 올리기!
    container.querySelectorAll('[data-stock-tab-item]').forEach(stockCard => {
      stockCard.onclick = () => {
        const stockKey = stockCard.getAttribute('data-stock-tab-item');
        const res = this.engine.moveStockToPlate(stockKey);
        if (res.ok) {
          this.audio?.playTap?.();
          this._resetAndStartBellNudgeTimer();
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
        } else {
          this._resetAndStartBellNudgeTimer();
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
        const tapRes = this.engine.tapIngredientInTycoonPot(baseId, null);
        if (tapRes && tapRes.ok === false) {
          this.audio?.playFail?.();
          this.app?.showToast?.(`⚠️ ${tapRes.message}`);
          return;
        }
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
        const playerName = nickInput ? nickInput.value.trim() : '익명점주';
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

  _handleBellRingServe() {
    this._clearBellNudgeTimer();
    this.audio?.playServiceBell?.();
    this._bellRingAnimActive = true;
    setTimeout(() => {
      this._bellRingAnimActive = false;
      const bellEl = document.getElementById('tycoon-service-bell-img');
      if (bellEl) bellEl.classList.remove('bell-ringing');
    }, 450);

    const res = this.engine.ringBellToServe();
    if (!res.ok) {
      this.render();
      return;
    }

    if (res.isCorrect) {
      this.audio?.setTycoonBgmWave?.(this.engine.session.wave || 1);
      this.render();
      this._spawnFloatingEarnText(`+${res.earned.toLocaleString()}원`, false);
    } else {
      this.audio?.playFail?.();
      if (res.isGameOver) {
        this.audio?.stopTycoonBgm?.();
        this._stopTimerLoop();
      }
      this.render();
      this._spawnFloatingEarnText(res.noLifePenalty ? `주문 불일치!` : `-❤️`, true);
    }
  }

  _spawnFloatingEarnText(text, isNegative = false) {
    const sceneEl = document.querySelector('.tycoon-counter-scene') || document.getElementById(this.containerId);
    if (!sceneEl) return;

    const floatEl = document.createElement('div');
    floatEl.className = `tycoon-floating-earn ${isNegative ? 'is-loss' : ''}`;
    floatEl.textContent = text;
    sceneEl.appendChild(floatEl);

    setTimeout(() => {
      floatEl.remove();
    }, 950);
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
