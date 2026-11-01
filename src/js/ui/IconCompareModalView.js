/**
 * IconCompareModalView - K-SOOL 3-Style Icon Visualizer & Comparator
 * 
 * Allows users to inspect and directly compare all 3 icon styles:
 * 1. ✨ 기본이모지 (Unicode Emoji)
 * 2. 👾 도트형태 (16x16 Retro Classic Pixel Dot Art)
 * 3. 💎 고급형태 (32x32 High-Detail Custom Vector/Pixel Art)
 * 
 * Provides live instant switching across the entire application.
 */
(function() {
  window.KSool = window.KSool || {};

  const FEATURED_KEYS = [
    'soju', 'beer', 'maesilju', 'mango_ringo',
    'milk', 'strawberry_milk', 'screwbar', 'tankboy',
    'mango', 'misutgaru', 'air', 'ice', 'honey', 'chocolate',
    'rec_ringelju', 'rec_screwbarju', 'rec_tankboyju', 'rec_mango_ringoju'
  ];

  const CATEGORY_MAP = {
    featured: { label: '💎 고급(HD) 71종', filter: (k, reg) => reg.hasHd(k) || FEATURED_KEYS.includes(k) },
    liquor: { label: '🍶 주류', filter: (k) => ['soju', 'beer', 'maesilju', 'mango_ringo', 'bokbunjaju', 'makgeolli'].includes(k) },
    drinks: { label: '🥤 음료·믹서', filter: (k) => ['milk', 'strawberry_milk', 'banana_milk', 'choco_milk', 'yakult', 'cider', 'cola', 'tonic_water', 'sparkling_water', 'black_tea', 'milksoda', 'energy_drink', 'ion_drink', 'sikhye', 'peach_drink', 'pear_drink', 'pineapple_juice', 'pomegranate_juice', 'calamansi_pouch', 'iced_americano', 'hongcho'].includes(k) },
    flavor: { label: '🍬 과일·빙과·기타', filter: (k) => ['screwbar', 'tankboy', 'melona', 'jawsbar', 'bibibig', 'chocolate', 'ice', 'air', 'snow', 'lemon', 'melon', 'mango', 'maesil', 'tomato', 'apple', 'strawberry', 'cacao', 'pear', 'banana', 'yuzu', 'calamansi', 'bokbunja', 'pomegranate', 'orange', 'barley', 'rice', 'misutgaru', 'coffee_beans', 'sugar', 'nuruk', 'yuzu_cheong', 'maesil_cheong', 'honey', 'vinegar', 'pomegranate_concentrate'].includes(k) },
    recipes: { label: '📜 대표 칵테일', filter: (k) => k.startsWith('rec_') },
    all: { label: '전체 보기', filter: () => true }
  };

  class IconCompareModalView {
    constructor(modalId = 'icon-compare-modal', contentId = 'icon-compare-content', app = null) {
      this.modalId = modalId;
      this.contentId = contentId;
      this.app = app;
      this.activeCat = 'featured';
      this.searchQuery = '';
      this.isOpen = false;
    }

    open(category = 'featured') {
      this.isOpen = true;
      this.activeCat = category;
      this.render();
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.classList.add('active');
        // Close on backdrop click
        modal.onclick = (e) => {
          if (e.target === modal) this.close();
        };
      }
    }

    close() {
      this.isOpen = false;
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.classList.remove('active');
      }
    }

    selectTheme(theme) {
      if (!window.KSool?.PixelIconRegistry) return;
      window.KSool.PixelIconRegistry.setTheme(theme);
      if (this.app?.audio?.playTap) {
        this.app.audio.playTap();
      }
      // Re-render modal to reflect new active state
      this.render();
      // Re-render all application views live
      if (this.app && typeof this.app.renderAll === 'function') {
        this.app.renderAll();
      }
    }

    render() {
      const content = document.getElementById(this.contentId);
      if (!content) return;

      const reg = window.KSool?.PixelIconRegistry;
      if (!reg) return;

      const currentTheme = reg.getTheme();
      const allKeys = reg.getAllKeys();

      // Filter keys by category and search
      const catDef = CATEGORY_MAP[this.activeCat] || CATEGORY_MAP.featured;
      let displayKeys = allKeys.filter(k => catDef.filter(k, reg));

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        displayKeys = displayKeys.filter(k => {
          const itemMeta = reg.resolveKey(k);
          return k.toLowerCase().includes(q);
        });
      }

      // Sort featured items to the top if in 'featured'
      if (this.activeCat === 'featured') {
        displayKeys.sort((a, b) => {
          const idxA = FEATURED_KEYS.indexOf(a);
          const idxB = FEATURED_KEYS.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });
      }

      content.innerHTML = `
        <div class="modal-header">
          <div>
            <div class="modal-title" style="display:flex;align-items:center;gap:8px;">
              <span>🎨</span>
              <span>아이콘 3종 스타일 비교 & 선택</span>
            </div>
            <div style="font-size:0.78rem;color:#94a3b8;margin-top:4px;">
              기본이모지, 16px 레트로 도트, 32px 고급형을 한눈에 비교하고 원하는 스타일을 적용하세요.
            </div>
          </div>
          <button type="button" class="modal-close-x" id="icon-compare-close-btn" aria-label="닫기">✕</button>
        </div>

        <!-- 3대 스타일 원클릭 스위처 패널 -->
        <div class="icon-compare-theme-cards">
          <!-- 1. 고급형태 -->
          <div class="icon-theme-select-card ${currentTheme === 'hd' ? 'active' : ''}" data-theme-target="hd">
            <div class="theme-card-badge">${currentTheme === 'hd' ? '✓ 현재 적용 중' : '선택하기'}</div>
            <div class="theme-card-icon">💎</div>
            <div class="theme-card-name">고급형태 (32px HD)</div>
            <div class="theme-card-desc">디테일한 음영과 형태를 살린 정밀 벡터/픽셀 아트</div>
            <button type="button" class="btn-theme-apply ${currentTheme === 'hd' ? 'is-current' : ''}">
              ${currentTheme === 'hd' ? '적용 중' : '💎 이 스타일 적용'}
            </button>
          </div>

          <!-- 2. 도트형태 -->
          <div class="icon-theme-select-card ${currentTheme === 'dot' ? 'active' : ''}" data-theme-target="dot">
            <div class="theme-card-badge">${currentTheme === 'dot' ? '✓ 현재 적용 중' : '선택하기'}</div>
            <div class="theme-card-icon">👾</div>
            <div class="theme-card-name">도트형태 (16px Retro)</div>
            <div class="theme-card-desc">117종 전 재료를 16x16 순수 픽셀 도트로 통일한 고전 스타일</div>
            <button type="button" class="btn-theme-apply ${currentTheme === 'dot' ? 'is-current' : ''}">
              ${currentTheme === 'dot' ? '적용 중' : '👾 이 스타일 적용'}
            </button>
          </div>

          <!-- 3. 기본이모지 -->
          <div class="icon-theme-select-card ${currentTheme === 'emoji' ? 'active' : ''}" data-theme-target="emoji">
            <div class="theme-card-badge">${currentTheme === 'emoji' ? '✓ 현재 적용 중' : '선택하기'}</div>
            <div class="theme-card-icon">✨</div>
            <div class="theme-card-name">기본이모지 (Unicode)</div>
            <div class="theme-card-desc">운영체제 기본 유니코드 이모지 (가장 친숙하고 직관적)</div>
            <button type="button" class="btn-theme-apply ${currentTheme === 'emoji' ? 'is-current' : ''}">
              ${currentTheme === 'emoji' ? '적용 중' : '✨ 이 스타일 적용'}
            </button>
          </div>
        </div>

        <!-- 카테고리 필터 탭 바 -->
        <div class="icon-compare-cat-bar">
          ${Object.entries(CATEGORY_MAP).map(([catKey, catObj]) => `
            <button type="button" class="cat-pill ${this.activeCat === catKey ? 'active' : ''}" data-cat="${catKey}">
              ${catObj.label}
            </button>
          `).join('')}
        </div>

        <!-- 비교 목록 테이블 / 리스트 -->
        <div class="icon-compare-table-wrapper">
          <table class="icon-compare-table">
            <thead>
              <tr>
                <th style="width:36%;">아이템</th>
                <th style="width:20%;" class="${currentTheme === 'emoji' ? 'col-current' : ''}">✨ 기본이모지</th>
                <th style="width:22%;" class="${currentTheme === 'dot' ? 'col-current' : ''}">👾 도트 (16px)</th>
                <th style="width:22%;" class="${currentTheme === 'hd' ? 'col-current' : ''}">💎 고급 (32px)</th>
              </tr>
            </thead>
            <tbody>
              ${displayKeys.map(key => {
                const isSpecialHd = reg.hasHd(key);
                const emojiHtml = reg.getSvg(key, { theme: 'emoji', size: 36, fallbackEmoji: foundEmoji });
                const dotHtml = reg.getSvg(key, { theme: 'dot', size: 36 });
                const hdHtml = reg.getSvg(key, { theme: 'hd', size: 36 });

                // Try to resolve display name and entity
                let name = null;
                let foundEmoji = null;
                if (window.KSool?.SeedDataBundle) {
                  const b = window.KSool.SeedDataBundle;
                  const allEntities = [
                    ...(b.ingredients_base || []),
                    ...(b.ingredients_detail || []),
                    ...(b.recipes || [])
                  ];
                  const entity = allEntities.find(e => {
                    const resolved = reg.resolveKey(e);
                    return resolved === key || e.key === key || ('ing_' + e.ingredient_id) === key || ('rec_' + e.recipe_id) === key;
                  });
                  if (entity) {
                    name = this.app?.brandResolver ? this.app.brandResolver.resolveName(entity) : (entity.display_name || entity.name);
                    foundEmoji = entity.emoji;
                  }
                }
                if (!name) {
                  const dotMeta = window.KSool?.PixelIconRegistry?.getComparisonList()?.find(c => c.key === key);
                  name = dotMeta?.name || key;
                }

                return `
                  <tr class="icon-compare-row ${isSpecialHd ? 'row-special-hd' : ''}">
                    <td class="col-item-name">
                      <div class="item-name-text">${name}</div>
                      <div class="item-key-sub">
                        ${key}
                        ${isSpecialHd ? '<span class="badge-hd-custom">32px 전용</span>' : ''}
                      </div>
                    </td>
                    <td class="col-preview-cell ${currentTheme === 'emoji' ? 'cell-current' : ''}" data-theme="emoji" title="클릭하여 기본이모지 모드로 전환">
                      <div class="preview-box">${emojiHtml}</div>
                    </td>
                    <td class="col-preview-cell ${currentTheme === 'dot' ? 'cell-current' : ''}" data-theme="dot" title="클릭하여 도트 모드로 전환">
                      <div class="preview-box">${dotHtml}</div>
                    </td>
                    <td class="col-preview-cell ${currentTheme === 'hd' ? 'cell-current' : ''}" data-theme="hd" title="클릭하여 고급 모드로 전환">
                      <div class="preview-box">${hdHtml}</div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid rgba(148,163,184,0.2);font-size:0.75rem;color:#94a3b8;">
          <span>총 ${displayKeys.length}개 아이템 비교 중</span>
          <button type="button" class="btn-compare-confirm" id="icon-compare-done-btn">닫기</button>
        </div>
      `;

      // Event Listeners
      const closeBtn = content.querySelector('#icon-compare-close-btn');
      if (closeBtn) closeBtn.onclick = () => this.close();

      const doneBtn = content.querySelector('#icon-compare-done-btn');
      if (doneBtn) doneBtn.onclick = () => this.close();

      // Top theme selector cards
      content.querySelectorAll('[data-theme-target]').forEach(card => {
        card.onclick = (e) => {
          const targetTheme = card.getAttribute('data-theme-target');
          if (targetTheme) this.selectTheme(targetTheme);
        };
      });

      // Category filter buttons
      content.querySelectorAll('[data-cat]').forEach(btn => {
        btn.onclick = (e) => {
          const cat = btn.getAttribute('data-cat');
          if (cat) {
            this.activeCat = cat;
            this.render();
          }
        };
      });

      // Cell clicks: clicking any column will activate that theme
      content.querySelectorAll('.col-preview-cell').forEach(cell => {
        cell.onclick = (e) => {
          const theme = cell.getAttribute('data-theme');
          if (theme) this.selectTheme(theme);
        };
      });
    }
  }

  window.KSool.IconCompareModalView = IconCompareModalView;
})();
