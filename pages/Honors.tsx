import React, { useEffect, useState } from 'react';
import { Lock, Award } from 'lucide-react';
import * as Storage from '../services/storage';
import * as Utils from '../utils';
import { Checkin } from '../types';

const BADGES = [
    { key: 'first_step', name: '第一步', desc: '完成你的第一次打卡', icon: '🌱', threshold: 1 },
    { key: '3_days', name: '起势', desc: '连续打卡 3 天', icon: '🔥', threshold: 3 },
    { key: '7_days', name: '势如破竹', desc: '连续打卡 7 天', icon: '🚀', threshold: 7 },
    { key: '21_days', name: '习惯养成', desc: '连续打卡 21 天', icon: '🧠', threshold: 21 },
    { key: 'early_bird', name: '早起鸟', desc: '早上 8 点前完成一次打卡', icon: '🌅', condition: (c: Checkin) => {
        const h = new Date(c.timestamp).getHours();
        return h >= 5 && h < 8;
    }},
    { key: 'night_owl', name: '夜猫子', desc: '晚上 10 点后完成一次打卡', icon: '🦉', condition: (c: Checkin) => {
        const h = new Date(c.timestamp).getHours();
        return h >= 22;
    }}
];

const Honors: React.FC = () => {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      const load = async () => {
        try {
          setError(null);
          setLoading(true);
          const cs = await Storage.fetchCheckins();
          setCheckins(cs);
        } catch (err: any) {
          setError(err.message || '加载荣誉数据失败');
        } finally {
          setLoading(false);
        }
      };
      load();
  }, []);

  // Calculate unlocked badges
  const unlockedBadges = new Set<string>();
  const totalCheckins = checkins.length;
  
  // Streak Logic for global? Let's do max streak across any habit
  const maxStreak = Utils.calculateMaxStreak(checkins);

  if (totalCheckins >= 1) unlockedBadges.add('first_step');
  if (maxStreak >= 3) unlockedBadges.add('3_days');
  if (maxStreak >= 7) unlockedBadges.add('7_days');
  if (maxStreak >= 21) unlockedBadges.add('21_days');
  
  // Special conditions
  if (checkins.some(c => {
      const h = new Date(c.timestamp).getHours();
      return h >= 5 && h < 8;
  })) unlockedBadges.add('early_bird');

   if (checkins.some(c => {
      const h = new Date(c.timestamp).getHours();
      return h >= 22;
  })) unlockedBadges.add('night_owl');


  if (loading && checkins.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 p-6 flex items-center justify-center">
        <p className="text-gray-500">正在加载荣誉...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-6">
       <h1 className="text-2xl font-bold mb-6">荣誉墙</h1>

       {error && (
         <div className="mb-4 text-sm text-red-500">
           {error}
         </div>
       )}
       
       <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
           <div className="flex items-center gap-4">
               <div className="p-3 bg-white/20 rounded-full">
                   <Award size={32} />
               </div>
               <div>
                   <h2 className="text-3xl font-black">{unlockedBadges.size} / {BADGES.length}</h2>
                   <p className="text-white/80 font-medium">已解锁徽章数</p>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
           {BADGES.map(badge => {
               const isUnlocked = unlockedBadges.has(badge.key);
               return (
                   <div 
                        key={badge.key}
                        className={`
                            relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border
                            ${isUnlocked ? 'bg-white border-transparent' : 'bg-gray-100 border-gray-200'}
                        `}
                   >
                       <div className={`text-4xl mb-3 ${isUnlocked ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                           {badge.icon}
                       </div>
                       <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                           {badge.name}
                       </h3>
                       <p className="text-[10px] text-gray-400 leading-tight px-2">
                           {badge.desc}
                       </p>
                       
                       {!isUnlocked && (
                           <div className="absolute top-3 right-3 text-gray-300">
                               <Lock size={14} />
                           </div>
                       )}
                   </div>
               )
           })}
       </div>
    </div>
  );
};

export default Honors;
