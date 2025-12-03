import React, { useState, useEffect } from 'react';
import { Habit, Checkin, THEME_COLORS, CheckinType } from '../types';
import * as Storage from '../services/storage';
import * as Utils from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Simple Calendar Heatmap Component
const CalendarHeatmap = ({ habit, checkins, onDateClick }: { habit: Habit, checkins: Checkin[], onDateClick: (date: string, status: string) => void }) => {
    const today = new Date();
    // Generate last 28 days for mobile view
    const days = [];
    for(let i=27; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    return (
        <div className="grid grid-cols-7 gap-2">
            {['S','M','T','W','T','F','S'].map((d,i) => (
                <div key={i} className="text-center text-xs text-gray-400 font-bold mb-2">{d}</div>
            ))}
            {days.map(dateStr => {
                const checkin = checkins.find(c => c.date === dateStr);
                const isToday = dateStr === Utils.getTodayDate();
                let bgClass = 'bg-gray-200';
                let status = 'missed';
                
                if (checkin) {
                    bgClass = checkin.type === CheckinType.RETROACTIVE ? 'bg-yellow-400' : THEME_COLORS[habit.themeColor];
                    status = 'checked';
                } else if (new Date(dateStr) > today) {
                    bgClass = 'bg-transparent';
                    status = 'future';
                }

                return (
                    <div 
                        key={dateStr}
                        onClick={() => onDateClick(dateStr, status)}
                        className={`
                            aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-transform active:scale-90
                            ${bgClass} ${checkin ? 'text-white' : 'text-gray-500'}
                            ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}
                        `}
                    >
                        {parseInt(dateStr.split('-')[2])}
                    </div>
                );
            })}
        </div>
    )
}

const Stats: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('ALL');
  const [user, setUser] = useState(Storage.getCachedUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const [u, hs, cs] = await Promise.all([
          Storage.fetchCurrentUser(),
          Storage.fetchHabits(),
          Storage.fetchCheckins()
        ]);
        setUser(u);
        setHabits(hs);
        setCheckins(cs);
      } catch (err: any) {
        setError(err.message || '加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCheckins = selectedHabitId === 'ALL' 
    ? checkins 
    : checkins.filter(c => c.habitId === selectedHabitId);

  const stats = {
      total: filteredCheckins.length,
      currentStreak: selectedHabitId !== 'ALL' ? Utils.calculateStreak(filteredCheckins, Utils.getTodayDate()) : '-',
      maxStreak: Utils.calculateMaxStreak(filteredCheckins)
  };

  const handleDateClick = (date: string, status: string) => {
      if (selectedHabitId === 'ALL') return;
      if (status === 'missed' && new Date(date) < new Date()) {
          // Retroactive Logic
          if(window.confirm(`你在 ${date} 漏打卡。是否使用 1 张休息日券补签？（剩余：${user?.voucherCount}）`)) {
              Storage.spendVoucher(selectedHabitId, date)
                .then(({ user: updatedUser }) => {
                  alert('已使用休息日券，连续天数已修复。');
                  setUser(updatedUser);
                  return Storage.fetchCheckins();
                })
                .then(setCheckins)
                .catch((err: any) => {
                  alert(err.message || '使用休息日券失败');
                });
          }
      }
  };

  if (loading && checkins.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 p-6 flex items-center justify-center">
        <p className="text-gray-500">正在加载统计数据...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-6">
      <h1 className="text-2xl font-bold mb-6">统计</h1>

      {error && (
        <div className="mb-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="flex overflow-x-auto gap-3 pb-4 mb-2 no-scrollbar">
          <button 
             onClick={() => setSelectedHabitId('ALL')}
             className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedHabitId === 'ALL' ? 'bg-black text-white' : 'bg-white text-gray-600'}`}
          >
              全部习惯
          </button>
          {habits.map(h => (
              <button 
                key={h.id}
                onClick={() => setSelectedHabitId(h.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${selectedHabitId === h.id ? THEME_COLORS[h.themeColor] + ' text-white' : 'bg-white text-gray-600'}`}
              >
                  <span>{h.icon}</span>
                  {h.title}
              </button>
          ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center">
              <span className="text-gray-400 text-xs font-bold uppercase">当前</span>
              <span className="text-2xl font-black mt-1">{stats.currentStreak}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center">
              <span className="text-gray-400 text-xs font-bold uppercase">总数</span>
              <span className="text-2xl font-black mt-1">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center">
              <span className="text-gray-400 text-xs font-bold uppercase">最佳</span>
              <span className="text-2xl font-black mt-1">{stats.maxStreak}</span>
          </div>
      </div>

      {/* Heatmap (Only show if specific habit selected) */}
      {selectedHabitId !== 'ALL' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">月度视图</h3>
                <span className="text-xs text-gray-400">点击漏打日期可使用休息日券</span>
              </div>
              <CalendarHeatmap 
                habit={habits.find(h => h.id === selectedHabitId)!} 
                checkins={filteredCheckins} 
                onDateClick={handleDateClick}
              />
          </div>
      )}

      {/* Timeline / History Log */}
      <h3 className="font-bold text-gray-800 mb-4">历史记录</h3>
      <div className="space-y-3">
          {filteredCheckins.sort((a,b) => b.timestamp - a.timestamp).slice(0, 10).map(c => {
              const habit = habits.find(h => h.id === c.habitId);
              return (
                  <div key={c.id} className="bg-white p-4 rounded-xl flex items-center gap-4 shadow-sm">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${habit ? THEME_COLORS[habit.themeColor] : 'bg-gray-200'} text-white`}>
                          {habit?.icon}
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between">
                              <span className="font-bold text-gray-800">{habit?.title}</span>
                              <span className="text-xs text-gray-400">{Utils.formatDate(c.date)}</span>
                          </div>
                          {c.type === CheckinType.RETROACTIVE && (
                               <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mr-2">已使用休息日券</span>
                          )}
                          {c.note && <p className="text-sm text-gray-500 mt-1">"{c.note}"</p>}
                      </div>
                  </div>
              )
          })}
          {filteredCheckins.length === 0 && (
              <div className="text-center text-gray-400 py-8">暂无记录</div>
          )}
      </div>
    </div>
  );
};

export default Stats;
