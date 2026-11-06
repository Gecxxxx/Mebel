import { publicGateway } from '../lib/public-gateway.js';
// Public links only. Bot credentials belong exclusively to the server runtime.
export const messengers = [
  { id: 'telegram', name: 'Telegram', url: 'https://t.me/prioritet_mebel', icon: 'paper-plane-tilt' },
  { id: 'max', name: 'MAX', url: 'https://max.ru/id482108371165_1_bot?start=client', icon: 'max' },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://wa.me/79616069309', icon: 'whatsapp' },
];

export const leadApiUrl = import.meta.env.PUBLIC_LEAD_API_URL || publicGateway;

export const notificationBots = { telegram: 'https://t.me/prioritetzaiavkibot', max: 'https://max.ru/id482108371165_1_bot' };
