export interface IUser {
  id: number;
  name: string;
  email: string;
  image?: string;
  age?: number;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updateBy?: string;
  active: boolean;
  verified?: boolean;
  lastLoginAt?: string;
  lastIpAddress?: string;
  role: {
    id: number;
    name: string;
  };
}

export interface Activity {
  action: string;
  metadata: string;
  pageUrl: string;
  timestamp: string;
}

export interface IUserAnalytics {
  userId: number;
  email: string;
  lifetimeValue: number;
  totalOrders: number;
  orderStatusDistribution: Record<string, number>;
  lastLoginAt: string;
  lastIpAddress: string;
  autoTags: string[];
  customTags: string[];
  adminNotes: string;
  recentActivities: Activity[];
}

