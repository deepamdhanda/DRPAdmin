import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./screens/Auth/Login.tsx";
import { dashboardRoutes } from "./screens/Dashboard/dashboard.Router.tsx";
import MainScreen from "./screens/Dashboard/main.Screen.tsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // General app layout
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "dashboard",
        element: <MainScreen />, // <-- This becomes the layout for all /Dashboard/* routes
        children: dashboardRoutes,
      },
    ],
  },
]);
createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
