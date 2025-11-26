import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { tickets_url } from "../axios/urls";
// import { Ticket } from "../../screens/user/Tickets";

export const getAllTickets = async () => {
  try {
    const response = await appAxios.get(tickets_url);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch tickets.");
    throw error;
  }
};

export const getTicketById = async (id: any) => {
  try {
    const response = await appAxios.get(tickets_url + "/" + id);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch tickets.");
    throw error;
  }
};

export const createTicket = async (data: any) => {
  try {
    const response = await appAxios.post(tickets_url, data);
    toast.success("Ticket created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create ticket.");
    throw error;
  }
};

export const updateTicket = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${tickets_url}/${id}`, data);
    toast.success("Ticket updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update ticket.");
    throw error;
  }
};

export const deleteTicket = async (id: string) => {
  try {
    await appAxios.delete(`${tickets_url}/${id}`);
    toast.success("Ticket deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete ticket.");
    throw error;
  }
};
