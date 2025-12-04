import { getTodayDate } from './utils';

interface ShareImageData {
  nickname: string;
  habitTitle: string;
  habitIcon: string;
  streak: number;
  date?: string;
}

// 生成打卡分享图片，返回 PNG dataURL
export async function generateShareImage(data: ShareImageData): Promise<string> {
  const width = 720;
  const height = 1280;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1e1b4b'); // indigo-900
  gradient.addColorStop(1, '#4f46e5'); // indigo-600

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 装饰圆
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.arc(width * 0.2, height * 0.15, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.3, 140, 0, Math.PI * 2);
  ctx.fill();

  // 顶部应用文案
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('简单习惯 Simple Habit', 40, 60);

  // 昵称
  ctx.font = '28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  const displayName = data.nickname || 'Habit Hero';
  ctx.fillText(displayName, 40, 120);

  // 中部主文案：连续天数
  ctx.textAlign = 'center';
  ctx.font = '18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('已连续打卡', width / 2, height / 2 - 80);

  ctx.font = '96px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(data.streak), width / 2, height / 2);

  ctx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('天', width / 2 + 120, height / 2 - 16);

  // 习惯名称
  ctx.font = '28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#fbbf24'; // amber-400
  const habitText = `${data.habitIcon || ''} ${data.habitTitle}`;
  ctx.fillText(habitText, width / 2, height / 2 + 80);

  // 今日日期
  const date = data.date || getTodayDate();
  ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText(date, 40, height - 80);

  // 底部小标语
  ctx.textAlign = 'right';
  ctx.fillText('每天一点点，习惯慢慢变。', width - 40, height - 80);

  return canvas.toDataURL('image/png');
}

