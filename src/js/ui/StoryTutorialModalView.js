window.KSool = window.KSool || {};

/**
 * 🎬 애니메이션 컷신 방식 스토리 & 튜토리얼 플레이어 (StoryTutorialModalView)
 *
 * - 장황한 텍스트나 복잡한 UI 버튼 대신, 웹툰/애니메이션 장면 일러스트와
 *   간결한 하단 독백 자막(Subtitle)만으로 몰입감 있게 서사와 게임 방법을 전달합니다.
 * - 화면 어디든 클릭(터치)하면 다음 장면으로 넘어갑니다.
 */
class StoryTutorialModalView {
  constructor({ modalId = 'story-tutorial-modal', contentId = 'story-tutorial-content', app, inventory, audio }) {
    this.modalId = modalId;
    this.contentId = contentId;
    this.app = app;
    this.inventory = inventory;
    this.audio = audio;

    this.slides = [];
    this.currentIndex = 0;
    this.onCompleteCallback = null;
    this.isOpen = false;
    this._boundKeyDown = this._handleKeyDown.bind(this);
  }

  static get STORY_SLIDES() {
    return [
      {
        type: 'STORY',
        stepLabel: 'PROLOGUE 01',
        speaker: '독백',
        image: './assets/story/story_scene_1.jpg',
        line1: '“텅 빈 지갑, 책상 위에 쌓여가는 고지서들…”',
        line2: '이대로 주저앉을 순 없어. 당장 내일부터라도 내 힘으로 돈을 벌어야 해!'
      },
      {
        type: 'STORY',
        stepLabel: 'PROLOGUE 02',
        speaker: '독백',
        image: './assets/story/story_scene_2.jpg',
        line1: '“할아버지가 남기신 아이스박스와『비전 음료 제조 노트』!”',
        line2: '그래… 거창한 가게가 없어도 이 레시피 노트만 있다면 당장 시작할 수 있어!'
      },
      {
        type: 'STORY',
        stepLabel: 'PROLOGUE 03',
        speaker: '독백',
        image: './assets/story/story_scene_3.jpg',
        line1: '“첫 시작은 길거리 노점이다! 길거리에서 술을 팔 수는 없으니,”',
        line2: '먼저 연구실에서 시원한 비알코올 음료부터 해금해서 손님들께 팔아보자!'
      }
    ];
  }

  static get TUTORIAL_SLIDES() {
    return [
      {
        type: 'TUTORIAL',
        stepLabel: 'GUIDE 01 · 음료 연구 & 해금',
        speaker: '가이드',
        image: './assets/story/tutorial_scene_1.jpg',
        line1: '① [🔬 연구실]에서 재료를 조합해 판매할 음료를 해금하세요!',
        line2: '처음 주어진 무료 재료(물·눈·공기·설탕)로 얼음·탄산수·사이다를 바로 만들 수 있어요.'
      },
      {
        type: 'TUTORIAL',
        stepLabel: 'GUIDE 02 · 힌트 획득 & 재료 구매',
        speaker: '가이드',
        image: './assets/story/tutorial_scene_2.jpg',
        line1: '② 막힐 땐 [힌트]를 열고, 번 돈(💰)으로 [🛒 새 재료]를 구매하세요!',
        line2: '은박 복권·미니게임·야구 추리로 조합법을 알아내고, 판매 수익으로 다음 재료를 하나씩 사서 해금합니다.'
      },
      {
        type: 'TUTORIAL',
        stepLabel: 'GUIDE 03 · 주문 제조 & 종(🛎️) 서빙',
        speaker: '가이드',
        image: './assets/story/tutorial_scene_3.jpg',
        line1: '③ 해금한 음료를 외워 제조한 뒤, 오른쪽 [🛎️ 종]을 눌러 서빙하세요!',
        line2: '하단에서 조합하면 중앙 접시에 올라갑니다. 카운터 오른쪽 종을 터치하면 서빙 완료!'
      },
      {
        type: 'TUTORIAL',
        stepLabel: 'GUIDE 04 · 점포 확장 & 무한모드(❤️×3)',
        speaker: '가이드',
        image: './assets/story/tutorial_scene_4.jpg',
        line1: '④ 구역 재료·레시피를 모두 마스터하고 자금을 모아 다음 점포로!',
        line2: '6단계 미래도시 바까지 모두 해금하면, 단골 주문과 목숨 3개(❤️❤️❤️)를 걸고 경쟁하는 [♾️ 무한모드]가 열립니다!'
      }
    ];
  }

