import { StockData } from '../types';

const BASE_URL = "http://localhost:8000";

// --- 백엔드 명세서 기반 타입 정의 ---

// Lee 명세서 (기업 목록)
export interface Company {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  description: string;
  // [백엔드 팀]: 만약 등락폭/등락률 데이터가 있다면 여기에 추가해주세요.
  // change?: number;
  // changePercent?: number;
}

// Heo 명세서 (차트 데이터) + Lee 명세서 (단순 가격 데이터)
// Heo의 엔드포인트 구조 /stocks/{ticker}/chart를 사용하지만, 필요시 단순 가격 포인트에 맞춰 조정
export interface ChartDataPoint {
  time: string; // ISO string
  open: number;
  high: number;
  low: number;
  close: number;
  price?: number; // 폴백용
}

export interface OrderBookItem {
  price: number;
  volume: number;
  type: 'ask' | 'bid';
}

export interface OrderBook {
  ticker: string;
  current_price: number;
  asks: OrderBookItem[];
  bids: OrderBookItem[];
}

// Heo 명세서 (뉴스 목록)
export interface News {
  id: number;
  ticker: string;
  title: string;
  summary: string;
  sentiment: string;
  impact_score: number;
  published_at: string;
}


// --- API 함수 ---
// [주의]: 외부 더미 데이터를 사용하려면 아래 임포트의 주석을 해제하세요. (폴더 삭제 시 주석 처리 필요)
// import * as dummyLoader from '../data/external_dummy/loader';

// 1. 기업 목록 조회
// Lee 명세서 사용: GET /api/companies
export const fetchCompanies = async (): Promise<StockData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/companies`);
    if (!response.ok) {
      throw new Error(`[Backend API Error] ${response.status}: ${response.statusText}`);
    }
    const data: Company[] = await response.json();

    // 프론트엔드 StockData 타입으로 매핑
    return data.map((company, index) => ({
      id: index + 1, // index를 임시 ID로 사용
      name: company.name,
      price: company.current_price.toLocaleString(),
      // [백엔드 팀]: 등락폭/상승여부 로직은 실제 데이터가 필요합니다.
      change: "0", 
      isUp: true,
      symbol: company.ticker,
      badge: company.sector,
    }));
  } catch (error) {
    console.warn("백엔드 연결 실패:", error);
    return [];
  }
};


// 2. 주식 차트 조회
// Heo 명세서 사용: GET /stocks/{ticker}/chart
// 기간(period) 파라미터 지원
export const fetchStockChart = async (ticker: string, period: string = "1d"): Promise<ChartDataPoint[]> => {
  try {
    const response = await fetch(`${BASE_URL}/stocks/${ticker}/chart?period=${period}`);
    
    if (!response.ok) {
       console.warn(`Primary endpoint failed, trying fallback: /api/chart/${ticker}`);
       const fallbackResponse = await fetch(`${BASE_URL}/api/chart/${ticker}`);
       if (!fallbackResponse.ok) {
         throw new Error(`[Backend API Error] ${fallbackResponse.status}`);
       }
       return await fallbackResponse.json();
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`백엔드 차트 조회 실패(${ticker}):`, error);
    return [];
  }
};

// 3. 호가창 조회
// [백엔드 팀]: 실시간 호가 데이터를 반환하는 엔드포인트가 필요합니다.
// 예시: GET /stocks/{ticker}/orderbook
export const fetchOrderBook = async (ticker: string): Promise<OrderBook | null> => {
  try {
    const response = await fetch(`${BASE_URL}/stocks/${ticker}/orderbook`);
    if (!response.ok) {
      throw new Error(`[Backend API Error] ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch order book:", error);
    return null;
  }
};

// 4. 뉴스 목록 조회
// Heo 명세서 사용: GET /news
export const fetchNews = async (): Promise<News[]> => {
  try {
    const response = await fetch(`${BASE_URL}/news`);
    if (!response.ok) {
      throw new Error(`[Backend API Error] ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
};

