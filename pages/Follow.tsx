import React, { useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import * as Storage from '../services/storage';
import { User } from '../types';
import UserStatsOverlay from '../components/UserStatsOverlay';

const Follow: React.FC = () => {
  const [user, setUser] = useState<User | null>(Storage.getCachedUser());
  const [follows, setFollows] = useState<User[]>([]);
  const [followSearch, setFollowSearch] = useState('');
  const [followSearchResults, setFollowSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [statsUserId, setStatsUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const [profile, fs] = await Promise.all([
          Storage.fetchProfile(),
          Storage.getFollows()
        ]);
        setUser(profile);
        setFollows(fs as User[]);
      } catch (err: any) {
        setError(err.message || '加载关注信息失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFollowSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = followSearch.trim();
    if (!q) {
      setFollowSearchResults([]);
      return;
    }
    try {
      setFollowLoading(true);
      const results = await Storage.searchUsers(q);
      setFollowSearchResults(results as User[]);
    } catch (err: any) {
      alert(err.message || '搜索用户失败');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFollow = async (targetId: string) => {
    try {
      const follow = await Storage.followUser(targetId);
      setFollows((prev) => {
        if (prev.find((u) => u.id === follow.id)) return prev;
        return [...prev, follow as User];
      });
    } catch (err: any) {
      alert(err.message || '关注失败');
    }
  };

  const handleUnfollow = async (targetId: string) => {
    try {
      await Storage.unfollowUser(targetId);
      setFollows((prev) => prev.filter((u) => u.id !== targetId));
    } catch (err: any) {
      alert(err.message || '取消关注失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 p-6 flex items-center justify-center">
        <p className="text-gray-500">正在加载关注列表...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-6">
      <h1 className="text-2xl font-bold mb-4">关注</h1>

      {error && (
        <div className="mb-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {user && (
        <p className="text-xs text-gray-400 mb-4">
          当前身份：{user.nickname || user.username}（用户名：{user.username}）
        </p>
      )}

      {/* 搜索用户 */}
      <form onSubmit={handleFollowSearch} className="flex items-center gap-2 mb-4">
        <div className="flex items-center flex-1 bg-white rounded-full px-3 py-2 shadow-sm">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            type="text"
            value={followSearch}
            onChange={(e) => setFollowSearch(e.target.value)}
            placeholder="搜索用户名或手机号"
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2 rounded-full bg-black text-white text-xs font-bold disabled:opacity-60"
          disabled={followLoading}
        >
          {followLoading ? '搜索中' : '搜索'}
        </button>
      </form>

      {/* 搜索结果 */}
      {followSearchResults.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">搜索结果</p>
          <div className="space-y-2">
            {followSearchResults.map((u) => {
              const isFollowing = !!follows.find((f) => f.id === u.id);
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      {u.avatar && (
                        <img
                          src={u.avatar}
                          alt={u.nickname || u.username}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">
                        {u.nickname || u.username || '用户'}
                      </span>
                      {u.username && (
                        <span className="text-[11px] text-gray-400">@{u.username}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => (isFollowing ? handleUnfollow(u.id) : handleFollow(u.id))}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                      isFollowing ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'
                    }`}
                  >
                    <UserPlus size={14} />
                    {isFollowing ? '已关注' : '关注'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 已关注列表 */}
      <p className="text-xs text-gray-400 mb-2">已关注</p>
      <div className="space-y-2">
        {follows.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                {u.avatar && (
                  <img
                    src={u.avatar}
                    alt={u.nickname || u.username}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">
                  {u.nickname || u.username || '用户'}
                </span>
                {u.username && (
                  <span className="text-[11px] text-gray-400">@{u.username}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatsUserId(u.id)}
                className="text-xs text-blue-600 underline"
              >
                查看统计
              </button>
              <button
                type="button"
                onClick={() => handleUnfollow(u.id)}
                className="text-[11px] text-gray-400 underline"
              >
                取消关注
              </button>
            </div>
          </div>
        ))}
        {follows.length === 0 && (
          <p className="text-xs text-gray-400">
            暂未关注任何人，可以通过上方搜索开始关注。
          </p>
        )}
      </div>

      {statsUserId && (
        <UserStatsOverlay userId={statsUserId} onClose={() => setStatsUserId(null)} />
      )}
    </div>
  );
};

export default Follow;

