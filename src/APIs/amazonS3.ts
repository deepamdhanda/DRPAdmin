import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { amazonS3s_url } from "../axios/urls";
import type { S3Response } from "../screens/Dashboard/AmazonS3.Screen";
// import { AmazonS3 } from "../../screens/user/AmazonS3s";

export const getAllAmazonS3s = async (prefix: any) => {
  try {
    const response = await appAxios.get(amazonS3s_url, { params: { prefix }, withCredentials: true });
    return response.data as S3Response;
  } catch (error: any) {
    toast.error("Failed to fetch amazonS3s.");
    throw error;
  }
};

export const getAmazonS3ById = async (id: any) => {
  try {
    const response = await appAxios.get(amazonS3s_url + "/" + id, { withCredentials: true });
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch amazonS3s.");
    throw error;
  }
};

export const createAmazonS3 = async (data: any) => {
  try {
    const response = await appAxios.post(amazonS3s_url, data, { withCredentials: true });
    toast.success("AmazonS3 created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create amazonS3.");
    throw error;
  }
};

export const updateAmazonS3 = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${amazonS3s_url}/${id}`, data, { withCredentials: true });
    toast.success("AmazonS3 updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update amazonS3.");
    throw error;
  }
};

export const deleteAmazonS3 = async (id: string) => {
  try {
    await appAxios.delete(`${amazonS3s_url}/${id}`, { withCredentials: true });
    toast.success("AmazonS3 deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete amazonS3.");
    throw error;
  }
};
