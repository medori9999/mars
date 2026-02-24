import React, { useState, useEffect } from 'react';
import { Leaf, ChevronRight } from 'lucide-react';
import StockDetail from './StockDetail';
import { StockData, WatchlistItem, PortfolioItem, TransactionItem } from '../types';
import { fetchUserSolution } from '../api';

interface SolutionItem {
  id: number;
  type: string;
  text: string;
  imageUrl?: string;
}

interface StockStatusContentProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (stock: StockData) => void;
  cash: number;
  portfolio: PortfolioItem[];
  transactions: TransactionItem[];
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
  userName?: string; 
}

const StockStatusContent: React.FC<StockStatusContentProps> = ({ 
  watchlist, 
  onToggleWatchlist, 
  cash, 
  portfolio, 
  transactions,
  onBuy,
  onSell,
  userName = "01" 
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'solution'>('status');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const [solutionData, setSolutionData] = useState<SolutionItem[]>([]);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);

  const getMentorProfile = (typeStr: string) => {
    const t = typeStr.toLowerCase();
    if (t.includes('공격') || t.includes('aggressive')) return { name: '공격적 여우', img: '/Aggressive_Fox.png' };
    if (t.includes('안정') || t.includes('stable')) return { name: '안정형 여우', img: '/Stable_Fox.png' };
    if (t.includes('비관') || t.includes('pessimistic') || t.includes('contrarian')) return { name: '비관적 여우', img: '/Pessimistic_Fox.png' };
    if (t.includes('부엉') || t.includes('owl') || t.includes('mentor')) return { name: '멘토 부엉이', img: '/Mentor_Owl.png' };
    return { name: typeStr, img: '/Stable_Fox.png' };
  };

  const defaultMentors: SolutionItem[] = [
    { id: 0, type: '멘토 부엉이', text: '아직 분석할 거래 내역이 부족합니다. 첫 주식을 매수하시면 저와 3명의 여우들이 맞춤형 피드백을 제공해 드립니다!', imageUrl: '/Mentor_Owl.png' },
    { id: 1, type: '공격적 여우', text: '아직 거래가 없으시네요! 지금이 기회일지도 모릅니다. 과감하게 관심 종목을 매수해 보세요!', imageUrl: '/Aggressive_Fox.png' },
    { id: 2, type: '안정형 여우', text: '서두르지 마세요. 처음엔 우량주 위주로 소액 분산 투자를 해보시는 것을 추천합니다.', imageUrl: '/Stable_Fox.png' },
    { id: 3, type: '비관적 여우', text: '섣부른 투자는 금물입니다. 지금 시장이 좋아 보여도 언제 폭락할지 모릅니다. 신중하게 관망하세요.', imageUrl: '/Pessimistic_Fox.png' }
  ];

  useEffect(() => {
    if (activeTab === 'solution') {
      const loadRealLLMFeedback = async () => {
        setIsLoadingSolution(true);
        try {
          const safeUserName = userName.replace(/^USER_/, '');
          const apiData = await fetchUserSolution(safeUserName);
          
          if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            setSolutionData(apiData.map((item: any, index: number) => {
              const profile = getMentorProfile(item.type || '멘토');
              return {
                id: index,
                type: profile.name,
                text: item.text || item.advice || '분석 내용을 불러올 수 없습니다.',
                imageUrl: item.imageUrl || profile.img
              };
            }));
          } else {
            setSolutionData(defaultMentors);
          }
        } catch (error) {
          console.error("LLM 데이터 로드 실패", error);
          setSolutionData(defaultMentors);
        } finally {
          setIsLoadingSolution(false); 
        }
      };
      loadRealLLMFeedback();
    }
  }, [activeTab, userName]);

  const stockValue = portfolio.reduce((acc, item) => {
    const priceNum = typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^0-9]/g, '')) || 0;
    return acc + (priceNum * item.sharesCount);
  }, 0);
  
  const totalAssets = cash + stockValue;
  const INITIAL_ASSETS = 5000000; 
  const unrealizedPnL = totalAssets - INITIAL_ASSETS; 
  const returnRate = INITIAL_ASSETS > 0 ? (unrealizedPnL / INITIAL_ASSETS) * 100 : 0; 
  const isProfitable = unrealizedPnL >= 0;

  const formatChange = (changeStr: string | number) => {
    const str = String(changeStr);
    const num = parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
    const isUp = num >= 0;
    const displayNum = Math.abs(num).toFixed(2);
    
    return {
      text: `${isUp ? '+' : '-'}${displayNum}%`,
      colorClass: isUp ? 'text-[#E53935]' : 'text-[#1E88E5]', 
      arrow: isUp ? '▲' : '▼'
    };
  };

  // 내 진짜 평균 매수 단가 계산
  const calculateItemReturn = (item: PortfolioItem) => {
    const buyTransactions = transactions.filter(t => t.name === item.name && t.type === 'buy');
    
    let avgPrice = 0;
    if (buyTransactions.length > 0) {
      let totalCost = 0;
      let totalQty = 0;
      buyTransactions.forEach(t => {
          const qty = parseInt(String(t.qty).replace(/[^0-9]/g, '')) || 0;
          const price = parseInt(String(t.pricePerShare).replace(/[^0-9]/g, '')) || 0;
          totalCost += (qty * price);
          totalQty += qty;
      });
      avgPrice = totalQty > 0 ? Math.round(totalCost / totalQty) : 0;
    }

    const currentPrice = typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^0-9]/g, '')) || 0;
    
    if (avgPrice === 0 || currentPrice === 0) {
      return { avgPrice: 0, returnAmt: 0, returnPct: 0, isUp: true };
    }

    const returnAmt = (currentPrice - avgPrice) * item.sharesCount;
    const returnPct = ((currentPrice - avgPrice) / avgPrice) * 100;
    const isUp = returnAmt >= 0;

    return { avgPrice, returnAmt, returnPct, isUp };
  };

  if (selectedStock) {
    const isLiked = watchlist.some(item => item.name === selectedStock.name);
    return (
      <StockDetail 
        stock={selectedStock} 
        isLiked={isLiked}
        onToggleWatchlist={() => onToggleWatchlist(selectedStock)}
        onBack={() => setSelectedStock(null)} 
        onBuy={onBuy}
        onSell={onSell}
        cash={cash}
        userName={userName}
      />
    );
  }

  const renderHistoryView = () => {
    const filteredTransactions = transactionFilter === 'all'
      ? transactions
      : transactions.filter(item => item.type === transactionFilter);

    return (
      <div className="flex flex-col bg-[#CFE3FA] animate-in fade-in duration-300 pb-32">
        <div className="p-6 pb-8 relative overflow-hidden rounded-b-[2rem]" style={{ background: 'linear-gradient(135deg, #3082F5 0%, #004FFE 100%)' }}>
          <div className="flex flex-col space-y-1 relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tight">주식 거래 내역</h2>
            <p className="text-xs font-bold text-white/70">최근 보유 종목 거래 현황입니다.</p>
          </div>
          <div className="absolute right-4 top-4 text-white/10">
            <Leaf size={64} fill="currentColor" />
          </div>
        </div>

        <div className="flex space-x-2 px-4 pt-4 pb-0">
          {(['all', 'buy', 'sell'] as const).map((filter) => {
            const label = filter === 'all' ? '전체' : filter === 'buy' ? '매수' : '매도';
            const isActive = transactionFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setTransactionFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
                  isActive ? 'bg-[#004FFE] text-white shadow-md' : 'bg-gray-200/50 text-gray-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-4 relative z-20">
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100/50">
            <div className="divide-y divide-gray-50">
              {filteredTransactions.length > 0 ? filteredTransactions.map((item) => (
                <div key={item.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#F5F8FC] text-[#004FFE] text-[10px] font-black px-2.5 py-1 rounded-full">
                        거래완료
                      </span>
                      <span className="text-xs font-black text-gray-400">
                        {item.type === 'buy' ? '주식매수' : '주식매도'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-300">
                      {item.date} {item.time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center p-2 bg-white shadow-sm overflow-hidden ${item.logoBg || ''}`}>
                        {item.logoUrl ? (
                          <img src={item.logoUrl} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className={`font-black text-xs ${item.logoBg ? 'text-white' : 'text-gray-600'}`}>{item.logoText}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg font-black text-gray-800 leading-none mb-1">{item.name}</h3>
                        {/* 🔥 방어 코드 추가: 데이터가 살짝 늦어도 에러 없이 표시 */}
                        <span className="text-[11px] font-bold text-gray-400">
                          단가: {item.pricePerShare || '0원'} · {item.qty || '0주'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-1">
                      <span className={`${item.type === 'buy' ? 'text-[#E53935]' : 'text-[#1E88E5]'} text-lg font-black tracking-tighter`}>
                        {item.type === 'buy' ? '' : '+'} {item.amount || '0원'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-gray-400 font-bold text-sm">
                  거래 내역이 없습니다. (App.tsx 연동 대기중)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSolutionView = () => (
    <div className="flex flex-col bg-[#CFE3FA] animate-in fade-in duration-300 px-4 pt-4 pb-32">
      {isLoadingSolution && (
        <div className="text-center py-5 text-xs font-bold text-[#004FFE] animate-pulse">
          AI 멘토들이 유저님의 매매 기록을 실시간으로 분석 중입니다...
        </div>
      )}
      
      {!isLoadingSolution && solutionData.map((solution) => (
        <div 
          key={solution.id} 
          className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100/50 relative overflow-hidden group hover:shadow-md transition-all"
          style={{ marginBottom: '16px' }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
          
          <div className="flex items-start space-x-4 relative z-10">
            <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               <img 
                 src={solution.imageUrl} 
                 alt={solution.type} 
                 className="w-full h-full object-contain"
                 onError={(e) => { (e.target as HTMLImageElement).src = '/Stable_Fox.png' }}
               />
            </div>

            <div className="flex-1 flex flex-col">
              <div className="mb-2">
                <h3 className="text-base font-black text-gray-800 tracking-tight">{solution.type}</h3>
              </div>
              <p className="text-[12px] font-bold text-gray-600 leading-relaxed tracking-tight whitespace-pre-wrap">
                {solution.text}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStatusView = () => (
    <div className="flex flex-col animate-in fade-in duration-300 pb-32">
      <div className="relative mt-2 mb-8 px-5">
        <div className="bg-[#004FFE] rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="flex flex-col space-y-1 relative z-10">
            <span className="text-[11px] text-white/70 font-bold flex items-center">
              총 보유자산
            </span>
            <h1 className="text-2xl font-black text-white tracking-tighter mb-4">
              {totalAssets.toLocaleString()}원
            </h1>
            <div className="h-[1px] w-full bg-white/10 my-2"></div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/50 font-bold">평가손익</span>
                <span className={`text-sm font-black ${isProfitable ? 'text-red-300' : 'text-blue-300'}`}>
                  {isProfitable ? '+' : ''}{unrealizedPnL.toLocaleString()}원
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-white/50 font-bold">수익률</span>
                <span className={`text-sm font-black ${isProfitable ? 'text-red-300' : 'text-blue-300'}`}>
                  {isProfitable ? '+' : ''}{returnRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 px-5">
        <div className="flex items-center space-x-1 mb-3 cursor-pointer group">
          <h2 className="text-lg font-black text-gray-800">보유자산 포트폴리오</h2>
          <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <div className="space-y-2.5">
          {portfolio.length > 0 ? portfolio.map((item) => {
            const myReturn = calculateItemReturn(item);

            return (
              <div 
                key={item.id}
                onClick={() => setSelectedStock(item as any)}
                className="bg-white rounded-[1.5rem] p-3.5 flex flex-col shadow-sm border border-gray-50/50 cursor-pointer active:scale-[0.98] transition-all hover:border-[#004FFE]/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center text-white font-black text-lg shadow-sm`}>
                      {item.logoText}
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                      </div>
                      <span className="text-[11px] font-bold text-gray-400">{item.shares}</span>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    {/* 🔥 이 부분 핵심 수정: '평단가'를 대놓고 보여줘서 유저가 얼마에 샀는지 바로 확인 가능하게 변경! */}
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">
                      {myReturn.avgPrice > 0 ? `매수단가 ${myReturn.avgPrice.toLocaleString()}원 · 현재가` : '현재가'}
                    </span>
                    <span className="text-sm font-black text-gray-800">
                      {typeof item.price === 'number' ? item.price.toLocaleString() + '원' : item.price}
                    </span>
                    <div className={`flex items-center text-[11px] font-black mt-0.5 ${
                        myReturn.avgPrice === 0 ? 'text-gray-400' : (myReturn.isUp ? 'text-[#E53935]' : 'text-[#1E88E5]')
                      }`}
                    >
                      {myReturn.avgPrice === 0 
                        ? "0.00% (▲0원)" 
                        : `${myReturn.isUp ? '+' : ''}${myReturn.returnPct.toFixed(2)}% (${myReturn.isUp ? '▲' : '▼'}${Math.abs(myReturn.returnAmt).toLocaleString()}원)`
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-6 text-gray-400 text-xs font-bold bg-white rounded-[1.5rem] border border-gray-50/50">
              보유한 주식이 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 px-5">
        <div className="flex items-center space-x-1 mb-3">
          <h2 className="text-lg font-black text-gray-800">관심 종목</h2>
          <span className="text-[#E53935]">❤️</span>
        </div>
        <div className="space-y-2.5">
          {watchlist.length > 0 ? watchlist.map((item) => {
            const changeInfo = formatChange(item.change);
            return (
              <div 
                key={item.id}
                onClick={() => setSelectedStock(item as any)}
                className="bg-white rounded-[1.5rem] p-3.5 flex items-center justify-between shadow-sm border border-gray-50/50 cursor-pointer active:scale-[0.98] transition-all hover:border-[#004FFE]/30"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center text-white font-black text-lg shadow-sm`}>
                    {item.logoText}
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400">{item.shares}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-black text-gray-800">
                      {typeof item.price === 'number' ? item.price.toLocaleString() + '원' : item.price}
                    </span>
                    <div className={`flex items-center text-[11px] font-black ${changeInfo.colorClass}`}>
                      {changeInfo.text} {changeInfo.arrow}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-200" />
                </div>
              </div>
            );
          }) : (
             <div className="text-center py-6 text-gray-400 text-xs font-bold bg-white rounded-[1.5rem] border border-gray-50/50">
               아직 관심 종목이 없습니다.
             </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      <div className="p-5 pb-3 shrink-0">
        <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center justify-between">
          <button onClick={() => setActiveTab('status')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'status' ? 'bg-[#004FFE] text-white shadow-sm' : 'text-gray-400'}`}>주식현황</button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-[#004FFE] text-white shadow-sm' : 'text-gray-400'}`}>거래내역</button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button onClick={() => setActiveTab('solution')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'solution' ? 'bg-[#004FFE] text-white shadow-sm' : 'text-gray-400'}`}>솔루션</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'status' && renderStatusView()}
        {activeTab === 'history' && renderHistoryView()}
        {activeTab === 'solution' && renderSolutionView()}
      </div>
    </div>
  );
};

export default StockStatusContent;