import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  illustration: string;
  subDescription?: string;
  onBeforeStep?: () => void;
  onAfterStep?: () => void;
  forceCenter?: boolean;
}

interface StatusTourProps {
  onComplete: () => void;
  onSelectTab: (tab: 'status' | 'history' | 'solution') => void;
  onNavigateHome: () => void;
}

const STATUS_TOUR_STEPS: (onSelectTab: (tab: 'status' | 'history' | 'solution') => void) => TourStep[] = (onSelectTab) => [
  {
    targetId: 'center',
    title: '#1 페이지 소개',
    description: "여기는 '주식현황' 페이지야! 네가 투자한 주식들을 한눈에 볼 수 있는 곳이지. 먼저 주식현황 부분부터 자세히 살펴볼까?",
    illustration: '🦉'
  },
  {
    targetId: 'status-total-assets',
    title: '#2 주식현황 - 총 보유자산',
    description: "네가 보유한 총 자산 금액이 나오고, 현재의 평가손익과 수익률을 확인할 수 있어.\n평가손익은 원금에서 얼마큼 벌었는지 또는 잃었는지 나타내주는 금액을 뜻해.",
    illustration: '🦉'
  },
  {
    targetId: 'status-portfolio-list',
    title: '#3 주식현황 - 포트폴리오 (1/2)',
    description: "아래로 내려보면 보유자산 포트폴리오로 네가 현재 보유한 주식 목록이 나와있어. 각 주식종목에 대한 현재 주가와 네가 보유한 주식이 몇 개인지 알 수 있어.",
    illustration: '🦉',
    forceCenter: true
  },
  {
    targetId: 'status-portfolio-list',
    title: '#4 주식현황 - 포트폴리오 (2/2)',
    description: "회사 이름을 누르면 관련 종목에 대한 주가창으로 넘어갈 수 있어! 한번 이것저것 눌러보면서 확인해보는 것도 좋아.",
    illustration: '🦉',
    forceCenter: true
  },
  {
    targetId: 'status-watchlist',
    title: '#5 주식현황 - 관심종목',
    description: "네가 관심 있어서 하트를 누른 주식 종목을 한꺼번에 보고 싶다면 여기서 편하게 확인할 수 있어!",
    illustration: '🦉'
  },
  {
    targetId: 'center',
    title: '#6 주식현황 - 포트폴리오 (1/2)',
    description: "팀으로 주식을 할 때 좋은 포트폴리오와 나쁜 포트폴리오 예시에 대해 알려줄게!\n\n✅ 분산형(좋은 예)\n- 현금 30%, 분야별로 25%, 20%, 금융 15%, 기타 10%\n\n❌ 집중형(추천하지 않는 예)\n- 현금 5%, A주식 60%, B주식 20%, C주식 15%",
    illustration: '🦉'
  },
  {
    targetId: 'center',
    title: '#8 주식현황 - 포트폴리오 (2/2)',
    description: "🔑 핵심\n- 한 종목에 50% 이상 투자 ❌\n- 현금 0% ❌\n- 최소 2개 종목 보유",
    subDescription: "❗이러한 방향성을 제시 드리지만, 강제성을 띠지 않습니다.",
    illustration: '🦉'
  },
  {
    targetId: 'status-tab-history',
    title: '#9 거래내역',
    description: "거래내역에서는 네가 이때까지 사거나 팔았던 주식 거래 내역을 확인할 수 있어.\n언제 샀는지 확인하고, 수익이나 손실을 얼마나 가져갔는지, 성공 패턴을 분석할 수 있는 중요한 과거 기록이야.",
    illustration: '🦉',
    onBeforeStep: () => onSelectTab('history')
  },
  {
    targetId: 'status-tab-solution',
    title: '#10 에이전트 솔루션 (1/4)',
    description: "솔루션은 거래내역을 기반으로 AI 여우 에이전트들이 평가나 의견을 주는 공간이야. 여우 에이전트들은 3명을 소개해 줄게.",
    illustration: '🦉',
    onBeforeStep: () => onSelectTab('solution')
  },
  {
    targetId: 'center',
    title: '#10 에이전트 솔루션 (2/4)',
    description: "🦊 공격형 여우 에이전트\n- 단기 변동성을 이용해 빠르게 수익을 내는 성향\n- 실시간으로 시장을 주시해 빠른 매수/매도를 해\n- 차트, 패턴 등을 활용해서 기회 보면 들어가고, 위험하면 바로 빠져\n- 큰 수익을 얻을 수 있지만 큰 손실도 각오해야 해\n- 스캘핑, 트레이더 스타일",
    illustration: '🦉'
  },
  {
    targetId: 'center',
    title: '#10 에이전트 솔루션 (3/4)',
    description: "🐺 안정형 여우 에이전트\n- 좋은 회사를 싸게 사서 오래 보유하는 성향\n- 회사의 가치를 계산해 장기투자를 해\n- 저평가된 우량주를 선호해\n- 주가가 떨어져도 흔들리지 않아\n- 워렌 버핏 스타일",
    illustration: '🦉'
  },
  {
    targetId: 'center',
    title: '#10 에이전트 솔루션 (4/4)',
    description: "🐺 비관형 여우 에이전트\n- 모두가 팔 때 사고, 모두가 살 때 파는 성향\n- 대중의 반대로 움직여\n- 시장 내 심리를 파악해서 역이용하지\n- 혼자 반대로 가는 용기가 필요해\n- 위기를 기회라고 보는 스타일",
    illustration: '🦉'
  },
  {
    targetId: 'center',
    title: '#11 에이전트 솔루션 - 주의사항',
    description: "AI 여우 에이전트들을 사용할 때 주의해야 할 점들이 있어!\n\n⚠ 참고만 하기 (AI는 정답이 아니야)\n⚠ 하나의 의견만 보지 말고 종합으로 판단할 필요가 있어\n⚠ AI만 믿지 말고 뉴스와 함께 생각하기\n⚠ 결국 최종 결정은 본인의 생각이 우선이야",
    illustration: '🦉'
  },
  {
    targetId: 'tour-bottom-chatbot',
    title: '#12 튜토리얼 종료',
    description: "이제 모든 튜토리얼이 끝났어!\n만약 궁금한 점이 생긴다면 나는 언제나 하단 \"챗봇\" 탭에 존재하니 언제든지 나를 불러줘!",
    illustration: '🦉'
  }
];

