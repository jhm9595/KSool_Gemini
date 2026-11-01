window.KSool = window.KSool || {};

/**
 * 도감 그림(아이콘/일러스트) 선해금을 위한 아케이드 미니게임 엔진
 * 1) BRICK_BREAKER : 🧱 도트 아트 벽돌깨기 (각 술의 16x16 레트로 도트 모양/색상 블록 + 전략적 강철 범퍼)
 * 2) TERRITORY_QIX : 📐 외곽 실루엣 땅따먹기 (100% 암전 속 술의 고유 외곽선을 네온으로 표시 + 실루엣 100% 점령 시 클리어)
 */
class ImageMinigameSuite {
  constructor(canvas, recipe, audio, onWin, onLose) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.recipe = recipe;
    this.audio = audio;
    this.onWin = onWin;
    this.onLose = onLose;

    this.width = canvas.width;
    this.height = canvas.height;
    this.rafId = null;
    this.isRunning = false;
    this.gameType = null;
    this.particles = [];
    this.shakeTicks = 0;

    // 오프스크린에 숨겨진 실제 술 그래픽/일러스트 렌더링용 캔버스
    this.hiddenArtCanvas = document.createElement('canvas');
    this.hiddenArtCanvas.width = this.width;
    this.hiddenArtCanvas.height = this.height;
    this._renderHiddenArtwork();

