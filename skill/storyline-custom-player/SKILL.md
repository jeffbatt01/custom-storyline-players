---
name: storyline-custom-player
description: Apply a custom player skin (Professional, Whimsical, Sleek, Super, Sunny or Arcade) from github.com/jeffbatt01/custom-storyline-players to a published Articulate Storyline 360 course, for a web publish, SCORM 1.2, SCORM 2004 or cmi5 package. Use this skill whenever someone wants to reskin, theme, restyle or "add a custom player" to a Storyline course, swap one of these skins for another, or names any of these players, even if they don't say "skin" or name the repo, for example "make my Storyline course look less default", "put the arcade player on my SCORM package" or "can you add Jeff's player to this course?"
---

# Apply a custom Storyline player

This skill adds one of Jeff Batt's custom player skins to a course someone has already published from Storyline 360. A skin is a `custom-player/` folder (`player.css` and `player.js`) that loads on top of Storyline's Modern Player. Storyline's own files are never changed, apart from two lines added to the launch page, and for SCORM, the files list in `imsmanifest.xml`. A skin only changes how the player looks. It doesn't change how the course navigates, scores or reports to an LMS.

The bundled script `scripts/apply_player.py` does the download and the wiring. Your job is to get the two inputs it needs, run it, and explain the result.

## 1. Get the published course

You need the folder (or zip) Storyline wrote when the user clicked **Publish**. If the user hasn't given you one, ask for it before anything else. Without it there's nothing to attach the skin to. Something like:

> To add the player, I need your published course. In Storyline, publish to **Web** or **LMS** (SCORM 1.2, SCORM 2004 or cmi5), then add that output folder or zip to this conversation, or tell me its path.

Check what you were given:

| What it contains | What it is |
|---|---|
| `story.html`, no `imsmanifest.xml` or `cmi5.xml` | Web publish |
| `imsmanifest.xml` | SCORM package (1.2 or 2004) |
| `cmi5.xml` | cmi5 package |
| A `.story` file | The Storyline project, not a publish. Ask them to publish first: a skin can only be added to published output. |
| A `.zip` | Probably an LMS package. The script unzips it for you. |

If the folder holds several courses, or the publish sits one level down (Storyline often makes `<Course name> - Storyline output/`), point the script at the folder that contains `story.html` or `index_lms.html`.

## 2. Pick the player

If the user already named a player, use it. Otherwise ask, and show the choices so they can pick without visiting GitHub:

| Player | Look |
|---|---|
| **Professional** | Clean and corporate: light surfaces, DM Sans, quiet controls. A safe default for workplace training. |
| **Whimsical** | Playful, on a warm dotted-paper backdrop with Fredoka type and bouncy controls. |
| **Sleek** | Near-black surfaces, square edges, one acid accent. Modern and minimal. |
| **Super** | Comic-book hero: primary colours, thick ink lines, slanted action buttons. |
| **Sunny** | A cartoon summer's day: blue sky, clouds, a smiling sun, and a garden that blooms as the learner progresses. |
| **Arcade** | A retro console platformer: pixel type, a dusk sky, and a little robot who walks a row of gems as the learner moves through. |

A picker tool may allow only four options per question. If so, ask in plain text with the table above rather than dropping players. To see the current list straight from GitHub, which may include players newer than this table, run `python3 scripts/apply_player.py --list`.

## 3. Run the script

```bash
python3 <skill-dir>/scripts/apply_player.py <player> "<course folder or zip>"
```

`<player>` is the lowercase name: `professional`, `whimsical`, `sleek`, `super`, `sunny` or `arcade`.

The script:
1. Downloads the player's files from the repo's `main` branch on GitHub.
2. Replaces any `custom-player/` folder already in the course, so switching skins never leaves a mix of two.
3. Adds the stylesheet line after Storyline's `output.min.css` link, and the script line after `bootstrapper.min.js`, in `story.html` and, for LMS packages, `index_lms.html`. Running it twice doesn't add the lines twice.
4. For SCORM, lists the player files in `imsmanifest.xml` next to `index_lms.html`.
5. For a zip, unzips it to a folder beside the zip, skins that folder, and writes a new zip named `<original> - <player>.zip`. The original zip isn't changed.

Options:
- `--zip` re-zips a folder package after skinning it, ready for an LMS. Use it for SCORM or cmi5 folders the user plans to upload.
- `--source <path>` uses a local copy of the repo instead of downloading, for when there's no internet access or GitHub is blocked.
- `--ref <branch>` downloads from another branch or tag.

If the download fails, the repo may be unreachable from this machine. Ask the user to download the repo as a zip from https://github.com/jeffbatt01/custom-storyline-players (**Code → Download ZIP**), unzip it, and give you the path, then rerun with `--source`.

Read the script's output. It says which publish type it found and which files it changed. If it stops with an error, such as no `output.min.css` link found, the course may use the Classic Player or a very old Storyline version. Tell the user. These skins are built for the Modern Player.

## 4. Let them see it

For a **web publish**, offer to preview it. Storyline courses won't run from a `file://` URL, so serve the folder:

```bash
cd "<course folder>" && python3 -m http.server 8000
```

Then open `http://localhost:8000/story.html`. If the course was viewed before, Storyline may show its Resume screen first. If the old look still shows, hard-refresh, since the browser may have cached the files.

For an **LMS package**, the honest test is the LMS itself. Suggest uploading the zip to SCORM Cloud (free at cloud.scorm.com) or their own LMS: the skin should load, the course should play, and relaunching should offer Resume. Opening `index_lms.html` directly shows an "unable to acquire LMS API" error, which is expected outside an LMS.

## 5. Tell them what changed, and what to remember

Summarise in plain words: which player, which files changed, and where the zip is if one was made. Then pass on the one thing that bites people later:

**Republishing from Storyline overwrites the launch pages** (`story.html`, `index_lms.html`, `imsmanifest.xml`), which removes the skin. After each publish, run the skill again. It takes a few seconds.

The skins are MIT licensed, so the user can edit `custom-player/player.css` to change colours. Most players keep their colours as CSS variables at the top of the file.
