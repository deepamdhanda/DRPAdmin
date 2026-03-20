import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Card,
  Table,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import type { ContactList } from "./ContactLists.Screen";
import {
  getAllContacts,
  createContact,
  updateContact,
  addRemarkToContact,
} from "../../../APIs/contact";
import { getAllContactLists } from "../../../APIs/contactList";
import { createAmazonS3 } from "../../../APIs/amazonS3";
import type { Template } from "../Whatsapp/Chat.Whatsapp.Screen";
import { getAllTemplates } from "../../../APIs/whatsapp/template";
import { createChat } from "../../../APIs/whatsapp/chat";

// --- Interfaces ---
export interface Contact {
  _id?: string;
  name?: string;
  email: string;
  phone?: string;
  other_data?: any;
  contact_list_id?: any;
  lead_utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  lead_type?: "cold" | "warm" | "hot";
  lead_status?:
    | "new"
    | "contacted"
    | "qualified"
    | "lost"
    | "converted"
    | "follow_up"
    | "negotiation"
    | "on_hold";
  status?: "active" | "inactive" | "suspended";
  next_followup_date?: string;
  isDeleted?: boolean;
  remarks?: Remark[];
  createdAt?: string;
}

interface Remark {
  comment: string;
  commentedBy?: { name: string; email: string };
  fileLink?: string;
  createdAt?: Date | string;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  other_data: any;
  contact_list_id: string;
  lead_utm: any;
  status: string;
  lead_type?: string;
  lead_status?: string;
  next_followup_date?: string;
}

// --- Helpers ---
const getLeadColor = (lead: string | undefined): string => {
  const colors = { cold: "#ef4444", warm: "#fde047", hot: "#22c55e" };
  return colors[lead as keyof typeof colors] || "#737373";
};

