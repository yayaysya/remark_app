import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Habit, Checkin, THEME_COLORS, THEME_TEXT_COLORS, HabitTheme, CheckinType } from '../types';
import * as Storage from '../services/storage';
import * as Utils from '../utils';
import Confetti from '../components/Confetti';

const Home: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [currentHabitIndex, setCurrentHabitIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New Habit Form State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🌟');
  const [newHabitColor, setNewHabitColor] = useState<HabitTheme>(HabitTheme.ORANGE);

  // Vouchers
  const [user, setUser] = useState(Storage.getCachedUser());

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
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentHabit = habits[currentHabitIndex];
  const today = Utils.getTodayDate();
  
  const isCheckedIn = currentHabit && checkins.some(c => c.habitId === currentHabit.id && c.date === today);
  const streak = currentHabit ? Utils.calculateStreak(checkins.filter(c => c.habitId === currentHabit.id), today) : 0;

  const handleCheckin = async () => {
    if (!currentHabit) return;
    if (loading) return;

    // Vibrate
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      setLoading(true);
      const { checkin, user: updatedUser } = await Storage.addCheckin(currentHabit.id, today);
      setCheckins([...checkins, checkin]);

      if (updatedUser && updatedUser.voucherCount > (user?.voucherCount || 0)) {
        alert(`🎉 你获得了一张休息日券！（当前共：${updatedUser.voucherCount}）`);
      }
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (err: any) {
      alert(err.message || '打卡失败');
    } finally {
      setLoading(false);
    }

    // Trigger Effects
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleUndo = async () => {
    if (!currentHabit) return;
    if (!confirm('确定撤销今天的打卡吗？')) return;

    try {
      setLoading(true);
      await Storage.removeCheckin(currentHabit.id, today);
      setCheckins(checkins.filter(c => !(c.habitId === currentHabit.id && c.date === today)));
    } catch (err: any) {
      alert(err.message || '撤销打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = () => {
    // In a real app, update the checkin. Here we just close the UI mock.
    setShowNoteInput(false);
    setNoteText('');
  };

  const handleCreateHabit = async () => {
    if (!newHabitTitle) return;
    try {
      setLoading(true);
      const newHabit = await Storage.createHabit({
        title: newHabitTitle,
        icon: newHabitIcon,
        themeColor: newHabitColor
      });
      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      setIsNewHabitModalOpen(false);
      setNewHabitTitle('');
      setCurrentHabitIndex(updatedHabits.length - 1);
    } catch (err: any) {
      alert(err.message || '创建习惯失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading && habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <p className="text-gray-500 mb-2">加载中...</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  if (habits.length === 0 && !isNewHabitModalOpen) {
      // Empty state
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-white">
              <h2 className="text-xl font-bold mb-4">还没有任何习惯</h2>
              <button 
                onClick={() => setIsNewHabitModalOpen(true)}
                className="px-6 py-3 bg-black text-white rounded-full font-bold shadow-lg"
              >
                  创建第一个习惯
              </button>
              {/* Render modal if triggered */}
               {isNewHabitModalOpen && renderNewHabitModal()}
          </div>
      )
  }

  function renderNewHabitModal() {
      return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-4">新增习惯</h3>
                <input 
                    type="text" 
                    placeholder="习惯名称（例如：阅读 30 分钟）"
                    className="w-full border-b-2 border-gray-200 py-2 text-lg focus:outline-none focus:border-black mb-6"
                    value={newHabitTitle}
                    onChange={e => setNewHabitTitle(e.target.value)}
                />
                
                <div className="mb-6">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">主题颜色</label>
                    <div className="flex gap-3">
                        {Object.values(HabitTheme).map(c => (
                            <button 
                                key={c}
                                onClick={() => setNewHabitColor(c)}
                                className={`w-8 h-8 rounded-full ${THEME_COLORS[c]} ${newHabitColor === c ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">图标</label>
                    <div className="flex gap-2">
                        {['🏃', '📚', '💧', '🧘', '💰', '🎹'].map(icon => (
                            <button 
                                key={icon} 
                                onClick={() => setNewHabitIcon(icon)}
                                className={`w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg text-xl ${newHabitIcon === icon ? 'bg-gray-300' : ''}`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsNewHabitModalOpen(false)}
                        className="flex-1 py-3 font-medium text-gray-500"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleCreateHabit}
                        className="flex-1 py-3 bg-black text-white rounded-xl font-bold"
                    >
                        创建
                    </button>
                </div>
            </div>
        </div>
      );
  }

  const themeColorBg = currentHabit ? THEME_COLORS[currentHabit.themeColor] : 'bg-gray-500';
  const themeColorText = currentHabit ? THEME_TEXT_COLORS[currentHabit.themeColor] : 'text-gray-500';

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 pb-20 relative overflow-hidden">
      <Confetti isActive={showConfetti} />
      
      {/* Header */}
      <header className="flex justify-between items-center px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
            <span className="text-sm">🎫</span>
            <span className="text-sm font-bold text-gray-700">× {user?.voucherCount || 0}</span>
        </div>
        <button onClick={() => setIsNewHabitModalOpen(true)} className="p-2 bg-white rounded-full shadow-sm">
            <Plus size={24} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
        
        {/* Habit Switcher (Simple Dots for MVP instead of heavy drag logic) */}
        <div className="w-full h-[60vh] flex flex-col items-center justify-center relative">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentHabit?.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center"
                >
                    <h1 className="text-3xl font-black text-gray-800 mb-2">{currentHabit?.icon} {currentHabit?.title}</h1>
                    <p className={`text-lg font-medium mb-12 ${themeColorText}`}>
                       连续打卡：{streak} 天
                    </p>

                    {/* Main Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={isCheckedIn ? undefined : handleCheckin}
                        className={`
                            relative w-64 h-64 rounded-full flex items-center justify-center shadow-2xl
                            ${isCheckedIn ? 'bg-gray-100 cursor-default' : themeColorBg}
                            transition-colors duration-500
                        `}
                    >
                        {!isCheckedIn && (
                            <motion.div 
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`absolute inset-0 rounded-full opacity-30 ${themeColorBg}`} 
                            />
                        )}
                        
                        <div className="flex flex-col items-center z-10">
                            {isCheckedIn ? (
                                <>
                                    <Check size={64} className={themeColorText} />
                                    <span className={`text-xl font-bold mt-2 ${themeColorText}`}>已完成</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-6xl text-white font-black">D-{streak}</span>
                                    <span className="text-white/80 text-sm font-medium mt-2">点击打卡</span>
                                </>
                            )}
                        </div>
                    </motion.button>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Undo & Note Actions */}
        {isCheckedIn && (
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-6 mt-8"
             >
                 <button onClick={handleUndo} className="flex flex-col items-center text-gray-400">
                    <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center mb-1">
                       <RotateCcw size={18} />
                    </div>
                     <span className="text-xs">撤销</span>
                 </button>
                 <button onClick={() => setShowNoteInput(true)} className="flex flex-col items-center text-gray-400">
                     <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center mb-1">
                        <span className="text-lg">📝</span>
                     </div>
                     <span className="text-xs">备注</span>
                 </button>
             </motion.div>
        )}

        {/* Note Input Overlay */}
        {showNoteInput && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6">
                <textarea 
                    autoFocus
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="今天感觉如何？..."
                    className="w-full h-32 p-4 border rounded-xl shadow-sm focus:ring-2 ring-black outline-none resize-none bg-white"
                />
                <button onClick={handleSaveNote} className="mt-4 px-8 py-2 bg-black text-white rounded-full font-bold">
                    保存备注
                </button>
            </div>
        )}

        {/* Pagination Dots */}
        <div className="absolute bottom-4 flex gap-2">
            {habits.map((_, idx) => (
                <button 
                    key={idx}
                    onClick={() => setCurrentHabitIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentHabitIndex ? 'bg-black w-4' : 'bg-gray-300'}`}
                />
            ))}
        </div>
      </div>

      {isNewHabitModalOpen && renderNewHabitModal()}
    </div>
  );
};

export default Home;
