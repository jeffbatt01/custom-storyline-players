# Player test matrix

Loads every player in the real Storyline player across many course shapes, and flags anything that fails with a skin but not without one. Nothing on disk is changed: the server rewrites the sample course's menu data as it serves it.

## Run it

```bash
python3 tests/harness.py
```

Then open one of these in a browser, and keep the tab visible while it runs. The status line at the top counts up, and says `done` when it has finished.

- Everything, about 12 minutes: `http://localhost:8799/harness.html?name=run`
- One player, plus the no-skin control: `http://localhost:8799/harness.html?players=sunny&name=run`
- Chosen suites: `http://localhost:8799/harness.html?suite=lms,hang&name=run`

When the status says `done`, read the result. It exits with 1 if anything failed:

```bash
python3 tests/report.py run
```

Add `--detail` to list every progress widget and readout.

## What it covers

| Suite | What it loads |
|---|---|
| `shapes` | 1, 2, 3, 11, 30, 100 and 300 pages, flat menus, collapsed scenes, long titles, no menu, no bottom bar, no title |
| `phone` | Phone view for the main shapes |
| `lms` | Storyline's LMS mode with a stub driver that logs each call, at desktop, small-frame and phone sizes |
| `extra` | 1,000 pages, menu search, plus repeats at the widest readouts |
| `resume` | LMS mode loaded twice, so the second load gets the saved resume data |
| `hang` | A font host that never answers, which must not delay the course |

Each load checks that the skin's script started, that there are no errors, that Next and the menu work, that the last row can be reached, and that nothing overlaps or runs off screen, including with the last page current.

## What it can't tell you

- **Real SCORM:** it's a stub driver, not `index_lms.html` or an LMS. Check a real publish in SCORM Cloud or your LMS before relying on it.
- **Long courses:** the sample has 11 or 12 real slides, so longer menus repeat them. This tests layout at that length, not navigating that many different slides.
- **Scoring:** it never finishes a quiz or a course, so passing, failing and completion calls aren't exercised.
- **Save counts:** it compares which driver functions get called, not how many times, because Storyline batches its saves on a timer and the counts vary even with no skin.
- **Looks:** it measures positions and can't tell if something looks wrong.

## LMS packages

`lms-swap.sh <name>` puts a player into the SCORM 1.2, SCORM 2004 and cmi5 publishes in `z_scorm_samples/`, replacing the one there. `lms-host.html` runs those packages against a stub SCORM runtime: serve the repo root and open `/tests/lms-host.html`. See the LMS packages section of the root `CLAUDE.md`.
