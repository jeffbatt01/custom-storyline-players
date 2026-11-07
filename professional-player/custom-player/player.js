/* =============================================================
   Custom Storyline Player Script
   Drop this folder into any Storyline 360 HTML5 output and link
   it at the very end of story.html (see README.md).
   ============================================================= */
(function () {
  'use strict';

  // Wait until Storyline has built the player UI, then run setup.
  function whenPlayerReady(callback) {
    var check = setInterval(function () {
      if (document.getElementById('bottom-bar') && typeof window.GetPlayer === 'function') {
        clearInterval(check);
        callback(window.GetPlayer());
      }
    }, 100);
  }

  // ---- Overlay menu ------------------------------------------------
  // Storyline's layout engine shrinks the slide when its menu opens.
  // We keep Storyline thinking the menu is closed and slide it over
  // the content ourselves (see "Overlay menu" in player.css).
  function setupOverlayMenu() {
    var body = document.body;
    var wrapper = document.getElementById('wrapper');
    var sidebar = document.getElementById('sidebar');
    var hamburger = document.getElementById('hamburger');
    if (!wrapper || !sidebar || !hamburger) return;

    // Same parent as the menu, so the menu can stack above it.
    var backdrop = document.createElement('div');
    backdrop.id = 'cp-menu-backdrop';
    sidebar.parentNode.insertBefore(backdrop, sidebar);

    function isOpen() {
      return body.classList.contains('cp-menu-open');
    }

    function setOpen(open) {
      body.classList.toggle('cp-menu-open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      syncIconColor();
    }

    // ---- Animated menu icon (bars <-> X) ----
    // Storyline's icon is one SVG path, so we draw three bars we can move.
    function syncIconColor() {
      var path = hamburger.querySelector('svg path');
      if (path) hamburger.style.setProperty('--cp-icon-color', getComputedStyle(path).fill);
    }

    function addMenuIcon() {
      var iconWrapper = hamburger.querySelector('.menu-icon-wrapper');
      if (!iconWrapper || iconWrapper.querySelector('.cp-menu-icon')) return;
      var icon = document.createElement('span');
      icon.className = 'cp-menu-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<span></span><span></span><span></span>';
      var svg = iconWrapper.querySelector('svg');
      iconWrapper.insertBefore(icon, svg ? svg.nextSibling : iconWrapper.firstChild);
      syncIconColor();
    }

    addMenuIcon();
    // Storyline re-renders the button at times; put the icon back if so.
    new MutationObserver(addMenuIcon).observe(hamburger, { childList: true, subtree: true });
    // Hover colors come from Storyline's theme.
    hamburger.addEventListener('mouseenter', function () { setTimeout(syncIconColor, 0); });
    hamburger.addEventListener('mouseleave', function () { setTimeout(syncIconColor, 0); });

    // Some slides hide the menu; drop the overlay when that happens.
    new MutationObserver(function () {
      if (isOpen() && getComputedStyle(sidebar).display === 'none') setOpen(false);
    }).observe(sidebar, { attributes: true, attributeFilter: ['style'] });

    // If the course starts with Storyline's menu open, close it once so
    // the slide uses the full width, then show our overlay instead.
    if (!body.classList.contains('sidebar-closed')) {
      hamburger.click();
      setOpen(true);
    }

    // Take over the menu button before Storyline sees the click.
    window.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#hamburger')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(!isOpen());
      }
    }, true);

    backdrop.addEventListener('click', function () { setOpen(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) setOpen(false);
    });

    // Close after choosing a slide (not when expanding a scene).
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#outline-content .listitem:not(.is-scene)')) {
        setTimeout(function () { setOpen(false); }, 150);
      }
    });
  }

  // Hook class so player.css rules can be scoped to custom-player courses.
  // Added right away so the theme applies before the player draws.
  document.body.classList.add('custom-player');

  // Fonts load here, not from an @import in player.css. An @import holds up the
  // whole course while it waits, which can take 25 seconds or more on an LMS
  // network that blocks Google Fonts. Without them, player.css uses system faces.
  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Space+Grotesk:wght@500;600;700&display=swap';
  document.head.appendChild(fontLink);

  // ---- Lucide icons ------------------------------------------------
  // Swaps Storyline's player icons for Lucide (lucide.dev) glyphs,
  // 24px grid, 2px stroke. Storyline rebuilds icons when state changes
  // (play/pause, volume level, full screen), so an observer re-applies.
  var LUCIDE = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    replay: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    volume2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    volume1: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    captions: '<rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
    settings: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };

  function volumeIcon() {
    var range = document.querySelector('#volume .volume-range');
    var level = range ? Number(range.value) : 10;
    if (level <= 0) return 'volumeX';
    return level < 5 ? 'volume1' : 'volume2';
  }

  // [selector, icon name (or function), size in px, viewBox]
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
    ['svg.icon-close', 'x', 20],
    ['svg.icon-clear', 'x', 14],
    ['svg.prev-icon', 'chevronLeft', 16],
    ['svg.next-icon', 'chevronRight', 16],
    ['#submit svg.check-icon', 'check', 16],
    ['#outline-content svg.carrot', 'chevronRight', 30, '-4 -4 32 32'],
    ['#outline-content svg.check-icon', 'check', 14],
    ['#playback-speed .selected-icon svg', 'check', 14]
  ];

  function swapIcons() {
    ICON_MAP.forEach(function (entry) {
      var svgs = document.querySelectorAll('#wrapper ' + entry[0]);
      for (var i = 0; i < svgs.length; i++) {
        var svg = svgs[i];
        var name = typeof entry[1] === 'function' ? entry[1]() : entry[1];
        if (svg.getAttribute('data-cp-icon') === name) continue;
        svg.setAttribute('data-cp-icon', name);
        svg.setAttribute('viewBox', entry[3] || '0 0 24 24');
        svg.setAttribute('width', entry[2]);
        svg.setAttribute('height', entry[2]);
        svg.innerHTML = LUCIDE[name];
      }
    });
  }

  function setupIcons() {
    swapIcons();
    var wrapper = document.getElementById('wrapper');
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      // setTimeout, not requestAnimationFrame: rAF pauses in hidden tabs.
      setTimeout(function () { pending = false; swapIcons(); }, 0);
    }).observe(wrapper, { childList: true, subtree: true });
    // Volume changes don't always rebuild the icon.
    document.addEventListener('input', function (e) {
      if (e.target.closest && e.target.closest('#volume')) swapIcons();
    }, true);
  }

  whenPlayerReady(function (player) {
    setupIcons();
    setupOverlayMenu();

    // Add player customizations below.
    // `player` is Storyline's player object (getVar / setVar available).
  });
})();
