import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { kyc_verification_url } from "../axios/urls";
import type { KycVerification } from "../screens/Dashboard/kyc-verification.screen";

export const getkyc = async (page: number = 1, limit: number = 10) => {
  try {
    const { data } = await appAxios.get(
      `${kyc_verification_url}?page=${page}&limit=${limit}`
    );
    return { data: data.data as KycVerification[], total: data.total };
  } catch (err) {
    toast.error("Failed to fetch");
    throw err;
  }
};

export const updateKyc = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(
      `${kyc_verification_url}/${id}`,
      data
    );
    toast.success("Kyc status updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update kyc status.");
    throw error;
  }
};
