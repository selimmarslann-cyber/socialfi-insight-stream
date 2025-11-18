  export interface TrendingUser {
    username: string;
    score: number;
    rank: number;
    refCode: string;
    avatar?: string;
    trend?: 'up' | 'down' | 'stable';
  }

  export interface UserProfile {
    username: string;
    avatar?: string;
    bio?: string;
    refCode: string;
    score: number;
    rank: number;
    joinedAt: string;
    contributions: number;
  }
