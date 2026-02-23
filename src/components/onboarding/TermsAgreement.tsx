import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronRight, ArrowLeft, X } from 'lucide-react';

interface TermsAgreementProps {
  onNext: () => void;
  onSkip: () => void;
}

const GUIDE_TERMS = `투자 가이드 서비스 이용약관 (필수)

시행일: 2025년 1월 1일 · 버전 v1.0

⚠️ 본 서비스는 가상 투자 교육 시뮬레이션입니다.
실제 금융 투자 조언이 아니며, 게임 내 정보로 실제 투자 시 발생하는 손실에 대해 회사는 책임을 지지 않습니다.

제1조 서비스 성격
본 서비스 '투자 가이드'는 가상 화폐를 사용한 투자 교육 시뮬레이션 게임입니다. 실제 금전 거래가 발생하지 않으며, 자본시장법상 금융투자업에 해당하지 않습니다.
서비스 내 모든 투자 활동은 가상 환경에서만 이루어지며, 실제 주식 시장의 결과를 보장하지 않습니다.

제2조 정보의 한계
게임 내 제공되는 금융 정보는 금융 전문가가 아닌 개발팀이 제작한 교육용 단순화 콘텐츠입니다. 실제 금융 시장은 게임보다 훨씬 복잡하며, 다음 사항을 반드시 숙지하세요.
- 게임 수익률은 실제 투자 성과를 예측하지 않습니다
- 게임에서 성공한 전략이 실제 시장에서 동일한 결과를 보장하지 않습니다
- 실제 투자 전에는 반드시 공인 금융 전문가와 상담하세요

제3조 실제 기업 정보
게임 내 등장하는 실제 기업 관련 정보는 교육 목적으로 단순화되었으며 최신 정보가 아닐 수 있습니다. 이는 특정 기업에 대한 투자를 권유하는 것이 아닙니다.
가상 기업과 실제 기업은 게임 내에서 명확히 구분 표시됩니다.

제4조 면책사항
다음의 경우에 대해 회사는 법적 책임을 지지 않습니다.
- 게임 정보를 근거로 실제 투자 후 발생한 손실
- 가상 투자 결과와 실제 시장 결과의 차이로 인한 손해
- 서비스 기술 오류로 인한 게임 내 가상 자산 손실
- 이용자 귀책으로 인한 계정 정보 유출 피해

제5조 이용 제한
만 14세 미만은 법정대리인의 동의가 필요합니다. 타인의 개인정보 도용, 서비스 정상 운영 방해, 핵·버그 악용 등의 행위는 이용이 제한됩니다.

제6조 약관 변경
약관 변경 시 시행 7일 전 앱 내 공지합니다. 이용자에게 불리한 변경은 30일 전 고지합니다. 변경된 약관에 동의하지 않을 경우 서비스 탈퇴를 요청할 수 있습니다.`;

const PRIVACY_TERMS = `개인정보 수집 및 이용 동의 (필수)

시행일: 2025년 1월 1일 · 개인정보 보호법 준거

필수 수집 항목
수집 항목   ㅣ   이메일 주소, 비밀번호(암호화 저장), 닉네임, 기기 고유 식별자(Device ID)
이용 목적   ㅣ   회원 식별, 서비스 제공, 고객 문의 처리 및 불량 이용자 제재
보유 기간   ㅣ   회원 탈퇴 후 30일 보관 후 완전 파기
제3자 제공 ㅣ   원칙적으로 외부 제공 없음. 법령상 요구 시에만 예외 적용

자동 수집 항목
수집 항목   ㅣ   게임 플레이 이력, 가상 투자 내역, 앱 접속 일시, 오류 로그
이용 목적   ㅣ   서비스 품질 개선, 오류 수정, 맞춤 콘텐츠 추천
보유 기간   ㅣ   수집 후 1년 보관 후 파기

개인정보 처리 위탁
서비스 운영을 위해 아래 업무를 외부 업체에 위탁할 수 있으며, 위탁 시 개인정보 보호 계약을 체결합니다.
- 클라우드 서버 운영 및 데이터 보관
- 앱 분석 (익명화 처리 후 활용)
- 고객 문의 응대

이용자의 권리
이용자는 언제든지 다음 권리를 행사할 수 있습니다.
- 개인정보 열람 · 정정 · 삭제 요청
- 개인정보 처리 정지 요청
- 동의 철회(회원 탈퇴)
앱 내 '내 계정 › 개인정보 관리' 또는 고객센터를 통해 10일 이내 처리됩니다.

파기 방법
전자적 파일은 복구 불가능한 방법으로 삭제합니다. 종이 출력물은 분쇄 또는 소각 처리합니다.

⚠️ 필수 항목 동의를 거부할 권리가 있으나, 거부 시 서비스 이용이 불가합니다.

📞 개인정보 침해 신고
· 개인정보침해신고센터: (국번없이) 118
· 개인정보분쟁조정위원회: 1833-6972`;

