export interface IApiResponse<T> {
  error?: string | string[];
  message: string;
  statusCode: number | string;
  data?: T;
}

export interface IPagination<T> {
  meta: IMeta;
  result: T[];
}

export interface IMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}
