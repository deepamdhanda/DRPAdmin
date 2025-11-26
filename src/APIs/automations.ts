import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { automations_url } from "../axios/urls";

export const getAllAutomations = async () => {
  try {
    const response = await appAxios.get(automations_url, { withCredentials: true });
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch automations.");
    throw error;
  }
};

export const getAutomationById = async (id: any) => {
  try {
    const response = await appAxios.get(automations_url + "/" + id, { withCredentials: true });
    return response.data[0] as any;
  } catch (error: any) {
    toast.error("Failed to fetch automations.");
    throw error;
  }
};

export const createAutomation = async (data: any) => {
  try {
    const response = await appAxios.post(automations_url, data, { withCredentials: true });
    toast.success("Automation created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create automation.");
    throw error;
  }
};

export const updateAutomation = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${automations_url}/${id}`, data, { withCredentials: true });
    toast.success("Automation updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update automation.");
    throw error;
  }
};

export const deleteAutomation = async (id: string) => {
  try {
    await appAxios.delete(`${automations_url}/${id}`, { withCredentials: true });
    toast.success("Automation deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete automation.");
    throw error;
  }
};
