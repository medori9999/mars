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
import { initialWatchlist } from './data/mockData';
import { fetchCompanies } from './services/api';
import { fetchCompanies as fetchBackendCompanies } from './api';
import TermsAgreement from './components/onboarding/TermsAgreement';
import AccountOpening from './components/onboarding/AccountOpening';
import AccountGuide from './components/onboarding/AccountGuide';
import AppTour from './components/onboarding/AppTour';

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
    
    // --- Global State for Trading Simulation ---
    const [cash, setCash] = useState<number>(5000000); 
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]); 
    const [transactions, setTransactions] = useState<TransactionItem[]>([]); 
    const [notifications, setNotifications] = useState<NotificationItem[]>([]); 
    const [stocks, setStocks] = useState<StockData[]>([]);
  
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [userName, setUserName] = useState('user');
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<'terms' | 'account' | 'guide'>('terms');

    // 🔥 1. 온보딩 완료 시 백엔드 DB에 500만원 계좌 즉시 개설
    const handleCompleteOnboarding = async () => {
      try {
        await fetch('http://localhost:8000/api/user/init', {
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

    // 🔥 2. 5초마다 백엔드에서 실제 내 잔고를 훔쳐와서 화면에 동기화
    useEffect(() => {
      if (!onboardingCompleted) return;
      const syncAssets = async () => {
        try {
          const res = await fetch('http://localhost:8000/api/user/status', {
            headers: { 'x-user-id': `USER_${userName}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCash(data.balance); // 백엔드 잔고로 업데이트
          }
        } catch(e) { }
      };
      
      syncAssets();
      const interval = setInterval(syncAssets, 5000);
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

    // 실시간 주가 동기화 로직
    React.useEffect(() => {
      const loadStocks = async () => {
        try {
          const backendData = await fetchBackendCompanies();
          if (backendData && backendData.length > 0) {
            const translated: StockData[] = backendData.map(c => {
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
            setStocks(translated);
            syncPortfolioAndWatchlist(translated);
            return;
          }
        } catch (e) {
          // 백엔드 연결 실패 시 패스
        }

        try {
          const data = await fetchCompanies();
          setStocks(data);
          syncPortfolioAndWatchlist(data);
        } catch (error) {
          console.error("Failed to poll stocks:", error);
        }
      };

      const syncPortfolioAndWatchlist = (data: StockData[]) => {
        if (data.length > 0) {
          setPortfolio(prev => prev.map(item => {
            const match = data.find(s => s.symbol === item.symbol || s.name === item.name);
            return match ? { ...item, price: match.price, change: match.change, isUp: match.isUp } : item;
          }));
          setWatchlist(prev => prev.map(item => {
            const match = data.find(s => s.symbol === item.symbol || s.name === item.name);
            return match ? { ...item, price: match.price, change: match.change, isUp: match.isUp } : item;
          }));
        }
      };

      loadStocks();
      const interval = setInterval(loadStocks, 5000);
      return () => clearInterval(interval);
    }, []);
  
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
  
    // 🔥 3. 매수 시 백엔드 엔진으로 주문서를 발송하고, 성공 시에만 돈 깎기
    const handleBuy = async (stock: StockData, price: number, qty: number) => {
      const totalCost = price * qty;
      if (cash < totalCost) {
        alert("보유 현금이 부족합니다.");
        return;
      }

      // 프론트엔드에서 즉시 깎기 전에 백엔드에 매수 허락받기
      try {
        const response = await fetch('http://localhost:8000/api/trade/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': `USER_${userName}`
          },
          body: JSON.stringify({
            ticker: stock.symbol || stock.name,
            side: 'BUY',
            price: price,
            quantity: qty
          })
        });
        const result = await response.json();
        
        if (!response.ok || result.status === 'FAIL') {
          alert(`매수 실패: ${result.msg || '서버 오류'}`);
          return; // 백엔드에서 튕기면 프론트엔드 돈도 안 깎임!
        }
      } catch (error) {
        console.error("백엔드 통신 실패", error);
        alert("서버 통신에 실패했습니다.");
        return;
      }
  
      // 백엔드 승인 완료! 프론트엔드 UI 즉시 반영 (돈 깎기 & 포트폴리오 채우기)
      setCash(prev => prev - totalCost);
  
      setPortfolio(prev => {
        const existingIndex = prev.findIndex(item => item.name === stock.name);
        if (existingIndex >= 0) {
          const updatedItem = {
            ...prev[existingIndex],
            sharesCount: prev[existingIndex].sharesCount + qty,
            shares: `${prev[existingIndex].sharesCount + qty}주`,
            price: stock.price,
            change: stock.change,
            isUp: stock.isUp
          };
          const newPortfolio = prev.filter((_, idx) => idx !== existingIndex);
          return [updatedItem, ...newPortfolio];
        } else {
          const newItem: PortfolioItem = {
            id: Date.now(),
            name: stock.name,
            badge: '실전',
            shares: `${qty}주`,
            sharesCount: qty,
            price: stock.price,
            change: stock.change,
            isUp: stock.isUp,
            color: stock.color || 'bg-[#3082F5]',
            logoText: stock.logoText || stock.name.charAt(0)
          };
          return [newItem, ...prev];
        }
      });
  
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
      setTransactions(prev => [newTransaction, ...prev]);
      addNotification(`${stock.name} ${qty}주 매수가 체결되었습니다.`, 'buy');
    };
  
    // 🔥 4. 매도 시 백엔드 엔진으로 주문서 발송하고, 성공 시에만 돈 주기
    const handleSell = async (stock: StockData, price: number, qty: number) => {
      const totalEarn = price * qty;
      const owned = portfolio.find(item => item.name === stock.name);
      if (!owned || owned.sharesCount < qty) {
        alert("보유 주식이 부족합니다.");
        return;
      }

      // 프론트엔드에서 즉시 반영 전에 백엔드에 매도 허락받기
      try {
        const response = await fetch('http://localhost:8000/api/trade/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': `USER_${userName}`
          },
          body: JSON.stringify({
            ticker: stock.symbol || stock.name,
            side: 'SELL',
            price: price,
            quantity: qty
          })
        });
        const result = await response.json();
        
        if (!response.ok || result.status === 'FAIL') {
          alert(`매도 실패: ${result.msg || '서버 오류'}`);
          return;
        }
      } catch (error) {
        console.error("백엔드 통신 실패", error);
        alert("서버 통신에 실패했습니다.");
        return;
      }
  
      // 백엔드 승인 완료! 프론트엔드 화면 즉각 반영 (돈 늘리기)
      setCash(prev => prev + totalEarn);
  
      setPortfolio(prev => {
        const existing = prev.find(item => item.name === stock.name)!;
        const remaining = existing.sharesCount - qty;
  
        if (remaining <= 0) {
          return prev.filter(item => item.name !== stock.name);
        } else {
          const updatedItem = {
            ...existing,
            sharesCount: remaining,
            shares: `${remaining}주`
          };
          return prev.map(item => item.name === stock.name ? updatedItem : item);
        }
      });
  
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
      setTransactions(prev => [newTransaction, ...prev]);
      addNotification(`${stock.name} ${qty}주 매도가 체결되었습니다.`, 'sell');
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