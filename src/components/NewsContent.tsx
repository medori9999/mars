
import React, { useState, useEffect } from 'react';
import { fetchNews } from '../api';
import { News } from '../services/api';
import { generalNewsList } from '../data/mockData';
import { ChevronDown } from 'lucide-react';

const NewsContent: React.FC = () => {
  const [allNews, setAllNews] = useState<News[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setIsLoading(true);
        const data = await fetchNews();
        if (data && data.length > 0) {
          // 백엔드 api.ts의 News 타입을 services/api의 News 타입으로 변환
          const mapped = data.map(n => ({
            id: n.id,
            ticker: n.ticker,
            title: n.title,
            summary: n.summary,
            sentiment: n.sentiment,
            impact_score: n.impact_score,
            published_at: n.published_at
          })) as News[];
          setAllNews(mapped);
        } else {
          // 폴백: 백엔드 데이터가 없을 경우 기존 모의 데이터 사용
          const fallbackData = generalNewsList.map(n => ({
            id: n.id,
            ticker: n.category,
            title: n.title,
            summary: n.summary,
            sentiment: 'neutral',
            impact_score: 0,
            published_at: '방금 전'
          })) as News[];
          setAllNews(fallbackData);
        }
      } catch (error) {
        console.error("News load failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadNews();
    // [백엔드 연동] 10초마다 뉴스 업데이트 폴링
    const interval = setInterval(loadNews, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const visibleNews = allNews.slice(0, visibleCount);
  const hasMore = allNews.length > visibleCount;

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col space-y-3 pt-5">
          {/* Header inside scroll container for consistent spacing */}
          <div className="flex justify-center mb-2">
            <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">NEWS</h2>
          </div>
          {visibleNews.map((news) => (
            <div 
              key={news.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50/50 hover:border-blue-200 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              <div className="flex flex-col space-y-1">
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-[#004FFE] transition-colors">• {news.ticker || '시장'}</span>
                <h3 className="text-base font-extrabold text-gray-800 leading-snug">{news.title}</h3>
                <p className="text-[12px] text-gray-500 font-medium opacity-80 pt-0.5 line-clamp-2">{news.summary}</p>
                <div className="flex justify-end pt-2">
                  <span className="text-[10px] text-gray-400 font-medium">— {news.published_at}</span>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <button 
              onClick={handleShowMore}
              className="w-full py-4 bg-white/50 hover:bg-white rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-white mt-2"
            >
              <ChevronDown size={14} />
              <span>더보기 ({allNews.length - visibleCount}개 남음)</span>
            </button>
          )}

          {isLoading && allNews.length === 0 && (
            <div className="py-20 text-center text-gray-400 font-bold text-sm">뉴스를 불러오는 중입니다...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsContent;
