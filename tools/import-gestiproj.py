#!/usr/bin/env python3
"""Convertit un export CSV GestiProj en données réelles chargées par l'application.

    python3 tools/import-gestiproj.py gestiproj-2026-11-19.csv
    python3 tools/import-gestiproj.py mon-export.csv --out GestiProj/data/projets.js

Le CSV attendu est celui produit par « ⬇ Exporter CSV » dans GestiProj
(séparateur « ; », en-têtes : ID, Nom, Priorité, Responsable, Début, Durée,
Fin, Étapes, Progression, Statut, Description). L'ordre des colonnes n'a pas
d'importance : elles sont reconnues par leur nom.

Les projets sont écrits dans GestiProj/data/projets.js, utilisé par GestiProj
au premier démarrage (navigateur vierge). Un navigateur déjà utilisé conserve
ses données localStorage : importez alors le CSV depuis l'application.
"""
import argparse
import csv
import io
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / 'GestiProj' / 'data' / 'projets.js'

HEADER = '''/* =========================================================================
   GestiProj — jeux de données réelles (chargées au premier démarrage).
   Fichier généré par tools/import-gestiproj.py depuis « {source} ».
   Ce fichier n'est lu que si le navigateur ne contient encore aucune donnée :
   le localStorage reste la source de vérité une fois l'application utilisée.
   ========================================================================= */
'''

# Noms de colonnes tolérants (accents et casse ignorés), comme dans l'application.
ALIASES = {
    'id': {'id'},
    'nom': {'nom', 'projet', 'titre', 'name'},
    'priorite': {'priorite', 'priority'},
    'responsable': {'responsable', 'owner', 'assigne'},
    'debut': {'debut', 'start', 'date de debut'},
    'duree': {'duree', 'duration', 'jours'},
    'description': {'description', 'desc', 'notes'},
    'etapes': {'etapes', 'etapes taches', 'taches', 'steps', 'tasks'},
}


def fold(value):
    value = (value or '').strip().lower()
    for a, b in (('à', 'a'), ('â', 'a'), ('ä', 'a'), ('é', 'e'), ('è', 'e'), ('ê', 'e'),
                 ('î', 'i'), ('ï', 'i'), ('ô', 'o'), ('ö', 'o'), ('ù', 'u'), ('û', 'u'), ('ç', 'c')):
        value = value.replace(a, b)
    return re.sub(r'\s+', ' ', value)


def detect_sep(text):
    first = text.splitlines()[0] if text.splitlines() else ''
    return ';' if first.count(';') >= first.count(',') else ','


def parse_steps(raw):
    out = []
    for i, part in enumerate(str(raw or '').split('|')):
        label = part.strip()
        if not label:
            continue
        done = False
        if re.match(r'^\[x\]', label, re.I):
            done, label = True, re.sub(r'^\[x\]\s*', '', label, flags=re.I)
        elif label.startswith('[ ]'):
            label = re.sub(r'^\[ \]\s*', '', label)
        elif label[:1] in ('✓', '✔'):
            done, label = True, label.lstrip('✓✔').strip()
        out.append({'id': f's{i + 1}', 'titre': label, 'fait': done})
    return out


def convert(path):
    text = path.read_text(encoding='utf-8-sig')
    sep = detect_sep(text)
    rows = list(csv.reader(io.StringIO(text), delimiter=sep))
    if len(rows) < 2:
        raise SystemExit('CSV vide ou sans ligne de données.')
    names = [fold(h) for h in rows[0]]
    mapping = {}
    for key, accepted in ALIASES.items():
        for i, name in enumerate(names):
            if name in accepted:
                mapping[key] = i
                break
    if 'nom' not in mapping:
        raise SystemExit('Colonne « Nom / Projet » introuvable : ' + ', '.join(rows[0]))

    projects = []
    for n, row in enumerate(rows[1:], start=1):
        if not any(c.strip() for c in row):
            continue

        def cell(key):
            i = mapping.get(key)
            return row[i].strip() if i is not None and i < len(row) else ''

        duree = cell('duree')
        projects.append({
            'id': cell('id') or f'reel_{n}',
            'nom': cell('nom') or f'Projet {n}',
            'priorite': cell('priorite') or 'Moyenne',
            'responsable': cell('responsable'),
            'debut': cell('debut'),
            'duree': int(duree) if duree.isdigit() else 7,
            'description': cell('description'),
            'etapes': parse_steps(cell('etapes')),
            'createdAt': '2026-11-19T00:00:00.000Z',
        })
    return projects


def write_js(projects, path, source):
    payload = {'version': 1, 'exportedAt': '2026-11-19', 'source': source, 'projects': projects}
    body = HEADER.format(source=source) + 'window.GESTIPROJ_SEED = ' + \
        json.dumps(payload, ensure_ascii=False, indent=1) + ';\n'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convertit un export CSV GestiProj en données réelles.')
    parser.add_argument('csv', type=pathlib.Path, help='export CSV GestiProj')
    parser.add_argument('--out', type=pathlib.Path, default=DEFAULT_OUT, help='fichier JS de sortie')
    args = parser.parse_args()
    if not args.csv.exists():
        raise SystemExit(f'Fichier introuvable : {args.csv}')
    projects = convert(args.csv)
    write_js(projects, args.out, args.csv.name)
    steps = sum(len(p['etapes']) for p in projects)
    print(f'{len(projects)} projets · {steps} étapes → {args.out}')
