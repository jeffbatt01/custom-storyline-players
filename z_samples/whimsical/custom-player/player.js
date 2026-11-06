/* Whimsy player skin for Articulate Storyline. See player.css for install steps.
   Everything here is decoration: it never changes how the course navigates,
   scores, or reports, and it relies only on IDs shared by every Modern Player. */
(function () {
  'use strict';

  if (window.__whimsyPlayer) return;
  window.__whimsyPlayer = true;

  /* -----------------------------------------------------------------------
     Change these to change the personality
     ----------------------------------------------------------------------- */
  var COLORS = ['#ff7eb6', '#ffd23f', '#4be3bb', '#6fd0ff', '#a884ff', '#ff8a66'];

  var CONTROLS = [
    { sel: '#next', burst: 'star', quips: ['Onward!', 'Wheee!', "Let's go!", 'Next adventure!', 'Boing!'] },
    { sel: '#prev', burst: 'heart', quips: ['Hop back!', 'Rewind!', 'One more look?', 'Back we go!'] },
    { sel: '#submit', burst: 'star', quips: ['You got this!', 'Ta-da!', 'Lock it in!'] },
    { sel: '#hamburger', burst: 'circle', quips: ['Peek inside!', 'Feed me clicks!', 'Boo!'] },
    /* No quips: a bubble here would cover the volume slider that opens on hover */
    { sel: '#volume > button', burst: 'note', quips: [] },
    { sel: '#full-screen-toggle', burst: 'star', quips: ['Go big!', 'Super size!', 'Biggify!'] },
    { sel: '#play-pause', burst: 'circle', quips: ['Hit it!', 'Hold that thought!'] },
    { sel: '#reset', burst: 'circle', quips: ['Encore!', 'Once more!'] }
  ];

  var STAR = 'M12 1.8l3 6.6 7.2.8-5.4 4.8 1.5 7.1L12 17.5l-6.3 3.6 1.5-7.1L1.8 9.2 9 8.4z';
  var HEART = 'M12 21s-9.5-5.9-9.5-12.2C2.5 5.4 5 3.2 7.7 3.2c1.8 0 3.4 1 4.3 2.6.9-1.6 2.5-2.6 4.3-2.6 2.7 0 5.2 2.2 5.2 5.6C21.500 15.100 12 21 12 21z';
  var INK = '#2a1a4a';

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = !window.matchMedia || window.matchMedia('(hover: hover)').matches;
  var finaleDone = false;
  var lastIndex = -1;
  var outlineWatched = null;
  var outlineObserver = null;

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function shape(path, fill, strokeWidth) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '" fill="' + fill +
      '" stroke="' + INK + '" stroke-width="' + strokeWidth + '" stroke-linejoin="round"/></svg>';
  }

  function circle(fill) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="' + fill +
      '" stroke="' + INK + '" stroke-width="2"/></svg>';
  }

  /* -----------------------------------------------------------------------
     Effects layer
     ----------------------------------------------------------------------- */
  function fxLayer() {
    var layer = document.getElementById('whimsy-fx');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'whimsy-fx';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    return layer;
  }

  function makeBit(kind) {
    var bit = document.createElement('div');
    var color = pick(COLORS);
    bit.className = 'whimsy-bit';
    if (kind === 'note') {
      bit.textContent = pick(['♪', '♫', '♩']);
      bit.style.color = INK;
    } else if (kind === 'heart') {
      bit.innerHTML = shape(HEART, color, 2);
    } else if (kind === 'circle') {
      bit.innerHTML = circle(color);
    } else {
      bit.innerHTML = shape(STAR, color, 2);
    }
    return bit;
  }

  function burst(x, y, kind, count, reach) {
    if (calm || !Element.prototype.animate) return;
    var layer = fxLayer();
    for (var i = 0; i < count; i++) {
      (function (index) {
        var bit = makeBit(kind);
        var angle = (Math.PI * 2 * index) / count + Math.random() * 0.5;
        var distance = reach * (0.55 + Math.random() * 0.6);
        var endX = x + Math.cos(angle) * distance - 9;
        var endY = y + Math.sin(angle) * distance - 9;
        var spin = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 300);
        layer.appendChild(bit);
        var animation = bit.animate([
          { transform: 'translate(' + (x - 9) + 'px,' + (y - 9) + 'px) scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + endX + 'px,' + endY + 'px) scale(1) rotate(' + (spin * 0.7) + 'deg)', opacity: 1, offset: 0.65 },
          { transform: 'translate(' + endX + 'px,' + (endY + reach * 0.35) + 'px) scale(.5) rotate(' + spin + 'deg)', opacity: 0 }
        ], { duration: 750 + Math.random() * 350, easing: 'cubic-bezier(.15,.7,.3,1)' });
        animation.onfinish = animation.oncancel = function () { bit.remove(); };
      })(i);
    }
  }

  /* Falling confetti for reaching the last slide */
  function finale() {
    if (calm || !Element.prototype.animate) return;
    var layer = fxLayer();
    var width = window.innerWidth;
    var height = window.innerHeight;
    for (var i = 0; i < 70; i++) {
      (function () {
        var bit = makeBit(pick(['star', 'heart', 'circle']));
        var startX = Math.random() * width;
        var driftX = startX + (Math.random() - 0.5) * 160;
        var spin = 360 + Math.random() * 720;
        layer.appendChild(bit);
        var animation = bit.animate([
          { transform: 'translate(' + startX + 'px,-30px) rotate(0deg)' },
          { transform: 'translate(' + driftX + 'px,' + (height + 30) + 'px) rotate(' + spin + 'deg)' }
        ], { duration: 2000 + Math.random() * 1800, delay: Math.random() * 900, easing: 'cubic-bezier(.3,.3,.7,1)', fill: 'backwards' });
        animation.onfinish = animation.oncancel = function () { bit.remove(); };
      })();
    }
  }

  /* -----------------------------------------------------------------------
     Speech bubbles
     ----------------------------------------------------------------------- */
  function hideQuip() {
    var quip = document.querySelector('.whimsy-quip');
    if (quip) quip.remove();
  }

  function showQuip(target, text) {
    hideQuip();
    var box = target.getBoundingClientRect();
    if (!box.width) return;
    var quip = document.createElement('div');
    quip.className = 'whimsy-quip';
    quip.textContent = text;
    fxLayer().appendChild(quip);

    var half = quip.offsetWidth / 2;
    var wanted = box.left + box.width / 2;
    var center = Math.max(half + 8, Math.min(window.innerWidth - half - 8, wanted));
    /* Leaves room for the player's own tooltip, which also appears above a control */
    var above = box.top - 54;
    /* Top-of-screen controls speak from underneath instead */
    if (above - quip.offsetHeight < 4) {
      quip.style.translate = '-50% 0';
      above = box.bottom + 54;
      quip.classList.add('is-below');
    }
    quip.style.left = center + 'px';
    quip.style.top = above + 'px';
    quip.style.setProperty('--w-tail', (half + wanted - center) + 'px');
  }

  function matchControl(node) {
    if (!node || !node.closest) return null;
    for (var i = 0; i < CONTROLS.length; i++) {
      var element = node.closest(CONTROLS[i].sel);
      if (element) return { config: CONTROLS[i], element: element };
    }
    return null;
  }

  /* -----------------------------------------------------------------------
     Interaction, handled by listening only so the player's clicks still work
     ----------------------------------------------------------------------- */
  function bindEvents() {
    document.addEventListener('click', function (event) {
      var hit = matchControl(event.target);
      if (hit) {
        hideQuip();
        var box = hit.element.getBoundingClientRect();
        burst(box.left + box.width / 2, box.top + box.height / 2, hit.config.burst, 16, 95);
        return;
      }
      var row = event.target.closest && event.target.closest('#outline-content .cs-listitem:not(.is-scene)');
      if (row) {
        var rowBox = row.getBoundingClientRect();
        burst(rowBox.left + 40, rowBox.top + rowBox.height / 2, 'star', 10, 70);
      }
    }, true);

    if (canHover) {
      document.addEventListener('pointerover', function (event) {
        var hit = matchControl(event.target);
        if (!hit || !hit.config.quips.length) return;
        var related = event.relatedTarget;
        if (related && related.closest && related.closest(hit.config.sel) === hit.element) return;
        showQuip(hit.element, pick(hit.config.quips));
      }, true);

      document.addEventListener('pointerout', function (event) {
        var hit = matchControl(event.target);
        if (!hit) return;
        var related = event.relatedTarget;
        if (related && related.closest && related.closest(hit.config.sel) === hit.element) return;
        hideQuip();
      }, true);

      if (!calm) document.addEventListener('pointermove', trackEyes, { passive: true });
    }
  }

  var eyeFrame = 0;
  function trackEyes(event) {
    if (eyeFrame) return;
    var pointerX = event.clientX;
    var pointerY = event.clientY;
    eyeFrame = requestAnimationFrame(function () {
      eyeFrame = 0;
      var eyes = document.querySelectorAll('.whimsy-eye');
      for (var i = 0; i < eyes.length; i++) {
        var box = eyes[i].getBoundingClientRect();
        var pupil = eyes[i].firstChild;
        if (!box.width || !pupil) continue;
        var angle = Math.atan2(pointerY - (box.top + box.height / 2), pointerX - (box.left + box.width / 2));
        pupil.style.transform = 'translate(' + (Math.cos(angle) * 2).toFixed(1) + 'px,' + (Math.sin(angle) * 2).toFixed(1) + 'px)';
      }
    });
  }

  /* -----------------------------------------------------------------------
     Decorations. Each is safe to re-run if the player re-renders its controls.
     ----------------------------------------------------------------------- */
  function ensureSky(frame) {
    if (document.getElementById('whimsy-sky')) return;
    var sky = document.createElement('div');
    sky.id = 'whimsy-sky';
    sky.setAttribute('aria-hidden', 'true');
    /* left %, top %, size px, shape */
    var spots = [
      [6, 11, 34, 'star'], [24, 7, 22, 'heart'], [43, 13, 28, 'circle'], [64, 6, 36, 'star'],
      [83, 12, 26, 'heart'], [94, 7, 20, 'circle'], [14, 19, 18, 'circle'], [55, 18, 18, 'star'],
      [75, 20, 16, 'circle'], [4, 83, 26, 'heart'], [20, 88, 18, 'star'], [36, 82, 30, 'circle'],
      [52, 86, 22, 'star'], [70, 81, 28, 'heart'], [92, 82, 30, 'star']
    ];
    spots.forEach(function (spot, index) {
      var color = COLORS[index % COLORS.length];
      var holder = document.createElement('div');
      holder.innerHTML = spot[3] === 'heart' ? shape(HEART, color, 1.6) :
        spot[3] === 'circle' ? circle(color) : shape(STAR, color, 1.6);
      var svg = holder.firstChild;
      svg.setAttribute('width', spot[2]);
      svg.setAttribute('height', spot[2]);
      svg.style.left = spot[0] + '%';
      svg.style.top = spot[1] + '%';
      svg.style.setProperty('--dur', (6 + (index % 5) * 1.5) + 's');
      svg.style.setProperty('--delay', (-index * 0.8) + 's');
      sky.appendChild(svg);
    });
    frame.insertBefore(sky, frame.firstChild);
  }

  function ensureMonster() {
    var wrapper = document.querySelector('#hamburger .menu-icon-wrapper');
    if (!wrapper || wrapper.querySelector('.whimsy-monster')) return;
    var monster = document.createElement('span');
    monster.className = 'whimsy-monster';
    monster.setAttribute('aria-hidden', 'true');
    monster.innerHTML = '<span class="whimsy-eye"><span class="whimsy-pupil"></span></span>' +
      '<span class="whimsy-eye"><span class="whimsy-pupil"></span></span>';
    wrapper.insertBefore(monster, wrapper.firstChild);
  }

  function ensureTitle() {
    var label = document.querySelector('.presentation-title-text');
    if (!label || label.querySelector('.whimsy-sr')) return;
    var text = label.textContent.trim();
    if (!text) return;
    label.textContent = '';

    var spoken = document.createElement('span');
    spoken.className = 'whimsy-sr';
    spoken.textContent = text;
    label.appendChild(spoken);

    var letters = document.createElement('span');
    letters.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(text, function (character, index) {
      var letter = document.createElement('span');
      letter.className = 'whimsy-letter';
      letter.style.setProperty('--i', index);
      letter.textContent = character;
      letters.appendChild(letter);
    });
    label.appendChild(letters);
  }

  function slideRows() {
    return Array.prototype.slice.call(document.querySelectorAll('#outline-content .cs-listitem:not(.is-scene)'));
  }

  /* The trail sits in the free space left of the controls. It stands aside if
     the course has a seekbar, or there's no menu to read slides from. */
  function updateTrail() {
    var bar = document.getElementById('bottom-bar');
    if (!bar) return;
    var rows = slideRows();
    var seek = document.getElementById('seek');
    var seekShown = seek && seek.getBoundingClientRect().width > 0;
    var barBox = bar.getBoundingClientRect();
    var limit = barBox.right;
    ['#misc-controls', '#nav-controls'].forEach(function (selector) {
      var element = document.querySelector(selector);
      if (element && element.getBoundingClientRect().width > 0) {
        limit = Math.min(limit, element.getBoundingClientRect().left);
      }
    });
    var room = limit - barBox.left - 60;
    var trail = document.getElementById('whimsy-trail');

    if (rows.length < 2 || seekShown || room < 120 || !barBox.width) {
      if (trail) trail.style.display = 'none';
      return;
    }

    if (!trail) {
      trail = document.createElement('div');
      trail.id = 'whimsy-trail';
      trail.setAttribute('aria-hidden', 'true');
      trail.innerHTML = '<div class="whimsy-fill"></div><div class="whimsy-hopper">' +
        shape(STAR, '#ffd23f', 2) + '</div>';
      bar.appendChild(trail);
    }

    var width = Math.min(room, 460);
    trail.style.display = 'block';
    trail.style.width = width + 'px';
    trail.style.setProperty('--w-trail-width', width + 'px');

    var step = width / (rows.length - 1);
    var index = rows.findIndex(function (row) { return row.classList.contains('cs-selected'); });
    if (index < 0) index = Math.max(lastIndex, 0);

    /* Skip the dots if a long course would crowd them together */
    var dots = trail.querySelectorAll('.whimsy-dot');
    var wantDots = step >= 12 ? rows.length : 0;
    if (dots.length !== wantDots) {
      Array.prototype.forEach.call(dots, function (dot) { dot.remove(); });
      for (var d = 0; d < wantDots; d++) {
        var fresh = document.createElement('div');
        fresh.className = 'whimsy-dot';
        trail.insertBefore(fresh, trail.querySelector('.whimsy-hopper'));
      }
      dots = trail.querySelectorAll('.whimsy-dot');
    }
    Array.prototype.forEach.call(dots, function (dot, i) {
      dot.style.left = (i * step) + 'px';
      dot.classList.toggle('is-seen', rows[i].classList.contains('cs-viewed'));
    });

    trail.querySelector('.whimsy-fill').style.width = (index * step) + 'px';
    var hopper = trail.querySelector('.whimsy-hopper');
    hopper.style.left = (index * step) + 'px';

    if (index !== lastIndex) {
      if (lastIndex !== -1) {
        hopper.classList.remove('is-hopping');
        void hopper.offsetWidth;
        hopper.classList.add('is-hopping');
      }
      if (index === rows.length - 1 && lastIndex !== -1 && !finaleDone) {
        finaleDone = true;
        finale();
      }
      lastIndex = index;
    }
  }

  function watchOutline() {
    var outline = document.getElementById('outline-content');
    if (!outline || outline === outlineWatched) return;
    if (outlineObserver) outlineObserver.disconnect();
    outlineWatched = outline;
    outlineObserver = new MutationObserver(updateTrail);
    outlineObserver.observe(outline, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  function decorate() {
    var frame = document.getElementById('frame');
    if (!frame) return;
    ensureSky(frame);
    ensureMonster();
    ensureTitle();
    watchOutline();
    updateTrail();
  }

  /* -----------------------------------------------------------------------
     Start once the player has built itself
     ----------------------------------------------------------------------- */
  function start() {
    var frame = document.getElementById('frame');
    if (!frame || !document.getElementById('next')) {
      setTimeout(start, 200);
      return;
    }
    bindEvents();
    decorate();

    var pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        decorate();
      }, 200);
    }
    new MutationObserver(schedule).observe(frame, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
  }

  start();
})();
