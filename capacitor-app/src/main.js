import { PushNotifications } from '@capacitor/push-notifications';

const SITE_ORIGIN = 'https://aswdasd000-byte.github.io';
const frame = document.getElementById('deliverySite');
const loading = document.getElementById('loading');
frame.src = SITE_ORIGIN + '/delivery-alatarib/';
frame.addEventListener('load', () => { loading.style.display = 'none'; });

let listenerReady = false;
let pending = null;

function reply(payload) {
  if (!pending) return;
  const target = pending;
  pending = null;
  clearTimeout(target.timer);
  target.source.postMessage(payload, target.origin);
}

async function prepareNativePush() {
  if (!listenerReady) {
    await PushNotifications.addListener('registration', token => {
      reply({ type: 'DELIVERY_NATIVE_PUSH_TOKEN', requestId: pending?.requestId, token: token.value });
    });
    await PushNotifications.addListener('registrationError', error => {
      reply({ type: 'DELIVERY_NATIVE_PUSH_ERROR', requestId: pending?.requestId, message: error?.error || 'تعذر تسجيل الجهاز في Firebase.' });
    });
    listenerReady = true;
  }
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') throw new Error('لم يتم السماح بإشعارات التطبيق من إعدادات الهاتف.');
  await PushNotifications.register();
}

window.addEventListener('message', async event => {
  if (event.origin !== SITE_ORIGIN || event.source !== frame.contentWindow) return;
  const data = event.data || {};
  if (data.type !== 'DELIVERY_NATIVE_PUSH_REQUEST' || !data.requestId) return;
  if (pending) reply({ type: 'DELIVERY_NATIVE_PUSH_ERROR', requestId: pending.requestId, message: 'انتظر انتهاء طلب الإشعارات السابق.' });
  pending = {
    source: event.source,
    origin: event.origin,
    requestId: data.requestId,
    timer: setTimeout(() => reply({ type: 'DELIVERY_NATIVE_PUSH_ERROR', requestId: data.requestId, message: 'انتهت مهلة تسجيل الإشعارات. حاول مرة أخرى.' }), 25000)
  };
  try {
    await prepareNativePush();
  } catch (error) {
    reply({ type: 'DELIVERY_NATIVE_PUSH_ERROR', requestId: data.requestId, message: error?.message || 'تعذر تفعيل الإشعارات.' });
  }
});
