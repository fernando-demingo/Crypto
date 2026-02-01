
export interface PricePoint {
  time: number;
  price: number;
}

export interface MarketStats {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  lastUpdated: string;
  image: string;
}

export interface CoinOption {
  id: string;
  symbol: string;
  name: string;
  change24h: number;
  image: string;
}

export interface PredictedProfitCoin {
  id: string;
  symbol: string;
  name: string;
  predictedMove: number;
  riskScore: number;
  rationale: string;
}

export enum RecommendationType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  STRONG_BUY = 'STRONG_BUY',
  STRONG_SELL = 'STRONG_SELL'
}

export interface MarketSignal {
  time: number;
  type: 'BUY' | 'SELL';
  price: number;
}

export interface AIAnalysis {
  recommendation: RecommendationType;
  confidence: number;
  rationale: string;
  shortTermOutlook: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  timestamp: string;
  historicalSignals: MarketSignal[];
}

export interface CryptoDataState {
  history: PricePoint[];
  stats: MarketStats | null;
  analysis: AIAnalysis | null;
  isLoading: boolean;
  error: string | null;
  topGainers: CoinOption[];
  predictions: PredictedProfitCoin[];
}
