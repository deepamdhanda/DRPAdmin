
import AutomationCreateScreen from "./Marketing/Automation.Create.Screen.tsx";
import AutomationScreen from "./Marketing/Automation.Screen.tsx";
import DashboardScreen from "./Dashboard.Screen.tsx";
import TicketScreen from "./Ticket.Screen.tsx";
import UserScreen from "./User.Screen.tsx";
import AmazonS3Screen from "./AmazonS3.Screen.tsx";
import ContactListScreen from "./Marketing/ContactLists.Screen.tsx";
import ContactScreen from "./Marketing/Contact.Screen.tsx";
import WhatsAppTemplatesScreen from "./Marketing/Template.WhatsappMessage.Screen.tsx";
import EmailTemplates from "./Marketing/Template.Email.Screen.tsx";
import { OutgoingRemittances } from "./OutgoingRemittace.Screen.tsx";
import { IncomingRemittances } from "./IncomingRemittace.Screen.tsx";
import { Invoice } from "./Invoice.Screen.tsx";
import { whatsappRoutes } from "./Whatsapp/whatsapp.Router.tsx";

export const dashboardRoutes = [
    {
        index: true,
        element: <DashboardScreen />,
    },
    {
        path: "ticket",
        element: <TicketScreen />,
    },
    {
        path: "user",
        element: <UserScreen />,
    },
    {
        path: "amazonS3",
        element: <AmazonS3Screen />,
    },
    {
        path: "outgoingRemittance",
        element: <OutgoingRemittances />,
    },
    {
        path: "incomingRemittance",
        element: <IncomingRemittances />,
    },
    {
        path: "invoice",
        element: <Invoice />,
    },
    {
        path: "marketing",
        children: [
            {
                path: "automation/",
                element: <AutomationScreen />,
            },
            {
                path: "contactList/",
                element: <ContactListScreen />,
            },
            {
                path: "contact/",
                element: <ContactScreen />,
            },
            {
                path: "template/email",
                element: <EmailTemplates />,
            },
            {
                path: "template/whatsappMessage",
                element: <WhatsAppTemplatesScreen />,
            },
            {
                path: "createAutomation/:automationId?",
                element: <AutomationCreateScreen />,
            }
        ]
    },
    {
        path: "whatsapp",
        children: whatsappRoutes
    }
];
