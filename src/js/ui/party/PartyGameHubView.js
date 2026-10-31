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
        title: '숫자 Up & Down',
        badge: '벌칙자 지목',
        accentColor: '#38bdf8',
        desc: '병뚜껑 속 숫자를 맞춰라! 정답을 입력하는 순간 폭탄 폭발!',
        tags: ['1~50 / 1~100', '패스앤플레이', '스릴만점'],
        players: '2명 이상'
      },
      {
        key: 'capflick',
        emoji: '👊',
        title: '병뚜껑 꼬다리 치기',
        badge: '릴레이 타격',
        accentColor: '#10b981',
        desc: '실제 소주 뚜껑 철사 꼬다리를 튕겨 완전히 날려버리는 사람이 승리!',
        tags: ['알루미늄 피로도', '터치·스와이프 타격', '원샷 벌칙'],
        players: '2~6명'
      },
      {
        key: 'surface',
        emoji: '🌊',
        title: '표면장력 소주잔 채우기',
        badge: '아웃 카운트',
        accentColor: '#06b6d4',
        desc: '찰랑찰랑 넘치기 직전까지! 표면장력 한계를 넘기면 술이 쏟아집니다!',
        tags: ['2D 물리 엔진', '심장박동 사운드', '꾹 눌러 따르기'],
        players: '2~6명'
      },
      {
        key: 'bottlespin',
        emoji: '🍾',
        title: '소주병 돌리기 & 손가락 룰렛',
        badge: '테이블 중앙 거치',
        accentColor: '#f59e0b',
        desc: '테이블 중앙에 폰을 눕혀두고 진행하는 360° 소주병 회전 & 5인 동시 멀티터치 지목!',
        tags: ['360° 회전 물리', '5인 멀티터치', '진실게임·흑기사'],
        players: '2인 이상'
      },
      {
        key: 'hunmin',
        emoji: '💣',
        title: '3초 훈민정음 시한폭탄',
        badge: '폭탄 돌리기',
        accentColor: '#ef4444',
        desc: '초대형 초성을 보고 3초 안에 육성으로 단어를 외친 뒤 폰을 넘겨라!',
        tags: ['3.0초 긴급 카운트', '초성 40여 종', '스피드 게임'],
        players: '2명 이상'
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

  triggerPenalty({ title, subtitle, accentColor = '#ef4444' }) {
    this.vibratePenalty();

    const overlay = document.getElementById('party-penalty-overlay');
    if (!overlay) return;

    overlay.style.setProperty('--penalty-color', accentColor);
    overlay.innerHTML = `
      <div class="penalty-modal-card">
        <div class="penalty-siren-halo">🚨</div>
        <div class="penalty-title">${title}</div>
        <div class="penalty-subtitle">${subtitle}</div>
        <div class="penalty-tap-hint">👆 화면 아무 곳이나 터치하면 다음 판 즉시 시작!</div>
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
      this.games[this.activeGameKey].destroy();
    }

    this.mode = 'lobby';
    this.activeGameKey = null;
    this.releaseWakeLock();
    this.sound.playTap();

    const container = document.getElementById(this.containerId);
    if (container) {
      container.classList.remove('party-fullscreen-mode');
    }

    if (shouldUpdateHistory) {
      if (window.history.state && window.history.state.partyGame) {
        window.history.back();
        return; // popstate 핸들러가 openLobby(false)를 호출함
      } else {
        try {
          window.history.replaceState(null, '', '#party');
        } catch (_) {}
      }
    }

    this.render();
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
                  <span class="lobby-card-players">👥 ${g.players}</span>
                </div>
                <div class="lobby-card-title">${g.title}</div>
                <div class="lobby-card-desc">${g.desc}</div>
                <div class="lobby-card-tags">
                  ${g.tags.map(t => `<span class="lobby-tag">#${t}</span>`).join('')}
                </div>
              </div>
              <div class="lobby-card-action">
                <span class="lobby-action-arrow">➔</span>
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
      backBtn.onclick = () => {
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
