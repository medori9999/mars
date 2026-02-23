import React, { useState } from 'react';
import {
  ChevronRight,
  Bell,
  Moon,
  Info,
  User,
  Megaphone,
  HelpCircle,
  ShieldCheck,
  Type,
  ScrollText,
  Shield
} from 'lucide-react';
import { USER_LEVEL } from '../constants/user';
import profileSquirrel from '../assets/profile_squirrel.png';

const SettingsContent: React.FC<{ userName: string, userLevel: string }> = ({ userName, userLevel }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [eduEnabled, setEduEnabled] = useState(true);
  const [marketEnabled, setMarketEnabled] = useState(true);
  const [dualLoginEnabled, setDualLoginEnabled] = useState(false);
  const [autoPasswordEnabled, setAutoPasswordEnabled] = useState(false);

  // Character URL (matching image 6)
  const userAvatarUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky&backgroundColor=b6e3f4";

  return (
    <div className="flex flex-col h-full bg-[#e1eaf5] overflow-hidden font-['Pretendard']">
      {/* Title Header */}
      <div className="px-6 pt-8 pb-6 shrink-0">
        <h1 className="text-[24px] font-black text-[#1A334E] tracking-tight">환경 설정</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-10 hide-scrollbar">
        {/* Profile Card Section */}
        <div className="bg-[#004FFE] rounded-[2.5rem] p-6 shadow-lg shadow-[#004FFE]/20 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-0.5 overflow-hidden border-2 border-white/30">
               <img 
                 src={(userLevel === 'Lv.5' || userLevel === 'Lv.6') ? '/lv5.png' : profileSquirrel} 
                 alt="User Avatar" 
                 className="w-[90%] h-[90%] object-contain" 
               />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[20px] font-black text-white tracking-tight">{userName}</span>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/30">{userLevel}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="text-white opacity-60" size={28} />
        </div>

        {/* Notification Settings Group */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm space-y-7">
          <div className="flex items-center space-x-2 pb-1">
            <Bell size={20} className="text-[#004FFE]" strokeWidth={3} />
            <span className="text-[17px] font-black text-[#1A334E] tracking-tight">알림 설정</span>
          </div>

          {/* Toggle Items */}
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 cursor-pointer group active:opacity-80 transition-opacity" onClick={() => setPushEnabled(!pushEnabled)}>
              <div className="flex flex-col flex-1">
                <span className="text-[15px] font-black text-[#1A334E]">푸시 알림 <span className="text-[#004FFE]">ON/OFF</span></span>
                <span className="text-[12px] text-gray-400 font-bold mt-0.5">전체 알림 ON/OFF</span>
              </div>
              <div className="shrink-0 pointer-events-none">
                <ToggleButton enabled={pushEnabled} onClick={() => {}} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 cursor-pointer group active:opacity-80 transition-opacity" onClick={() => setEduEnabled(!eduEnabled)}>
              <div className="flex flex-col flex-1">
                <span className="text-[15px] font-black text-[#1A334E]">교육 콘텐츠 알림</span>
                <span className="text-[12px] text-gray-400 font-bold mt-0.5">새로운 강의, 퀘스트 업데이트 소식</span>
              </div>
              <div className="shrink-0 pointer-events-none">
                <ToggleButton enabled={eduEnabled} onClick={() => {}} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 cursor-pointer group active:opacity-80 transition-opacity" onClick={() => setMarketEnabled(!marketEnabled)}>
              <div className="flex flex-col flex-1">
                <span className="text-[15px] font-black text-[#1A334E]">시장 브리핑 알림</span>
                <span className="text-[12px] text-gray-400 font-bold mt-0.5">투자 관련 주요 뉴스나 시황 요약 알림</span>
              </div>
              <div className="shrink-0 pointer-events-none">
                <ToggleButton enabled={marketEnabled} onClick={() => {}} />
              </div>
            </div>

            {/* Time Setting Item */}
            <div className="flex items-center justify-between cursor-pointer group pt-1 gap-4">
              <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                <div className="w-11 h-11 rounded-full bg-[#F5F8FC] flex items-center justify-center text-[#004FFE] border border-[#F5F8FC] shrink-0">
                   <Moon size={22} fill="currentColor" className="opacity-80" />
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-[15px] font-black text-[#1A334E] truncate">야간 알림 제한</span>
                   <span className="text-[12px] text-gray-400 font-bold mt-0.5 truncate">밤 9시 ~ 아침 8시 알림 방지 기능</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <span className="text-[13px] font-black text-gray-400 whitespace-nowrap">21:00 ~ 08:00</span>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Group */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm space-y-7">
          <div className="flex items-center space-x-2 pb-1">
            <Shield size={20} className="text-[#004FFE]" strokeWidth={3} />
            <span className="text-[17px] font-black text-[#1A334E] tracking-tight">보안</span>
          </div>

          <div className="flex items-center justify-between gap-4 cursor-pointer group active:opacity-80 transition-opacity" onClick={() => setDualLoginEnabled(!dualLoginEnabled)}>
            <div className="flex flex-col flex-1">
              <span className="text-[15px] font-black text-[#1A334E]">이중접속 허용</span>
              <span className="text-[12px] text-gray-400 font-bold mt-0.5">여러 기기의 동시 접속 허용</span>
            </div>
            <div className="shrink-0 pointer-events-none">
              <ToggleButton enabled={dualLoginEnabled} onClick={() => {}} />
            </div>
          </div>

          <div className="h-[1px] w-full bg-gray-50 opacity-50"></div>

          <div className="flex items-center justify-between gap-4 cursor-pointer group active:opacity-80 transition-opacity" onClick={() => setAutoPasswordEnabled(!autoPasswordEnabled)}>
            <div className="flex flex-col flex-1">
              <span className="text-[15px] font-black text-[#1A334E]">계좌비밀번호 자동입력</span>
              <span className="text-[12px] text-gray-400 font-bold mt-0.5">주식/장내채권 주문 시 계좌비밀번호 미사용</span>
            </div>
            <div className="shrink-0 pointer-events-none">
              <ToggleButton enabled={autoPasswordEnabled} onClick={() => {}} />
            </div>
          </div>
        </div>

        {/* App Info Group */}
        <div className="bg-white rounded-[2.5rem] p-7 py-5 shadow-sm space-y-2 overflow-hidden">
          <MenuListItem icon={<User size={20} />} label="내 정보" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<ShieldCheck size={20} />} label="약관 및 개인정보 처리방침" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<Type size={20} />} label="글씨 크기 및 글꼴" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<Megaphone size={20} />} label="공지사항" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<Info size={20} />} label="앱 정보 & 고객 지원" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<HelpCircle size={20} />} label="자주 묻는 질문 (FAQ)" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem 
            icon={<ScrollText size={20} />} 
            label="오픈소스 라이선스" 
            sublabel="제3자 소프트웨어에 대한 저작권과 라이선스를 고지합니다"
          />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <div 
            onClick={() => {
              localStorage.removeItem('app-tour-done');
              window.location.reload();
            }}
            className="flex items-center justify-between py-4 cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="text-[#E53935] group-hover:text-red-600 transition-colors">
                <HelpCircle size={20} />
              </div>
              <span className="text-[15px] font-black text-[#E53935] tracking-tight">전체 초기화 (온보딩+투어)</span>
            </div>
            <ChevronRight size={20} className="text-red-300 group-hover:text-[#E53935] transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Standardized Toggle Component
const ToggleButton: React.FC<{ enabled: boolean; onClick: () => void }> = ({ enabled, onClick }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`w-12 h-6 rounded-full transition-all relative flex items-center ${
      enabled ? 'bg-[#004FFE]' : 'bg-gray-200'
    }`}
  >
    <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all duration-200 ease-in-out ${
      enabled ? 'left-[calc(100%-1.25rem)]' : 'left-1'
    }`} />
  </button>
);

const MenuListItem: React.FC<{ icon: React.ReactNode; label: string; sublabel?: string }> = ({ icon, label, sublabel }) => (
  <div className="flex items-center justify-between py-4 cursor-pointer group">
    <div className="flex items-center space-x-4 flex-1">
      <div className="text-gray-300 group-hover:text-[#004FFE] transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[15px] font-black text-[#1A334E] tracking-tight">{label}</span>
        {sublabel && (
          <span className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">
            {sublabel}
          </span>
        )}
      </div>
    </div>
    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
  </div>
);

export default SettingsContent;
