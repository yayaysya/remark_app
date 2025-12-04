import React, { useEffect, useState } from 'react';
import * as Storage from '../services/storage';
import { Habit, Checkin, THEME_COLORS, CheckinType, User } from '../types';
import * as Utils from '../utils';

interface Props {
  userId: string;
  onClose: () => void;
}

// 简化版本的日历热力图，仅用于只读展示他人打卡情况
const CalendarHeatmap: React.FC<{ habit: Habit; checkins: Checkin[] }> = ({
  habit,
  checkins,
}) => {
  const today = new Date();
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
        <div key={i} className="text-center text-xs text-gray-400 font-bold mb-2">
          {d}
        </div>
      ))}
      {days.map((dateStr) => {
        const checkin = checkins.find((c) => c.date === dateStr);
        const isToday = dateStr === Utils.getTodayDate();
        let bgClass = 'bg-gray-200';

        if (checkin) {
          bgClass =
            checkin.type === CheckinType.RETROACTIVE
              ? 'bg-yellow-400'
              : THEME_COLORS[habit.themeColor];
        } else if (new Date(dateStr) > today) {
          bgClass = 'bg-transparent';
        }

        return (
          <div
            key={dateStr}
            className={`
              aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium
              ${bgClass} ${checkin ? 'text-white' : 'text-gray-500'}
              ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}
            `}
          >
            {parseInt(dateStr.split('-')[2])}
          </div>
        );
      })}
    </div>
  );
};

const UserStatsOverlay: React.FC<Props> = ({ userId, onClose }) => {
  const [target, setTarget] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const [profile, hs, cs] = await Promise.all([
          Storage.fetchUserProfileById(userId),
          Storage.fetchUserHabits(userId),
          Storage.fetchUserCheckins(userId),
        ]);
        setTarget(profile);
        setHabits(hs);
        setCheckins(cs);
      } catch (err: any) {
        setError(err.message || '加载用户统计失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const filteredCheckins =
    selectedHabitId === 'ALL'
      ? checkins
      : checkins.filter((c) => c.habitId === selectedHabitId);

  const stats = {
    total: filteredCheckins.length,
    currentStreak:
      selectedHabitId !== 'ALL'
        ? Utils.calculateStreak(filteredCheckins, Utils.getTodayDate())
        : '-',
    maxStreak: Utils.calculateMaxStreak(filteredCheckins),
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center px-4">
      <div className="bg-gray-50 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">他人统计</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            关闭
          </button>
        </div>

        {loading && (
          <div className="p-6 text-center text-gray-500 text-sm">
            正在加载他人统计...
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && target && (
          <div className="p-5">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {target.avatar && (
                  <img
                    src={target.avatar}
                    alt={target.nickname || target.username}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-800">
                  {target.nickname || target.username || '用户'}
                </span>
                {target.username && (
                  <span className="text-xs text-gray-400">@{target.username}</span>
                )}
              </div>
            </div>

            {/* Filter */}
            <div className="flex overflow-x-auto gap-3 pb-4 mb-2 no-scrollbar">
              <button
                onClick={() => setSelectedHabitId('ALL')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedHabitId === 'ALL'
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600'
                }`}
              >
                全部习惯
              </button>
              {habits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHabitId(h.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedHabitId === h.id
                      ? THEME_COLORS[h.themeColor] + ' text-white'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  <span>{h.icon}</span>
                  {h.title}
                </button>
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase">
                  当前
                </span>
                <span className="text-xl font-black mt-1">
                  {stats.currentStreak}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase">
                  总数
                </span>
                <span className="text-xl font-black mt-1">{stats.total}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase">
                  最佳
                </span>
                <span className="text-xl font-black mt-1">{stats.maxStreak}</span>
              </div>
            </div>

            {/* Heatmap for a specific habit */}
            {selectedHabitId !== 'ALL' && (
              <div className="bg-white p-4 rounded-3xl shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-sm">月度视图</h3>
                  <span className="text-[10px] text-gray-400">
                    仅用于查看，对方打卡数据默认公开
                  </span>
                </div>
                <CalendarHeatmap
                  habit={habits.find((h) => h.id === selectedHabitId)!}
                  checkins={filteredCheckins}
                />
              </div>
            )}

            {/* History */}
            <h3 className="font-bold text-gray-800 mb-3 text-sm">历史记录</h3>
            <div className="space-y-3">
              {filteredCheckins
                .slice()
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((c) => {
                  const habit = habits.find((h) => h.id === c.habitId);
                  return (
                    <div
                      key={c.id}
                      className="bg-white p-3 rounded-xl flex items-center gap-3 shadow-sm"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          habit ? THEME_COLORS[habit.themeColor] : 'bg-gray-200'
                        } text-white`}
                      >
                        {habit?.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-gray-800">
                            {habit?.title}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {Utils.formatDate(c.date)}
                          </span>
                        </div>
                        {c.type === CheckinType.RETROACTIVE && (
                          <span className="text-[9px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mr-2">
                            已使用休息日券
                          </span>
                        )}
                        {c.note && (
                          <p className="text-xs text-gray-500 mt-1">"{c.note}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              {filteredCheckins.length === 0 && (
                <div className="text-center text-gray-400 py-6 text-xs">
                  暂无记录
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStatsOverlay;

