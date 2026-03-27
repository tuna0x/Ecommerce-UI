export interface IBanner {
  id: number;
  title: string;
  image: string;
  link: string;
  position: "hero" | "sub" | "popup" | "category";
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ICreateBanner {
  title: string;
  link: string;
  position: string;
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface IUpdateBanner extends ICreateBanner {
  id: number;
}
