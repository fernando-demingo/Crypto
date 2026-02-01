
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCoinHistory, fetchCoinStats, fetchTopOpportunities } from './services/cryptoService';
import { getMarketAnalysis, getFutureProfitPredictions } from './services/geminiService';
import { CryptoDataState, RecommendationType, PredictedProfitCoin } from './types';
import MarketChart from './components/MarketChart';
import RecommendationBadge from './components/RecommendationBadge';

interface ForecastTableProps {
  predictions: PredictedProfitCoin[];
  onSelectCoin: (id: string) => void;
  selectedId: string;
}

const ForecastTable: React.FC<ForecastTableProps> = ({ predictions, onSelectCoin, selectedId }) => {
  if (!predictions.length) return null;

  const top10Predictions = useMemo(() => 
    [...predictions].sort((a, b) => b.predictedMove - a.predictedMove).slice(0, 10),
    [predictions]
  );

  return (
    <div className="mb-8 overflow-hidden glass-card rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
      <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
          <i className="fas fa-magic"></i>
          AI FORECAST: TOP 10 PROFIT OPPORTUNITIES (NEXT 12H)
        </h2>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Prediction Engine v2.0</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Predicted Move</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Risk Score</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Rationale</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {top10Predictions.map((p) => (
              <tr 
                key={p.id} 
                onClick={() => onSelectCoin(p.id)}
                className={`hover:bg-slate-700/40 transition-colors group cursor-pointer ${selectedId === p.id ? 'bg-emerald-500/5' : ''}`}
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">{p.symbol.toUpperCase()}</span>
                    <span className="text-slate-500 text-[10px] uppercase">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`font-mono font-bold ${p.predictedMove >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {p.predictedMove >= 0 ? '+' : ''}{p.predictedMove.toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-3 rounded-full ${i < p.riskScore ? (p.riskScore > 7 ? 'bg-rose-500' : p.riskScore > 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-800'}`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <p className="text-slate-400 text-xs italic line-clamp-1 max-w-xs group-hover:line-clamp-none transition-all">"{p.rationale}"</p>
                </td>
                <td className="px-6 py-3 text-right">
                   <span className={`text-[10px] font-bold py-1 px-2 rounded border ${selectedId === p.id ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:border-emerald-500 group-hover:text-emerald-400'}`}>
                     {selectedId === p.id ? 'ANALYZING' : 'VIEW GRAPH'}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedCoinId, setSelectedCoinId] = useState('bitcoin');
  const [searchQuery, setSearchQuery] = useState('');
  const [state, setState] = useState<CryptoDataState>({
    history: [],
    stats: null,
    analysis: null,
    isLoading: true,
    error: null,
    topGainers: [],
    predictions: []
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const loadData = useCallback(async (isAutoRefresh = false, coinId = selectedCoinId) => {
    if (!isAutoRefresh) setState(prev => ({ ...prev, isLoading: true }));
    setIsRefreshing(true);
    
    try {
      const [history, stats, opportunities] = await Promise.all([
        fetchCoinHistory(coinId, 1),
        fetchCoinStats(coinId),
        fetchTopOpportunities()
      ]);

      if (stats) {
        // Only run expensive AI predictions periodically or on manual change
        const [analysis, predictions] = await Promise.all([
          getMarketAnalysis(stats, history),
          getFutureProfitPredictions(opportunities)
        ]);
        
        setState(prev => ({
          ...prev,
          history,
          stats,
          analysis: analysis || prev.analysis,
          topGainers: opportunities.length > 0 ? opportunities : prev.topGainers,
          predictions: predictions.length > 0 ? predictions : prev.predictions,
          isLoading: false,
          error: null
        }));
      }
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Market connection issue. Showing cached or mock data."
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedCoinId]);

  useEffect(() => {
    loadData(false, selectedCoinId);
    const interval = setInterval(() => loadData(true), 120000); 
    return () => clearInterval(interval);
  }, [selectedCoinId]);

  const handleManualRefresh = () => loadData();

  const handleCoinSelect = (id: string) => {
    const cleanId = id.toLowerCase().trim().replace(/\s+/g, '-');
    setSelectedCoinId(cleanId);
    setShowDropdown(false);
    setSearchQuery('');
    
    const target = document.getElementById('market-analysis-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleCoinSelect(searchQuery);
    }
  };

  const sortedDropdownPredictions = useMemo(() => 
    [...state.predictions].sort((a, b) => b.predictedMove - a.predictedMove),
    [state.predictions]
  );

  if (state.isLoading && !state.stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium animate-pulse-slow tracking-widest uppercase text-sm">Syncing Neural Networks...</p>
      </div>
    );
  }

  const isPositive = (state.stats?.change24h || 0) >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <i className="fas fa-chart-line text-white text-xl"></i>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">CryptoPulse <span className="text-emerald-500">AI</span></h1>
          </div>
          <p className="text-slate-400">Intelligent 12h short-term opportunity monitor.</p>
        </div>
        
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className={`px-4 py-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-3 ${isRefreshing ? 'opacity-50' : ''}`}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Sync Market</span>
          <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
        </button>
      </header>

      {state.error && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/50 rounded-xl text-amber-400 flex items-center gap-3">
          <i className="fas fa-info-circle"></i>
          <p className="text-sm font-medium">{state.error}</p>
        </div>
      )}

      {/* FORECAST TABLE - Clickable rows update graph */}
      <ForecastTable 
        predictions={state.predictions} 
        onSelectCoin={handleCoinSelect} 
        selectedId={selectedCoinId} 
      />

      {/* SEARCH AND SELECTION AREA */}
      <div className="mb-10 flex flex-col md:flex-row items-stretch gap-4">
        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-search text-slate-500 text-sm"></i>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type ID (e.g. cardano, ripple)..."
            className="w-full pl-10 pr-4 py-4 bg-slate-800/80 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white font-medium placeholder:text-slate-500 shadow-xl"
          />
          <button 
            type="submit"
            className="absolute inset-y-2 right-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
          >
            ANALYZE
          </button>
        </form>

        {/* Dropdown (Sorted by Profit) */}
        <div className="relative flex-grow md:max-w-xs">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all shadow-xl group"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-arrow-trend-up text-emerald-400 group-hover:scale-110 transition-transform"></i>
              <span className="font-bold text-sm">Sort by 12h ROI</span>
            </div>
            <i className={`fas fa-chevron-down text-xs transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-card rounded-2xl border border-slate-700 shadow-2xl max-h-96 overflow-y-auto">
              <div className="p-2 space-y-1">
                {sortedDropdownPredictions.length > 0 ? (
                  sortedDropdownPredictions.map((coin, index) => (
                    <button
                      key={coin.id}
                      onClick={() => handleCoinSelect(coin.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-500/10 transition-colors ${selectedCoinId === coin.id ? 'bg-emerald-500/10 border border-emerald-500/30' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-slate-600 w-4">{index + 1}</span>
                        <div className="text-left">
                          <p className="text-white text-sm font-bold leading-none mb-1">{coin.symbol.toUpperCase()}</p>
                          <p className="text-slate-500 text-[9px] uppercase font-bold truncate max-w-[100px]">{coin.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-mono font-bold ${coin.predictedMove >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          +{coin.predictedMove.toFixed(2)}%
                        </p>
                        <p className="text-[8px] font-black text-slate-600 uppercase">ROI (12H)</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs italic">
                    Analyzing top assets...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="market-analysis-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               {state.stats && <img src={state.stats.image} className="w-32 h-32 grayscale" alt="watermark" />}
            </div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                {state.stats && <img src={state.stats.image} alt={state.stats.name} className="w-12 h-12 rounded-xl shadow-lg shadow-black/20" />}
                <div>
                  <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{state.stats?.name} / USD</h2>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold mono tracking-tight text-white">
                      ${state.stats?.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                    <span className={`text-lg font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isPositive ? '+' : ''}{state.stats?.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <MarketChart 
              data={state.history} 
              signals={state.analysis?.historicalSignals}
              isPositive={isPositive} 
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-700/50">
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">24h High</p>
                <p className="text-slate-200 font-bold mono text-sm">${state.stats?.high24h.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">24h Low</p>
                <p className="text-slate-200 font-bold mono text-sm">${state.stats?.low24h.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Sentiment</p>
                <p className={`font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isPositive ? 'BULLISH' : 'BEARISH'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Trading Vol</p>
                <p className="text-slate-400 text-sm mono font-bold">
                  ${((state.stats?.volume || 0) / 1e6).toFixed(1)}M
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-blue-500 group hover:border-l-8 transition-all">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <i className="fas fa-microchip text-blue-400 group-hover:rotate-12 transition-transform"></i>
                Trend Intelligence
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Detecting support/resistance clusters for {state.stats?.symbol.toUpperCase()}. AI indicates {isPositive ? 'accumulation' : 'distribution'} phase.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500 group hover:border-l-8 transition-all">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <i className="fas fa-shield-alt text-emerald-400"></i>
                Risk Shield
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Global volatility is {state.stats?.volume && state.stats.volume > 1000000000 ? 'ELEVATED' : 'STABLE'}. Recommend tighter stop-losses if trading the 12h predicted breakout.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className="glass-card rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full border-t-4 border-t-emerald-500 relative">
            <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight text-white">
                <i className="fas fa-robot text-emerald-400 animate-pulse"></i>
                AI Trade Pulse
              </h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-black">REALTIME</span>
            </div>
            
            <div className="p-6 flex-grow space-y-6">
              {state.analysis ? (
                <>
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 text-center shadow-inner">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">AI SIGNAL RECOMMENDATION</span>
                    <RecommendationBadge type={state.analysis.recommendation} />
                    <div className="mt-5 w-full space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>CONFIDENCE</span>
                        <span>{state.analysis.confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                          style={{ width: `${state.analysis.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/20 rounded-xl border border-slate-700/30">
                      <h4 className="text-slate-400 text-[10px] font-bold uppercase mb-2 tracking-widest">Analytical Core</h4>
                      <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                        "{state.analysis.rationale}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Target Outlook</p>
                        <p className="text-emerald-400 text-xs font-bold">{state.analysis.shortTermOutlook}</p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Risk Profile</p>
                        <p className={`text-xs font-bold ${
                          state.analysis.riskLevel === 'Low' ? 'text-green-400' :
                          state.analysis.riskLevel === 'Medium' ? 'text-yellow-400' :
                          'text-rose-400'
                        }`}>{state.analysis.riskLevel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 text-[9px] text-slate-600 text-center font-mono font-bold uppercase tracking-widest">
                    AI AGENT REFRESH: {new Date(state.analysis.timestamp).toLocaleTimeString()}
                  </div>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Scanning Market Depth...</p>
                </div>
              )}
            </div>
          </section>

          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 shadow-xl">
             <div className="flex items-center gap-3 mb-3">
               <i className="fas fa-graduation-cap text-blue-400"></i>
               <h4 className="text-white text-sm font-bold">AI Strategy Tip</h4>
             </div>
             <p className="text-slate-400 text-xs leading-relaxed font-medium">
               Click any row in the Forecast Table above to instantly sync the analysis and chart to that specific high-potential asset.
             </p>
          </div>
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[11px] font-bold tracking-widest uppercase">
        <p>&copy; {new Date().getFullYear()} CryptoPulse AI Engine • Quantum Intelligence</p>
        <div className="flex gap-6">
          <span className="hover:text-emerald-500 transition-colors cursor-pointer">Live Node Status</span>
          <span className="hover:text-emerald-500 transition-colors cursor-pointer">Algorithm Docs</span>
          <span className="hover:text-emerald-500 transition-colors cursor-pointer">Compliance</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
