import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { users_url } from "../axios/urls";
// import { User } from "../../screens/user/Users";

export const getAllUsers = async () => {
  try {
    const response = await appAxios.get(users_url);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch users.");
    throw error;
  }
};

export const getUserById = async (id: any) => {
  try {
    const response = await appAxios.get(users_url + "/" + id);
    return response.data as any[];
  } catch (error: any) {
    toast.error("Failed to fetch users.");
    throw error;
  }
};

export const createUser = async (data: any) => {
  try {
    const response = await appAxios.post(users_url, data);
    toast.success("User created successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to create user.");
    throw error;
  }
};

export const updateUser = async (id: string, data: any) => {
  try {
    const response = await appAxios.patch(`${users_url}/${id}`, data);
    toast.success("User updated successfully!");
    return response.data;
  } catch (error: any) {
    toast.error("Failed to update user.");
    throw error;
  }
};

export const deleteUser = async (id: string) => {
  try {
    await appAxios.delete(`${users_url}/${id}`);
    toast.success("User deleted successfully!");
  } catch (error: any) {
    toast.error("Failed to delete user.");
    throw error;
  }
};
