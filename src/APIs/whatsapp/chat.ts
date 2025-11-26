import { toast } from "react-toastify";
import { appAxios } from "../../axios/appAxios";
import { chats_url } from "../../axios/urls";
import type { Chats } from "../../screens/Dashboard/Whatsapp/Chat.Whatsapp.Screen";


export const getAllChats = async () => {
    try {
        const response = await appAxios.get(chats_url);
        return response.data as Chats[];
    } catch (error: any) {
        toast.error("Failed to fetch Chat s.");
        throw error;
    }
};

export const getChatById = async (id: any) => {
    try {
        const response = await appAxios.get(chats_url + "/" + id);
        return response.data as any[];
    } catch (error: any) {
        toast.error("Failed to fetch Chat s.");
        throw error;
    }
};

export const createChat = async (data: any) => {
    try {
        const response = await appAxios.post(chats_url, data);
        toast.success("Chat  created successfully!");
        return response.data;
    } catch (error: any) {
        toast.error("Failed to create chat list.");
        throw error;
    }
};

export const updateChat = async (id: string, data: any) => {
    try {
        const response = await appAxios.patch(`${chats_url}/${id}`, data);
        toast.success("Chat  updated successfully!");
        return response.data;
    } catch (error: any) {
        toast.error("Failed to update Chat .");
        throw error;
    }
};

export const deleteChat = async (id: string) => {
    try {
        await appAxios.delete(`${chats_url}/${id}`);
        toast.success("Chat  deleted successfully!");
    } catch (error: any) {
        toast.error("Failed to delete Chat .");
        throw error;
    }
};
