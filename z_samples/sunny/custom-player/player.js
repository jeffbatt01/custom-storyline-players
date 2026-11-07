/* Sunny player skin for Articulate Storyline. See player.css for install steps.
   Decoration only, apart from the menu: it opens as an overlay, so the slide
   keeps its size. It never changes how a course navigates, scores or reports. */
(function () {
  'use strict';

  if (window.__sunnyPlayer) return;
  window.__sunnyPlayer = true;

  /* Scopes everything in player.css. Added right away so the theme applies
     before the player draws. */
  document.body.classList.add('sun-player');

  /* What the sun says when it pops up on a new slide. Empty the list for no
     speech bubble. */
  var CHEERS = ['Hooray!', 'Nice one!', 'Yay!', 'Keep going!', 'Woohoo!', 'Great job!'];

  /* Set to false to keep the sun in the title bar, with no hello on new slides */
  var SUN_SAYS_HELLO = true;

  /* -----------------------------------------------------------------------
     Icons: Lucide (lucide.dev) shapes in place of the player's own, drawn
     round by player.css. The player rebuilds icons when state changes, so an
     observer re-applies them.
     ----------------------------------------------------------------------- */
  var ICONS = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    replay: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    volume2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    volume1: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    arrowLeft: '<path d="M20 12H5"/><path d="m11 18-6-6 6-6"/>',
    arrowRight: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    captions: '<rect width="18" height="14" x="3" y="5" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
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
        if (svgs[i].getAttribute('data-sun-icon') === name) continue;
        svgs[i].setAttribute('data-sun-icon', name);
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
    backdrop.id = 'sun-menu-backdrop';
    sidebar.parentNode.insertBefore(backdrop, sidebar);

    function isOpen() { return body.classList.contains('sun-menu-open'); }

    function setOpen(open) {
      body.classList.toggle('sun-menu-open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function addMenuIcon() {
      var wrapper = hamburger.querySelector('.menu-icon-wrapper');
      if (!wrapper || wrapper.querySelector('.sun-menu-icon')) return;
      var icon = document.createElement('span');
      icon.className = 'sun-menu-icon';
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
     The sun: a smiling face with rays that turn slowly. One sits by the
     course title. A bigger one rises over each new slide, winks and sinks
     back. Neither takes clicks.
     ----------------------------------------------------------------------- */
  function sunSvg() {
    var rays = '';
    for (var i = 0; i < 12; i++) {
      rays += '<path d="M50 3l6 16H44z" transform="rotate(' + (i * 30) + ' 50 50)"/>';
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<g class="sun-rays">' + rays + '</g>' +
      '<circle class="sun-disc" cx="50" cy="50" r="29"/>' +
      '<ellipse class="sun-eye" cx="41" cy="45" rx="3" ry="4.2"/>' +
      '<ellipse class="sun-eye sun-eye-right" cx="59" cy="45" rx="3" ry="4.2"/>' +
      '<circle class="sun-cheek" cx="34" cy="55" r="4.4"/>' +
      '<circle class="sun-cheek" cx="66" cy="55" r="4.4"/>' +
      '<path class="sun-smile" d="M39 57q11 13 22 0"/>' +
      '</svg>';
  }

  /* The player rebuilds the title, so this is re-checked on every change */
  function ensureLogo() {
    var title = document.querySelector('#top-bar .presentation-title-text') ||
      document.querySelector('#top-bar .presentation-title');
    if (!title || title.querySelector('.sun-logo')) return;
    var logo = document.createElement('span');
    logo.className = 'sun-logo';
    logo.innerHTML = sunSvg();
    title.insertBefore(logo, title.firstChild);
  }

  var lastBox = '';
  var cheerIndex = 0;

  /* A box kept exactly over the slide, so the sun can rise from its bottom edge */
  function ensureStage() {
    if (!SUN_SAYS_HELLO) return;
    var frame = document.getElementById('frame');
    var slide = document.getElementById('slide');
    if (!frame || !slide) return;
    var stage = document.getElementById('sun-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'sun-stage';
      stage.setAttribute('aria-hidden', 'true');
      stage.innerHTML = '<div id="sun-cheer"></div><div id="sun-riser">' + sunSvg() + '</div>';
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

  function sayHello() {
    var riser = document.getElementById('sun-riser');
    var cheer = document.getElementById('sun-cheer');
    if (!riser || !cheer) return;
    cheer.textContent = CHEERS.length ? CHEERS[cheerIndex] : '';
    if (CHEERS.length) cheerIndex = (cheerIndex + 1) % CHEERS.length;
    [riser, cheer].forEach(function (element) {
      element.classList.remove('is-rising');
      void element.offsetWidth;
      element.classList.add('is-rising');
    });
  }

  /* -----------------------------------------------------------------------
     Garden, page readout and menu numbers. All read from the menu rows, so
     they stand aside in a course with no menu.
     ----------------------------------------------------------------------- */
  var FLOWER =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<g class="sun-sprout"><path class="sun-stem" d="M12 24v-13"/>' +
    '<path class="sun-leaf" d="M12 15c-.6-5-4-7.5-8-7.5 0 4.500 3 7.500 8 7.500z"/>' +
    '<path class="sun-leaf" d="M12 15c.6-5 4-7.500 8-7.500 0 4.500-3 7.500-8 7.500z"/></g>' +
    '<g class="sun-bloom"><path class="sun-stem" d="M12 24v-12"/>' +
    '<g class="sun-petals"><circle cx="12" cy="4.2" r="3.6"/><circle cx="18.6" cy="9" r="3.6"/>' +
    '<circle cx="16.1" cy="16.7" r="3.6"/><circle cx="7.9" cy="16.7" r="3.6"/><circle cx="5.4" cy="9" r="3.6"/></g>' +
    '<circle class="sun-middle" cx="12" cy="11" r="3.8"/></g>' +
    '</svg>';

  var lastIndex = -1;

  function slideRows() {
    return Array.prototype.slice.call(document.querySelectorAll('#outline-content .cs-listitem:not(.is-scene)'));
  }

  function numberRows(rows) {
    rows.forEach(function (row, index) {
      var label = row.querySelector('.linkText');
      if (label && label.getAttribute('data-sun-n') !== String(index + 1)) {
        label.setAttribute('data-sun-n', index + 1);
        label.setAttribute('data-sun-tone', index % 4);
      }
    });
    var every = document.querySelectorAll('#outline-content .cs-listitem');
    for (var i = 0; i < every.length; i++) every[i].style.setProperty('--sun-i', Math.min(i, 24));
  }

  function updateGarden(garden, rows, current) {
    if (garden.childElementCount !== rows.length) {
      garden.textContent = '';
      rows.forEach(function () {
        var flower = document.createElement('i');
        flower.innerHTML = FLOWER;
        garden.appendChild(flower);
      });
    }
    /* A long course gets smaller flowers, and none at all once they'd be specks */
    var width = garden.getBoundingClientRect().width;
    var size = Math.min(20, rows.length ? (width / rows.length) - 2 : 20);
    garden.style.setProperty('--sun-flower', size + 'px');
    garden.style.display = rows.length < 2 || size < 8 ? 'none' : '';

    rows.forEach(function (row, index) {
      var flower = garden.children[index];
      var now = index === current;
      var seen = !now && row.classList.contains('cs-viewed');
      var wasShut = !flower.classList.contains('is-now') && !flower.classList.contains('is-seen');
      if (lastIndex !== -1 && wasShut && (now || seen)) flower.classList.add('just-opened');
      flower.classList.toggle('is-now', now);
      flower.classList.toggle('is-seen', seen);
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
    var start = hostBox.left + 20;
    var end = hostBox.right - 20;
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
        if (box.left + box.width / 2 < middle) start = Math.max(start, box.right + 14);
        else end = Math.min(end, box.left - 14);
      }
      readout.style.right = 'auto';
      readout.style.left = (start - hostBox.left) + 'px';
    }
    room = end - start;

    var name = readout.querySelector('.sun-name');
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

    var garden = document.getElementById('sun-garden');
    var readout = document.getElementById('sun-readout');

    if (!garden) {
      garden = document.createElement('div');
      garden.id = 'sun-garden';
      garden.setAttribute('aria-hidden', 'true');
      bar.appendChild(garden);
    }
    if (!readout) {
      readout = document.createElement('div');
      readout.id = 'sun-readout';
      readout.setAttribute('aria-hidden', 'true');
      readout.innerHTML = '<span class="sun-count"></span><span class="sun-name"></span>';
      bar.appendChild(readout);
    }

    var index = rows.findIndex(function (row) { return row.classList.contains('cs-selected'); });
    if (index < 0) index = Math.max(lastIndex, 0);

    if (rows.length) {
      updateGarden(garden, rows, index);
      setText(readout.querySelector('.sun-count'), '<b>' + (index + 1) + '</b> of ' + rows.length);
      var name = rows[index].getAttribute('data-slide-title') || '';
      var nameBox = readout.querySelector('.sun-name');
      if (nameBox.textContent !== name) nameBox.textContent = name;
    } else {
      garden.style.display = 'none';
    }
    placeReadout(readout, rows);

    if (index !== lastIndex) {
      if (lastIndex !== -1 && SUN_SAYS_HELLO) sayHello();
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
    ensureLogo();
    watchOutline();
    ensureStage();
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
    document.addEventListener('input', function (event) {
      if (event.target.closest && event.target.closest('#volume')) swapIcons();
    }, true);
  }

  start();
})();
