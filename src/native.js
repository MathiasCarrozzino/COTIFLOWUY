import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { LocalNotifications } from "@capacitor/local-notifications";

function b64(u8) {
  var s = "", n = 8192;
  for (var i = 0; i < u8.length; i += n) s += String.fromCharCode.apply(null, u8.subarray(i, i + n));
  return btoa(s);
}

var NB = {
  native: Capacitor.isNativePlatform(),
  busy: false,
  // Guarda el archivo en la caché de la app y abre el menú de compartir de Android
  // (desde ahí se elige Gmail con el adjunto, Drive, WhatsApp o "guardar en el teléfono").
  async share(name, data, mime, text) {
    NB.busy = true;
    try {
      var w = await Filesystem.writeFile({ path: name, data: b64(data), directory: Directory.Cache });
      await Share.share({ title: name, text: text || undefined, files: [w.uri], dialogTitle: "Compartir " + name });
    } finally {
      setTimeout(function () { NB.busy = false; }, 1500);
    }
  },
  // Notificaciones locales (pedidos pendientes)
  async notifPerm() {
    try {
      var p = await LocalNotifications.checkPermissions();
      if (p.display !== "granted") p = await LocalNotifications.requestPermissions();
      return p.display === "granted";
    } catch (e) { return false; }
  },
  async notifSet(items) {
    try {
      var ids = [];
      for (var i = 1; i <= 120; i++) ids.push({ id: i });
      await LocalNotifications.cancel({ notifications: ids });
      if (!items || !items.length) return true;
      await LocalNotifications.createChannel({ id: "pedidos", name: "Recordatorios de pedidos", importance: 4, visibility: 1, vibration: true });
      await LocalNotifications.schedule({ notifications: items.map(function (n) {
        return { id: n.id, title: n.title, body: n.body, channelId: "pedidos", smallIcon: "ic_stat_pedidos", schedule: { at: n.at, allowWhileIdle: true } };
      }) });
      return true;
    } catch (e) { return false; }
  },
  async check() {
    try {
      var i = await BiometricAuth.checkBiometry();
      if (i.isAvailable || i.deviceIsSecure) return { ok: true };
      return { ok: false, msg: "Configurá una huella, rostro o bloqueo de pantalla en el teléfono." };
    } catch (e) {
      return { ok: false, msg: "No se pudo comprobar el desbloqueo biométrico." };
    }
  },
  async auth() {
    NB.busy = true;
    try {
      await BiometricAuth.authenticate({
        reason: "Desbloquear la calculadora",
        cancelTitle: "Cancelar",
        allowDeviceCredential: true,
        androidTitle: "Calculadora de precios",
        androidSubtitle: "Confirmá tu identidad"
      });
      return true;
    } catch (e) {
      return false;
    } finally {
      setTimeout(function () { NB.busy = false; }, 1500);
    }
  }
};
window.NB = NB;

if (NB.native) {
  App.addListener("appStateChange", function (s) {
    window.dispatchEvent(new Event(s.isActive ? "nb-resume" : "nb-pause"));
  });
  App.addListener("backButton", function () {
    if (window.__back && window.__back()) return;
    App.exitApp();
  });
}