    this._cleanupInputHandlers = null;
  }

  /**
   * 레트로 16x16 도트 스프라이트 파싱
   * SVG <rect> 요소들을 분석하여 16x16 그리드 및 유효 픽셀 목록, 바운딩 박스를 추출
   */
  _parseDotSprite(recipe) {
    const sprite = window.KSool?.PixelIconRegistry?.getDotSprite
      ? window.KSool.PixelIconRegistry.getDotSprite(recipe)
      : null;
    const grid = Array.from({ length: 16 }, () => Array(16).fill(null));

    if (!sprite || !sprite.innerSvg) {
      // 스프라이트가 없는 경우 기본 술병 모양 자동 생성
      for (let r = 2; r <= 5; r++) { grid[r][7] = '#38bdf8'; grid[r][8] = '#38bdf8'; }
      for (let r = 6; r <= 14; r++) {
        for (let c = 5; c <= 10; c++) grid[r][c] = '#38bdf8';
      }
    } else {
      const rectRegex = /<rect\s+([^>]+)\s*\/?>/g;
      let rm;
      while ((rm = rectRegex.exec(sprite.innerSvg)) !== null) {
        const attrs = rm[1];
        const xMatch = attrs.match(/x="(\d+)"/);
        const yMatch = attrs.match(/y="(\d+)"/);
        const wMatch = attrs.match(/width="(\d+)"/);
        const hMatch = attrs.match(/height="(\d+)"/);
        const fMatch = attrs.match(/fill="([^"]+)"/);
        if (!xMatch || !yMatch || !wMatch || !hMatch || !fMatch) continue;
        const x = parseInt(xMatch[1], 10);
        const y = parseInt(yMatch[1], 10);
        const w = parseInt(wMatch[1], 10);
        const h = parseInt(hMatch[1], 10);
        const fill = fMatch[1];
        for (let r = y; r < y + h; r++) {
          for (let c = x; c < x + w; c++) {
            if (r < 16 && c < 16) {
              grid[r][c] = fill;
            }
          }
        }
      }
    }

    const activePixels = [];
    let minR = 16, maxR = -1, minC = 16, maxC = -1;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (grid[r][c]) {
          activePixels.push({ r, c, color: grid[r][c] });
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }

    return {
      grid,
      activePixels,
      minR: minR === 16 ? 0 : minR,
      maxR: maxR === -1 ? 15 : maxR,
      minC: minC === 16 ? 0 : minC,
      maxC: maxC === -1 ? 15 : maxC
    };
  }

  /**
   * 오프스크린 캔버스에 숨겨진 실제 술 그래픽/일러스트 렌더링
   * 각 게임의 목표 영역(bounds: { x, y, w, h })에 정확히 맞추어 1:1 위치 일치 보장
   */
  _renderHiddenArtwork(bounds = null) {
    const c = this.hiddenArtCanvas;
    const g = c.getContext('2d');
    const w = c.width;
    const h = c.height;

    const cx = w / 2;
    const cy = (h + 32) / 2;

    const drawBackground = () => {
      const rad = g.createRadialGradient(cx, cy, 20, cx, cy, w * 0.75);
      rad.addColorStop(0, '#1e293b');
      rad.addColorStop(0.55, '#0f172a');
      rad.addColorStop(1, '#050811');
      g.fillStyle = rad;
      g.fillRect(0, 0, w, h);
    };

    drawBackground();

    const targetX = bounds ? bounds.x : (cx - 100);
    const targetY = bounds ? bounds.y : (cy - 100);
    const targetW = bounds ? bounds.w : 200;
    const targetH = bounds ? bounds.h : 200;

    let hasSvg = false;
    if (this.recipe && window.KSool?.pixelIcon) {
      try {
        let svgStr = window.KSool.pixelIcon(this.recipe, Math.max(targetW, targetH));
        if (svgStr) {
          hasSvg = true;
          if (!svgStr.includes('xmlns=')) {
            svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
          }
          const img = new Image();
          img.onload = () => {
            drawBackground();
            g.drawImage(img, targetX, targetY, targetW, targetH);
          };
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
        }
      } catch (err) {
        console.warn('Failed to render pixel icon on canvas:', err);
      }
    }

    if (!hasSvg) {
      g.font = `${Math.floor(Math.min(targetW, targetH) * 0.52)}px sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.shadowColor = 'rgba(250, 204, 21, 0.6)';
      g.shadowBlur = 18;
      g.fillText(this.recipe ? this.recipe.emoji : '🍶', targetX + targetW / 2, targetY + targetH / 2);
      g.shadowBlur = 0;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this._cleanupInputHandlers) {
      this._cleanupInputHandlers();
      this._cleanupInputHandlers = null;
    }
  }

  start(gameType) {
    this.stop();
    this.gameType = gameType;
    this.gameState = 'READY';
    this.isRunning = true;
    this.particles = [];
    this.shakeTicks = 0;

    if (gameType === 'BRICK_BREAKER') {
      this._initBrickBreaker();
    } else if (gameType === 'TERRITORY_QIX') {
      this._initTerritoryQix();
    }

    const loop = () => {
      if (!this.isRunning) return;
      this._update();
      this._draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  setQixDirection(dc, dr) {
    if (!this.isRunning || this.gameType !== 'TERRITORY_QIX' || !this.qixState) return;
    if (this.gameState === 'READY') {
      this.gameState = 'PLAYING';
      this.qixState.lastTime = performance.now();
      this.qixState.player.moveAccum = 0;
      this.audio.playTap();
    }
    const pl = this.qixState.player;
    const grid = this.qixState.grid;
    const isDrawing = grid[pl.r] && grid[pl.r][pl.c] === 2;
    const isReverse = (pl.dc !== 0 && dc === -pl.dc) || (pl.dr !== 0 && dr === -pl.dr);
    const nc = pl.c + dc;
    const nr = pl.r + dr;
    const nextCell = grid[nr] ? grid[nr][nc] : null;

    // 1. 자기 자신의 선(2)으로 돌진하는 것은 즉사이므로 원천 차단
    if (nextCell === 2) return;
    // 2. 선을 긋고 있는 도중 180도 역주행 완전 차단 (직각 회전만 허용)
    if (isDrawing && isReverse) return;

    pl.dc = dc;
    pl.dr = dr;
  }

  _spawnParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 4.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 18 + Math.floor(Math.random() * 14),
        maxLife: 32,
        color,
        size: 2.5 + Math.random() * 3.5
      });
    }
  }

  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    if (this.shakeTicks > 0) this.shakeTicks--;
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  _drawOverlayPrompt(ctx, text, subText = '', isOver = false) {
    const pulse = 0.85 + 0.15 * Math.sin(performance.now() * 0.006);
    const cx = this.width / 2;
    const cy = this.height / 2 + 20;

    ctx.save();
    if (isOver) {
      ctx.fillStyle = 'rgba(7, 11, 20, 0.65)';
      ctx.fillRect(0, 32, this.width, this.height - 32);
    }

    const isWin = (text === 'Clear!');
    const boxW = isWin ? 150 : (subText ? 220 : 180);
    const boxH = subText ? 46 : 40;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    let glowColor = 'rgba(56, 189, 248, 0.7)';
    let strokeColor = `rgba(56, 189, 248, ${0.85 * pulse})`;
    let textColor = '#38bdf8';

    if (isOver) {
      glowColor = 'rgba(239, 68, 68, 0.7)';
      strokeColor = `rgba(239, 68, 68, ${0.75 * pulse})`;
      textColor = '#fca5a5';
    } else if (isWin) {
      glowColor = 'rgba(52, 211, 153, 0.85)';
      strokeColor = `rgba(52, 211, 153, ${0.9 * pulse})`;
      textColor = '#34d399';
    }

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12 * pulse;

    ctx.fillStyle = isOver ? 'rgba(30, 20, 35, 0.94)' : 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, boxH / 2);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = isWin
      ? 'bold 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif'
      : 'bold 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.fillText(text, cx, cy + (subText ? -7 : 0));

    if (subText) {
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(subText, cx, cy + 11);
    }
    ctx.restore();
  }

  _drawHUD(ctx, { lives, progressPct, labelText }) {
    ctx.fillStyle = 'rgba(9, 13, 24, 0.92)';
    ctx.fillRect(0, 0, this.width, 32);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(this.width, 32);
    ctx.stroke();

    // 라이프 표시
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < lives ? '❤️' : '🖤';
    }
    ctx.fillText(hearts, 10, 16);

    // 진행도 텍스트 (우측)
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText(labelText || `${Math.floor(progressPct)}%`, this.width - 10, 16);

    // 중앙 상단 진행 바
    const barW = Math.min(130, this.width - 180);
    const barH = 7;
    const barX = this.width / 2 - barW / 2;
    const barY = 13;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(barX, barY, barW, barH);

    const fillW = Math.max(0, Math.min(barW, barW * (progressPct / 100)));
    const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#10b981');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, fillW, barH);
  }

  // =========================================================================
  // 1. 🧱 도트 아트 벽돌깨기 (술 모양 도트 벽돌 + 전략적 강철 범퍼)
  // =========================================================================
  _initBrickBreaker() {
    const dotInfo = this._parseDotSprite(this.recipe);

    // 16x16 도트 좌표계 기준 벽돌 레이아웃 구성
    const cols = 16;
    const rows = 16;
    const bw = 20;
    const bh = 13;
    const gapX = 2;
    const gapY = 2;
    const pitchX = bw + gapX; // 22px
    const pitchY = bh + gapY; // 15px

    const stageW = cols * pitchX - gapX; // 350px
    const stageH = rows * pitchY - gapY; // 238px
    const padX = Math.floor((this.width - stageW) / 2); // 좌우 여백 (420 - 350) / 2 = 35px
    const topY = 44; // 상단 여백 (HUD 32px 아래)

    // 숨겨진 배경 일러스트를 벽돌 스테이지 영역에 1:1로 정확히 정렬
    this._renderHiddenArtwork({
      x: padX,
      y: topY,
      w: stageW,
      h: stageH
    });

    this.bbState = {
      lives: 3,
      elapsed: 0,
      lastTime: performance.now(),
      targetPct: 100,
      blockAreaBottom: topY + stageH,
      paddle: {
        x: this.width / 2 - 44,
        y: this.height - 28,
        w: 88,
        baseW: 88,
        h: 12,
        shrinkTimer: 0,
        keyDir: 0
      },
      ball: {
        x: this.width / 2,
        y: this.height - 44,
        vx: 0,
        vy: 0,
        r: 7,
        speedMultiplier: 0.65
      },
      blocks: [],
      hazards: [], // 낙하 독방울(☠️) / 빙결함정(❄️)
      totalBreakable: 0,
      brokenCount: 0
    };

    // 전략적 강철 블록(파괴 불가 범퍼) 위치 선정
    const centerC = Math.round((dotInfo.minC + dotInfo.maxC) / 2);
    const shoulderR = dotInfo.minR + Math.floor((dotInfo.maxR - dotInfo.minR) * 0.35);

    const steelCoords = new Set();
    // 1. 상단 병뚜껑/마개 중앙 (1~2개)
    for (const p of dotInfo.activePixels) {
      if (p.r === dotInfo.minR && (p.c === centerC || p.c === centerC - 1)) {
        steelCoords.add(`${p.r},${p.c}`);
        if (steelCoords.size >= 2) break;
      }
    }
    // 2. 어깨 부위 범퍼 (1개)
    if (steelCoords.size < 3 && dotInfo.maxR - dotInfo.minR >= 7) {
      for (const p of dotInfo.activePixels) {
        if (p.r === shoulderR && (p.c === dotInfo.minC || p.c === dotInfo.maxC)) {
          steelCoords.add(`${p.r},${p.c}`);
          if (steelCoords.size >= 3) break;
        }
      }
    }
    // 예외 안전장치: 최소 1개 강철 범퍼 보장
    if (steelCoords.size === 0 && dotInfo.activePixels.length > 0) {
      steelCoords.add(`${dotInfo.activePixels[0].r},${dotInfo.activePixels[0].c}`);
    }

    const labelMinR = dotInfo.minR + (dotInfo.maxR - dotInfo.minR) * 0.4;
    const labelMaxR = dotInfo.minR + (dotInfo.maxR - dotInfo.minR) * 0.65;

    // 각 활성 도트 픽셀을 고유 블록으로 생성
    for (const p of dotInfo.activePixels) {
      const coordKey = `${p.r},${p.c}`;
      const isSteel = steelCoords.has(coordKey);
      let hp = 1;

      if (isSteel) {
        hp = 999;
      } else {
        // 중앙 라벨/코어 부위는 HP 2
        if (p.r >= labelMinR && p.r <= labelMaxR && p.c > dotInfo.minC && p.c < dotInfo.maxC) {
          hp = 2;
        }
        this.bbState.totalBreakable++;
      }

      this.bbState.blocks.push({
        r: p.r,
        c: p.c,
        x: padX + p.c * pitchX,
        y: topY + p.r * pitchY,
        w: bw,
        h: bh,
        color: p.color,
        hp,
        maxHp: hp,
        isSteel,
        alive: true
      });
    }

    const launchBall = () => {
      if (this.gameState === 'READY') {
        this.gameState = 'PLAYING';
        this.bbState.lastTime = performance.now();
        this.audio.playTap();
        const b = this.bbState.ball;
        b.vy = -4.2;
        b.vx = (Math.random() > 0.5 ? 1 : -1) * (2.8 + Math.random() * 0.8);
      } else if (this.gameState === 'OVER') {
        this.audio.playTap();
        this.start('BRICK_BREAKER');
        this.gameState = 'PLAYING';
        this.bbState.lastTime = performance.now();
        const b = this.bbState.ball;
        b.vy = -4.2;
        b.vx = (Math.random() > 0.5 ? 1 : -1) * (2.8 + Math.random() * 0.8);
      }
    };

    const movePaddle = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const x = (clientX - rect.left) * scaleX;
      const p = this.bbState.paddle;
      p.x = Math.max(6, Math.min(this.width - p.w - 6, x - p.w / 2));
      if (this.gameState === 'READY') {
        this.bbState.ball.x = p.x + p.w / 2;
        this.bbState.ball.y = p.y - this.bbState.ball.r - 2;
      }
    };

    const onMouseDown = (e) => {
      movePaddle(e.clientX);
      launchBall();
    };

    const onMouseMove = (e) => {
      movePaddle(e.clientX);
    };

    const onTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault();
        movePaddle(e.touches[0].clientX);
        launchBall();
      }
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault();
        movePaddle(e.touches[0].clientX);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.bbState.paddle.keyDir = -1;
        launchBall();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        this.bbState.paddle.keyDir = 1;
        launchBall();
      } else if (e.key === ' ' || e.key === 'Enter') {
        launchBall();
      }
    };

    const onKeyUp = (e) => {
      if (
        (e.key === 'ArrowLeft' || e.key === 'a') && this.bbState.paddle.keyDir === -1 ||
        (e.key === 'ArrowRight' || e.key === 'd') && this.bbState.paddle.keyDir === 1
      ) {
        this.bbState.paddle.keyDir = 0;
      }
    };

    this.canvas.addEventListener('mousedown', onMouseDown);
    this.canvas.addEventListener('mousemove', onMouseMove);
    this.canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    this._cleanupInputHandlers = () => {
      this.canvas.removeEventListener('mousedown', onMouseDown);
      this.canvas.removeEventListener('mousemove', onMouseMove);
      this.canvas.removeEventListener('touchstart', onTouchStart);
      this.canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  _updateBrickBreaker() {
    const st = this.bbState;
    const now = performance.now();
    const dt = Math.min((now - st.lastTime) / 1000, 0.05);
    st.lastTime = now;
    st.elapsed += dt;

    const p = st.paddle;
    if (p.shrinkTimer > 0) {
      p.shrinkTimer -= dt;
      if (p.shrinkTimer <= 0) {
        p.w = p.baseW;
      }
    }
    if (p.keyDir !== 0) {
      p.x = Math.max(6, Math.min(this.width - p.w - 6, p.x + p.keyDir * 340 * dt));
    }

    // 초반에는 안정적인 속도(65%)로 출발하여, 진행도에 따라 최대 118%까지 시원하게 가속
    const timeProgress = Math.min(1, Math.max(0, st.elapsed / 32));
    const breakProgress = st.brokenCount / Math.max(1, st.totalBreakable);
    const ramp = Math.max(timeProgress * 0.8, breakProgress);

    const b = st.ball;
    b.speedMultiplier = 0.65 + 0.53 * ramp;
    b.x += b.vx * b.speedMultiplier;
    b.y += b.vy * b.speedMultiplier;

    // 좌우 벽 반사
    if (b.x - b.r < 4) {
      b.x = 4 + b.r;
      b.vx = Math.abs(b.vx);
    } else if (b.x + b.r > this.width - 4) {
      b.x = this.width - 4 - b.r;
      b.vx = -Math.abs(b.vx);
    }

    // 상단 천장 반사
    if (b.y - b.r < 34) {
      b.y = 34 + b.r;
      b.vy = Math.abs(b.vy);
    }

    // 패들 충돌
    if (
      b.vy > 0 &&
      b.y + b.r >= p.y &&
      b.y - b.r <= p.y + p.h &&
      b.x >= p.x - 4 &&
      b.x <= p.x + p.w + 4
    ) {
      const hitOffset = (b.x - (p.x + p.w / 2)) / (p.w / 2); // -1 ~ 1
      const speed = Math.hypot(b.vx, b.vy);
      const angle = hitOffset * (Math.PI / 3); // 최대 60도 굴절
      b.vx = Math.sin(angle) * speed;
      b.vy = -Math.cos(angle) * speed;
      b.y = p.y - b.r - 1;
      this.audio.playTap();
    }

    // 블럭 충돌 검사
    for (const blk of st.blocks) {
      if (!blk.alive) continue;
      if (
        b.x + b.r > blk.x &&
        b.x - b.r < blk.x + blk.w &&
        b.y + b.r > blk.y &&
        b.y - b.r < blk.y + blk.h
      ) {
        // 반사 방향 계산
        const overlapLeft = b.x + b.r - blk.x;
        const overlapRight = blk.x + blk.w - (b.x - b.r);
        const overlapTop = b.y + b.r - blk.y;
        const overlapBottom = blk.y + blk.h - (b.y - b.r);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
          b.vx = -b.vx;
        } else {
          b.vy = -b.vy;
        }

        if (blk.isSteel) {
          this.shakeTicks = 4;
          this._spawnParticles(b.x, b.y, '#94a3b8', 6);
          this.audio.playTap();
        } else {
          blk.hp--;
          this.audio.playTap();
          if (blk.hp <= 0) {
            blk.alive = false;
            st.brokenCount++;
            this.shakeTicks = 5;
            this._spawnParticles(blk.x + blk.w / 2, blk.y + blk.h / 2, blk.color, 14);

            // 15% 확률로 함정 낙하물(☠️ 독방울 또는 ❄️ 패들축소) 생성
            if (Math.random() < 0.15) {
              st.hazards.push({
                x: blk.x + blk.w / 2,
                y: blk.y + blk.h / 2,
                vy: 2.2 + Math.random() * 1.2,
                type: Math.random() < 0.5 ? 'POISON' : 'FREEZE'
              });
            }
          } else {
            this._spawnParticles(b.x, b.y, '#fcd34d', 7);
          }
        }
        break;
      }
    }

    // 낙하 함정 업데이트
    for (let i = st.hazards.length - 1; i >= 0; i--) {
      const hz = st.hazards[i];
      hz.y += hz.vy;
      if (
        hz.y >= p.y - 6 &&
        hz.y <= p.y + p.h + 6 &&
        hz.x >= p.x &&
        hz.x <= p.x + p.w
      ) {
        st.hazards.splice(i, 1);
        this.shakeTicks = 10;
        if (hz.type === 'POISON') {
          st.lives--;
          this.audio.playFail();
          this._spawnParticles(hz.x, p.y, '#ef4444', 18);
          if (st.lives <= 0) {
            this.gameState = 'OVER';
            if (this.onLose) this.onLose();
            return;
          }
        } else {
          // FREEZE: 패들 폭 40% 축소
          p.w = Math.max(46, p.baseW * 0.6);
          p.shrinkTimer = 5.5;
          this._spawnParticles(hz.x, p.y, '#38bdf8', 14);
        }
        continue;
      }
      if (hz.y > this.height) {
        st.hazards.splice(i, 1);
      }
    }

    // 바닥 추락 시 라이프 차감
    if (b.y - b.r > this.height) {
      st.lives--;
      this.shakeTicks = 12;
      this.audio.playFail();
      if (st.lives <= 0) {
        this.gameState = 'OVER';
        if (this.onLose) this.onLose();
        return;
      }
      this.gameState = 'READY';
      b.x = p.x + p.w / 2;
      b.y = p.y - b.r - 2;
      b.vx = 0;
      b.vy = 0;
    }

    // 승리 판정 (파괴 가능한 블록을 100% 모두 깨거나, 96% 이상 격파 시 승리!)
    const pct = (st.brokenCount / Math.max(1, st.totalBreakable)) * 100;
    if (st.brokenCount >= st.totalBreakable || (st.totalBreakable - st.brokenCount <= 2 && pct >= 96)) {
      this.gameState = 'WIN';
      this.audio.playSuccess();
      if (this.onWin) this.onWin();
    }
  }

  _drawBrickBreaker(ctx) {
    const st = this.bbState;

    // 1. 전체 캔버스 배경 및 숨겨진 완성 일러스트 (깨진 블럭 자리로 드러남)
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, this.width, this.height);
    const artH = Math.min(this.height - 34, (st.blockAreaBottom || 280) + 16);
    ctx.drawImage(this.hiddenArtCanvas, 0, 0, this.width, this.height, 0, 32, this.width, artH);

    // 2. 살아있는 도트 블럭 렌더링
    for (const blk of st.blocks) {
      if (!blk.alive) continue;

      // 미파괴 블럭 뒤쪽 그림 가리기용 암막
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(blk.x - 1, blk.y - 1, blk.w + 2, blk.h + 2);

      if (blk.isSteel) {
        // 강철 범퍼: 메탈릭 그레이 + 리벳 장식
        ctx.fillStyle = '#334155';
        ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(blk.x + 2, blk.y + 2, blk.w - 4, 2);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
      } else {
        // 일반 도트 벽돌: 해당 술의 원래 픽셀 색상 그대로 렌더링
        ctx.fillStyle = blk.color;
        ctx.fillRect(blk.x, blk.y, blk.w, blk.h);

        // 3D 베벨 테두리 (라벨 2HP 블록은 골드 테두리)
        ctx.strokeStyle = blk.hp === 2 ? '#fde047' : 'rgba(255, 255, 255, 0.24)';
        ctx.lineWidth = 1;
        ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);

        if (blk.hp === 2) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(blk.x + blk.w / 2 - 2, blk.y + blk.h / 2 - 1, 4, 2);
        }
      }
    }

    // 3. 낙하 함정 그리기
    for (const hz of st.hazards) {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hz.type === 'POISON' ? '☠️' : '❄️', hz.x, hz.y);
    }

    // 4. 패들 그리기
    const p = st.paddle;
    ctx.fillStyle = p.shrinkTimer > 0 ? '#38bdf8' : '#3b82f6';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    // 5. 공 그리기
    const b = st.ball;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const pct = (st.brokenCount / Math.max(1, st.totalBreakable)) * 100;
    this._drawHUD(ctx, {
      lives: st.lives,
      progressPct: pct,
      labelText: `블록 파괴: ${Math.floor(pct)}% / 100%`
    });
  }

  // =========================================================================
  // 2. 📐 외곽 실루엣 땅따먹기 (술의 외곽선 네온 가이드 + 실루엣 100% 점령)
  // =========================================================================
  _initTerritoryQix() {
    const dotInfo = this._parseDotSprite(this.recipe);

    const cols = 52;
    const rows = 52;
    const topOffset = 32;
    const cellW = this.width / cols;
    const cellH = (this.height - topOffset) / rows;

    // 0: 미점령(100% 암전), 1: 안전지대/점령완료, 2: 현재 긋고 있는 선(Trail)
    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (__, c) =>
        r === 0 || r === rows - 1 || c === 0 || c === cols - 1 ? 1 : 0
      )
    );

    // 16x16 도트 스프라이트를 그리드 중앙에 2x2 셀 크기로 매핑 (32x32 구역)
    const scale = 2;
    const startC = Math.floor((cols - 16 * scale) / 2); // 10
    const startR = Math.floor((rows - 16 * scale) / 2); // 10

    const targetSilhouetteCells = new Set();
    const isSilhouetteGrid = Array.from({ length: rows }, () => new Uint8Array(cols));

    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (dotInfo.grid[r][c]) {
          for (let dr = 0; dr < scale; dr++) {
            for (let dc = 0; dc < scale; dc++) {
              const gr = startR + r * scale + dr;
              const gc = startC + c * scale + dc;
              if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
                isSilhouetteGrid[gr][gc] = 1;
                targetSilhouetteCells.add(`${gr},${gc}`);
              }
            }
          }
        }
      }
    }

    // 도트 실루엣의 가장 바깥 외곽선(Boundary Edges) 산출
    const silhouetteEdges = [];
    for (const coord of targetSilhouetteCells) {
      const [gr, gc] = coord.split(',').map(Number);
      const x1 = gc * cellW;
      const x2 = (gc + 1) * cellW;
      const y1 = topOffset + gr * cellH;
      const y2 = topOffset + (gr + 1) * cellH;

      // 상단 경계
      if (!isSilhouetteGrid[gr - 1]?.[gc]) silhouetteEdges.push({ x1, y1, x2, y2: y1 });
      // 하단 경계
      if (!isSilhouetteGrid[gr + 1]?.[gc]) silhouetteEdges.push({ x1, y1: y2, x2, y2 });
      // 좌측 경계
      if (!isSilhouetteGrid[gr]?.[gc - 1]) silhouetteEdges.push({ x1, y1, x2: x1, y2 });
      // 우측 경계
      if (!isSilhouetteGrid[gr]?.[gc + 1]) silhouetteEdges.push({ x1: x2, y1, x2, y2 });
    }

    // 숨겨진 완성 일러스트를 실루엣 위치에 1:1로 정확히 정렬
    const silX = startC * cellW;
    const silY = topOffset + startR * cellH;
    const silW = 16 * scale * cellW;
    const silH = 16 * scale * cellH;

    this._renderHiddenArtwork({
      x: silX,
      y: silY,
      w: silW,
      h: silH
    });

    this.qixState = {
      cols,
      rows,
      topOffset,
      cellW,
      cellH,
      grid,
      lives: 3,
      elapsed: 0,
      lastTime: performance.now(),
      targetPct: 100, // 술의 외곽 실루엣 내부 영역을 100% 모두 도려내야 승리!
      targetSilhouetteCells,
      totalSilhouetteCells: targetSilhouetteCells.size,
      capturedSilhouetteCount: 0,
      silhouetteRevealedPct: 0,
      silhouetteEdges,
      player: {
        c: Math.floor(cols / 2),
        r: rows - 1,
        dc: 0,
        dr: 0,
        moveAccum: 0
      },
      enemies: (() => {
        const configs = [
          { isBoss: true, baseSpeed: 23.5 },
          { isBoss: false, baseSpeed: 27.5 },
          { isBoss: false, baseSpeed: 28.2 }
        ];

        // 플레이어 시작 지점과 떨어진 상/중단 구역 배치
        const zones = [
          { minC: cols * 0.12, maxC: cols * 0.38, minR: rows * 0.14, maxR: rows * 0.52 },
          { minC: cols * 0.38, maxC: cols * 0.62, minR: rows * 0.14, maxR: rows * 0.48 },
          { minC: cols * 0.62, maxC: cols * 0.88, minR: rows * 0.14, maxR: rows * 0.52 }
        ];

        zones.sort(() => Math.random() - 0.5);

        return configs.map((cfg, idx) => {
          const z = zones[idx];
          const c = z.minC + Math.random() * (z.maxC - z.minC);
          const r = z.minR + Math.random() * (z.maxR - z.minR);

          let angle;
          do {
            angle = Math.random() * Math.PI * 2;
          } while (Math.abs(Math.cos(angle)) < 0.35 || Math.abs(Math.sin(angle)) < 0.35);

          return {
            c,
            r,
            vc: Math.cos(angle) * cfg.baseSpeed,
            vr: Math.sin(angle) * cfg.baseSpeed,
            isBoss: cfg.isBoss,
            baseSpeed: cfg.baseSpeed
          };
        });
      })(),
      capturedPct: 0
    };

    let qixIgnoreInputUntil = 0;

    const handleQixAction = () => {
      if (this.gameState === 'READY') {
        this.gameState = 'PLAYING';
        this.qixState.lastTime = performance.now();
        this.qixState.player.moveAccum = 0;
        this.qixState.player.dc = 0;
        this.qixState.player.dr = 0;
        qixIgnoreInputUntil = performance.now() + 280;
        this.audio.playTap();
        return true;
      } else if (this.gameState === 'OVER') {
        this.audio.playTap();
        this.start('TERRITORY_QIX');
        this.gameState = 'PLAYING';
        this.qixState.lastTime = performance.now();
        this.qixState.player.moveAccum = 0;
        this.qixState.player.dc = 0;
        this.qixState.player.dr = 0;
        qixIgnoreInputUntil = performance.now() + 280;
        return true;
      }
      return false;
    };

    const steerToward = (clientX, clientY) => {
      const wasStarting = handleQixAction();
      if (wasStarting || performance.now() < qixIgnoreInputUntil) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      const y = (clientY - rect.top) * (this.height / rect.height) - topOffset;
      const targetC = x / cellW;
      const targetR = y / cellH;
      const pl = this.qixState.player;
      const dx = targetC - pl.c;
      const dy = targetR - pl.r;
      if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) return;

      const candidates = [];
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (Math.abs(dx) >= 0.8) candidates.push({ dc: dx > 0 ? 1 : -1, dr: 0 });
        if (Math.abs(dy) >= 0.8) candidates.push({ dc: 0, dr: dy > 0 ? 1 : -1 });
      } else {
        if (Math.abs(dy) >= 0.8) candidates.push({ dc: 0, dr: dy > 0 ? 1 : -1 });
        if (Math.abs(dx) >= 0.8) candidates.push({ dc: dx > 0 ? 1 : -1, dr: 0 });
      }

      const isDrawing = grid[pl.r] && grid[pl.r][pl.c] === 2;

      for (const cand of candidates) {
        const isReverse = (pl.dc !== 0 && cand.dc === -pl.dc) || (pl.dr !== 0 && cand.dr === -pl.dr);
        const nc = pl.c + cand.dc;
        const nr = pl.r + cand.dr;
        const nextCell = grid[nr] ? grid[nr][nc] : null;

        if (nextCell === 2) continue;
        if (isDrawing && isReverse) continue;

        pl.dc = cand.dc;
        pl.dr = cand.dr;
        return;
      }
    };

    let isPointerDown = false;
    const onDown = (e) => {
      if (e.cancelable && e.type && e.type.startsWith('touch')) {
        e.preventDefault();
      }
      isPointerDown = true;
      const pt = e.touches ? e.touches[0] : e;
      if (pt) steerToward(pt.clientX, pt.clientY);
    };
    const onMove = (e) => {
      if (!isPointerDown && !e.touches) return;
      if (e.touches) e.preventDefault();
      const pt = e.touches ? e.touches[0] : e;
      if (pt) steerToward(pt.clientX, pt.clientY);
    };
    const onUp = () => { isPointerDown = false; };

    const onKeyDown = (e) => {
      handleQixAction();
      let reqDc = 0, reqDr = 0;
      if (e.key === 'ArrowLeft' || e.key === 'a') reqDc = -1;
      else if (e.key === 'ArrowRight' || e.key === 'd') reqDc = 1;
      else if (e.key === 'ArrowUp' || e.key === 'w') reqDr = -1;
      else if (e.key === 'ArrowDown' || e.key === 's') reqDr = 1;
      else if (e.key === ' ' || e.key === 'Enter') { handleQixAction(); return; }
      else return;

      this.setQixDirection(reqDc, reqDr);
    };

    this.canvas.addEventListener('mousedown', onDown);
    this.canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    this.canvas.addEventListener('touchstart', onDown, { passive: false });
    this.canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('keydown', onKeyDown);

    this._cleanupInputHandlers = () => {
      this.canvas.removeEventListener('mousedown', onDown);
      this.canvas.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this.canvas.removeEventListener('touchstart', onDown);
      this.canvas.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  _clearQixTrail() {
    const { grid, rows, cols } = this.qixState;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 2) grid[r][c] = 0;
      }
    }
  }

  _floodFillCaptureQix() {
    const st = this.qixState;
    const { grid, rows, cols } = st;

    // 1. 모든 선(2)을 점령지(1)로 변경
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 2) grid[r][c] = 1;
      }
    }

    // 2. 미점령(0) 영역을 연결 요소(Connected Components) 단위로 분리
    const compMap = Array.from({ length: rows }, () => new Int32Array(cols).fill(-1));
    const components = [];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c] === 0 && compMap[r][c] === -1) {
          const compId = components.length;
          const cells = [];
          const queue = [[r, c]];
          compMap[r][c] = compId;
          let head = 0;
          while (head < queue.length) {
            const [cr, cc] = queue[head++];
            cells.push([cr, cc]);
            for (const [dr, dc] of dirs) {
              const nr = cr + dr;
              const nc = cc + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (grid[nr][nc] === 0 && compMap[nr][nc] === -1) {
                  compMap[nr][nc] = compId;
                  queue.push([nr, nc]);
                }
              }
            }
          }
          components.push({ id: compId, cells, enemyCount: 0 });
        }
      }
    }

    // 3. 각 분할 영역에 속한 적 구체 수 집계
    for (const en of st.enemies) {
      const er = Math.max(1, Math.min(rows - 2, Math.floor(en.r)));
      const ec = Math.max(1, Math.min(cols - 2, Math.floor(en.c)));
      const cid = compMap[er][ec];
      if (cid !== -1 && components[cid]) {
        components[cid].enemyCount++;
      }
    }

    // 4. 영역 분할 시 1개의 메인 미점령 영역만 남기고 나머지 영역은 100% 점령
    if (components.length > 0) {
      const compsWithEnemies = components.filter(comp => comp.enemyCount > 0);
      const pool = compsWithEnemies.length > 0 ? compsWithEnemies : components;
      pool.sort((a, b) => b.cells.length - a.cells.length);
      const survivorComp = pool[0];

      for (const comp of components) {
        if (comp.id !== survivorComp.id) {
          for (const [cr, cc] of comp.cells) {
            grid[cr][cc] = 1;
          }
        }
      }

      if (survivorComp.cells.length > 0) {
        const fallbackCell = survivorComp.cells[Math.floor(survivorComp.cells.length / 2)];
        for (const en of st.enemies) {
          const er = Math.max(1, Math.min(rows - 2, Math.floor(en.r)));
          const ec = Math.max(1, Math.min(cols - 2, Math.floor(en.c)));
          if (compMap[er][ec] !== survivorComp.id) {
            en.r = fallbackCell[0] + 0.5;
            en.c = fallbackCell[1] + 0.5;
          }
        }
      }
    }

    // 5. 도트 실루엣 영역 점령률 집계: "외곽 실루엣 내부를 100% 완전히 땄는가!"
    let capturedCount = 0;
    for (const coord of st.targetSilhouetteCells) {
      const [gr, gc] = coord.split(',').map(Number);
      if (grid[gr][gc] === 1) {
        capturedCount++;
      }
    }

    st.capturedSilhouetteCount = capturedCount;
    st.silhouetteRevealedPct = (capturedCount / Math.max(1, st.totalSilhouetteCells)) * 100;

    this.audio.playTap();
    this._spawnParticles(
      st.player.c * st.cellW,
      st.topOffset + st.player.r * st.cellH,
      '#10b981',
      20
    );
  }

  _updateTerritoryQix() {
    const st = this.qixState;
    const now = performance.now();
    const dt = Math.min((now - st.lastTime) / 1000, 0.05);
    st.lastTime = now;
    st.elapsed += dt;

    // 플레이어 이동 (초당 22칸)
    const pl = st.player;
    pl.moveAccum += dt * 22;
    while (pl.moveAccum >= 1) {
      pl.moveAccum -= 1;
      if (pl.dc !== 0 || pl.dr !== 0) {
        const nc = Math.max(0, Math.min(st.cols - 1, pl.c + pl.dc));
        const nr = Math.max(0, Math.min(st.rows - 1, pl.r + pl.dr));
        const prevState = st.grid[pl.r][pl.c];
        const nextState = st.grid[nr][nc];

        // 자기 자신의 선(2)을 밟으면 라이프 차감
        if (nextState === 2 && (nr !== pl.r || nc !== pl.c)) {
          this._onQixPlayerHit();
          return;
        }

        pl.c = nc;
        pl.r = nr;

        if (nextState === 0) {
          st.grid[nr][nc] = 2; // 새로운 궤적 긋기
        } else if (nextState === 1 && prevState === 2) {
          // 안전지대 복귀 -> 영역 점령!
          pl.dc = 0;
          pl.dr = 0;
          this._floodFillCaptureQix();

          // 술의 외곽 실루엣 내부를 100% 모두 점령했을 때 승리!
          if (st.capturedSilhouetteCount >= st.totalSilhouetteCells || st.silhouetteRevealedPct >= 100) {
            this.gameState = 'WIN';
            this.audio.playSuccess();
            if (this.onWin) this.onWin();
            return;
          }
        }
      }
    }

    // 적 구체 이동 및 선(2) 충돌 검사
    const timeProgress = Math.min(1, Math.max(0, st.elapsed / 24));
    const captureProgress = Math.min(1, st.silhouetteRevealedPct / st.targetPct);
    const ramp = Math.max(timeProgress, captureProgress * 0.85);
    const speedMultiplier = 0.82 + 0.44 * ramp;

    for (const en of st.enemies) {
      if (!en.baseSpeed) en.baseSpeed = Math.hypot(en.vc, en.vr);

      const stepDist = Math.max(Math.abs(en.vc), Math.abs(en.vr)) * speedMultiplier * dt;
      const subSteps = Math.max(1, Math.ceil(stepDist / 0.45));
      const subDt = dt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        const nextC = en.c + en.vc * speedMultiplier * subDt;
        const nextR = en.r + en.vr * speedMultiplier * subDt;
        const checkC = Math.max(0, Math.min(st.cols - 1, Math.floor(nextC)));
        const checkR = Math.max(0, Math.min(st.rows - 1, Math.floor(nextR)));

        // 적이 내 선(2)에 닿거나 선을 긋고 있는 플레이어와 부딪히면 피격
        if (st.grid[checkR][checkC] === 2 || (st.grid[pl.r][pl.c] === 2 && Math.hypot(en.c - pl.c, en.r - pl.r) < 1.6)) {
          this._onQixPlayerHit();
          return;
        }

        let bounced = false;
        if (st.grid[checkR][Math.floor(en.c)] === 1) {
          en.vr = -en.vr;
          en.vc += (Math.random() - 0.5) * 1.5;
          bounced = true;
        } else {
          en.r = nextR;
        }

        if (st.grid[Math.floor(en.r)][checkC] === 1) {
          en.vc = -en.vc;
          en.vr += (Math.random() - 0.5) * 1.5;
          bounced = true;
        } else {
          en.c = nextC;
        }

        if (bounced) {
          const curSpd = Math.hypot(en.vc, en.vr);
          if (curSpd > 0.1) {
            en.vc = (en.vc / curSpd) * en.baseSpeed;
            en.vr = (en.vr / curSpd) * en.baseSpeed;
          }
        }
      }
    }
  }

  _onQixPlayerHit() {
    const st = this.qixState;
    st.lives--;
    this.shakeTicks = 12;
    this.audio.playFail();
    this._spawnParticles(
      st.player.c * st.cellW,
      st.topOffset + st.player.r * st.cellH,
      '#ef4444',
      22
    );
    this._clearQixTrail();
    st.player.c = Math.floor(st.cols / 2);
    st.player.r = st.rows - 1;
    st.player.dc = 0;
    st.player.dr = 0;
    st.player.moveAccum = 0;
    st.lastTime = performance.now();

    if (st.lives <= 0) {
      this.gameState = 'OVER';
      if (this.onLose) this.onLose();
    } else {
      this.gameState = 'READY';
    }
  }

  _drawTerritoryQix(ctx) {
    const st = this.qixState;

    // 1. 숨겨진 완성 일러스트를 전체 캔버스에 렌더링
    ctx.drawImage(this.hiddenArtCanvas, 0, 0);

    // 2. 미점령 영역(0)을 100% 완전 불투명 암전으로 가려 사전 유출을 원천 차단
    const { grid, rows, cols, cellW, cellH, topOffset } = st;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];
        const x = c * cellW;
        const y = topOffset + r * cellH;
        if (val === 0) {
          ctx.fillStyle = '#070b14'; // 100% 완전 불투명 암전
          ctx.fillRect(x - 0.5, y - 0.5, cellW + 1, cellH + 1);
        } else if (val === 2) {
          ctx.fillStyle = '#f59e0b'; // 선 긋기 트레일
          ctx.fillRect(x, y, cellW + 1, cellH + 1);
        }
      }
    }

    // 3. 목표인 술의 고유 외곽 실루엣을 네온 가이드라인으로 렌더링
    if (st.silhouetteEdges && st.silhouetteEdges.length > 0) {
      const pulse = 0.82 + 0.18 * Math.sin(performance.now() * 0.006);
      ctx.save();
      ctx.shadowColor = st.silhouetteRevealedPct >= 100 ? '#10b981' : '#38bdf8';
      ctx.shadowBlur = 8 * pulse;
      ctx.strokeStyle = st.silhouetteRevealedPct >= 100
        ? `rgba(16, 185, 129, ${0.9 * pulse})`
        : `rgba(56, 189, 248, ${0.85 * pulse})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (const e of st.silhouetteEdges) {
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. 적 구체 렌더링 (네온 오라)
    for (const en of st.enemies) {
      const ex = en.c * cellW;
      const ey = topOffset + en.r * cellH;
      ctx.save();
      ctx.shadowColor = en.isBoss ? '#ec4899' : '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ex, ey, en.isBoss ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = en.isBoss ? '#ec4899' : '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 5. 플레이어 네온 커서 렌더링
    const px = st.player.c * cellW + cellW / 2;
    const py = topOffset + st.player.r * cellH + cellH / 2;
    ctx.beginPath();
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    this._drawHUD(ctx, {
      lives: st.lives,
      progressPct: st.silhouetteRevealedPct,
      labelText: `실루엣 점령: ${Math.floor(st.silhouetteRevealedPct)}% / 100%`
    });
  }

  _update() {
    this._updateParticles();
    if (this.gameState !== 'PLAYING') {
      if (this.gameState === 'READY' && this.gameType === 'BRICK_BREAKER' && this.bbState) {
        const p = this.bbState.paddle;
        const b = this.bbState.ball;
        b.x = p.x + p.w / 2;
        b.y = p.y - b.r - 2;
      }
      return;
    }
    if (this.gameType === 'BRICK_BREAKER') this._updateBrickBreaker();
    else if (this.gameType === 'TERRITORY_QIX') this._updateTerritoryQix();
  }

  _draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shakeTicks > 0) {
      this.shakeTicks--;
      const dx = (Math.random() - 0.5) * 6;
      const dy = (Math.random() - 0.5) * 6;
      ctx.translate(dx, dy);
    }
    if (this.gameType === 'BRICK_BREAKER') this._drawBrickBreaker(ctx);
    else if (this.gameType === 'TERRITORY_QIX') this._drawTerritoryQix(ctx);
    this._drawParticles(ctx);

    if (this.gameState === 'READY') {
      this._drawOverlayPrompt(ctx, '👆 터치하여 시작');
    } else if (this.gameState === 'OVER') {
      this._drawOverlayPrompt(ctx, '👆 터치하여 다시 시작', '', true);
    } else if (this.gameState === 'WIN') {
      this._drawOverlayPrompt(ctx, 'Clear!', '');
    }

    ctx.restore();
  }
}

window.KSool.ImageMinigameSuite = ImageMinigameSuite;
