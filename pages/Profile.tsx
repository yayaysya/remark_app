import React, { useEffect, useState } from 'react';
import * as Storage from '../services/storage';
import { User, Habit } from '../types';
import { LogOut, Trash2 } from 'lucide-react';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(Storage.getCachedUser());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const [u, hs] = await Promise.all([
          Storage.fetchProfile(),
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

  const openEditProfile = () => {
    if (!user) return;
    setEditUsername(user.username || '');
    setEditNickname(user.nickname || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setEditError(null);
      setEditSaving(true);
      const updated = await Storage.updateProfile({
        username: editUsername,
        nickname: editNickname
      });
      setUser(updated);
      setIsEditOpen(false);
    } catch (err: any) {
      setEditError(err.message || '更新个人资料失败');
    } finally {
      setEditSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const updated = await Storage.uploadAvatar(file);
      setUser(updated);
    } catch (err: any) {
      alert(err.message || '上传头像失败');
    } finally {
      e.target.value = '';
    }
  };

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
              {user?.username && (
                <p className="text-gray-400 text-xs mt-1">用户名：{user.username}</p>
              )}
          </div>
          <div className="flex flex-col items-end gap-2 ml-auto">
            <label className="text-xs text-gray-400 cursor-pointer">
              <span className="underline">更换头像</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            <button
              type="button"
              onClick={openEditProfile}
              className="text-xs text-gray-600 underline"
            >
              编辑资料
            </button>
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

      {/* Edit profile modal */}
      {isEditOpen && user && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">编辑资料</h2>
            {editError && (
              <div className="mb-3 text-xs text-red-500">
                {editError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">用户名（用于搜索和展示）</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1">昵称</label>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold"
                disabled={editSaving}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 py-2 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-60"
                disabled={editSaving}
              >
                {editSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-300 mt-8">Simple Habit v2.0</p>
    </div>
  );
};

export default Profile;
