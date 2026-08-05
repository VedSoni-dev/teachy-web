/**
 * Vanilla port of React Bits <OptionWheel />.
 * Mount: OptionWheel.mount(el, options)
 */
(function (global) {
  var DEFAULT_ITEMS = [
    'Ambient',
    'House',
    'Techno',
    'Jazz',
    'Lo-Fi',
    'Synthwave',
    'Trance',
    'Funk',
    'Disco',
    'Hip-Hop',
    'Chillwave',
    'Drum & Bass'
  ];

  function remPx() {
    if (typeof window === 'undefined') return 16;
    return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  }

  function OptionWheel(root, opts) {
    opts = opts || {};
    var items = opts.items || DEFAULT_ITEMS;
    var defaultSelected = opts.defaultSelected != null ? opts.defaultSelected : 3;

    var pos = defaultSelected;
    var target = defaultSelected;
    var selected = defaultSelected;
    var raf = null;
    var last = 0;
    var wheelTimer = null;
    var drag = null;
    var dragMoved = false;
    var audio = null;
    var audioUrl = '';
    var lastTick = 0;
    var itemEls = [];
    var isDragging = false;

    var cfg = {};
    function syncCfg() {
      cfg = {
        count: items.length,
        items: items,
        rowH: Math.max((opts.fontSize != null ? opts.fontSize : 3) * (opts.spacing != null ? opts.spacing : 1.4) * remPx(), 1),
        curve: opts.curve != null ? opts.curve : 1,
        tilt: opts.tilt != null ? opts.tilt : 6,
        blur: opts.blur != null ? opts.blur : 2,
        fade: opts.fade != null ? opts.fade : 0.25,
        minOpacity: opts.minOpacity != null ? opts.minOpacity : 0.05,
        side: opts.side || 'left',
        loop: !!opts.loop,
        smoothing: opts.smoothing != null ? opts.smoothing : 200,
        draggable: opts.draggable !== false,
        soundUrl: opts.soundUrl || '',
        soundVolume: opts.soundVolume != null ? opts.soundVolume : 0.5
      };
    }
    syncCfg();

    root.setAttribute('role', 'listbox');
    root.setAttribute('tabIndex', '0');
    root.setAttribute('aria-label', opts.ariaLabel || 'Option wheel');
    root.className =
      'option-wheel' +
      (cfg.side === 'right' ? ' option-wheel--right' : '') +
      (opts.className ? ' ' + opts.className : '');
    root.style.setProperty('--ow-text-color', opts.textColor || '#a6a6a6');
    root.style.setProperty('--ow-active-color', opts.activeColor || '#ffffff');
    root.style.setProperty('--ow-font-size', (opts.fontSize != null ? opts.fontSize : 3) + 'rem');
    root.style.setProperty('--ow-inset', (opts.inset != null ? opts.inset : 80) + 'px');

    root.innerHTML = '';
    items.forEach(function (label, index) {
      var el = document.createElement('div');
      el.className = 'option-wheel__item' + (index === selected ? ' option-wheel__item--selected' : '');
      el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', index === selected ? 'true' : 'false');
      el.textContent = label;
      el.addEventListener('click', function () {
        handleItemClick(index);
      });
      root.appendChild(el);
      itemEls[index] = el;
    });

    function runFrame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var tau = Math.max(cfg.smoothing, 1) / 1000;
      var k = 1 - Math.exp(-dt / tau);
      var next = pos + (target - pos) * k;
      var settled = Math.abs(target - next) < 0.001;
      if (settled) next = target;
      pos = next;

      var n = cfg.count;
      var mirror = cfg.side === 'right' ? -1 : 1;
      var tiltRad = (cfg.tilt * Math.PI) / 180;
      var R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

      for (var i = 0; i < n; i++) {
        var el = itemEls[i];
        if (!el) continue;
        var d = i - next;
        if (cfg.loop && n > 1) {
          d = ((d % n) + n) % n;
          if (d > n / 2) d -= n;
        }
        var dist = Math.abs(d);
        var x = 0;
        var y = d * cfg.rowH;
        var rot = 0;
        if (R > 0) {
          var ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
          y = R * Math.sin(ang);
          x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
          rot = (mirror * ang * 180) / Math.PI;
        }
        el.style.transform =
          'translate(' + x.toFixed(2) + 'px, calc(' + y.toFixed(2) + 'px - 50%)) rotate(' + rot.toFixed(3) + 'deg)';
        el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
        el.style.filter = cfg.blur > 0 ? 'blur(' + (dist * cfg.blur).toFixed(2) + 'px)' : 'none';
        el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
      }

      raf = settled ? null : requestAnimationFrame(runFrame);
    }

    function startLoop() {
      if (raf != null) cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(runFrame);
    }

    function playTick() {
      if (!cfg.soundUrl) return;
      var now = performance.now();
      if (now - lastTick < 70) return;
      lastTick = now;
      if (!audio || audioUrl !== cfg.soundUrl) {
        audio = new Audio(cfg.soundUrl);
        audio.preload = 'auto';
        audioUrl = cfg.soundUrl;
      }
      audio.volume = Math.min(Math.max(cfg.soundVolume, 0), 1);
      audio.currentTime = 0;
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    }

    function applyTarget(value, snap) {
      var v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      target = v;
      var idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
      if (idx !== selected) {
        selected = idx;
        itemEls.forEach(function (el, i) {
          if (!el) return;
          el.classList.toggle('option-wheel__item--selected', i === idx);
          el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
        });
        if (typeof opts.onChange === 'function') opts.onChange(idx, cfg.items[idx]);
        playTick();
      }
      startLoop();
    }

    function onWheel(e) {
      e.preventDefault();
      e.stopPropagation();
      var delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      var step = Math.max(-1, Math.min(1, delta / cfg.rowH));
      applyTarget(target + step, false);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () {
        applyTarget(target, true);
      }, 140);
    }

    function handlePointerDown(e) {
      if (!cfg.draggable) return;
      drag = { y: e.clientY, start: target, id: e.pointerId };
      dragMoved = false;
      isDragging = true;
      root.classList.add('option-wheel--dragging');
    }

    function handlePointerMove(e) {
      if (!drag) return;
      var dy = e.clientY - drag.y;
      if (!dragMoved && Math.abs(dy) > 4) {
        dragMoved = true;
        try {
          root.setPointerCapture(drag.id);
        } catch (err) {}
      }
      if (dragMoved) applyTarget(drag.start - dy / cfg.rowH, false);
    }

    function handlePointerEnd() {
      if (!drag) return;
      drag = null;
      isDragging = false;
      root.classList.remove('option-wheel--dragging');
      if (dragMoved) applyTarget(target, true);
    }

    function handleItemClick(index) {
      if (dragMoved) return;
      var cur = target;
      var d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      applyTarget(cur + d, true);
    }

    function handleKeyDown(e) {
      var delta = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
      if (delta == null) return;
      e.preventDefault();
      e.stopPropagation();
      applyTarget(Math.round(target) + delta, true);
    }

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('pointerdown', handlePointerDown);
    root.addEventListener('pointermove', handlePointerMove);
    root.addEventListener('pointerup', handlePointerEnd);
    root.addEventListener('pointercancel', handlePointerEnd);
    root.addEventListener('keydown', handleKeyDown);

    applyTarget(defaultSelected, true);

    return {
      select: function (index) {
        applyTarget(index, true);
      },
      destroy: function () {
        if (raf != null) cancelAnimationFrame(raf);
        if (wheelTimer) clearTimeout(wheelTimer);
        if (audio) audio.pause();
        root.removeEventListener('wheel', onWheel);
        root.removeEventListener('pointerdown', handlePointerDown);
        root.removeEventListener('pointermove', handlePointerMove);
        root.removeEventListener('pointerup', handlePointerEnd);
        root.removeEventListener('pointercancel', handlePointerEnd);
        root.removeEventListener('keydown', handleKeyDown);
      }
    };
  }

  OptionWheel.mount = function (el, options) {
    return OptionWheel(el, options);
  };

  global.OptionWheel = OptionWheel;
})(typeof window !== 'undefined' ? window : globalThis);