  /**
   * 최초 접속 시 프롤로그 스토리(3컷) + 튜토리얼(4컷) 연속 재생
   */
  openIntroFlow(onComplete = null) {
    const combined = [
      ...StoryTutorialModalView.STORY_SLIDES,
      ...StoryTutorialModalView.TUTORIAL_SLIDES
    ];
    this._startSlides(combined, () => {
      if (this.inventory) {
        this.inventory.markIntroStorySeen();
        this.inventory.markIntroTutorialSeen();
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
    });
  }

  /**
   * 스토리만 다시 보기 (3컷)
   */
  openStoryOnly(onComplete = null) {
    this._startSlides(StoryTutorialModalView.STORY_SLIDES, () => {
      if (this.inventory) this.inventory.markIntroStorySeen();
      if (typeof onComplete === 'function') onComplete();
    });
  }

  /**
   * 튜토리얼만 다시 보기 (4컷)
   */
  openTutorialOnly(onComplete = null) {
    this._startSlides(StoryTutorialModalView.TUTORIAL_SLIDES, () => {
      if (this.inventory) this.inventory.markIntroTutorialSeen();
      if (typeof onComplete === 'function') onComplete();
    });
  }

  _startSlides(slides, onComplete) {
    const modal = document.getElementById(this.modalId);
    if (!modal || !slides || slides.length === 0) return;

    this.slides = slides;
    this.currentIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;

    modal.classList.add('active');
    window.addEventListener('keydown', this._boundKeyDown);
    this.render();
  }

  close(triggerCallback = true) {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.remove('active');
    this.isOpen = false;
    window.removeEventListener('keydown', this._boundKeyDown);

    const cb = this.onCompleteCallback;
    this.onCompleteCallback = null;
    if (triggerCallback && typeof cb === 'function') {
      cb();
    }
  }

  _handleKeyDown(e) {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.audio?.playTap?.();
      this.close(true);
    } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.nextSlide();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prevSlide();
    }
  }

  nextSlide() {
    this.audio?.playTap?.();
    if (this.currentIndex < this.slides.length - 1) {
      this.currentIndex += 1;
      this.render();
    } else {
      this.audio?.playSuccess?.();
      this.close(true);
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.audio?.playTap?.();
      this.currentIndex -= 1;
      this.render();
    }
  }

  render() {
    const container = document.getElementById(this.contentId);
    if (!container) return;

    const slide = this.slides[this.currentIndex];
    if (!slide) return;

    const total = this.slides.length;
    const isLast = this.currentIndex === total - 1;
    const isTutorial = slide.type === 'TUTORIAL';

    const dotsHtml = this.slides.map((s, idx) => `
      <span class="cutscene-dot ${idx === this.currentIndex ? 'active' : ''} ${idx < this.currentIndex ? 'done' : ''}"></span>
    `).join('');

    container.innerHTML = `
      <div class="cutscene-player-stage ${isTutorial ? 'is-tutorial-mode' : 'is-story-mode'}" id="cutscene-tap-surface">
        <!-- 상단 진행 도트 & 건너뛰기 -->
        <div class="cutscene-top-bar">
          <div class="cutscene-step-pill ${isTutorial ? 'tutorial-pill' : 'story-pill'}">
            ${slide.stepLabel}
          </div>
          <div class="cutscene-dots-wrap">
            ${dotsHtml}
          </div>
          <button type="button" class="cutscene-skip-btn" id="cutscene-skip-btn" title="건너뛰기">
            SKIP ▸▸
          </button>
        </div>

        <!-- 중앙 애니메이션 일러스트 프레임 -->
        <div class="cutscene-artwork-frame">
          <img src="${slide.image}" alt="${slide.stepLabel}" class="cutscene-artwork-img" draggable="false" />
          <div class="cutscene-vignette-overlay"></div>
        </div>

        <!-- 하단 애니메이션 자막 박스 (혼잣말 / 튜토리얼 가이드) -->
        <div class="cutscene-subtitle-box">
          <div class="cutscene-speaker-tag ${isTutorial ? 'tag-guide' : 'tag-monologue'}">
            ${slide.speaker}
          </div>
          <div class="cutscene-dialogue-lines">
            <p class="cutscene-line-primary">${slide.line1}</p>
            <p class="cutscene-line-secondary">${slide.line2}</p>
          </div>
          <div class="cutscene-Prompt-footer">
            ${this.currentIndex > 0 ? `<button type="button" class="cutscene-prev-mini" id="cutscene-prev-btn">◂ 이전</button>` : `<span></span>`}
            <span class="cutscene-tap-prompt">${isLast ? '터치하여 시작하기 ▸' : '화면을 터치하여 계속 ▸'}</span>
          </div>
        </div>
      </div>
    `;

    const tapSurface = container.querySelector('#cutscene-tap-surface');
    if (tapSurface) {
      tapSurface.onclick = (e) => {
        if (e.target.closest('#cutscene-skip-btn') || e.target.closest('#cutscene-prev-btn')) {
          return;
        }
        this.nextSlide();
      };
    }

    const skipBtn = container.querySelector('#cutscene-skip-btn');
    if (skipBtn) {
      skipBtn.onclick = (e) => {
        e.stopPropagation();
        this.audio?.playTap?.();
        this.close(true);
      };
    }

    const prevBtn = container.querySelector('#cutscene-prev-btn');
    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        this.prevSlide();
      };
    }
  }
}

window.KSool.StoryTutorialModalView = StoryTutorialModalView;
