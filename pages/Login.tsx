import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Storage from '../services/storage';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length <= 5) return;
    try {
      setError(null);
      setLoading(true);
      await Storage.requestLoginCode(phone);
      setStep(2);
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    try {
      setError(null);
      setLoading(true);
      await Storage.loginUser(phone, otp);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
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

        {error && (
          <div className="mb-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {step === 1 ? (
            <form onSubmit={handleSendCode}>
                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">手机号</label>
                <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border-b-2 border-gray-200 py-3 text-2xl font-bold mb-8 focus:outline-none focus:border-black placeholder-gray-300"
                    placeholder="123 456 7890"
                    autoFocus
                />
                <button 
                    type="submit"
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
                    disabled={loading}
                >
                    {loading ? '发送中...' : '获取验证码'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleLogin}>
                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">验证码</label>
                <input 
                    type="number" 
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full border-b-2 border-gray-200 py-3 text-2xl font-bold mb-8 focus:outline-none focus:border-black tracking-widest"
                    placeholder="1234"
                    autoFocus
                />
                <div className="flex gap-4">
                    <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-lg"
                    >
                        返回
                    </button>
                    <button 
                        type="submit"
                        className="flex-[2] bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? '登录中...' : '开始使用'}
                    </button>
                </div>
            </form>
        )}
    </div>
  );
};

export default Login;
