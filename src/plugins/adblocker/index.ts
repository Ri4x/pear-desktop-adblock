// src/plugins/adblocker/index.ts
//
// Plugin de adblock sobre el sistema oficial de plugins de Pear Desktop.
//
// IMPORTANTE: NO togglear enabled/cosmeticFiltering en caliente llamando
// disableForSession + enableForSession sobre una sesión viva. Es un bug
// documentado de @ghostery/adblocker-electron
// (https://github.com/ghostery/adblocker/issues/2437): disableBlockingInSession
// puede dejar el webContents sin poder recibir input, porque queda un
// listener IPC de cosméticos escuchando sobre un canal que el preload ya
// dejó de servir. El propio mantenedor de la librería recomienda no llamar
// a disable en absoluto durante la vida de la sesión.
//
// Por eso: restartNeeded: true. Cambiar la config le pide al usuario
// reiniciar la app; disableForSession solo se llama en stop(), que ocurre
// cuando la ventana ya se está cerrando (ahí el bug es inofensivo, porque
// no hay input que perder).

import { createPlugin } from '@/utils';
import { enableForSession, getBlocker, setCosmeticFiltering, disableForSession } from './blocker';

export interface AdBlockerConfig {
  /** @default true */
  enabled: boolean;
  /** @default true */
  cosmeticFiltering: boolean;
}

export default createPlugin({
  name: () => 'Ad Blocker',
  description: () =>
    'Bloquea anuncios y trackers a nivel de red y de contenido (EasyList/EasyPrivacy) usando @ghostery/adblocker-electron. Los cambios de configuración requieren reiniciar la app.',
  restartNeeded: true,

  config: {
    enabled: true,
    cosmeticFiltering: true,
  } as AdBlockerConfig,

  menu: async ({ getConfig, setConfig }) => {
    const config = await getConfig();
    return [
      {
        label: 'Filtrado cosmético (ocultar contenedores de anuncios)',
        type: 'checkbox',
        checked: config.cosmeticFiltering,
        click(item) {
          setConfig({ cosmeticFiltering: item.checked });
        },
      },
    ];
  },

  backend: {
    async start({ getConfig, window }) {
      const config = await getConfig();
      if (!config.enabled) return;

      const blocker = await getBlocker();
      setCosmeticFiltering(blocker, config.cosmeticFiltering);
      enableForSession(blocker, window.webContents.session);
    },

    // Llamado al cerrar la ventana/app. Acá sí es seguro llamar disable
    // aunque dispare el bug de la librería: la sesión está por destruirse.
    stop({ window }) {
      getBlocker().then((blocker) => disableForSession(blocker, window.webContents.session));
    },

    // Sin onConfigChange: con restartNeeded: true no hace falta reaccionar
    // en caliente a cambios de config.
  },
});
