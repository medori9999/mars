import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Outlet, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PopularStocks from './components/PopularStocks';
import NewsContent from './components/NewsContent';
import CommunityContent from './components/CommunityContent';
import QuestContent from './components/QuestContent';
import RankingContent from './components/RankingContent';
import AssetsContent from './components/AssetsContent';
import StockStatusContent from './components/StockStatusContent';
import MarketContent from './components/MarketContent';
import ChatbotContent from './components/ChatbotContent';
import SettingsContent from './components/SettingsContent';
import BottomNav from './components/BottomNav';
import { StockData, PortfolioItem, TransactionItem, NotificationItem, WatchlistItem } from './types';
import { fetchCompanies } from './services/api';
import { fetchCompanies as fetchBackendCompanies } from './api';
import TermsAgreement from './components/onboarding/TermsAgreement';
import AccountOpening from './components/onboarding/AccountOpening';
import AccountGuide from './components/onboarding/AccountGuide';
import AppTour from './components/onboarding/AppTour';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Layout = ({ children, hideHeader = false, notifications, onMarkAsRead, userName, userLevel, tourCompleted, handleCompleteTour, onboardingCompleted }: { 
  children?: React.ReactNode, 
  hideHeader?: boolean, 
  notifications: NotificationItem[], 
  onMarkAsRead: () => void, 
  userName: string, 
  userLevel: string,
  tourCompleted: boolean,
  handleCompleteTour: () => void,
  onboardingCompleted: boolean
}) => {
  const location = useLocation();
  const isHome = ['/', '/assets', '/news', '/ranking', '/community', '/quest'].includes(location.pathname);
  
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#e1eaf5] relative overflow-hidden shadow-2xl font-['Pretendard']">
       {!hideHeader && (
         <div className="shrink-0">
           <Header 
             showProfile={isHome} 
             notifications={notifications}
             onMarkAsRead={onMarkAsRead}
             userName={userName}
             userLevel={userLevel}
           />
           <div className="mx-4 h-[1px] bg-black/5"></div>
         </div>
       )}
       
       <div className={`flex flex-1 overflow-hidden relative ${hideHeader ? 'p-0' : 'px-4 pt-4'}`}>
          {children ? (
            <div className="w-full h-full overflow-hidden flex flex-col">
              {children}
            </div>
          ) : (
            <>
              {isHome && (
                 <div className="w-16 mr-3 flex flex-col h-full shrink-0">
                   <Sidebar />
                 </div>
              )}
              <div className="flex-1 h-full overflow-hidden">
                <Outlet />
              </div>
            </>
          )}
       </div>

       <div className="shrink-0 border-t border-black/5">
         <BottomNav />
       </div>

        {!tourCompleted && onboardingCompleted && <AppTour onComplete={handleCompleteTour} userName={userName} />}
    </div>
  );
};

