#!/usr/bin/env python3
"""Summarises a harness run. Usage: python3 tests/report.py [name] [--detail]"""
import collections, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
name = args[0] if args else 'run'
R = json.load(open(os.path.join(HERE, 'results', 'results-%s.json' % name)))
BENIGN = 'ResizeObserver loop'  # the browser's own notice, also seen with no skin
key = lambda r: (r['variant'], r['size'])
control = collections.defaultdict(list)
for r in R:
    if r['player'] == 'noskin':
        control[key(r)].append(r)

problems = []
for r in R:
    if r['player'] == 'noskin':
        continue
    ctrl = control.get(key(r), [])
    stock_fails = {f for c in ctrl for f in c['fails']}
    stock_errs = {e for c in ctrl for e in c.get('errors', [])}
    # Failing with no skin too means it's Storyline or the test, not the skin
    fails = [f for f in r['fails'] if f not in stock_fails]
    errs = [e for e in r.get('errors', []) if BENIGN not in e and e not in stock_errs]
    # Which driver functions get called, not how often: Storyline batches its saves
    # on a timer, so the counts vary between identical loads even with no skin.
    if 'lms' in r and ctrl:
        expected = set().union(*[set(c.get('lms', {})) for c in ctrl])
        if set(r['lms']) != expected:
            fails.append('LMS calls differ from no skin: %s vs %s' % (sorted(r['lms']), sorted(expected)))
    if r['variant'] == 'hang' and r.get('readyMs', 0) > 5000:
        fails.append('font host delays the course (%d ms)' % r['readyMs'])
    if fails or errs:
        problems.append((r['player'], r['variant'], r['size'], fails, errs))

skins = sorted({r['player'] for r in R if r['player'] != 'noskin'})
print('%d loads, players: %s' % (len(R), ', '.join(skins)))
for p in problems:
    print('  FAIL %-13s %-10s %-9s %s %s' % (p[0], p[1], p[2], p[3], p[4][:3]))

if '--detail' in sys.argv:
    print('\nprogress widgets')
    for r in R:
        if r['player'] != 'noskin':
            print('  %-13s %-10s %-9s rows %-5s widget %-30s readout %s' % (r['player'], r['variant'], r['size'], r.get('rows'), r.get('widget'), r.get('lastReadout') or r.get('readout')))

print('\nPASS' if not problems else '\nFAIL: %d of %d skinned loads' % (len(problems), sum(r['player'] != 'noskin' for r in R)))
sys.exit(1 if problems else 0)
