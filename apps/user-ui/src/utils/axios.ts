import { AxiosClient } from '@eshopper/utils/client';

const axiosClient = new AxiosClient(process.env.NEXT_PUBLIC_API_URL!);
export { axiosClient };
