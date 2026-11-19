/* =========================================================================
   Clair — pages détachées.
   Les données sont produites par le dashboard (window.LosseClairPages) puis
   lues par page.html dans une fenêtre de même origine : aucun nouvel appel
   réseau, aucune donnée stockée sur disque. Si la page est ouverte seule
   (nouvel onglet, rechargement), elle invite à revenir au dashboard.
   ========================================================================= */
let detached = null;

export function openDetachedPage(kind) {
  if (!window.LosseClairPages) {
    throw new Error('Lancez d’abord « Valider et analyser cet onglet », puis rouvrez la page.');
  }
  const size = kind === 'records' ? 'width=1180,height=900' : 'width=1040,height=900';
  const url = new URL('page.html?page=' + encodeURIComponent(kind), location.href).href;
  let win = null;
  try {
    win = window.open(url, 'clair-' + kind, size + ',menubar=yes,toolbar=yes,location=yes,scrollbars=yes,resizable=yes');
  } catch (e) {
    win = null;
  }
  if (!win) {
    // Popup bloquée : onglet classique (les données ne seront pas disponibles, la page l'indique).
    window.open(url, '_blank', 'noopener');
    return false;
  }
  detached = win;
  try { win.focus(); } catch (e) { /* cross-origin : sans conséquence */ }
  return true;
}

/** Signale à la fenêtre détachée qu'une nouvelle analyse est disponible. */
export function pingDetachedPage() {
  if (!detached || detached.closed) return;
  try { detached.postMessage({ type: 'clair:update' }, location.origin); } catch (e) { /* ignoré */ }
}

export function closeDetachedPage() {
  if (detached && !detached.closed) detached.close();
  detached = null;
}
