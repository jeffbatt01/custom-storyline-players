# Custom Storyline Player

Reusable CSS/JS overrides for the Storyline 360 HTML5 player. None of Storyline's own files are edited.

## Attach to a course

1. Copy the `custom-player` folder into the published output folder (next to `story.html`).
2. Open `story.html` and add two lines at the very end:

```html
  <link rel="stylesheet" href="html5/data/css/output.min.css" data-noprefix/>
  <link rel="stylesheet" href="custom-player/player.css"/>      <!-- add -->
</body>
<script src="html5/lib/scripts/bootstrapper.min.js"></script>
<script src="custom-player/player.js"></script>                 <!-- add -->
</html>
```

For an LMS publish, add the same two lines to `index_lms.html` (and `story.html` if present).

Order matters: the CSS link must come after `output.min.css` so its rules override the player.

## Notes

- Republishing from Storyline overwrites `story.html`, so re-add the two lines after each publish.
- `player.js` adds a `custom-player` class to `<body>` once the player is ready.
