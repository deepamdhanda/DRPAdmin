import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { outgoingRemittances_url } from "../axios/urls";
// import { OutgoingRemittance } from "../../screens/user/OutgoingRemittances";

export const getAllOutgoingRemittances = async () => {
  try {
    const response = await appAxios.get(outgoingRemittances_url);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch outgoing_remittances.");
    throw error;
  }
};

export const getOutgoingRemittanceById = async (id: any) => {
  try {
    const response = await appAxios.get(outgoingRemittances_url + "/" + id);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch outgoing_remittances.");
    throw error;
  }
};

export const createOutgoingRemittance = async (data: any) => {
  try {
    const response = await appAxios.post(outgoingRemittances_url, data);
    toast.success("OutgoingRemittance created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create outgoing_remittance.");
    throw error;
  }
};

export const updateOutgoingRemittance = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${outgoingRemittances_url}/${id}`, data);
    toast.success("OutgoingRemittance updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update outgoing_remittance.");
    throw error;
  }
};

export const deleteOutgoingRemittance = async (id: string) => {
  try {
    await appAxios.delete(`${outgoingRemittances_url}/${id}`);
    toast.success("OutgoingRemittance deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete outgoing_remittance.");
    throw error;
  }
};
