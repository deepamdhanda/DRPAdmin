import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Cookies from "js-cookie";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const authRoutes = ["/login"];

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const token = Cookies.get("authToken");
    const role = Cookies.get("roleType");
    if (currentPath === "/") {
      navigate(`/login`, { replace: true });

    }
    console.log("token", token);
    return;
    if (!token) {
      if (!authRoutes.includes(location.pathname)) {
        console.log("No token found, Invalid Path, redirecting to login");
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
      }
    } else {
      // If user has token, check role and path match
      if (
        (role === "user" && !location.pathname.startsWith("/user")) ||
        (role === "warehouse" && !location.pathname.startsWith("/warehouse"))
      ) {
        const redirectPath = role === "user" ? "/user" : "/warehouse";
        console.log(`Role ${role} accessing wrong path, redirecting to ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <>
      <ToastContainer />
      <Outlet />
    </>
  );
}

export default App;
