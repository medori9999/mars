import { StockData } from '../types';

/**
 * [튜토리얼용 더미 데이터]
 * 이 파일은 시장 탭 튜토리얼에서 주식 상세 페이지를 보여주기 위해 제작되었습니다.
 * 프론트엔드 로직에 영향을 주지 않으므로 필요 없을 시 삭제하셔도 무방합니다.
 */

export const tutorialStockData: StockData = {
id: 999,
    name: "한화에어로스페이스x", // 재웅님 DB에 있는 종목명으로 바꾸셔도 됩니다
    symbol: "IT008",    // 실제 티커로 변경
    price: "23152원",
    change: "0.23%",
    isUp: true,
    sector: "IT",
    color: "bg-[#004FFE]",
    logoText: "I"
};