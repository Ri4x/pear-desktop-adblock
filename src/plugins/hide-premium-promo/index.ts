// src/plugins/hide-premium-promo/index.ts
//
// Oculta el ítem "Actualizar" (upsell a Premium) del menú lateral.
// Confirmado por inspección de DOM: es un <ytmusic-guide-entry-renderer>
// más dentro de la sección de navegación, SIN clase/atributo que lo
// distinga de los demás ítems (Inicio, Explorar, Biblioteca...). Por eso
// se matchea por el texto visible en vez de por selector CSS.

import { createPlugin } from '@/utils';

// Ambos por si la app está en español o en inglés.
const LABELS_TO_HIDE = ['actualizar', 'upgrade'];

function hideUpgradeEntry(): void {
  document.querySelectorAll('ytmusic-guide-entry-renderer').forEach((entry) => {
    const label = entry.textContent?.trim().toLowerCase();
    if (label && LABELS_TO_HIDE.includes(label)) {
      (entry as HTMLElement).style.display = 'none';
    }
  });
}

export default createPlugin({
  name: () => 'Hide Premium Promo',
  description: () => 'Oculta el ítem "Actualizar" (Premium) del menú lateral.',
  restartNeeded: false,

  renderer: {
    start() {
      hideUpgradeEntry();

      // El menú lateral se re-renderiza en varios momentos de la SPA
      // (login, cambio de cuenta, navegación); un MutationObserver liviano
      // asegura que el ítem se oculte también cuando reaparezca.
      const observer = new MutationObserver(() => hideUpgradeEntry());
      observer.observe(document.body, { childList: true, subtree: true });
    },
  },
});
