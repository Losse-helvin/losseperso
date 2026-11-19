#!/usr/bin/env python3
"""Serveur de fichiers local uniquement, sans stockage ni route d'écriture."""
import argparse
import http.server
import pathlib
import threading
import webbrowser
import csv
import io
import json
import re
import html
import urllib.request
import urllib.parse
import urllib.error

MAX_BYTES = 25 * 1024 * 1024

def google_read(url):
    # URL construit exclusivement avec un ID validé et un gid numérique.
    req = urllib.request.Request(url, headers={'User-Agent': 'ClairSheets/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError('Réponse trop volumineuse (limite 25 Mo).')
        if 'accounts.google.com' in response.url:
            raise ValueError('Ce fichier nécessite une connexion. Vérifiez le partage Lecteur ou utilisez OAuth.')
        return raw.decode('utf-8-sig')


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != '/api/public-sheet':
            return super().do_GET()
        try:
            q = urllib.parse.parse_qs(parsed.query)
            sid = q.get('id', [''])[0]
            gid = q.get('gid', [''])[0]
            if not re.fullmatch(r'[A-Za-z0-9_-]{20,150}', sid):
                raise ValueError('Identifiant de fichier invalide.')
            base = 'https://docs.google.com/spreadsheets/d/' + sid + '/'
            if gid:
                if not re.fullmatch(r'-?\d{1,15}', gid):
                    raise ValueError('Identifiant d’onglet invalide.')
                text = google_read(base + 'export?format=csv&gid=' + gid)
                if text.lstrip().lower().startswith(('<!doctype', '<html')):
                    raise ValueError('Export refusé. Vérifiez le partage et l’autorisation de téléchargement.')
                rows = list(csv.reader(io.StringIO(text)))
                if sum(map(len, rows)) > 2000000:
                    raise ValueError('Plus de 2 millions de cellules : utilisez un onglet plus petit.')
                data = {'rows': rows}
            else:
                text = google_read(base + 'htmlview')
                tabs = re.findall(r'items\.push\(\{name: ("(?:[^"\\]|\\.)*"),.*?gid: "(-?\d+)"', text)
                def js_string(value):
                    value = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m: '\\u00' + m[1], value)
                    return json.loads(value)
                if not tabs:
                    raise ValueError('Onglets inaccessibles. Vérifiez le partage Lecteur ; sinon utilisez le mode Google privé.')
                title = re.search(r'<title>(.*?)</title>', text, re.S)
                data = {'spreadsheetId': sid, 'properties': {'title': html.unescape(title[1]) if title else 'Google Sheets partagé', 'timeZone': 'UTC'}, 'sheets': [{'properties': {'sheetId': int(g), 'title': js_string(n), 'gridProperties': {}}} for n, g in tabs]}
            self.json_reply(200, data)
        except (ValueError, urllib.error.URLError, TimeoutError, csv.Error) as error:
            self.json_reply(400, {'error': 'Lecture publique impossible. ' + str(error)})
        except Exception:
            self.json_reply(502, {'error': 'Réponse Google non reconnue. Réessayez ou utilisez OAuth.'})

    def json_reply(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()
    def log_message(self, fmt, *args):
        # Ne pas journaliser les chemins de requêtes (un URL peut contenir un ID privé).
        pass

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    root = pathlib.Path(__file__).resolve().parent
    def handler(*a, **kw):
        return Handler(*a, directory=str(root), **kw)
    try:
        server = http.server.ThreadingHTTPServer((args.host, args.port), handler)
    except OSError as error:
        print(f'Impossible de démarrer sur le port {args.port}: {error}')
        print('Fermez le serveur existant ou choisissez un autre port et autorisez son origine OAuth.')
        raise SystemExit(1)
    url = f'http://localhost:{args.port}'
    print(f'Clair Analytics : {url}\nFermez cette fenêtre ou Ctrl+C pour arrêter.')
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
