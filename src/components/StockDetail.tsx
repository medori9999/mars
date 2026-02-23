import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { ChevronLeft, Heart, Clock, X, ChevronRight, Delete, Plus } from 'lucide-react';
import { StockData, WatchlistItem } from '../types';
import { newsListMock, agentAdvices, NewsItem, AgentAdvice, allRankingStocks } from '../data/mockData';
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
}

const StockDetail: React.FC<StockDetailProps> = ({ stock, isLiked, onToggleWatchlist, onBack, onBuy, onSell, cash = 0, externalTab, onTabChange }) => {

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
  const [hoverData, setHoverData] = useState<{ price: number; change: number; changePercent: number; y: number; x: number; date: string } | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true); 
  
  const [orderAmount, setOrderAmount] = useState("1");
  const [orderPrice, setOrderPrice] = useState("0"); 
  const [focusedField, setFocusedField] = useState<'price' | 'amount'>('price');
  const [isFirstKeypress, setIsFirstKeypress] = useState(true); 

  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    if (stock) {
      const priceNum = parseInt(stock.price.replace(/[^0-9]/g, '')) || 0;
      setOrderPrice(priceNum.toLocaleString());
    }
  }, [stock]);

  const cancelOrder = (id: number) => {
    setPendingOrders(prev => prev.filter(order => order.id !== id));
  };
  
  const tabs = ['차트', '호가', '뉴스', '조언', '토론'];

  // 안전한 가격 파싱
  const currentPriceRaw = stock ? (parseInt(stock.price.replace(/[^0-9]/g, '')) || 78500) : 78500;
  const changePercentRaw = stock ? (parseFloat(stock.change.replace(/[^0-9.-]/g, '')) || 0) : 0;
  const prevClose = Math.round(currentPriceRaw / (1 + changePercentRaw / 100));
  const isStockUp = stock ? !stock.change.includes('-') : true;

  useEffect(() => {
    if (activeTab === '호가' && selectedPriceRef.current) {
      selectedPriceRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeTab]);

  const [candleData, setCandleData] = useState<OHLCData[]>([]);
  const [orderBookData, setOrderBookData] = useState<OrderBookItem[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(currentPriceRaw);

  const [backendNews, setBackendNews] = useState<BackendNewsItem[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [mentorAdviceData, setMentorAdviceData] = useState<MentorAdviceResponse | null>(null);

  const formatDateLabel = (isoTime: string, period: string) => {
    const date = new Date(isoTime);
    if (period === '1일') {
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }
    if (period === '1주') return `${date.getDate()}일`;
    if (period === '1달') return `${date.getMonth() + 1}월`;
    if (period === '1년') return `${date.getFullYear()}년`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const generateMockOrderBook = (basePrice: number) => {
    const tickSize = basePrice >= 50000 ? 100 : (basePrice >= 10000 ? 50 : 10);
    const asks: OrderBookItem[] = [];
    const bids: OrderBookItem[] = [];
    for (let i = 5; i >= 1; i--) asks.push({ price: basePrice + (tickSize * i), volume: Math.floor(Math.random() * 500) + 10, type: 'ask' });
    for (let i = 0; i <= 4; i++) bids.push({ price: basePrice - (tickSize * i), volume: Math.floor(Math.random() * 500) + 10, type: 'bid' });
    return [...asks, ...bids];
  };

  useEffect(() => {
    const ticker = stock.symbol || stock.name;
    
    const loadRealTimeData = async (showLoading = false) => {
      if (showLoading) setIsLoadingChart(true);

      if (activeTab === '차트') {
        try {
          const backendChart = await fetchChartData(ticker);
          if (backendChart && backendChart.length > 0) {
            
            // 1. 데이터 시간순 오름차순 정렬
            const sortedChart = [...backendChart].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

            // 2. 1일 차트일 경우 오늘(가장 최신 날짜) 데이터만 추출
            let targetChart = sortedChart;
            if (chartPeriod === '1일') {
                const latestDateString = new Date(sortedChart[sortedChart.length - 1].time).toDateString();
                targetChart = sortedChart.filter(d => new Date(d.time).toDateString() === latestDateString);
            }

            // 🔥 [핵심 픽스] 5분 단위 진짜 캔들(OHLC) 집계 로직
            const bucketSizeMs = 5 * 60 * 1000; // 5분
            const candles: OHLCData[] = [];
            let currentBucket: any = null;

            targetChart.forEach((d) => {
                const timeMs = new Date(d.time).getTime();
                const bucketTime = Math.floor(timeMs / bucketSizeMs) * bucketSizeMs;

                if (!currentBucket || currentBucket.startTime !== bucketTime) {
                    if (currentBucket) candles.push(currentBucket);
                    currentBucket = {
                        startTime: bucketTime,
                        open: d.price, // 5분 구간의 첫 거래가 = 시가
                        high: d.price, // 5분 구간 최고가
                        low: d.price,  // 5분 구간 최저가
                        close: d.price,// 5분 구간 마지막 거래가 = 종가
                        dateLabel: formatDateLabel(new Date(bucketTime).toISOString(), chartPeriod)
                    };
                } else {
                    currentBucket.high = Math.max(currentBucket.high, d.price);
                    currentBucket.low = Math.min(currentBucket.low, d.price);
                    currentBucket.close = d.price; // 종가 갱신
                }
            });
            if (currentBucket) candles.push(currentBucket);

            setCandleData(candles);
            if (candles.length > 0) setCurrentPrice(candles[candles.length - 1].close);
          }
        } catch (error) {
          console.error("차트 로드 실패", error);
        }
      }

      if (activeTab === '호가') setOrderBookData(generateMockOrderBook(currentPrice));
      if (activeTab === '뉴스') {
        const newsData = await fetchCompanyNews(stock.name);
        if (newsData && newsData.length > 0) setBackendNews(newsData);
      }
      if (activeTab === '토론') {
        const postsData = await fetchCommunityPosts(ticker);
        if (postsData && postsData.length > 0) setCommunityPosts(postsData);
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
  }, [activeTab, chartPeriod, stock, currentPrice]);

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
  }, [candleData]);

  const handleKeypadPress = (key: string) => {
    const isAmount = focusedField === 'amount';
    const currentVal = isAmount ? orderAmount : orderPrice.replace(/,/g, '');
    let newVal = currentVal;

    if (isFirstKeypress && key !== 'back') {
      newVal = key === '00' ? '0' : key;
      setIsFirstKeypress(false);
    } else if (key === 'back') {
      newVal = currentVal.slice(0, -1) || '0';
    } else if (key === '00') {
      newVal = currentVal === '0' ? '0' : currentVal + '00';
    } else {
      newVal = currentVal === '0' ? key : currentVal + key;
    }

    if (isAmount) setOrderAmount(newVal);
    else { const num = parseInt(newVal) || 0; setOrderPrice(num.toLocaleString()); }
  };

  const handleFocusField = (field: 'price' | 'amount') => { setFocusedField(field); setIsFirstKeypress(true); };

  useEffect(() => {
    if (!isTradeModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key >= '0' && e.key <= '9') || (e.code.startsWith('Numpad') && e.key >= '0' && e.key <= '9')) {
        e.preventDefault(); handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault(); handleKeypadPress('back');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTradeModalOpen, focusedField, orderPrice, orderAmount, isFirstKeypress]);

  const handleAdjust = (direction: '-' | '+', step: number = 1, percent?: number) => {
    if (focusedField === 'price' && percent !== undefined) {
      const priceNum = parseInt(orderPrice.replace(/,/g, '')) || 0;
      const delta = Math.round(priceNum * percent / 100);
      const newPrice = direction === '+' ? priceNum + delta : Math.max(0, priceNum - delta);
      setOrderPrice(newPrice.toLocaleString());
      setIsFirstKeypress(false);
    } else if (focusedField === 'amount') {
      const qty = parseInt(orderAmount) || 0;
      const newQty = direction === '+' ? qty + step : Math.max(0, qty - step);
      setOrderAmount(String(newQty));
      setIsFirstKeypress(false);
    }
  };

  const executeOrder = () => {
    if (!stock) return;
    const price = parseInt(orderPrice.replace(/,/g, ''));
    const qty = parseInt(orderAmount);
    
    if (tradeTab === 'buy' && onBuy) { onBuy(stock, price, qty); } 
    else if (tradeTab === 'sell' && onSell) { onSell(stock, price, qty); }
    setIsTradeModalOpen(false);
  };

  const renderOrderBook = () => {
    return (
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 bg-white flex flex-col relative animate-in fade-in duration-300">
        <div ref={orderBookRef} className="flex flex-col flex-1 pb-4">
          {orderBookData.map((item, idx) => (
            <OrderBookRow key={idx} item={item} prevClose={prevClose} currentPrice={currentPrice} isSelected={selectedOrderBookPrice === item.price} selectedPriceRef={selectedPriceRef} onSelect={(price) => setSelectedOrderBookPrice(selectedOrderBookPrice === price ? null : price)} onTrade={(type, price) => { setTradeTab(type); setOrderPrice(price.toLocaleString()); setIsTradeModalOpen(true); }} />
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    const prices = candleData.length > 0 ? candleData.flatMap(d => [d.high, d.low]) : [currentPriceRaw];
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    
    let minVal = rawMin;
    let maxVal = rawMax;
    
    if (rawMax === rawMin || isNaN(rawMin)) {
      minVal = currentPriceRaw * 0.995;
      maxVal = currentPriceRaw * 1.005;
    } else {
      const diff = rawMax - rawMin;
      minVal = Math.max(0, rawMin - (diff * 0.1)); 
      maxVal = rawMax + (diff * 0.1); 
    }
    
    const range = Math.max(maxVal - minVal, 1);

    const viewportHeight = window.innerHeight;
    const containerHeight = Math.max(160, Math.min(260, viewportHeight - 530));
    const padding = { top: 20, bottom: 35, left: 0, right: 50 };
    const chartHeight = containerHeight - padding.bottom - padding.top;
    
    // 🔥 [너비 조정 픽스] 캔들이 너무 적을 때 뚱뚱해지는 현상 방지
    const virtualCandleCount = Math.max(candleData.length, 30); // 화면에 최소 30개가 들어갈 너비로 세팅
    const minChartWidth = window.innerWidth;
    const calculatedWidth = Math.max(minChartWidth, candleData.length * (minChartWidth / 30));
    const chartWidth = calculatedWidth - padding.right;
    const barW = chartWidth / virtualCandleCount;

    const getY = (price: number) => containerHeight - padding.bottom - ((price - minVal) / range) * chartHeight;

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left; 
      if (x > chartWidth || candleData.length === 0) return setHoverData(null);

      const index = Math.floor((x / chartWidth) * virtualCandleCount);
      if (index >= 0 && index < candleData.length) {
        const d = candleData[index];
        const diffPercent = d.open > 0 ? ((d.close - d.open) / d.open) * 100 : 0;
        const candleCenter = (index * barW) + barW / 2;
        setHoverData({ price: d.close, change: d.close - d.open, changePercent: diffPercent, y: getY(d.close), x: candleCenter, date: d.dateLabel });
      }
    };

    return (
      <div className="bg-white rounded-[2.5rem] pt-6 pb-4 shadow-sm border border-white shrink-0 flex flex-col relative overflow-hidden animate-in fade-in duration-500 mb-2 min-h-[250px] transition-all">
        {(isLoadingChart) && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center"><div className="w-8 h-8 border-4 border-[#004FFE]/20 border-t-[#004FFE] rounded-full animate-spin mb-2"></div><span className="text-[10px] font-bold text-[#004FFE]">데이터를 불러오고 있습니다...</span></div>
          </div>
        )}
        {!isLoadingChart && candleData.length === 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-10 text-center bg-white"><div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Clock size={32} className="text-gray-200" /></div><p className="text-xs font-bold text-gray-400 leading-relaxed">해당 기간의 차트 데이터가 없습니다.<br/>거래가 발생하면 차트가 그려집니다.</p></div>
        )}

        <div className="absolute left-6 top-6 flex items-center space-x-3 z-10 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full">
           <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-[#E53935]"></div><span className="text-[10px] font-bold text-gray-500">상승</span></div>
           <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-[#1E88E5]"></div><span className="text-[10px] font-bold text-gray-500">하락</span></div>
        </div>

        <div className="absolute right-0 flex flex-col text-[10px] font-bold text-gray-400 pointer-events-none text-right pr-3 z-20" style={{ top: '30px', height: '5cm', justifyContent: 'space-between' }}>
          <span>{Math.round(maxVal).toLocaleString()}</span><span>{Math.round(minVal + range * 0.75).toLocaleString()}</span><span>{Math.round(minVal + range * 0.5).toLocaleString()}</span><span>{Math.round(minVal + range * 0.25).toLocaleString()}</span><span>{Math.round(minVal).toLocaleString()}</span>
        </div>

        <div className="flex-1 overflow-x-auto hide-scrollbar relative w-full" ref={scrollContainerRef}>
           <svg width={calculatedWidth} height={containerHeight} className="overflow-visible" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)} style={{ cursor: 'crosshair' }}>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => <line key={i} x1={0} y1={containerHeight - padding.bottom - (ratio * chartHeight)} x2={calculatedWidth} y2={containerHeight - padding.bottom - (ratio * chartHeight)} stroke="#f3f4f6" strokeWidth="1" />)}
              
              {candleData.length > 0 && candleData.map((d, i) => {
                 const x = (i * barW) + barW / 2;
                 const isUp = d.close >= d.open;
                 const color = isUp ? '#E53935' : '#1E88E5'; 
                 const bodyX = (i * barW) + 2; 
                 const bodyWidth = Math.max(barW - 4, 2);
                 const yOpen = getY(d.open);
                 const yClose = getY(d.close);
                 // 몸통이 없으면(시가=종가) 최소 1.5px의 가로선을 그려줌
                 const height = Math.max(Math.abs(yOpen - yClose), 1.5); 
                 
                 return (
                   <g key={i}>
                     {i % Math.ceil(candleData.length / 4) === 0 && <text x={x} y={containerHeight - 15} textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="bold">{d.dateLabel}</text>}
                     <line x1={x} y1={getY(d.high)} x2={x} y2={getY(d.low)} stroke={color} strokeWidth="1.5" />
                     <rect x={bodyX} y={Math.min(yOpen, yClose)} width={bodyWidth} height={height} fill={color} rx="1" />
                   </g>
                 );
               })}

               {hoverData && (
                  <g>
                     <line x1={hoverData.x} y1={padding.top} x2={hoverData.x} y2={containerHeight - padding.bottom} stroke="#004FFE" strokeWidth="1" strokeDasharray="4 4" opacity="0.8"/>
                     <line x1={0} y1={hoverData.y} x2={calculatedWidth} y2={hoverData.y} stroke="#004FFE" strokeWidth="1" strokeDasharray="4 4" opacity="0.8"/>
                     <g transform={`translate(${hoverData.x + 10}, ${hoverData.y - 12})`}><rect width="60" height="28" rx="6" fill="#004FFE" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))"/><text x="30" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" dy="0.3em">{Math.round(hoverData.price).toLocaleString()}</text></g>
                     <g transform={`translate(${hoverData.x}, ${containerHeight - padding.bottom + 5})`}><rect x="-20" width="40" height="20" rx="4" fill="#374151" /><text x="0" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">{hoverData.date}</text></g>
                  </g>
               )}
           </svg>
        </div>

        <div className="px-6 pb-2 flex items-end justify-between shrink-0">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2"><span className="text-[10px] font-bold text-gray-400">최고</span><span className="text-[11px] font-black text-gray-800">{Math.round(maxVal).toLocaleString()}원</span></div>
            <div className="flex items-center space-x-2"><span className="text-[10px] font-bold text-gray-400">최저</span><span className="text-[11px] font-black text-gray-800">{Math.round(minVal).toLocaleString()}원</span></div>
          </div>
          <div className="flex bg-gray-100/80 p-0.5 rounded-xl space-x-0.5">
            {['1일', '1주', '1달', '1년'].map((period) => <button key={period} onClick={() => setChartPeriod(period as any)} className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${chartPeriod === period ? 'bg-white text-[#004FFE] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{period}</button>)}
          </div>
        </div>
      </div>
    );
  };

  const renderNews = () => {
      if (backendNews.length > 0) return (<div className="flex-1 flex flex-col overflow-y-auto hide-scrollbar animate-in fade-in duration-500 mb-2 pb-8"><div className="space-y-4">{backendNews.slice(0, newsDisplayCount).map((news, idx) => (<div key={idx} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50 cursor-pointer" onClick={() => setSelectedNews({ id: idx, category: stock.name, title: news.title, source: '백엔드', time: news.created_at || '방금 전', content: news.summary })}><h3 className="text-[14px] font-bold text-gray-800">{news.title}</h3><p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{news.summary}</p><span className="text-[10px] text-gray-400 mt-2 block">{news.created_at || '방금 전'}</span></div>))}</div></div>);
      const filteredNews = newsListMock.filter(news => news.category.includes(stock.name) || news.title.includes(stock.name));
      if (filteredNews.length === 0) return (<div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10 animate-in fade-in"><Clock size={40} className="mb-3 opacity-20" /><p className="text-sm font-bold">{stock.name} 관련 뉴스가 없습니다</p></div>);
      return (<div className="flex-1 flex flex-col overflow-y-auto hide-scrollbar animate-in fade-in duration-500 mb-2 pb-8"><div className="space-y-4">{filteredNews.slice(0, newsDisplayCount).map((news) => (<div key={news.id} onClick={() => setSelectedNews(news)} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50 cursor-pointer"><h3 className="text-[14px] font-bold text-gray-800">{news.title}</h3><span className="text-[10px] text-gray-400 mt-2 block">{news.time} • {news.source}</span></div>))}</div></div>);
  };

  const renderAdvice = () => {
      const mentorEntries = mentorAdviceData ? Object.entries(mentorAdviceData).filter(([k]) => ['NEUTRAL', 'VALUE', 'MOMENTUM', 'CONTRARIAN'].includes(k)) : [];
      return (<div className="flex flex-col gap-2 animate-in fade-in duration-500 pb-10">{mentorEntries.length > 0 ? mentorEntries.map(([key, advice]) => {
              const mentorAdvice = advice as { opinion: string; core_logic: string; feedback_to_user: string; chat_message: string };
              const typeMap: Record<string, { name: string; avatar: string; tagColor: string; tagBg: string }> = { 'NEUTRAL': { name: '중립형 에이전트', avatar: '/Stable_Fox_icon.png', tagColor: 'text-[#004FFE]', tagBg: 'bg-[#F5F8FC]' }, 'VALUE': { name: '가치형 에이전트', avatar: '/Aggressive_Fox_icon.png', tagColor: 'text-[#D97706]', tagBg: 'bg-[#FEF3C7]' }, 'MOMENTUM': { name: '모멘텀 에이전트', avatar: '/Aggressive_Fox_icon.png', tagColor: 'text-[#059669]', tagBg: 'bg-[#D1FAE5]' }, 'CONTRARIAN': { name: '역발상 에이전트', avatar: '/Pessimistic_Fox_icon.png', tagColor: 'text-[#4B5563]', tagBg: 'bg-[#F3F4F6]' } };
              const style = typeMap[key] || typeMap['NEUTRAL'];
              return (<div key={key} className="w-full bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100/30"><div className="flex items-center space-x-3 mb-2.5"><img src={style.avatar} className="w-12 h-12 rounded-full bg-gray-50 shadow-sm" alt="avatar"/><div><h3 className="text-sm font-black text-gray-800 leading-none mb-1">{style.name}</h3><span className={`text-[9px] font-bold px-2 py-0.5 rounded ${style.tagBg} ${style.tagColor}`}>{mentorAdvice.opinion}</span></div></div><p className="text-[13px] font-bold text-gray-700 whitespace-pre-wrap leading-relaxed px-0.5">{mentorAdvice.chat_message || mentorAdvice.feedback_to_user}</p></div>);
            }) : (<div className="text-center py-10 text-gray-400 text-sm font-bold">멘토 조언을 기다리는 중입니다...</div>)}</div>);
  };

  const renderNewsModal = () => {
    if (!selectedNews) return null;
    return (<div className="absolute inset-0 z-[110] bg-black/60 flex items-end justify-center animate-in fade-in duration-200"><div className="bg-white w-full h-[90%] rounded-t-3xl p-6 flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl"><div className="flex justify-between items-start mb-4 shrink-0"><span className="bg-[#004FFE]/10 text-[#004FFE] px-3 py-1 rounded-full text-xs font-black">{selectedNews.category}</span><button onClick={() => setSelectedNews(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20} /></button></div><div className="flex-1 overflow-y-auto hide-scrollbar"><h2 className="text-xl font-black text-gray-800 mb-3 leading-snug">{selectedNews.title}</h2><div className="flex items-center space-x-2 text-xs text-gray-400 font-bold mb-6 border-b border-gray-50 pb-4"><span>{selectedNews.source}</span><span>•</span><span>{selectedNews.time}</span></div><div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium pb-10">{selectedNews.content}</div></div></div></div>);
  };

  const renderTradeModal = () => {
    if (!isTradeModalOpen) return null;
    const keypad = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["00", "0", "back"]];
    return (<div className="absolute inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300"><div className="px-6 pt-8 pb-0 flex items-center justify-between border-b border-gray-100"><div className="flex space-x-8">{[{ key: 'buy', label: '매수' }, { key: 'sell', label: '매도' }, { key: 'pending', label: '미체결' }].map(tab => (<button key={tab.key} onClick={() => setTradeTab(tab.key as any)} className={`pb-3 text-base font-black transition-colors ${tradeTab === tab.key ? 'text-[#004FFE] border-b-2 border-[#004FFE]' : 'text-gray-300'}`}>{tab.label}</button>))}</div><button onClick={() => setIsTradeModalOpen(false)}><X className="text-gray-400" size={24} /></button></div>{tradeTab === 'pending' ? (<div className="flex-1 overflow-y-auto p-6">{pendingOrders.length === 0 ? (<div className="flex items-center justify-center h-full text-gray-400 font-bold">미체결 주문이 없습니다</div>) : (<div className="space-y-3">{pendingOrders.map((order) => (<div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between"><div className="flex-1"><div className={`text-sm font-black mb-1 ${order.type === 'buy' ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>{order.type === 'buy' ? '매수' : '매도'}</div><div className="text-xs text-gray-500 font-bold">{order.name} · {order.qty}주 · {order.price}원</div></div><button onClick={() => cancelOrder(order.id)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16} className="text-gray-500" /></button></div>))}</div>)}</div>) : (<div className="flex-1 flex flex-col p-6 bg-gray-50"><div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-400 font-bold">주문 가격</span></div><div onClick={() => handleFocusField('price')} className={`flex items-center justify-end space-x-1 cursor-pointer rounded-lg px-2 py-1 ${focusedField === 'price' ? 'bg-blue-50' : ''}`}><span className={`text-2xl font-black ${focusedField === 'price' ? 'text-[#004FFE]' : 'text-gray-800'}`}>{orderPrice}</span>{focusedField === 'price' && <span className="w-0.5 h-7 bg-[#004FFE] animate-pulse rounded-full"></span>}<span className={`text-xl font-black ${focusedField === 'price' ? 'text-[#004FFE]' : 'text-gray-500'}`}>원</span></div></div><div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-400 font-bold">수량</span></div><div className="flex items-center justify-end"><div className="flex flex-col items-end"><div onClick={() => handleFocusField('amount')} className={`flex items-center space-x-1 cursor-pointer rounded-lg px-2 py-1 ${focusedField === 'amount' ? 'bg-blue-50' : ''}`}><span className={`text-xl font-black ${focusedField === 'amount' ? 'text-[#004FFE]' : 'text-gray-800'}`}>{orderAmount}</span>{focusedField === 'amount' && <span className="w-0.5 h-6 bg-[#004FFE] animate-pulse rounded-full"></span>}<span className={`text-base font-black ${focusedField === 'amount' ? 'text-[#004FFE]' : 'text-gray-500'}`}>주</span></div><span className={`text-xs font-bold px-2 mt-1 ${tradeTab === 'buy' ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>{tradeTab === 'buy' ? '매수가능' : '매도가능'} {cash.toLocaleString()}원</span></div></div></div><div className="bg-white rounded-2xl px-4 py-3 mb-3 border border-gray-100 flex items-center justify-between"><span className={`text-xs font-black px-2.5 py-1 rounded-full ${focusedField === 'price' ? (tradeTab === 'buy' ? 'bg-red-50 text-[#E53935]' : 'bg-blue-50 text-[#1E88E5]') : 'bg-gray-100 text-gray-500'}`}>{focusedField === 'price' ? (tradeTab === 'buy' ? '매수가' : '매도가') : '수량'}</span>{focusedField === 'price' ? (<div className="flex items-center space-x-1.5">{[10, 20, 50].map((pct) => (<div key={pct} className="flex items-center space-x-0.5"><button onClick={() => handleAdjust('-', 1, pct)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-black text-sm active:scale-90">−</button><span className="text-[11px] font-black text-gray-500">{pct}%</span><button onClick={() => handleAdjust('+', 1, pct)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-black text-sm active:scale-90">+</button></div>))}</div>) : (<div className="flex items-center space-x-3"><div className="flex items-center space-x-1"><button onClick={() => handleAdjust('-', 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-black active:scale-90">−</button><span className="text-xs font-black text-gray-400">1주씩</span><button onClick={() => handleAdjust('+', 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-black active:scale-90">+</button></div><div className="flex items-center space-x-1"><button onClick={() => handleAdjust('-', 10)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-black active:scale-90">−</button><span className="text-xs font-black text-gray-400">10주씩</span><button onClick={() => handleAdjust('+', 10)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-black active:scale-90">+</button></div></div>)}</div><div className="grid grid-cols-3 gap-2 mb-3">{keypad.flat().map((k, i) => (<button key={i} onClick={() => handleKeypadPress(k)} className="h-12 text-xl font-black text-gray-800 bg-white rounded-xl hover:bg-gray-100 flex items-center justify-center">{k === 'back' ? <Delete size={20} /> : k}</button>))}</div><div className="grid grid-cols-2 gap-3 mt-auto"><button onClick={() => setIsTradeModalOpen(false)} className="py-4 bg-gray-400 text-white rounded-xl font-black text-base">취소</button><button onClick={executeOrder} className={`py-4 text-white rounded-xl font-black text-base ${tradeTab === 'buy' ? 'bg-[#E53935]' : 'bg-[#1E88E5]'}`}>입력</button></div></div>)}</div>);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F8FC] rounded-t-[2.5rem] animate-in slide-in-from-right duration-300 overflow-hidden">
      <div id="stock-detail-info" className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0 bg-[#F5F8FC]">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm active:scale-95 transition-all"><ChevronLeft size={24} /></button>
        <div className="text-center">
             <h2 className="text-lg font-black text-gray-800">{stock.name}</h2>
             <span className="text-xs font-bold text-gray-400">{stock.price}</span>
        </div>
        <button onClick={onToggleWatchlist} className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all ${isLiked ? 'text-[#E53935]' : 'text-gray-300'}`}>
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex flex-col items-center py-4 shrink-0">
         <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-1">{currentPrice.toLocaleString()}원</h1>
         <div className={`flex items-center space-x-1 font-black ${isStockUp ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>
             <span className="text-sm">{stock.change}</span>
             <span className="text-xs bg-black/5 px-1.5 py-0.5 rounded-md ml-1">{isStockUp ? '▲' : '▼'}</span>
         </div>
      </div>

      <div id="stock-detail-tabs" className="px-6 mb-4 shrink-0">
        <div className="bg-white p-1 rounded-2xl flex shadow-sm">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === tab ? 'bg-[#004FFE] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>{tab}</button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 px-6 overflow-y-auto hide-scrollbar flex flex-col pb-40">
         {activeTab === '차트' && (
            <div id="stock-detail-chart" className="flex flex-col">
              {renderChart()}
              <div className="mt-4 flex items-center space-x-4 shrink-0">
                <button onClick={() => { setTradeTab('sell'); setIsTradeModalOpen(true); }} className="flex-1 bg-white border border-[#004FFE]/20 rounded-[1.5rem] py-4 font-black text-[#004FFE] shadow-sm active:scale-95 transition-all text-lg">팔게요</button>
                <button onClick={() => { setTradeTab('buy'); setIsTradeModalOpen(true); }} className="flex-1 bg-[#004FFE] text-white rounded-[1.5rem] py-4 font-black text-lg shadow-lg shadow-[#004FFE]/20 active:scale-95 transition-all">살게요</button>
              </div>
            </div>
         )}
         {activeTab === '호가' && <div id="stock-detail-orderbook" className="flex flex-col h-full">{renderOrderBook()}</div>}
         {activeTab === '뉴스' && <div id="stock-detail-news" className="flex flex-col">{renderNews()}</div>}
         {activeTab === '조언' && <div id="stock-detail-advice" className="flex flex-col">{renderAdvice()}</div>}
         {activeTab === '토론' && (
           <div className="flex flex-col gap-3 animate-in fade-in duration-500 pb-10">
             {communityPosts.length > 0 ? communityPosts.map((post) => (
               <div key={post.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-sm font-black text-gray-800">{post.author}</span>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${post.sentiment === 'BULL' ? 'bg-red-50 text-[#E53935]' : 'bg-blue-50 text-[#1E88E5]'}`}>{post.sentiment === 'BULL' ? '📈 매수' : '📉 매도'}</span>
                 </div>
                 <p className="text-[13px] text-gray-600 font-medium">{post.content}</p>
                 <span className="text-[10px] text-gray-400 mt-2 block">{post.time}</span>
               </div>
             )) : (<div className="flex items-center justify-center h-40 text-gray-400 font-bold">토론 데이터가 없습니다.</div>)}
           </div>
         )}
      </div>
      {renderTradeModal()}
      {renderNewsModal()}
    </div>
  );
};

export default StockDetail;

interface OrderBookRowProps { item: OrderBookItem; prevClose: number; currentPrice: number; isSelected: boolean; selectedPriceRef: React.RefObject<HTMLDivElement>; onSelect: (price: number) => void; onTrade: (type: 'buy' | 'sell', price: number) => void; }
const OrderBookRow = memo(({ item, prevClose, currentPrice, isSelected, selectedPriceRef, onSelect, onTrade }: OrderBookRowProps) => {
  const [flashClass, setFlashClass] = useState(''); const prevVol = useRef(item.volume); const prevPrice = useRef(item.price);
  useEffect(() => {
    if (item.volume !== prevVol.current || item.price !== prevPrice.current) {
      setFlashClass(item.type === 'ask' ? 'animate-flash-blue' : 'animate-flash-red');
      const timer = setTimeout(() => setFlashClass(''), 600);
      prevVol.current = item.volume; prevPrice.current = item.price; return () => clearTimeout(timer);
    }
  }, [item.volume, item.price, item.type]);
  const isAsk = item.type === 'ask'; const priceColor = item.price > prevClose ? 'text-[#E53935]' : item.price < prevClose ? 'text-[#1E88E5]' : 'text-gray-800'; const isCurrentPrice = item.price === currentPrice;
  return (
    <div ref={isCurrentPrice ? selectedPriceRef : null} onClick={() => onSelect(item.price)} className={`h-12 flex items-center relative cursor-pointer border-b border-gray-50/50 transition-colors ${isAsk ? 'bg-[#E8F0FF]/20' : 'bg-red-50/20'} ${isSelected ? 'bg-gray-100' : ''} ${flashClass}`}>
      <div className="w-[34%] h-full relative">{isSelected ? (<button onClick={(e) => { e.stopPropagation(); onTrade('buy', item.price); }} className="absolute inset-0 w-full h-full bg-[#E53935] text-white font-black text-sm flex items-center justify-center hover:bg-[#E53935] transition-colors z-20 shadow-inner animate-in fade-in duration-200"><div className="flex flex-col items-center leading-none"><span className="text-[10px] opacity-80 mb-0.5">지정가</span><span>매수</span></div></button>) : (isAsk && (<div className="w-full h-full flex items-center justify-end pr-2"><div className="relative w-full h-6 bg-[#E8F0FF]/50 rounded-r-md overflow-hidden"><div className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1E88E5] font-bold text-xs">{item.volume.toLocaleString()}</div></div></div>))}</div>
      <div className={`flex-1 h-full flex items-center justify-center font-bold text-sm z-10 ${isSelected ? 'bg-white border-x border-gray-100' : ''} ${priceColor}`}>{item.price.toLocaleString()}</div>
      <div className="w-[34%] h-full relative">{isSelected ? (<button onClick={(e) => { e.stopPropagation(); onTrade('sell', item.price); }} className="absolute inset-0 w-full h-full bg-[#1E88E5] text-white font-black text-sm flex items-center justify-center hover:bg-[#1E88E5] transition-colors z-20 shadow-inner animate-in fade-in duration-200"><div className="flex flex-col items-center leading-none"><span className="text-[10px] opacity-80 mb-0.5">지정가</span><span>매도</span></div></button>) : (!isAsk && (<div className="w-full h-full flex items-center justify-start pl-2"><div className="relative w-full h-6 bg-red-100/50 rounded-l-md overflow-hidden"><div className="absolute left-2 top-1/2 -translate-y-1/2 text-[#E53935] font-bold text-xs">{item.volume.toLocaleString()}</div></div></div>))}</div>
    </div>
  );
});