import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Send, List, Check } from 'lucide-react';
import ChatTour from './onboarding/ChatTour';
import { fetchAgentChat } from '../api';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  agentId?: number; // 어떤 에이전트가 보냈는지 식별
}

interface Agent {
  id: number;
  name: string;
  desc: string;
  avatarSeed: string;
  bgColor: string;
  type: 'fox' | 'wolf' | 'dog' | 'owl';
  imageUrl: string;
  backendType: string; // [백엔드 연동] API에 보낼 에이전트 타입
}

interface ChatbotContentProps {
  onBack: () => void;
}

const agents: Agent[] = [
  { 
    id: 1, 
    name: '공격적 여우', 
    desc: '시장 흐름 중심 분석', 
    avatarSeed: 'Garrett', 
    bgColor: 'bg-[#FFEDD5]',
    type: 'fox',
    imageUrl: '/Aggressive_Fox.png',
    backendType: 'aggressive'
  },
  { 
    id: 2, 
    name: '안정형 여우', 
    desc: '리스크 최소화 투자 스타일', 
    avatarSeed: 'Felix', 
    bgColor: 'bg-[#E0F2FE]',
    type: 'wolf',
    imageUrl: '/Stable_Fox.png',
    backendType: 'stable'
  },
  { 
    id: 3, 
    name: '비관적 여우', 
    desc: '보수적 시나리오 점검', 
    avatarSeed: 'Buster', 
    bgColor: 'bg-[#F3F4F6]',
    type: 'dog',
    imageUrl: '/Pessimistic_Fox.png',
    backendType: 'pessimistic'
  },
  { 
    id: 4, 
    name: '멘토 부엉이', 
    desc: '투자 개념 학습 도우미', 
    avatarSeed: 'Bandit', 
    bgColor: 'bg-[#FEF3C7]',
    type: 'owl',
    imageUrl: '/Mentor_Owl.png',
    backendType: 'mentor'
  },
];

