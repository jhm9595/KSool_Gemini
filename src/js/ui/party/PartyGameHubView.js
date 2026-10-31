window.KSool = window.KSool || {};

/**
 * 오프라인 술자리 패스앤플레이(Pass-and-Play) 미니게임 허브 뷰 (SPA 아키텍처)
 * - 5대 테이블탑 술게임 총괄 매니저
 * - 2-스테이지 SPA 뷰: [게임 목록 로비(Lobby)] <-> [전체화면 몰입형 플레이(Game Fullscreen)]
 * - 브라우저 History API 연동 (뒤로가기 버튼 / 모바일 뒤로가기 제스처 완벽 지원)
 * - Screen Wake Lock (게임 진행 중 화면 꺼짐 방지)
 * - 고출력 Web Audio 피드백 & Web Vibration
 * - 1초 내 빠른 재시작 풀스크린 벌칙 오버레이
 */
class PartyGameHubView {
  constructor(containerId = 'view-party') {
    this.containerId = containerId;
    this.sound = new window.KSool.PartySoundSynth();
    this.mode = 'lobby'; // 'lobby' | 'game'
    this.activeGameKey = null;
    this.wakeLock = null;

    // 5대 술게임 메타데이터 목록 (로비 카드 렌더링용)
    this.gamesList = [
      {
        key: 'updown',
        emoji: '🧢',
        title: 'Up & Down',
        badge: '벌칙자 지목',
        accentColor: '#38bdf8',
        desc: '병뚜껑 속 숫자를 맞히는 게임'
      },
      {
        key: 'capflick',
        emoji: '👊',
        title: '병뚜껑 꼬다리 치기',
        badge: '릴레이 타격',
        accentColor: '#10b981',
        desc: '병뚜껑 꼬다리를 쳐서 날려버리는 게임'
      },
      {
        key: 'surface',
        emoji: '🌊',
        title: '표면장력 소주잔 채우기',
        badge: '아웃 카운트',
        accentColor: '#06b6d4',
        desc: '소주잔이 넘치기 직전까지 술을 채우는 게임'
      },
      {
        key: 'bottlespin',
        emoji: '🍾',
        title: '소주병 돌리기',
        badge: '테이블 중앙',
        accentColor: '#f59e0b',
        desc: '소주병을 돌려 벌칙자를 지목하는 게임'
      },
      {
        key: 'hunmin',
        emoji: '💣',
        title: '훈민정음 시한폭탄',
        badge: '폭탄 돌리기',
        accentColor: '#ef4444',
        desc: '제시된 초성의 단어를 외치며 폭탄을 넘기는 게임'
      }
    ];

    // 게임 모듈 인스턴스
    this.games = {
      updown: new window.KSool.UpAndDownGame(this),
      capflick: new window.KSool.CapFlickGame(this),
      surface: new window.KSool.SurfaceTensionGame(this),
      bottlespin: new window.KSool.BottleSpinGame(this),
      hunmin: new window.KSool.HunminBombGame(this)
    };

    this._setupWakeLockListener();
    this._setupHistoryListener();
  }

