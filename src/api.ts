// src/api.ts — 백엔드 연동 통합 API 모듈
// 기존 services/api.ts와 병행 사용 (백엔드 팀의 최신 API 명세 반영)

const BASE_URL = import.meta.env.VITE_API_URL;

// ------------------------------------------------------------
// 1. 타입 정의 (프론트엔드에서 쓸 데이터 모양) - 기존 코드 유지
// ------------------------------------------------------------
export interface CompanyData {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  change_amount: number;
  change_rate: number;
  volume?: number; 
}

export interface ChartData {
  time: string;
  price: number;
}

export interface News {
  id: number;
  ticker: string;
  title: string;
  summary: string;
  sentiment: string;
  impact_score: number;
  published_at: string;
}

export interface NewsItem {
  id?: number;
  title: string;
  summary: string;
  impact_score: number;
  is_published?: number;
  created_at?: string;
}

export interface CommunityPost {
  id: number;
  author: string;
  content: string;
  sentiment: 'BULL' | 'BEAR';
  time: string;
}

export interface RankItem {
  agent_id: string;
  total_asset: number;
}

export interface MentorAdvice {
  opinion: string;
  core_logic: string;
  feedback_to_user: string;
  chat_message: string;
}

export interface MentorAdviceResponse {
  NEUTRAL?: MentorAdvice;
  VALUE?: MentorAdvice;
  MOMENTUM?: MentorAdvice;
  CONTRARIAN?: MentorAdvice;
  generated_at?: string;
  error?: string;
}

export interface UserStatusResponse {
  user_id: string;
  balance: number;
  portfolio: Record<string, number>;
  sim_time: string;
}

export interface SolutionItem {
  id: number;
  type: string;
  text: string;
  avatarSeed?: string;
  avatarType?: 'fox' | 'wolf' | 'owl';
  imageUrl?: string;
}

// ------------------------------------------------------------
// 2. API 호출 함수들 - 오류 수정 반영
// ------------------------------------------------------------

// ① 유저 초기화
export const initUser = async (username: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return await response.json();
  } catch (error) {
    console.error("User init failed:", error);
  }
};

// ② 실시간 유저 상태 조회 (🔥 한글 헤더 인코딩 적용)
export const fetchUserStatus = async (username: string): Promise<UserStatusResponse | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/status`, {
      headers: { 'X-User-ID': encodeURIComponent(`USER_${username}`) },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Fetch user status failed:", error);
    return null;
  }
};

// ③ 전광판 & 인기 종목용 기업 목록
export const fetchCompanies = async (): Promise<CompanyData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/companies`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return [];
  }
};

// ④ 차트 데이터
export const fetchChartData = async (ticker: string): Promise<ChartData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/chart/${ticker}?limit=3000`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch chart:", error);
    return [];
  }
};

// ⑤ 전체 뉴스 가져오기
export const fetchNews = async (): Promise<News[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/news`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch all news:", error);
    return [];
  }
};

// ⑥ 특정 종목 뉴스 가져오기
export const fetchCompanyNews = async (companyName: string): Promise<NewsItem[]> => {
  try {
    const encodedName = encodeURIComponent(companyName);
    const response = await fetch(`${BASE_URL}/api/news/${encodedName}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch company news:", error);
    return [];
  }
};

// ⑦ 커뮤니티(종토방) 글 가져오기
export const fetchCommunityPosts = async (ticker: string): Promise<CommunityPost[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/community/${ticker}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch community posts:", error);
    return [];
  }
};

// ⑧ 부자 랭킹 가져오기
export const fetchRank = async (): Promise<RankItem[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/rank`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch rank:", error);
    return [];
  }
};

// ⑨ 멘토 AI 조언 가져오기
export const fetchMentorAdvice = async (ticker: string): Promise<MentorAdviceResponse | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/advice/${ticker}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch mentor advice:", error);
    return null;
  }
};

// ⑩ 챗봇 자유 대화
export const fetchAgentChat = async (agentType: string, message: string): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_type: agentType, message: message }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Failed to fetch chat response:", error);
    return "통신 불안정";
  }
};

// ⑪ 메인 커뮤니티 글 조회
export const fetchGlobalCommunityPosts = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/community/global`);
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (error) {
    console.error("Global community fetch failed:", error);
    return [];
  }
};

// ⑫ 커뮤니티 글 작성
export const postCommunityMessage = async (author: string, content: string, ticker: string = 'GLOBAL') => {
  try {
    await fetch(`${BASE_URL}/api/community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content, ticker, sentiment: 'BULL' })
    });
  } catch (error) {
    console.error("Failed to post message:", error);
  }
};

// ⑬ 🔥 [추가] 유저 맞춤형 AI 솔루션 데이터 호출 (🔥 한글 헤더 인코딩 적용)
export const fetchUserSolution = async (username: string): Promise<SolutionItem[] | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/solution`, {
      headers: { 'X-User-ID': encodeURIComponent(`USER_${username}`) },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Fetch user solution failed:", error);
    return null;
  }
};