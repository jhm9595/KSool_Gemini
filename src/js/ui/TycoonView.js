window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 100vh 노스크롤 분할 & 비주얼 아이콘 중심 뷰
 *
 * [레이아웃 & UX 핵심 구조]
 * 1. 화면 스크롤 제거 (1개 모바일 뷰포트에 100vh 고정):
 *    - 인게임 진행 중(`status === 'PLAYING'`)에는 하단 글로벌 탭바(`.tab-bar`) 및 상단 글로벌 헤더를 `display: none` 처리하여
 *      모바일 1화면(100dvh) 전체를 타이쿤 작업 영역으로 온전히 확보합니다.
 * 2. 상단 45% / 하단 55% 고정 분할:
 *    - [상단 45%: 주막 홀] 컴팩트 상단 바 + 2x2 테이블 4개
 *      - 각 좌석 카드: 상단에 [손님 캐릭터 + 주문 메뉴 아이콘], 그 바로 밑 공간에 `[서빙]` 버튼, 최하단에 [남은 시간 게이지 바] 배치!
 *    - [하단 55%: 주조대] 가마솥 슬롯 + 카테고리 탭([📦재고] 탭 포함) + 재료/재고 그리드
 * 3. 재고(STOCK) 탭 & 재료 재고 배지 동기화:
 *    - 상단에 가로로 늘어놓던 선반 스트립을 제거하고, 카테고리 탭에 `[📦 재고]` 탭을 신설했습니다.
 *    - 재고에 있는 완성품이 재료에도 존재하는 경우(예: 소주, 맥주, 막걸리 등),
 *      재료 카드에도 비율 배지(`slot-count-badge`)와 다른 색상의 재고 배지(`stock-count-badge`)로 수량을 함께 표시하며,
 *      서빙 시 재고 탭과 재료 탭의 수량이 동시에 차감됩니다.
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
    this.leaderboardTab = 'TIME_ATTACK';
    this.isSubmittingRank = false;
    this.hasSubmittedCurrentGame = false;
  }

  onLeaveTab() {
    this._stopTimerLoop();
    this._syncGlobalTabBarVisibility(false);
  }

  /**
   * 인게임 진행 중(PLAYING)일 때는 하단 글로벌 탭바(.tab-bar)와 글로벌 헤더를 숨겨 100vh 전체 작업 영역 확보
   */
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
          this.audio?.playSuccess?.();
          this._stopTimerLoop();
          this.render();
          return;
        }
      }

      // 2) 테이블 4개의 개별 대기시간 게이지(Patience) 실시간 감소
      const tickRes = this.engine.tickPatience(1);
      if (tickRes.isGameOver || tickRes.expiredCount > 0) {
        if (tickRes.isGameOver) {
          this._stopTimerLoop();
        }
        this.render();
        return;
      }

      // 전체 리렌더링 없이 각 좌석의 게이지 바 너비와 색상만 부드럽게 DOM 업데이트
      this._updatePatienceBarsInDom();
    }, 1000);
  }

  _stopTimerLoop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _updatePatienceBarsInDom() {
    const s = this.engine.session;
    if (!s || s.status !== 'PLAYING') return;

    s.tables.forEach((t, idx) => {
      const fillEl = document.querySelector(`[data-seat-gauge-fill="${idx}"]`);
      if (!fillEl || !t.order) return;
      const maxP = t.order.maxPatienceSec || 40;
      const curP = Math.max(0, t.order.patienceSec || 0);
      const pct = Math.max(0, Math.min(100, Math.round((curP / maxP) * 100)));
      fillEl.style.width = `${pct}%`;
      fillEl.classList.toggle('warn', pct <= 50 && pct > 25);
      fillEl.classList.toggle('danger', pct <= 25);
    });
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

    // [인게임 PLAYING 모드: 100vh 노스크롤 고정 · 상단 45% 주막 홀 / 하단 55% 주조대]
    container.innerHTML = `
      <div class="tycoon-shell playing-100vh">
        <!-- [상단 45%] 주막 홀 (컴팩트 HUD + 테이블 4개 + 개별 대기시간 게이지) -->
        <section class="tycoon-top-45">
          ${this._renderTopHud(s)}
          ${this._renderTavernHallCompact(s)}
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
    const statusRightHtml = s.mode === 'TIME_ATTACK'
      ? `<span class="hud-pill timer-pill" id="tycoon-live-timer">${this._formatSeconds(s.timeLeftSec)}</span>`
      : `<span class="hud-pill lives-pill">${'❤️'.repeat(Math.max(0, s.lives))}${'🖤'.repeat(Math.max(0, s.maxLives - s.lives))}</span>`;

    return `
      <header class="tycoon-compact-hud">
        <div class="hud-left">
          <span class="hud-wave-badge">W${s.wave}</span>
          <span class="hud-stat">🍶<b>${s.servedCount}</b></span>
          <span class="hud-stat gold">💰<b>${s.totalEarnings.toLocaleString()}</b>원</span>
          ${s.combo > 1 ? `<span class="hud-combo">${s.combo}🔥</span>` : ''}
          ${statusRightHtml}
        </div>
        <div class="hud-right">
          <button type="button" class="hud-icon-btn" id="tycoon-open-notebook-btn" title="단골 수첩">📖</button>
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
   * [상단 45% 내 테이블 4개 영역]
   * - 상단: [손님 캐릭터(아바타+가격)] + [주문한 메뉴 아이콘]
   * - 중단(캐릭터와 주문 메뉴 바로 밑 공간): 와이드 원터치 `[서빙]` 버튼
   * - 하단: 남은 대기시간 게이지 바
   */
  _renderTavernHallCompact(s) {
    const tablesHtml = s.tables.map((t, idx) => {
      const isSelected = s.selectedTableIdx === idx;

      if (!t.customer || !t.order) {
        return `
          <div class="t-seat-box empty ${isSelected ? 'selected' : ''}" data-seat-idx="${idx}">
            <span class="seat-empty-icon">🪑</span>
            <span class="seat-empty-txt">${idx + 1}번석 · 입장</span>
          </div>
        `;
      }

      const cust = t.customer;
      const ord = t.order;
      const avatarSvg = this.engine.customerPool.renderCustomerAvatarSvg(cust, 38);
      const rec = this.recipeBook.getRecipe(ord.recipeId);
      const hasStockReady = (s.stockMap.get(ord.requiredStockKey) || 0) > 0;

      // 요구 주류 아이콘 시각화:
      // - 일반 주문: 실제 요구 주류의 픽셀/고급 아이콘 노출
      // - 단골 기억 주문(MEMORY): ❓단골술 아이콘 (터치 시 기억 힌트 토글 가능)
      const isMemory = (ord.orderType === 'MEMORY');
      const isRevealed = Boolean(this._memoryHintRevealedForOrderId?.[ord.orderId]);

      let drinkIconHtml = '';
      let drinkShortName = '';
      if (isMemory && !isRevealed) {
        drinkIconHtml = `<span class="order-mystery-icon" data-reveal-memory="${ord.orderId}" title="터치하면 단골 주류 확인">❓</span>`;
        drinkShortName = '단골술';
      } else {
        drinkIconHtml = rec
          ? (window.KSool?.pixelIcon ? window.KSool.pixelIcon(rec, 26) : `<span style="font-size:1.3rem;">${rec.emoji || '🍶'}</span>`)
          : '🍶';
        drinkShortName = ord.recipeName;
      }

      // 남은 대기시간 게이지 퍼센트
      const maxP = ord.maxPatienceSec || 40;
      const curP = Math.max(0, ord.patienceSec ?? maxP);
      const pct = Math.max(0, Math.min(100, Math.round((curP / maxP) * 100)));
      const gaugeStateCls = pct <= 25 ? 'danger' : (pct <= 50 ? 'warn' : '');

      return `
        <div class="t-seat-box occupied ${isSelected ? 'selected' : ''} ${hasStockReady ? 'ready-glow' : ''}" data-seat-idx="${idx}">
          <!-- 상단: 캐릭터 + 주문 메뉴 나란히 -->
          <div class="t-seat-top-row">
            <div class="t-cust-col">
              <div class="t-avatar">${avatarSvg}</div>
              <span class="t-price-badge">${ord.price}원</span>
            </div>

            <div class="t-drink-bubble" data-autofill-seat="${idx}" title="터치 시 가마솥에 레시피 자동 세팅 (${drinkShortName})">
              <div class="t-drink-icon-wrap">
                ${drinkIconHtml}
              </div>
              <span class="t-drink-mini-name">${drinkShortName}</span>
            </div>
          </div>

          <!-- 캐릭터와 주문 메뉴 바로 밑 공간: [서빙] 버튼 -->
          <button type="button"
                  class="t-serve-bottom-btn ${hasStockReady ? 'active' : 'disabled'}"
                  data-quick-serve-seat="${idx}"
                  data-stock-key="${ord.requiredStockKey}"
                  ${hasStockReady ? '' : 'disabled'}>
            🍶 서빙
          </button>

          <!-- 최하단: 개별 대기시간 게이지 바 -->
          <div class="t-patience-track">
            <div class="t-patience-fill ${gaugeStateCls}" data-seat-gauge-fill="${idx}" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="tycoon-seats-2x2">
        ${tablesHtml}
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

    const previewLabel = preview ? preview.recipeName : '조합대기';

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

    // [📦 재고] 탭을 카테고리 바 맨 앞에 배치
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
      const activeTable = s.tables[s.selectedTableIdx];
      const targetOrderKey = activeTable?.order?.requiredStockKey || null;

      if (entries.length === 0) {
        gridContentHtml = `
          <div class="tycoon-stock-empty-msg">
            📦 현재 만들어 둔 완성품 재고가 없습니다.<br/>
            재료를 골라 <b>[⚗️조합]</b>하면 이곳 재고 탭에 쌓입니다!
          </div>
        `;
      } else {
        gridContentHtml = entries.map(([stockKey, count]) => {
          const meta = this.engine.getStockItemDisplayMeta(stockKey);
          if (!meta) return '';
          const isMatch = targetOrderKey && targetOrderKey === stockKey;
          const icon = window.KSool?.pixelIcon ? window.KSool.pixelIcon(meta.recipe, 26) : (meta.recipe.emoji || '🍶');

          // 만약 이 완성품이 하위 조합 재료(ingredient_id)로도 쓰이는 경우 가마솥에 올라간 비율 배지도 함께 표시
          const unlockedIng = this.recipeBook.getUnlockedIngredientByRecipe(meta.recipe.recipe_id);
          const inPotCount = unlockedIng
            ? potSlots.filter(sl => sl.baseId === unlockedIng.ingredient_id).reduce((acc, sl) => acc + sl.count, 0)
            : 0;

          return `
            <div class="ing-card tycoon-compact-ing stock-item-card ${isMatch ? 'is-order-match' : ''} ${inPotCount > 0 ? 'in-pot' : ''}"
                 data-stock-tab-item="${stockKey}"
                 data-stock-unlocked-ing="${unlockedIng ? unlockedIng.ingredient_id : ''}">
              ${inPotCount > 0 ? `<span class="slot-count-badge" title="가마솥 투입 수량">${inPotCount}</span>` : ''}
              <span class="stock-count-badge" title="보유 재고 수량">${count}</span>
              <span class="ing-emoji">${icon}</span>
              <span class="ing-name">${meta.recipeName}</span>
              ${isMatch ? `<span class="stock-match-tag">서빙가능</span>` : ''}
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

        // 재고에 있는 제품이 이 재료에도 해당하면 재고 수량 배지(다른 색상) 표시!
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

  _renderLobbyScreen(s) {
    const bestTA = this.engine.persistentBestTimeAttack;
    const bestInf = this.engine.persistentBestInfinite;
    const stashCount = Array.from(s.stockMap.values()).reduce((a, b) => a + b, 0);

    return `
      <div class="tycoon-lobby-container">
        <div class="tycoon-hero-banner">
          <div class="hero-badge">👑 도감 100% 마스터 전용 본게임</div>
          <h2>🏮 조선 주막 타이쿤</h2>
          <p>조합을 만들어 <b>[📦재고]</b>에 쌓고, 손님 카드 하단의 <b>[🍶서빙]</b>을 눌러 판매하세요!</p>
          <div class="tycoon-wallet-pill">
            💰 자산: <b>${this.engine.persistentWallet.toLocaleString()}원</b>
            <span style="margin:0 6px; opacity:0.4;">|</span>
            📦 보유 재고: <b>${stashCount}개</b>
          </div>
        </div>

        <div class="tycoon-mode-cards-grid">
          <div class="tycoon-mode-card mode-infinite-card">
            <div class="mode-card-header">
              <span class="mode-icon">♾️</span>
              <div>
                <div class="mode-name">무한 서바이벌 모드</div>
                <div class="mode-tag">목숨 ❤️❤️❤️ · 다중조합 · 단골 기억("늘 먹던 걸로!")</div>
              </div>
            </div>
            <div class="mode-best-record">
              🏅 최고 기록: <b>${bestInf.servedCount}명 서빙</b> (${bestInf.totalEarnings.toLocaleString()}원 · Wave ${bestInf.maxWave || 1})
            </div>
            <button type="button" class="tycoon-start-btn start-infinite" data-start-mode="INFINITE">
              ♾️ 무한모드 시작
            </button>
          </div>

          <div class="tycoon-mode-card mode-timeattack-card">
            <div class="mode-card-header">
              <span class="mode-icon">⏱️</span>
              <div>
                <div class="mode-name">타임어택 Top 100 랭킹전</div>
                <div class="mode-tag">제한시간 180초 · 글로벌 Top 100 순위 경쟁</div>
              </div>
            </div>
            <div class="mode-best-record">
              🏅 최고 기록: <b>${bestTA.servedCount}명 서빙</b> (${bestTA.totalEarnings.toLocaleString()}원 · ${bestTA.maxCombo}콤보)
            </div>
            <button type="button" class="tycoon-start-btn start-timeattack" data-start-mode="TIME_ATTACK">
              ⏱️ 타임어택(180초) 시작
            </button>
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
            <span class="go-val gold">${s.totalEarnings.toLocaleString()}원</span>
          </div>
          <div class="go-stat-box">
            <span class="go-label">최대 콤보</span>
            <span class="go-val amber">${s.maxCombo}콤보</span>
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
          <button type="button" class="tycoon-secondary-btn" id="tycoon-go-lobby-btn">🏠 로비로</button>
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
      const allCustomers = this.engine.customerPool.getAllCustomers();
      const cardsHtml = allCustomers.map(c => {
        const rec = this.recipeBook.getRecipe(c.preferredRecipeId);
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

      return `
        <div class="tycoon-submodal-overlay" id="tycoon-submodal-overlay">
          <div class="tycoon-submodal-card notebook-modal-card">
            <div class="submodal-hdr">
              <h3>📖 단골 손님 주류 도감</h3>
              <button type="button" class="submodal-close-btn" id="tycoon-close-submodal">✕</button>
            </div>
            <div class="notebook-cust-list">
              ${cardsHtml}
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
        // 4개 테이블 모두 시작부터 손님 자동 착석 활성화
        this.engine.autoSeatAvailableTables();
        this._startTimerLoop();
        this.render();
      };
    });

    // 2. 상단 HUD 아이콘 버튼
    const nbBtn = container.querySelector('#tycoon-open-notebook-btn');
    if (nbBtn) {
      nbBtn.onclick = () => {
        this.audio?.playTap?.();
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

    // 3. 테이블 좌석 터치 (포커스 및 빈 좌석 손님 입장)
    container.querySelectorAll('[data-seat-idx]').forEach(seatEl => {
      seatEl.onclick = (e) => {
        if (e.target.closest('[data-quick-serve-seat]') || e.target.closest('[data-reveal-memory]')) return;
        const idx = Number(seatEl.getAttribute('data-seat-idx'));
        this.audio?.playTap?.();
        this.engine.session.selectedTableIdx = idx;
        const table = this.engine.session.tables[idx];
        if (!table.customer) {
          this.engine.seatNextCustomerToTable(idx);
        } else if (e.target.closest('[data-autofill-seat]')) {
          this._autoFillOrderToPot(table.order);
        }
        this.render();
      };
    });

    // 4. 캐릭터와 주문 메뉴 바로 밑 `[서빙]` 버튼
    container.querySelectorAll('[data-quick-serve-seat]').forEach(qBtn => {
      qBtn.onclick = (e) => {
        e.stopPropagation();
        const seatIdx = Number(qBtn.getAttribute('data-quick-serve-seat'));
        const stockKey = qBtn.getAttribute('data-stock-key');
        this._handleServeAction(stockKey, seatIdx);
      };
    });

    // 5. 단골 기억 물음표 아이콘 터치 시 주류 아이콘 공개
    container.querySelectorAll('[data-reveal-memory]').forEach(peekEl => {
      peekEl.onclick = (e) => {
        e.stopPropagation();
        const ordId = peekEl.getAttribute('data-reveal-memory');
        if (!this._memoryHintRevealedForOrderId) this._memoryHintRevealedForOrderId = {};
        this._memoryHintRevealedForOrderId[ordId] = true;
        this.audio?.playTap?.();
        this.render();
      };
    });

    // 6. [📦재고] 탭의 아이템 카드 터치 처리
    //    - 선택된 테이블 손님이 원하는 술이면 즉시 서빙!
    //    - 그 외에 재료로도 쓸 수 있는 조합물이면 가마솥에 투입, 아니면 선택 좌석에 서빙 시도
    container.querySelectorAll('[data-stock-tab-item]').forEach(stockCard => {
      stockCard.onclick = () => {
        const stockKey = stockCard.getAttribute('data-stock-tab-item');
        const unlockedIngId = Number(stockCard.getAttribute('data-stock-unlocked-ing')) || null;
        const activeTable = this.engine.session.tables[this.engine.session.selectedTableIdx];
        const isTargetMatch = activeTable?.order?.requiredStockKey === stockKey;

        if (isTargetMatch || !unlockedIngId) {
          this._handleServeAction(stockKey, this.engine.session.selectedTableIdx);
        } else {
          this.engine.tapIngredientInTycoonPot(unlockedIngId, null);
          this.audio?.playTap?.();
          this.render();
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

    // 8. 조합 & 비우기
    const craftBtn = container.querySelector('#tycoon-craft-stock-btn');
    if (craftBtn) {
      craftBtn.onclick = () => {
        const res = this.engine.craftToStockpile();
        if (!res.ok) {
          this.app?.showToast?.(`⚠️ ${res.message}`);
        } else {
          this.app?.showToast?.(`✨ [${res.label}] 재고 +1 (보유: ${res.newCount}개)`);
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
        this.engine.autoSeatAvailableTables();
        this._startTimerLoop();
        this.render();
      };
    }

    const goLobbyBtn = container.querySelector('#tycoon-go-lobby-btn');
    if (goLobbyBtn) {
      goLobbyBtn.onclick = () => {
        this.audio?.playTap?.();
        this._stopTimerLoop();
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

  _handleServeAction(stockKey, seatIdx) {
    const res = this.engine.serveStockToTable(stockKey, seatIdx);
    if (!res.ok) {
      this.audio?.playFail?.();
      this.app?.showToast?.(`⚠️ ${res.message}`);
      return;
    }

    if (res.isCorrect) {
      this.engine.autoSeatAvailableTables();
      this.app?.showToast?.(`💰 +${res.earned.toLocaleString()}원 (${this.engine.session.combo}🔥)`);
    } else {
      this.engine.autoSeatAvailableTables();
      this.app?.showToast?.(`💔 주문 불일치!`);
      if (res.isGameOver) {
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
