import { City } from '@/types';

export async function fetchCities(): Promise<City[]> {
  try {
    const response = await fetch('/api/cities');
    const data = await response.json();
    return data.cities || [];
  } catch {
    return [];
  }
}