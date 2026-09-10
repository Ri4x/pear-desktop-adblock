// src/plugins/adblocker/blocker.ts
//
// Motor de bloqueo compartido. Instancia única de ElectronBlocker + un
// WeakSet<Session> para no volver a llamar enableBlockingInSession() dos
// veces sobre la misma sesión (mismo bug de fondo que ya viste en
// ytmdesktop con el doble registro de 'inject-cosmetic-filters').
//
// disableForSession solo se debe llamar en el ciclo de vida `stop()` de un
// plugin, cuando la ventana/sesión ya se está cerrando — NUNCA como parte
// de un toggle en caliente de configuración. Ver la nota grande en
// index.ts sobre https://github.com/ghostery/adblocker/issues/2437.

import { ElectronBlocker } from '@ghostery/adblocker-electron';
import fetch from 'cross-fetch';
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { Session } from 'electron';

let blockerInstance: ElectronBlocker | null = null;
let blockerPromise: Promise<ElectronBlocker> | null = null;

const sessionsWithBlockingEnabled = new WeakSet<Session>();

function getCachePath(): string {
  return path.join(app.getPath('userData'), 'pear-adblocker-engine.bin');
}

async function loadBlocker(): Promise<ElectronBlocker> {
  return ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
    path: getCachePath(),
    read: fs.promises.readFile,
    write: fs.promises.writeFile,
  });
}

/** Instancia única del blocker, creada (y cacheada en disco) la primera vez que se pide. */
export async function getBlocker(): Promise<ElectronBlocker> {
  if (blockerInstance) return blockerInstance;
  if (!blockerPromise) {
    blockerPromise = loadBlocker().then((instance) => {
      blockerInstance = instance;
      return instance;
    });
  }
  return blockerPromise;
}

/**
 * @ghostery/adblocker-electron no expone `loadCosmeticFilters` tipado en su
 * config pública, pero enableBlockingInSession lo lee de blocker.config
 * internamente. Hay que fijarlo ANTES de llamar enableForSession.
 */
export function setCosmeticFiltering(blocker: ElectronBlocker, enabled: boolean): void {
  (blocker.config as { loadCosmeticFilters?: boolean }).loadCosmeticFilters = enabled;
}

/** Habilita bloqueo de red (+ cosmético, según setCosmeticFiltering) una sola vez por sesión. */
export function enableForSession(blocker: ElectronBlocker, session: Session): void {
  if (sessionsWithBlockingEnabled.has(session)) return;
  blocker.enableBlockingInSession(session);
  sessionsWithBlockingEnabled.add(session);
}

/** Solo llamar durante stop() de cierre real de ventana/app. Ver nota arriba. */
export function disableForSession(blocker: ElectronBlocker, session: Session): void {
  if (!sessionsWithBlockingEnabled.has(session)) return;
  blocker.disableBlockingInSession(session);
  sessionsWithBlockingEnabled.delete(session);
}

export function isEnabledForSession(session: Session): boolean {
  return sessionsWithBlockingEnabled.has(session);
}
