#!/usr/bin/env python3
"""Test server for the player matrix. See tests/README.md.

Serves /<variant>/<player>/... from z_samples, rewriting the course's real menu
data per variant so the real Storyline player renders it. Files on disk are never
changed: the rewrites only happen in the response.

Run from the repo root: python3 tests/harness.py"""
import json, os, re, sys, time, mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(os.path.dirname(HERE), 'z_samples')
RESULTS = os.path.join(HERE, 'results')
PORT = 8799

CAPTURE = """<script>
window.__errs=[];window.__long=0;try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){window.__long=Math.max(window.__long,Math.round(e.duration))})}).observe({entryTypes:['longtask']})}catch(e){}
window.addEventListener('error',function(e){if(e.message)__errs.push('error: '+e.message+' @'+(e.filename||'').split('/').pop()+':'+e.lineno)});
window.addEventListener('unhandledrejection',function(e){__errs.push('rejection: '+(e.reason&&e.reason.message||e.reason))});
</script>"""

STUB = """<script>
window.__lms=[];var __P=parent.__chunks||(parent.__chunks={}),__K=location.pathname;window.__chunk=__P[__K]||'';
['Start','CommitData','ConcedeControl','SetFailed','SetLanguagePreference','SetPassed','SetReachedEnd','SetScore','Unload','ResetStatus','SetBookmark','SetProgressMeasure'].forEach(function(n){window[n]=function(){__lms.push(n);return true}});
window.IsLoaded=function(){return true};
window.GetDataChunk=function(){__lms.push('GetDataChunk');return window.__chunk};
window.SetDataChunk=function(v){__lms.push('SetDataChunk');window.__chunk=v;__P[__K]=v;return true};
window.GetStatus=function(){return 'incomplete'};
window.LESSON_STATUS_COMPLETED='completed';
</script>"""


def rows_from(all_links, n):
    out = []
    for i in range(n):
        src = dict(all_links[i % len(all_links)])
        if n > len(all_links):
            src['displaytext'] = 'Page %d %s' % (i + 1, src['displaytext'])
        out.append(src)
    return out


def rewrite_frame(text, variant):
    m = re.match(r"(.*?window\.globalProvideData\('frame', ')(.*)('\);?\s*)$", text, re.S)
    data = json.loads(m.group(2).replace("\\'", "'"))
    outline = data['navData']['outline']
    scenes = outline['links']
    slides = [s for sc in scenes for s in sc.get('links', [])]
    scene = lambda name, kids, first=scenes[0]: dict(first, displaytext=name, slidetitle='', expand=True, links=kids)
    co = data['controlOptions']

    pm = re.match(r'(?:lms)?p(\d+)$', variant)
    if pm:
        n = int(pm.group(1))
        rows = rows_from(slides, n)
        size = 20  # pages per scene
        outline['links'] = [scene('Module %d' % (i // size + 1), rows[i:i + size]) for i in range(0, n, size)]
    elif variant == 'flat11':
        outline['links'] = slides
    elif variant == 'flat1':
        outline['links'] = slides[:1]
    elif variant == 'collapsed':
        for sc in scenes:
            sc['expand'] = False
        co['menuOptions']['autocollapse'] = True
    elif variant == 'titles':
        for s in slides:
            s['displaytext'] = 'A very long slide title that a real course might well use, and then keeps on going ' + s['displaytext']
            s['slidetitle'] = s['displaytext']
        co['sidebarOptions']['titleText'] = 'A very long course title that takes up most of the top bar in the player, honestly'
    elif variant == 'search':
        co['controls']['search'] = True
        co['menuOptions']['enableSearch'] = True
    elif variant == 'nomenu':
        co['sidebarOptions']['sidebarEnabled'] = False
        co['sidebarOptions']['tabs'] = {'sidebar': []}
        outline['links'] = []
    elif variant == 'nobottom':
        co['bottomBarOptions']['bottomBarEnabled'] = False
    elif variant == 'notitle':
        co['sidebarOptions']['titleEnabled'] = False
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace("'", "\\'")
    return m.group(1) + payload + m.group(3)


class H(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *a):
        pass

    def send(self, body, ctype='text/plain', code=200):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        size = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(size)
        name = 'results-%s.json' % self.path.strip('/').split('/')[-1]
        os.makedirs(RESULTS, exist_ok=True)
        with open(os.path.join(RESULTS, name), 'wb') as f:
            f.write(body)
        self.send('ok')

    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ('/', '/harness.html'):
            return self.send(open(os.path.join(HERE, 'harness.html'), encoding='utf8').read(), 'text/html')
        if path.startswith('/__hang'):  # a font host on a network that never answers
            time.sleep(25)
            return self.send('', 'text/css')
        parts = path.strip('/').split('/', 2)
        if len(parts) < 3:
            return self.send('nope', code=404)
        variant, player, rest = parts
        folder = 'arcade' if player == 'noskin' else player
        full = os.path.join(ROOT, folder, rest)
        if not os.path.isfile(full):
            return self.send('missing', code=404)
        ctype = mimetypes.guess_type(full)[0] or 'application/octet-stream'
        if rest == 'story.html':
            text = open(full, encoding='utf-8-sig').read()
            if player == 'noskin':
                text = re.sub(r'\s*<link rel="stylesheet" href="custom-player/player\.css"/>', '', text)
                text = re.sub(r'\s*<script src="custom-player/player\.js"></script>', '', text)
            inject = CAPTURE
            if variant.startswith('lms'):
                text = text.replace('lmsPresent: false', 'lmsPresent: true')
                inject += STUB
            text = text.replace('<head>', '<head>' + inject, 1)
            return self.send(text, 'text/html; charset=utf-8')
        if rest == 'html5/data/js/frame.js':
            return self.send(rewrite_frame(open(full, encoding='utf-8-sig').read(), variant), 'application/javascript; charset=utf-8')
        if variant == 'hang' and rest.startswith('custom-player/'):
            text = open(full, encoding='utf-8').read().replace('https://fonts.googleapis.com', '/__hang')
            return self.send(text, ctype)
        with open(full, 'rb') as f:
            return self.send(f.read(), ctype)


if __name__ == '__main__':
    print('Open http://localhost:%d/harness.html' % PORT, flush=True)
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
