import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { incomingRemittances_url } from "../axios/urls";
// import { IncomingRemittance } from "../../screens/user/IncomingRemittances";

export const getAllIncomingRemittances = async () => {
  try {
    const response = await appAxios.get(incomingRemittances_url);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch incoming_remittances.");
    throw error;
  }
};

export const getIncomingRemittanceById = async (id: any) => {
  try {
    const response = await appAxios.get(incomingRemittances_url + "/" + id);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch incoming_remittances.");
    throw error;
  }
};

export const createIncomingRemittance = async (data: any) => {
  try {
    const response = await appAxios.post(incomingRemittances_url, data);
    toast.success("IncomingRemittance created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create incoming_remittance.");
    throw error;
  }
};

export const updateIncomingRemittance = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${incomingRemittances_url}/${id}`, data);
    toast.success("IncomingRemittance updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update incoming_remittance.");
    throw error;
  }
};

export const deleteIncomingRemittance = async (id: string) => {
  try {
    await appAxios.delete(`${incomingRemittances_url}/${id}`);
    toast.success("IncomingRemittance deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete incoming_remittance.");
    throw error;
  }
};
