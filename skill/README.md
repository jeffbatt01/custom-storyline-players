# Storyline Custom Player skill

A Claude skill that adds one of the players in this repo to someone's published Storyline course. It asks which player they want if they haven't said, asks for their published course if they haven't shared it, downloads the player from this repo on GitHub, and wires it into a web, SCORM 1.2, SCORM 2004 or cmi5 publish.

```
storyline-custom-player/
  SKILL.md                  What Claude follows: the steps, the player list, what to tell the user
  scripts/apply_player.py   Downloads a player and attaches it to a course folder or LMS zip
```

## Share it

Send people `storyline-custom-player.skill`, built with the command below.

- **Claude app (claude.ai or desktop):** open the `.skill` file in a chat and click **Save skill**, or upload it under Settings → Capabilities → Skills.
- **Claude Code:** unzip it into `~/.claude/skills/`, so the path is `~/.claude/skills/storyline-custom-player/SKILL.md`.

Then they ask something like "add the Sunny player to my course" and share their published course folder or zip. The skill downloads the player from the `main` branch, so changes you merge to `main` reach everyone without anyone reinstalling the skill.

## Update it

Edit `storyline-custom-player/SKILL.md` or the script, then rebuild the `.skill` file:

```bash
cd skill && rm -f storyline-custom-player.skill && zip -r -X storyline-custom-player.skill storyline-custom-player -x '*.DS_Store' '*__pycache__*'
```

When you add a player, add a row to the table in `SKILL.md` and its name to `KNOWN` in `scripts/apply_player.py`. The script also finds new players from GitHub on its own, but the table is what Claude shows people when it asks them to choose.

## Test it

```bash
python3 skill/storyline-custom-player/scripts/apply_player.py --list
python3 skill/storyline-custom-player/scripts/apply_player.py sunny "<copy of a published course>"
```

Add `--source .` to use this checkout instead of GitHub, which lets you test a player before it's merged to `main`.
