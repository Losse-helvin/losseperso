/* =========================================================================
   Losse Hub — moteur de thème partagé par les trois pages.
   Chargé SANS defer dans <head> : data-theme est posé avant le premier
   rendu, donc aucun « flash » de thème clair au chargement d'une page sombre.

   Règles :
   - trois états : « auto » (suit la préférence du système), « light », « dark » ;
   - un seul choix mémorisé, dans localStorage['losse-theme'], commun aux trois
     pages : changer de thème sur le hub s'applique aussi à GestiProj et Clair ;
   - en mode auto, le thème suit le système en direct (changement d'heure, etc.) ;
   - tout bouton portant data-theme-toggle est câblé automatiquement ;
   - l'événement « losse:theme » est émis sur document à chaque changement
     (les graphiques de Clair s'y redessinent).

   API : window.LosseTheme = { get, pref, set, toggle, clear }
     get()      → 'light' | 'dark'  (thème réellement appliqué)
     pref()     → 'light' | 'dark' | 'auto'
     set('auto'|'light'|'dark')
     toggle()   → bascule clair ↔ sombre (choix explicite, mémorisé)
     clear()    → retour au suivi du système
   ========================================================================= */
(function () {
  'use strict';

  var KEY = 'losse-theme';
  var LEGACY = ['hub-theme', 'clair-theme']; // anciennes clés, migrées une fois
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var pref = 'auto';

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === 'light' || v === 'dark' || v === 'auto') return v;
      for (var i = 0; i < LEGACY.length; i++) {
        var old = localStorage.getItem(LEGACY[i]);
        if (old === 'light' || old === 'dark') {
          localStorage.setItem(KEY, old);
          return old;
        }
      }
    } catch (e) { /* stockage refusé : on reste en auto */ }
    return null;
  }

  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* sans conséquence */ }
  }

  function systemTheme() {
    return media && media.matches ? 'dark' : 'light';
  }

  function applied() {
    return pref === 'auto' ? systemTheme() : pref;
  }

  /* Libellés : on annonce l'action, pas l'état (règle d'IHM : un bouton
     décrit ce qu'il fait). */
  function label(theme) {
    return theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre';
  }

  function paint(announce) {
    var theme = applied();
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var txt = label(theme);
      var icon = btn.querySelector('[data-theme-icon]');
      var name = btn.querySelector('[data-theme-label]');
      if (icon && !name) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
      if (icon && name) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
      if (name) name.textContent = theme === 'dark' ? 'Thème clair' : 'Thème sombre';
      btn.setAttribute('aria-label', txt);
      btn.setAttribute('title', txt + (pref === 'auto' ? ' (suit le système)' : ''));
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.classList.toggle('is-dark', theme === 'dark');
    }

    if (announce) {
      document.dispatchEvent(new CustomEvent('losse:theme', {
        detail: { theme: theme, pref: pref }
      }));
    }
  }

  function set(value) {
    pref = (value === 'light' || value === 'dark') ? value : 'auto';
    if (pref === 'auto') { try { localStorage.removeItem(KEY); } catch (e) {} }
    else write(pref);
    paint(true);
  }

  function toggle() {
    set(applied() === 'dark' ? 'light' : 'dark');
  }

  /* ---------- câblage des boutons, y compris ceux ajoutés après coup ---------- */
  function bindButton(btn) {
    if (!btn || btn.dataset.themeBound === '1') return;
    btn.dataset.themeBound = '1';
    btn.addEventListener('click', function (ev) {
      /* Alt/clic droit : revenir au suivi automatique du système. */
      if (ev.altKey) { set('auto'); return; }
      toggle();
    });
    /* Le clic au clavier (Entrée/Espace) est déjà géré nativement par <button>. */
  }

  function bindAll() {
    var list = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < list.length; i++) bindButton(list[i]);
    paint(false);
  }

  /* Préférence initiale : choix mémorisé, sinon système. */
  var saved = read();
  pref = saved === 'light' || saved === 'dark' ? saved : 'auto';

  /* Premier passage immédiat (le <body> n'existe pas encore : seule la racine
     est peinte, ce qui suffit pour éviter tout clignotement). */
  root.setAttribute('data-theme', applied());
  root.style.colorScheme = applied();

  if (media) {
    var onSystem = function () { if (pref === 'auto') paint(true); };
    if (media.addEventListener) media.addEventListener('change', onSystem);
    else if (media.addListener) media.addListener(onSystem); // anciens navigateurs
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAll);
  } else {
    bindAll();
  }

  window.LosseTheme = {
    get: applied,
    pref: function () { return pref; },
    set: set,
    toggle: toggle,
    clear: function () { set('auto'); }
  };
})();
