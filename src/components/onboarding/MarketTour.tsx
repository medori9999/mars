import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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

interface MarketTourProps {
  onComplete: () => void;
  onNavigateDetail: () => void;
  onSelectTab: (tab: string) => void;
}

const MARKET_TOUR_STEPS: (onNavigateDetail: () => void, onSelectTab: (tab: string) => void) => TourStep[] = (onNavigateDetail, onSelectTab) => [
  { 
    targetId: 'center', 
    title: '#1 페이지 소개', 
    description: '여기는 \'주식 시장\' 페이지야! 앞으로 네가 주식을 구매하거나 팔 수 있는 곳이지. 하나하나 살펴볼까?', 
    illustration: '🦉' 
  },
  { 
    targetId: 'center', 
    title: '#2 용어 설명', 
    description: '살펴보기 전에 먼저 주식이란 쉽게 회사의 작은 조각(소유권)으로, 주식 한 개의 가격을 주가라고 얘기해. 이제 주식시장을 구경해볼까?', 
    illustration: '🐿️' 
  },
  { 
    targetId: 'market-trends', 
    title: '#3 첫 창 - 시장 동향', 
    description: '시장 동향에서 코스피는 한국의 대표 주식시장이고, 나스닥은 미국의 기술회사 주식시장이야. 환율은 다른 나라 돈을 교환할 때의 비율이야.', 
    illustration: '🦉' 
  },
  { 
    targetId: 'market-ranking', 
    title: '#4 첫 창 - 실시간 랭킹', 
    description: '실시간 랭킹에서는 상승장/하락장을 보여주는데, 상승장은 주가가 올라가는 시장 순위, 하락장은 그 반대라고 볼 수 있어.', 
    illustration: '🐿️' 
  },
  { 
    targetId: 'market-ranking', 
    title: '⚠️ 주의할 점', 
    description: '- 급등주는 조심! (늦었을 수도)\n- 급락주는 이유 확인 필수!', 
    illustration: '🦉' 
  },
  { 
    targetId: 'market-ranking-first', 
    title: '#6 첫 창 - 주가창', 
    description: '원하는 주식의 정보들을 보고 싶다면 회사의 이름을 누르기만 하면 주가창으로 넘어갈 수 있어! 한번 눌러볼까?', 
    illustration: '🐿️',
    onAfterStep: onNavigateDetail
  },
  { 
    targetId: 'stock-detail-info', 
    title: '#7 둘째 창 - 주가창', 
    description: '회사 이름을 누르면 이렇게 주가창이 나오는데, 회사 이름 옆을 보면 하트 아이콘이 있지? 어떤 회사인지 주식에 관심이 있다면 주식의 시황에 관심 종목으로 넣을 수 있어!', 
    illustration: '🦉' 
  },
  { 
    targetId: 'stock-detail-chart', 
    title: '#8 둘째 창 - 차트창', 
    description: '차트에서는 네가 원하는 주식을 매수하거나 매도할 수 있어. 매수는 주식을 사는 걸 의미하고, 매도는 주식을 파는 것을 의미해. 그리고 시간 흐름에 따라 금액이 변동하는 주식 차트를 볼 수 있지만, 레벨 6부터 볼 수 있으니까 얼른 레벨을 올려보자.', 
    illustration: '🐿️',
    onBeforeStep: () => onSelectTab('차트'),
    forceCenter: true
  },
  { 
    targetId: 'stock-detail-tabs', 
    title: '#9 둘째 창 - 호가창', 
    description: '호가는 지금 너에게 보이지는 않겠지만 레벨 6으로 올라가면 주식을 사고 팔 때 도움이 되는 창이라고 할 수 있어! 레벨을 올려서 호가를 확인해보자. 뉴스탭으로 가볼까?', 
    illustration: '🦉',
    onBeforeStep: () => onSelectTab('호가')
  },
  { 
    targetId: 'stock-detail-news', 
    title: '#10 둘째 창 - 뉴스창', 
    description: '뉴스탭에서는 뉴스들을 보고 주식에 관해 판단할 수 있게 되어있어서 주식을 구매할지 판단할 때 도움이 될 수 있어. 조언탭으로 가볼까?', 
    illustration: '🐿️',
    onBeforeStep: () => onSelectTab('뉴스'),
    forceCenter: true
  },
  { 
    targetId: 'stock-detail-advice', 
    title: '#11 둘째 창 - 조언창', 
    description: '조언은 안정형, 공격형, 비관형 여러 전문가들이 이 주식에 관한 의견을 각자 다른 성향별로 올렸던 글이야. 의견을 듣고 판단해서 주식을 판매 또는 구매해보자!', 
    illustration: '🦉',
    onBeforeStep: () => onSelectTab('조언'),
    forceCenter: true
  },
  {
    targetId: 'center',
    title: '#12 안전한 첫 투자 전략 (1/3)',
    description: `이제 안전한 첫 투자를 위해 꼭 확인해야 할 것들을 알려줄게!

1단계 : 종목 선택☑️
- 뉴스에서 호재를 확인
- 차트가 상승세인지
- 여우 에이전트들의 의견 확인
- 업종 전체가 상승세인지

2단계: 투자 금액 결정💵
- 자산의 20% 이하로 투자하기
- 전재산 올인은 절대 금지! 🙅‍♂️`,
    subDescription: '❗이러한 방향성을 제시드리지만, 강제성을 띄지 않습니다.',
    illustration: '🐿️'
  },
  {
    targetId: 'center',
    title: '#13 안전한 첫 투자 전략 (2/3)',
    description: `3단계 : 매수/매도 실행💹

원하는 주식 클릭
1. [살게요] 버튼 클릭
2. 주가 금액 확인
3. 수량 입력
4. [입력] 클릭

천천히 따라 해보면 어렵지 않아!`,
    subDescription: '❗이러한 방향성을 제시드리지만, 강제성을 띄지 않습니다.',
    illustration: '🦉'
  },
  {
    targetId: 'center',
    title: '#14 안전한 첫 투자 전략 (3/3)',
    description: `4단계 : 이익/손해 목표 세우기🎯

주식할 때 익절과 손절이라는 단어를 많이 사용하는데, 익절이란 주식이 올라서 이익이 났을 때 파는거고 손절이란 주식이 내려서 손해가 났을 때 더 큰 손해 보기 전에 파는 걸 의미해.

익절 목표: 7~10% 상승 시 욕심내지 말고 팔기
손절 목표: -10% 하락 시 더 큰 손해 전에 과감히 팔기

핵심은 감정에 흔들리지 말고 본인이 정한 규칙을 지키는 거야!`,
    subDescription: '❗이러한 방향성을 제시드리지만, 강제성을 띄지 않습니다.',
    illustration: '🐿️'
  },
  {
    targetId: 'tour-bottom-status',
    title: '#15 주식현황',
    description: '여기까지 나의 설명이었어. 따라오느라 고생 많았어!\n이제 마지막 튜토리얼인 자산현황이야!',
    illustration: '🦉'
  }
];

