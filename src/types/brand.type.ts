export interface IBrand {
  id: number;
  name: string;
  description: string;
  image: string;
}

export interface ICreateBrand {
  name: string;
  description: string;
  image: string;
}

export interface IUpdateBrand {
  id: number;
  name: string;
  description: string;
  image: string;
}
