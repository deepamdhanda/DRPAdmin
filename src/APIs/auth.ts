import { toast } from "react-toastify";
import { appAxios } from "../axios/appAxios";
import { loginURL, sendOtpURL } from "../axios/urls";

export const LoginUser = async (userdata: any) => {
    try {
        const apiRes = await appAxios.post(loginURL, userdata, {
            withCredentials: true,
        });
        if (!apiRes) {
            throw new Error("Error while fetching")
        }
        return true;
    } catch (error: any) {
        toast.error(error.message || "something went wrong");
        return false
    }
};

export const SendOTP = async (userdata: any, resend = false) => {
    try {
        await appAxios.post(sendOtpURL, { userdata, resend }, {
            // withCredentials: true,
        });
        toast.success("OTP sent successfully.")
        return true;
    } catch (error: any) {
        console.log(error)
        toast.error(error.message || "something went wrong");
        return false;
    }
}