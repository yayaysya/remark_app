export interface User {
  id: string;
  phone: string;
  username: string;
  nickname: string;
  voucherCount: number;
  totalCheckins: number;
  avatar?: string;
}

export enum HabitTheme {
  RED = 'red',
  ORANGE = 'orange',
  GREEN = 'green',
  BLUE = 'blue',
  PURPLE = 'purple',
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  icon: string; // Emoji
  themeColor: HabitTheme;
  status: 'active' | 'archived';
  createdAt: number;
}

export enum CheckinType {
  NORMAL = 'NORMAL',
  RETROACTIVE = 'RETROACTIVE', // Used a voucher
}

export interface Checkin {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  type: CheckinType;
  note?: string;
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: any) => boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeKey: string;
  earnedAt: number;
}

export const THEME_COLORS: Record<HabitTheme, string> = {
  [HabitTheme.RED]: 'bg-red-500',
  [HabitTheme.ORANGE]: 'bg-orange-500',
  [HabitTheme.GREEN]: 'bg-emerald-500',
  [HabitTheme.BLUE]: 'bg-blue-500',
  [HabitTheme.PURPLE]: 'bg-violet-500',
};

export const THEME_TEXT_COLORS: Record<HabitTheme, string> = {
  [HabitTheme.RED]: 'text-red-500',
  [HabitTheme.ORANGE]: 'text-orange-500',
  [HabitTheme.GREEN]: 'text-emerald-500',
  [HabitTheme.BLUE]: 'text-blue-500',
  [HabitTheme.PURPLE]: 'text-violet-500',
};
