window.KSool = window.KSool || {};

/**
 * 도감 그림(아이콘/일러스트) 선해금을 위한 아케이드 미니게임 엔진
 * 1) BRICK_BREAKER : 🧱 벽돌깨기 (다중 체력 벽돌 + 함정 낙하물 회피)
 * 2) TERRITORY_QIX : 📐 땅따먹기 (그림 영역 점령 + 보스 탄막 & 감시자 회피)
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

    // 오프스크린에 숨겨진 실제 술 그래픽/일러스트 렌더링
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

    const cx = w / 2;
    const cy = (h + 32) / 2;

    const drawBackground = () => {
      // 심플하고 깔끔한 다크 그라데이션 배경 (원형 링 및 격자무늬 일체 제거)
      const rad = g.createRadialGradient(cx, cy, 20, cx, cy, w * 0.72);
      rad.addColorStop(0, '#1e293b');
      rad.addColorStop(0.55, '#0f172a');
      rad.addColorStop(1, '#050811');
      g.fillStyle = rad;
      g.fillRect(0, 0, w, h);
    };

    drawBackground();

    // 2. 실제 픽셀/HD 아이콘 렌더링 (순수 일러스트/그림만 렌더링하고 글자는 일체 배제)
    const iconSize = 160;
    const ix = cx - iconSize / 2;
    const iy = cy - iconSize / 2;

    let hasSvg = false;
    if (this.recipe && window.KSool?.pixelIcon) {
      try {
        let svgStr = window.KSool.pixelIcon(this.recipe, iconSize);
        if (svgStr) {
          hasSvg = true;
          if (!svgStr.includes('xmlns=')) {
            svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
          }
          const img = new Image();
          img.onload = () => {
            // 이미지 로드 완료 시 배경 재도색 후 순수 아이콘만 정중앙 렌더링
            drawBackground();
            g.drawImage(img, ix, iy, iconSize, iconSize);
          };
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
        }
      } catch (err) {
        console.warn('Failed to render pixel icon on canvas:', err);
      }
    }

    if (!hasSvg) {
      g.font = '84px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.shadowColor = 'rgba(250, 204, 21, 0.6)';
      g.shadowBlur = 18;
      g.fillText(this.recipe ? this.recipe.emoji : '🍶', cx, cy);
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
    this.qixState.player.dc = dc;
    this.qixState.player.dr = dr;
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

    const boxW = 210;
    const boxH = 46;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    ctx.shadowColor = isOver ? 'rgba(239, 68, 68, 0.7)' : 'rgba(56, 189, 248, 0.7)';
    ctx.shadowBlur = 12 * pulse;

    ctx.fillStyle = isOver ? 'rgba(30, 20, 35, 0.94)' : 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = isOver ? `rgba(239, 68, 68, ${0.75 * pulse})` : `rgba(56, 189, 248, ${0.85 * pulse})`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, 23);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isOver ? '#fca5a5' : '#38bdf8';
    ctx.fillText(text, cx, cy + (subText ? -7 : 0));

    if (subText) {
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(subText, cx, cy + 11);
    }
    ctx.restore();
  }

  _drawHUD(ctx, { lives, timeLeftSec, progressPct, targetPct, labelText, subText }) {
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
    const displayLabel = labelText || `해금률 ${Math.floor(progressPct)}% / 목표 ${targetPct}%`;
    ctx.fillText(displayLabel, this.width / 2, 16);

    // 남은 시간 (시간 제한이 있는 게임만 표시)
    if (typeof timeLeftSec === 'number') {
      ctx.textAlign = 'right';
      ctx.fillStyle = timeLeftSec <= 10 ? '#ef4444' : '#38bdf8';
      ctx.fillText(`⏱️ ${Math.ceil(timeLeftSec)}초`, this.width - 10, 16);
    }

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
    const rows = 6;
    const padX = 12;
    const topY = 40;
    const gap = 4;
    const bw = (this.width - padX * 2 - gap * (cols - 1)) / cols;
    const bh = 28;

    this.bbState = {
      lives: 3,
      elapsed: 0,
      lastTime: performance.now(),
      targetPct: 100,
      blockAreaBottom: topY + rows * (bh + gap),
      paddle: {
        x: this.width / 2 - 40,
        y: this.height - 24,
        w: 80,
        baseW: 80,
        h: 12,
        shrinkTimer: 0,
        keyDir: 0
      },
      ball: {
        x: this.width / 2,
        y: this.height - 38,
        vx: 0,
        vy: 0,
        r: 7,
        speedMultiplier: 0.52
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
        if (r === 3 && (c === 1 || c === 4)) {
          isSteel = true;
          hp = 999;
        } else if ((r === 1 || r === 2) && (c === 2 || c === 3)) {
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

    const launchBall = () => {
      if (this.gameState === 'READY') {
        this.gameState = 'PLAYING';
        this.bbState.lastTime = performance.now();
        this.audio.playTap();
        const b = this.bbState.ball;
        b.vy = -3.9;
        b.vx = (Math.random() > 0.5 ? 1 : -1) * (2.8 + Math.random() * 0.8);
      } else if (this.gameState === 'OVER') {
        this.audio.playTap();
        this.start('BRICK_BREAKER');
        this.gameState = 'PLAYING';
        this.bbState.lastTime = performance.now();
        const b = this.bbState.ball;
        b.vy = -3.9;
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
      p.x = Math.max(6, Math.min(this.width - p.w - 6, p.x + p.keyDir * 320 * dt));
    }

    // 초반에는 적당한 속도(52%)로 시작하여 시간이 흐르거나 블럭 파괴율이 올라갈수록 점점 빨라져 기존 속도(115%)에 도달
    const timeProgress = Math.min(1, Math.max(0, st.elapsed / 34));
    const breakProgress = st.brokenCount / Math.max(1, st.totalBreakable);
    const ramp = Math.max(timeProgress * 0.85, breakProgress);

    const b = st.ball;
    b.speedMultiplier = 0.52 + 0.63 * ramp;
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
            this.gameState = 'OVER';
            if (this.onLose) this.onLose();
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

    // 승리 판정 (깰 수 있는 벽돌을 100% 모두 깨야 해금)
    const pct = (st.brokenCount / Math.max(1, st.totalBreakable)) * 100;
    if (st.brokenCount >= st.totalBreakable) {
      this.gameState = 'WIN';
      this.audio.playSuccess();
      if (this.onWin) this.onWin();
    }
  }

  _drawBrickBreaker(ctx) {
    const st = this.bbState;
    // 1. 전체 캔버스 암막 배경 + 블럭 영역 바로 뒤에 숨겨진 완성 술 일러스트 배치
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, this.width, this.height);
    const artH = Math.min(this.height - 34, (st.blockAreaBottom || 240) + 20);
    ctx.drawImage(this.hiddenArtCanvas, 0, 0, this.width, this.height, 0, 32, this.width, artH);

    // 2. 아직 안 깨진 블럭 영역은 불투명한 빙결 장막으로 가림
    for (const blk of st.blocks) {
      if (!blk.alive) continue;
      // 뒤쪽 그림 가리기용 암막
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(blk.x - 2, blk.y - 2, blk.w + 4, blk.h + 4);

      if (blk.isSteel) {
        // 강철: 글자/아이콘 없이 깔끔한 단색 회색
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#64748b';
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
      timeLeftSec: null,
      progressPct: pct,
      targetPct: st.targetPct,
      subText: ''
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

    // 중앙의 실제 그림(아이콘) 영역 계산 (그림을 온전히 뚫었는지 판정하는 목표 구역)
    const cx = this.width / 2;
    const cy = (this.height + topOffset) / 2;
    const picHalfW = 90;
    const picHalfH = 90;

    const picMinC = Math.max(1, Math.floor((cx - picHalfW) / cellW));
    const picMaxC = Math.min(cols - 2, Math.ceil((cx + picHalfW) / cellW));
    const picMinR = Math.max(1, Math.floor((cy - picHalfH - topOffset) / cellH));
    const picMaxR = Math.min(rows - 2, Math.ceil((cy + picHalfH - topOffset) / cellH));
    const totalPicCells = (picMaxR - picMinR + 1) * (picMaxC - picMinC + 1);

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
      targetPct: 100, // 네모칸 구역 전체(100%)를 모두 뚫어 온전히 드러내야 승리!
      picMinC,
      picMaxC,
      picMinR,
      picMaxR,
      totalPicCells,
      pictureRevealedPct: 0,
      player: {
        c: Math.floor(cols / 2),
        r: rows - 1,
        dc: 0,
        dr: 0,
        moveAccum: 0
      },
      enemies: (() => {
        // 보스 코어 + 기동 추격체 2개: 매 게임마다 스폰 위치와 진행 각도를 랜덤화하여 12시 일직선 50% 날먹 꼼수 차단
        const configs = [
          { isBoss: true, baseSpeed: 22.7 },
          { isBoss: false, baseSpeed: 26.9 },
          { isBoss: false, baseSpeed: 27.6 }
        ];

        // 플레이어 시작 지점(하단 중앙 c: cols/2, r: rows-1)과 최소 20칸 이상 떨어진 상/중단 3개 구역 분할 배치
        const zones = [
          { minC: cols * 0.12, maxC: cols * 0.38, minR: rows * 0.15, maxR: rows * 0.58 }, // 좌측
          { minC: cols * 0.38, maxC: cols * 0.62, minR: rows * 0.15, maxR: rows * 0.50 }, // 중앙 상단
          { minC: cols * 0.62, maxC: cols * 0.88, minR: rows * 0.15, maxR: rows * 0.58 }  // 우측
        ];
        zones.sort(() => Math.random() - 0.5);

        return configs.map((cfg, idx) => {
          const z = zones[idx];
          const c = z.minC + Math.random() * (z.maxC - z.minC);
          const r = z.minR + Math.random() * (z.maxR - z.minR);

          // 완전 수평/수직 이동으로 인한 단조로운 벽 바운스 방지 (대각 성분 보장)
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
        qixIgnoreInputUntil = performance.now() + 280; // 시작 터치 후 280ms 동안 잔여 synthetic 마우스/터치 입력 완전 무시
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
      // 게임 시작 화면(터치하여 시작)을 누르는 탭 또는 시작 직후 딜레이 동안에는 방향 전환하지 않고 제자리 대기!
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
      if (e.cancelable && e.type && e.type.startsWith('touch')) {
        e.preventDefault(); // 모바일 synthetic mouse/scroll 이벤트 원천 방지
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
      const pl = this.qixState.player;
      if (e.key === 'ArrowLeft' || e.key === 'a') { pl.dc = -1; pl.dr = 0; }
      else if (e.key === 'ArrowRight' || e.key === 'd') { pl.dc = 1; pl.dr = 0; }
      else if (e.key === 'ArrowUp' || e.key === 'w') { pl.dc = 0; pl.dr = -1; }
      else if (e.key === 'ArrowDown' || e.key === 's') { pl.dc = 0; pl.dr = 1; }
      else if (e.key === ' ' || e.key === 'Enter') { handleQixAction(); }
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

    // 3. 각 분리된 영역에 속한 적 구체 수 집계
    for (const en of st.enemies) {
      const er = Math.max(1, Math.min(rows - 2, Math.floor(en.r)));
      const ec = Math.max(1, Math.min(cols - 2, Math.floor(en.c)));
      const cid = compMap[er][ec];
      if (cid !== -1 && components[cid]) {
        components[cid].enemyCount++;
      }
    }

    // 4. 땅따먹기 핵심 룰 적용:
    // 영역이 2개 이상으로 갈라졌을 때, 적이 양쪽에 나뉘어 있더라도 반드시 한쪽(더 작은 영역들)은 100% 점령되고
    // 단 1개의 메인 미점령 영역(적이 있는 가장 큰 영역)만 남도록 보장!
    if (components.length > 0) {
      const compsWithEnemies = components.filter(comp => comp.enemyCount > 0);
      const pool = compsWithEnemies.length > 0 ? compsWithEnemies : components;
      pool.sort((a, b) => b.cells.length - a.cells.length);
      const survivorComp = pool[0];

      // 살아남은 단 1개의 영역을 제외한 모든 분할 영역을 점령지(1)로 전환!
      for (const comp of components) {
        if (comp.id !== survivorComp.id) {
          for (const [cr, cc] of comp.cells) {
            grid[cr][cc] = 1;
          }
        }
      }

      // 점령된 영역에 갇혀 있던 적 구체는 남은 미점령 영역 중심으로 재배치
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

    // 5. 그림 영역 노출도(점령률) 집계: "뒤의 그림이 다 보이게끔 뚫었는가!"
    let revealedPicCells = 0;
    for (let r = st.picMinR; r <= st.picMaxR; r++) {
      for (let c = st.picMinC; c <= st.picMaxC; c++) {
        if (grid[r][c] === 1) {
          revealedPicCells++;
        }
      }
    }
    st.revealedPicCells = revealedPicCells;
    st.pictureRevealedPct = (revealedPicCells / Math.max(1, st.totalPicCells)) * 100;

    // 전체 점령률 집계 (참고용)
    let capturedCells = 0;
    const totalInnerCells = (rows - 2) * (cols - 2);
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
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
    const dt = Math.min((now - st.lastTime) / 1000, 0.05); // 최대 50ms로 델타타임 클램핑
    st.lastTime = now;
    st.elapsed += dt;

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
          // 네모 점선 영역 전체(100%)를 모두 땅따먹었을 때만 승리!
          if (st.revealedPicCells >= st.totalPicCells || st.pictureRevealedPct >= 100) {
            this.gameState = 'WIN';
            this.audio.playSuccess();
            if (this.onWin) this.onWin();
            return;
          }
        }
      }
    }

    // 적 구체 이동 및 선(2) 충돌 검사
    // 초반에도 늘어지지 않는 빠른 기본 속도(80%)로 출발하여, 시간 경과 및 그림 점령률에 따라 최대 125%까지 가속
    const timeProgress = Math.min(1, Math.max(0, st.elapsed / 24));
    const captureProgress = Math.min(1, st.pictureRevealedPct / st.targetPct);
    const ramp = Math.max(timeProgress, captureProgress * 0.85);
    const speedMultiplier = 0.80 + 0.45 * ramp;

    for (const en of st.enemies) {
      if (!en.baseSpeed) en.baseSpeed = Math.hypot(en.vc, en.vr);

      // 고속 이동 시 선(2) 관통(터널링) 방지를 위한 서브스텝 분할 검사
      const stepDist = Math.max(Math.abs(en.vc), Math.abs(en.vr)) * speedMultiplier * dt;
      const subSteps = Math.max(1, Math.ceil(stepDist / 0.45));
      const subDt = dt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        const nextC = en.c + en.vc * speedMultiplier * subDt;
        const nextR = en.r + en.vr * speedMultiplier * subDt;
        const checkC = Math.max(0, Math.min(st.cols - 1, Math.floor(nextC)));
        const checkR = Math.max(0, Math.min(st.rows - 1, Math.floor(nextR)));

        // 적이 내 선(2)에 닿거나 선을 긋고 있는 플레이어와 부딪히면 피격!
        if (st.grid[checkR][checkC] === 2 || (st.grid[pl.r][pl.c] === 2 && Math.hypot(en.c - pl.c, en.r - pl.r) < 1.6)) {
          this._onQixPlayerHit();
          return;
        }

        let bounced = false;
        // 점령지(1) 경계 반사 시 약간의 미세 섭동으로 고착 사각 루프 방지
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

        // 반사 섭동 후에도 일정한 고유 속력 크기 유지
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

    // 2-1. 목표인 중앙 그림(아이콘) 영역 가이드라인 (점선 표시)
    const picX = st.picMinC * cellW;
    const picY = topOffset + st.picMinR * cellH;
    const picW = (st.picMaxC - st.picMinC + 1) * cellW;
    const picH = (st.picMaxR - st.picMinR + 1) * cellH;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = st.pictureRevealedPct >= 100 ? '#10b981' : 'rgba(250, 204, 21, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(picX, picY, picW, picH);
    ctx.restore();

    // 3. 적 구체 렌더링 (네온 오라 글로우 효과 추가)
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
      timeLeftSec: null,
      progressPct: st.pictureRevealedPct,
      targetPct: st.targetPct,
      labelText: `해금률 ${Math.floor(st.pictureRevealedPct)}% / 목표 100%`,
      subText: ''
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
      this._drawOverlayPrompt(ctx, '🎉 그림 해금 완료!', '우측 상단 ✕ 버튼으로 닫기');
    }

    ctx.restore();
  }
}

window.KSool.ImageMinigameSuite = ImageMinigameSuite;
