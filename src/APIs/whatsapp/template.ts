import { toast } from "react-toastify";
import { appAxios } from "../../axios/appAxios";
import { templates_url } from "../../axios/urls";
import type { Template } from "../../screens/Dashboard/Whatsapp/Template.Whatsapp.Screen";


export const getAllTemplates = async () => {
    try {
        const response = await appAxios.get(templates_url);
        return response.data as Template[];
    } catch (error: any) {
        toast.error("Failed to fetch Templates.");
        throw error;
    }
};

export const getTemplateById = async (id: any) => {
    try {
        const response = await appAxios.get(templates_url + "/" + id);
        return response.data as any[];
    } catch (error: any) {
        toast.error("Failed to fetch Templates.");
        throw error;
    }
};

export const createTemplate = async (data: any) => {
    try {
        const response = await appAxios.post(templates_url, data);
        toast.success("Template  created successfully!");
        return response.data;
    } catch (error: any) {
        toast.error("Failed to create template list.");
        throw error;
    }
};

export const updateTemplate = async (id: string, data: any) => {
    try {
        const response = await appAxios.patch(`${templates_url}/${id}`, data);
        toast.success("Template  updated successfully!");
        return response.data;
    } catch (error: any) {
        toast.error("Failed to update Template.");
        throw error;
    }
};

export const deleteTemplate = async (id: string) => {
    try {
        await appAxios.delete(`${templates_url}/${id}`);
        toast.success("Template  deleted successfully!");
    } catch (error: any) {
        toast.error("Failed to delete Template.");
        throw error;
    }
};
