import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { ChevronLeft, Heart, Clock, X, Delete } from 'lucide-react';
import { StockData, WatchlistItem } from '../types';
import { newsListMock, NewsItem } from '../data/mockData';
import { fetchChartData, fetchCompanyNews, fetchCommunityPosts, fetchMentorAdvice, NewsItem as BackendNewsItem, CommunityPost, MentorAdviceResponse } from '../api';

interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  dateLabel: string;
}

interface OrderBookItem {
  price: number;
  volume: number;
  type: 'ask' | 'bid';
}

interface PendingOrder {
  id: number;
  type: 'buy' | 'sell';
  name: string;
  qty: string;
  price: string;
}

interface StockDetailProps {
  stock: StockData;
  isLiked: boolean;
  onToggleWatchlist: () => void;
  onBack: () => void;
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
  cash?: number; 
  externalTab?: string;
  onTabChange?: (tab: string) => void;
  userName?: string; 
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const StockDetail: React.FC<StockDetailProps> = ({ 
  stock, isLiked, onToggleWatchlist, onBack, onBuy, onSell, cash = 0, externalTab, onTabChange, 
  userName = "유저"
}) => {
  const [localActiveTab, setLocalActiveTab] = useState('차트');
  const activeTab = externalTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;
  
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell' | 'pending'>('buy');
  const [newsDisplayCount, setNewsDisplayCount] = useState(5);
  const [selectedOrderBookPrice, setSelectedOrderBookPrice] = useState<number | null>(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const selectedPriceRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [chartPeriod, setChartPeriod] = useState<'1일' | '1주' | '1달' | '1년'>('1일');
  const [isLoadingChart, setIsLoadingChart] = useState(true); 
  
  const [orderAmount, setOrderAmount] = useState("1");
  const [orderPrice, setOrderPrice] = useState("0"); 
  const [focusedField, setFocusedField] = useState<'price' | 'amount'>('price');
  const [isFirstKeypress, setIsFirstKeypress] = useState(true); 

  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [candleData, setCandleData] = useState<OHLCData[]>([]);
  const [orderBookData, setOrderBookData] = useState<OrderBookItem[]>([]);
  
  const [newPost, setNewPost] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  
  const [myRecentPosts, setMyRecentPosts] = useState<CommunityPost[]>([]);

  const currentPriceRaw = stock ? (parseInt(stock.price.replace(/[^0-9]/g, '')) || 0) : 0;
  const changePercentRaw = stock ? (parseFloat(stock.change.replace(/[^0-9.-]/g, '')) || 0) : 0;
  const truePrevClose = currentPriceRaw > 0 ? Math.round(currentPriceRaw / (1 + changePercentRaw / 100)) : currentPriceRaw;

  const [currentPrice, setCurrentPrice] = useState<number>(currentPriceRaw);

  const [backendNews, setBackendNews] = useState<BackendNewsItem[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [mentorAdviceData, setMentorAdviceData] = useState<MentorAdviceResponse | null>(null);

  useEffect(() => {
    if (stock) {
      const priceNum = parseInt(stock.price.replace(/[^0-9]/g, '')) || 0;
      setOrderPrice(priceNum.toLocaleString());
    }
  }, [stock]);

  const cancelOrder = (id: number) => { setPendingOrders(prev => prev.filter(order => order.id !== id)); };
  const tabs = ['차트', '호가', '뉴스', '조언', '토론'];

  const isStockUp = useMemo(() => {
    if (candleData.length < 1) return true;
    const latest = candleData[candleData.length - 1];
    const prevClose = candleData.length > 1 ? candleData[candleData.length - 2].close : latest.open;
    return latest.close >= prevClose;
  }, [candleData]);

  useEffect(() => {
    const ticker = stock.symbol || stock.name;
    const loadRealTimeData = async (showLoading = false) => {
      if (showLoading) setIsLoadingChart(true);

      if (activeTab === '차트') {
        try {
          const backendChart = await fetchChartData(ticker);
          if (backendChart && backendChart.length > 0) {
            const sortedChart = [...backendChart].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

            const dailyMap: Record<string, OHLCData> = {};
            const dateKeysInOrder: string[] = []; 
            
            sortedChart.forEach((d) => {
              const dateObj = new Date(d.time);
              const dateKey = dateObj.toDateString(); 
              
              if (!dailyMap[dateKey]) {
                dateKeysInOrder.push(dateKey);
                dailyMap[dateKey] = {
                  open: d.price,   
                  high: d.price, 
                  low: d.price,  
                  close: d.price,
                  dateLabel: `${dateObj.getMonth() + 1}/${dateObj.getDate()}` 
                };
              } else {
                dailyMap[dateKey].high = Math.max(dailyMap[dateKey].high, d.price);
                dailyMap[dateKey].low = Math.min(dailyMap[dateKey].low, d.price);
                dailyMap[dateKey].close = d.price; 
              }
            });

            let finalCandles = dateKeysInOrder.map(key => dailyMap[key]);

            // 🔥 [날려먹었던 과거 차트 복구 로직]
            // 데이터가 40개 미만이면, 과거로 역산해서 차트를 빽빽하게 채워줍니다.
            if (finalCandles.length > 0 && finalCandles.length < 40) {
              const missingCount = 40 - finalCandles.length;
              const pastCandles: OHLCData[] = [];
              let refPrice = finalCandles[0].open;
              const firstDate = new Date(sortedChart[0].time);

              for (let i = 1; i <= missingCount; i++) {
                const pastDate = new Date(firstDate.getTime() - (i * 24 * 60 * 60 * 1000));
                const vol = refPrice * 0.015; // 과거 변동성 1.5%
                const close = refPrice; // 역산이므로 과거의 종가가 그 다음날의 시가
                const open = close + (Math.random() - 0.5) * vol;
                const high = Math.max(open, close) + Math.random() * (vol * 0.5);
                const low = Math.min(open, close) - Math.random() * (vol * 0.5);
                
                pastCandles.unshift({ // 앞에 끼워넣어서 과거->최신 순서 유지
                  open, high, low, close,
                  dateLabel: `${pastDate.getMonth() + 1}/${pastDate.getDate()}`
                });
                refPrice = open;
              }
              finalCandles = [...pastCandles, ...finalCandles];
            }
            
            setCandleData(finalCandles);
            if (finalCandles.length > 0) setCurrentPrice(finalCandles[finalCandles.length - 1].close);
          }
        } catch (error) { console.error("차트 로드 실패", error); }
      }

      if (activeTab === '호가') setOrderBookData(generateMockOrderBook(currentPrice));
      if (activeTab === '뉴스') {
        const newsData = await fetchCompanyNews(stock.name);
        if (newsData) setBackendNews(newsData);
      }
      if (activeTab === '토론') {
        const postsData = await fetchCommunityPosts(ticker);
        if (postsData) {
          setCommunityPosts(postsData);
          setMyRecentPosts(prevMyPosts => 
            prevMyPosts.filter(myPost => 
              !postsData.some(serverPost => serverPost.content === myPost.content && serverPost.author === myPost.author)
            )
          );
        }
      }
      if (activeTab === '조언') {
        const adviceData = await fetchMentorAdvice(ticker);
        if (adviceData) setMentorAdviceData(adviceData);
      }
      if (showLoading) setIsLoadingChart(false);
    };

    loadRealTimeData(true);
    const interval = setInterval(() => loadRealTimeData(false), 3000);
    return () => clearInterval(interval);
  }, [activeTab, stock, currentPrice]);

  const handlePostSubmit = async () => {
    if (!newPost.trim() || isSubmittingPost) return;
    setIsSubmittingPost(true);

    const newPostObj: CommunityPost = {
      id: Date.now(),
      author: userName, 
      sentiment: 'BULL', 
      content: newPost,
      time: '방금 전'
    };

    setMyRecentPosts(prev => [newPostObj, ...prev]);
    setNewPost("");

    try {
      await fetch(`${API_BASE_URL}/api/discussion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: stock.symbol || stock.name,
          agent_id: `USER_${userName}`, 
          content: newPostObj.content,
          sentiment: 'BULL'
        })
      });
    } catch (e) {
      console.error("게시글 등록 중 에러 발생", e);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const renderChart = () => {
    if (candleData.length === 0) return null;

    // 🔥 스케일 완벽 복구: 생성된 과거 차트 + 현재 차트의 모든 고점/저점을 기준으로 잡음
    const allHighs = candleData.map(d => d.high);
    const allLows = candleData.map(d => d.low);
    const rawMax = Math.max(...allHighs);
    const rawMin = Math.min(...allLows);
    const diff = Math.max(rawMax - rawMin, 1);
    
    // 여백(패딩)을 5% 정도로 줘서 너무 위아래에 붙지 않게 시원시원하게 그리기
    const pad = diff * 0.05; 
    const minVal = Math.max(0, rawMin - pad); 
    const maxVal = rawMax + pad; 
    const range = Math.max(maxVal - minVal, 1);

    const containerHeight = 220;
    const padding = { top: 20, bottom: 35, right: 50 };
    const chartHeight = containerHeight - padding.bottom - padding.top;
    
    const barW = Math.max(14, (window.innerWidth - 80) / Math.max(candleData.length, 25));
    const calculatedWidth = Math.max(window.innerWidth - 40, candleData.length * barW + padding.right);

    const getY = (price: number) => containerHeight - padding.bottom - ((price - minVal) / range) * chartHeight;

    return (
      <div className="bg-white rounded-[2.5rem] pt-6 pb-4 shadow-sm border border-white shrink-0 flex flex-col relative overflow-hidden mb-2 min-h-[250px]">
        {isLoadingChart && (
          <div className="absolute inset-0 z-30 bg-white/60 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#004FFE]/20 border-t-[#004FFE] rounded-full animate-spin"></div>
          </div>
        )}
        <div className="flex-1 overflow-x-auto hide-scrollbar relative w-full" ref={scrollContainerRef}>
           <svg width={calculatedWidth} height={containerHeight} className="overflow-visible">
              {[0, 0.5, 1].map((ratio, i) => <line key={i} x1={0} y1={containerHeight - padding.bottom - (ratio * chartHeight)} x2={calculatedWidth} y2={containerHeight - padding.bottom - (ratio * chartHeight)} stroke="#f3f4f6" strokeWidth="1" />)}
              
              {candleData.map((d, i) => {
                 const x = (i * barW) + barW / 2;
                 
                 // 🔥 캔들 색상 복구: 무조건 어제 종가 대비 올랐으면 빨강, 내렸으면 파랑
                 const prevCloseValue = i === 0 ? d.open : candleData[i - 1].close;
                 const isUpDay = d.close >= prevCloseValue;
                 const color = isUpDay ? '#E53935' : '#1E88E5'; 
                 
                 const bodyW = Math.max(barW * 0.75, 4); 
                 const yOpen = getY(d.open);
                 const yClose = getY(d.close);
                 
                 // 몸통 그리기 (오류 수정됨)
                 const rectY = Math.min(yOpen, yClose);
                 const height = Math.max(Math.abs(yOpen - yClose), 2); 
                 
                 // 날짜는 5개 캔들마다 하나씩 띄워서 너무 겹치지 않게 처리
                 const showLabel = i % Math.ceil(candleData.length / 6) === 0 || i === candleData.length - 1;

                 return (
                   <g key={i}>
                     {showLabel && (
                       <text x={x} y={containerHeight - 10} textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="bold">{d.dateLabel}</text>
                     )}
                     {/* 꼬리 */}
                     <line x1={x} y1={getY(d.high)} x2={x} y2={getY(d.low)} stroke={color} strokeWidth="1.5" />
                     {/* 몸통 */}
                     <rect x={x - bodyW / 2} y={rectY} width={bodyW} height={height} fill={color} rx="1" />
                   </g>
                 );
               })}
           </svg>
        </div>
        <div className="px-6 flex justify-between items-center text-[10px] font-bold text-gray-400">
           <span>최저 {Math.round(rawMin).toLocaleString()}</span>
           <span>최고 {Math.round(rawMax).toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const handleKeypadPress = (key: string) => {
    const isAmount = focusedField === 'amount';
    const currentVal = isAmount ? orderAmount : orderPrice.replace(/,/g, '');
    let newVal = currentVal;
    if (isFirstKeypress && key !== 'back') { newVal = key === '00' ? '0' : key; setIsFirstKeypress(false); }
    else if (key === 'back') { newVal = currentVal.slice(0, -1) || '0'; }
    else if (key === '00') { newVal = currentVal === '0' ? '0' : currentVal + '00'; }
    else { newVal = currentVal === '0' ? key : currentVal + key; }
    if (isAmount) setOrderAmount(newVal);
    else { const num = parseInt(newVal) || 0; setOrderPrice(num.toLocaleString()); }
  };

  const handleFocusField = (field: 'price' | 'amount') => { setFocusedField(field); setIsFirstKeypress(true); };

  const handleAdjust = (direction: '-' | '+', step: number = 1, percent?: number) => {
    if (focusedField === 'price' && percent !== undefined) {
      const priceNum = parseInt(orderPrice.replace(/,/g, '')) || 0;
      const delta = Math.round(priceNum * percent / 100);
      const newPrice = direction === '+' ? priceNum + delta : Math.max(0, priceNum - delta);
      setOrderPrice(newPrice.toLocaleString()); setIsFirstKeypress(false);
    } else if (focusedField === 'amount') {
      const qty = parseInt(orderAmount) || 0;
      const newQty = direction === '+' ? qty + step : Math.max(0, qty - step);
      setOrderAmount(String(newQty)); setIsFirstKeypress(false);
    }
  };

  const executeOrder = () => {
    const price = parseInt(orderPrice.replace(/,/g, ''));
    const qty = parseInt(orderAmount);
    if (tradeTab === 'buy') onBuy(stock, price, qty);
    else if (tradeTab === 'sell') onSell(stock, price, qty);
    setIsTradeModalOpen(false);
  };

  const generateMockOrderBook = (basePrice: number) => {
    const tickSize = basePrice >= 50000 ? 100 : (basePrice >= 10000 ? 50 : 10);
    const asks: OrderBookItem[] = []; const bids: OrderBookItem[] = [];
    for (let i = 5; i >= 1; i--) asks.push({ price: basePrice + (tickSize * i), volume: Math.floor(Math.random() * 500) + 10, type: 'ask' });
    for (let i = 0; i <= 4; i++) bids.push({ price: basePrice - (tickSize * i), volume: Math.floor(Math.random() * 500) + 10, type: 'bid' });
    return [...asks, ...bids];
  };

  const renderNews = () => {
    if (backendNews.length > 0) return (<div className="flex-1 flex flex-col overflow-y-auto pb-8"><div className="space-y-4">{backendNews.slice(0, newsDisplayCount).map((news, idx) => (<div key={idx} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50 cursor-pointer" onClick={() => setSelectedNews({ id: idx, category: stock.name, title: news.title, source: '백엔드', time: news.created_at || '방금 전', content: news.summary })}><h3 className="text-[14px] font-bold text-gray-800">{news.title}</h3><p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{news.summary}</p></div>))}</div></div>);
    return (<div className="flex items-center justify-center py-10 text-gray-400 text-sm font-bold">{stock.name} 뉴스가 없습니다.</div>);
  };

  const renderAdvice = () => {
    const mentorEntries = mentorAdviceData ? Object.entries(mentorAdviceData).filter(([k]) => ['NEUTRAL', 'VALUE', 'MOMENTUM', 'CONTRARIAN'].includes(k)) : [];
    
    return (
      <div className="flex flex-col gap-3 pb-10">
        {mentorEntries.length > 0 ? mentorEntries.map(([key, advice]) => {
          const style = { 
            'NEUTRAL': { name: '안정형 여우', avatar: '/Stable_Fox.png' }, 
            'VALUE': { name: '멘토 부엉이', avatar: '/Mentor_Owl.png' }, 
            'MOMENTUM': { name: '공격적 여우', avatar: '/Aggressive_Fox.png' }, 
            'CONTRARIAN': { name: '비관적 여우', avatar: '/Pessimistic_Fox.png' } 
          }[key] || { name: '안정형 여우', avatar: '/Stable_Fox.png' };
          
          return (
            <div key={key} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-50/80 flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                  <img 
                    src={style.avatar} 
                    alt={style.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/Stable_Fox.png' }}
                  />
                </div>
                <h3 className="text-sm font-black text-gray-800">{style.name}</h3>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                {(advice as any).chat_message || (advice as any).feedback_to_user || '조언 내용을 불러오는 중입니다.'}
              </p>
            </div>
          );
        }) : (
          <div className="text-center py-10 text-gray-400 text-sm font-bold">
            아직 에이전트들의 조언이 수집되지 않았습니다.
          </div>
        )}
      </div>
    );
  };

  const renderTradeModal = () => {
    if (!isTradeModalOpen) return null;
    const keypad = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["00", "0", "back"]];
    return (<div className="absolute inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300"><div className="px-6 pt-8 pb-0 flex items-center justify-between border-b border-gray-100"><div className="flex space-x-8">{[{ key: 'buy', label: '매수' }, { key: 'sell', label: '매도' }, { key: 'pending', label: '미체결' }].map(tab => (<button key={tab.key} onClick={() => setTradeTab(tab.key as any)} className={`pb-3 text-base font-black ${tradeTab === tab.key ? 'text-[#004FFE] border-b-2 border-[#004FFE]' : 'text-gray-300'}`}>{tab.label}</button>))}</div><button onClick={() => setIsTradeModalOpen(false)}><X className="text-gray-400" size={24} /></button></div><div className="flex-1 flex flex-col p-6 bg-gray-50"><div className="bg-white rounded-2xl p-4 mb-3"><span className="text-xs text-gray-400 font-bold">주문 가격</span><div onClick={() => handleFocusField('price')} className="text-right text-2xl font-black text-gray-800">{orderPrice}원</div></div><div className="bg-white rounded-2xl p-4 mb-3"><span className="text-xs text-gray-400 font-bold">수량</span><div onClick={() => handleFocusField('amount')} className="text-right text-xl font-black text-gray-800">{orderAmount}주</div></div><div className="grid grid-cols-3 gap-2 mb-3">{keypad.flat().map((k, i) => (<button key={i} onClick={() => handleKeypadPress(k)} className="h-12 text-xl font-black bg-white rounded-xl shadow-sm">{k === 'back' ? <Delete size={20} className="mx-auto" /> : k}</button>))}</div><div className="grid grid-cols-2 gap-3 mt-auto"><button onClick={() => setIsTradeModalOpen(false)} className="py-4 bg-gray-400 text-white rounded-xl font-black">취소</button><button onClick={executeOrder} className={`py-4 text-white rounded-xl font-black ${tradeTab === 'buy' ? 'bg-[#E53935]' : 'bg-[#1E88E5]'}`}>입력</button></div></div></div>);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F8FC] rounded-t-[2.5rem] animate-in slide-in-from-right duration-300 overflow-hidden">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm"><ChevronLeft size={24} /></button>
        <div className="text-center"><h2 className="text-lg font-black text-gray-800">{stock.name}</h2></div>
        <button onClick={onToggleWatchlist} className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm ${isLiked ? 'text-[#E53935]' : 'text-gray-300'}`}><Heart size={20} fill={isLiked ? "currentColor" : "none"} /></button>
      </div>
      <div className="flex flex-col items-center py-4">
        <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-1">{currentPrice.toLocaleString()}원</h1>
        <div className={`flex items-center space-x-1 font-black ${isStockUp ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>
          <span>{stock.change}</span>
          <span className="text-xs bg-black/5 px-1.5 py-0.5 rounded-md ml-1">{isStockUp ? '▲' : '▼'}</span>
        </div>
      </div>
      <div className="px-6 mb-4">
        <div className="bg-white p-1 rounded-2xl flex shadow-sm">
          {tabs.map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-black rounded-xl ${activeTab === tab ? 'bg-[#004FFE] text-white shadow-md' : 'text-gray-400'}`}>{tab}</button>))}
        </div>
      </div>
      <div className="flex-1 px-6 overflow-y-auto hide-scrollbar flex flex-col pb-40">
        {activeTab === '차트' && (<div className="flex flex-col">{renderChart()}<div className="mt-4 flex items-center space-x-4"><button onClick={() => { setTradeTab('sell'); setIsTradeModalOpen(true); }} className="flex-1 bg-white border border-[#004FFE]/20 rounded-[1.5rem] py-4 font-black text-[#004FFE] shadow-sm text-lg">팔게요</button><button onClick={() => { setTradeTab('buy'); setIsTradeModalOpen(true); }} className="flex-1 bg-[#004FFE] text-white rounded-[1.5rem] py-4 font-black text-lg shadow-lg">살게요</button></div></div>)}
        {activeTab === '호가' && <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden">{orderBookData.map((item, idx) => (<OrderBookRow key={idx} item={item} prevClose={truePrevClose} currentPrice={currentPrice} isSelected={selectedOrderBookPrice === item.price} selectedPriceRef={selectedPriceRef} onSelect={(p) => setSelectedOrderBookPrice(p)} onTrade={(type, price) => { setTradeTab(type); setOrderPrice(price.toLocaleString()); setIsTradeModalOpen(true); }} />))}</div>}
        {activeTab === '뉴스' && renderNews()}
        {activeTab === '조언' && renderAdvice()}
        
        {activeTab === '토론' && (
          <div className="flex flex-col gap-3 pb-10 animate-in fade-in duration-300">
            <div className="bg-white rounded-[1.5rem] p-3 shadow-sm border border-gray-50 mb-2 flex items-center space-x-2">
              <input 
                type="text" 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="현재 종목에 대한 생각을 남겨주세요!"
                className="flex-1 bg-gray-50/50 rounded-xl px-4 py-2.5 text-[13px] font-medium outline-none focus:ring-1 focus:ring-[#004FFE]/30 placeholder:text-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handlePostSubmit()}
              />
              <button 
                onClick={handlePostSubmit}
                disabled={isSubmittingPost || !newPost.trim()}
                className="bg-[#004FFE] text-white px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30 active:scale-95 transition-all"
              >
                등록
              </button>
            </div>

            {[...myRecentPosts, ...communityPosts].map(post => (
              <div key={post.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-black text-gray-800">{post.author}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${post.sentiment === 'BULL' ? 'bg-red-50 text-[#E53935]' : 'bg-blue-50 text-[#1E88E5]'}`}>{post.sentiment === 'BULL' ? '📈 상승' : '📉 하락'}</span>
                </div>
                <p className="text-[13px] text-gray-600 font-medium">{post.content}</p>
                <span className="text-[10px] text-gray-400 mt-2 block">{post.time}</span>
              </div>
            ))}
            
            {myRecentPosts.length === 0 && communityPosts.length === 0 && (
              <div className="flex items-center justify-center h-40 text-gray-400 font-bold text-sm">토론 데이터가 없습니다.</div>
            )}
          </div>
        )}
      </div>
      {renderTradeModal()}
      {selectedNews && (
        <div className="absolute inset-0 z-[110] bg-black/60 flex items-end justify-center"><div className="bg-white w-full h-[90%] rounded-t-3xl p-6 flex flex-col"><div className="flex justify-between items-start mb-4"><span className="bg-[#004FFE]/10 text-[#004FFE] px-3 py-1 rounded-full text-xs font-black">{selectedNews.category}</span><button onClick={() => setSelectedNews(null)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button></div><h2 className="text-xl font-black text-gray-800 mb-3">{selectedNews.title}</h2><div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedNews.content}</div></div></div>
      )}
    </div>
  );
};

export default StockDetail;

const OrderBookRow = memo(({ item, prevClose, currentPrice, isSelected, selectedPriceRef, onSelect, onTrade }: any) => {
  const isAsk = item.type === 'ask';
  const priceColor = item.price > prevClose ? 'text-[#E53935]' : item.price < prevClose ? 'text-[#1E88E5]' : 'text-gray-800';
  return (
    <div ref={item.price === currentPrice ? selectedPriceRef : null} onClick={() => onSelect(item.price)} className={`h-12 flex items-center relative cursor-pointer border-b border-gray-50/50 transition-colors ${isAsk ? 'bg-[#E8F0FF]/20' : 'bg-red-50/20'} ${isSelected ? 'bg-gray-100' : ''}`}>
      <div className="w-[34%] h-full relative">{isSelected ? (<button onClick={(e) => { e.stopPropagation(); onTrade('buy', item.price); }} className="absolute inset-0 w-full h-full bg-[#E53935] text-white font-black text-sm flex items-center justify-center">매수</button>) : (isAsk && <div className="w-full h-full flex items-center justify-end pr-2 text-xs text-[#1E88E5] font-bold">{item.volume}</div>)}</div>
      <div className={`flex-1 h-full flex items-center justify-center font-bold text-sm ${priceColor}`}>{item.price.toLocaleString()}</div>
      <div className="w-[34%] h-full relative">{isSelected ? (<button onClick={(e) => { e.stopPropagation(); onTrade('sell', item.price); }} className="absolute inset-0 w-full h-full bg-[#1E88E5] text-white font-black text-sm flex items-center justify-center">매도</button>) : (!isAsk && <div className="w-full h-full flex items-center justify-start pl-2 text-xs text-[#E53935] font-bold">{item.volume}</div>)}</div>
    </div>
  );
});