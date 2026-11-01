window.KSool = window.KSool || {};

// Community presentation uses canonical recipe data. Personal activity stays on this device.
class SuggestionBoardView {
  constructor(options) {
    Object.assign(this, options);
    this.tab = 'guide';
    this.query = '';
    this.sort = 'number';
    this.open = new Set();
    this.message = '';
    try { this.notes = JSON.parse(localStorage.getItem('ksool_lounge_notes') || '{}'); } catch (_) { this.notes = {}; }
    if (!this.notes || typeof this.notes !== 'object' || Array.isArray(this.notes)) this.notes = {};
    try { this.saved = new Set(JSON.parse(localStorage.getItem('ksool_lounge_saved') || '[]')); } catch (_) { this.saved = new Set(); }
    const params = new URLSearchParams(location.hash.slice(1));
    this.sharedId = Number(params.get('recipe'));
    this.sharedTip = (params.get('tip') || '').slice(0,500);
    if (this.sharedId) this.open.add(this.sharedId);
  }
  initSharedCombo() {
    const params = new URLSearchParams(location.hash.slice(1));
    try {
      const items = JSON.parse(params.get('combo') || 'null');
      if (Array.isArray(items) && items.length >= 2 && items.length <= 10 && items.every(i => Number.isInteger(i.ingredient_id) && Number.isInteger(i.ratio) && i.ratio >= 1 && i.ratio <= 10 && this.recipeBook.getBaseIngredient(i.ingredient_id) && (!i.detail_id || Number(this.recipeBook.getDetailIngredient(i.detail_id)?.base_ingredient_id) === i.ingredient_id))) {
        this.sharedCombo = {suggestion_key:'shared-link',items,upvotes:0,downvotes:0};
        this.tab = 'ideas';
      }
    } catch (_) {}

  }
  esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  persist() {
    try {
      localStorage.setItem('ksool_lounge_notes', JSON.stringify(this.notes));
      localStorage.setItem('ksool_lounge_saved', JSON.stringify([...this.saved]));
      return true;
    } catch (_) { this.message = '저장 공간이 부족해 이번 변경은 새로고침하면 사라질 수 있어요.'; return false; }
  }
  ingredients(items) {
    return items.map(it => {
      const target = this.recipeBook.getDetailIngredient(it.detail_ingredient_id || it.detail_id) || this.recipeBook.getBaseIngredient(it.ingredient_id);
      return `<span class="lounge-ingredient"><span>${target?.emoji || '🍶'}</span> ${this.esc(this.brandResolver.resolveName(target))} <b>×${this.esc(it.ratio)}</b></span>`;
    }).join('<span class="lounge-plus">+</span>');
  }
  render() {
    const root = document.getElementById('view-suggestions');
    if (!root) return;
    let recipes = this.recipeBook.getAllRecipes().filter(r => {
      const text = [this.brandResolver.resolveName(r), r.category, ...this.recipeBook.getRecipeItems(r.recipe_id).map(i => this.brandResolver.resolveName(this.recipeBook.getBaseIngredient(i.ingredient_id)))].join(' ');
      return text.toLowerCase().includes(this.query.toLowerCase()) && (this.tab !== 'saved' || this.saved.has(r.recipe_id));
    });
    recipes.sort((a,b) => this.sort === 'easy' ? (a.step_id || 1) - (b.step_id || 1) : (a.recipe_number || a.recipe_id) - (b.recipe_number || b.recipe_id));
    if (this.sharedId && !this.query) recipes.sort((a,b) => Number(b.recipe_id === this.sharedId) - Number(a.recipe_id === this.sharedId));
    const drafts = this.suggestionService.getActiveSuggestions();
    if (this.sharedCombo) drafts.unshift(this.sharedCombo);
    root.innerHTML = `<div class="lounge">
      <div class="lounge-hero"><div><span class="lounge-eyebrow">K-SOOL RECIPE CLUB</span><h2>혼자 찾는 재미,<br>함께 나누는 비법.</h2><p>막힌 조합은 찾아보고, 마음에 드는 비율은 모아두세요.</p><a href="#lounge-compose" class="lounge-primary" id="lounge-write">＋ 내 조합 남기기</a></div><div class="lounge-art" aria-hidden="true">🍹<span>🍋</span><i>＋</i><span>🧊</span></div></div>
      <div class="lounge-notice">✦ 공략에서 정답을 펼쳐 확인하세요. 공유 링크의 조합과 메모는 바로 표시되며, 게임 해금 기록은 바뀌지 않아요.</div>
      <div class="lounge-tabs" role="group" aria-label="조합 목록">${[['guide','📖 조합 공략'],['ideas','🧪 새로운 조합'],['saved','🔖 저장한 공략']].map(([id,label]) => `<button data-lounge-tab="${id}" aria-pressed="${this.tab === id}">${label}</button>`).join('')}</div>
      <div class="lounge-tools"><label><span class="sr-only">조합이나 재료 검색</span><input id="lounge-search" type="search" placeholder="조합 이름이나 재료로 검색" value="${this.esc(this.query)}"></label><select id="lounge-sort" aria-label="정렬"><option value="number" ${this.sort === 'number' ? 'selected' : ''}>도감 순</option><option value="easy" ${this.sort === 'easy' ? 'selected' : ''}>쉬운 조합부터</option></select></div>
      <div class="lounge-section-heading"><h3>${this.tab === 'ideas' ? '아직 도감에 없는 실험' : this.tab === 'saved' ? '다시 보고 싶은 조합' : '게임 데이터로 확인한 조합'}</h3><span>${this.tab === 'ideas' ? drafts.length : recipes.length}개</span></div>
      <div class="lounge-grid">${this.tab === 'ideas' ? this.draftCards(drafts) : recipes.map(r => this.recipeCard(r)).join('') || '<div class="lounge-empty">아직 조합이 없어요. 검색어를 바꾸거나 공략의 ☆ 버튼으로 저장해보세요.</div>'}</div>
      <section class="lounge-compose" id="lounge-compose"><span class="lounge-eyebrow">YOUR NEXT DISCOVERY</span><h3>이 비율은 어떨까요?</h3><p>주조실에 담아둔 재료와 비율로 새 조합을 기록하세요.</p><div class="lounge-formula">${this.ingredients(this.craftingPot.getSlots().map(s => ({ingredient_id:s.baseId, detail_id:s.detailId, ratio:s.count}))) || '주조실에서 재료를 2종류 이상 담아주세요.'}</div><button class="lounge-primary" id="lounge-submit" ${this.craftingPot.getSlots().length < 2 ? 'disabled' : ''}>현재 조합 추천하기</button><button id="lounge-brew">주조실로 이동 →</button></section>
      <p class="lounge-storage">메모·저장·추천은 이 브라우저에 보관됩니다. 공략 메모와 새로운 조합은 링크로 다른 사람에게 전달할 수 있어요. 새로운 조합의 기본 목록과 추천 수는 예시 데이터입니다.</p>
      <div class="lounge-status" role="status" aria-live="polite">${this.esc(this.message)}</div>
    </div>`;
    root.querySelectorAll('[data-lounge-tab]').forEach(b => b.onclick = () => { this.tab = b.dataset.loungeTab; this.message = ''; this.render(); });
    root.querySelector('#lounge-search').oninput = e => {
      const position = e.target.selectionStart;
      this.query = e.target.value; this.render();
      const input = root.querySelector('#lounge-search'); input.focus();
      try { input.setSelectionRange(position,position); } catch (_) {}
    };
    root.querySelector('#lounge-sort').onchange = e => {this.sort = e.target.value; this.render();};
    root.querySelector('#lounge-brew').onclick = () => document.querySelector('[data-tab-target="brew"]').click();
    root.querySelector('#lounge-submit').onclick = () => { const result = this.suggestionService.submitFromPot(this.craftingPot.getSlots()); this.message = result.message; this.tab = 'ideas'; this.render(); };
    root.querySelector('#lounge-write').onclick = e => {e.preventDefault(); root.querySelector('#lounge-compose').scrollIntoView({behavior:'smooth', block:'center'});};
    root.querySelectorAll('[data-reveal]').forEach(b => b.onclick = () => { const id = Number(b.dataset.reveal); this.open.has(id) ? this.open.delete(id) : this.open.add(id); this.render(); });
    root.querySelectorAll('[data-save]').forEach(b => b.onclick = () => {const id = Number(b.dataset.save); this.saved.has(id) ? this.saved.delete(id) : this.saved.add(id); this.persist(); this.render();});
    root.querySelectorAll('[data-share]').forEach(b => b.onclick = () => this.share(Number(b.dataset.share)));
    root.querySelectorAll('[data-share-tip]').forEach(b => b.onclick = () => this.share(Number(b.dataset.shareTip), true));
    root.querySelectorAll('[data-share-combo]').forEach(b => b.onclick = () => this.shareCombo(drafts.find(s => s.suggestion_key === b.dataset.shareCombo)));

    root.querySelectorAll('[data-note-form]').forEach(form => form.onsubmit = e => {e.preventDefault(); const id = form.dataset.noteForm; this.notes[id] = form.elements.note.value.trim().slice(0,500); this.message = this.persist() ? '공략 메모를 이 브라우저에 저장했어요.' : this.message; this.render();});
    root.querySelectorAll('[data-upvote]').forEach(b => b.onclick = () => {this.suggestionService.vote(b.dataset.upvote,'UP'); this.render();});
  }
  recipeCard(r) {
    const id = r.recipe_id, revealed = this.open.has(id), name = this.esc(this.brandResolver.resolveName(r));
    return `<article class="lounge-card ${id === this.sharedId ? 'lounge-shared' : ''}"><div class="lounge-card-top"><span>${this.esc(r.formatted_number || `No.${id}`)} · ${this.esc(r.category || '조합')}</span><button data-save="${id}" aria-label="${this.saved.has(id) ? '저장 취소' : '공략 저장'}" aria-pressed="${this.saved.has(id)}">${this.saved.has(id) ? '★' : '☆'}</button></div><div class="lounge-recipe-title"><span>${r.emoji || '🍹'}</span><div><small>공식 조합${id === this.sharedId ? ' · 공유받은 공략' : ''}</small><h3>${name}</h3></div></div><p>${this.esc(r.unlock_hint || '재료와 비율을 펼쳐 조합을 확인해보세요.')}</p><button class="lounge-reveal" data-reveal="${id}" aria-expanded="${revealed}">${revealed ? '정답 접기 ↑' : '재료와 정답 비율 보기 ↓'}</button>${revealed ? `<div class="lounge-answer"><div class="lounge-formula">${this.ingredients(this.recipeBook.getRecipeItems(id))}</div><p>${this.esc(r.description)}</p>${r.requires_order ? '<small>표시된 재료 순서대로 조합하세요.</small>' : ''}${id === this.sharedId && this.sharedTip ? `<div class="lounge-shared-tip"><small>링크로 전달받은 공략 메모</small><p>${this.esc(this.sharedTip)}</p></div>` : ''}<form data-note-form="${id}"><label for="note-${id}">나의 공략 메모</label><textarea name="note" id="note-${id}" maxlength="500" placeholder="성공한 비율이나 다음에 시도할 팁을 남겨보세요.">${this.esc(this.notes[id] || '')}</textarea><button type="submit">메모 저장</button></form>${this.notes[id] ? `<button class="lounge-reveal" data-share-tip="${id}">↗ 저장한 메모와 함께 공유</button>` : ''}</div>` : ''}<div class="lounge-card-footer"><span>STEP ${this.esc(r.step_id || 1)}</span><button data-share="${id}">↗ 공략 링크 공유</button></div></article>`;
  }
  draftCards(drafts) {
    return drafts.filter(s => this.ingredients(s.items).toLowerCase().includes(this.esc(this.query.toLowerCase()))).map(s => `<article class="lounge-card"><small>${s === this.sharedCombo ? '링크로 전달받은 조합' : '실험 조합 · 공식 정답과 다를 수 있어요'}</small><div class="lounge-formula">${this.ingredients(s.items)}</div><div class="lounge-card-footer"><button data-share-combo="${this.esc(s.suggestion_key)}">↗ 조합 공유</button><button ${s === this.sharedCombo ? 'disabled' : ''} data-upvote="${this.esc(s.suggestion_key)}" aria-pressed="${this.suggestionService.userVotes[s.suggestion_key] === 'UP'}">👍 이 조합 추천</button></div></article>`).join('') || '<div class="lounge-empty">표시할 실험 조합이 없어요. 현재 해금한 재료의 조합만 보여요.</div>';
  }
  async shareCombo(draft) {
    if (!draft) return;
    const url = new URL(location.href);
    url.hash = new URLSearchParams({combo:JSON.stringify(draft.items)}).toString();
    await this.sendLink(url, 'K-술 · 새로운 조합');
  }
  async share(id, includeTip = false) {
    const url = new URL(location.href);
    const params = new URLSearchParams({recipe:String(id)});
    if (includeTip && this.notes[id]) params.set('tip', this.notes[id]);
    url.hash = params.toString();
    await this.sendLink(url, `K-술 · ${this.brandResolver.resolveName(this.recipeBook.recipes.get(id))} 조합 공략`);
  }
  async sendLink(url, title) {
    try {
      if (navigator.share) await navigator.share({title, url:url.href});
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url.href); this.message = '공략 링크를 복사했어요. 친구에게 보내보세요.'; }
      else { window.prompt('이 공략 링크를 복사해 공유하세요.',url.href); }
    } catch (error) { if (error.name !== 'AbortError') window.prompt('이 공략 링크를 복사해 공유하세요.',url.href); }
    this.render();
  }
}
window.KSool.SuggestionBoardView = SuggestionBoardView;
