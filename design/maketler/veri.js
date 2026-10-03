// HoopLab Faz 0.5 maketleri: ortak SENTETİK veri ve küçük yardımcılar.
// Buradaki hiçbir sayı gerçek bir ölçüm değildir. Eşikler ve metinler yalnız görsel karşılaştırma içindir;
// gerçek eşikler research/rules içinde kaynaklı olarak tanımlanacak.
(function () {
  const BAND = { lo: 62, hi: 76 };
  const BASE = [70, 72, 69, 74, 71, 68, 73, 75, 71, 69, 72, 74, 70, 73];
  const TAILS = {
    yesil: [71, 72, 69, 73, 70, 72, 71],
    sari: [66, 63, 61, 58, 56, 55, 57],
    kirmizi: [62, 57, 53, 50, 48, 47, 49],
  };

  const COMMON = {
    date: 'Cuma, 16 Ekim',
    dateShort: '16 EKİM CUMA',
    next: 'Yarın maç · 19:00 · deplasman',
    nextShort: 'YARIN MAÇ 19:00',
  };

  const STATES = {
    yesil: {
      label: 'Hazır',
      headline: 'Bugün planlanan yük uygun.',
      reason: 'HRV ve dinlenik nabız kendi bandında, uyku yeterli.',
      advice: 'Planlanan antrenmanı yapabilirsin. Yarınki maç için bu gece uykuyu öne çek.',
      rhr: '48', rhrNote: 'bandında', sleep: '7:52', sleepNote: '7 gece ort. 7:40',
      resp: '14,6', respNote: 'bandında',
      off: {},
      chips: ['HRV bandında', 'Uyku yeterli'],
      tendon: [['Patellar tendon', 1, 'Düşük'], ['Aşil tendonu', 1, 'Düşük'], ['Quadriceps', 1, 'Düşük'], ['Hamstring', 0, 'Çok düşük']],
    },
    sari: {
      label: 'Kontrollü',
      headline: 'Bugün kontrollü yükle.',
      reason: 'HRV 3 gündür kendi bandının altında, uyku iki gecedir kısa.',
      advice: 'Sıçrama hacmini azalt, şut ve mobiliteye ağırlık ver. Bu gece 8 saati hedefle.',
      rhr: '51', rhrNote: 'bandında', sleep: '6:05', sleepNote: '7 gece ort. 6:40',
      resp: '14,8', respNote: 'bandında',
      off: { hrv: true, sleep: true },
      chips: ['HRV düşük', 'Uyku kısa'],
      tendon: [['Patellar tendon', 3, 'Yüksek'], ['Aşil tendonu', 2, 'Orta'], ['Quadriceps', 2, 'Orta'], ['Hamstring', 1, 'Düşük']],
    },
    kirmizi: {
      label: 'Toparlan',
      headline: 'Bugün toparlanmaya öncelik ver.',
      reason: 'HRV belirgin düşük, dinlenik nabız ve solunum hızı bandının üstünde.',
      advice: 'Yüksek yoğunluk yerine hafif seans ya da dinlenme. Belirtiler sürerse sağlık ekibine haber ver.',
      rhr: '57', rhrNote: 'bandın üstünde', sleep: '5:20', sleepNote: '7 gece ort. 6:02',
      resp: '16,1', respNote: 'bandın üstünde',
      off: { hrv: true, rhr: true, sleep: true, resp: true },
      chips: ['HRV çok düşük', 'Nabız yüksek', 'Solunum yüksek'],
      tendon: [['Patellar tendon', 3, 'Yüksek'], ['Aşil tendonu', 3, 'Yüksek'], ['Quadriceps', 2, 'Orta'], ['Hamstring', 2, 'Orta']],
    },
  };

  const RPE_LABELS = ['Dinlenme', 'Çok çok kolay', 'Kolay', 'Orta', 'Biraz zor', 'Zor', 'Zor', 'Çok zor', 'Çok zor', 'Çok zor', 'Maksimal'];

  function series(state) { return BASE.concat(TAILS[state]); }
  function avg7(arr) {
    return arr.map((_, i) => {
      const w = arr.slice(Math.max(0, i - 6), i + 1);
      return w.reduce((a, b) => a + b, 0) / w.length;
    });
  }

  function data(state) {
    const s = series(state);
    const a = avg7(s);
    const hrv = Math.round(a[a.length - 1]);
    return Object.assign({}, COMMON, STATES[state], {
      state,
      hrv: String(hrv),
      hrvToday: String(s[s.length - 1]),
      hrvNote: hrv < BAND.lo ? 'bandın altında' : hrv > BAND.hi ? 'bandın üstünde' : 'bandında',
      band: BAND.lo + '–' + BAND.hi,
    });
  }

  // Grafik geometrisi: her tasarım kendi SVG'sini çizer, koordinatları buradan alır.
  function chart(state, o) {
    const s = series(state), a = avg7(s);
    const min = o.min ?? 40, max = o.max ?? 82;
    const x = (i) => o.px + (i * (o.w - o.px * 2)) / (s.length - 1);
    const y = (v) => o.py + ((max - v) * (o.h - o.py * 2)) / (max - min);
    const path = (arr) => arr.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    return {
      dots: s.map((v, i) => ({ x: x(i), y: y(v), v })),
      avgPath: path(a),
      rawPath: path(s),
      areaPath: path(a) + ` L${x(s.length - 1).toFixed(1)} ${o.h} L${x(0).toFixed(1)} ${o.h} Z`,
      bandTop: y(BAND.hi), bandBot: y(BAND.lo),
      last: { x: x(s.length - 1), y: y(a[a.length - 1]) },
      lastRaw: { x: x(s.length - 1), y: y(s[s.length - 1]) },
      x, y,
    };
  }

  const ICONS = {
    today: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    trend: '<path d="M3 17l5.5-5.5 4 4L21 7"/><path d="M15 7h6v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    coach: '<path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/><path d="M8.5 10.5h7"/>',
    me: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.2-3.9 4-5.6 7.5-5.6s6.3 1.7 7.5 5.6"/>',
    minus: '<path d="M5 12h14"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
  };
  function icon(name, cls) {
    return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  }

  // iPhone çerçevesi: durum çubuğu, Dynamic Island, ana ekran çizgisi.
  function frame() {
    document.querySelectorAll('.device').forEach((d) => {
      d.insertAdjacentHTML('afterbegin',
        '<div class="statusbar"><span class="sb-time">9:41</span><span class="sb-icons">' +
        '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
        '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.4 0 4.6.9 6.2 2.5l1.2-1.2A10.4 10.4 0 0 0 8 .5 10.4 10.4 0 0 0 .6 3.5l1.2 1.2A8.7 8.7 0 0 1 8 2.2zm0 3.4c1.5 0 2.9.6 3.9 1.6l1.2-1.2A7.2 7.2 0 0 0 8 3.9 7.2 7.2 0 0 0 2.9 6l1.2 1.2c1-1 2.4-1.6 3.9-1.6zm0 3.4c.6 0 1.2.2 1.6.7L8 11.3 6.4 9.7c.4-.5 1-.7 1.6-.7z"/></svg>' +
        '<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.8" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".45"/></svg>' +
        '</span></div><div class="sb-bg"></div><div class="island"></div>');
      d.insertAdjacentHTML('beforeend', '<div class="home-ind"></div>');
    });
  }

  const hooks = [];
  function apply(state) {
    const d = data(state);
    document.documentElement.dataset.state = state;
    document.querySelectorAll('[data-k]').forEach((el) => { el.textContent = d[el.dataset.k] ?? ''; });
    document.querySelectorAll('[data-off]').forEach((el) => { el.classList.toggle('off', !!d.off[el.dataset.off]); });
    document.querySelectorAll('[data-set-state]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setState === state)));
    hooks.forEach((fn) => fn(d));
    try { history.replaceState(null, '', '#' + state); } catch (e) { /* file:// ortamında yok sayılır */ }
  }

  // Tema: 'sistem' | 'acik' | 'koyu'. Sistem, cihazın (maket sayfasında tarayıcının) tercihini izler.
  // Çözülen tema <html data-tema="acik|koyu"> olarak yazılır; data-theme özniteliği barındırıcıya bırakılır.
  let themeMode = 'sistem';
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function resolveTheme() {
    if (themeMode !== 'sistem') return themeMode;
    const host = document.documentElement.getAttribute('data-theme');
    if (host === 'dark') return 'koyu';
    if (host === 'light') return 'acik';
    return mq && mq.matches ? 'koyu' : 'acik';
  }
  function theme(mode) {
    if (mode) themeMode = mode;
    const root = document.documentElement;
    root.dataset.tema = resolveTheme();
    root.dataset.temaSecim = themeMode;
    document.querySelectorAll('[data-set-theme]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setTheme === themeMode)));
    if (mode) { try { localStorage.setItem('hl-tema', themeMode); } catch (e) { /* depolama yoksa yok sayılır */ } }
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => theme());
  new MutationObserver(() => theme()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Basit form etkileşimi: tekli seçim, çoklu seçim, adım düğmeleri, seans yükü.
  const form = { rpe: 7, dur: 95 };
  function renderForm() {
    const set = (k, v) => document.querySelectorAll(`[data-out="${k}"]`).forEach((el) => { el.textContent = v; });
    set('rpe', form.rpe); set('dur', form.dur); set('load', form.rpe * form.dur); set('rpeLabel', RPE_LABELS[form.rpe]);
    document.querySelectorAll('[data-fill="rpe"]').forEach((el) => el.style.setProperty('--p', form.rpe / 10));
  }
  document.addEventListener('click', (e) => {
    const themeBtn = e.target.closest('[data-set-theme]');
    if (themeBtn) { theme(themeBtn.dataset.setTheme); return; }
    const stateBtn = e.target.closest('[data-set-state]');
    if (stateBtn) { apply(stateBtn.dataset.setState); return; }
    const step = e.target.closest('[data-step]');
    if (step) {
      const k = step.dataset.step;
      form[k] = Math.min(240, Math.max(5, form[k] + Number(step.dataset.d)));
      renderForm(); return;
    }
    const opt = e.target.closest('[data-pick] > [data-v], [data-multi] > [data-v]');
    if (!opt) return;
    const group = opt.parentElement;
    if (group.hasAttribute('data-multi')) { opt.classList.toggle('on'); return; }
    group.querySelectorAll(':scope > [data-v]').forEach((c) => c.classList.toggle('on', c === opt));
    const k = group.dataset.pick;
    if (k in form) { form[k] = Number(opt.dataset.v); renderForm(); }
  });

  window.HL = {
    data, chart, icon, frame, apply, renderForm, theme,
    onApply: (fn) => hooks.push(fn),
    start() {
      let saved = null;
      try { saved = localStorage.getItem('hl-tema'); } catch (e) { /* depolama yoksa yok sayılır */ }
      theme(['sistem', 'acik', 'koyu'].includes(saved) ? saved : 'sistem');
      frame();
      document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
      const h = (location.hash || '').slice(1);
      apply(STATES[h] ? h : 'sari');
      renderForm();
    },
  };
})();
