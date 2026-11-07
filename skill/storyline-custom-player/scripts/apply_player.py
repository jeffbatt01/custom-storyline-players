#!/usr/bin/env python3
"""Add a custom player skin to a published Articulate Storyline 360 course.

    python3 apply_player.py <player> <course folder or .zip> [--zip] [--source DIR] [--ref BRANCH]
    python3 apply_player.py --list

Works with web publishes (story.html), SCORM 1.2 / 2004 (imsmanifest.xml) and
cmi5 (cmi5.xml) packages. Downloads the player from
github.com/jeffbatt01/custom-storyline-players, or copies it from a local
checkout with --source. Safe to run again: it replaces the previous skin
rather than adding a second one.
"""

import argparse
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.error
import urllib.request
import zipfile

REPO = "jeffbatt01/custom-storyline-players"
CSS_LINE = '<link rel="stylesheet" href="custom-player/player.css"/>'
JS_LINE = '<script src="custom-player/player.js"></script>'
KNOWN = ["professional", "whimsical", "sleek", "super", "sunny", "arcade"]
SKIP = {".DS_Store", "README.md"}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "storyline-custom-player-skill"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def list_players(ref):
    try:
        items = json.loads(fetch(f"https://api.github.com/repos/{REPO}/contents?ref={ref}"))
        return sorted(i["name"][: -len("-player")] for i in items
                      if i["type"] == "dir" and i["name"].endswith("-player"))
    except Exception as e:
        print(f"(couldn't list players from GitHub: {e}; showing the built-in list)", file=sys.stderr)
        return KNOWN


def download_player(name, ref, dest):
    """Copy <name>-player/custom-player/ from GitHub into dest."""
    path = f"{name}-player/custom-player"
    files = None
    try:
        items = json.loads(fetch(f"https://api.github.com/repos/{REPO}/contents/{path}?ref={ref}"))
        files = []
        stack = list(items)
        while stack:
            i = stack.pop()
            if i["type"] == "dir":
                stack.extend(json.loads(fetch(i["url"])))
            elif i["name"] not in SKIP:
                files.append(i["path"][len(path) + 1:])
    except urllib.error.HTTPError as e:
        if e.code == 404:
            sys.exit(f"No player called '{name}' on '{ref}' in {REPO}. Players: {', '.join(list_players(ref))}")
        # Rate limits and the like: fall back to the two files every player has.
    except Exception:
        pass
    if files is None:
        files = ["player.css", "player.js"]
    for rel in files:
        url = f"https://raw.githubusercontent.com/{REPO}/{ref}/{path}/{rel}"
        try:
            data = fetch(url)
        except Exception as e:
            sys.exit(f"Couldn't download {url}: {e}\n"
                     f"Download the repo as a zip from https://github.com/{REPO}, unzip it, "
                     f"and rerun with --source <that folder>.")
        out = os.path.join(dest, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "wb") as f:
            f.write(data)


def copy_player(name, source, dest):
    src = os.path.join(source, f"{name}-player", "custom-player")
    if not os.path.isdir(src):
        avail = sorted(d[: -len("-player")] for d in os.listdir(source) if d.endswith("-player"))
        sys.exit(f"No {name}-player/custom-player in {source}. Players there: {', '.join(avail) or 'none'}")
    shutil.copytree(src, dest, ignore=lambda d, names: [n for n in names if n in SKIP])


def find_course_root(folder):
    """The folder holding the launch page; Storyline sometimes nests it one level down."""
    def is_root(d):
        return any(os.path.exists(os.path.join(d, f)) for f in ("story.html", "index_lms.html"))
    if is_root(folder):
        return folder
    subs = [os.path.join(folder, d) for d in os.listdir(folder) if os.path.isdir(os.path.join(folder, d))]
    roots = [d for d in subs if is_root(d)]
    if len(roots) == 1:
        return roots[0]
    if len(roots) > 1:
        sys.exit("Found more than one course in that folder:\n  " + "\n  ".join(roots) + "\nPass one of them.")
    if any(f.endswith(".story") for f in os.listdir(folder)):
        sys.exit("This looks like a Storyline project (.story), not a published course. "
                 "Publish it from Storyline first (Web or LMS), then use the published folder.")
    sys.exit(f"No story.html or index_lms.html in {folder}. Is this a published Storyline course?")


def publish_type(root):
    if os.path.exists(os.path.join(root, "cmi5.xml")):
        return "cmi5"
    m = os.path.join(root, "imsmanifest.xml")
    if os.path.exists(m):
        s = open(m, encoding="utf-8-sig", errors="replace").read()
        if "CAM 1.3" in s or "2004" in s or "adlcp_v1p3" in s:
            return "SCORM 2004"
        return "SCORM 1.2"
    return "Web"


def patch_page(path):
    s = open(path, encoding="utf-8-sig").read()
    before = s
    if CSS_LINE not in s:
        s, n = re.subn(r'(<link rel="stylesheet" href="html5/data/css/output\.min\.css"[^>]*>)',
                       lambda m: m.group(1) + "\n  " + CSS_LINE, s, count=1)
        if not n:
            sys.exit(f"{os.path.basename(path)}: Storyline's output.min.css link wasn't found. "
                     "These skins need the Modern Player in a recent Storyline 360 publish.")
    if JS_LINE not in s:
        s, n = re.subn(r'(<script src="html5/lib/scripts/bootstrapper\.min\.js"></script>)',
                       lambda m: m.group(1) + "\n" + JS_LINE, s, count=1)
        if not n:
            sys.exit(f"{os.path.basename(path)}: Storyline's bootstrapper.min.js script wasn't found.")
    if s != before:
        with open(path, "w", encoding="utf-8") as f:
            f.write(s)
        return True
    return False


