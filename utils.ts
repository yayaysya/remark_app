import { Checkin } from './types';

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const getDaysArray = (start: Date, end: Date) => {
  const arr = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt).toISOString().split('T')[0]);
  }
  return arr;
};

// Calculate Streak
export const calculateStreak = (checkins: Checkin[], today: string): number => {
  if (!checkins || checkins.length === 0) return 0;

  // Sort by date descending
  const sortedDates = [...new Set(checkins.map(c => c.date))].sort((a, b) => b.localeCompare(a));

  if (sortedDates.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date(today);
  
  // Check if we have checked in today
  const hasCheckedInToday = sortedDates.includes(today);
  
  // If not checked in today, check if we checked in yesterday to see if streak is alive
  if (!hasCheckedInToday) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (!sortedDates.includes(yesterdayStr)) {
      return 0;
    }
    // Start counting from yesterday
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count backwards
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (sortedDates.includes(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export const calculateMaxStreak = (checkins: Checkin[]): number => {
    if (!checkins || checkins.length === 0) return 0;
    const sortedDates = [...new Set(checkins.map(c => c.date))].sort(); // Ascending

    let max = 0;
    let current = 0;
    let prevDate: Date | null = null;

    for (const dateStr of sortedDates) {
        const d = new Date(dateStr);
        if (prevDate) {
            const diff = (d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
            if (diff === 1) {
                current++;
            } else {
                current = 1;
            }
        } else {
            current = 1;
        }
        max = Math.max(max, current);
        prevDate = d;
    }
    return max;
}