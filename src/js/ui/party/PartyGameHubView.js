window.KSool = window.KSool || {};

/**
 * 오프라인 술자리 패스앤플레이(Pass-and-Play) 미니게임 허브 뷰
 * - 5대 테이블탑 술게임 총괄 매니저
 * - Screen Wake Lock (화면 꺼짐 방지)
 * - 고출력 Web Audio 피드백 & Web Vibration
 * - 1초 내 빠른 재시작 풀스크린 벌칙 오버레이
 */
class PartyGameHubView {
  constructor(containerId = 'view-party') {
    this.containerId = containerId;
    this.sound = new window.KSool.PartySoundSynth();
    this.activeGameKey = 'updown'; // 'updown' | 'capflick' | 'surface' | 'bottlespin' | 'hunmin'
    this.wakeLock = null;

    // 게임 모듈 인스턴스
    this.games = {
      updown: new window.KSool.UpAndDownGame(this),
      capflick: new window.KSool.CapFlickGame(this),
      surface: new window.KSool.SurfaceTensionGame(this),
      bottlespin: new window.KSool.BottleSpinGame(this),
      hunmin: new window.KSool.HunminBombGame(this)
    };

    this._setupWakeLockListener();
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
      if (document.visibilityState === 'visible' && document.getElementById(this.containerId)?.classList.contains('active')) {
        this.requestWakeLock();
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

  switchGame(gameKey) {
    if (!this.games[gameKey]) return;

    // 이전 게임 cleanup
    if (this.games[this.activeGameKey] && typeof this.games[this.activeGameKey].destroy === 'function') {
      this.games[this.activeGameKey].destroy();
    }

    this.activeGameKey = gameKey;
    this.sound.playTap();
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    this.requestWakeLock();

    container.innerHTML = `
      <div class="party-hub-container">
        <!-- 상단 헤더 & 게임 선택 메뉴 캐러셀 -->
        <div class="party-nav-header">
          <div class="party-hub-title-row">
            <div class="party-hub-title">
              <span class="party-badge">OFFLINE TABLETOP</span>
              <span class="party-main-text">🍻 술자리 미니게임 모음</span>
            </div>
            <button type="button" class="party-sound-toggle-btn" id="party-sound-toggle">
              ${this.sound.isMuted ? '🔇 무음' : '🔊 효과음'}
            </button>
          </div>

          <!-- 5대 미니게임 셀렉터 바 -->
          <div class="party-game-tab-strip">
            <button type="button" class="party-strip-tab ${this.activeGameKey === 'updown' ? 'active' : ''}" data-game="updown">
              <span class="tab-emoji">🧢</span>
              <span class="tab-name">숫자 Up&Down</span>
            </button>
            <button type="button" class="party-strip-tab ${this.activeGameKey === 'capflick' ? 'active' : ''}" data-game="capflick">
              <span class="tab-emoji">👊</span>
              <span class="tab-name">꼬다리 치기</span>
            </button>
            <button type="button" class="party-strip-tab ${this.activeGameKey === 'surface' ? 'active' : ''}" data-game="surface">
              <span class="tab-emoji">🌊</span>
              <span class="tab-name">표면장력 소주잔</span>
            </button>
            <button type="button" class="party-strip-tab ${this.activeGameKey === 'bottlespin' ? 'active' : ''}" data-game="bottlespin">
              <span class="tab-emoji">🍾</span>
              <span class="tab-name">소주병 돌리기</span>
            </button>
            <button type="button" class="party-strip-tab ${this.activeGameKey === 'hunmin' ? 'active' : ''}" data-game="hunmin">
              <span class="tab-emoji">💣</span>
              <span class="tab-name">3초 훈민정음</span>
            </button>
          </div>
        </div>

        <!-- 게임 실행 영역 (반응형 360도 네온 무대) -->
        <div id="party-game-stage" class="party-game-stage"></div>

        <!-- 풀스크린 벌칙 플래시 오버레이 -->
        <div id="party-penalty-overlay" class="party-penalty-overlay"></div>
      </div>
    `;

    this._bindEvents();

    // 현재 활성화된 게임 렌더링
    if (this.games[this.activeGameKey]) {
      this.games[this.activeGameKey].init();
    }
  }

  _bindEvents() {
    document.querySelectorAll('.party-strip-tab').forEach(btn => {
      btn.onclick = (e) => {
        const game = e.currentTarget.getAttribute('data-game');
        this.switchGame(game);
      };
    });

    const soundBtn = document.getElementById('party-sound-toggle');
    if (soundBtn) {
      soundBtn.onclick = () => {
        this.sound.isMuted = !this.sound.isMuted;
        soundBtn.textContent = this.sound.isMuted ? '🔇 무음' : '🔊 효과음';
      };
    }
  }
}

window.KSool.PartyGameHubView = PartyGameHubView;
