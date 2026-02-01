
import { PricePoint, MarketStats, CoinOption } from '../types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Mock data as fallback to ensure the app stays functional if CoinGecko rate limits us
const MOCK_STATS: Record<string, MarketStats> = {
  'bitcoin': { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', currentPrice: 65432.10, change24h: 2.5, high24h: 66000, low24h: 64000, volume: 35000000000, lastUpdated: new Date().toISOString(), image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' }
};

const getMockHistory = () => {
  const points: PricePoint[] = [];
  let basePrice = 65000;
  const now = Date.now();
  for (let i = 0; i < 100; i++) {
    basePrice += (Math.random() - 0.5) * 500;
    points.push({ time: now - (100 - i) * 15 * 60000, price: basePrice });
  }
  return points;
};

export const fetchCoinHistory = async (coinId: string, days: number = 1): Promise<PricePoint[]> => {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.prices.map((p: [number, number]) => ({
      time: p[0],
      price: p[1]
    }));
  } catch (error) {
    console.warn(`Error fetching ${coinId} history, using mock fallback:`, error);
    return getMockHistory();
  }
};

export const fetchCoinStats = async (coinId: string): Promise<MarketStats | null> => {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || data.length === 0) throw new Error('No data');
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
    console.warn(`Error fetching ${coinId} stats, using mock fallback:`, error);
    return MOCK_STATS[coinId] || { ...MOCK_STATS['bitcoin'], id: coinId, name: coinId.toUpperCase() };
  }
};

export const fetchTopOpportunities = async (): Promise<CoinOption[]> => {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      change24h: coin.price_change_percentage_24h,
      image: coin.image
    }));
  } catch (error) {
    console.warn('Error fetching top opportunities, using minimal set:', error);
    return [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', change24h: 1.2, image: '' },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', change24h: 2.1, image: '' },
      { id: 'solana', symbol: 'sol', name: 'Solana', change24h: 5.5, image: '' }
    ];
  }
};