const MarketTour: React.FC<MarketTourProps> = ({ onComplete, onNavigateDetail, onSelectTab }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const STEPS = MARKET_TOUR_STEPS(onNavigateDetail, onSelectTab);
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
      const element = document.getElementById(currentStep.targetId);
      if (currentStep.targetId === 'center' || element) {
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

  if (!isVisible) return null;

  const finishTour = () => {
    localStorage.setItem('market-tour-done', 'true');
    localStorage.removeItem('market-highlight-pending'); // Clear highlight

    // Status 탭 하이라이트 트리거 (완료 시에만)
    localStorage.setItem('status-highlight-pending', 'true'); 
    
    window.dispatchEvent(new Event('check-market-highlight')); // UI 업데이트
    window.dispatchEvent(new Event('check-status-highlight')); 
    
    onComplete();
  };

  const handleSkip = () => {
    // 스킵 시에도 완료 처리하여 다시 뜨지 않게 함
      localStorage.setItem('app-tour-done', 'true');
      localStorage.setItem('market-tour-done', 'true');
      localStorage.setItem('status-tour-done', 'true');
      localStorage.setItem('status-highlight-pending', 'true');
      window.dispatchEvent(new Event('check-status-highlight'));
      onComplete();
  };

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
      finishTour();
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
    const threshold = 220;
    const isTopHeavy = centerY < threshold;
    const isBottomHeavy = centerY > window.innerHeight - threshold;

    // For vertical elements, we decide whether to show above or below
    const isBottomHalf = targetRect.top > window.innerHeight / 2;
    
    // Improved vertical positioning with boundary clamping
    let top: string = 'auto';
    let bottom: string = 'auto';
    let transform: string = 'translateX(-50%)';

    if (isBottomHalf) {
      // Show ABOVE the target
      bottom = `${window.innerHeight - targetRect.top + 20}px`;
      // Clamp to top margin
      if (parseInt(bottom) > window.innerHeight - 60) {
        bottom = 'auto';
        top = '20px';
        transform = 'translateX(-50%)';
      }
    } else {
      // Show BELOW the target
      top = `${targetRect.bottom + 20}px`;
      // Clamp to bottom margin
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
              window.dispatchEvent(new Event('check-status-highlight'));
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
           MARKET TAB TOUR
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

        <div className="w-full flex space-x-3">
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
            onClick={currentStepIdx === STEPS.length - 1 ? finishTour : handleNext}
            className="flex-2 py-4 bg-[#004FFE] text-white rounded-full font-black text-[16px] shadow-lg shadow-[#004FFE]/20 active:scale-95 transition-all flex items-center justify-center group"
          >
            <span>{currentStepIdx === STEPS.length - 1 ? '시작하기' : '다음'}</span>
            <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketTour;
