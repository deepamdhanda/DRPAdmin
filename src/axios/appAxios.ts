import axios from "axios";
import Cookies from "js-cookie";
import _ from "lodash";
import { BASE_URL } from "./urls";


// Create Axios instance with base URL and content-type headers
const Axios = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Enable sending cookies with requests
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor
Axios.interceptors.request.use(
    (config) => {
        // Retrieve the token from cookies
        const authToken = Cookies.get("authToken");
        console.log("Request made with ", config, " and URL: ", authToken);
        if (authToken) {
            // Set the Authorization header if the token exists
            config.headers["Authorization"] = `Bearer ${authToken}`;
        }

        return config;
    },
    (error) => {
        // Reject the promise if there's a request error
        return Promise.reject(error);
    }
);

// Response Interceptor
Axios.interceptors.response.use(
    (res) => {
        return res;
    },
    (error) => {
        console.log(error)
        let errorMessage = error?.response?.data?.message || "Something went wrong, please try again later.";


        if (error?.response?.status === 403) {
            // Cookies.remove("authToken")
            errorMessage = "Verification Failed.";
            console.log(error)
            // window.location.href = "/verify?email=" + error?.response?.data?.email;
        }
        if (error?.response?.status === 401) {
            errorMessage = "Login Failed.";
            Cookies.remove("authToken"); // Remove the token from cookies
            const search = window.location.search;
            const urlParams = new URLSearchParams(search);

            let finalRedirect = "";

            if (urlParams.has("redirect")) {
                // If redirect param already exists, use the full search string
                finalRedirect = search;
            } else {
                // Else create a redirect param with the current path
                finalRedirect = `?redirect=${encodeURIComponent(window.location.pathname + search)}`;
            }

            // window.location.href = `/login${finalRedirect}`;
        }


        // Set custom error structure in the error response
        _.set(error, "response.data", {
            result: null,
            error: error.response?.data?.error || null,
            success: false,
            errorMessage,
        });
        _.set(error, "message", errorMessage)
        return Promise.reject(error); // Reject the error
    }
);

// Export Axios instance for use in other files
export const appAxios = Axios;
