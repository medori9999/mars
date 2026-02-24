import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, Bell, X } from 'lucide-react';
import { NotificationItem } from '../types';
import profileSquirrel from '../assets/profile_squirrel.png';

import { USER_LEVEL } from '../constants/user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface HeaderProps {
  showProfile: boolean;
  notifications: NotificationItem[];
  onMarkAsRead: () => void;
  userName: string;
  userLevel: string;
}

const Header: React.FC<HeaderProps> = ({ showProfile, notifications, onMarkAsRead, userName, userLevel }) => {
  const hasUnread = notifications.some(n => !n.isRead);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔥 시뮬레이션 날짜 상태 추가 (기본값 세팅)
  const [simDate, setSimDate] = useState<string>("02.03 (월)");

  const handleBellClick = () => {
    if (!isDropdownOpen && hasUnread) {
      onMarkAsRead();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 외부 클릭 시 알림창 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🚀 [추가된 핵심 로직] 백엔드에서 시뮬레이션 시간을 쓱 가져옵니다 (다른 파일 수정 불필요)
  useEffect(() => {
    const fetchSimulationDate = async () => {
      try {
        // 1. 시장에 있는 기업 목록을 가져옵니다.
        const compsRes = await fetch(`${API_BASE_URL}/api/companies`);
        if (!compsRes.ok) return;
        const comps = await compsRes.json();
        
        if (comps && comps.length > 0) {
          // 2. 그 중 한 기업의 가장 최근 거래 1건을 조회해서 '현재 시뮬레이션 시간'을 알아냅니다.
          const chartRes = await fetch(`${API_BASE_URL}/api/chart/${comps[0].ticker}?limit=1`);
          if (!chartRes.ok) return;
          const chart = await chartRes.json();
          
          if (chart && chart.length > 0) {
            const dateObj = new Date(chart[0].time);
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            const dayStr = days[dateObj.getDay()];
            
            // 날짜 업데이트! (예: 02.04 (화))
            setSimDate(`${mm}.${dd} (${dayStr})`);
          }
        }
      } catch (error) {
        console.error("시뮬레이션 날짜 동기화 실패:", error);
      }
    };

    fetchSimulationDate();
    // 5초마다 날짜를 체크해서 시뮬레이션 하루가 지나가면 즉시 변경되게 합니다.
    const interval = setInterval(fetchSimulationDate, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-5 flex justify-between items-center bg-transparent min-h-[80px] relative z-50">
      {showProfile ? (
        <div className="flex items-center space-x-2 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center">
             {/* Representing the squirrel icon from the prompt's provided image (top-left) */}
            <img 
              src={(userLevel === 'Lv.5' || userLevel === 'Lv.6') ? '/lv5.png' : profileSquirrel} 
              alt="Avatar" 
              className="w-9 h-9 object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-[20px] font-black text-[#1A334E] tracking-tight">{userName}</span>
              <span className="bg-[#004FFE]/10 px-3 py-1 rounded-full text-[11px] font-black text-[#004FFE] border border-[#004FFE]/20 leading-none flex items-center justify-center translate-y-[1px]">
                {userLevel}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-10 h-10"></div> /* Placeholder to keep layout balanced or just empty */
      )}
      
      <div className="flex items-center space-x-3 relative" ref={dropdownRef}>
        {/* Notification Bell */}
        <button 
          onClick={handleBellClick}
          className="bg-white/80 backdrop-blur-sm border border-[#CFE3FA] px-3 py-1.5 rounded-full flex items-center justify-center shadow-sm relative h-[32px] w-[42px] hover:bg-white transition-colors"
        >
          <Bell size={16} className="text-gray-600" />
          {hasUnread && (
            <div className="absolute top-1 right-2 w-2 h-2 bg-[#E53935] rounded-full border border-white animate-pulse"></div>
          )}
        </button>

        {/* Notification Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-[#F9FAFB]">
              <span className="text-xs font-black text-gray-800">알림 센터</span>
              <button onClick={() => setIsDropdownOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto hide-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((noti) => (
                  <div key={noti.id} className="px-4 py-3 border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${noti.type === 'buy' ? 'bg-[#E53935]' : 'bg-[#1E88E5]'}`}></div>
                      <div className="flex flex-col">
                        <p className="text-xs font-bold text-gray-800 leading-snug">{noti.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 font-medium">{noti.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs font-bold">
                  새로운 알림이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar (🔥 데이터 연동 완료) */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#CFE3FA] px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-sm h-[32px]">
          <CalendarDays size={16} className="text-[#004FFE]" />
          <span className="text-xs font-semibold text-gray-700">{simDate}</span>
        </div>
      </div>
    </div>
  );
};

export default Header;