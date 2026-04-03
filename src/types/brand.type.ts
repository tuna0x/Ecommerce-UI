export interface IBrand {
  id: number;
  name: string;
  description: string;
  image: string;
  isFeatured?: boolean;
  active?: boolean;
}

export interface ICreateBrand {
  name: string;
  description: string;
  image: string;
  isFeatured?: boolean;
  active?: boolean;
}

export interface IUpdateBrand {
  id: number;
  name: string;
  description: string;
  image: string;
  isFeatured?: boolean;
  active?: boolean;
}
