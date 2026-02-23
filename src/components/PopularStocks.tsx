
import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { popularStocks } from '../data/mockData';
import { fetchCompanies, CompanyData } from '../api';

const PopularStocks: React.FC = () => {
  const [stocks, setStocks] = useState(popularStocks);

  // [백엔드 연동] 인기 종목 실시간 로딩 (5초 폴링)
  useEffect(() => {
    const loadPopular = async () => {
      try {
        const data = await fetchCompanies();
        if (data && data.length > 0) {
          // 거래량 순 정렬 후 상위 7개
          const sorted = [...data]
            .sort((a, b) => (b.volume || 0) - (a.volume || 0))
            .slice(0, 7);
          const mapped = sorted.map((c, i) => {
            const priceStr = typeof c.current_price === 'number' ? c.current_price.toLocaleString() + '원' : '0원';
            const changeRate = typeof c.change_rate === 'number' ? c.change_rate : 0;
            const changeStr = (changeRate >= 0 ? '+' : '') + changeRate.toFixed(2) + '%';
            return {
              rank: i + 1,
              name: c.name,
              price: priceStr,
              change: changeStr,
              isUp: changeRate >= 0,
            };
          });
          setStocks(mapped);
        }
      } catch (e) {
        // 백엔드 실패 시 mock 유지
      }
    };

    loadPopular();
    const interval = setInterval(loadPopular, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col space-y-3 pt-5">
          <div className="text-center mb-2 px-5">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-800">실시간 인기 종목</h2>
            <p className="text-[11px] text-gray-500 font-medium mt-1.5 opacity-80">지금 사람들이 가장 많이 보고 있는 종목</p>
          </div>
          {stocks.map((stock) => {
            let badgeClass = "bg-gray-100 text-gray-400";
            if (stock.rank === 1) {
              badgeClass = "text-white shadow-[0_4px_10px_rgba(251,191,36,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#FCD34D] via-[#FBBF24] to-[#B45309]";
            } else if (stock.rank === 2) {
              badgeClass = "text-white shadow-[0_4px_10px_rgba(192,192,192,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E5E7EB] via-[#C0C0C0] to-[#6B7280]";
            } else if (stock.rank === 3) {
              badgeClass = "text-white shadow-[0_4px_10px_rgba(205,127,50,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E8AC73] via-[#CD7F32] to-[#78350F]";
            }

            return (
              <div 
                key={stock.rank}
                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-blue-50/50 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-b-2 border-black/5 ${badgeClass}`}>
                    {stock.rank}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{stock.name}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{stock.price}</p>
                  </div>
                </div>
                <div className={`font-bold text-sm ${stock.isUp ? 'text-[#E53935]' : 'text-[#1E88E5]'}`}>
                  {stock.change}
                </div>
              </div>
            );
          })}
          <button className="mt-1 w-full py-4 bg-white/70 hover:bg-white transition-all rounded-2xl flex items-center justify-center space-x-1 text-[#004FFE] font-bold text-sm shadow-sm border border-white">
            <span>전체 순위 보기</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopularStocks;