interface TermsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
}

const TermsPopup: React.FC<TermsPopupProps> = ({ isOpen, onClose, onConfirm, title, content }) => {
  const [canConfirm, setCanConfirm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCanConfirm(false);
      // Reset scroll position
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, title, content]);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // Check if scrolled to bottom with a small buffer (e.g., 10px)
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setCanConfirm(true);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-[90%] max-w-sm max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1 -mr-2 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
        >
          {content}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`w-full py-3.5 rounded-xl font-black text-white transition-all shadow-md ${
              canConfirm 
                ? 'bg-[#004FFE] active:scale-[0.98] hover:shadow-lg' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {canConfirm ? '확인했습니다' : '끝까지 읽어주세요'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TermsAgreement: React.FC<TermsAgreementProps> = ({ onNext, onSkip }) => {
  const [agreements, setAgreements] = useState({
    all: false,
    guide: false, // Essential
    privacy: false, // Essential
    marketing1: false, // Optional
  });

  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    type: 'guide' | 'privacy' | null;
  }>({ isOpen: false, type: null });

  const [isAutoSequencing, setIsAutoSequencing] = useState(false);

  const toggleAll = () => {
    const newValue = !agreements.all;
    if (newValue) {
      // "Select All" clicked -> Start sequence if essentials are missing
      if (!agreements.guide) {
        setIsAutoSequencing(true);
        setPopupState({ isOpen: true, type: 'guide' });
        return;
      }
      if (!agreements.privacy) {
        setIsAutoSequencing(true);
        setPopupState({ isOpen: true, type: 'privacy' });
        return;
      }
      
      // All essentials done, just check marketing
      setAgreements({
        all: true,
        guide: true,
        privacy: true,
        marketing1: true,
      });
    } else {
      // Uncheck all
      setIsAutoSequencing(false);
      setAgreements({
        all: false,
        guide: false,
        privacy: false,
        marketing1: false,
      });
    }
  };

  const activePopupContent = popupState.type === 'guide' 
    ? { title: '이용약관', content: GUIDE_TERMS, key: 'guide' as const }
    : { title: '개인정보 처리방침', content: PRIVACY_TERMS, key: 'privacy' as const };

  const handleConfirmPopup = () => {
    if (popupState.type) {
      const key = popupState.type;
      
      // Update agreement
      const newAgreements = { ...agreements, [key]: true };
      
      // Logic for Auto Sequencing (Select All)
      if (isAutoSequencing) {
        if (key === 'guide' && !newAgreements.privacy) {
          // Guide confirmed, but Privacy still needed -> Open Privacy
          setAgreements(newAgreements);
          // Small delay to make transition smoother or distinct
          setTimeout(() => {
             setPopupState({ isOpen: true, type: 'privacy' });
          }, 50);
          return; 
        }
        
        // If we are here, it means we finished the sequence (or privacy was already done)
        newAgreements.marketing1 = true;
        const allChecked = newAgreements.guide && newAgreements.privacy && newAgreements.marketing1;
        setAgreements({ ...newAgreements, all: allChecked });
        
        setIsAutoSequencing(false); // Reset sequence flag
        setPopupState({ isOpen: false, type: null });
      } else {
        // Normal single item check
        const allChecked = newAgreements.guide && newAgreements.privacy && newAgreements.marketing1;
        setAgreements({ ...newAgreements, all: allChecked });
        setPopupState({ isOpen: false, type: null });
      }
    }
  };

  const handleItemClick = (key: keyof typeof agreements) => {
    if (key === 'marketing1') {
      // Optional: Toggle directly
      const newVal = !agreements.marketing1;
      const newAgreements = { ...agreements, marketing1: newVal };
      const allChecked = newAgreements.guide && newAgreements.privacy && newAgreements.marketing1;
      setAgreements({ ...newAgreements, all: allChecked });
    } else if (key === 'guide' || key === 'privacy') {
      // Essential: Open popup if not checked (or even if checked, to review?)
      // Usually if checked, clicking unchecks it.
      if (agreements[key]) {
        // Allow unchecking directly? Yes.
        const newAgreements = { ...agreements, [key]: false, all: false };
        setAgreements(newAgreements);
      } else {
        // Open popup to check
        setPopupState({ isOpen: true, type: key as 'guide' | 'privacy' });
      }
    }
  };

  const openPopup = (type: 'guide' | 'privacy') => {
    setPopupState({ isOpen: true, type });
  };

  const canProceed = agreements.guide && agreements.privacy;

  return (
    <div className="flex flex-col h-full bg-white font-['Pretendard']">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-50">
        <ArrowLeft className="w-6 h-6 text-gray-400 opacity-0" />
        <h1 className="flex-1 text-center text-lg font-bold text-gray-800">이용약관 동의</h1>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Hero Section */}
        <div className="px-6 py-4">
          <div className="w-full bg-[#e1eaf5] rounded-[2.5rem] px-6 flex items-center relative overflow-hidden shadow-sm shadow-blue-100/20 border border-blue-50/50 h-[170px]">
            {/* Owl Image */}
            <div className="absolute left-[5px] bottom-[-25px] w-[180px] z-10 animate-in slide-in-from-left duration-700">
               <img src="/owl3.png" className="w-full h-auto object-contain" alt="Welcome Owl" />
            </div>
            
            {/* Text Message */}
            <div className="ml-auto w-[55%] relative z-20 flex flex-col justify-center py-4">
               <h2 className="text-[1.2rem] font-black text-gray-800 leading-[1.5] tracking-tight text-right pr-2">
                  서비스 이용을 위해<br />
                  <span className="text-[#004FFE]">약관에 동의</span>해주세요!
               </h2>
            </div>
          </div>
        </div>

        {/* Agreements List */}
        <div className="px-6 pb-8">
          <div className="w-full space-y-4">
            {/* Select All */}
            <div 
              onClick={toggleAll}
              className="flex items-center p-4 bg-[#F8FBF9] rounded-xl cursor-pointer border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${agreements.all ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-3 font-bold text-gray-800">전체 동의</span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Manual List for better control */}
              
              {/* Guide Terms */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center group cursor-pointer" onClick={() => handleItemClick('guide')}>
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${agreements.guide ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="ml-3 flex-1">
                    <span className="text-gray-800 font-medium">
                      투자 가이드 서비스 이용약관 <span className="text-primary/70">(필수)</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between ml-9">
                   <span className="text-xs text-gray-400">투자 가이드 이용약관</span>
                   <button 
                    onClick={(e) => { e.stopPropagation(); openPopup('guide'); }}
                    className="flex items-center text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors"
                   >
                      내용보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                   </button>
                </div>
              </div>

              {/* Privacy Terms */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center group cursor-pointer" onClick={() => handleItemClick('privacy')}>
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${agreements.privacy ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="ml-3 flex-1">
                    <span className="text-gray-800 font-medium">
                      개인정보 수집 및 이용 동의 <span className="text-primary/70">(필수)</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between ml-9">
                   <span className="text-xs text-gray-400">개인정보 수집 및 이용</span>
                   <button 
                    onClick={(e) => { e.stopPropagation(); openPopup('privacy'); }}
                    className="flex items-center text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors"
                   >
                      내용보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                   </button>
                </div>
              </div>

              {/* Marketing Terms (Optional) */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center group cursor-pointer" onClick={() => handleItemClick('marketing1')}>
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${agreements.marketing1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="ml-3 flex-1">
                    <span className="text-gray-800 font-medium">
                      광고성 정보 수신 동의 <span className="text-gray-400">(선택)</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between ml-9">
                   <span className="text-xs text-gray-400">맞춤 혜택 및 이벤트 정보 수신</span>
                   <button className="flex items-center text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors">
                      내용보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                   </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto px-6 pb-8">
        <p className="text-center text-[10px] text-gray-400 mb-6">
          미동의 시 서비스 이용이 제한될 수 있습니다.
        </p>
        <button 
          onClick={() => canProceed && onNext()}
          disabled={!canProceed}
          className={`w-full py-4 rounded-full text-lg font-bold transition-all shadow-lg ${
            canProceed 
            ? 'bg-[#004FFE] text-white active:scale-[0.98]' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          동의하고 시작하기
        </button>
      </div>

      <TermsPopup 
        isOpen={popupState.isOpen}
        onClose={() => setPopupState({ isOpen: false, type: null })}
        onConfirm={handleConfirmPopup}
        title={activePopupContent.title}
        content={activePopupContent.content}
      />
    </div>
  );
};

export default TermsAgreement;
