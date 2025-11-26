import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { contacts_url } from "../axios/urls";
import type { Contact } from "../screens/Dashboard/Marketing/Contact.Screen";


export const getAllContacts = async () => {
  try {
    const response = await appAxios.get(contacts_url);
    return response.data as Contact[];
  } catch (error: any) {
    toast.error("Failed to fetch Contact s.");
    throw error;
  }
};

export const getContactById = async (id: any) => {
  try {
    const response = await appAxios.get(contacts_url + "/" + id);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch Contact s.");
    throw error;
  }
};

export const createContact = async (data: any) => {
  try {
    const response = await appAxios.post(contacts_url, data);
    toast.success("Contact  created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create contact list.");
    throw error;
  }
};

export const updateContact = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${contacts_url}/${id}`, data);
    toast.success("Contact  updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update Contact .");
    throw error;
  }
};

export const deleteContact = async (id: string) => {
  try {
    await appAxios.delete(`${contacts_url}/${id}`);
    toast.success("Contact  deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete Contact .");
    throw error;
  }
};