def patch_manifest(root):
    m = os.path.join(root, "imsmanifest.xml")
    s = open(m, encoding="utf-8-sig").read()
    s = re.sub(r'\n[ \t]*<file href="custom-player/[^"]*"\s*/>', "", s)  # the previous skin's files
    entry = re.search(r'\n([ \t]*)<file href="index_lms\.html"\s*/>', s)
    if not entry:
        print("  note: imsmanifest.xml has no index_lms.html entry, so the player files weren't listed. "
              "Most LMSs don't mind.")
        return
    files = sorted(os.path.relpath(os.path.join(d, f), root).replace(os.sep, "/")
                   for d, _, fs in os.walk(os.path.join(root, "custom-player")) for f in fs)
    add = "".join(f'\n{entry.group(1)}<file href="{f}" />' for f in files)
    s = s[:entry.end()] + add + s[entry.end():]
    with open(m, "w", encoding="utf-8") as f:
        f.write(s)


def make_zip(root, out):
    if os.path.exists(out):
        os.remove(out)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for d, dirs, fs in os.walk(root):
            dirs[:] = [x for x in dirs if not x.startswith("__MACOSX")]
            for f in fs:
                if f == ".DS_Store":
                    continue
                p = os.path.join(d, f)
                z.write(p, os.path.relpath(p, root))


def main():
    ap = argparse.ArgumentParser(description="Add a custom player skin to a published Storyline course.")
    ap.add_argument("player", nargs="?", help="professional, whimsical, sleek, super, sunny, arcade, ...")
    ap.add_argument("course", nargs="?", help="published course folder, or an LMS .zip")
    ap.add_argument("--zip", action="store_true", help="also write an LMS-ready zip of the skinned folder")
    ap.add_argument("--source", help="local copy of the repo to take the player from, instead of GitHub")
    ap.add_argument("--ref", default="main", help="branch or tag to download from (default: main)")
    ap.add_argument("--list", action="store_true", help="list the players available and exit")
    a = ap.parse_args()

    if a.list:
        print("\n".join(list_players(a.ref)))
        return
    if not a.player or not a.course:
        ap.error("give a player and a course folder or zip (or --list)")

    player = a.player.lower().removesuffix("-player")
    course = os.path.abspath(os.path.expanduser(a.course))
    zip_out = None

    if course.lower().endswith(".zip"):
        if not os.path.isfile(course):
            sys.exit(f"No such file: {course}")
        base = course[:-4]
        folder = base
        n = 2
        while os.path.exists(folder):
            folder = f"{base} ({n})"
            n += 1
        with zipfile.ZipFile(course) as z:
            z.extractall(folder)
        print(f"Unzipped to: {folder}")
        course = folder
        zip_out = f"{base} - {player}.zip"
    elif not os.path.isdir(course):
        sys.exit(f"No such folder: {course}")

    root = find_course_root(course)
    kind = publish_type(root)
    print(f"Course: {root}\nPublish type: {kind}")

    with tempfile.TemporaryDirectory() as tmp:
        staged = os.path.join(tmp, "custom-player")
        if a.source:
            copy_player(player, os.path.abspath(os.path.expanduser(a.source)), staged)
            print(f"Player: {player} (from {a.source})")
        else:
            os.makedirs(staged)
            download_player(player, a.ref, staged)
            print(f"Player: {player} (from github.com/{REPO}, {a.ref})")
        dest = os.path.join(root, "custom-player")
        if os.path.exists(dest):
            print("  replaced the custom-player folder that was already there")
            shutil.rmtree(dest)
        shutil.copytree(staged, dest)

    changed = []
    for page in ("story.html", "index_lms.html"):
        p = os.path.join(root, page)
        if os.path.exists(p):
            changed.append(f"{page} ({'lines added' if patch_page(p) else 'lines already there'})")
    if os.path.exists(os.path.join(root, "imsmanifest.xml")):
        patch_manifest(root)
        changed.append("imsmanifest.xml (player files listed)")
    print("Updated: " + ", ".join(changed))
    print("Added: custom-player/ (" + ", ".join(sorted(os.listdir(os.path.join(root, "custom-player")))) + ")")

    out = None
    if a.zip or zip_out:
        out = zip_out or (root.rstrip(os.sep) + f" - {player}.zip")
        make_zip(root, out)
        print(f"{'Zip' if kind == 'Web' else 'LMS zip'}: {out}")

    if kind == "Web":
        print(f'\nPreview: cd "{root}" && python3 -m http.server 8000, then open http://localhost:8000/story.html')
    elif out:
        print("\nTest the zip in SCORM Cloud or your LMS. Opening index_lms.html directly shows an LMS API error, which is expected.")
    else:
        print("\nTo upload it, rerun with --zip, or zip the folder's contents so imsmanifest.xml / cmi5.xml is at the top of the zip.\n"
              "Opening index_lms.html directly shows an LMS API error, which is expected outside an LMS.")
    print("Republishing from Storyline removes the skin, so run this again after each publish.")


if __name__ == "__main__":
    main()
