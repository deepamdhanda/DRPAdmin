import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { contactLists_url } from "../axios/urls";
import type { ContactList } from "../screens/Dashboard/Marketing/ContactLists.Screen";


export const getAllContactLists = async () => {
  try {
    const response = await appAxios.get(contactLists_url);
    return response.data as ContactList[];
  } catch (error: any) {
    toast.error("Failed to fetch Contact Lists.");
    throw error;
  }
};

export const getContactListById = async (id: any) => {
  try {
    const response = await appAxios.get(contactLists_url + "/" + id);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch Contact Lists.");
    throw error;
  }
};

export const createContactList = async (data: any) => {
  try {
    const response = await appAxios.post(contactLists_url, data);
    toast.success("Contact List created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create contact list.");
    throw error;
  }
};

export const updateContactList = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${contactLists_url}/${id}`, data);
    toast.success("Contact List updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update Contact List.");
    throw error;
  }
};

export const deleteContactList = async (id: string) => {
  try {
    await appAxios.delete(`${contactLists_url}/${id}`);
    toast.success("Contact List deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete Contact List.");
    throw error;
  }
};
