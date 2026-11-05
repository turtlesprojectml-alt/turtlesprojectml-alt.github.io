(function () {
  'use strict';

  var root = document.documentElement;

  /* ------------------------------------------------------------
     Theme toggle (persists per viewer; falls back to OS setting)
     ------------------------------------------------------------ */
  var toggle = document.querySelector('.theme-toggle');
  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mql && mql.matches ? 'dark' : 'light';
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('turtles-theme', next); } catch (e) {}
    });
  }

  /* ------------------------------------------------------------
     Scroll-spy for the top navigation
     ------------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topnav-links a'));
  var spyTargets = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && spyTargets.length) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var current = null;
      for (var i = 0; i < spyTargets.length; i++) {
        if (visible[spyTargets[i].id]) { current = spyTargets[i].id; break; }
      }
      navLinks.forEach(function (a) {
        a.classList.toggle('active', current && a.getAttribute('href') === '#' + current);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach(function (t) { spy.observe(t); });
  }

  /* ------------------------------------------------------------
     Videos: play only while on screen (saves bandwidth and CPU)
     ------------------------------------------------------------ */
  var vids = document.querySelectorAll('video[data-inview]');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { vio.observe(v); });
  } else {
    vids.forEach(function (v) { v.autoplay = true; v.play(); });
  }

  /* ------------------------------------------------------------
     Tabs (case explorer)
     ------------------------------------------------------------ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));

  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

  /* ------------------------------------------------------------
     mini-TurtLES subset picker (sizes from the paper)
     ------------------------------------------------------------ */
  var SIZES = {
    G4: { T100: '3.5 TB', T200: '7.0 TB', T300: '10.5 TB', T400: '14 TB' },
    G3: { T100: '2.6 TB', T200: '5.1 TB', T300: '7.7 TB', T400: '10.2 TB' },
    G2: { T100: '1.8 TB', T200: '3.6 TB', T300: '5.3 TB', T400: '7.1 TB' },
    G1: { T100: '0.8 TB', T200: '1.6 TB', T300: '2.4 TB', T400: '3.3 TB' }
  };
  var FAMILIES = { G4: 4, G3: 3, G2: 2, G1: 1 };
  var picker = document.getElementById('picker');

  function updatePicker() {
    var g = picker.querySelector('input[name="geo"]:checked').value;
    var t = picker.querySelector('input[name="time"]:checked').value;
    document.getElementById('picker-name').textContent = g + '-' + t;
    document.getElementById('picker-size').textContent = '≈ ' + SIZES[g][t];
    document.getElementById('picker-detail').textContent =
      (FAMILIES[g] * 100) + ' trajectories × ' + t.slice(1) + ' snapshots';
  }

  if (picker) {
    picker.addEventListener('change', updatePicker);
    updatePicker();
  }

  /* ------------------------------------------------------------
     Copy-to-clipboard
     ------------------------------------------------------------ */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.querySelector(btn.getAttribute('data-copy'));
      if (!src) return;
      var text = src.innerText;
      var done = function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* ------------------------------------------------------------
     Lightbox for figures
     ------------------------------------------------------------ */
  var lb = document.getElementById('lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('img.zoomable').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lb.showModal();
      });
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) lb.close();
    });
  }

  /* ------------------------------------------------------------
     Charts (inline SVG, hover tooltips)
     ------------------------------------------------------------ */
  var NS = 'http://www.w3.org/2000/svg';
  var tip = document.getElementById('chart-tip');

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function txt(parent, x, y, s, attrs) {
    var t = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }

  function showTip(html, cx, cy) {
    tip.innerHTML = html;
    tip.hidden = false;
    var r = tip.getBoundingClientRect();
    var x = cx + 14, y = cy + 14;
    if (x + r.width > window.innerWidth - 8) x = cx - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = cy - r.height - 14;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }

  function hideTip() { tip.hidden = true; }

  function fmt(v) {
    if (v >= 10) return v.toFixed(1);
    if (v >= 1) return v.toFixed(2);
    return v.toFixed(3);
  }

  var MODELS = [
    { name: 'UPT',          color: 'var(--s-upt)',  vals: [0.651, 1.56, 3.31, 5.12],    cost: 835 },
    { name: 'GINO',         color: 'var(--s-gino)', vals: [3.18, 10.32, 24.31, 33.12],  cost: 4097 },
    { name: 'Transolver++', color: 'var(--s-tsv)',  vals: [2.33, 8.32, 19.33, 31.24],   cost: 1148 },
    { name: 'CALM-PDE',     color: 'var(--s-calm)', vals: [0.461, 0.546, 0.652, 0.789], cost: 1073 }
  ];
  var WINDOWS = [
    { label: '1–50', short: '≤50', label2: 'Steps 1–50', x: 25.5 },
    { label: '51–150', short: '≤150', label2: 'Steps 51–150', x: 100.5 },
    { label: '151–300', short: '≤300', label2: 'Steps 151–300', x: 225.5 },
    { label: '301–399', short: '≤399', label2: 'Steps 301–399', x: 350 }
  ];
  var SOLVER = 13160;

  function renderRollout(host) {
    host.innerHTML = '';
    var W = host.clientWidth;
    if (!W) return;
    var narrow = W < 460;
    var H = Math.round(Math.max(250, Math.min(330, W * 0.6)));
    var m = { l: 34, r: narrow ? 84 : 96, t: 14, b: 44 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    var lo = Math.log(0.3), hi = Math.log(60);
    var X = function (s) { return m.l + (s / 400) * pw; };
    var Y = function (v) { return m.t + (1 - (Math.log(v) - lo) / (hi - lo)) * ph; };

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, host);

    // gridlines + y ticks
    [0.5, 1, 2, 5, 10, 20, 50].forEach(function (v) {
      el('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), class: 'gridline' }, svg);
      txt(svg, m.l - 8, Y(v) + 4, String(v), { 'text-anchor': 'end' });
    });

    // reference line at VRMSE = 1
    el('line', { x1: m.l, x2: m.l + pw, y1: Y(1), y2: Y(1), class: 'refline' }, svg);
    if (!narrow) txt(svg, X(225), Y(1) - 6, 'mean-field level', { 'text-anchor': 'middle', class: 'lbl' });

    // x baseline + window labels
    el('line', { x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph, class: 'baseline' }, svg);
    WINDOWS.forEach(function (w) {
      txt(svg, X(w.x), m.t + ph + 18, narrow ? w.short : w.label, { 'text-anchor': 'middle' });
    });
    txt(svg, m.l + pw / 2, H - 4, 'rollout steps', { 'text-anchor': 'middle' });

    // crosshair
    var cross = el('line', { x1: 0, x2: 0, y1: m.t, y2: m.t + ph, class: 'crosshair' }, svg);

    // series
    var groups = MODELS.map(function (mo) {
      var g = el('g', {}, svg);
      var d = mo.vals.map(function (v, i) {
        return (i ? 'L' : 'M') + X(WINDOWS[i].x).toFixed(1) + ',' + Y(v).toFixed(1);
      }).join('');
      el('path', { d: d, class: 'series', style: 'stroke:' + mo.color }, g);
      mo.vals.forEach(function (v, i) {
        el('circle', { cx: X(WINDOWS[i].x), cy: Y(v), r: 4, class: 'dot', style: 'fill:' + mo.color }, g);
      });
      return g;
    });

    // selective direct labels at line ends (the two that separate cleanly)
    [['CALM-PDE', 3], ['UPT', 0]].forEach(function (p) {
      var mo = MODELS.filter(function (x) { return x.name === p[0]; })[0];
      var v = mo.vals[3];
      txt(svg, X(350) + 9, Y(v) + 4, mo.name + ' ' + (v < 1 ? v.toFixed(2) : v.toFixed(1)), { class: 'lbl' });
    });
    // GINO and Transolver++ end almost on top of each other: one grouped label
    var grp = el('text', { x: X(350) + 9, y: Y(32.2) - 3, class: 'lbl' }, svg);
    var t1 = el('tspan', { x: X(350) + 9, dy: 0 }, grp); t1.textContent = 'GINO &';
    var t2 = el('tspan', { x: X(350) + 9, dy: 14 }, grp); t2.textContent = 'Transolver++';

    // hover layer
    var hit = el('rect', { x: m.l, y: m.t, width: pw, height: ph, class: 'hit' }, svg);
    function onMove(e) {
      var rect = svg.getBoundingClientRect();
      var sx = (e.clientX - rect.left) * (W / rect.width);
      var best = 0, bd = Infinity;
      WINDOWS.forEach(function (w, i) {
        var d = Math.abs(X(w.x) - sx);
        if (d < bd) { bd = d; best = i; }
      });
      var cx = X(WINDOWS[best].x);
      cross.setAttribute('x1', cx);
      cross.setAttribute('x2', cx);
      cross.style.opacity = 1;
      var rows = MODELS.slice().sort(function (a, b) { return b.vals[best] - a.vals[best]; })
        .map(function (mo) {
          return '<div class="tip-row"><span class="sw" style="background:' + mo.color + '"></span>' +
            '<span class="n">' + mo.name + '</span><span class="v">' + fmt(mo.vals[best]) + '</span></div>';
        }).join('');
      showTip('<div class="tip-head">' + WINDOWS[best].label2 + '</div>' + rows, e.clientX, e.clientY);
    }
    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerdown', onMove);
    hit.addEventListener('pointerleave', function () { cross.style.opacity = 0; hideTip(); });
    void groups;
  }

  function speedup(c) {
    var s = SOLVER / c;
    return (s < 10 ? s.toFixed(1) : String(Math.round(s))) + '×';
  }

  function renderCost(host) {
    host.innerHTML = '';
    var W = host.clientWidth;
    if (!W) return;
    var narrow = W < 340;
    var rows = [{ name: 'Solver (PyFR)', color: 'var(--s-solver)', cost: SOLVER, solver: true }]
      .concat(MODELS.slice().sort(function (a, b) { return b.cost - a.cost; }));
    var rowH = 40, barH = 18;
    var labW = narrow ? 92 : 104;
    var m = { l: labW, r: narrow ? 52 : 118, t: 6, b: 6 };
    var H = m.t + rows.length * rowH + m.b;
    var pw = W - m.l - m.r;
    var X = function (v) { return m.l + (v / SOLVER) * pw; };

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, host);
    el('line', { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, class: 'baseline' }, svg);

    rows.forEach(function (r, i) {
      var y0 = m.t + i * rowH + (rowH - barH) / 2;
      var x1 = X(r.cost), x0 = m.l, rr = Math.min(4, x1 - x0);
      txt(svg, m.l - 10, y0 + barH / 2 + 4, r.name === 'Solver (PyFR)' && narrow ? 'Solver' : r.name,
        { 'text-anchor': 'end', class: 'lbl' });
      var d = 'M' + x0 + ',' + y0 + 'H' + (x1 - rr) + 'Q' + x1 + ',' + y0 + ' ' + x1 + ',' + (y0 + rr) +
        'V' + (y0 + barH - rr) + 'Q' + x1 + ',' + (y0 + barH) + ' ' + (x1 - rr) + ',' + (y0 + barH) + 'H' + x0 + 'Z';
      var bar = el('path', { d: d, style: 'fill:' + r.color }, svg);
      var val = r.cost.toLocaleString('en-US');
      var label = narrow ? val : (r.solver ? val + ' GPU-s' : val + ' · ' + speedup(r.cost) + ' faster');
      txt(svg, x1 + 8, y0 + barH / 2 + 4, label, { class: r.solver ? 'lbl' : 'lbl lbl-strong' });

      var hit = el('rect', { x: 0, y: m.t + i * rowH, width: W, height: rowH, class: 'bar-hit' }, svg);
      function onMove(e) {
        bar.style.opacity = 0.8;
        var body = r.solver
          ? '<div class="tip-row"><span class="n">GPU-seconds</span><span class="v">' + val + '</span></div>' +
            '<div class="tip-row"><span class="n">4 GPUs, reference</span></div>'
          : '<div class="tip-row"><span class="n">GPU-seconds</span><span class="v">' + val + '</span></div>' +
            '<div class="tip-row"><span class="n">Speedup vs solver</span><span class="v">' + speedup(r.cost) + '</span></div>';
        showTip('<div class="tip-head"><span class="sw" style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:' +
          r.color + '"></span>' + r.name + '</div>' + body, e.clientX, e.clientY);
      }
      hit.addEventListener('pointermove', onMove);
      hit.addEventListener('pointerdown', onMove);
      hit.addEventListener('pointerleave', function () { bar.style.opacity = 1; hideTip(); });
    });
  }

  var charts = [
    [document.getElementById('chart-rollout'), renderRollout],
    [document.getElementById('chart-cost'), renderCost]
  ].filter(function (c) { return c[0]; });

  function renderAll() { charts.forEach(function (c) { c[1](c[0]); }); }

  renderAll();
  if ('ResizeObserver' in window) {
    var raf = 0, lastW = charts.map(function (c) { return c[0].clientWidth; });
    var ro = new ResizeObserver(function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        charts.forEach(function (c, i) {
          var w = c[0].clientWidth;
          if (w !== lastW[i]) { lastW[i] = w; c[1](c[0]); }
        });
      });
    });
    charts.forEach(function (c) { ro.observe(c[0]); });
  } else {
    window.addEventListener('resize', renderAll);
  }
  window.addEventListener('scroll', hideTip, { passive: true });
})();
