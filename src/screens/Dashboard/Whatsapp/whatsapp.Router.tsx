import ChatScreen from "./Chat.Whatsapp.Screen";
import TemplatesScreen from "./Template.Whatsapp.Screen";

export const whatsappRoutes = [
    // {
    //     index: true,
    //     element: <DashboardScreen />,
    // },
    {
        path: "chat",
        element: <ChatScreen />,
    },
    {
        path: "template",
        element: <TemplatesScreen />,
    },
];
