import { AxiosClient } from '@eshopper/utils/client';

const axiosClient = new AxiosClient(process.env.NEXT_PUBLIC_API_URL!);
// Add request interceptor
axiosClient.getInstance().interceptors.request.use((config) => {
  // Add custom header
  config.headers['X-Origin-Site'] = 'shopper';
  return config;
});
export { axiosClient };
