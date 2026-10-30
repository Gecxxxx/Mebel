import { asset } from '../lib/urls.js';
export default function Icon({ name = 'arrow-right', size = 20, className = '' }) {
  return <img className={`icon ${className}`} src={asset(`icons/${name}.svg`)} width={size} height={size} alt="" aria-hidden="true" />;
}
