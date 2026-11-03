window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 메인 뷰 컨트롤러
 *
 * [해금 조건]
 * - 공식 레시피 100% 해금 달성 유저(또는 전체해금 샌드박스 모드)에게만 열리는 최종 본게임 탭!
 *
 * [제공 화면 및 기능]
 * 1. 상단 대시보드 & 모드 스위처:
 *    - ♾️ 무한 서바이벌 모드 (목숨 ❤️❤️❤️ 3개, 웨이브가 오를수록 다중 조합 -> 빼기 주문 -> "늘 먹던 걸로" 단골 기억 주문)
 *    - ⏱️ 타임어택 랭킹전 (180초 제한, 서빙 수 & 매출 기준 글로벌 Top 100 랭킹 보드)
 *    - 📖 단골 손님 수첩 모달 (유니크하지만 헷갈리는 모자/수염/안경/복장 손님들의 인상착의 및 최애 술 기록장)
 *    - 🏆 Top 100 전체 랭킹 모달 (Supabase 실시간 연동)
 * 2. 주막 홀 & 좌석 안내 시스템:
 *    - 입구 대기 손님을 클릭한 빈 좌석(1~4번 테이블)에 안내하거나 [자동 착석 안내] 토글로 즉시 착석
 *    - 선택한 테이블 손님의 고유 외형 아바타, 말풍선 주문, 1원 단위 예상 판매 가격(예: 47원, 118원),
 *      [📋 레시피 힌트/원클릭 세팅] 보조 기능 제공
 * 3. 재고 선반 (Stockpile Shelf):
 *    - 주조해서 만든 조합(재료 or 완성품, 그리고 🚫빼기 표기된 특제 조합)이 1개씩 쌓이는 공간
 *    - 선반의 술 카드를 누르면 현재 선택된 테이블의 손님에게 즉시 서빙하고 1원 단위 대금을 정산!
 * 4. 타이쿤 전용 양조 가마솥 (Omission Tagging 지원):
 *    - 슬롯에 재료를 모두 올린 뒤, 특정 재료 슬롯의 [➖빼기] 버튼을 누르면
 *      실제 슬롯에서 사라져 다른 레시피와 겹치는 일을 방지하고 `🚫빼기 표기`된 상태로 정확히 조합!
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

    this.selectedIngCat = 'ALCOHOL';
    this.timerInterval = null;
    this.activeSubModal = null; // null | 'LEADERBOARD' | 'NOTEBOOK'
    this.leaderboardTab = 'TIME_ATTACK';
    this.isSubmittingRank = false;
    this.hasSubmittedCurrentGame = false;
  }

  onLeaveTab() {
    this._stopTimerLoop();
  }

  _startTimerLoop() {
    this._stopTimerLoop();
    this.timerInterval = setInterval(() => {
      const s = this.engine.session;
      if (!s || s.status !== 'PLAYING') return;
      s.elapsedSec += 1;
      if (s.mode === 'TIME_ATTACK') {
        s.timeLeftSec = Math.max(0, s.timeLeftSec - 1);
        const timerEl = document.getElementById('tycoon-live-timer');
        if (timerEl) {
          timerEl.textContent = this._formatSeconds(s.timeLeftSec);
          timerEl.classList.toggle('urgent', s.timeLeftSec <= 20);
        }
        if (s.timeLeftSec <= 0) {
          s.status = 'GAMEOVER';
          s.lastLogMessage = `⏰ [타임어택 종료!] 총 ${s.servedCount}명의 손님에게 서빙하여 ${s.totalEarnings.toLocaleString()}원을 벌었습니다! Top 100 랭킹에 등록해보세요!`;
          this.audio?.playSuccess?.();
          this._stopTimerLoop();
          this.render();
        }
      }
    }, 1000);
  }

  _stopTimerLoop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const s = this.engine.session;
    const profile = this.engine.getDifficultyProfile();

    // 상단 상태바 & 모드 선택 헤더
    const topHudHtml = this._renderTopHud(s, profile);

    // 게임 시작 전(LOBBY) 또는 게임오버(GAMEOVER) 오버레이 카드 vs 플레이 화면
    let mainBodyHtml = '';
    if (s.status === 'LOBBY') {
      mainBodyHtml = this._renderLobbyScreen(s);
    } else if (s.status === 'GAMEOVER') {
      mainBodyHtml = this._renderGameOverScreen(s);
    } else {
      mainBodyHtml = `
        <!-- 1. 주막 홀 (대기열 + 4인 좌석 테이블 + 선택된 손님 주문서) -->
        ${this._renderTavernHall(s)}

        <!-- 2. 내 주막 재고 선반 (조합해서 쌓아둔 술/재료 판매대) -->
        ${this._renderStockpileShelf(s)}

        <!-- 3. 주막 즉석 가마솥 (➖빼기 태그 지원 & 즉시 조합) -->
        ${this._renderTycoonBrewery(s)}
      `;
    }

    // 서브 모달 (Top 100 랭킹 보드 / 단골 손님 인상착의 수첩)
    const subModalHtml = this.activeSubModal ? this._renderSubModal(s) : '';

    container.innerHTML = `
      <div class="tycoon-shell">
        ${topHudHtml}
        <div class="tycoon-Notice-bar" id="tycoon-log-bar">${s.lastLogMessage}</div>
        <div class="tycoon-scroll-body">
          ${mainBodyHtml}
        </div>
        ${subModalHtml}
      </div>
    `;

    this._bindEvents(container);
  }

  _renderTopHud(s, profile) {
    const isPlaying = s.status === 'PLAYING';
    const modeBadge = s.mode === 'TIME_ATTACK'
      ? `<span class="tycoon-mode-pill mode-ta">⏱️ 타임어택</span>`
      : `<span class="tycoon-mode-pill mode-inf">♾️ 무한모드</span>`;

    const statusRightHtml = s.mode === 'TIME_ATTACK'
      ? `<div class="tycoon-stat-chip timer-chip">
           <span class="stat-label">남은시간</span>
           <span class="stat-val" id="tycoon-live-timer">${this._formatSeconds(s.timeLeftSec)}</span>
         </div>`
      : `<div class="tycoon-stat-chip lives-chip" title="틀린 술을 서빙하면 목숨이 1개씩 줄어듭니다">
           <span class="stat-label">목숨</span>
           <span class="stat-val">${'❤️'.repeat(Math.max(0, s.lives))}${'🖤'.repeat(Math.max(0, s.maxLives - s.lives))}</span>
         </div>`;

    return `
      <div class="tycoon-hud-header">
        <div class="tycoon-hud-top-row">
          <div class="tycoon-title-wrap">
            <span class="tycoon-lantern-icon">🏮</span>
            <div>
              <div class="tycoon-main-title">조선 주막 타이쿤 ${modeBadge}</div>
              <div class="tycoon-wave-sub">${profile.title}</div>
            </div>
          </div>
          <div class="tycoon-hud-actions">
            <button type="button" class="tycoon-util-btn" id="tycoon-open-notebook-btn" title="손님들의 외형 특징과 단골 메뉴 수첩">
              📖 단골수첩 <span class="util-count">${this.engine.knownRegularIds.size}/${this.engine.customerPool.getAllCustomers().length}</span>
            </button>
            <button type="button" class="tycoon-util-btn rank-btn" id="tycoon-open-rank-btn" title="글로벌 Top 100 랭킹 보드">
              🏆 Top 100
            </button>
            ${isPlaying ? `<button type="button" class="tycoon-util-btn Lobby-btn" id="tycoon-back-lobby-btn" title="모드 선택 화면으로">⚙️ 모드변경</button>` : ''}
          </div>
        </div>

        <div class="tycoon-stats-strip">
          <div class="tycoon-stat-chip">
            <span class="stat-label">서빙완료</span>
            <span class="stat-val highlight-sky">${s.servedCount}명</span>
          </div>
          <div class="tycoon-stat-chip">
            <span class="stat-label">현재매출</span>
            <span class="stat-val highlight-gold">${s.totalEarnings.toLocaleString()}원</span>
          </div>
          <div class="tycoon-stat-chip">
            <span class="stat-label">연속콤보</span>
            <span class="stat-val highlight-amber">${s.combo}🔥</span>
          </div>
          ${statusRightHtml}
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
          <h2>"사장님! 늘 먹던 걸로 한 잔 주세요!"</h2>
          <p>
            직접 빚은 조합(재료·완성품)을 선반에 하나씩 쌓아두고 찾아오는 손님에게 판매하세요!<br/>
            난이도와 투입 개수에 비례해 <b>1원 단위</b>로 정산되며, 갈수록 <b>다중 조합 · 재료 빼기(➖) · 단골 기억 주문</b>이 몰려옵니다!
          </p>
          <div class="tycoon-wallet-pill">
            💰 누적 주막 자산: <b>${this.engine.persistentWallet.toLocaleString()}원</b>
            <span style="margin:0 6px; opacity:0.4;">|</span>
            📦 현재 선반 초기 재고: <b>${stashCount}개</b>
          </div>
        </div>

        <div class="tycoon-mode-cards-grid">
          <!-- 모드 1: 무한 서바이벌 모드 -->
          <div class="tycoon-mode-card mode-infinite-card">
            <div class="mode-card-header">
              <span class="mode-icon">♾️</span>
              <div>
                <div class="mode-name">무한 서바이벌 모드</div>
                <div class="mode-tag">목숨 ❤️❤️❤️ 3개 · 극한의 단골 기억 & 빼기 도전</div>
              </div>
            </div>
            <ul class="mode-feature-list">
              <li><b>Wave 1:</b> 2재료 기초 주문 + 단골 손님들의 첫인사 & 최애 술 소개</li>
              <li><b>Wave 2:</b> 3~4재료 다중 조합 + <b>"특정 재료는 빼고(➖) 주세요!"</b> 등장</li>
              <li><b>Wave 3+:</b> 비슷한 모자·수염·안경의 단골들이 재방문해 <b>"늘 먹던 걸로 주세요!"</b> 주문!</li>
              <li>실수 없이 정확히 서빙하면 목숨이 유지되어 무한히 웨이브와 단가를 높일 수 있습니다.</li>
            </ul>
            <div class="mode-best-record">
              🏅 내 최고 기록: <b>${bestInf.servedCount}명 서빙</b> (${bestInf.totalEarnings.toLocaleString()}원 · Wave ${bestInf.maxWave || 1})
            </div>
            <button type="button" class="tycoon-start-btn start-infinite" data-start-mode="INFINITE">
              ♾️ 무한모드 영업 시작하기
            </button>
          </div>

          <!-- 모드 2: 타임어택 랭킹전 -->
          <div class="tycoon-mode-card mode-timeattack-card">
            <div class="mode-card-header">
              <span class="mode-icon">⏱️</span>
              <div>
                <div class="mode-name">타임어택 Top 100 랭킹전</div>
                <div class="mode-tag">제한시간 180초 · 전 세계 주모들과 스피드 경쟁</div>
              </div>
            </div>
            <ul class="mode-feature-list">
              <li><b>180초(3분)</b> 안에 찾아오는 손님들에게 원하는 술을 최대한 많이 전달하세요!</li>
              <li>미리 자주 쓰이는 술(소주, 맥주, 얼음, 탄산수 등)을 만들어 선반에 쌓아두면 즉시 서빙 가능!</li>
              <li>서빙 성공 횟수와 총 매출액(1원 단위)을 기준으로 <b>전체 공개 Top 100 순위표</b>에 등재됩니다.</li>
            </ul>
            <div class="mode-best-record">
              🏅 내 최고 기록: <b>${bestTA.servedCount}명 서빙</b> (${bestTA.totalEarnings.toLocaleString()}원 · 최대 ${bestTA.maxCombo}콤보)
            </div>
            <button type="button" class="tycoon-start-btn start-timeattack" data-start-mode="TIME_ATTACK">
              ⏱️ 타임어택(180초) 도전하기
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
        <div class="gameover-badge">${modeLabel} 영업 종료</div>
        <h2 class="gameover-title">🏮 오늘의 주막 정산서</h2>
        <p class="gameover-desc">${s.lastLogMessage}</p>

        <div class="gameover-stats-grid">
          <div class="go-stat-box">
            <span class="go-label">총 서빙 손님</span>
            <span class="go-val sky">${s.servedCount}명</span>
          </div>
          <div class="go-stat-box">
            <span class="go-label">총 판매 수익</span>
            <span class="go-val gold">${s.totalEarnings.toLocaleString()}원</span>
          </div>
          <div class="go-stat-box">
            <span class="go-label">최대 콤보 / 도달 Wave</span>
            <span class="go-val amber">${s.maxCombo}콤보 / Wave ${s.wave}</span>
          </div>
        </div>

        <div class="gameover-rank-submit-box">
          <div class="rank-submit-title">🏆 글로벌 Top 100 랭킹 등록</div>
          ${this.hasSubmittedCurrentGame
            ? `<div class="rank-submitted-done">✅ 랭킹 등록이 완료되었습니다! [🏆 Top 100]에서 순위를 확인하세요.</div>`
            : `<div class="rank-submit-form">
                 <input type="text" id="tycoon-rank-nickname" class="rank-nick-input" maxlength="12" placeholder="주막 닉네임 (최대 12자)" value="${savedName}" />
                 <button type="button" class="rank-submit-btn" id="tycoon-submit-rank-btn" ${this.isSubmittingRank ? 'disabled' : ''}>
                   ${this.isSubmittingRank ? '등록 중...' : '🏆 랭킹 등록'}
                 </button>
               </div>`
          }
        </div>

        <div class="gameover-actions">
          <button type="button" class="tycoon-start-btn start-infinite" id="tycoon-retry-btn">
            🔄 같은 모드로 다시 영업하기
          </button>
          <button type="button" class="tycoon-secondary-btn" id="tycoon-go-lobby-btn">
            🏠 모드 선택 로비로
          </button>
        </div>
      </div>
    `;
  }

  _renderTavernHall(s) {
    // 입구 대기 손님 표시
    const queueHtml = s.waitingQueue.map((entry, idx) => {
      const avatar = this.engine.customerPool.renderCustomerAvatarSvg(entry.customer, 34);
      return `
        <div class="waiting-guest-pill" title="${entry.customer.name} (${entry.customer.traitHint})">
          <span class="wg-avatar">${avatar}</span>
          <span class="wg-name">${entry.customer.name}</span>
          ${idx === 0 ? `<span class="wg-next-tag">입장대기</span>` : ''}
        </div>
      `;
    }).join('');

    // 4개 좌석 렌더링
    const tablesHtml = s.tables.map((t, idx) => {
      const isSelected = s.selectedTableIdx === idx;
      if (!t.customer || !t.order) {
        return `
          <div class="tavern-seat-card empty ${isSelected ? 'selected' : ''}" data-seat-idx="${idx}">
            <div class="seat-top-bar">
              <span class="seat-num">${t.label}</span>
              <span class="seat-empty-tag">빈 좌석</span>
            </div>
            <div class="seat-empty-body">
              <span class="seat-plus-icon">🪑</span>
              <span class="seat-guide-txt">터치하여 대기 손님 착석 안내</span>
            </div>
          </div>
        `;
      }

      const cust = t.customer;
      const ord = t.order;
      const avatar = this.engine.customerPool.renderCustomerAvatarSvg(cust, 46);
      const hasStockReady = (s.stockMap.get(ord.requiredStockKey) || 0) > 0;

      // 주문 요약 라벨 (MEMORY 주문일 때는 메뉴명 대신 ❓ 늘 먹던 단골 술로 표시!)
      let orderSummaryTitle = '';
      if (ord.orderType === 'MEMORY') {
        orderSummaryTitle = `❓ 늘 먹던 단골 술!`;
      } else if (ord.orderType === 'MEMORY_OMIT') {
        orderSummaryTitle = `❓ 단골 술 (🚫${ord.omittedIngName} 빼기)`;
      } else if (ord.orderType === 'OMIT') {
        orderSummaryTitle = `${ord.recipeName} (🚫${ord.omittedIngName} 빼기)`;
      } else {
        orderSummaryTitle = ord.recipeName;
      }

      return `
        <div class="tavern-seat-card occupied ${isSelected ? 'selected' : ''} ${hasStockReady ? 'ready-to-serve' : ''}" data-seat-idx="${idx}">
          <div class="seat-top-bar">
            <span class="seat-num">${t.label}</span>
            <span class="seat-price-tag">💰 ${ord.price.toLocaleString()}원</span>
          </div>
          <div class="seat-cust-row">
            <div class="seat-avatar-wrap">${avatar}</div>
            <div class="seat-cust-info">
              <div class="seat-cust-name-row">
                <span class="seat-cust-name">${cust.name}</span>
                <span class="seat-group-badge">${cust.group}</span>
              </div>
              <div class="seat-order-type-badge type-${ord.orderType}">${ord.orderBadge}</div>
              <div class="seat-order-target">${orderSummaryTitle}</div>
            </div>
          </div>
          ${hasStockReady
            ? `<button type="button" class="seat-quick-serve-btn" data-quick-serve-seat="${idx}" data-stock-key="${ord.requiredStockKey}">
                 🍶 선반 재고로 즉시 서빙! (+${ord.price.toLocaleString()}원)
               </button>`
            : `<div class="seat-status-hint">${isSelected ? '👇 아래 가마솥에서 제조해 선반에 쌓으세요' : '터치하여 주문 상세 보기'}</div>`
          }
        </div>
      `;
    }).join('');

    // 현재 선택된 좌석의 상세 주문서 & 단골 인상착의 클로즈업 패널
    const activeTable = s.tables[s.selectedTableIdx];
    let activeOrderDetailHtml = '';

    if (activeTable && activeTable.customer && activeTable.order) {
      const cust = activeTable.customer;
      const ord = activeTable.order;
      const bigAvatar = this.engine.customerPool.renderCustomerAvatarSvg(cust, 62);
      const rec = this.recipeBook.getRecipe(ord.recipeId);
      const reqItems = this.recipeBook.getRecipeItems(ord.recipeId);

      // 레시피 공식 표시: 일반/빼기 주문은 제조법을 친절히 보여주고,
      // '늘 먹던 걸로(MEMORY)' 주문은 손님 인상착의를 보고 맞춰야 하므로 [📖단골수첩] 또는 [💡기억 떠올리기] 버튼 제공!
      const isMemoryOrder = (ord.orderType === 'MEMORY' || ord.orderType === 'MEMORY_OMIT');
      const formulaHtml = reqItems.map(it => {
        const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
        const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
        const target = det || base;
        const name = this.brandResolver.resolveName(target);
        const isOmittedThis = ord.omittedBaseId && Number(it.ingredient_id) === Number(ord.omittedBaseId);
        return `<span class="order-ing-chip ${isOmittedThis ? 'is-omit-target' : ''}">
          ${name}(${it.ratio})${isOmittedThis ? ' <b>[➖빼기]</b>' : ''}
        </span>`;
      }).join(' + ');

      activeOrderDetailHtml = `
        <div class="active-order-spotlight">
          <div class="spotlight-left">
            <div class="spotlight-avatar">${bigAvatar}</div>
            <div class="spotlight-cust-meta">
              <span class="sp-cust-name">${cust.name}</span>
              <span class="sp-cust-trait">${cust.traitHint}</span>
            </div>
          </div>
          <div class="spotlight-right">
            <div class="sp-dialogue-bubble">
              ${ord.dialogue}
            </div>
            <div class="sp-formula-row">
              ${isMemoryOrder && !this._memoryHintRevealedForOrderId?.[ord.orderId]
                ? `<div class="sp-memory-mystery-bar">
                     <span>🕵️ <b>[${cust.traitHint}]</b> 단골 손님의 최애 메뉴를 기억하시나요?</span>
                     <button type="button" class="sp-peek-memory-btn" data-reveal-memory="${ord.orderId}">💡 단골 수첩 컨닝하기</button>
                   </div>`
                : `<div class="sp-recipe-guide">
                     <span class="sp-guide-title">🎯 목표 주조법 (${this.brandResolver.resolveName(rec)}):</span>
                     <div class="sp-guide-chips">${formulaHtml}</div>
                     <button type="button" class="sp-autofill-pot-btn" id="tycoon-autofill-order-btn" title="이 손님의 주문 재료를 가마솥에 즉시 세팅합니다">
                       ⚡ 가마솥에 재료 자동 세팅
                     </button>
                   </div>`
              }
            </div>
          </div>
        </div>
      `;
    }

    return `
      <section class="tycoon-section tavern-hall-section">
        <div class="section-hdr-row">
          <div class="section-hdr-left">
            <span class="sec-title">🏮 주막 홀 & 손님 좌석 (4석)</span>
            <div class="waiting-queue-bar">
              <span class="wq-label">입구 대기:</span>
              ${queueHtml || '<span class="wq-empty">대기 없음</span>'}
            </div>
          </div>
          <label class="auto-seat-toggle" title="빈 좌석이 생기면 대기 중인 손님을 자동으로 안내합니다">
            <input type="checkbox" id="tycoon-auto-seat-chk" ${s.autoSeatEnabled ? 'checked' : ''} />
            <span>자동 착석 안내</span>
          </label>
        </div>

        <div class="tavern-seats-grid">
          ${tablesHtml}
        </div>

        ${activeOrderDetailHtml}
      </section>
    `;
  }

  _renderStockpileShelf(s) {
    const entries = Array.from(s.stockMap.entries()).filter(([, cnt]) => cnt > 0);
    const activeTable = s.tables[s.selectedTableIdx];
    const targetOrderKey = activeTable?.order?.requiredStockKey || null;

    const itemsHtml = entries.map(([stockKey, count]) => {
      const meta = this.engine.getStockItemDisplayMeta(stockKey);
      if (!meta) return '';
      const isMatchingActiveOrder = targetOrderKey && targetOrderKey === stockKey;

      return `
        <div class="stock-shelf-card ${meta.omittedName ? 'is-omitted-stock' : ''} ${isMatchingActiveOrder ? 'matches-active-order' : ''}"
             data-serve-stock-key="${stockKey}"
             title="클릭하면 현재 선택된 ${s.selectedTableIdx + 1}번석 손님에게 즉시 서빙합니다!">
          <div class="stock-card-top">
            <span class="stock-qty-badge">x${count}</span>
            <span class="stock-price-est">~${meta.estPrice}원</span>
          </div>
          <div class="stock-icon">${meta.iconHtml}</div>
          <div class="stock-name">${meta.recipeName}</div>
          ${meta.omittedName
            ? `<div class="stock-omit-tag">🚫 ${meta.omittedName} 빼기</div>`
            : `<div class="stock-normal-tag">정석 제조</div>`
          }
          <button type="button" class="stock-serve-action-btn">
            ${isMatchingActiveOrder ? '🎯 주문 일치! 서빙' : `${s.selectedTableIdx + 1}번석에 서빙`}
          </button>
        </div>
      `;
    }).join('');

    return `
      <section class="tycoon-section stockpile-shelf-section">
        <div class="section-hdr-row">
          <span class="sec-title">📦 내 주막 재고 선반 <small>(만든 조합이 1개씩 쌓입니다 · 터치 시 선택 좌석에 서빙)</small></span>
          <span class="stock-total-pill">보유 재고 총 <b>${entries.reduce((a, [, c]) => a + c, 0)}</b>잔</span>
        </div>
        <div class="stockpile-shelf-grid">
          ${itemsHtml || `
            <div class="stockpile-empty-notice">
              선반에 쌓인 술이 없습니다! 아래 가마솥에서 재료를 조합해 선반에 쌓아주세요.
            </div>
          `}
        </div>
      </section>
    `;
  }

  _renderTycoonBrewery(s) {
    const potSlots = s.potSlots;
    const preview = this.engine.previewTycoonPotMatch();

    // 가마솥 슬롯 4~6칸 렌더링 (각 슬롯마다 [➖빼기] 토글 버튼 탑재!)
    const displayLen = Math.max(4, potSlots.length);
    const slotsHtml = [];
    for (let i = 0; i < displayLen; i++) {
      const slot = potSlots[i];
      if (slot) {
        const det = slot.detailId ? this.recipeBook.getDetailIngredient(slot.detailId) : null;
        const base = this.recipeBook.getBaseIngredient(slot.baseId);
        const target = det || base;
        const name = this.brandResolver.resolveName(target);
        const icon = window.KSool?.pixelIcon ? window.KSool.pixelIcon(target, 26) : (target?.emoji || '🍶');

        slotsHtml.push(`
          <div class="tycoon-pot-slot filled ${slot.isOmitted ? 'slot-omitted' : ''}" data-tycoon-slot-idx="${i}">
            <button type="button"
                    class="tycoon-slot-omit-btn ${slot.isOmitted ? 'active' : ''}"
                    data-toggle-omit-idx="${i}"
                    title="손님이 이 재료를 빼달라고 했을 때 누르세요! (조합은 유지하되 빼기 표시를 남겨 다른 레시피와 겹치지 않게 합니다)">
              ${slot.isOmitted ? '🚫빼기됨' : '➖빼기'}
            </button>
            <div class="tycoon-slot-body" data-dec-slot-idx="${i}" title="터치하면 개수가 1 줄어듭니다">
              <span class="t-slot-icon">${icon}</span>
              <span class="t-slot-name">${name}</span>
              <span class="t-slot-count">x${slot.count}</span>
            </div>
          </div>
        `);
      } else {
        slotsHtml.push(`
          <div class="tycoon-pot-slot empty">
            <span class="t-empty-plus">➕</span>
            <span class="t-empty-txt">재료 ${i + 1}</span>
          </div>
        `);
      }
    }

    // 실시간 조합 미리보기 배너
    let matchBannerHtml = '';
    if (preview) {
      const label = preview.omittedIngName
        ? `${preview.recipeName} <span class="preview-omit-pill">🚫${preview.omittedIngName} 빼기 적용</span>`
        : preview.recipeName;
      matchBannerHtml = `
        <div class="tycoon-pot-preview matched">
          <span>✨ 예상 완성품: <b>${label}</b></span>
          <span class="preview-sub">조합 시 선반에 +1개 쌓입니다!</span>
        </div>
      `;
    } else if (potSlots.length >= 2) {
      matchBannerHtml = `
        <div class="tycoon-pot-preview unmatched">
          <span>❓ 아직 일치하는 조합법이 없습니다. 재료와 비율을 확인하세요!</span>
        </div>
      `;
    } else {
      matchBannerHtml = `
        <div class="tycoon-pot-preview idle">
          <span>💡 팁: 손님이 <b>"특정 재료를 빼고 달라고"</b> 하면, 원래 레시피 재료를 모두 올린 뒤 해당 슬롯 위의 <b>[➖빼기]</b> 버튼을 켜고 조합하세요!</span>
        </div>
      `;
    }

    // 카테고리 탭 및 전체 재료 그리드 (100% 해금 유저이므로 모든 재료와 특산 선택기 오픈!)
    const categories = this.recipeBook.categories;
    const catChipsHtml = categories.map(c => `
      <button type="button" class="cat-chip ${this.selectedIngCat === c.category_id ? 'active' : ''}" data-tycoon-ing-cat="${c.category_id}">
        ${c.name}
      </button>
    `).join('');

    const allIngs = Array.from(this.recipeBook.baseIngredients.values())
      .filter(ing => ing.category_id === this.selectedIngCat)
      .sort((a, b) => a.ingredient_id - b.ingredient_id);

    const ingsHtml = allIngs.map(ing => {
      const inPotCount = potSlots
        .filter(s => s.baseId === ing.ingredient_id)
        .reduce((acc, s) => acc + s.count, 0);
      const details = this.recipeBook.getDetailsForBase(ing.ingredient_id);
      const hasPicker = details.length > 0 && ing.picker_component && ing.picker_component !== 'NONE';
      const name = this.brandResolver.resolveName(ing);
      const icon = window.KSool?.pixelIcon ? window.KSool.pixelIcon(ing, 28) : ing.emoji;

      return `
        <div class="ing-card tycoon-ing-card ${inPotCount > 0 ? 'in-pot' : ''}" data-tycoon-base-ing="${ing.ingredient_id}">
          ${hasPicker ? `<button type="button" class="ing-picker-btn" data-tycoon-detail-picker="${ing.ingredient_id}">✨상세▾</button>` : ''}
          <span class="ing-emoji">${icon}</span>
          <span class="ing-name">${name}</span>
          ${inPotCount > 0 ? `<span class="slot-count-badge">${inPotCount}</span>` : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="tycoon-section tycoon-brewery-section">
        <div class="section-hdr-row">
          <span class="sec-title">⚗️ 주막 주조 가마솥 <small>(조합하면 선반에 1개씩 쌓입니다)</small></span>
          <div class="tycoon-pot-btns">
            <button type="button" class="tycoon-craft-btn" id="tycoon-craft-stock-btn" ${potSlots.length < 2 ? 'disabled' : ''}>
              🍶 조합하여 선반에 쌓기 (+1)
            </button>
            <button type="button" class="tycoon-clear-btn" id="tycoon-clear-pot-btn">비우기</button>
          </div>
        </div>

        <div class="tycoon-pot-slots-row">
          ${slotsHtml.join('')}
        </div>

        ${matchBannerHtml}

        <div class="tycoon-ing-cat-bar cat-filter-bar">
          ${catChipsHtml}
        </div>
        <div class="tycoon-ings-grid ingredients-grid">
          ${ingsHtml}
        </div>
      </section>
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
            <span class="r-served"><b>${r.served_count}</b>명 서빙</span>
            <span class="r-earn">${Number(r.total_earnings || 0).toLocaleString()}원</span>
          </div>
        `;
      }).join('');

      return `
        <div class="tycoon-submodal-overlay" id="tycoon-submodal-overlay">
          <div class="tycoon-submodal-card">
            <div class="submodal-hdr">
              <h3>🏆 주막 타이쿤 글로벌 Top 100 순위</h3>
              <button type="button" class="submodal-close-btn" id="tycoon-close-submodal">✕</button>
            </div>
            <div class="submodal-tabs">
              <button type="button" class="submodal-tab ${this.leaderboardTab === 'TIME_ATTACK' ? 'active' : ''}" data-lb-tab="TIME_ATTACK">
                ⏱️ 타임어택 Top 100
              </button>
              <button type="button" class="submodal-tab ${this.leaderboardTab === 'INFINITE' ? 'active' : ''}" data-lb-tab="INFINITE">
                ♾️ 무한모드 Top 100
              </button>
            </div>
            <div class="tycoon-rank-list">
              ${rowsHtml || '<div style="padding:20px; text-align:center; color:#94a3b8;">아직 등록된 랭킹이 없습니다.</div>'}
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
        const items = this.recipeBook.getRecipeItems(c.preferredRecipeId);
        const formulaStr = items.map(it => {
          const det = this.recipeBook.getDetailIngredient(it.detail_ingredient_id);
          const base = this.recipeBook.getBaseIngredient(it.ingredient_id);
          return `${this.brandResolver.resolveName(det || base)}(${it.ratio})`;
        }).join(' + ');

        const omitBase = this.recipeBook.getBaseIngredient(c.preferredOmitIngId);
        const omitName = omitBase ? this.brandResolver.resolveName(omitBase) : '';
        const avatar = this.engine.customerPool.renderCustomerAvatarSvg(c, 48);

        return `
          <div class="notebook-cust-card">
            <div class="nb-avatar">${avatar}</div>
            <div class="nb-info">
              <div class="nb-top">
                <span class="nb-name">${c.name}</span>
                <span class="nb-group">${c.group} · ${c.title}</span>
              </div>
              <div class="nb-trait">👀 외형 특징: <b>${c.traitHint}</b></div>
              <div class="nb-fav">🍶 늘 먹던 술: <b style="color:#fde047;">${recName}</b> <small>(${formulaStr})</small></div>
              ${omitName ? `<div class="nb-omit">➖ 단골 빼기 취향: <span>${omitName} 빼기</span></div>` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="tycoon-submodal-overlay" id="tycoon-submodal-overlay">
          <div class="tycoon-submodal-card notebook-modal-card">
            <div class="submodal-hdr">
              <h3>📖 주막 단골 손님 인상착의 & 최애 술 수첩</h3>
              <button type="button" class="submodal-close-btn" id="tycoon-close-submodal">✕</button>
            </div>
            <div class="notebook-guide-banner">
              💡 <b>모자 · 안경 · 수염 · 복장</b>이 미묘하게 닮은 단골 손님들입니다! 손님이 <b>"늘 먹던 걸로 주세요!"</b>라고 할 때 인상착의를 보고 단골 술을 찾아내세요.
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
    // 1. 로비에서 모드 시작
    container.querySelectorAll('[data-start-mode]').forEach(btn => {
      btn.onclick = () => {
        const mode = btn.getAttribute('data-start-mode');
        this.audio?.playTap?.();
        this.hasSubmittedCurrentGame = false;
        this._memoryHintRevealedForOrderId = {};
        this.engine.startGame(mode);
        this._startTimerLoop();
        this.render();
      };
    });

    // 2. 상단 유틸 버튼 (단골수첩 / Top 100 / 모드변경)
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

    // 3. 자동 착석 체크박스
    const autoSeatChk = container.querySelector('#tycoon-auto-seat-chk');
    if (autoSeatChk) {
      autoSeatChk.onchange = () => {
        this.engine.session.autoSeatEnabled = autoSeatChk.checked;
        if (autoSeatChk.checked) {
          this.engine.autoSeatAvailableTables();
        }
        this.render();
      };
    }

    // 4. 좌석 카드 클릭 (빈 좌석이면 손님 착석 안내, 손님이 있으면 해당 좌석 주문 포커스)
    container.querySelectorAll('[data-seat-idx]').forEach(seatEl => {
      seatEl.onclick = (e) => {
        if (e.target.closest('[data-quick-serve-seat]')) return;
        const idx = Number(seatEl.getAttribute('data-seat-idx'));
        this.audio?.playTap?.();
        this.engine.session.selectedTableIdx = idx;
        const table = this.engine.session.tables[idx];
        if (!table.customer) {
          this.engine.seatNextCustomerToTable(idx);
        }
        this.render();
      };
    });

    // 5. 좌석 카드 내 [즉시 서빙] 버튼
    container.querySelectorAll('[data-quick-serve-seat]').forEach(qBtn => {
      qBtn.onclick = (e) => {
        e.stopPropagation();
        const seatIdx = Number(qBtn.getAttribute('data-quick-serve-seat'));
        const stockKey = qBtn.getAttribute('data-stock-key');
        this._handleServeAction(stockKey, seatIdx);
      };
    });

    // 6. 단골 기억 주문 컨닝하기 & 가마솥 재료 자동 세팅 버튼
    container.querySelectorAll('[data-reveal-memory]').forEach(peekBtn => {
      peekBtn.onclick = () => {
        const ordId = peekBtn.getAttribute('data-reveal-memory');
        if (!this._memoryHintRevealedForOrderId) this._memoryHintRevealedForOrderId = {};
        this._memoryHintRevealedForOrderId[ordId] = true;
        this.audio?.playTap?.();
        this.render();
      };
    });

    const autoFillBtn = container.querySelector('#tycoon-autofill-order-btn');
    if (autoFillBtn) {
      autoFillBtn.onclick = () => {
        const activeTable = this.engine.session.tables[this.engine.session.selectedTableIdx];
        if (!activeTable || !activeTable.order) return;
        const ord = activeTable.order;
        const reqItems = this.recipeBook.getRecipeItems(ord.recipeId);
        this.engine.clearTycoonPot();
        reqItems.forEach(it => {
          const ratio = Math.max(1, Number(it.ratio) || 1);
          const detId = it.detail_ingredient_id ? Number(it.detail_ingredient_id) : null;
          for (let i = 0; i < ratio; i++) {
            this.engine.tapIngredientInTycoonPot(it.ingredient_id, detId);
          }
        });
        // 만약 빼기 주문이면 해당 슬롯의 빼기(isOmitted) 태그까지 자동으로 켜줌!
        if (ord.omittedBaseId) {
          const slotIdx = this.engine.session.potSlots.findIndex(
            s => Number(s.baseId) === Number(ord.omittedBaseId)
          );
          if (slotIdx >= 0) {
            this.engine.toggleOmitOnTycoonPotSlot(slotIdx);
          }
        }
        this.audio?.playTap?.();
        this.render();
      };
    }

    // 7. 선반 재고 카드 클릭 시 현재 선택된 테이블에 서빙
    container.querySelectorAll('[data-serve-stock-key]').forEach(card => {
      card.onclick = () => {
        const stockKey = card.getAttribute('data-serve-stock-key');
        this._handleServeAction(stockKey, this.engine.session.selectedTableIdx);
      };
    });

    // 8. 타이쿤 가마솥 슬롯 조작 ([➖빼기] 토글 및 개수 차감)
    container.querySelectorAll('[data-toggle-omit-idx]').forEach(omitBtn => {
      omitBtn.onclick = (e) => {
        e.stopPropagation();
        const idx = Number(omitBtn.getAttribute('data-toggle-omit-idx'));
        this.engine.toggleOmitOnTycoonPotSlot(idx);
        this.audio?.playTap?.();
        this.render();
      };
    });

    container.querySelectorAll('[data-dec-slot-idx]').forEach(slotBody => {
      slotBody.onclick = () => {
        const idx = Number(slotBody.getAttribute('data-dec-slot-idx'));
        this.engine.decrementTycoonPotSlot(idx);
        this.audio?.playTap?.();
        this.render();
      };
    });

    // 9. 조합하여 선반에 쌓기 & 비우기
    const craftBtn = container.querySelector('#tycoon-craft-stock-btn');
    if (craftBtn) {
      craftBtn.onclick = () => {
        const res = this.engine.craftToStockpile();
        if (!res.ok) {
          this.app?.showToast?.(`⚠️ ${res.message}`);
        } else {
          this.app?.showToast?.(`🍶 [${res.label}] 선반 적재 완료! (보유: ${res.newCount}잔)`);
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

    // 10. 카테고리 필터 & 재료 카드 투입
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

    // 11. 게임오버 랭킹 등록 & 재도전
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
        this.app?.showToast?.(
          res.rank
            ? `🎉 글로벌 Top 100 랭킹 [${res.rank}위]에 등재되었습니다!`
            : `🎉 랭킹 기록이 등록되었습니다!`
        );
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
        this.render();
      };
    }
  }

  _handleServeAction(stockKey, seatIdx) {
    const res = this.engine.serveStockToTable(stockKey, seatIdx);
    if (!res.ok) {
      this.audio?.playFail?.();
      this.app?.showToast?.(`⚠️ ${res.message}`);
      return;
    }

    if (res.isCorrect) {
      this.app?.showToast?.(`💰 서빙 성공! +${res.earned.toLocaleString()}원 (${this.engine.session.combo}콤보🔥)`);
    } else {
      this.app?.showToast?.(`💔 서빙 실수! 손님이 원한 메뉴: [${res.expectedLabel}]`);
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
