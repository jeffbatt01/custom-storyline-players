# Custom Storyline Players

Reusable skins for the Articulate Storyline 360 HTML5 player. Each player is a `player.js` and `player.css` that load on top of a published course. Storyline's own files are never edited, apart from the two lines added to `story.html`.

## Structure

```
<name>-player/custom-player/    Source of truth: edit the player here
  player.js
  player.css
z_samples/<name>/               Full published Storyline course, used for preview
  story.html                    Links custom-player/player.css and player.js
  custom-player/                Copy of <name>-player/custom-player/
  html5/ mobile/ story_content/ Storyline output: don't edit
tests/                          Test matrix for all players
```

Current players:

| Player | Source | Preview course | Port |
|---|---|---|---|
| Professional | `professional-player/` | `z_samples/professional/` | 8791 |
| Whimsical | `whimsical-player/` | `z_samples/whimsical/` | 8000 |
| Sleek | `sleek-player/` | `z_samples/sleek/` | 8792 |
| Super | `super-player/` | `z_samples/super/` | 8793 |
| Sunny | `sunny-player/` | `z_samples/sunny/` | 8794 |
| Arcade | `arcade-player/` | `z_samples/arcade/` | 8795 |

## Keep the two copies in sync

Every edit goes in `<name>-player/custom-player/`. A Claude Code hook ([.claude/hooks/sync-player.sh](.claude/hooks/sync-player.sh)) copies each file Claude edits there to `z_samples/<name>/custom-player/`.

The hook doesn't cover everything, so sync manually after any of these:

- Edits made outside Claude Code, in your own editor
- Files changed or added with a shell command
- A player edited before its sample course existed

```bash
cp -R <name>-player/custom-player/. z_samples/<name>/custom-player/
```

Neither the hook nor this command removes files, so delete a removed file from both copies. The hook also only copies from source to sample. If a change was made in `z_samples/<name>/custom-player/` (a quick tweak during preview, say), copy it back to the source first, or the next sync will overwrite it.

Check that all players match:

```bash
for d in *-player; do n=${d%-player}; diff -rq "$d/custom-player" "z_samples/$n/custom-player" && echo "$n in sync"; done
```

## Preview

Serve the course from its sample folder, since `<name>-player/` has no `story.html`:

```bash
cd z_samples/<name> && python3 -m http.server <port>
```

Then open `http://localhost:<port>/story.html`. Each sample has a `.claude/launch.json` with the same server and port. It's picked up when the sample folder is the working directory, not from the repo root. In the desktop app, the preview launcher can fail with `Operation not permitted` under `~/Documents`. Start the server from the shell instead, then open the URL in the browser pane.

Storyline remembers progress, so a reload usually lands on the Resume screen, which blocks clicks until you choose Resume or Restart.

A plain reload can also keep using a cached `player.css` or `player.js`, which makes a working fix look like it failed. If a change doesn't show up, hard-refresh, then check that the rule is actually in the loaded stylesheet.

Check each player on these before calling it done:

- The Resume screen
- A slide with a seekbar and one without (in the sample course, slides 3 and 1)
- A slide that hides the menu (slide 3)
- The menu at phone width, with a row tapped
- Keyboard focus on the menu button, open and closed, and on the "Back to top" link

Then run the test matrix, which loads each player across page counts from 1 to 1,000, course setups, phone view and Storyline's LMS mode. See [tests/README.md](tests/README.md). It measures rather than looks, and it can't stand in for a real SCORM publish, so it doesn't replace the checks above.

## Add a new player

1. Create `<name>-player/custom-player/` with `player.js` and `player.css`. Every new player needs the mobile menu fix (see **Mobile view** below): if it has an overlay menu, restore `display` on `#tabs` and `#sidebar-panels` while it's open, and give `#tabs .tab` a `min-width: max-content`.
2. Copy the full published Storyline output to `z_samples/<name>/`.
3. Sync the player into the sample with the command above.
4. Add the two lines to `z_samples/<name>/story.html`:

   ```html
     <link rel="stylesheet" href="html5/data/css/output.min.css" data-noprefix/>
     <link rel="stylesheet" href="custom-player/player.css"/>      <!-- add -->
   </body>
   <script src="html5/lib/scripts/bootstrapper.min.js"></script>
   <script src="custom-player/player.js"></script>                 <!-- add -->
   </html>
   ```

