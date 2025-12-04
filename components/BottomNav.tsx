import React from 'react';
import { Home, BarChart2, Award, User, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'home', icon: Home, label: '习惯', path: '/' },
    { id: 'stats', icon: BarChart2, label: '统计', path: '/stats' },
    { id: 'follow', icon: UserPlus, label: '关注', path: '/follow' },
    { id: 'honors', icon: Award, label: '荣誉', path: '/honors' },
    { id: 'profile', icon: User, label: '我的', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 max-w-[480px] mx-auto pb-safe">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-black' : 'text-gray-400'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
