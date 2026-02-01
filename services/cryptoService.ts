
import { PricePoint, MarketStats, CoinOption } from '../types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export const fetchCoinHistory = async (coinId: string, days: number = 1): Promise<PricePoint[]> => {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    );
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    return data.prices.map((p: [number, number]) => ({
      time: p[0],
      price: p[1]
    }));
  } catch (error) {
    console.error(`Error fetching ${coinId} history:`, error);
    return [];
  }
};

export const fetchCoinStats = async (coinId: string): Promise<MarketStats | null> => {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false`
    );
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    const coin = data[0];
    
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      currentPrice: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      volume: coin.total_volume,
      lastUpdated: coin.last_updated,
      image: coin.image
    };
  } catch (error) {
    console.error(`Error fetching ${coinId} stats:`, error);
    return null;
  }
};

export const fetchTopOpportunities = async (): Promise<CoinOption[]> => {
  try {
    // Increased per_page to 30 to provide a wider range of opportunities
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=30&page=1&sparkline=false`
    );
    if (!response.ok) throw new Error('Failed to fetch opportunities');
    const data = await response.json();
    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      change24h: coin.price_change_percentage_24h,
      image: coin.image
    }));
  } catch (error) {
    console.error('Error fetching top opportunities:', error);
    return [];
  }
};