5. Add `z_samples/<name>/.claude/launch.json` with an unused port, and add the player to the table above.
6. Add the player to the lists at the top of `tests/harness.html`.

The folder names have to line up: `<name>-player` pairs with `z_samples/<name>`, and the sync check depends on that.

## Working with the Storyline player

- **Load order:** `player.css` must come after `output.min.css` so its rules win.
- **Republishing:** publishing from Storyline rewrites `story.html`, so the two lines have to be added again. For an LMS publish, add them to `index_lms.html` too.
- **Inline transforms:** the player positions its controls with inline transforms, so transforming a control directly throws it out of place. Animate an inner `.view-content` or a pseudo-element instead.
- **Re-rendering:** Storyline rebuilds parts of its UI when state changes (play/pause, volume, full screen). Anything injected into a control needs a `MutationObserver` to put it back.
- **Timing:** the player UI doesn't exist when the script first runs. Wait for it before touching it, as `whenPlayerReady` does in `professional-player/custom-player/player.js`.
- **Mobile view:** at phone width Storyline switches to `view-mobile`, which behaves differently:
  - The bars get separate `.top-ui-bg` background layers.
  - Control containers such as `#nav-controls` report zero width, so measure the buttons instead.
  - An overlay menu must restore `display` on `#tabs` and `#sidebar-panels`, not just `visibility`, or it opens empty.
  - Tabs are sized for Storyline's own font, so a tab label in a wider font gets clipped without `min-width: max-content`.
- **Start and Resume screen:** this is `.mobile-start-overlay`, on desktop too. It's outside `#wrapper`, and inline styles on it need `!important` to override.
- **Keyboard focus:** the player draws focus as its own `.tab-focus-box` element, not a CSS outline, so a CSS outline on controls gives a second ring. Style the box instead. It's placed once, when focus lands, so it stays behind on a control the skin moves. For the menu button, hide the box with `:has(#hamburger:focus)` and put the ring on the icon, scoped to `.show-focus`.
- **Menu button:** its `.menu-icon-wrapper` has padding that leaves no room for a custom icon and pushes it off-centre. Remove the padding and centre the icon, and keep the open button clear of the panel's edge.
- **Slide dimming:** the player sets `.slide-container` to 60% opacity while the "Back to top" link has focus, and `#slide` is transparent. A skin with art behind the slide needs a solid `background-color` on `#slide`, or the art shows through. On a light theme use a light colour, since slides may also fade over it.
- **Prefixes:** keep each player's injected classes, IDs and CSS variables under its own prefix: `cp-` for Professional, `whimsy-` and `--w-` for Whimsical, `sl-` and `--sl-` for Sleek, `su-` and `--su-` for Super, `sun-` and `--sun-` for Sunny, `ar-` and `--ar-` for Arcade.
- **Decoration only:** a skin must not change how a course navigates, scores or reports.
- **Fonts:** load web fonts from `player.js` with an injected `<link>`, never an `@import` in `player.css`. An `@import` holds up the player script until the font host answers, which delayed the course by 25 seconds in a test with a host that never responds, as on an LMS network that blocks Google Fonts. Keep a system-font fallback, and re-measure any layout that depends on text width on `document.fonts`' `loadingdone` event.
- **Any page count:** read pages from the menu rows, which stay in the DOM when a scene collapses, so a course with no menu has none. Progress widgets must handle 0, 1 and 2 rows and stand aside when pages would be too thin to see (under about 4px each), keeping a text readout. A long menu needs `overflow-x: hidden` on `#outline-content`.
- **SCORM and other LMS publishes:** the player runs in `index_lms.html` itself, with the driver functions on its own `window`, so that's the file that needs the two lines. Check the published zip contains `custom-player/`. Don't rely on browser storage, or on `window.top` or `parent`, and never call the driver from a skin.