const StatusTour: React.FC<StatusTourProps> = ({ onComplete, onSelectTab, onNavigateHome }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const STEPS = STATUS_TOUR_STEPS(onSelectTab);
  const currentStep = STEPS[currentStepIdx];

  const updateTargetPosition = () => {
    if (currentStep.targetId === 'center') {
      setTargetRect(null);
      setIsVisible(true);
      return;
    }

    const element = document.getElementById(currentStep.targetId);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (currentStep.onBeforeStep) {
      currentStep.onBeforeStep();
    }

    let retryCount = 0;
    const maxRetries = 20;

    const attemptUpdate = () => {
      if (currentStep.targetId === 'center') {
        updateTargetPosition();
        return;
      }

      const element = document.getElementById(currentStep.targetId);
      if (element) {
        updateTargetPosition();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptUpdate, 100);
      } else {
        setIsVisible(false);
      }
    };

    attemptUpdate();
    window.addEventListener('resize', updateTargetPosition);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [currentStepIdx]);

  if (!isVisible && currentStep.targetId !== 'center') return null;

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep.onAfterStep) {
      currentStep.onAfterStep();
    }

    if (currentStepIdx < STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      localStorage.setItem('app-tour-done', 'true');
      localStorage.setItem('market-tour-done', 'true');
      localStorage.setItem('status-tour-done', 'true');
      onNavigateHome();
      onComplete();
    }
  };

  const getPopupPosition = () => {
    const commonStyles = {
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto' as const,
      width: 'min(calc(100vw - 40px), 320px)'
    };

    if (!targetRect || currentStep.forceCenter) {
      return {
        ...commonStyles,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const centerY = targetRect.top + targetRect.height / 2;
    const isBottomHalf = targetRect.top > window.innerHeight / 2;
    
    let top: string = 'auto';
    let bottom: string = 'auto';
    let transform: string = 'translateX(-50%)';

    if (isBottomHalf) {
      bottom = `${window.innerHeight - targetRect.top + 20}px`;
      if (parseInt(bottom) > window.innerHeight - 60) {
        bottom = 'auto';
        top = '20px';
        transform = 'translateX(-50%)';
      }
    } else {
      top = `${targetRect.bottom + 20}px`;
      if (parseInt(top) > window.innerHeight - 60) {
        top = 'auto';
        bottom = '20px';
        transform = 'translateX(-50%)';
      }
    }

    return {
      ...commonStyles,
      top,
      bottom,
      left: '50%',
      transform,
    };
  };

  const popupPosition = getPopupPosition();

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in duration-500">
      {/* Overlay Mask */}
      {targetRect ? (
        <div 
          className="absolute inset-0 bg-black/60"
          style={{
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${targetRect.left}px 100%, 
              ${targetRect.left}px ${targetRect.top}px, 
              ${targetRect.right}px ${targetRect.top}px, 
              ${targetRect.right}px ${targetRect.bottom}px, 
              ${targetRect.left}px ${targetRect.bottom}px, 
              ${targetRect.left}px 100%, 
              100% 100%, 
              100% 0%
            )`
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Highlight Border */}
      {targetRect && (
        <div 
          className="absolute transition-all duration-300 pointer-events-none rounded-2xl border-[3px] border-primary shadow-[0_0_20px_rgba(45,140,105,0.6)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Guide Popup */}
      <div 
        className="absolute bg-white rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center text-center transition-all duration-300 scrollbar-hide overflow-visible"
        style={popupPosition as any}
      >
        <div className="absolute top-6 right-6 z-[100] flex flex-col items-end">
          <button 
            onClick={() => {
              localStorage.setItem('app-tour-done', 'true');
              localStorage.setItem('market-tour-done', 'true');
              localStorage.setItem('status-tour-done', 'true');
              localStorage.removeItem('market-highlight-pending');
              localStorage.removeItem('status-highlight-pending');
              onComplete();
            }} 
            className="text-gray-300 hover:text-gray-500 p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {currentStepIdx === 0 && (
            <div className="relative mt-2 animate-bounce">
              <div className="absolute -top-1.5 right-2.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#004FFE]"></div>
              <div className="bg-[#004FFE] text-white text-[11px] px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap font-black border border-white/10">
                Skip 버튼!
              </div>
            </div>
          )}
        </div>

        <div className="relative mb-6">
           <div className="w-32 h-32 bg-[#F0F9F6] rounded-[2.5rem] flex items-center justify-center shadow-md border-4 border-white overflow-hidden">
              <img src="/Mentor_Owl.png" className="w-full h-full object-contain p-2" alt="Mentor Owl" />
           </div>
           <div className="absolute -bottom-2 -right-2 bg-[#004FFE] text-white text-[11px] font-black px-3 py-1 rounded-full border-2 border-white shadow-sm">
              {currentStepIdx + 1} / {STEPS.length}
           </div>
        </div>

        <span className="text-primary text-[11px] font-black tracking-widest uppercase mb-2 bg-primary/5 px-3 py-1 rounded-full">
           STATUS TOUR
        </span>
        
        <h3 className="text-[19px] font-black text-[#1A334E] mb-2 leading-tight">
          {currentStep.title}
        </h3>
        
        <p className="text-[14px] font-bold text-gray-400 mb-2 leading-relaxed whitespace-pre-wrap text-left w-full px-2">
          {currentStep.description}
        </p>

        {currentStep.subDescription && (
          <p className="text-[11px] text-gray-400 mb-6 leading-tight whitespace-pre-wrap w-full px-2">
             {currentStep.subDescription}
          </p>
        )}

        <div className="w-full flex space-x-3 mt-4">
          <button 
            onClick={handleBack}
            disabled={currentStepIdx === 0}
            className={`flex-1 py-4 rounded-full font-black text-[16px] active:scale-95 transition-all ${
              currentStepIdx === 0 
                ? 'bg-gray-50 text-gray-200 cursor-not-allowed' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            뒤로
          </button>
          <button 
            onClick={handleNext}
            className="flex-2 py-4 bg-[#004FFE] text-white rounded-full font-black text-[16px] shadow-lg shadow-[#004FFE]/20 active:scale-95 transition-all flex items-center justify-center group"
          >
            <span>{currentStepIdx === STEPS.length - 1 ? '완료' : '다음'}</span>
            <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusTour;