const getLeadStatusColor = (status: string | undefined): string => {
  const colors = {
    new: "#3b82f6",
    contacted: "#fcd34d",
    qualified: "#8b5cf6",
    converted: "#16a34a",
    lost: "#ef4444",
    follow_up: "#f97316",
    negotiation: "#0ea5e9",
    on_hold: "#737373",
  };
  return colors[status as keyof typeof colors] || "#737373";
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

const ContactScreen: React.FC = () => {
  // Lists
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterLeadType, setFilterLeadType] = useState("");
  const [filterLeadStatus, setFilterLeadStatus] = useState("");
  const [filterFollowUpDate, setFilterFollowUpDate] = useState("");
  const [showPendingTasks, setShowPendingTasks] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);

  // Selection
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form States
  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    other_data: {},
    contact_list_id: "",
    lead_utm: {},
    status: "active",
    lead_type: "cold",
    lead_status: "new",
    next_followup_date: "",
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  const [newRemarkComment, setNewRemarkComment] = useState("");
  const [newRemarkFile, setNewRemarkFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Assuming backend accepts { isDeleted: true/false } as query params
      const isDeletedQuery = activeTab === "deleted";
      const [contactsRes, contactListRes] = await Promise.all([
        getAllContacts({ isDeleted: isDeletedQuery }),
        getAllContactLists(),
      ]);
      setContacts(contactsRes);
      setContactLists(contactListRes);
    } catch (err) {
      toast.error("Failed to load data");
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    getAllTemplates()
      .then((res) => setTemplates(res))
      .catch((err) => console.error("Error loading templates", err));
  }, [fetchData, refetch]);

  // --- Handlers ---
  const openEditModal = (contact?: Contact) => {
    if (contact) {
      setForm({
        name: contact.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        other_data: contact.other_data || {},
        contact_list_id:
          typeof contact.contact_list_id === "object"
            ? contact.contact_list_id?._id
            : contact.contact_list_id,
        lead_utm: contact.lead_utm || {},
        status: contact.status || "active",
        lead_type: contact.lead_type || "cold",
        lead_status: contact.lead_status || "new",
        next_followup_date: contact.next_followup_date || "",
      });
      setEditingId(contact._id || null);
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        other_data: {},
        contact_list_id: "",
        lead_utm: {},
        status: "active",
        lead_type: "cold",
        lead_status: "new",
        next_followup_date: "",
      });
      setEditingId(null);
    }
    setShowEditModal(true);
  };

  const openRemarksModal = (contact: Contact) => {
    setSelectedContact(contact);
    setNewRemarkComment("");
    setNewRemarkFile(null);
    setShowRemarksModal(true);
  };

  const handleSaveContact = async () => {
    if (!form.email) return toast.error("Email is required");
    try {
      setLoading(true);
      if (editingId) {
        await updateContact(editingId, form);
        toast.success("Contact updated");
      } else {
        await createContact(form);
        toast.success("Contact created");
      }
      setShowEditModal(false);
      setRefetch(!refetch);
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpdate = async (
    field: "lead_type" | "lead_status" | "next_followup_date",
    value: string
  ) => {
    if (!selectedContact?._id) return;
    try {
      await updateContact(selectedContact._id, { [field]: value });
      setSelectedContact((prev) => (prev ? { ...prev, [field]: value } : null));
      setRefetch(!refetch);
      toast.success("Updated successfully");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleToggleDelete = async (id: string, currentlyDeleted: boolean) => {
    if (
      window.confirm(
        currentlyDeleted ? "Recover this contact?" : "Move to deleted?"
      )
    ) {
      try {
        await updateContact(id, { deleted: !currentlyDeleted });
        toast.success(
          currentlyDeleted ? "Contact recovered" : "Contact deleted"
        );
        setRefetch(!refetch);
      } catch (error) {
        toast.error("Failed to update status");
      }
    }
  };

  const handleAddRemark = async () => {
    if (!newRemarkComment && !newRemarkFile)
      return toast.error("Remark cannot be empty");
    if (!selectedContact?._id) return;

    try {
      setRemarkLoading(true);
      let fileLink = "";

      if (newRemarkFile) {
        const base64 = await convertFileToBase64(newRemarkFile);
        const uploaded = await createAmazonS3({
          fileName: `remarks/${Date.now()}_${newRemarkFile.name}`,
          fileContent: base64,
        });
        fileLink = uploaded.url;
      }

      await addRemarkToContact(selectedContact._id, {
        comment: newRemarkComment,
        fileLink,
      });

      toast.success("Remark added");
      setRefetch(!refetch);

      // Update local state to show new remark instantly
      const newRemark: Remark = {
        comment: newRemarkComment,
        fileLink,
        createdAt: new Date(),
        commentedBy: { name: "You", email: "" }, // Adjust based on your auth state
      };
      setSelectedContact((prev) =>
        prev ? { ...prev, remarks: [...(prev.remarks || []), newRemark] } : null
      );

      setNewRemarkComment("");
      setNewRemarkFile(null);
    } catch (err) {
      toast.error("Failed to add remark");
    } finally {
      setRemarkLoading(false);
    }
  };

  // --- Filter Logic ---
  const filteredContacts = contacts.filter((contact) => {
    // 1. Text Search
    const query = searchText.toLowerCase();
    const matchName = contact.name?.toLowerCase().includes(query);
    const matchPhone = contact.phone?.toLowerCase().includes(query);
    const matchesSearch = matchName || matchPhone || searchText === "";

    // 2. Dropdown Filters
    const matchesLeadType = filterLeadType
      ? contact.lead_type === filterLeadType
      : true;
    const matchesLeadStatus = filterLeadStatus
      ? contact.lead_status === filterLeadStatus
      : true;
    const matchesFollowUp = filterFollowUpDate
      ? contact.next_followup_date?.split("T")[0] === filterFollowUpDate
      : true;

    // 3. Pending Tasks Filter (Date <= Today)
    let matchesPending = true;
    if (showPendingTasks) {
      if (!contact.next_followup_date) {
        matchesPending = false;
      } else {
        const followUpDate = new Date(contact.next_followup_date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        matchesPending = followUpDate <= today;
      }
    }

    return (
      matchesSearch &&
      matchesLeadType &&
      matchesLeadStatus &&
      matchesFollowUp &&
      matchesPending
    );
  });
  const selectedCustomer = null;
  const myNumber = "";

  const columns = [
    {
      name: "Name",
      selector: (row: Contact) => row.name || "",
      cell: (row: Contact) => (
        <div
          style={{ padding: "10px 0", cursor: "pointer" }}
          onClick={() => openEditModal(row)}
        >
          <div
            style={{
              fontWeight: "600",
              marginBottom: "4px",
              fontSize: "14px",
              color: "blue",
              textDecoration: "underline",
            }}
          >
            {row.name || "—"}
          </div>
          <div style={{ fontSize: "12px", color: "#555" }}>
            📧 {row.email || "-"}
          </div>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
            ⏰ Created: {row.createdAt?.split("T")[0]}
          </div>
          <div className="d-flex gap-1 flex-wrap">
            <span
              style={{
                fontSize: "10px",
                padding: "3px 6px",
                backgroundColor: `${getLeadColor(row.lead_type)}`,
                borderRadius: "4px",
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {row.lead_type || "N/A"}
            </span>
            <span
              style={{
                fontSize: "10px",
                padding: "3px 6px",
                backgroundColor: getLeadStatusColor(row.lead_status),
                color: "#fff",
                textTransform: "capitalize",
                borderRadius: "4px",
              }}
            >
              {row.lead_status?.replace("_", " ") || "N/A"}
            </span>
          </div>
        </div>
      ),
      sortable: true,
      width: "220px",
    },
    {
      name: "Phone",
      selector: (row: Contact) => row.phone || "",
      cell: (row: Contact) => (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600" }}>
            {row.phone || "-"}
          </div>
          {row.phone && (
            <a
              // href={`https://wa.me/${row.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              onClick={() => setShowTemplateModal(true)}
              rel="noreferrer"
              style={{
                fontSize: "11px",
                color: "#25D366",
                textDecoration: "none",
              }}
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      ),
      width: "140px",
    },
    {
      name: "Follow-Up",
      cell: (row: Contact) => {
        if (!row.next_followup_date)
          return <span className="text-muted small">—</span>;

        const followUpDate = new Date(row.next_followup_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let color = "#555";
        if (followUpDate < today) color = "#ef4444"; // Past (Red)
        else if (followUpDate.getTime() === today.getTime())
          color = "#f59e0b"; // Today (Orange)
        else color = "#22c55e"; // Future (Green)

        return (
          <div style={{ fontSize: "12px", fontWeight: "600", color }}>
            📅 {row.next_followup_date.split("T")[0]}
          </div>
        );
      },
      width: "120px",
    },
    {
      name: "Last Remark",
      cell: (row: Contact) => {
        const last = row.remarks?.[row.remarks.length - 1];
        return last ? (
          <div style={{ fontSize: "12px" }}>
            <div className="text-truncate" style={{ maxWidth: "150px" }}>
              {last.comment}
              <div className="text-muted mt-1" style={{ fontSize: "10px" }}>
                {last.commentedBy?.name || "System"} •{" "}
                {new Date(last.createdAt as string).toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted small">—</span>
        );
      },
      width: "180px",
    },
    {
      name: "UTM / List",
      cell: (row: Contact) => (
        <div style={{ fontSize: "11px" }}>
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>
            {row.contact_list_id?.name || "No List"}
          </div>
          {row.lead_utm &&
            Object.entries(row.lead_utm)
              .filter(([_, v]) => v)
              .slice(0, 2)
              .map(([k, v]) => (
                <div key={k}>
                  <span className="text-muted">{k}:</span> {String(v)}
                </div>
              ))}
        </div>
      ),
      width: "150px",
    },
    {
      name: "Actions",
      cell: (row: Contact) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => openRemarksModal(row)}
            style={{ fontSize: "11px" }}
          >
            Remarks ({row.remarks?.length || 0})
          </Button>
          <Button
            size="sm"
            variant={
              activeTab === "active" ? "outline-danger" : "outline-success"
            }
            onClick={() =>
              handleToggleDelete(row._id!, activeTab === "deleted")
            }
            style={{ fontSize: "11px" }}
          >
            {activeTab === "active" ? "Delete" : "Recover"}
          </Button>
        </div>
      ),
      width: "160px",
    },
  ];
  const handleSendTemplate = async (template: Template) => {
    if (!selectedCustomer || !myNumber) return;

    setShowTemplateModal(false);

    // Assuming your backend expects a specific "template" type
    const payload = {
      from: myNumber,
      to: selectedCustomer,
      type: "template",
      content: {
        template_name: template.name,
        template_params: [],
      },
      direction: "outbound",
    };

    console.log("Sending template payload:", payload);

    try {
      const res = await createChat(payload);
      if (!res) throw new Error("Failed to send template");
      toast.success("Template sent successfully");
    } catch (error) {
      toast.error("Error sending template: " + error);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        <h3>Contact Database</h3>
        <Button
          onClick={() => openEditModal()}
          variant="primary"
          className="text-nowrap"
        >
          + Add New Contact
        </Button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3 border-bottom-0">
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "active"
                ? "active border-bottom-0 fw-bold"
                : "text-muted"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active Contacts
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "deleted"
                ? "active border-bottom-0 fw-bold text-danger"
                : "text-muted"
            }`}
            onClick={() => setActiveTab("deleted")}
          >
            Deleted Contacts
          </button>
        </li>
      </ul>

      {/* Filters Toolbar */}
      <Card className="mb-4 shadow-sm border-0 bg-light">
        <Card.Body className="p-3">
          <div className="d-flex flex-wrap gap-3 align-items-end">
            <div>
              <Form.Label className="small text-muted mb-1">Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Name or Phone..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: "200px" }}
                size="sm"
              />
            </div>

            <div>
              <Form.Label className="small text-muted mb-1">
                Lead Type
              </Form.Label>
              <Form.Select
                size="sm"
                value={filterLeadType}
                onChange={(e) => setFilterLeadType(e.target.value)}
                style={{ width: "130px" }}
              >
                <option value="">All Types</option>
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="hot">Hot</option>
              </Form.Select>
            </div>

            <div>
              <Form.Label className="small text-muted mb-1">
                Lead Status
              </Form.Label>
              <Form.Select
                size="sm"
                value={filterLeadStatus}
                onChange={(e) => setFilterLeadStatus(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow Up</option>
                <option value="negotiation">Negotiation</option>
                <option value="qualified">Qualified</option>
                <option value="on_hold">On Hold</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </Form.Select>
            </div>

            <div>
              <Form.Label className="small text-muted mb-1">
                Follow-up Date
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={filterFollowUpDate}
                onChange={(e) => setFilterFollowUpDate(e.target.value)}
                style={{ width: "140px", cursor: "pointer" }}
                onClick={(e) =>
                  (e.target as HTMLInputElement).showPicker &&
                  (e.target as HTMLInputElement).showPicker()
                }
              />
            </div>

            <div className="ms-auto d-flex gap-2">
              <Button
                variant={showPendingTasks ? "warning" : "outline-secondary"}
                size="sm"
                className="fw-bold"
                onClick={() => setShowPendingTasks(!showPendingTasks)}
              >
                {showPendingTasks
                  ? "Showing Pending Tasks"
                  : "Show Pending Tasks"}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSearchText("");
                  setFilterLeadType("");
                  setFilterLeadStatus("");
                  setFilterFollowUpDate("");
                  setShowPendingTasks(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredContacts}
        pagination
        highlightOnHover
        responsive
        paginationRowsPerPageOptions={[10, 50, 100, 500]}
      />

      {/* --- Edit/Create Contact Modal --- */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "Edit Details" : "New Contact"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email*</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Source List</Form.Label>
                  <Form.Select
                    value={form.contact_list_id}
                    onChange={(e) =>
                      setForm({ ...form, contact_list_id: e.target.value })
                    }
                  >
                    <option value="">Select List</option>
                    {contactLists.map((cl) => (
                      <option key={cl._id} value={cl._id}>
                        {cl.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Next Follow-up Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.next_followup_date?.split("T")[0] || ""}
                    onChange={(e) =>
                      setForm({ ...form, next_followup_date: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveContact} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- Remarks & Status Modal --- */}
      <Modal
        show={showRemarksModal}
        onHide={() => setShowRemarksModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Pipeline: {selectedContact?.name || selectedContact?.email}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "#fbfbfb" }}>
          {/* Status Quick-Edit Bar */}
          <div className="bg-white p-3 rounded border mb-4 shadow-sm d-flex gap-3 flex-wrap">
            <div className="flex-grow-1">
              <Form.Label className="small fw-bold text-muted mb-1">
                Lead Status
              </Form.Label>
              <Form.Select
                size="sm"
                value={selectedContact?.lead_status || ""}
                onChange={(e) =>
                  handleQuickUpdate("lead_status", e.target.value)
                }
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow Up Required</option>
                <option value="negotiation">In Negotiation</option>
                <option value="qualified">Qualified</option>
                <option value="on_hold">On Hold</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </Form.Select>
            </div>
            <div className="flex-grow-1">
              <Form.Label className="small fw-bold text-muted mb-1">
                Lead Type
              </Form.Label>
              <Form.Select
                size="sm"
                value={selectedContact?.lead_type || ""}
                onChange={(e) => handleQuickUpdate("lead_type", e.target.value)}
              >
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="hot">Hot</option>
              </Form.Select>
            </div>
            <div className="flex-grow-1">
              <Form.Label className="small fw-bold text-muted mb-1">
                Set Follow-up Date
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={selectedContact?.next_followup_date?.split("T")[0] || ""}
                onChange={(e) =>
                  handleQuickUpdate("next_followup_date", e.target.value)
                }
                style={{ cursor: "pointer" }}
                onClick={(e) =>
                  (e.target as HTMLInputElement).showPicker &&
                  (e.target as HTMLInputElement).showPicker()
                } // Forces the calendar dropdown to open on click!
              />
            </div>
          </div>

          {/* Form to Push New Remark */}
          <Card className="border-primary mb-4">
            <Card.Body>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">
                  Add Note / Remark
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="What was discussed?"
                  value={newRemarkComment}
                  onChange={(e) => setNewRemarkComment(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex gap-3 align-items-center">
                <Form.Control
                  type="file"
                  size="sm"
                  onChange={(e: any) => setNewRemarkFile(e.target.files[0])}
                  style={{ maxWidth: "250px" }}
                />
                <Button
                  className="ms-auto"
                  size="sm"
                  onClick={handleAddRemark}
                  disabled={remarkLoading}
                >
                  {remarkLoading ? <Spinner size="sm" /> : "Post Remark"}
                </Button>
              </div>
            </Card.Body>
          </Card>

          <h6 className="mb-3 text-muted fw-bold">Timeline History</h6>
          <div
            style={{
              maxHeight: "350px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {!selectedContact?.remarks ||
            selectedContact.remarks.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No history found.
              </div>
            ) : (
              selectedContact.remarks
                .slice()
                .reverse()
                .map((r, i) => (
                  <div
                    key={i}
                    className="bg-white border p-3 rounded mb-2 shadow-sm"
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <small className="text-primary fw-bold">
                        {r.commentedBy?.name || "System"}
                      </small>
                      <small
                        className="text-muted"
                        style={{ fontSize: "11px" }}
                      >
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "Just now"}
                      </small>
                    </div>
                    <p
                      className="mb-1"
                      style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}
                    >
                      {r.comment}
                    </p>
                    {r.fileLink && (
                      <a
                        href={r.fileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-decoration-none small"
                      >
                        📎 View Attachment
                      </a>
                    )}
                  </div>
                ))
            )}
          </div>
        </Modal.Body>
      </Modal>
      <Modal
        show={showTemplateModal}
        onHide={() => setShowTemplateModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Select a Template to Send</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {templates.length > 0 ? (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template._id || template.name}>
                    <td className="align-middle">{template.name}</td>
                    <td className="align-middle">{template.subject}</td>
                    <td className="align-middle text-end">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSendTemplate(template)}
                      >
                        Send
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center text-muted my-3">
              No approved templates available.
            </p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ContactScreen;
