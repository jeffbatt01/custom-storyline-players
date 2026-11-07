# Whimsy Player

A playful skin on a warm, dotted paper backdrop.

A skin for the Storyline 360 Modern Player: a `player.css` and `player.js` that load on top of a published course. None of Storyline's own files are edited.

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

Order matters: the CSS link must come after `output.min.css` so its rules override the player.

## Attach to a SCORM or cmi5 package

The same steps work for SCORM 1.2, SCORM 2004 and cmi5 publishes. In all three the LMS runs the course in `index_lms.html`, so that's the file that needs the two lines. SCORM packages start at `launcher.html`, which opens `index_lms.html`, and cmi5 packages open `index_lms.html` directly.

1. In Storyline, publish to LMS and choose SCORM 1.2, SCORM 2004 or cmi5. Unzip the package if Storyline zipped it.
2. Copy the `custom-player` folder into the package folder, next to `index_lms.html`.
3. Open `index_lms.html` and add the same two lines as above: the stylesheet after the `output.min.css` link, the script after `bootstrapper.min.js`. Do the same in `story.html`. The LMS doesn't load it, but it keeps the package consistent.
4. **SCORM only:** open `imsmanifest.xml`, find `<file href="index_lms.html" />`, and add the player files under it:

   ```xml
         <file href="index_lms.html" />
         <file href="custom-player/player.css" />   <!-- add -->
         <file href="custom-player/player.js" />    <!-- add -->
   ```

   Most LMSs work without these entries, but the manifest is meant to list every file, and some LMSs check it. Leave `launcher.html` as the launch file. cmi5 has no file list, so leave `cmi5.xml` alone.
5. Zip the package so `imsmanifest.xml` (or `cmi5.xml`) sits at the top of the zip, not inside a folder. On a Mac, select the files inside the package folder and choose Compress, rather than compressing the folder itself. From Terminal:

   ```bash
   cd "path/to/package" && zip -r -X "../course.zip" . -x '.DS_Store'
   ```

6. Check the zip contains `custom-player/player.css` and `custom-player/player.js`, then upload it. Test it in SCORM Cloud or your LMS before sending it to learners: the skin should load, the course should play, and relaunching should offer Resume.

The skin changes only how the player looks. It doesn't change how the course navigates, scores or reports.

## Notes

- Republishing from Storyline overwrites `story.html` and `index_lms.html` (and `imsmanifest.xml`), so repeat the steps after each publish.
- Colours are CSS variables prefixed `--w-` at the top of `player.css`.
- `player.js` loads the Fredoka font from Google Fonts. If a network blocks Google Fonts, the skin falls back to system fonts and the course still loads without delay.
