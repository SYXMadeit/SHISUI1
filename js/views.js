/* ============================================================
   石髓 SHISUI · 实时视图库
   金色描边 / 64 点波表编辑器 / 3D 波浪图 / 滤波响应曲线
   ============================================================ */
(function (root) {
  'use strict';
  const S = root.SHISUI; const UI = S.UI;

  /* ---------- 显示用金色: 三种反光程度 (像 Serum 的蓝, 靠"亮芯 + 金身 + 暗晕"三层描边在任何底上都清楚) ---------- */
  UI.GOLDS = {
    matte: { zh: '哑金', en: 'Matte', core: '#f6dc8e', body: '#d6a93a', glow: 'rgba(214,169,58,0.55)', dim: 'rgba(214,169,58,0.28)', text: 'rgba(240,210,120,0.75)', fill: 'rgba(214,169,58,0.16)' },
    bright: { zh: '亮金', en: 'Bright', core: '#fff8d6', body: '#f2c44d', glow: 'rgba(255,214,110,0.85)', dim: 'rgba(242,196,77,0.3)', text: 'rgba(255,236,170,0.85)', fill: 'rgba(242,196,77,0.18)' },
    molten: { zh: '熔金', en: 'Molten', core: '#ffefb3', body: '#ffa63a', glow: 'rgba(255,150,40,0.85)', dim: 'rgba(255,166,58,0.3)', text: 'rgba(255,220,150,0.85)', fill: 'rgba(255,166,58,0.16)' },
  };
  UI.VENOM_GOLD = { core: '#f0ffd8', body: '#8cff5a', glow: 'rgba(140,255,90,0.8)', dim: 'rgba(140,255,90,0.28)', text: 'rgba(200,255,170,0.8)', fill: 'rgba(140,255,90,0.14)' };
  UI.goldMode = 'bright';
  try { const g = localStorage.getItem('shisui.gold'); if (g && UI.GOLDS[g]) UI.goldMode = g; } catch (e) { /* ignore */ }
  UI.setGold = (m) => { if (!UI.GOLDS[m]) return; UI.goldMode = m; try { localStorage.setItem('shisui.gold', m); } catch (e) { /* ignore */ } document.body.dataset.gold = m; };
  UI.gold = (venom) => (venom ? UI.VENOM_GOLD : UI.GOLDS[UI.goldMode]);
  UI.bgFill = (venom) => (venom ? 'rgba(12,11,18,0.92)' : 'rgba(22,19,14,0.92)');
  /* 三层描边: 暗晕 → 金身(带光) → 亮芯。调用前先 beginPath 画好路径 */
  /* 轻量模式: 手机 / 弱机上不用画布阴影 (iOS 上 shadowBlur 极慢), 用一圈半透明粗线代替光晕 */
  UI.lite = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 4;
  UI.strokeNeon = (ctx, pal, w, alpha) => {
    const a = alpha == null ? 1 : alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalAlpha = a * 0.7; ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = w + 2.6; ctx.stroke();
    if (UI.lite) { ctx.globalAlpha = a * 0.35; ctx.strokeStyle = pal.glow; ctx.lineWidth = w * 2.6; ctx.stroke(); ctx.globalAlpha = a; ctx.strokeStyle = pal.body; ctx.lineWidth = w; ctx.stroke(); }
    else { ctx.globalAlpha = a; ctx.strokeStyle = pal.body; ctx.lineWidth = w; ctx.shadowColor = pal.glow; ctx.shadowBlur = w * 3; ctx.stroke(); ctx.shadowBlur = 0; }
    ctx.strokeStyle = pal.core; ctx.lineWidth = Math.max(0.8, w * 0.42); ctx.stroke(); ctx.globalAlpha = 1;
  };
  UI.canvasFont = (px) => px + 'px Silkscreen, Menlo, monospace';
  const setup = (cv) => { const ctx = cv.getContext('2d'); const dpr = devicePixelRatio > 1 ? 2 : 1; const W = cv.clientWidth * dpr, H = cv.clientHeight * dpr; if (!W) return null; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } return { ctx, dpr, W, H }; };
  UI.setupCanvas = setup;

  /* ---------- 波表数学 ---------- */
  const WT = (UI.WT = { FRAMES: 16, POINTS: 64 });
  WT.spline = (pts, N) => { const K = pts.length, out = new Float32Array(N); for (let i = 0; i < N; i++) { const x = (i / N) * K; const k = x | 0, t = x - k; const p0 = pts[(k - 1 + K) % K], p1 = pts[k % K], p2 = pts[(k + 1) % K], p3 = pts[(k + 2) % K]; out[i] = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t); } return out; };
  WT.normalize = (pts) => { let dc = 0; for (const v of pts) dc += v; dc /= pts.length; let pk = 1e-6; for (let i = 0; i < pts.length; i++) { pts[i] -= dc; pk = Math.max(pk, Math.abs(pts[i])); } for (let i = 0; i < pts.length; i++) pts[i] = pts[i] / pk * 0.95; return pts; };
  WT.smooth = (pts, passes) => { const K = pts.length; for (let p = 0; p < (passes || 1); p++) { const c = Float32Array.from(pts); for (let i = 0; i < K; i++) pts[i] = (c[(i - 1 + K) % K] + 2 * c[i] + c[(i + 1) % K]) / 4; } return pts; };
  WT.sine = (h) => { const K = WT.POINTS, o = new Float32Array(K); for (let i = 0; i < K; i++) { let v = 0; for (let k = 1; k <= (h || 1); k++) v += Math.sin(2 * Math.PI * k * i / K) / k; o[i] = v; } return WT.normalize(o); };
  WT.morph = (a, b, t) => { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] * (1 - t) + b[i] * t; return o; };
  /* 随机生成: rnd() 给 0..1 (来自 crypto / π / C-14 任一源) */
  WT.random = (kind, rnd, base) => {
    const K = WT.POINTS; const o = new Float32Array(K);
    switch (kind) {
      case 'walk': { let v = 0; for (let i = 0; i < K; i++) { v += rnd() - 0.5; o[i] = v; } let a = o[0], b = o[K - 1]; for (let i = 0; i < K; i++) o[i] -= a + (b - a) * (i / K); break; } // 随机游走, 首尾拉平
      case 'harm': { const nh = 2 + Math.floor(rnd() * 14); const amp = [], ph = []; for (let k = 0; k < nh; k++) { amp.push(rnd() * rnd() / (k + 1)); ph.push(rnd() * Math.PI * 2); } for (let i = 0; i < K; i++) { let v = 0; for (let k = 0; k < nh; k++) v += amp[k] * Math.sin(2 * Math.PI * (k + 1) * i / K + ph[k]); o[i] = v; } break; } // 随机谐波
      case 'spike': { for (let i = 0; i < K; i++) o[i] = 0; const n = 2 + Math.floor(rnd() * 7); for (let j = 0; j < n; j++) { const i = Math.floor(rnd() * K); o[i] += (rnd() - 0.5) * 2; } WT.smooth(o, 1 + Math.floor(rnd() * 3)); break; } // 衰变脉冲
      case 'fold': { const src = base || WT.sine(1); const k = 1 + rnd() * 4; for (let i = 0; i < K; i++) { let v = src[i] * k; v = ((v + 1) % 4 + 4) % 4; o[i] = v < 2 ? v - 1 : 3 - v; } break; } // 折叠已有波形
      case 'steps': { const n = 2 + Math.floor(rnd() * 10); let v = 0; for (let i = 0; i < K; i++) { if (i % Math.ceil(K / n) === 0) v = rnd() * 2 - 1; o[i] = v; } WT.smooth(o, 1); break; } // 阶梯 (像素感)
      default: { for (let i = 0; i < K; i++) o[i] = rnd() * 2 - 1; WT.smooth(o, 2); } // 纯噪
    }
    return WT.normalize(o);
  };
  /* 整张表: 4 个随机关键帧, 16 帧之间样条式过渡 → 3D 波浪一层层流动 */
  WT.randomTable = (kind, rnd, first) => {
    const keys = [first || WT.random(kind, rnd)]; for (let k = 1; k < 4; k++) keys.push(WT.random(kind, rnd, keys[k - 1]));
    const frames = []; for (let f = 0; f < WT.FRAMES; f++) { const x = (f / (WT.FRAMES - 1)) * 3; const i = Math.min(2, x | 0), t = x - i; const tt = t * t * (3 - 2 * t); frames.push(WT.morph(keys[i], keys[i + 1], tt)); }
    return frames;
  };
  WT.defaultTable = () => { const frames = []; for (let f = 0; f < WT.FRAMES; f++) frames.push(WT.sine(1 + Math.round(f * 1.5))); return frames; };
  WT.pack = (frames) => frames.map((f) => Array.from(f, (v) => Math.round(v * 1000) / 1000));
  WT.unpack = (arr) => (Array.isArray(arr) && arr.length === WT.FRAMES ? arr.map((f) => Float32Array.from(f)) : WT.defaultTable());

  /* ---------- 64 点波表编辑器: 画样条 + 控制点, 拖动即画 ---------- */
  class WaveEditor {
    constructor(canvas, opts) {
      this.cv = canvas; this.opts = opts; this.drag = false; this.lastIdx = -1;
      const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
      const paint = (e) => { const [x, y] = pos(e); const pts = this.opts.get(); if (!pts) return; const K = pts.length; const idx = Math.max(0, Math.min(K - 1, Math.floor(x * K))); const v = Math.max(-1, Math.min(1, (0.5 - y) / 0.44));
        if (this.lastIdx >= 0 && Math.abs(idx - this.lastIdx) > 1) { const a = Math.min(idx, this.lastIdx), b = Math.max(idx, this.lastIdx); const va = pts[this.lastIdx]; for (let i = a; i <= b; i++) pts[i] = va + (v - va) * ((i - this.lastIdx) / (idx - this.lastIdx)); } else pts[idx] = v;
        this.lastIdx = idx; this.opts.onChange(pts, false); };
      canvas.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; this.drag = true; this.lastIdx = -1; canvas.setPointerCapture(e.pointerId); paint(e); e.preventDefault(); });
      canvas.addEventListener('pointermove', (e) => { if (this.drag) paint(e); });
      const up = (e) => { if (!this.drag) return; this.drag = false; this.lastIdx = -1; const pts = this.opts.get(); if (pts) this.opts.onChange(pts, true); };
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('dblclick', () => { const pts = this.opts.get(); if (!pts) return; const s = WT.sine(1); for (let i = 0; i < pts.length; i++) pts[i] = s[i]; this.opts.onChange(pts, true); });
    }
    draw(venom) {
      const c = setup(this.cv); if (!c) return; const { ctx, dpr, W, H } = c; const pal = UI.gold(venom); const pts = this.opts.get(); if (!pts) return;
      ctx.fillStyle = UI.bgFill(venom); ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 1; ctx.globalAlpha = 0.5; ctx.beginPath(); for (let i = 0; i <= 8; i++) { const x = (i / 8) * W; ctx.moveTo(x, 0); ctx.lineTo(x, H); } ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.globalAlpha = 1;
      const N = 256; const sp = WT.spline(pts, N); const Y = (v) => H / 2 - Math.max(-1.05, Math.min(1.05, v)) * H * 0.44;
      ctx.beginPath(); for (let i = 0; i <= N; i++) { const x = (i / N) * W; const y = Y(sp[i % N]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.lineTo(W, H / 2); ctx.lineTo(0, H / 2); ctx.closePath(); ctx.fillStyle = pal.fill; ctx.fill();
      ctx.beginPath(); for (let i = 0; i <= N; i++) { const x = (i / N) * W; const y = Y(sp[i % N]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } UI.strokeNeon(ctx, pal, 1.8 * dpr);
      ctx.fillStyle = pal.core; const K = pts.length; for (let i = 0; i < K; i++) { const x = ((i + 0.5) / K) * W; ctx.beginPath(); ctx.arc(x, Y(pts[i]), 1.3 * dpr, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = pal.text; ctx.font = UI.canvasFont(8 * dpr); ctx.fillText(this.opts.label ? this.opts.label() : '', 6 * dpr, H - 5 * dpr);
    }
  }
  UI.WaveEditor = WaveEditor;

  /* ---------- 3D 波浪图: 16 帧由远到近叠放, 当前帧(可被调制)高亮 ---------- */
  class Wave3D {
    constructor(canvas, get) { this.cv = canvas; this.get = get; this.cache = null; this.cacheKey = ''; this.onPick = null;
      canvas.addEventListener('pointerdown', (e) => { if (!this.onPick) return; const r = canvas.getBoundingClientRect(); const y = (e.clientY - r.top) / r.height; this.onPick(Math.max(0, Math.min(1, 1 - (y - 0.1) / 0.8))); });
    }
    draw(venom) {
      const c = setup(this.cv); if (!c) return; const { ctx, dpr, W, H } = c; const pal = UI.gold(venom); const st = this.get(); const frames = st.frames; const n = frames.length;
      ctx.fillStyle = UI.bgFill(venom); ctx.fillRect(0, 0, W, H);
      const key = st.rev; if (this.cacheKey !== key) { this.cache = frames.map((f) => WT.spline(f, 96)); this.cacheKey = key; }
      const sp = this.cache; const N = 96; const depthX = W * 0.26, depthY = H * 0.66; const x0 = W * 0.04, w0 = W * 0.68; const amp = H * 0.13;
      const pos = Math.max(0, Math.min(1, st.pos)) * (n - 1); const fi = pos | 0, fr = pos - fi; const fj = Math.min(n - 1, fi + 1);
      for (let f = n - 1; f >= 0; f--) {
        const d = f / (n - 1); const ox = x0 + depthX * d, oy = H * 0.86 - depthY * d; const near = 1 - Math.abs(f - pos) / 1.5; const hot = near > 0 ? near : 0;
        ctx.beginPath(); for (let i = 0; i <= N; i++) { const x = ox + (i / N) * w0; const y = oy - sp[f][i % N] * amp; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        if (hot > 0.01) UI.strokeNeon(ctx, pal, (0.8 + 1.4 * hot) * dpr, 0.45 + 0.55 * hot);
        else { ctx.strokeStyle = pal.dim; ctx.lineWidth = 0.8 * dpr; ctx.globalAlpha = 0.5 + 0.5 * (1 - d); ctx.stroke(); ctx.globalAlpha = 1; }
      }
      // 插值出的当前帧: 实际在发声的波形
      const ox = x0 + depthX * (pos / (n - 1)), oy = H * 0.86 - depthY * (pos / (n - 1));
      ctx.beginPath(); for (let i = 0; i <= N; i++) { const v = sp[fi][i % N] * (1 - fr) + sp[fj][i % N] * fr; const x = ox + (i / N) * w0, y = oy - v * amp; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } UI.strokeNeon(ctx, pal, 2 * dpr, 1);
      ctx.fillStyle = pal.text; ctx.font = UI.canvasFont(8 * dpr); ctx.fillText('F ' + (pos + 1).toFixed(1) + ' / ' + n, 6 * dpr, H - 5 * dpr);
    }
  }
  UI.Wave3D = Wave3D;

  /* ---------- 滤波响应曲线 (按 Web Audio BiquadFilter 公式; 低/高通的 Q 为 dB) ---------- */
  class FilterView {
    constructor(canvas, get) { this.cv = canvas; this.get = get; this.freqs = null; }
    response(type, fc, Q, sr, w) {
      const w0 = 2 * Math.PI * Math.min(fc, sr * 0.499) / sr; const cs = Math.cos(w0), sn = Math.sin(w0); let b0, b1, b2, a0, a1, a2;
      if (type === 'bandpass') { const al = sn / (2 * Math.max(0.01, Q)); b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
      else { const al = sn / (2 * Math.pow(10, Q / 20)); a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; if (type === 'highpass') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } }
      const c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
      const nr = b0 + b1 * c1 + b2 * c2, ni = -(b1 * s1 + b2 * s2), dr = a0 + a1 * c1 + a2 * c2, di = -(a1 * s1 + a2 * s2);
      return Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
    }
    draw(venom) {
      const c = setup(this.cv); if (!c) return; const { ctx, dpr, W, H } = c; const pal = UI.gold(venom); const st = this.get(); const sr = st.sr || 48000;
      ctx.fillStyle = UI.bgFill(venom); ctx.fillRect(0, 0, W, H);
      const fmin = 30, fmax = 18000; const X = (f) => (Math.log(f / fmin) / Math.log(fmax / fmin)) * W; const Y = (db) => H * 0.78 - (db / 60) * H * 0.78;
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 1; ctx.globalAlpha = 0.45; ctx.beginPath(); for (const f of [100, 1000, 10000]) { ctx.moveTo(X(f), 0); ctx.lineTo(X(f), H); } ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke(); ctx.globalAlpha = 1;
      const fc = Math.max(20, Math.min(20000, st.cutoff + (st.lfoDepth || 0) * 3600 * Math.sin(2 * Math.PI * (st.lfoPhase || 0))));
      const N = 72; const pts = [];
      for (let i = 0; i <= N; i++) { const f = fmin * Math.pow(fmax / fmin, i / N); const mag = this.response(st.type, fc, st.res, sr, 2 * Math.PI * f / sr); const db = Math.max(-40, Math.min(26, 20 * Math.log10(mag + 1e-9))); pts.push([X(f), Y(db)]); }
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = pal.fill; ctx.fill();
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); UI.strokeNeon(ctx, pal, 1.8 * dpr);
      const xc = X(fc); ctx.strokeStyle = pal.core; ctx.globalAlpha = 0.55; ctx.setLineDash([3 * dpr, 3 * dpr]); ctx.beginPath(); ctx.moveTo(xc, 0); ctx.lineTo(xc, H); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = pal.text; ctx.font = UI.canvasFont(8 * dpr); ctx.fillText((fc >= 1000 ? (fc / 1000).toFixed(2) + 'k' : Math.round(fc)) + ' Hz · ' + st.type, 6 * dpr, H - 5 * dpr);
    }
  }
  UI.FilterView = FilterView;
})(window);
