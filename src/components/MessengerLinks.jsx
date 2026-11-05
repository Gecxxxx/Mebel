import { messengers } from '../data/messengers.js';
import Icon from './Icon.jsx';

export default function MessengerLinks({ labels = false, includeSocial = false }) {
  const links = includeSocial ? [...messengers, { id: 'vk', name: 'ВКонтакте', url: 'https://vk.com/prioritet12', icon: 'vk' }] : messengers;
  return <div className={`messenger-links ${labels ? 'messenger-links--labelled' : ''}`} aria-label="Связаться в мессенджере">
    {links.map(m => <a key={m.id} className={`messenger-link messenger-link--${m.id}`} href={m.url} target="_blank" rel="noreferrer" aria-label={`Написать в ${m.name}`} title={m.name}><Icon name={m.icon} size={22} />{labels && <span>{m.name}</span>}</a>)}
  </div>;
}
