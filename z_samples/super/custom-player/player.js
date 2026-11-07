/* Super player skin for Articulate Storyline. See player.css for install steps.
   Decoration only, apart from the menu: it opens as an overlay, so the slide
   keeps its size. It never changes how a course navigates, scores or reports. */
(function () {
  'use strict';

  if (window.__superPlayer) return;
  window.__superPlayer = true;

  /* Scopes everything in player.css. Added right away so the theme applies
     before the player draws. */
  document.body.classList.add('su-player');

  /* Fonts load here, not from an @import in player.css. An @import holds up the
     whole course while it waits, which can take 25 seconds or more on an LMS
     network that blocks Google Fonts. Without them, player.css uses system faces. */
  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Bangers&family=Barlow+Condensed:wght@600;700&display=swap';
  document.head.appendChild(fontLink);

  /* Words for the burst shown on each new slide. Empty the list to turn it off. */
  var SOUND_EFFECTS = ['POW!', 'ZAP!', 'BAM!', 'BOOM!', 'WHAM!', 'KAPOW!'];

  /* -----------------------------------------------------------------------
     Icons: Lucide (lucide.dev) shapes in place of the player's own, drawn
     heavy by player.css. The player rebuilds icons when state changes, so an
     observer re-applies them.
     ----------------------------------------------------------------------- */
  var ICONS = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16"/><rect x="6" y="4" width="4" height="16"/>',
    replay: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    volume2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    volume1: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    maximize: '<path d="M3 8V3h5"/><path d="M21 8V3h-5"/><path d="M3 16v5h5"/><path d="M21 16v5h-5"/>',
    minimize: '<path d="M8 3v5H3"/><path d="M16 3v5h5"/><path d="M8 21v-5H3"/><path d="M16 21v-5h5"/>',
    arrowLeft: '<path d="M20 12H5"/><path d="m11 18-6-6 6-6"/>',
    arrowRight: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    captions: '<rect width="18" height="14" x="3" y="5"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
    settings: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };

  function volumeIcon() {
    var range = document.querySelector('#volume .volume-range');
    var level = range ? Number(range.value) : 10;
    if (level <= 0) return 'volumeX';
    return level < 5 ? 'volume1' : 'volume2';
  }

  /* [selector, icon name or function, size in px, viewBox] */
  var ICON_MAP = [
    ['svg.play-icon', 'play', 20],
    ['svg.pause-icon', 'pause', 20],
    ['#reset svg', 'replay', 20],
    ['svg.volume-icon', volumeIcon, 20],
    ['#playback-speed > button svg', 'gauge', 20],
    ['svg.enter-fullscreen-icon', 'maximize', 20],
    ['svg.exit-fullscreen-icon', 'minimize', 20],
    ['svg.captions-icon', 'captions', 20],
    ['svg.icon-gear', 'settings', 20],
    ['svg.icon-close', 'x', 18],
    ['svg.icon-clear', 'x', 14],
    ['svg.prev-icon', 'arrowLeft', 15],
    ['svg.next-icon', 'arrowRight', 15],
    ['#submit svg.check-icon', 'check', 15],
    ['#outline-content svg.carrot', 'chevronRight', 30, '-4 -4 32 32'],
    ['#outline-content svg.check-icon', 'check', 13],
    ['#playback-speed .selected-icon svg', 'check', 14]
  ];

  function swapIcons() {
    ICON_MAP.forEach(function (entry) {
      var svgs = document.querySelectorAll('#wrapper ' + entry[0]);
      for (var i = 0; i < svgs.length; i++) {
        var name = typeof entry[1] === 'function' ? entry[1]() : entry[1];
        if (svgs[i].getAttribute('data-su-icon') === name) continue;
        svgs[i].setAttribute('data-su-icon', name);
        svgs[i].setAttribute('viewBox', entry[3] || '0 0 24 24');
        svgs[i].setAttribute('width', entry[2]);
        svgs[i].setAttribute('height', entry[2]);
        svgs[i].innerHTML = ICONS[name];
      }
    });
  }

  /* -----------------------------------------------------------------------
     Overlay menu. The player shrinks the slide when its own menu opens, so
     it's kept closed and the panel is slid over the slide instead.
     ----------------------------------------------------------------------- */
  function setupMenu() {
    var body = document.body;
    var sidebar = document.getElementById('sidebar');
    var hamburger = document.getElementById('hamburger');
    if (!sidebar || !hamburger) return;

    var backdrop = document.createElement('div');
    backdrop.id = 'su-menu-backdrop';
    sidebar.parentNode.insertBefore(backdrop, sidebar);

    function isOpen() { return body.classList.contains('su-menu-open'); }

    function setOpen(open) {
      body.classList.toggle('su-menu-open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function addMenuIcon() {
      var wrapper = hamburger.querySelector('.menu-icon-wrapper');
      if (!wrapper || wrapper.querySelector('.su-menu-icon')) return;
      var icon = document.createElement('span');
      icon.className = 'su-menu-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<span></span><span></span><span></span>';
      wrapper.insertBefore(icon, wrapper.firstChild);
    }

    addMenuIcon();
    new MutationObserver(addMenuIcon).observe(hamburger, { childList: true, subtree: true });

    /* Some slides hide the menu, so the overlay goes with it */
    new MutationObserver(function () {
      if (isOpen() && getComputedStyle(sidebar).display === 'none') setOpen(false);
    }).observe(sidebar, { attributes: true, attributeFilter: ['style'] });

    /* A course that starts with its menu open: close the player's one so the
       slide uses the full width, and show the overlay instead */
    if (!body.classList.contains('sidebar-closed')) {
      hamburger.click();
      setOpen(true);
    }

    /* Take over the menu button before the player sees the click */
    window.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('#hamburger')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(!isOpen());
      }
    }, true);

    backdrop.addEventListener('click', function () { setOpen(false); });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) setOpen(false);
    });

    /* Close after choosing a slide, not when expanding a scene */
    sidebar.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('#outline-content .listitem:not(.is-scene)')) {
        setTimeout(function () { setOpen(false); }, 150);
      }
    });
  }

  /* -----------------------------------------------------------------------
     Sound-effect burst: a box kept on top of the slide, with a comic burst
     that pops at its corner. It never takes clicks.
     ----------------------------------------------------------------------- */
  var lastBox = '';
  var effectIndex = 0;

  /* Star outline with uneven spikes, in a 0-100 box */
  function burstPoints() {
    var spikes = [50, 42, 49, 40, 50, 44, 47, 41, 50, 43, 48, 40, 50, 42];
    var points = [];
    spikes.forEach(function (outer, index) {
      var step = Math.PI / spikes.length;
      var angle = index * 2 * step - Math.PI / 2;
      points.push((50 + Math.cos(angle) * outer).toFixed(1) + ',' + (50 + Math.sin(angle) * outer).toFixed(1));
      points.push((50 + Math.cos(angle + step) * 30).toFixed(1) + ',' + (50 + Math.sin(angle + step) * 30).toFixed(1));
    });
    return points.join(' ');
  }

  function ensureBurst() {
    var frame = document.getElementById('frame');
    var slide = document.getElementById('slide');
    if (!frame || !slide || !SOUND_EFFECTS.length) return;
    var stage = document.getElementById('su-burst-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'su-burst-stage';
      stage.setAttribute('aria-hidden', 'true');
      stage.innerHTML =
        '<div id="su-burst"><svg viewBox="-3 -3 110 110">' +
        '<polygon class="su-burst-shadow" points="' + burstPoints() + '" transform="translate(4 4)"/>' +
        '<polygon class="su-burst-fill" points="' + burstPoints() + '"/>' +
        '</svg><span></span></div>';
      frame.appendChild(stage);
    }
    var frameBox = frame.getBoundingClientRect();
    var box = slide.getBoundingClientRect();
    var key = [box.left - frameBox.left, box.top - frameBox.top, box.width, box.height].join();
    if (key === lastBox) return;
    lastBox = key;
    stage.style.left = (box.left - frameBox.left) + 'px';
    stage.style.top = (box.top - frameBox.top) + 'px';
    stage.style.width = box.width + 'px';
    stage.style.height = box.height + 'px';
  }

  function popBurst() {
    var burst = document.getElementById('su-burst');
    if (!burst) return;
    burst.querySelector('span').textContent = SOUND_EFFECTS[effectIndex];
    effectIndex = (effectIndex + 1) % SOUND_EFFECTS.length;
    burst.classList.remove('is-popping');
    void burst.offsetWidth;
    burst.classList.add('is-popping');
  }

  /* -----------------------------------------------------------------------
     Power meter, page readout and menu numbers. All read from the menu rows,
     so they stand aside in a course with no menu.
     ----------------------------------------------------------------------- */
  var lastIndex = -1;

  function pad(number) { return (number < 10 ? '0' : '') + number; }

  function slideRows() {
    return Array.prototype.slice.call(document.querySelectorAll('#outline-content .cs-listitem:not(.is-scene)'));
  }

  function numberRows(rows) {
    rows.forEach(function (row, index) {
      var label = row.querySelector('.linkText');
      if (label && label.getAttribute('data-su-n') !== pad(index + 1)) {
        label.setAttribute('data-su-n', pad(index + 1));
      }
    });
    var every = document.querySelectorAll('#outline-content .cs-listitem');
    for (var i = 0; i < every.length; i++) every[i].style.setProperty('--su-i', Math.min(i, 24));
  }

  function updateMeter(meter, rows, current) {
    if (meter.childElementCount !== rows.length) {
      meter.textContent = '';
      rows.forEach(function () { meter.appendChild(document.createElement('i')); });
    }
    rows.forEach(function (row, index) {
      var segment = meter.children[index];
      segment.classList.toggle('is-now', index === current);
      segment.classList.toggle('is-seen', index !== current && row.classList.contains('cs-viewed'));
    });
  }

  /* Free space left of the controls, or in the top bar if a seekbar takes it */
  function placeReadout(readout, rows) {
    var bar = document.getElementById('bottom-bar');
    var top = document.getElementById('top-bar');
    var seek = document.getElementById('seek');
    var seekShown = seek && seek.getBoundingClientRect().width > 0;
    var host = seekShown ? top : bar;
    if (readout.parentNode !== host) host.appendChild(readout);

    var hostBox = host.getBoundingClientRect();
    var start = hostBox.left + 24;
    var end = hostBox.right - 24;
    var room;
    if (seekShown) {
      var title = document.querySelector('#top-bar .presentation-title');
      var links = document.getElementById('links-right');
      if (title && title.getBoundingClientRect().width > 0) start = title.getBoundingClientRect().right + 24;
      if (links && links.getBoundingClientRect().width > 0) end = links.getBoundingClientRect().left - 24;
      readout.style.left = 'auto';
      readout.style.right = (hostBox.right - end) + 'px';
    } else {
      /* Measures the buttons themselves: their containers report no width in
         mobile view. Controls can sit on either side of the free space. */
      var middle = hostBox.left + hostBox.width / 2;
      var controls = host.querySelectorAll('button, .cs-button');
      for (var i = 0; i < controls.length; i++) {
        var box = controls[i].getBoundingClientRect();
        if (!box.width || !box.height || getComputedStyle(controls[i]).visibility === 'hidden') continue;
        if (box.left + box.width / 2 < middle) start = Math.max(start, box.right + 16);
        else end = Math.min(end, box.left - 16);
      }
      readout.style.right = 'auto';
      readout.style.left = (start - hostBox.left) + 'px';
    }
    room = end - start;

    var name = readout.querySelector('.su-name');
    readout.style.display = room < 80 || rows.length < 2 ? 'none' : 'flex';
    name.style.display = room < 200 ? 'none' : '';
    readout.style.maxWidth = Math.max(room, 0) + 'px';
  }

  function setText(element, html) {
    if (element.innerHTML !== html) element.innerHTML = html;
  }

  function updateProgress() {
    var bar = document.getElementById('bottom-bar');
    if (!bar) return;
    var rows = slideRows();
    numberRows(rows);

    var meter = document.getElementById('su-meter');
    var readout = document.getElementById('su-readout');

    if (!meter) {
      meter = document.createElement('div');
      meter.id = 'su-meter';
      meter.setAttribute('aria-hidden', 'true');
      bar.appendChild(meter);
    }
    if (!readout) {
      readout = document.createElement('div');
      readout.id = 'su-readout';
      readout.setAttribute('aria-hidden', 'true');
      readout.innerHTML = '<span class="su-count"></span><span class="su-name"></span>';
      bar.appendChild(readout);
    }

    /* A very long course drops the bar rather than draw it in invisible slivers.
       The readout still shows the page number. */
    var roomy = rows.length >= 2 && bar.getBoundingClientRect().width / rows.length >= 4;
    meter.style.display = roomy ? '' : 'none';

    var index = rows.findIndex(function (row) { return row.classList.contains('cs-selected'); });
    if (index < 0) index = Math.max(lastIndex, 0);

    if (rows.length) {
      if (roomy) updateMeter(meter, rows, index);
      setText(readout.querySelector('.su-count'), '<b>' + pad(index + 1) + '</b> of ' + pad(rows.length));
      var name = rows[index].getAttribute('data-slide-title') || '';
      var nameBox = readout.querySelector('.su-name');
      if (nameBox.textContent !== name) nameBox.textContent = name;
    }
    placeReadout(readout, rows);

    if (index !== lastIndex) {
      if (lastIndex !== -1) popBurst();
      lastIndex = index;
    }
  }

  /* -----------------------------------------------------------------------
     Start once the player has built itself
     ----------------------------------------------------------------------- */
  var outlineWatched = null;
  var outlineObserver = null;

  function watchOutline() {
    var outline = document.getElementById('outline-content');
    if (!outline || outline === outlineWatched) return;
    if (outlineObserver) outlineObserver.disconnect();
    outlineWatched = outline;
    outlineObserver = new MutationObserver(updateProgress);
    outlineObserver.observe(outline, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  function decorate() {
    swapIcons();
    watchOutline();
    ensureBurst();
    updateProgress();
  }

  function start() {
    var frame = document.getElementById('frame');
    if (!frame || !document.getElementById('bottom-bar')) {
      setTimeout(start, 100);
      return;
    }

    setupMenu();
    decorate();

    /* setTimeout, not requestAnimationFrame: rAF pauses in hidden tabs */
    var pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        decorate();
      }, 120);
    }

    new MutationObserver(schedule).observe(frame, { childList: true, subtree: true });
    var slide = document.getElementById('slide');
    if (slide) new MutationObserver(schedule).observe(slide, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', schedule);
    /* Text gets wider or narrower when the real font replaces the fallback */
    if (document.fonts) document.fonts.addEventListener('loadingdone', schedule);
    document.addEventListener('input', function (event) {
      if (event.target.closest && event.target.closest('#volume')) swapIcons();
    }, true);
  }

  start();
})();