  getGameMeta(key) {
    return this.gamesList.find(g => g.key === key) || this.gamesList[0];
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (_) {}
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (_) {}
      this.wakeLock = null;
    }
  }

  _setupWakeLockListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.mode === 'game') {
        this.requestWakeLock();
      }
    });
  }

  /**
   * SPA 브라우저 뒤로가기 / 히스토리 연동
   * 모바일 뒤로가기 제스처나 브라우저 뒤로가기 클릭 시 웹사이트를 이탈하지 않고
   * 게임 플레이 화면에서 [게임 목록 로비]로 자연스럽게 복귀합니다.
   */
  _setupHistoryListener() {
    window.addEventListener('popstate', (e) => {
      const container = document.getElementById(this.containerId);
      if (!container || !container.classList.contains('active')) return;

      if (this.mode === 'game') {
        this.openLobby(false);
      }
    });
  }

  vibrateShort() {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(25); } catch (_) {}
    }
  }

  vibratePenalty() {
    if ('vibrate' in navigator) {
      try { navigator.vibrate([100, 50, 100, 50, 300]); } catch (_) {}
    }
  }

  triggerPenalty({ title, subtitle, accentColor = '#ef4444', icon = '🚨' }) {
    this.vibratePenalty();

    const overlay = document.getElementById('party-penalty-overlay');
    if (!overlay) return;

    overlay.style.setProperty('--penalty-color', accentColor);
    overlay.innerHTML = `
      <div class="penalty-modal-card">
        <div class="penalty-siren-halo">${icon}</div>
        <div class="penalty-title">${title}</div>
        <div class="penalty-subtitle">${subtitle}</div>
        <div class="penalty-tap-hint">터치하여 계속</div>
      </div>
    `;

    overlay.classList.add('active');

    const handleDismiss = (e) => {
      e.stopPropagation();
      overlay.classList.remove('active');
      overlay.removeEventListener('click', handleDismiss);
      overlay.removeEventListener('touchstart', handleDismiss);
      this.sound.playTap();
      // 현재 게임 리셋
      if (this.games[this.activeGameKey]) {
        this.games[this.activeGameKey].reset();
      }
    };

    overlay.addEventListener('click', handleDismiss);
    overlay.addEventListener('touchstart', handleDismiss, { passive: true });
  }

  /**
   * 탭 전환 등으로 술게임 뷰를 벗어날 때 정리
   */
  onLeavePartyTab() {
    this.releaseWakeLock();
    if (this.mode === 'game') {
      this.openLobby(false);
    }
  }

  /**
   * 게임 선택 -> 전체화면 몰입형 플레이 화면 진입
   */
  playGame(gameKey) {
    if (!this.games[gameKey]) return;

    // 이전 실행 중인 게임 클린업
    if (this.activeGameKey && this.games[this.activeGameKey] && typeof this.games[this.activeGameKey].destroy === 'function') {
      this.games[this.activeGameKey].destroy();
    }

    this.mode = 'game';
    this.activeGameKey = gameKey;
    this.sound.playTap();

    // SPA 히스토리 상태 푸시 (뒤로가기 지원)
    try {
      window.history.pushState({ partyGame: gameKey }, '', `#party/${gameKey}`);
    } catch (_) {}

    this.render();
  }

  /**
   * 뒤로가기 버튼 클릭 -> 게임 목록 로비로 복귀
   */
  openLobby(shouldUpdateHistory = true) {
    // 실행 중이던 게임 정리
    if (this.activeGameKey && this.games[this.activeGameKey] && typeof this.games[this.activeGameKey].destroy === 'function') {
      try {
        this.games[this.activeGameKey].destroy();
      } catch (_) {}
    }

    this.mode = 'lobby';
    this.activeGameKey = null;
    this.releaseWakeLock();
    this.sound.playTap();

    const container = document.getElementById(this.containerId);
    if (container) {
      container.classList.remove('party-fullscreen-mode');
    }

    // 1. 무조건 즉시 게임 목록 로비를 화면에 렌더링!
    this.render();

    // 2. 브라우저 히스토리 상태 정리 (뒤로가기 스택 동기화)
    if (shouldUpdateHistory) {
      if (window.history.state && window.history.state.partyGame) {
        try {
          window.history.back();
        } catch (_) {}
      } else {
        try {
          const cleanUrl = window.location.href.split('#')[0];
          window.history.replaceState(null, '', cleanUrl);
        } catch (_) {}
      }
    }
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.mode === 'lobby') {
      container.classList.remove('party-fullscreen-mode');
      this.renderLobby(container);
    } else {
      container.classList.add('party-fullscreen-mode');
      this.renderGameStage(container);
    }
  }

  /**
   * [뷰 1] 화면 중앙 5대 술게임 대형 카드 선택 로비
   */
  renderLobby(container) {
    container.innerHTML = `
      <div class="party-lobby-container">
        <!-- 상단 헤더 -->
        <div class="party-lobby-header">
          <div class="party-lobby-top-row">
            <span class="party-badge">OFFLINE TABLETOP</span>
            <button type="button" class="party-sound-toggle-btn" id="party-sound-toggle">
              ${this.sound.isMuted ? '🔇 무음' : '🔊 효과음'}
            </button>
          </div>
          <h2 class="party-lobby-title">🍻 술자리 미니게임 모음</h2>
          <p class="party-lobby-desc">스마트폰을 테이블 중앙에 두고 함께 즐기는 5대 술자리 게임!</p>
        </div>

        <!-- 중앙 큼지막한 게임 선택 카드 목록 -->
        <div class="party-games-grid-menu">
          ${this.gamesList.map(g => `
            <div class="party-lobby-card" data-start-game="${g.key}" style="--card-accent:${g.accentColor};">
              <div class="lobby-card-emoji-wrap">
                <span class="lobby-card-emoji">${g.emoji}</span>
              </div>
              <div class="lobby-card-body">
                <div class="lobby-card-header">
                  <span class="lobby-card-badge" style="color:${g.accentColor}; border-color:${g.accentColor};">${g.badge}</span>
                </div>
                <div class="lobby-card-title">${g.title}</div>
                <div class="lobby-card-desc">${g.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // 게임 선택 이벤트 바인딩
    container.querySelectorAll('[data-start-game]').forEach(card => {
      card.onclick = () => {
        const key = card.getAttribute('data-start-game');
        this.playGame(key);
      };
    });

    const soundBtn = container.querySelector('#party-sound-toggle');
    if (soundBtn) {
      soundBtn.onclick = () => {
        this.sound.isMuted = !this.sound.isMuted;
        soundBtn.textContent = this.sound.isMuted ? '🔇 무음' : '🔊 효과음';
      };
    }
  }

  /**
   * [뷰 2] 선택한 게임의 전체화면 몰입형 플레이 스테이지 (뒤로가기 탑바 포함)
   */
  renderGameStage(container) {
    const meta = this.getGameMeta(this.activeGameKey);
    this.requestWakeLock();

    container.innerHTML = `
      <div class="party-fullscreen-wrapper">
        <!-- 상단 미니 탑바: 뒤로가기 버튼 + 현재 게임 뱃지 + 사운드 토글 -->
        <div class="party-game-top-bar">
          <button type="button" class="party-back-btn" id="party-back-btn">
            <span class="back-icon">‹</span>
            <span class="back-label">게임 목록</span>
          </button>
          <div class="party-active-game-pill" style="border-color:${meta.accentColor};">
            <span class="pill-emoji">${meta.emoji}</span>
            <span class="pill-title">${meta.title}</span>
          </div>
          <button type="button" class="party-sound-toggle-btn" id="party-sound-toggle">
            ${this.sound.isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        <!-- 전체화면 가득 찬 게임 실행 영역 -->
        <div id="party-game-stage" class="party-game-stage fullscreen"></div>

        <!-- 풀스크린 벌칙 플래시 오버레이 -->
        <div id="party-penalty-overlay" class="party-penalty-overlay"></div>
      </div>
    `;

    // 뒤로가기 버튼 이벤트
    const backBtn = container.querySelector('#party-back-btn');
    if (backBtn) {
      backBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.openLobby(true);
      };
    }

    const soundBtn = container.querySelector('#party-sound-toggle');
    if (soundBtn) {
      soundBtn.onclick = () => {
        this.sound.isMuted = !this.sound.isMuted;
        soundBtn.textContent = this.sound.isMuted ? '🔇' : '🔊';
      };
    }

    // 선택된 게임 인스턴스 초기화 및 마운트
    if (this.games[this.activeGameKey]) {
      this.games[this.activeGameKey].init();
    }
  }
}

window.KSool.PartyGameHubView = PartyGameHubView;
