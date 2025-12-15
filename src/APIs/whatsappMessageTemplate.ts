import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { whatsappMessageTemplates_url } from "../axios/urls";
// import type { WhatsAppTemplate } from "../screens/Dashboard/Marketing/Template.WhatsappMessage.Screen";

export const getAllWhatsappMessageTemplates = async () => {
  try {
    const response = await appAxios.get(whatsappMessageTemplates_url);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch Whatsapp Message Templates.");
    throw error;
  }
};

export const getWhatsappMessageTemplateById = async (id: any) => {
  try {
    const response = await appAxios.get(
      whatsappMessageTemplates_url + "/" + id
    );
    return response.data[0] as any;
  } catch (error: any) {
    toast.error("Failed to fetch Whatsapp Message Templates.");
    throw error;
  }
};

export const createWhatsappMessageTemplate = async (data: any) => {
  try {
    const response = await appAxios.post(whatsappMessageTemplates_url, data);
    toast.success("Whatsapp Message Template created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create whatsapp message template.");
    throw error;
  }
};

export const updateWhatsappMessageTemplate = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(
      `${whatsappMessageTemplates_url}/${id}`,
      data
    );
    toast.success("Whatsapp Message Template updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update Whatsapp Message Template.");
    throw error;
  }
};

export const deleteWhatsappMessageTemplate = async (id: string) => {
  try {
    await appAxios.delete(`${whatsappMessageTemplates_url}/${id}`);
    toast.success("Whatsapp Message Template deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete Whatsapp Message Template.");
    throw error;
  }
};
