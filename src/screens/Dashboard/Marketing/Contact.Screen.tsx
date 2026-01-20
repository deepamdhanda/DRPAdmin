import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Badge,
  Card,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import type { ContactList } from "./ContactLists.Screen";
import {
  getAllContacts,
  createContact,
  updateContact,
  deactivateContact,
  addRemarkToContact, // Ensure this is exported in your APIs/contact.ts
} from "../../../APIs/contact";
import { getAllContactLists } from "../../../APIs/contactList";
import { createAmazonS3 } from "../../../APIs/amazonS3";

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
  lead_status?: "new" | "contacted" | "qualified" | "lost" | "converted";
  remarks?: Remark[];
  status?: "active" | "inactive" | "suspended";
  createdAt?: string;
}

interface Remark {
  comment: string;
  commentedBy?: string;
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
}

// --- Helpers ---
const getLeadColor = (lead: string | undefined): string => {
  const colors = { cold: "#ef4444", warm: "#fde047", hot: "#22c55e" };
  return colors[lead as keyof typeof colors] || "#737373";
};

const getLeadStatusColor = (status: string | undefined): string => {
  const colors = {
    new: "#22c55e",
    contacted: "#fcd34d",
    qualified: "#22c55e",
    converted: "#16a34a",
    lost: "#ef4444",
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
  });

  const [newRemarkComment, setNewRemarkComment] = useState("");
  const [newRemarkFile, setNewRemarkFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [contactsRes, contactListRes] = await Promise.all([
        getAllContacts(),
        getAllContactLists(),
      ]);
      setContacts(contactsRes);
      setContactLists(contactListRes);
    } catch (err) {
      toast.error("Failed to load data");
    }
  }, []);

  useEffect(() => {
    fetchData();
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
        lead_type: contact.lead_type,
        lead_status: contact.lead_status,
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
  const handleLeadTypeChange = async (contactId: string, value: string) => {
    try {
      await updateContact(contactId, { lead_type: value });
      setRefetch(!refetch);
      toast.success("Lead type updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleLeadStatusChange = async (contactId: string, value: string) => {
    try {
      await updateContact(contactId, { lead_status: value });
      setRefetch(!refetch);
      toast.success("Lead status updated");
    } catch (err) {
      toast.error("Update failed");
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
      setShowRemarksModal(false);
    } catch (err) {
      toast.error("Failed to add remark");
    } finally {
      setRemarkLoading(false);
    }
  };

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
          <div style={{ fontSize: "11px", color: "#888" }}>
            ⏰ {row.createdAt?.split("T")[0]}
          </div>
          <span
            style={{
              fontSize: "11px",

              padding: "4px 10px",

              backgroundColor: `${getLeadColor(row.lead_type)}`,

              borderRadius: "5px",

              color: "#fff",

              textTransform: "capitalize",
            }}
          >
            {row.lead_type || "N/A"}
          </span>

          <span
            style={{
              fontSize: "11px",

              padding: "4px 10px",

              backgroundColor: getLeadStatusColor(row.lead_status),

              color: "#fff",

              textTransform: "capitalize",

              borderRadius: "5px",
            }}
          >
            {row.lead_status || "N/A"}
          </span>
        </div>
      ),
      sortable: true,
      width: "200px",
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
              href={`https://wa.me/${row.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
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
      name: "Other Data",
      cell: (row: Contact) => (
        <div style={{ fontSize: "12px" }}>
          {row.other_data
            ? Object.entries(row.other_data)
                .filter(([key, value]) => key !== "created_time" && value)
                .map(([key, value]) => (
                  <div key={key}>
                    {value === "shopify" ? (
                      <Badge bg="success">Shopify</Badge>
                    ) : (
                      String(value)
                    )}
                  </div>
                ))
            : "—"}
        </div>
      ),
      width: "130px",
    },
    {
      name: "Last Remark",
      cell: (row: Contact) => {
        const last = row.remarks?.[row.remarks.length - 1];
        return last ? (
          <div style={{ fontSize: "12px" }}>
            <div className="text-truncate" style={{ maxWidth: "150px" }}>
              {last.comment}
            </div>
            {last.fileLink && (
              <a
                href={last.fileLink}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "10px" }}
              >
                📎 View
              </a>
            )}
          </div>
        ) : (
          <span className="text-muted">—</span>
        );
      },
      width: "180px",
    },
    {
      name: "UTM",
      cell: (row: Contact) => (
        <div style={{ fontSize: "11px" }}>
          <div style={{ fontWeight: "600" }}>
            {row.contact_list_id?.name || "No List"}
          </div>
          {row.lead_utm &&
            Object.entries(row.lead_utm)
              .filter(([_, v]) => v)
              .slice(0, 2)
              .map(([k, v]) => (
                <div key={k}>
                  <strong>{k}:</strong> {String(v)}
                </div>
              ))}
        </div>
      ),
      width: "150px",
    },
    {
      name: "Actions",
      cell: (row: Contact) => (
        <div className="d-flex flex-column gap-2 py-2">
          <Form.Select
            size="sm"
            value={row.lead_type || ""}
            onChange={(e) => handleLeadTypeChange(row._id!, e.target.value)}
            style={{ fontSize: "11px" }}
          >
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
          </Form.Select>
          <Form.Select
            size="sm"
            value={row.lead_status || ""}
            onChange={(e) => handleLeadStatusChange(row._id!, e.target.value)}
            style={{ fontSize: "11px" }}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </Form.Select>
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => openRemarksModal(row)}
              style={{ fontSize: "10px" }}
            >
              Remarks ({row.remarks?.length || 0})
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (window.confirm("Delete?")) deactivateContact(row._id!);
              }}
              style={{ fontSize: "10px" }}
            >
              Del
            </Button>
          </div>
        </div>
      ),
      width: "180px",
    },
  ];

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Contact Database</h3>
        <Button onClick={() => openEditModal()}>+ Add New Contact</Button>
      </div>

      <DataTable
        columns={columns}
        data={contacts}
        pagination
        highlightOnHover
        responsive
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

      {/* --- Atomic Remarks Modal --- */}
      <Modal
        show={showRemarksModal}
        onHide={() => setShowRemarksModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Timeline: {selectedContact?.name || selectedContact?.email}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "#fbfbfb" }}>
          {/* Form to Push New Remark */}
          <Card className="border-primary mb-4">
            <Card.Body>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">Add Update</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="What's the status?"
                  value={newRemarkComment}
                  onChange={(e) => setNewRemarkComment(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Control
                  type="file"
                  size="sm"
                  onChange={(e: any) => setNewRemarkFile(e.target.files[0])}
                />
              </Form.Group>
              <Button
                className="w-100"
                onClick={handleAddRemark}
                disabled={remarkLoading}
              >
                {remarkLoading ? <Spinner size="sm" /> : "Post Remark"}
              </Button>
            </Card.Body>
          </Card>

          <h6 className="mb-3">History</h6>
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
                      <small className="text-primary fw-bold">Log Entry</small>
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
    </div>
  );
};

export default ContactScreen;
