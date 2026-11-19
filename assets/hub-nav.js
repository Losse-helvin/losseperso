/* =========================================================================
   Losse Hub — navigation partagée entre les deux applications.
   Chargé par GestiProj (../assets/hub-nav.js) et par Clair (../assets/hub-nav.js).
   Expose window.LosseHubNav :
     LosseHubNav.open('clair')    → ouvre l'autre application dans une fenêtre
     LosseHubNav.open('gestiproj')
     LosseHubNav.HOME             → URL du hub (index.html à la racine)
   Tolérant en file:// : si le hub n'est pas joignable, l'appelant retombe
   sur un lien relatif classique.
   ========================================================================= */
(function () {
  'use strict';

  // Ce script est chargé depuis <app>/../assets/hub-nav.js : la racine est donc
  // le dossier parent de son propre dossier. On la calcule depuis l'URL du script.
  var self = document.currentScript && document.currentScript.src;
  var HOME = null;
  if (self) {
    try {
      var url = new URL(self);
      HOME = new URL('../index.html', url).href;
    } catch (e) { /* IE/anciens navigateurs : repli ci-dessous */ }
  }
  if (!HOME) {
    // Repli : remonter d'un cran depuis l'URL courante.
    // En file://, location.origin vaut "null" : on conserve alors le chemin complet.
    var base = /^https?:$/.test(location.protocol) ? location.origin : 'file://';
    var dir = location.pathname.replace(/\/[^/]*$/, '').replace(/\/[^/]*$/, '');
    HOME = base + dir + '/index.html';
  }

  var APPS = {
    gestiproj: { path: '../GestiProj/index.html', title: 'GestiProj' },
    clair: { path: '../google-sheets-dashboard/index.html', title: 'Clair' }
  };

  // Retrouve l'application courante d'après le chemin de la page.
  function currentApp() {
    var p = location.pathname;
    if (/\/GestiProj\//i.test(p)) return 'gestiproj';
    if (/google-sheets-dashboard/i.test(p)) return 'clair';
    return null;
  }

  function targetUrl(app) {
    var info = APPS[app];
    if (!info) return null;
    var base = location.href.split('#')[0].split('?')[0].replace(/\/[^/]*$/, '/');
    return new URL(info.path, base).href;
  }

  /**
   * Ouvre l'autre application dans une petite fenêtre, sans fermer celle-ci.
   * Le navigateur peut bloquer les popups : on le signale à l'appelant.
   * @returns {boolean} true si une fenêtre a été obtenue.
   */
  function open(app) {
    var url = targetUrl(app);
    if (!url) return false;
    var info = APPS[app] || {};
    var win = null;
    try {
      win = window.open(
        url,
        'lossehub-' + app,
        'width=1360,height=900,menubar=yes,toolbar=yes,location=yes,scrollbars=yes,resizable=yes'
      );
    } catch (e) {
      win = null;
    }
    if (!win || win.closed || typeof win.closed === 'undefined') return false;
    try { win.focus(); } catch (e) { /* cross-origin : sans conséquence */ }
    return true;
  }

  /** Repli quand la fenêtre est bloquée : onglet classique. */
  function openTab(app) {
    var url = targetUrl(app);
    if (!url) return false;
    window.open(url, '_blank', 'noopener');
    return true;
  }

  window.LosseHubNav = {
    HOME: HOME,
    current: currentApp,
    url: targetUrl,
    open: open,
    openTab: openTab
  };
})();
