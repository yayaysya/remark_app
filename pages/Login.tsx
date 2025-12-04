import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Storage from '../services/storage';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('邮箱和密码均为必填项');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      if (mode === 'login') {
        await Storage.loginUser(email, password);
      } else {
        await Storage.registerUser(email, password, nickname || undefined);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || (mode === 'login' ? '登录失败' : '注册失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-2">简单习惯</h1>
        <p className="text-gray-400 text-lg">每天一点点，习惯慢慢变。</p>
      </div>

      <div className="flex mb-6 bg-gray-100 rounded-full p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 text-sm font-bold rounded-full transition-colors ${
            mode === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-400'
          }`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 text-sm font-bold rounded-full transition-colors ${
            mode === 'register' ? 'bg-white text-black shadow-sm' : 'text-gray-400'
          }`}
        >
          注册
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-b-2 border-gray-200 py-3 text-lg font-bold mb-6 focus:outline-none focus:border-black placeholder-gray-300"
          placeholder="you@example.com"
          autoFocus
        />

        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">
          密码
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-b-2 border-gray-200 py-3 text-lg font-bold mb-6 focus:outline-none focus:border-black placeholder-gray-300"
          placeholder="至少 6 位密码"
        />

        {mode === 'register' && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-500 uppercase mb-2">
              昵称（可选）
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border-b-2 border-gray-200 py-2 text-lg focus:outline-none focus:border-black placeholder-gray-300"
              placeholder="展示名称，如：习惯达人"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
          disabled={loading}
        >
          {loading
            ? mode === 'login'
              ? '登录中...'
              : '注册中...'
            : mode === 'login'
            ? '登录'
            : '注册并开始'}
        </button>
      </form>
    </div>
  );
};

export default Login;

