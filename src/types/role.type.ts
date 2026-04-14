import type { IPermission } from "./permission.type";

export interface IRole {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  permissions?: IPermission[];
}
