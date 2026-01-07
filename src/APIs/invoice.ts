import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { invoices_url } from "../axios/urls";

const today = new Date();
const oneMonthBack = new Date();
oneMonthBack.setMonth(oneMonthBack.getMonth() - 1);

// Convert to yyyy-mm-dd (HTML date input requirement)
const formatDate = (d: Date) => d.toISOString().split("T")[0];


export const getAllInvoices = async (start_date = formatDate(oneMonthBack), end_date = formatDate(today)) => {
  try {
    const response = await appAxios.get(invoices_url, {
      params: {
        start_date,
        end_date
      }
    });
    return response.data as any;
  } catch (error: any) {
    toast.error("Failed to fetch Invoice s.");
    throw error;
  }
};

export const getInvoiceById = async (id: any) => {
  try {
    const response = await appAxios.get(invoices_url + "/" + id);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch Invoice s.");
    throw error;
  }
};

export const createInvoice = async (data: any) => {
  try {
    const response = await appAxios.post(invoices_url, data);
    toast.success("Invoice  created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create invoice list.");
    throw error;
  }
};

export const updateInvoice = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${invoices_url}/${id}`, data);
    toast.success("Invoice  updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update Invoice .");
    throw error;
  }
};

export const deleteInvoice = async (id: string) => {
  try {
    await appAxios.delete(`${invoices_url}/${id}`);
    toast.success("Invoice  deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete Invoice .");
    throw error;
  }
};
