import 'axios';

declare module 'axios' {
  // Must match Axios's generic signature exactly for declaration merging
  interface AxiosRequestConfig {
    __startTime?: number;
  }

  interface InternalAxiosRequestConfig {
    __startTime?: number;
  }
}

export {};