const ChatbotContent: React.FC<ChatbotContentProps> = ({ onBack }) => {
  const [step, setStep] = useState<'select' | 'chat'>('select');
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [chatTourCompleted, setChatTourCompleted] = useState(() => localStorage.getItem('chat-tour-done') === 'true');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, step]);

  const toggleAgent = (id: number) => {
    setSelectedAgentIds(prev => 
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  const handleStartChat = () => {
    if (selectedAgentIds.length === 0) return;
    
    // 초기 환영 메시지 생성
    const welcomeMessages: Message[] = selectedAgentIds.map((id, index) => {
      const agent = agents.find(a => a.id === id);
      return {
        id: Date.now() + index,
        sender: 'ai',
        text: `안녕하세요! ${agent?.name}입니다. 무엇을 도와드릴까요?`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        agentId: id
      };
    });
    
    setMessages(welcomeMessages);
    setStep('chat');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");

    // [백엔드 연동] 선택된 에이전트들에게 순차적으로 응답 요청
    for (let index = 0; index < selectedAgentIds.length; index++) {
      const agentId = selectedAgentIds[index];
      const agent = agents.find(a => a.id === agentId);
      if (!agent) continue;

      // 로딩 메시지 표시
      const loadingId = Date.now() + 100 + index;
      const loadingMsg: Message = {
        id: loadingId,
        sender: 'ai',
        text: `[${agent.name}] 고민 중...`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        agentId: agentId
      };
      setMessages(prev => [...prev, loadingMsg]);

      try {
        const reply = await fetchAgentChat(agent.backendType, currentInput);
        // 로딩 메시지를 실제 응답으로 교체
        setMessages(prev => prev.map(m => 
          m.id === loadingId ? { ...m, text: `[${agent.name}] ${reply}` } : m
        ));
      } catch (e) {
        // 백엔드 실패 시 폴백 응답
        setMessages(prev => prev.map(m => 
          m.id === loadingId ? { ...m, text: `[${agent.name}] '${currentInput}'에 대한 분석 의견을 드립니다.` } : m
        ));
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // 에이전트 선택 화면 렌더링
  if (step === 'select') {
    return (
      <div className="flex flex-col h-full bg-[#e1eaf5] relative animate-in fade-in duration-300">
        {/* Header */}
        <div className="px-5 pt-8 pb-4 flex items-center justify-end shrink-0">
          <button 
            id="chat-tour-select"
            onClick={handleStartChat}
            disabled={selectedAgentIds.length === 0}
            className={`px-5 py-2.5 rounded-2xl font-black text-[13px] tracking-tight transition-all ${
              selectedAgentIds.length > 0 
                ? 'bg-[#004FFE] text-white shadow-md active:scale-95' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            선택완료 &gt;
          </button>
        </div>
        
        <div id="chat-tour-intro" className="px-6 pb-6 shrink-0">
          <h1 className="text-[26px] font-black text-[#1A334E] leading-tight tracking-tight">
            함께할 AI 파트너를<br/>선택해주세요
          </h1>
          <p className="text-[14px] text-gray-400 font-bold mt-2">중복 선택이 가능합니다.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 hide-scrollbar content-start">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {agents.map((agent) => {
              const isSelected = selectedAgentIds.includes(agent.id);
              return (
                <div 
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`relative rounded-[1.2rem] flex flex-col items-center text-center transition-all cursor-pointer border-2 shadow-sm overflow-hidden ${
                    isSelected 
                      ? 'bg-white border-[#004FFE] ring-1 ring-[#004FFE]/30' 
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Check circle — 좌상단 */}
                  <div className={`absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                    isSelected 
                      ? 'bg-[#004FFE] shadow-sm' 
                      : 'bg-white border-2 border-gray-200'
                  }`}>
                    {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                  
                  {/* 이미지 영역 — 카드 상단에 배경과 함께 크게 배치 */}
                  <div className="w-full aspect-square relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8fdf6 0%, #eef6e8 30%, #f5f5dc 60%, #fefce8 100%)' }}>
                    <img 
                      src={agent.imageUrl} 
                      alt={agent.name} 
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  
                  {/* 텍스트 영역 */}
                  <div className="px-3 py-3">
                    <h3 className="font-black text-[#1A334E] text-[14px] mb-0.5 tracking-tight">{agent.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold break-keep leading-tight">
                      {agent.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 채팅 화면 렌더링
  return (
    <div className="flex flex-col h-full bg-[#e1eaf5] overflow-hidden font-['Pretendard'] animate-in slide-in-from-right duration-300">
      {/* Chat Header */}
      <div className="bg-[#004FFE] px-4 py-3 flex items-center justify-between shadow-md shrink-0 z-20">
        <div className="flex items-center">
          <button 
            onClick={() => setStep('select')}
            className="w-8 h-8 flex items-center justify-center text-white mr-2"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-white font-bold text-lg leading-none">AI 투자 조언</h2>
            <span className="text-[11px] text-white/70 font-medium">
              ({selectedAgentIds.length}명의 에이전트와 대화 중..)
            </span>
          </div>
        </div>
        <button className="text-white p-2">
          <List size={22} />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-6 pb-6 hide-scrollbar space-y-6"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const agent = isUser ? null : agents.find(a => a.id === msg.agentId);
          
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
              {!isUser && (
                <div className="flex flex-col items-center space-y-1 self-start">
                  <div className={`w-10 h-10 rounded-full ${agent?.bgColor || 'bg-white'} border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center`}>
                    <img 
                      src={agent?.imageUrl || '/Stable_Fox.png'} 
                      alt="AI" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <span className="text-[9px] font-bold text-gray-500">{agent?.name}</span>
                </div>
              )}
              
              <div className={`max-w-[70%] px-4 py-3 rounded-[1.5rem] shadow-sm text-sm font-bold leading-relaxed ${
                isUser 
                  ? 'bg-[#004FFE] text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-white'
              }`}>
                {msg.text}
              </div>
              
              <span className="text-[9px] text-gray-400 font-medium mb-1 whitespace-nowrap self-end">
                {msg.timestamp}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chat Input Bar - Adjusted with margin to avoid overlap with BottomNav */}
      <div id="chat-tour-input" className="px-4 pt-2 pb-28 bg-gradient-to-t from-[#e1eaf5] via-[#e1eaf5] to-transparent shrink-0">
        <div className="bg-white rounded-full p-2 flex items-center shadow-lg border border-white">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => console.log(e.target.files)} 
          />
          <button onClick={handleFileClick} className="p-2 text-[#004FFE] hover:bg-[#F5F8FC] rounded-full transition-colors">
            <Plus size={24} />
          </button>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="메시지를 입력하세요..." 
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700 placeholder-gray-300 px-2"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
              inputValue.trim() ? 'bg-[#004FFE] text-white' : 'bg-gray-100 text-gray-300'
            }`}
          >
            <Send size={18} fill={inputValue.trim() ? "white" : "none"} />
          </button>
        </div>
      </div>

      {!chatTourCompleted && (
        <ChatTour 
          onComplete={() => setChatTourCompleted(true)} 
          isChatStep={step === 'chat'}
          onForceChatView={() => {
            // If the user reaches step 3 but isn't in chat view yet
            // We don't force it here because the user should click "선택완료"
            // But if the tour logic needs to wait, we'll handle it in ChatTour
          }}
        />
      )}
    </div>
  );
};

export default ChatbotContent;