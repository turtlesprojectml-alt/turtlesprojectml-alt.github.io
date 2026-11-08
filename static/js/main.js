(function () {
  'use strict';

  var root = document.documentElement;

  /* ------------------------------------------------------------
     Theme toggle (light by default; dark persists per viewer)
     ------------------------------------------------------------ */
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') !== 'dark';
      if (dark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem('turtles-theme', dark ? 'dark' : 'light'); } catch (e) {}
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
    var name = g === 'G4' && t === 'T400' ? 'TurtLES-full' : 'TurtLES-' + g + t;
    document.getElementById('picker-name').textContent = 'TurtLES-' + g + t;
    document.querySelector('#picker-cmd code').textContent = 'python download_turtles.py ' + name;
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

})();
