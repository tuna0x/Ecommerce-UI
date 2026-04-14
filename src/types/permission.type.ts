export interface IPermission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
