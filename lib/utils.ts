import { TransportType } from '@/types';

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}м`;
  return mins === 0 ? `${hours}ч` : `${hours}ч ${mins}м`;
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} eu`;
}

export function getTransportIcon(type: TransportType): string {
  switch (type) {
    case 'train':   return '🚆';
    case 'bus':     return '🚌';
    case 'minibus': return '🚐';
    default:        return '🚗';
  }
}

export function getTransportLabel(type: TransportType): string {
  switch (type) {
    case 'train':   return 'Влак';
    case 'bus':     return 'Автобус';
    case 'minibus': return 'Бус';
    default:        return 'Транспорт';
  }
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('bg-BG', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}