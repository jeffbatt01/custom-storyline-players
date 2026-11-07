/* Arcade player skin for Articulate Storyline. See player.css for install steps.
   Decoration only, apart from the menu: it opens as an overlay, so the slide
   keeps its size. It never changes how a course navigates, scores or reports.
   The gems count slides viewed. They aren't a score. */
(function () {
  'use strict';

  if (window.__arcadePlayer) return;
  window.__arcadePlayer = true;

  /* Scopes everything in player.css. Added right away so the theme applies
     before the player draws. */
  document.body.classList.add('ar-player');

  /* Fonts load here, not from an @import in player.css. An @import holds up the
     whole course while it waits, which can take 25 seconds or more on an LMS
     network that blocks Google Fonts. Without them, player.css uses system faces. */
  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap';
  document.head.appendChild(fontLink);

  /* Set to false to skip the "STAGE 3" banner over the slide on each new slide */
  var STAGE_BANNER = true;

  /* -----------------------------------------------------------------------
     Pixel art. Each sprite is a list of rows, one character per pixel. A dot
     is see-through and any other character looks up its colour in a palette.
     ----------------------------------------------------------------------- */
  function pixels(rows, palette) {
    var out = '';
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x);
        if (ch === '.') continue;
        var run = 1;
        while (row.charAt(x + run) === ch) run++;
        out += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1"' +
          (palette ? ' fill="' + palette[ch] + '"' : '') + '/>';
        x += run - 1;
      }
    });
    return out;
  }

  function spriteSvg(rows, palette) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + rows[0].length + ' ' + rows.length +
      '" shape-rendering="crispEdges" aria-hidden="true">' + pixels(rows, palette) + '</svg>';
  }

  function cssUrl(svg) {
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  /* The robot. An original character, drawn for this player. */
  var HERO_COLOURS = { k: '#12102a', y: '#ffc531', t: '#35d6c4', d: '#1f8f96', w: '#fff6e0' };
  var HERO_TOP = [
    '......y.....',
    '......k.....',
    '..kkkkkkkk..',
    '.kttttttttk.',
    '.kttwktwktk.',
    '.kttwktwktk.',
    '.kttttttttk.',
    '..kkkkkkkk..',
    '.k.kddddk.k.',
    '...kddddk...'
  ];
  var HERO_STEP_A = HERO_TOP.concat(['..kk...kk...', '..kk....kk..']);
  var HERO_STEP_B = HERO_TOP.concat(['....kkkk....', '....kk.kk...']);

  var GEM = [
    '..gggg..',
    '.gwwggg.',
    'gwgggggd',
    'gggggggd',
    '.gggggd.',
    '..gggd..',
    '...gd...',
    '........'
  ];
  var GEM_LIT = { g: '#ffc531', w: '#fff6e0', d: '#d9782b' };
  var GEM_DARK = { g: '#7a6fc0', w: '#a89fe0', d: '#4a3f8f' };

  /* Ground: a tile of grass-topped stone, then five of plain stone. 16 by 48
     art pixels, so taller than any bar and it never needs to repeat downward. */
  var STONE = [
    'sssssssmsssssssm',
    'hsssssmmhsssssmm',
    'hsssssmmhsssssmm',
    'hsssssmmhsssssmm',
    'mmmmmmmmmmmmmmmm',
    'sssmsssssssmssss',
    'sssmhssssssmhsss',
    'mmmmmmmmmmmmmmmm'
  ];
  var GRASS = [
    'gggggggggggggggg',
    'lgglgggglggglggg',
    'gggggggggggggggg',
    'dgddgdddgdgddgdd',
    'd.dd.ddd.d.dd.dd'.replace(/\./g, 's'),
    'sssssssmsssssssm',
    'hsssssmmhsssssmm',
    'mmmmmmmmmmmmmmmm'
  ];
  var GROUND_COLOURS = {
    g: '#3ddc84', l: '#9df5b8', d: '#1f8f5f',
    s: '#4a3f8f', h: '#6a5fb8', m: '#2e2766'
  };

  var CLOUD = [
    '........cccccc..........',
    '......cccccccccc........',
    '...ccccccccccccccc......',
    '..cccccccccccccccccccc..',
    'cccccccccccccccccccccccc',
    'ppcccppcccccppppccppcccp',
    '..pppp..ppppp...pp..ppp.'
  ];

  /* Column heights for the far and near mountains, each column 8 art-pixels wide */
  var FAR_PEAKS = [3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 3, 4, 5, 6, 5, 4, 3, 2];
  var NEAR_PEAKS = [1, 2, 3, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 1, 2, 3, 2, 1, 2, 3, 4, 3, 2];

  function peaksSvg() {
    var height = 10, unit = 8, out = '';
    function layer(peaks, colour) {
      peaks.forEach(function (peak, x) {
        out += '<rect x="' + (x * unit) + '" y="' + ((height - peak) * unit) + '" width="' + unit +
          '" height="' + (peak * unit) + '" fill="' + colour + '"/>';
      });
    }
    layer(FAR_PEAKS, '#43207a');
    layer(NEAR_PEAKS, '#2e1a63');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (FAR_PEAKS.length * unit) + ' ' + (height * unit) +
      '" shape-rendering="crispEdges">' + out + '</svg>';
  }

  /* Four clouds and a scatter of stars on a strip that repeats every 900px */
  function skySvg() {
    var cloud = pixels(CLOUD, { c: '#ffd9c7', p: '#e88fa8' });
    var out = '';
    /* The first two ride in the usual gap between the top bar and the slide */
    [[40, 74, 2], [470, 78, 2], [640, 300, 4], [180, 340, 3]].forEach(function (c) {
      out += '<g transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')">' + cloud + '</g>';
    });
    [[20, 20], [130, 60], [260, 24], [360, 130], [520, 150], [600, 16], [760, 70], [860, 150], [310, 220], [80, 200]].forEach(function (s) {
      out += '<rect x="' + s[0] + '" y="' + s[1] + '" width="4" height="4" fill="#fff6e0"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420" shape-rendering="crispEdges">' + out + '</svg>';
  }

  /* player.css paints with these */
  var rootStyle = document.body.style;
  rootStyle.setProperty('--ar-ground', cssUrl(spriteSvg(GRASS.concat(STONE, STONE, STONE, STONE, STONE), GROUND_COLOURS)));
  rootStyle.setProperty('--ar-sky-art', cssUrl(skySvg()));
  rootStyle.setProperty('--ar-peaks', cssUrl(peaksSvg()));
  rootStyle.setProperty('--ar-hero', cssUrl(spriteSvg(HERO_STEP_A, HERO_COLOURS)));

  /* -----------------------------------------------------------------------
     Icons, drawn on a 12 by 12 grid. Shown at 12 or 24px so every pixel lands
     on a whole screen pixel. The player rebuilds icons when state changes, so
     an observer re-applies them.
     ----------------------------------------------------------------------- */
  var SPEAKER = [
    '............',
    '.....#......',
    '....##......',
    '...###......',
    '######......',
    '######......',
    '######......',
    '######......',
    '...###......',
    '....##......',
    '.....#......'
  ];
  var WAVE_NEAR = ['', '', '', '.......#....', '........#...', '........#...', '........#...', '........#...', '.......#....'];
  var WAVE_FAR = ['', '.........#..', '..........#.', '..........#.', '..........#.', '..........#.', '..........#.', '..........#.', '..........#.', '.........#..'];
  var MUTED = ['', '', '', '', '........#..#', '.........##.', '.........##.', '........#..#'];
  var ARROW_RIGHT = [
    '............',
    '......##....',
    '.......##...',
    '........##..',
    '.........##.',
    '###########.',
    '###########.',
    '.........##.',
    '........##..',
    '.......##...',
    '......##....',
    '............'
  ];

  function mirrored(rows) {
    return rows.map(function (row) { return row.split('').reverse().join(''); });
  }

  var ICONS = {
    play: pixels(['............', '..##........', '..####......', '..######....', '..########..', '..##########', '..##########', '..########..', '..######....', '..####......', '..##........', '............']),
    pause: pixels(['............', '..###..###..', '..###..###..', '..###..###..', '..###..###..', '..###..###..', '..###..###..', '..###..###..', '..###..###..', '..###..###..', '..###..###..', '............']),
    replay: pixels(['............', '....#####..#', '..##.....###', '.##.....####', '.#..........', '#...........', '#...........', '#..........#', '.#........#.', '.##......##.', '..##....##..', '....####....']),
    volume2: pixels(SPEAKER) + pixels(WAVE_NEAR) + pixels(WAVE_FAR),
    volume1: pixels(SPEAKER) + pixels(WAVE_NEAR),
    volumeX: pixels(SPEAKER) + pixels(MUTED),
    gauge: pixels(['............', '#.....#.....', '##....##....', '###...###...', '####..####..', '#####.#####.', '#####.#####.', '####..####..', '###...###...', '##....##....', '#.....#.....', '............']),
    maximize: pixels(['####....####', '##........##', '#..........#', '#..........#', '............', '............', '............', '............', '#..........#', '#..........#', '##........##', '####....####']),
    minimize: pixels(['...#....#...', '...#....#...', '..##....##..', '####....####', '............', '............', '............', '............', '####....####', '..##....##..', '...#....#...', '...#....#...']),
    captions: pixels(['............', '############', '#..........#', '#.###..###.#', '#.#....#...#', '#.#....#...#', '#.###..###.#', '#..........#', '############', '............', '............', '............']),
    settings: pixels(['....#..#....', '.#.######.#.', '..########..', '.###....###.', '###......###', '.##......##.', '.##......##.', '###......###', '.###....###.', '..########..', '.#.######.#.', '....#..#....']),
    x: pixels(['............', '.##......##.', '.###....###.', '..###..###..', '...######...', '....####....', '....####....', '...######...', '..###..###..', '.###....###.', '.##......##.', '............']),
    menu: pixels(['............', '.##########.', '.##########.', '............', '............', '.##########.', '.##########.', '............', '............', '.##########.', '.##########.', '............']),
    arrowLeft: pixels(mirrored(ARROW_RIGHT)),
    arrowRight: pixels(ARROW_RIGHT),
    chevronRight: pixels(['............', '...##.......', '....##......', '.....##.....', '......##....', '.......##...', '.......##...', '......##....', '.....##.....', '....##......', '...##.......', '............']),
    check: pixels(['............', '............', '..........##', '.........###', '........###.', '##.....###..', '###...###...', '.###.###....', '..#####.....', '...###......', '....#.......', '............'])
  };

  function volumeIcon() {
    var range = document.querySelector('#volume .volume-range');
    var level = range ? Number(range.value) : 10;
    if (level <= 0) return 'volumeX';
    return level < 5 ? 'volume1' : 'volume2';
  }

  /* [selector, icon name or function, size in px] */
  var ICON_MAP = [
    ['svg.play-icon', 'play', 24],
    ['svg.pause-icon', 'pause', 24],
    ['#reset svg', 'replay', 24],
    ['svg.volume-icon', volumeIcon, 24],
    ['#playback-speed > button svg', 'gauge', 24],
    ['svg.enter-fullscreen-icon', 'maximize', 24],
    ['svg.exit-fullscreen-icon', 'minimize', 24],
    ['svg.captions-icon', 'captions', 24],
    ['svg.icon-gear', 'settings', 24],
    ['svg.icon-close', 'x', 24],
    ['svg.icon-clear', 'x', 12],
    ['svg.prev-icon', 'arrowLeft', 12],
    ['svg.next-icon', 'arrowRight', 12],
    ['#submit svg.check-icon', 'check', 12],
    ['#outline-content svg.carrot', 'chevronRight', 24],
    ['#outline-content svg.check-icon', 'check', 12],
    ['#playback-speed .selected-icon svg', 'check', 12]
  ];

  function swapIcons() {
    ICON_MAP.forEach(function (entry) {
      var svgs = document.querySelectorAll('#wrapper ' + entry[0]);
      for (var i = 0; i < svgs.length; i++) {
        var name = typeof entry[1] === 'function' ? entry[1]() : entry[1];
        if (svgs[i].getAttribute('data-ar-icon') === name) continue;
        svgs[i].setAttribute('data-ar-icon', name);
        svgs[i].setAttribute('viewBox', '0 0 12 12');
        svgs[i].setAttribute('width', entry[2]);
        svgs[i].setAttribute('height', entry[2]);
        svgs[i].setAttribute('shape-rendering', 'crispEdges');
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
    backdrop.id = 'ar-menu-backdrop';
    sidebar.parentNode.insertBefore(backdrop, sidebar);

    function isOpen() { return body.classList.contains('ar-menu-open'); }

    function setOpen(open) {
      body.classList.toggle('ar-menu-open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function addMenuIcon() {
      var wrapper = hamburger.querySelector('.menu-icon-wrapper');
      if (!wrapper || wrapper.querySelector('.ar-menu-icon')) return;
      var icon = document.createElement('span');
      icon.className = 'ar-menu-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML =
        '<svg class="ar-icon-closed" viewBox="0 0 12 12" width="24" height="24" shape-rendering="crispEdges">' + ICONS.menu + '</svg>' +
        '<svg class="ar-icon-open" viewBox="0 0 12 12" width="24" height="24" shape-rendering="crispEdges">' + ICONS.x + '</svg>';
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
     Stage banner: a box kept exactly over the slide, so the banner clips to it.
     It never takes clicks.
     ----------------------------------------------------------------------- */
  var lastBox = '';

  function ensureStage() {
    if (!STAGE_BANNER) return;
    var frame = document.getElementById('frame');
    var slide = document.getElementById('slide');
    if (!frame || !slide) return;
    var stage = document.getElementById('ar-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'ar-stage';
      stage.setAttribute('aria-hidden', 'true');
      stage.innerHTML = '<div id="ar-banner"></div>';
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

  function replay(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function showBanner(index) {
    var banner = document.getElementById('ar-banner');
    if (!banner) return;
    banner.textContent = 'STAGE ' + (index + 1);
    replay(banner, 'is-showing');
  }

  /* -----------------------------------------------------------------------
     The level: one gem per slide along the ground, and the robot standing on
     the current one. A gem lights up once its slide has been viewed. All read
     from the menu rows, so it stands aside in a course with no menu.
     ----------------------------------------------------------------------- */
  var GEM_SVG =
    '<span class="ar-gem-dark">' + spriteSvg(GEM, GEM_DARK) + '</span>' +
    '<span class="ar-gem-lit">' + spriteSvg(GEM, GEM_LIT) + '</span>';
  var HERO_SVG =
    '<span class="ar-step-a">' + spriteSvg(HERO_STEP_A, HERO_COLOURS) + '</span>' +
    '<span class="ar-step-b">' + spriteSvg(HERO_STEP_B, HERO_COLOURS) + '</span>' +
    '<span id="ar-pop">+1</span>';

  var lastIndex = -1;
  var walkTimer = null;

  function slideRows() {
    return Array.prototype.slice.call(document.querySelectorAll('#outline-content .cs-listitem:not(.is-scene)'));
  }

  function pad(number) {
    return number < 10 ? '0' + number : String(number);
  }

  function numberRows(rows) {
    rows.forEach(function (row, index) {
      var label = row.querySelector('.linkText');
      if (label && label.getAttribute('data-ar-n') !== pad(index + 1)) label.setAttribute('data-ar-n', pad(index + 1));
    });
    var every = document.querySelectorAll('#outline-content .cs-listitem');
    for (var i = 0; i < every.length; i++) every[i].style.setProperty('--ar-i', Math.min(i, 24));
  }

  function updateTrack(track, rows, current) {
    var gems = track.querySelector('.ar-gems');
    var hero = track.querySelector('.ar-hero');
    if (gems.childElementCount !== rows.length) {
      gems.textContent = '';
      rows.forEach(function () {
        var gem = document.createElement('i');
        gem.innerHTML = GEM_SVG;
        gems.appendChild(gem);
      });
    }

    /* Whole-pixel sizes keep the art crisp. A very long course drops the level
       rather than turn it into specks. */
    var slot = rows.length ? (track.parentNode.getBoundingClientRect().width - 32) / rows.length : 0;
    track.style.display = rows.length < 2 || slot < 10 ? 'none' : '';
    track.style.setProperty('--ar-gem', (slot >= 20 ? 16 : 8) + 'px');

    var fresh = false;
    rows.forEach(function (row, index) {
      var gem = gems.children[index];
      var lit = index === current || row.classList.contains('cs-viewed');
      if (lit && !gem.classList.contains('is-lit')) fresh = true;
      gem.classList.toggle('is-lit', lit);
      gem.classList.toggle('is-now', index === current);
    });

    hero.style.left = ((current + 0.5) / Math.max(rows.length, 1) * 100) + '%';
    return fresh;
  }

  /* Free space between the course title and the links in the top bar */
  function placeHud(hud, rows) {
    var host = document.getElementById('top-bar');
    if (hud.parentNode !== host) host.appendChild(hud);
    var hostBox = host.getBoundingClientRect();
    var start = hostBox.left + 20;
    var end = hostBox.right - 16;
    var hamburger = document.getElementById('hamburger');
    var title = document.querySelector('#top-bar .presentation-title');
    var links = document.getElementById('links-right');
    if (hamburger && hamburger.getBoundingClientRect().width > 0 && !document.body.classList.contains('ar-menu-open')) {
      start = Math.max(start, hamburger.getBoundingClientRect().right + 8);
    }
    if (title) {
      var titleBox = title.getBoundingClientRect();
      if (titleBox.width > 0) start = Math.max(start, titleBox.left + Math.max(titleBox.width, title.scrollWidth) + 20);
    }
    /* Measures what's inside: in mobile view the empty container still reports a width */
    if (links) {
      var linkItems = links.querySelectorAll('button, a, .cs-button');
      for (var i = 0; i < linkItems.length; i++) {
        var linkBox = linkItems[i].getBoundingClientRect();
        if (linkBox.width > 0) end = Math.min(end, linkBox.left - 16);
      }
    }
    hud.style.right = (hostBox.right - end) + 'px';
    var room = end - start;
    hud.style.display = rows.length < 2 || room < 120 ? 'none' : 'flex';
    hud.querySelector('.ar-hud-gems').style.display = room < 260 ? 'none' : '';
  }

  function setText(element, text) {
    if (element.textContent !== text) element.textContent = text;
  }

  function updateProgress() {
    var bar = document.getElementById('bottom-bar');
    var top = document.getElementById('top-bar');
    if (!bar || !top) return;
    var rows = slideRows();
    numberRows(rows);

    var track = document.getElementById('ar-track');
    var hud = document.getElementById('ar-hud');

    if (!track) {
      track = document.createElement('div');
      track.id = 'ar-track';
      track.setAttribute('aria-hidden', 'true');
      track.innerHTML = '<div class="ar-gems"></div><div class="ar-hero">' + HERO_SVG + '</div>';
      bar.appendChild(track);
    }
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'ar-hud';
      hud.setAttribute('aria-hidden', 'true');
      hud.innerHTML =
        '<span class="ar-hud-gems"><i>' + spriteSvg(GEM, GEM_LIT) + '</i><b></b></span>' +
        '<span class="ar-hud-stage">STAGE <b></b></span>';
      top.appendChild(hud);
    }

    var index = rows.findIndex(function (row) { return row.classList.contains('cs-selected'); });
    if (index < 0) index = Math.max(lastIndex, 0);

    var fresh = false;
    if (rows.length) {
      fresh = updateTrack(track, rows, index);
      var viewed = rows.filter(function (row, i) { return i === index || row.classList.contains('cs-viewed'); }).length;
      setText(hud.querySelector('.ar-hud-gems b'), 'x' + pad(viewed));
      setText(hud.querySelector('.ar-hud-stage b'), pad(index + 1) + '/' + pad(rows.length));
    } else {
      track.style.display = 'none';
    }
    placeHud(hud, rows);

    if (index !== lastIndex) {
      if (lastIndex !== -1) {
        var hero = track.querySelector('.ar-hero');
        hero.classList.add('is-walking');
        clearTimeout(walkTimer);
        walkTimer = setTimeout(function () { hero.classList.remove('is-walking'); }, 720);
        if (fresh) replay(hero.querySelector('#ar-pop'), 'is-popping');
        if (STAGE_BANNER) showBanner(index);
      }
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
    /* Text gets wider or narrower when the real font replaces the fallback */
    if (document.fonts) document.fonts.addEventListener('loadingdone', schedule);
    document.addEventListener('input', function (event) {
      if (event.target.closest && event.target.closest('#volume')) swapIcons();
    }, true);
  }

  start();
})();
