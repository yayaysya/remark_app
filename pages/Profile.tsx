import React, { useEffect, useState } from 'react';
import * as Storage from '../services/storage';
import { User, Habit } from '../types';
import { LogOut, Trash2 } from 'lucide-react';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(Storage.getCachedUser());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const [u, hs] = await Promise.all([
          Storage.fetchCurrentUser(),
          Storage.fetchHabits()
        ]);
        setUser(u);
        setHabits(hs);
      } catch (err: any) {
        setError(err.message || '加载个人信息失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    Storage.logoutUser();
    // App.tsx listens to the auth event and will redirect to login automatically
  };

  const handleDeleteHabit = (id: string) => {
      if (!confirm('确定要删除这个习惯吗？所有相关打卡记录都会被删除。')) {
        return;
      }
      Storage.deleteHabit(id)
        .then(() => Storage.fetchHabits())
        .then(setHabits)
        .catch((err: any) => {
          alert(err.message || '删除习惯失败');
        });
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 p-6 flex items-center justify-center">
        <p className="text-gray-500">正在加载个人信息...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-6">
      <h1 className="text-2xl font-bold mb-8">我的</h1>

      {error && (
        <div className="mb-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* User Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
             {user?.avatar && <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />}
          </div>
          <div>
              <h2 className="text-xl font-bold">{user?.nickname || 'Habit Hero'}</h2>
              <p className="text-gray-400 text-sm">{user?.phone || '未绑定手机号'}</p>
          </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <span className="font-bold">可用休息日券</span>
             <span className="bg-black text-white px-3 py-1 rounded-full text-sm font-bold">{user?.voucherCount}</span>
          </div>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <span className="font-bold">总打卡次数</span>
             <span className="text-gray-500 font-medium">{user?.totalCheckins}</span>
          </div>
      </div>

      <h3 className="font-bold text-gray-800 mb-4 ml-2">管理习惯</h3>
      <div className="space-y-3 mb-10">
          {habits.map(h => (
              <div key={h.id} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                      <span className="text-2xl">{h.icon}</span>
                      <span className="font-medium text-gray-700">{h.title}</span>
                  </div>
                  <button onClick={() => handleDeleteHabit(h.id)} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 size={18} />
                  </button>
              </div>
          ))}
          {habits.length === 0 && <p className="text-center text-gray-400 text-sm">尚未创建任何习惯</p>}
      </div>

      <button 
        onClick={handleLogout}
        className="w-full py-4 rounded-xl bg-gray-200 text-gray-600 font-bold flex items-center justify-center gap-2"
      >
          <LogOut size={20} />
          退出登录
      </button>
      
      <p className="text-center text-xs text-gray-300 mt-8">Simple Habit v2.0</p>
    </div>
  );
};

export default Profile;