const App: React.FC = () => {
    const navigate = useNavigate();
    
    const [cash, setCash] = useState<number>(5000000); 
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]); 
    const [transactions, setTransactions] = useState<TransactionItem[]>([]); 
    const [notifications, setNotifications] = useState<NotificationItem[]>([]); 
    const [stocks, setStocks] = useState<StockData[]>([]);
  
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [userName, setUserName] = useState('user');
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<'terms' | 'account' | 'guide'>('terms');

    const handleCompleteOnboarding = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/user/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userName })
        });
      } catch (error) {
        console.error("백엔드 유저 초기화 실패", error);
      }

      localStorage.removeItem('app-tour-done');
      localStorage.removeItem('market-tour-done');
      localStorage.removeItem('chat-tour-done'); 
      localStorage.removeItem('status-tour-done');
      localStorage.removeItem('market-highlight-pending');
      localStorage.removeItem('status-highlight-pending');
      
      setTourCompleted(false); 
      setUserLevel('Lv.1');    
      setOnboardingCompleted(true);
      navigate('/assets');
    };

    const [userLevel, setUserLevel] = useState('Lv.1');
    const [tourCompleted, setTourCompleted] = useState(false);

    useEffect(() => {
      if (!onboardingCompleted) return;

      const syncAllData = async () => {
        try {
          let currentStocks: StockData[] = [];
          try {
            const backendData = await fetchBackendCompanies();
            if (backendData && backendData.length > 0) {
              currentStocks = backendData.map(c => {
                const priceStr = typeof (c as any).current_price === 'number' ? (c as any).current_price.toLocaleString() + '원' : '0원';
                const changeRate = typeof (c as any).change_rate === 'number' ? (c as any).change_rate : 0;
                const changeStr = (changeRate >= 0 ? '+' : '') + changeRate.toFixed(2) + '%';
                return {
                  ...c, 
                  name: c.name,
                  symbol: c.ticker,
                  price: priceStr,
                  change: changeStr,
                  isUp: changeRate >= 0,
                } as StockData;
              });
            }
          } catch (e) {}

          if (currentStocks.length === 0) {
            try {
              currentStocks = await fetchCompanies();
            } catch (e) {}
          }

          if (currentStocks.length > 0) {
            setStocks(currentStocks);
            setWatchlist(prev => prev.map(item => {
              const match = currentStocks.find(s => s.symbol === item.symbol || s.name === item.name);
              return match ? { ...item, price: match.price, change: match.change, isUp: match.isUp } : item;
            }));
          }

          const encodedUserId = encodeURIComponent(`USER_${userName}`);

          // 내 계좌 정보 가져오기
          const resStatus = await fetch(`${API_BASE_URL}/api/user/status`, {
            headers: { 'x-user-id': encodedUserId }
          });
          
          if (resStatus.ok) {
            const userData = await resStatus.json();
            setCash(userData.balance); 

            if (currentStocks.length > 0 && userData.portfolio) {
              const newPortfolio: PortfolioItem[] = [];
              Object.entries(userData.portfolio).forEach(([ticker, qty]) => {
                const stockInfo = currentStocks.find(s => s.symbol === ticker || s.name === ticker);
                if (stockInfo && Number(qty) > 0) {
                  newPortfolio.push({
                    id: stockInfo.id || Date.now() + Math.random(),
                    name: stockInfo.name,
                    symbol: stockInfo.symbol,
                    badge: '실전',
                    shares: `${qty}주`,
                    sharesCount: Number(qty),
                    price: stockInfo.price,
                    change: stockInfo.change,
                    isUp: stockInfo.isUp,
                    color: stockInfo.color || 'bg-[#3082F5]',
                    logoText: stockInfo.logoText || stockInfo.name.charAt(0)
                  });
                }
              });
              setPortfolio(newPortfolio);
            } else {
               setPortfolio([]);
            }
          }

          // 내 거래 내역 백엔드 동기화 (남의 거래 제외)
          const resHistory = await fetch(`${API_BASE_URL}/api/user/history`, {
            headers: { 'x-user-id': encodedUserId }
          });
          
          if (resHistory.ok) {
            const historyData = await resHistory.json();
            const historyList = Array.isArray(historyData) ? historyData : (historyData.history || historyData.trades || []);
            
            if (historyList.length > 0) {
              const myHistory = historyList.filter((h: any) => h.buyer_id === `USER_${userName}` || h.seller_id === `USER_${userName}`);

              if (myHistory.length > 0) {
                const formattedTransactions: TransactionItem[] = myHistory.map((h: any, idx: number) => {
                  const dateObj = new Date(h.timestamp);
                  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const dd = String(dateObj.getDate()).padStart(2, '0');
                  const hh = String(dateObj.getHours()).padStart(2, '0');
                  const mins = String(dateObj.getMinutes()).padStart(2, '0');
                  
                  const stockInfo = currentStocks.find(s => s.symbol === h.ticker || s.name === h.ticker);
                  const stockName = stockInfo ? stockInfo.name : h.ticker;
                  
                  const priceNum = h.price || 0;
                  const qtyNum = h.quantity || h.qty || 0;
                  const totalAmount = priceNum * qtyNum;
                  const isBuy = h.buyer_id === `USER_${userName}`;

                  return {
                    id: h.id || idx,
                    name: stockName,
                    date: `${mm}.${dd}`,
                    time: `${hh}:${mins}`,
                    type: isBuy ? 'buy' : 'sell',
                    amount: `${totalAmount.toLocaleString()}원`,
                    pricePerShare: `${priceNum.toLocaleString()}원`,
                    qty: `${qtyNum}주`,
                    logoText: stockInfo?.logoText || stockName.charAt(0),
                    logoBg: stockInfo?.color || 'bg-gray-400'
                  };
                });
                
                setTransactions(formattedTransactions.reverse());
              }
            }
          }
        } catch (error) {
          console.error("데이터 동기화 실패:", error);
        }
      };

      syncAllData();
      const interval = setInterval(syncAllData, 3000); 
      return () => clearInterval(interval);
    }, [onboardingCompleted, userName]);

    React.useEffect(() => {
      const calculateLevel = () => {
        const isAppDone = localStorage.getItem('app-tour-done') === 'true';
        const isMarketDone = localStorage.getItem('market-tour-done') === 'true';
        const isStatusDone = localStorage.getItem('status-tour-done') === 'true';

        let level = 'Lv.1';
        if (isStatusDone) level = 'Lv.6';
        else if (isMarketDone) level = 'Lv.5';
        else if (isAppDone) level = 'Lv.3';
        
        setUserLevel(level);
        setTourCompleted(isAppDone);
      };

      calculateLevel();
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key?.includes('-tour-done')) calculateLevel();
      };
      const handleCustomEvent = () => calculateLevel();

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('check-market-highlight', handleCustomEvent);
      window.addEventListener('check-status-highlight', handleCustomEvent);
      window.addEventListener('update-user-level', handleCustomEvent);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('check-market-highlight', handleCustomEvent);
        window.removeEventListener('check-status-highlight', handleCustomEvent);
        window.removeEventListener('update-user-level', handleCustomEvent);
      };
    }, []);

    const handleCompleteTour = () => {
      window.dispatchEvent(new Event('update-user-level'));
    };
  
    const handleToggleWatchlist = (stock: StockData) => {
      const exists = watchlist.find(item => item.name === stock.name);
      if (exists) {
        setWatchlist(prev => prev.filter(item => item.name !== stock.name));
      } else {
        const newItem: WatchlistItem = {
          id: Date.now(),
          name: stock.name,
          price: stock.price,
          change: stock.change,
          isUp: stock.isUp,
          shares: '0주',
          badge: '관심',
          color: stock.color || 'bg-gray-400',
          logoText: stock.logoText || stock.name.charAt(0)
        };
        setWatchlist(prev => [...prev, newItem]);
      }
    };
  
    const addNotification = (message: string, type: 'buy' | 'sell') => {
      const newNoti: NotificationItem = {
        id: Date.now(),
        message,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        type
      };
      setNotifications(prev => [newNoti, ...prev]);
    };
  
    const handleMarkNotificationsAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
  
    const handleBuy = async (stock: StockData, price: number, qty: number) => {
      const totalCost = price * qty;
      if (cash < totalCost) {
        alert("보유 현금이 부족합니다.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/trade/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': encodeURIComponent(`USER_${userName}`)
          },
          body: JSON.stringify({ 
            agent_id: `USER_${userName}`, 
            ticker: stock.symbol || stock.name, 
            side: 'BUY', 
            order_type: 'LIMIT', 
            price: price, 
            quantity: qty 
          })
        });
        const result = await response.json();
        
        if (!response.ok || result.status === 'FAIL') {
          alert(`매수 실패: ${result.msg || '서버 오류'}`);
          return;
        }

        if (result.status === 'PENDING') {
          alert(`[주문 대기중]\n지정하신 가격(${price.toLocaleString()}원)에 팔려는 사람이 없어 대기열에 등록되었습니다!\n판매자가 나타나면 자동으로 체결됩니다.`);
          return; 
        }

        // 🔥 [완벽 복구] 매수 즉시 화면(거래내역)에 영수증을 딱! 띄워주는 원래 코드 복구
        const newTransaction: TransactionItem = {
          id: Date.now(),
          name: stock.name,
          date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').slice(0, -1),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          type: 'buy',
          amount: `${totalCost.toLocaleString()}원`,
          pricePerShare: `${price.toLocaleString()}원`,
          qty: `${qty}주`,
          logoText: stock.logoText || stock.name.charAt(0),
          logoBg: stock.color
        };
        
        // 내 거래내역에 즉시 추가!
        setTransactions(prev => {
          const isExist = prev.some(p => p.name === newTransaction.name && p.time === newTransaction.time && p.type === 'buy');
          if (isExist) return prev;
          return [newTransaction, ...prev];
        });
        
        addNotification(`${stock.name} ${qty}주 매수가 체결되었습니다.`, 'buy');
      } catch (error) {
        console.error("백엔드 통신 실패", error);
        alert("서버 통신에 실패했습니다.");
      }
    };
  
    const handleSell = async (stock: StockData, price: number, qty: number) => {
      const totalEarn = price * qty;
      const owned = portfolio.find(item => item.name === stock.name);
      if (!owned || owned.sharesCount < qty) {
        alert("보유 주식이 부족합니다.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/trade/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': encodeURIComponent(`USER_${userName}`)
          },
          body: JSON.stringify({ 
            agent_id: `USER_${userName}`, 
            ticker: stock.symbol || stock.name, 
            side: 'SELL', 
            order_type: 'LIMIT', 
            price: price, 
            quantity: qty 
          })
        });
        const result = await response.json();
        
        if (!response.ok || result.status === 'FAIL') {
          alert(`매도 실패: ${result.msg || '서버 오류'}`);
          return;
        }

        if (result.status === 'PENDING') {
          alert(`[주문 대기중]\n지정하신 가격(${price.toLocaleString()}원)에 사려는 사람이 없어 대기열에 등록되었습니다!\n구매자가 나타나면 자동으로 체결됩니다.`);
          return; 
        }

        // 🔥 [완벽 복구] 매도 즉시 화면(거래내역)에 영수증을 딱! 띄워주는 원래 코드 복구
        const newTransaction: TransactionItem = {
          id: Date.now(),
          name: stock.name,
          date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').slice(0, -1),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          type: 'sell',
          amount: `${totalEarn.toLocaleString()}원`,
          pricePerShare: `${price.toLocaleString()}원`,
          qty: `${qty}주`,
          logoText: stock.logoText || stock.name.charAt(0),
          logoBg: stock.color
        };
        
        // 내 거래내역에 즉시 추가!
        setTransactions(prev => {
          const isExist = prev.some(p => p.name === newTransaction.name && p.time === newTransaction.time && p.type === 'sell');
          if (isExist) return prev;
          return [newTransaction, ...prev];
        });
        
        addNotification(`${stock.name} ${qty}주 매도가 체결되었습니다.`, 'sell');
      } catch (error) {
        console.error("백엔드 통신 실패", error);
        alert("서버 통신에 실패했습니다.");
      }
    };

    if (!onboardingCompleted) {
      return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative overflow-hidden shadow-2xl">
          {onboardingStep === 'terms' && (
            <TermsAgreement 
              onNext={() => setOnboardingStep('account')} 
              onSkip={handleCompleteOnboarding}
            />
          )}
          {onboardingStep === 'account' && (
            <AccountOpening 
              onBack={() => setOnboardingStep('terms')} 
              onNext={handleCompleteOnboarding}
              onShowGuide={() => setOnboardingStep('guide')}
              onSkip={handleCompleteOnboarding}
              onNicknameChange={setUserName}
            />
          )}
          {onboardingStep === 'guide' && (
            <AccountGuide onBack={() => setOnboardingStep('account')} />
          )}
        </div>
      );
    }

  return (
    <Routes>
      <Route element={<Layout 
        notifications={notifications} 
        onMarkAsRead={handleMarkNotificationsAsRead} 
        userName={userName} 
        userLevel={userLevel}
        tourCompleted={tourCompleted}
        handleCompleteTour={handleCompleteTour}
        onboardingCompleted={onboardingCompleted}
      />}>
         <Route path="/" element={<PopularStocks />} />
         <Route path="/assets" element={<AssetsContent cash={cash} portfolio={portfolio} />} />
         <Route path="/news" element={<NewsContent />} />
         <Route path="/ranking" element={<RankingContent userName={userName} />} />
         <Route path="/community" element={<CommunityContent userName={userName} />} />
         <Route path="/quest" element={<QuestContent />} />
         
         <Route path="/market" element={
            <MarketContent 
               stocks={stocks}
               watchlist={watchlist} 
               onToggleWatchlist={handleToggleWatchlist} 
               onBuy={handleBuy}
               onSell={handleSell}
               cash={cash}
               homeTourCompleted={tourCompleted}
            />
         } />
         
         <Route path="/status" element={
            <StockStatusContent 
               watchlist={watchlist} 
               onToggleWatchlist={handleToggleWatchlist} 
               cash={cash}
               portfolio={portfolio}
               transactions={transactions}
               onBuy={handleBuy}
               onSell={handleSell}
               userName={userName}
            />
         } />
      </Route>

      <Route path="/chatbot" element={
        <Layout 
          hideHeader 
          notifications={notifications} 
          onMarkAsRead={handleMarkNotificationsAsRead} 
          userName={userName} 
          userLevel={userLevel}
          tourCompleted={tourCompleted}
          handleCompleteTour={handleCompleteTour}
          onboardingCompleted={onboardingCompleted}
        >
           <ChatbotContent onBack={() => {}} />
        </Layout>
      } />
      
      <Route path="/settings" element={
        <Layout 
          hideHeader 
          notifications={notifications} 
          onMarkAsRead={handleMarkNotificationsAsRead} 
          userName={userName} 
          userLevel={userLevel}
          tourCompleted={tourCompleted}
          handleCompleteTour={handleCompleteTour}
          onboardingCompleted={onboardingCompleted}
        >
           <SettingsContent userName={userName} userLevel={userLevel} />
        </Layout>
      } />
    </Routes>
  );
};

export default App;