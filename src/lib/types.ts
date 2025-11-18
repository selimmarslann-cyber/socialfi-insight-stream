export type Contribute = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  tags?: string[];
  weeklyScore?: number;
  coverImage?: string;
  poolEnabled?: boolean;
  contractPostId?: number | null;
};
