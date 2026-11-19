#!/usr/bin/env python3
"""Lanceur unique du dépôt : sert les deux applications depuis une seule adresse.

    python3 launch.py                # http://localhost:8000  (page d'accueil)
    python3 launch.py --port 8001
    python3 launch.py --host 0.0.0.0 # accessible depuis le réseau local

Contenu servi :

* ``/``            page d'accueil (index.html) qui regroupe les deux applications ;
* ``/GestiProj/``  Gestion de projets — fonctionne aussi en ``file://`` sans serveur ;
* ``/google-sheets-dashboard/``  Clair — Sheets Analytics (ES6 + OAuth ou lien partagé).

Le relais ``/api/public-sheet`` est repris à l'identique de
``google-sheets-dashboard/serve.py`` afin que le mode « lien partagé » fonctionne
depuis l'adresse commune. Aucune route d'écriture, aucun stockage, aucune
télémétrie ; les chemins de requêtes ne sont jamais journalisés.
"""
import argparse
import http.server
import pathlib
import sys
import threading
import urllib.error
import urllib.parse
import webbrowser

ROOT = pathlib.Path(__file__).resolve().parent
SHEETS_APP = ROOT / 'google-sheets-dashboard'

# Le relais Google vit dans l'application Sheets : on réutilise la même fonction
# plutôt que d'en dupliquer la logique de validation et de lecture.
public_sheet_data = None
if str(SHEETS_APP) not in sys.path:
    sys.path.insert(0, str(SHEETS_APP))
try:
    from serve import public_sheet_data  # noqa: E402
except Exception as error:  # pragma: no cover - dépend de l'environnement
    PUBLIC_SHEET_IMPORT_ERROR = error
else:
    PUBLIC_SHEET_IMPORT_ERROR = None

REDIRECTS = {
    '/gestiproj': '/GestiProj/index.html',
    '/clair': '/google-sheets-dashboard/index.html',
}


class Handler(http.server.SimpleHTTPRequestHandler):
    # Afficher les README (Markdown) au lieu de les télécharger.
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.md': 'text/plain; charset=utf-8'}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/health':
            return self.json_reply(200, {'status': 'ok'})
        if parsed.path == '/api/public-sheet':
            return self.relay_public_sheet(parsed.query)
        if parsed.path in REDIRECTS:
            target = REDIRECTS[parsed.path]
            if parsed.query:
                target += '?' + parsed.query
            self.send_response(302)
            self.send_header('Location', target)
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        return super().do_GET()

    def relay_public_sheet(self, query):
        if public_sheet_data is None:
            return self.json_reply(501, {
                'error': 'Relais Google indisponible : google-sheets-dashboard/serve.py '
                         'n’a pas pu être chargé (' + str(PUBLIC_SHEET_IMPORT_ERROR) + '). '
                         'Le mode OAuth du dashboard reste utilisable.'
            })
        try:
            self.json_reply(200, public_sheet_data(query))
        except (ValueError, urllib.error.URLError, TimeoutError) as error:
            # csv.Error hérite de ValueError dans les versions concernées.
            self.json_reply(400, {'error': 'Lecture publique impossible. ' + str(error)})
        except Exception:
            self.json_reply(502, {'error': 'Réponse Google non reconnue. Réessayez ou utilisez OAuth.'})

    def json_reply(self, status, data):
        import json
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
        # Ne pas journaliser les chemins : une URL peut contenir un ID de fichier privé.
        pass


def build_server(host, wanted_port):
    """Démarre sur ``wanted_port`` ou, s'il est occupé, sur le suivant libre."""
    last_error = None
    for port in range(wanted_port, wanted_port + 11):
        try:
            return http.server.ThreadingHTTPServer((host, port), lambda *a, **kw: Handler(*a, directory=str(ROOT), **kw))
        except OSError as error:
            last_error = error
    print(f'Impossible de démarrer sur les ports {wanted_port}–{wanted_port + 10} : {last_error}')
    print('Libérez un port ou choisissez-en un autre avec --port 8001.')
    raise SystemExit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Lance les deux applications web du dépôt.')
    parser.add_argument('--host', default='127.0.0.1', help='adresse d’écoute (défaut 127.0.0.1)')
    parser.add_argument('--port', type=int, default=8000, help='port d’écoute (défaut 8000)')
    parser.add_argument('--no-browser', action='store_true', help='ne pas ouvrir le navigateur')
    args = parser.parse_args()

    server = build_server(args.host, args.port)
    port = server.server_address[1]
    display = 'localhost' if args.host in ('127.0.0.1', '0.0.0.0', '::') else args.host
    url = f'http://{display}:{port}'
    print('Losse Hub — deux applications, une adresse')
    print(f'  Accueil     : {url}')
    print(f'  GestiProj   : {url}/GestiProj/')
    print(f'  Clair       : {url}/google-sheets-dashboard/')
    if port != args.port:
        print(f'  (port {args.port} occupé → {port} ; ajoutez cette origine exacte dans Google Cloud si besoin)')
    print('Ctrl+C pour arrêter.')
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
