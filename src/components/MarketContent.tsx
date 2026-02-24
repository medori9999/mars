import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { StockData, WatchlistItem } from '../types';
import { marketIndices, RankedStock } from '../data/mockData';
import { tutorialStockData } from '../data/tutorialStock';
import StockDetail from './StockDetail';
import MarketTour from './onboarding/MarketTour';

interface MarketContentProps {
  stocks: StockData[];
  watchlist: WatchlistItem[];
  onToggleWatchlist: (stock: StockData) => void;
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
  cash?: number;
  homeTourCompleted?: boolean;
}

const MarketContent: React.FC<MarketContentProps> = ({ 
  stocks, 
  watchlist, 
  onToggleWatchlist, 
  onBuy, 
  onSell, 
  cash = 0, 
  homeTourCompleted = false 
}) => {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [marketTourVisible, setMarketTourVisible] = useState(false);
  const [detailTab, setDetailTab] = useState('차트');
  const [rankFilter, setRankFilter] = useState<'up' | 'down' | 'volume'>('up');
  const [category, setCategory] = useState('전체');
  const [showAllRanking, setShowAllRanking] = useState(false);

  // 시장 투어
  useEffect(() => {
    const checkTour = () => {
      const isPending = localStorage.getItem('market-highlight-pending') === 'true';
      const isDone = localStorage.getItem('market-tour-done') === 'true';

      if (isPending && !isDone) {
        setMarketTourVisible(true);
      }
    };

    checkTour();
    window.addEventListener('check-market-highlight', checkTour);
    return () => window.removeEventListener('check-market-highlight', checkTour);
  }, [homeTourCompleted]);
  
  // 랭킹 데이터 매핑
  const rankingStocks: RankedStock[] = useMemo(() => {
    return [tutorialStockData, ...stocks].map((stock) => {
      const rawPrice = (stock as any).current_price ?? parseInt(String(stock.price || '0').replace(/[^0-9]/g, '')) ?? 0;
      const rawChange = (stock as any).change_rate ?? parseFloat(String(stock.change || '0').replace(/[^0-9.-]/g, '')) ?? 0;
      
      return {
        ...stock,
        // 🔥 [핵심 원인 해결] Math.random() 때문에 클릭할 때마다 주식이 섞이는 현상 완벽 차단!
        id: stock.symbol || stock.name, 
        price: (stock as any).current_price !== undefined ? `${rawPrice.toLocaleString()}원` : (stock.price || '0원'),
        changeValue: rawChange,
        changeText: (stock as any).change_rate !== undefined ? `${rawChange > 0 ? '+' : ''}${rawChange.toFixed(2)}%` : (stock.change || '0%'),
        isUp: rawChange >= 0,
        category: stock.badge || (stock as any).sector || "기타",
        volume: (stock as any).volume || 0
      };
    });
  }, [stocks]);

  const filteredAndSortedRanking = useMemo(() => {
    const list = [...rankingStocks].sort((a, b) => {
      if (rankFilter === 'up') return b.changeValue - a.changeValue;
      else if (rankFilter === 'down') return a.changeValue - b.changeValue;
      else {
        const volA = (a as any).volume ?? 0;
        const volB = (b as any).volume ?? 0;
        return volB - volA;
      }
    });
    return showAllRanking ? list : list.slice(0, 5);
  }, [rankFilter, showAllRanking, rankingStocks]);

  const currentCategoryStocks = useMemo(() => {
    let list = [...rankingStocks];
    if (category !== '전체') list = list.filter(stock => stock.category === category);
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [category, rankingStocks]);

  const handleStockClick = (stock: StockData) => setSelectedStock(stock);

  const categories = ['전체', '바이오', 'IT', '전자', '금융'];

  const renderTour = () => (
    marketTourVisible && (
      <MarketTour 
        onComplete={() => setMarketTourVisible(false)}
        onNavigateDetail={() => {
          if (filteredAndSortedRanking.length > 0) setSelectedStock(filteredAndSortedRanking[0]);
        }}
        onSelectTab={setDetailTab}
      />
    )
  );

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {renderTour()}
      
      {selectedStock ? (
        <div className="flex-1 overflow-hidden animate-in slide-in-from-right duration-300">
          <StockDetail
            stock={selectedStock}
            isLiked={watchlist.some(item => item.name === selectedStock.name)}
            onToggleWatchlist={() => onToggleWatchlist(selectedStock)}
            onBack={() => {
              setSelectedStock(null);
              setDetailTab('차트');
            }}
            // 🔥 [충돌 원인 해결] localhost가 박혀있던 중복 함수 제거하고 정상적인 onBuy, onSell로 다이렉트 연결!
            onBuy={onBuy}
            onSell={onSell}
            cash={cash}
            externalTab={detailTab}
            onTabChange={setDetailTab}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-[#CFE3FA] rounded-t-[2.5rem] overflow-hidden animate-in fade-in duration-300">
          <div className="px-5 pt-6 pb-4">
            <div className="bg-white border border-gray-100 rounded-full flex items-center px-4 py-1 shadow-sm focus-within:ring-2 focus-within:ring-[#004FFE]/20 transition-all">
              <Search className="text-gray-400 shrink-0" size={20} />
              <input 
                type="text" 
                placeholder="궁금한 종목을 검색해보세요!" 
                className="w-full bg-transparent border-none py-2.5 pl-2 pr-4 text-sm font-bold text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-32">
            <section id="market-trends" className="mb-8">
              <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">시장 동향</h2>
              <div className="grid grid-cols-3 gap-3">
                {marketIndices.map((index) => (
                  <div key={index.name} className="bg-white p-3.5 rounded-2xl flex flex-col space-y-1 border border-gray-100 shadow-sm transition-transform active:scale-95">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{index.name}</span>
                    <span className="text-sm font-black text-gray-800 tracking-tighter">{index.value}</span>
                    <div className={`flex items-center text-[10px] font-black ${index.isUp ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>
                      {index.isUp ? '▲' : '▼'} {index.change}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 id="market-ranking" className="text-base font-black text-gray-800 flex items-center tracking-tight">실시간 랭킹</h2>
              </div>
              <div className="flex space-x-2 mb-4">
                <button onClick={() => setRankFilter('up')} className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${rankFilter === 'up' ? 'bg-[#004FFE] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>상승폭</button>
                <button onClick={() => setRankFilter('down')} className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${rankFilter === 'down' ? 'bg-[#004FFE] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>하락폭</button>
                <button onClick={() => setRankFilter('volume')} className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${rankFilter === 'volume' ? 'bg-[#004FFE] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>거래량</button>
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-6 transition-all duration-300">
                {filteredAndSortedRanking.map((stock, index) => (
                  <div key={stock.id} id={index === 0 ? 'market-ranking-first' : undefined} onClick={() => handleStockClick(stock)} className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer active:scale-[0.98]">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-[#004FFE] rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">{index + 1}</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-800 text-sm tracking-tight">{stock.name}</span>
                        <span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">가상</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-800 tracking-tighter">{stock.price}</p>
                      {rankFilter === 'volume' ? (
                        <p className="text-[11px] font-black text-gray-400">{((stock as any).volume ?? 0).toLocaleString()}주</p>
                      ) : (
                        <p className={`text-[11px] font-black flex items-center justify-end ${(stock as any).isUp ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>{(stock as any).isUp ? '▲' : '▼'} {stock.changeText}</p>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowAllRanking(!showAllRanking)} className="w-full py-3.5 bg-gray-100/50 hover:bg-gray-100 rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-95">
                  {showAllRanking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{showAllRanking ? '접기' : '전체 보기'}</span>
                </button>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">분야별</h2>
              <div className="flex space-x-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)} className={`flex-none px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${category === cat ? 'bg-[#004FFE] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>{cat}</button>
                ))}
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white space-y-6 min-h-[150px]">
                {currentCategoryStocks.length > 0 ? (
                  currentCategoryStocks.map((stock, index) => (
                    <div key={stock.id} onClick={() => handleStockClick(stock)} className="flex items-center justify-between animate-in fade-in duration-300 cursor-pointer active:scale-[0.98]">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-[#004FFE] rounded-lg flex items-center justify-center text-white font-black text-xs">{index + 1}</div>
                        <div className="flex items-center space-x-2"><span className="font-bold text-gray-800 text-sm tracking-tight">{stock.name}</span><span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">가상</span></div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-black text-gray-800 tracking-tighter">{stock.price}</p>
                        <div className={`flex items-center text-[10px] font-black ${(stock as any).isUp ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>{(stock as any).isUp ? '▲' : '▼'} {stock.changeText}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-gray-300 text-xs font-bold">해당 조건에 맞는 데이터가 없습니다.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketContent;