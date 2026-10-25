/* ============================================================
   石髓 SHISUI · 指路 Guide
   从你弹的音推测调式（大调 / 小调 / 宫商角徵羽），识别当前和弦，
   推荐下一个音、配什么和弦、一轮之后走向哪里。纯音乐理论，不联网。
   ============================================================ */
(function (root) {
  'use strict';
  const S = root.SHISUI;
  const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  /* 五声调式: 名称, 相对根音的音程, 模板权重 (根 / 五度 重) */
  const PENTA = { gong: { zh: '宫', iv: [0, 2, 4, 7, 9] }, shang: { zh: '商', iv: [0, 2, 5, 7, 10] }, jue: { zh: '角', iv: [0, 3, 5, 8, 10] }, zhi: { zh: '徵', iv: [0, 2, 5, 7, 9] }, yu: { zh: '羽', iv: [0, 3, 5, 7, 10] } };
  const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
  const ROMAN_MAJ = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], ROMAN_MIN = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
  const QUAL = { major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'], minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'] };
  const TRI = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], sus2: [0, 2, 7], sus4: [0, 5, 7] };
  const NEXT_MAJ = { 0: [3, 4, 5, 1], 1: [4, 3, 6], 2: [5, 3], 3: [4, 0, 1], 4: [0, 5, 3], 5: [3, 1, 4], 6: [0] };
  const NEXT_MIN = { 0: [3, 5, 6, 4], 1: [4, 0], 2: [5, 3], 3: [4, 0, 6], 4: [0, 5], 5: [2, 3, 6], 6: [2, 0] };
  /* 五声和弦 (都落在五声音阶内): 宫 I, 羽 vi, 商 sus2, 徵 sus4 */
  const PENTA_CHORDS = [{ zh: '宫', deg: 0, iv: [0, 4, 7] }, { zh: '羽', deg: 5, iv: [9, 12, 16] }, { zh: '商', deg: 1, iv: [2, 4, 9] }, { zh: '徵', deg: 4, iv: [7, 12, 14] }];
  const NEXT_PENTA = { 0: [1, 3, 2], 1: [0, 2, 3], 2: [3, 0], 3: [0, 1] };
  /* 走向标签按目标和弦的功能: 主 → 回家, 属 → 拉紧, 下属 → 铺垫, 其余 → 绕开 */
  const ROLE_DEG = { 0: '回家', 4: '拉紧', 6: '拉紧', 3: '铺垫', 1: '铺垫', 5: '绕开', 2: '绕开' };
  const ROLE_PENTA = { 0: '回家', 3: '拉紧', 2: '铺垫', 1: '绕开' };
  const PROB = [0.45, 0.3, 0.17, 0.08]; // 走向表的权重: 第一候选最可能

  const corr = (a, b) => { let ma = 0, mb = 0; for (let i = 0; i < 12; i++) { ma += a[i]; mb += b[i]; } ma /= 12; mb /= 12; let n = 0, da = 0, db = 0; for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return da && db ? n / Math.sqrt(da * db) : 0; };
  const rot = (prof, r) => { const o = new Array(12); for (let i = 0; i < 12; i++) o[(i + r) % 12] = prof[i]; return o; };

  class Guide {
    constructor() { this.hist = new Float32Array(12); this.recent = []; this.lastT = 0; this.key = null; this.chord = null; this.chordHist = []; this.held = new Set(); this.guofeng = true; this.dirty = true; this.lastNote = null; this.contour = []; this.total = 0; }
    reset() { this.hist.fill(0); this.recent = []; this.key = null; this.chord = null; this.chordHist = []; this.lastNote = null; this.contour = []; this.total = 0; this.dirty = true; }
    feed(note, vel, t) {
      const dt = this.lastT ? t - this.lastT : 0; this.lastT = t; const decay = Math.exp(-dt / 9); for (let i = 0; i < 12; i++) this.hist[i] *= decay;
      this.hist[note % 12] += 0.6 + 0.4 * (vel || 0.8); this.total++;
      if (this.lastNote != null) { this.contour.push(Math.sign(note - this.lastNote)); if (this.contour.length > 4) this.contour.shift(); }
      this.lastNote = note; this.recent.push({ n: note, t }); this.recent = this.recent.filter((r) => t - r.t < 0.7); this.held.add(note); this.dirty = true;
    }
    release(note) { this.held.delete(note); }
    /* ---- 调式 ---- */
    detectKey() {
      if (this.total < 3) return null;
      let best = null;
      for (let r = 0; r < 12; r++) {
        const cm = corr(this.hist, rot(MAJOR, r)), cn = corr(this.hist, rot(MINOR, r));
        if (!best || cm > best.score) best = { root: r, mode: 'major', score: cm };
        if (cn > best.score) best = { root: r, mode: 'minor', score: cn };
      }
      /* 五声: 只有当用到的音基本都在五声内才取 */
      let used = 0, pcs = []; for (let i = 0; i < 12; i++) if (this.hist[i] > 0.05 * Math.max(...this.hist)) { used++; pcs.push(i); }
      if (used <= 6) {
        for (const id in PENTA) for (let r = 0; r < 12; r++) {
          const set = new Set(PENTA[id].iv.map((x) => (x + r) % 12)); const inside = pcs.filter((p) => set.has(p)).length;
          if (inside < pcs.length) continue; const tmpl = new Array(12).fill(0); PENTA[id].iv.forEach((x, j) => { tmpl[(x + r) % 12] = j === 0 ? 5 : x === 7 ? 4 : 3; });
          const sc = corr(this.hist, tmpl) + (this.guofeng ? 0.08 : -0.02);
          if (sc > best.score) best = { root: r, mode: 'penta', penta: id, score: sc };
        }
      }
      return best;
    }
    scaleOf(key) { if (!key) return SCALE.major; if (key.mode === 'penta') return PENTA[key.penta].iv; return SCALE[key.mode]; }
    keyName(key) { if (!key) return ''; if (key.mode === 'penta') return NAMES[key.root] + ' ' + PENTA[key.penta].zh + '调'; return NAMES[key.root] + (key.mode === 'major' ? ' 大调' : ' 小调'); }
    keyNameEn(key) { if (!key) return ''; if (key.mode === 'penta') return NAMES[key.root] + ' ' + key.penta + ' (pentatonic)'; return NAMES[key.root] + (key.mode === 'major' ? ' major' : ' minor'); }
    /* ---- 当前和弦: 按住的音 + 0.7 秒内的音 ---- */
    detectChord(key) {
      const pcs = new Set(); for (const n of this.held) pcs.add(n % 12); for (const r of this.recent) pcs.add(r.n % 12);
      if (pcs.size < 2) return this.chord && this.chord.key === this.keyName(key) ? this.chord : null;
      let best = null;
      for (let r = 0; r < 12; r++) for (const q in TRI) { const set = TRI[q].map((x) => (x + r) % 12); let hit = 0; for (const p of pcs) if (set.includes(p)) hit++; const miss = pcs.size - hit; const sc = hit * 2 - miss * 1.2 + (set[0] === [...pcs][0] ? 0.3 : 0); if (!best || sc > best.sc) best = { root: r, q, sc }; }
      if (!best || best.sc < 2.5) return null;
      const deg = key ? this.scaleOf(key).indexOf((best.root - key.root + 12) % 12) : -1;
      const name = NAMES[best.root] + (best.q === 'maj' ? '' : best.q === 'min' ? 'm' : best.q);
      const roman = key && deg >= 0 ? (key.mode === 'minor' ? ROMAN_MIN[deg] : key.mode === 'major' ? ROMAN_MAJ[deg] : ['宫', '商', '角', '徵', '羽'][deg]) : '';
      return { root: best.root, q: best.q, deg, name, roman, key: this.keyName(key) };
    }
    /* ---- 推荐下一个音 ---- */
    nextNotes(key, chord) {
      const last = this.lastNote; if (last == null || !key) return [];
      const sc = this.scaleOf(key); const chordPcs = chord ? TRI[chord.q].map((x) => (x + chord.root) % 12) : []; const penta = key.mode === 'penta' ? sc.map((x) => (x + key.root) % 12) : PENTA.gong.iv.map((x) => (x + key.root) % 12);
      const up = this.contour.filter((c) => c > 0).length, down = this.contour.filter((c) => c < 0).length; const out = [];
      for (let n = last - 9; n <= last + 12; n++) {
        const pc = (n - key.root + 12) % 12; if (!sc.includes(pc)) continue; const d = n - last; if (d === 0) continue;
        let w = 1; const ad = Math.abs(d);
        if (chordPcs.includes(n % 12)) w += 1.1; if (ad <= 2) w += 0.9; else if ([3, 4, 5, 7].includes(ad)) w += 0.5; else if (ad === 12) w += 0.3; else w -= 0.3;
        if (penta.includes(n % 12)) w += this.guofeng ? 0.5 : 0.15;
        if (key.mode === 'major' && (last - key.root + 12) % 12 === 11 && pc === 0 && d === 1) w += 1.5; // 导音回主音
        if (key.mode !== 'penta' && (last - key.root + 12) % 12 === 5 && pc === 4 && d === -1) w += 0.6;  // 四级落三级
        if (up >= 3 && d > 0) w -= 0.5; if (down >= 3 && d < 0) w -= 0.5;
        if (pc === 0 && ad >= 5) w += 0.3;
        const why = pc === 0 ? '回主音' : ad <= 2 ? (d > 0 ? '级进上' : '级进下') : ad === 12 ? '八度' : ad === 7 ? '五度' : ad === 5 ? '四度' : ad <= 4 ? '三度' : '跳进';
        out.push({ n, w, why });
      }
      out.sort((a, b) => b.w - a.w); const picked = []; for (const o of out) { if (picked.length >= 3) break; if (picked.some((p) => p.n % 12 === o.n % 12)) continue; picked.push(o); }
      return picked;
    }
    /* ---- 推荐和弦 (当前和弦之后去哪) ---- */
    nextChords(key, chord) {
      if (!key) return []; const base = 48 + key.root; const out = [];
      if (key.mode === 'penta') {
        const cur = chord && chord.deg >= 0 ? PENTA_CHORDS.findIndex((c) => c.deg === chord.deg) : -1; const order = cur >= 0 ? NEXT_PENTA[cur] : [0, 1, 3];
        order.forEach((i, j) => { const c = PENTA_CHORDS[i]; out.push({ zh: c.zh, roman: c.zh, name: NAMES[(key.root + c.iv[0]) % 12] + (i === 1 ? 'm' : i === 2 ? 'sus2' : i === 3 ? 'sus4' : ''), notes: c.iv.map((x) => base + x), role: cur < 0 ? '' : (ROLE_PENTA[i] || ''), p: PROB[Math.min(j, 3)] }); });
        return out;
      }
      const roman = key.mode === 'minor' ? ROMAN_MIN : ROMAN_MAJ, table = key.mode === 'minor' ? NEXT_MIN : NEXT_MAJ, sc = SCALE[key.mode];
      const cur = chord && chord.deg >= 0 ? chord.deg : -1; const order = cur >= 0 ? table[cur] : (key.mode === 'minor' ? [0, 5, 3] : [0, 3, 4]);
      order.slice(0, 3).forEach((deg, j) => { let q = QUAL[key.mode][deg]; if (key.mode === 'minor' && deg === 4) q = 'maj'; const r = sc[deg]; out.push({ zh: roman[deg], roman: roman[deg], name: NAMES[(key.root + r) % 12] + (q === 'min' ? 'm' : q === 'dim' ? '°' : ''), notes: TRI[q].map((x) => base + r + x), role: cur < 0 ? '' : (ROLE_DEG[deg] || ''), p: PROB[Math.min(j, 3)] }); });
      return out;
    }
    /* ---- 一键和声: 给旋律音配一个和弦。候选 = 含这个音的调内和弦; 权重 = 走向表概率 × 旋律音在和弦里的角色 × 乐句位置; 声部放旋律下方一个八度内 + 低八度根音 ---- */
    harmonize(note) {
      const key = this.key || this.detectKey() || { root: note % 12, mode: 'penta', penta: 'gong', score: 0 }; const mpc = note % 12; const prev = this.chord; const cands = [];
      const phraseEnd = this.chordHist.length % 4 === 3;
      if (key.mode === 'penta') {
        const curI = prev && prev.deg >= 0 ? PENTA_CHORDS.findIndex((c) => c.deg === prev.deg) : -1; const order = curI >= 0 ? NEXT_PENTA[curI] : [0, 1, 3, 2];
        PENTA_CHORDS.forEach((c, i) => { const pcs = c.iv.map((x) => (x + key.root) % 12); const role = pcs.indexOf(mpc); if (role < 0) return; const rank = order.indexOf(i); let w = rank < 0 ? 0.06 : PROB[Math.min(rank, 3)]; if (curI === i) w *= 0.7; w *= role === 0 ? 1 : role === 1 ? 1.1 : 0.9; if (phraseEnd && i === 0) w *= 1.3;
          cands.push({ w, root: pcs[0], q: i === 1 ? 'min' : i === 2 ? 'sus2' : i === 3 ? 'sus4' : 'maj', deg: c.deg, roman: c.zh, name: NAMES[pcs[0]] + (i === 1 ? 'm' : i === 2 ? 'sus2' : i === 3 ? 'sus4' : ''), pcs }); });
      } else {
        const sc = SCALE[key.mode], roman = key.mode === 'minor' ? ROMAN_MIN : ROMAN_MAJ, table = key.mode === 'minor' ? NEXT_MIN : NEXT_MAJ;
        const cur = prev && prev.deg >= 0 ? prev.deg : -1; const order = cur >= 0 ? table[cur] : (key.mode === 'minor' ? [0, 5, 3, 6] : [0, 3, 4, 5]);
        for (let deg = 0; deg < 7; deg++) { let q = QUAL[key.mode][deg]; if (key.mode === 'minor' && deg === 4) q = 'maj'; const r = sc[deg]; const pcs = TRI[q].map((x) => (r + x + key.root) % 12); const role = pcs.indexOf(mpc); if (role < 0) continue;
          const rank = order.indexOf(deg); let w = rank < 0 ? 0.06 : PROB[Math.min(rank, 3)]; if (cur === deg) w *= 0.75; if (deg === 6) w *= 0.6; w *= role === 0 ? 1 : role === 1 ? 1.12 : 0.92; if (phraseEnd && (deg === 0 || deg === 4)) w *= 1.3;
          cands.push({ w, root: pcs[0], q, deg, roman: roman[deg], name: NAMES[pcs[0]] + (q === 'min' ? 'm' : q === 'dim' ? '°' : ''), pcs }); }
      }
      if (!cands.length) return null; cands.sort((a, b) => b.w - a.w); const best = cands[0];
      const notes = []; for (const p of best.pcs) { if (p === mpc) continue; let n = note - 1; while (((n % 12) + 12) % 12 !== p) n--; if (n > note - 13) notes.push(n); }
      let bass = note - 13; while (((bass % 12) + 12) % 12 !== best.root) bass--; if (bass >= 28) notes.push(bass);
      const chord = { root: best.root, q: best.q, deg: best.deg, name: best.name, roman: best.roman, key: this.keyName(key) };
      this.chord = chord; this.pushChord(chord); this.dirty = true; const tot = cands.reduce((a, c) => a + c.w, 0);
      return { chord, notes, p: best.w / tot, alts: cands.slice(1, 3).map((c) => ({ roman: c.roman, name: c.name, p: c.w / tot })) };
    }
    /* ---- 一轮走向: 记录和弦历史, 四个一轮 ---- */
    pushChord(c) { const last = this.chordHist[this.chordHist.length - 1]; if (!last || last.root !== c.root || last.q !== c.q) { this.chordHist.push(c); if (this.chordHist.length > 8) this.chordHist.shift(); } }
    progression() { return this.chordHist.slice(-4).map((c) => c.roman || c.name).join(' → '); }
    analyse() {
      const key = this.detectKey(); this.key = key; const chord = this.detectChord(key); if (chord) { this.chord = chord; this.pushChord(chord); }
      const roundDone = this.chordHist.length >= 4 && (this.chordHist.length % 4 === 0);
      return { key, keyName: this.keyName(key), keyNameEn: this.keyNameEn(key), chord: this.chord, notes: this.nextNotes(key, this.chord), chords: this.nextChords(key, this.chord), progression: this.progression(), roundDone };
    }
  }
  S.Guide = Guide; S.NOTE_NAMES = NAMES;
})(window);
