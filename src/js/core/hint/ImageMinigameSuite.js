window.KSool = window.KSool || {};

/**
 * 도감 그림(아이콘/일러스트) 선해금을 위한 3종 고난도 아케이드 미니게임 엔진
 * 1) BRICK_BREAKER : 🧱 아이스 브레이커 (다중 체력 얼음블럭 + 함정 낙하물 회피 블럭깨기)
 * 2) TERRITORY_QIX : 📐 네온 땅따먹기 (BFS 영역 점령 + 보스 탄막 & 테두리 감시자 회피)
 * 3) CRITICAL_HAMMER: 🔨 크리티컬 아이스 해머 (5단계 가속·함정 구간 타이밍 격파)
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

    // 오프스크린에 숨겨진 완성 술 일러스트 렌더링 (깨진 블럭/땅따먹기 영역만큼 마스킹 노출용)
    this.hiddenArtCanvas = document.createElement('canvas');
    this.hiddenArtCanvas.width = this.width;
    this.hiddenArtCanvas.height = this.height;
    this._renderHiddenArtwork();

    this._cleanupInputHandlers = null;
  }

  _renderHiddenArtwork() {
    const c = this.hiddenArtCanvas;
    const g = c.getContext('2d');
    const w = c.width;
    const h = c.height;

    const rad = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6);
    rad.addColorStop(0, '#1e3a8a');
    rad.addColorStop(0.55, '#0f172a');
    rad.addColorStop(1, '#090d16');
    g.fillStyle = rad;
    g.fillRect(0, 0, w, h);

    // 후광 링
    g.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(w / 2, h / 2, 82, 0, Math.PI * 2);
    g.stroke();

    g.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(w / 2, h / 2, 104, 0, Math.PI * 2);
    g.stroke();

    // 중앙 대형 술/재료 그림
    g.font = '112px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(245, 158, 11, 0.7)';
    g.shadowBlur = 24;
    g.fillText(this.recipe ? this.recipe.emoji : '🍶', w / 2, h / 2);
    g.shadowBlur = 0;
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
    this.isRunning = true;
    this.particles = [];
    this.shakeTicks = 0;

    if (gameType === 'BRICK_BREAKER') {
      this._initBrickBreaker();
    } else if (gameType === 'TERRITORY_QIX') {
      this._initTerritoryQix();
    } else if (gameType === 'CRITICAL_HAMMER') {
      this._initCriticalHammer();
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
    this.qixState.player.dc = dc;
    this.qixState.player.dr = dr;
  }

  triggerHammerStrike() {
    if (!this.isRunning || this.gameType !== 'CRITICAL_HAMMER' || !this.chState) return;
    this._handleHammerStrike();
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

  _drawHUD(ctx, { lives, timeLeftSec, progressPct, targetPct, subText }) {
    ctx.fillStyle = 'rgba(9, 13, 24, 0.88)';
    ctx.fillRect(0, 0, this.width, 32);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(this.width, 32);
    ctx.stroke();

    // 라이프
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const hearts = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives));
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(hearts, 10, 16);

    // 해금 진행률
    ctx.textAlign = 'center';
    ctx.fillStyle = progressPct >= targetPct ? '#10b981' : '#fcd34d';
    ctx.fillText(`해금률 ${Math.floor(progressPct)}% / 목표 ${targetPct}%`, this.width / 2, 16);

    // 남은 시간
    ctx.textAlign = 'right';
    ctx.fillStyle = timeLeftSec <= 10 ? '#ef4444' : '#38bdf8';
    ctx.fillText(`⏱️ ${Math.ceil(timeLeftSec)}초`, this.width - 10, 16);

    if (subText) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.fillText(subText, this.width / 2, this.height - 8);
    }
  }

  // =========================================================================
  // 1. 🧱 아이스 브레이커 (고난도 블럭깨기)
  // =========================================================================
  _initBrickBreaker() {
    const cols = 6;
    const rows = 5;
    const padX = 14;
    const topY = 44;
    const gap = 4;
    const bw = (this.width - padX * 2 - gap * (cols - 1)) / cols;
    const bh = 26;

    this.bbState = {
      lives: 3,
      timeLeft: 45,
      lastTime: performance.now(),
      targetPct: 85,
      paddle: {
        x: this.width / 2 - 38,
        y: this.height - 28,
        w: 76,
        baseW: 76,
        h: 12,
        shrinkTimer: 0
      },
      ball: {
        x: this.width / 2,
        y: this.height - 44,
        vx: (Math.random() > 0.5 ? 1 : -1) * 3.8,
        vy: -4.3,
        r: 7,
        speedMultiplier: 1.0
      },
      blocks: [],
      hazards: [], // 위에서 떨어지는 독방울(☠️) / 빙결함정(❄️)
      totalBreakable: 0,
      brokenCount: 0
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 중앙 코어는 HP 3, 상단은 HP 2, 일부 칸은 파괴불가 강철 범퍼(고난도 궤적 교란)
        let hp = 1;
        let isSteel = false;
        if (r === 2 && (c === 1 || c === 4)) {
          isSteel = true;
          hp = 999;
        } else if (r === 1 && (c === 2 || c === 3)) {
          hp = 3;
        } else if (r <= 2) {
          hp = 2;
        }

        if (!isSteel) this.bbState.totalBreakable++;

        this.bbState.blocks.push({
          x: padX + c * (bw + gap),
          y: topY + r * (bh + gap),
          w: bw,
          h: bh,
          hp,
          maxHp: hp,
          isSteel,
          alive: true
        });
      }
    }

    const movePaddle = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const x = (clientX - rect.left) * scaleX;
      const p = this.bbState.paddle;
      p.x = Math.max(6, Math.min(this.width - p.w - 6, x - p.w / 2));
    };

    const onMouseMove = (e) => movePaddle(e.clientX);
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault();
        movePaddle(e.touches[0].clientX);
      }
    };

    this.canvas.addEventListener('mousemove', onMouseMove);
    this.canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    this.canvas.addEventListener('touchstart', onTouchMove, { passive: false });

    this._cleanupInputHandlers = () => {
      this.canvas.removeEventListener('mousemove', onMouseMove);
      this.canvas.removeEventListener('touchmove', onTouchMove);
      this.canvas.removeEventListener('touchstart', onTouchMove);
    };
  }

  _updateBrickBreaker() {
    const st = this.bbState;
    const now = performance.now();
    const dt = (now - st.lastTime) / 1000;
    st.lastTime = now;
    st.timeLeft -= dt;

    if (st.timeLeft <= 0) {
      this.audio.playFail();
      this.stop();
      this.onLose('제한시간(45초)이 초과되었습니다!');
      return;
    }

    if (st.paddle.shrinkTimer > 0) {
      st.paddle.shrinkTimer -= dt;
      if (st.paddle.shrinkTimer <= 0) {
        st.paddle.w = st.paddle.baseW;
      }
    }

    const b = st.ball;
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
    const p = st.paddle;
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
      b.speedMultiplier = Math.min(1.48, b.speedMultiplier + 0.025);
      this.audio.playTap();
    }

    // 블럭 충돌
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
            this.shakeTicks = 6;
            this._spawnParticles(blk.x + blk.w / 2, blk.y + blk.h / 2, '#38bdf8', 15);

            // 38% 확률로 함정 낙하물(☠️ 독방울 또는 ❄️ 패들축소) 생성 -> 난이도 상승!
            if (Math.random() < 0.38) {
              st.hazards.push({
                x: blk.x + blk.w / 2,
                y: blk.y + blk.h / 2,
                vy: 2.3 + Math.random() * 1.4,
                type: Math.random() < 0.55 ? 'POISON' : 'FREEZE'
              });
            }
          } else {
            this._spawnParticles(b.x, b.y, '#fcd34d', 8);
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
            this.stop();
            this.onLose('독방울(☠️)에 피격되어 모든 라이프를 잃었습니다!');
            return;
          }
        } else {
          // FREEZE: 패들 폭 절반 축소
          p.w = Math.max(42, p.baseW * 0.58);
          p.shrinkTimer = 6.0;
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
        this.stop();
        this.onLose('공을 모두 놓쳐 라이프가 소진되었습니다!');
        return;
      }
      b.x = p.x + p.w / 2;
      b.y = p.y - 16;
      b.vx = (Math.random() > 0.5 ? 1 : -1) * 3.8;
      b.vy = -4.3;
    }

    // 승리 판정
    const pct = (st.brokenCount / Math.max(1, st.totalBreakable)) * 100;
    if (pct >= st.targetPct) {
      this.audio.playSuccess();
      this.stop();
      this.onWin();
    }
  }

  _drawBrickBreaker(ctx) {
    const st = this.bbState;
    // 1. 배경에 숨겨진 완성 술 그림을 먼저 그림
    ctx.drawImage(this.hiddenArtCanvas, 0, 0);

    // 2. 아직 안 깨진 블럭 영역은 불투명한 빙결 장막으로 가림
    for (const blk of st.blocks) {
      if (!blk.alive) continue;
      // 뒤쪽 그림 가리기용 암막
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(blk.x - 2, blk.y - 2, blk.w + 4, blk.h + 4);

      if (blk.isSteel) {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#94a3b8';
      } else if (blk.hp === 3) {
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#fde68a';
      } else if (blk.hp === 2) {
        ctx.fillStyle = '#1d4ed8';
        ctx.strokeStyle = '#93c5fd';
      } else {
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#bae6fd';
      }

      ctx.lineWidth = 1.5;
      ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
      ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);

      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(blk.isSteel ? '⚙️강철' : `🧊×${blk.hp}`, blk.x + blk.w / 2, blk.y + blk.h / 2);
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
      timeLeftSec: st.timeLeft,
      progressPct: pct,
      targetPct: st.targetPct,
      subText: '좌우 드래그로 패들 이동 · 떨어지는 ☠️독방울과 ❄️빙결 함정을 피하세요!'
    });
  }

  // =========================================================================
  // 2. 📐 네온 땅따먹기 (고난도 BFS 영역 점령)
  // =========================================================================
  _initTerritoryQix() {
    const cols = 52;
    const rows = 48;
    const topOffset = 32;
    const bottomPad = 0;
    const cellW = this.width / cols;
    const cellH = (this.height - topOffset - bottomPad) / rows;

    // 0: 미점령(어둠), 1: 안전지대/점령완료, 2: 현재 긋고 있는 선(Trail)
    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (__, c) =>
        r === 0 || r === rows - 1 || c === 0 || c === cols - 1 ? 1 : 0
      )
    );

    this.qixState = {
      cols,
      rows,
      topOffset,
      cellW,
      cellH,
      grid,
      lives: 3,
      totalTime: 45,
      timeLeft: 45,
      lastTime: performance.now(),
      targetPct: 75,
      player: {
        c: Math.floor(cols / 2),
        r: rows - 1,
        dc: 0,
        dr: 0,
        moveAccum: 0
      },
      enemies: [
        // 보스 코어 + 고속 추격 구체 2개 (초반 40% 속도로 시작해 점점 100%까지 가속)
        { c: cols * 0.5, r: rows * 0.5, vc: 13.5, vr: 11.2, isBoss: true },
        { c: cols * 0.3, r: rows * 0.35, vc: -15.0, vr: 13.0, isBoss: false },
        { c: cols * 0.7, r: rows * 0.65, vc: 14.2, vr: -14.5, isBoss: false }
      ],
      capturedPct: 0
    };

    const steerToward = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      const y = (clientY - rect.top) * (this.height / rect.height) - topOffset;
      const targetC = x / cellW;
      const targetR = y / cellH;
      const pl = this.qixState.player;
      const dx = targetC - pl.c;
      const dy = targetR - pl.r;
      if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        pl.dc = dx > 0 ? 1 : -1;
        pl.dr = 0;
      } else {
        pl.dc = 0;
        pl.dr = dy > 0 ? 1 : -1;
      }
    };

    let isPointerDown = false;
    const onDown = (e) => {
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
      const pl = this.qixState.player;
      if (e.key === 'ArrowLeft' || e.key === 'a') { pl.dc = -1; pl.dr = 0; }
      else if (e.key === 'ArrowRight' || e.key === 'd') { pl.dc = 1; pl.dr = 0; }
      else if (e.key === 'ArrowUp' || e.key === 'w') { pl.dc = 0; pl.dr = -1; }
      else if (e.key === 'ArrowDown' || e.key === 's') { pl.dc = 0; pl.dr = 1; }
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

    // 1. 먼저 모든 선(2)을 점령지(1)로 변경
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 2) grid[r][c] = 1;
      }
    }

    // 2. 적 구체들이 위치한 미점령(0) 영역을 BFS로 마킹 (적이 없는 닫힌 영역은 전부 점령!)
    const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
    const queue = [];

    for (const en of st.enemies) {
      const er = Math.max(1, Math.min(rows - 2, Math.floor(en.r)));
      const ec = Math.max(1, Math.min(cols - 2, Math.floor(en.c)));
      if (grid[er][ec] === 0 && !visited[er][ec]) {
        visited[er][ec] = 1;
        queue.push([er, ec]);
      }
    }

    let head = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (head < queue.length) {
      const [cr, cc] = queue[head++];
      for (const [dr, dc] of dirs) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (grid[nr][nc] === 0 && !visited[nr][nc]) {
            visited[nr][nc] = 1;
            queue.push([nr, nc]);
          }
        }
      }
    }

    // 3. 적과 연결되지 않은 모든 0번 칸을 1(점령 완료)로 전환!
    let capturedCells = 0;
    const totalInnerCells = (rows - 2) * (cols - 2);
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c] === 0 && !visited[r][c]) {
          grid[r][c] = 1;
        }
        if (grid[r][c] === 1) {
          capturedCells++;
        }
      }
    }

    st.capturedPct = (capturedCells / Math.max(1, totalInnerCells)) * 100;
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
    const dt = (now - st.lastTime) / 1000;
    st.lastTime = now;
    st.timeLeft -= dt;

    if (st.timeLeft <= 0) {
      this.audio.playFail();
      this.stop();
      this.onLose('제한시간(45초)이 초과되었습니다!');
      return;
    }

    // 플레이어 그리드 이동 (초당 22칸 속도)
    const pl = st.player;
    pl.moveAccum += dt * 22;
    while (pl.moveAccum >= 1) {
      pl.moveAccum -= 1;
      if (pl.dc !== 0 || pl.dr !== 0) {
        const nc = Math.max(0, Math.min(st.cols - 1, pl.c + pl.dc));
        const nr = Math.max(0, Math.min(st.rows - 1, pl.r + pl.dr));
        const prevState = st.grid[pl.r][pl.c];
        const nextState = st.grid[nr][nc];

        // 자기 자신의 선(2)을 다시 밟으면 라이프 차감!
        if (nextState === 2 && (nr !== pl.r || nc !== pl.c)) {
          this._onQixPlayerHit();
          return;
        }

        pl.c = nc;
        pl.r = nr;

        if (nextState === 0) {
          st.grid[nr][nc] = 2; // 새로운 선 긋기
        } else if (nextState === 1 && prevState === 2) {
          // 안전지대에 복귀 성공 -> 영역 점령!
          pl.dc = 0;
          pl.dr = 0;
          this._floodFillCaptureQix();
          if (st.capturedPct >= st.targetPct) {
            this.audio.playSuccess();
            this.stop();
            this.onWin();
            return;
          }
        }
      }
    }

    // 적 구체 이동 및 선(2) 충돌 검사
    // 초반에는 적당한 속도(40%)로 시작하여 시간이 흐르거나 점령률이 올라갈수록 점점 빨라져 기존 최고 속도(100%)에 도달
    const timeProgress = Math.min(1, Math.max(0, ((st.totalTime || 45) - st.timeLeft) / 32));
    const captureProgress = Math.min(1, st.capturedPct / st.targetPct);
    const ramp = Math.max(timeProgress, captureProgress * 0.85);
    const speedMultiplier = 0.40 + 0.60 * ramp;

    for (const en of st.enemies) {
      const nextC = en.c + en.vc * speedMultiplier * dt;
      const nextR = en.r + en.vr * speedMultiplier * dt;
      const checkC = Math.max(0, Math.min(st.cols - 1, Math.floor(nextC)));
      const checkR = Math.max(0, Math.min(st.rows - 1, Math.floor(nextR)));

      // 적이 내 선(2)에 닿거나 선을 긋고 있는 플레이어와 부딪히면 피격!
      if (st.grid[checkR][checkC] === 2 || ( st.grid[pl.r][pl.c] === 2 && Math.hypot(en.c - pl.c, en.r - pl.r) < 1.6 )) {
        this._onQixPlayerHit();
        return;
      }

      // 점령지(1) 경계 반사
      if (st.grid[checkR][Math.floor(en.c)] === 1) {
        en.vr = -en.vr;
      } else {
        en.r = nextR;
      }

      if (st.grid[Math.floor(en.r)][checkC] === 1) {
        en.vc = -en.vc;
      } else {
        en.c = nextC;
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

    if (st.lives <= 0) {
      this.stop();
      this.onLose('방해 구체에 선이 끊겨 모든 라이프를 잃었습니다!');
    }
  }

  _drawTerritoryQix(ctx) {
    const st = this.qixState;
    // 1. 먼저 숨겨진 완성 술 일러스트를 전체에 그림
    ctx.drawImage(this.hiddenArtCanvas, 0, 0);

    // 2. 아직 점령하지 못한 칸(0)과 현재 긋는 선(2) 위에 어둠의 안개를 덮음
    const { grid, rows, cols, cellW, cellH, topOffset } = st;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];
        const x = c * cellW;
        const y = topOffset + r * cellH;
        if (val === 0) {
          ctx.fillStyle = 'rgba(11, 17, 32, 0.94)';
          ctx.fillRect(x - 0.5, y - 0.5, cellW + 1, cellH + 1);
        } else if (val === 2) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(x, y, cellW + 1, cellH + 1);
        }
      }
    }

    // 3. 적 구체 렌더링
    for (const en of st.enemies) {
      const ex = en.c * cellW;
      const ey = topOffset + en.r * cellH;
      ctx.beginPath();
      ctx.arc(ex, ey, en.isBoss ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = en.isBoss ? '#ec4899' : '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. 플레이어 네온 커서 렌더링
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
      timeLeftSec: st.timeLeft,
      progressPct: st.capturedPct,
      targetPct: st.targetPct,
      subText: ''
    });
  }

  // =========================================================================
  // 3. 🔨 크리티컬 아이스 해머 (5단계 가속·함정 타이밍 격파)
  // =========================================================================
  _initCriticalHammer() {
    this.chState = {
      lives: 3,
      timeLeft: 22,
      lastTime: performance.now(),
      maxStage: 5,
      clearedStages: 0,
      needlePos: 0.5, // 0.0 ~ 1.0
      needleDir: 1,
      needleSpeed: 1.15, // 단계마다 급가속
      critCenter: 0.5,
      critWidth: 0.14,
      dangerLeft: 0.30,
      dangerRight: 0.70,
      dangerWidth: 0.11,
      feedbackText: '노란 CRITICAL 구간에 바늘이 올 때 화면을 탭하세요!',
      feedbackColor: '#fcd34d'
    };

    this._randomizeHammerZones();

    const onStrike = (e) => {
      if (e.cancelable) e.preventDefault();
      this._handleHammerStrike();
    };

    const onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this._handleHammerStrike();
      }
    };

    this.canvas.addEventListener('mousedown', onStrike);
    this.canvas.addEventListener('touchstart', onStrike, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    this._cleanupInputHandlers = () => {
      this.canvas.removeEventListener('mousedown', onStrike);
      this.canvas.removeEventListener('touchstart', onStrike);
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  _randomizeHammerZones() {
    const st = this.chState;
    const stageIdx = st.clearedStages; // 0 ~ 4
    // 단계가 올라갈수록 크리티컬 폭은 좁아지고 바늘 속도는 빨라짐
    st.critWidth = Math.max(0.075, 0.14 - stageIdx * 0.015);
    st.needleSpeed = 1.2 + stageIdx * 0.34;
    st.critCenter = 0.25 + Math.random() * 0.5;
    st.dangerWidth = 0.10;
    st.dangerLeft = Math.max(0.06, st.critCenter - st.critWidth / 2 - st.dangerWidth / 2 - 0.01);
    st.dangerRight = Math.min(0.94, st.critCenter + st.critWidth / 2 + st.dangerWidth / 2 + 0.01);
  }

  _handleHammerStrike() {
    const st = this.chState;
    const pos = st.needlePos;
    const halfCrit = st.critWidth / 2;
    const halfDanger = st.dangerWidth / 2;

    if (Math.abs(pos - st.critCenter) <= halfCrit) {
      // CRITICAL 정타 성공!
      st.clearedStages++;
      this.shakeTicks = 10;
      this.audio.playSuccess();
      this._spawnParticles(this.width / 2, this.height / 2 - 20, '#38bdf8', 26);
      st.feedbackText = `💥 CRITICAL 정타! (${st.clearedStages} / ${st.maxStage} 단계 격파!)`;
      st.feedbackColor = '#10b981';

      if (st.clearedStages >= st.maxStage) {
        this.stop();
        this.onWin();
        return;
      }
      this._randomizeHammerZones();
    } else if (
      Math.abs(pos - st.dangerLeft) <= halfDanger ||
      Math.abs(pos - st.dangerRight) <= halfDanger
    ) {
      // 붉은 함정(DANGER) 구간 타격 -> 라이프 감소 + 얼음 1단계 재생!
      st.lives--;
      st.clearedStages = Math.max(0, st.clearedStages - 1);
      this.shakeTicks = 14;
      this.audio.playFail();
      this._spawnParticles(this.width / 2, this.height / 2 - 20, '#ef4444', 22);
      st.feedbackText = '💀 붉은 함정 타격! 라이프 -1 & 통얼음이 1단계 재생되었습니다!';
      st.feedbackColor = '#ef4444';
      this._randomizeHammerZones();
    } else {
      // 일반 빗나감 (MISS) -> 라이프 감소
      st.lives--;
      this.shakeTicks = 8;
      this.audio.playFail();
      st.feedbackText = '❌ 타이밍 MISS! 라이프가 1 감소했습니다!';
      st.feedbackColor = '#f59e0b';
    }

    if (st.lives <= 0) {
      this.stop();
      this.onLose('타이밍 타격 실패로 모든 라이프를 잃었습니다!');
    }
  }

  _updateCriticalHammer() {
    const st = this.chState;
    const now = performance.now();
    const dt = (now - st.lastTime) / 1000;
    st.lastTime = now;
    st.timeLeft -= dt;

    if (st.timeLeft <= 0) {
      this.audio.playFail();
      this.stop();
      this.onLose('제한시간이 초과되었습니다!');
      return;
    }

    st.needlePos += st.needleDir * st.needleSpeed * dt;
    if (st.needlePos >= 1) {
      st.needlePos = 1;
      st.needleDir = -1;
    } else if (st.needlePos <= 0) {
      st.needlePos = 0;
      st.needleDir = 1;
    }
  }

  _drawCriticalHammer(ctx) {
    const st = this.chState;
    const pct = (st.clearedStages / st.maxStage) * 100;

    // 1. 배경에 숨겨진 완성 술 일러스트를 그림
    ctx.drawImage(this.hiddenArtCanvas, 0, 0);

    // 2. 아직 남은 얼음 결정 층만큼 중앙 그림을 두꺼운 빙결 레이어로 가림
    const remainRatio = 1 - st.clearedStages / st.maxStage;
    if (remainRatio > 0) {
      ctx.fillStyle = `rgba(11, 17, 32, ${Math.min(0.96, 0.35 + remainRatio * 0.62)})`;
      ctx.fillRect(0, 32, this.width, this.height - 32);

      // 중앙 통얼음 결정 블록
      const iceSize = 128;
      const ix = this.width / 2 - iceSize / 2;
      const iy = 52;
      ctx.fillStyle = `rgba(56, 189, 248, ${0.25 + remainRatio * 0.55})`;
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 3;
      ctx.fillRect(ix, iy, iceSize, iceSize);
      ctx.strokeRect(ix, iy, iceSize, iceSize);

      // 균열 선 그리기
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < st.clearedStages; i++) {
        ctx.beginPath();
        ctx.moveTo(ix + 15 + i * 22, iy + 10);
        ctx.lineTo(ix + iceSize / 2, iy + iceSize / 2);
        ctx.lineTo(ix + iceSize - 15 - i * 18, iy + iceSize - 12);
        ctx.stroke();
      }

      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`🧊 빙결 내구도: ${st.maxStage - st.clearedStages} / ${st.maxStage}`, this.width / 2, iy + iceSize / 2);
    }

    // 3. 피드백 메시지
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = st.feedbackColor;
    ctx.fillText(st.feedbackText, this.width / 2, 198);

    // 4. 하단 고속 타이밍 바
    const barX = 24;
    const barY = 212;
    const barW = this.width - 48;
    const barH = 26;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // 붉은 함정 구간 (좌/우)
    const drawZone = (center, width, color, label) => {
      const zx = barX + (center - width / 2) * barW;
      const zw = width * barW;
      ctx.fillStyle = color;
      ctx.fillRect(zx, barY, zw, barH);
      if (label) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(label, zx + zw / 2, barY + barH / 2 + 1);
      }
    };

    drawZone(st.dangerLeft, st.dangerWidth, 'rgba(239, 68, 68, 0.85)', '💀');
    drawZone(st.dangerRight, st.dangerWidth, 'rgba(239, 68, 68, 0.85)', '💀');
    drawZone(st.critCenter, st.critWidth, '#f59e0b', 'CRIT');

    // 바늘
    const nx = barX + st.needlePos * barW;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(nx - 3, barY - 5, 6, barH + 10);

    this._drawHUD(ctx, {
      lives: st.lives,
      timeLeftSec: st.timeLeft,
      progressPct: pct,
      targetPct: 100,
      subText: '화면을 탭(또는 스페이스바)하여 노란 CRIT 구간을 5회 연속 적중하세요!'
    });
  }

  _update() {
    this._updateParticles();
    if (this.gameType === 'BRICK_BREAKER') this._updateBrickBreaker();
    else if (this.gameType === 'TERRITORY_QIX') this._updateTerritoryQix();
    else if (this.gameType === 'CRITICAL_HAMMER') this._updateCriticalHammer();
  }

  _draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shakeTicks > 0) {
      const dx = (Math.random() - 0.5) * 6;
      const dy = (Math.random() - 0.5) * 6;
      ctx.translate(dx, dy);
    }

    ctx.clearRect(0, 0, this.width, this.height);
    if (this.gameType === 'BRICK_BREAKER') this._drawBrickBreaker(ctx);
    else if (this.gameType === 'TERRITORY_QIX') this._drawTerritoryQix(ctx);
    else if (this.gameType === 'CRITICAL_HAMMER') this._drawCriticalHammer(ctx);

    this._drawParticles(ctx);
    ctx.restore();
  }
}

window.KSool.ImageMinigameSuite = ImageMinigameSuite;
