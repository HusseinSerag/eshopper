import axios, { type AxiosInstance } from 'axios';

export class AxiosClient {
  private axiosInstance: AxiosInstance;
  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      withCredentials: true,
      baseURL,
    });
  }
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
