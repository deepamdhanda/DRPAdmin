import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { emailTemplates_url } from "../axios/urls";
import type { EmailTemplate } from "../screens/Dashboard/Marketing/Template.Email.Screen";


export const getAllEmailTemplates = async () => {
  try {
    const response = await appAxios.get(emailTemplates_url);
    return response.data as EmailTemplate[];
  } catch (error: any) {
    toast.error("Failed to fetch Email Templates.");
    throw error;
  }
};

export const getEmailTemplateById = async (id: any) => {
  try {
    const response = await appAxios.get(emailTemplates_url + "/" + id);
    return response.data[0] as EmailTemplate;
  } catch (error: any) {
    toast.error("Failed to fetch Email Templates.");
    throw error;
  }
};

export const createEmailTemplate = async (data: any) => {
  try {
    const response = await appAxios.post(emailTemplates_url, data);
    toast.success("Email Template created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create email template.");
    throw error;
  }
};

export const updateEmailTemplate = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${emailTemplates_url}/${id}`, data);
    toast.success("Email Template updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update Email Template.");
    throw error;
  }
};

export const deleteEmailTemplate = async (id: string) => {
  try {
    await appAxios.delete(`${emailTemplates_url}/${id}`);
    toast.success("Email Template deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete Email Template.");
    throw error;
  }
};
