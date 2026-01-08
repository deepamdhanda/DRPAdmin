import React, { useEffect, useState, useCallback } from "react";
import { Button, Modal, Form, Row, Col, Spinner, Badge } from "react-bootstrap";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import type { ContactList } from "./ContactLists.Screen";
import {
  getAllContacts,
  createContact,
  updateContact,
  deactivateContact,
} from "../../../APIs/contact";
import { getAllContactLists } from "../../../APIs/contactList";
import { createAmazonS3 } from "../../../APIs/amazonS3";

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
  file?: File;
  createdAt?: string;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  other_data: any;
  contact_list_id: string;
  lead_utm: any;
  status: string;
  newRemark?: string;
  newRemarkFile?: File;
  lead_type?: string;
  lead_status?: string;
}

const getLeadColor = (lead: string | undefined): string => {
  const colors = {
    cold: "#60a5fa",
    warm: "#fcd34d",
    hot: "#f97316",
  };
  return colors[lead as keyof typeof colors] || "#737373";
};

const getLeadStatusColor = (
  status: "new" | "contacted" | "qualified" | "lost" | "converted" | undefined
): string => {
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState<Remark[]>([]);

  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    other_data: {},
    contact_list_id: "",
    lead_utm: {},
    status: "active",
    newRemark: "",
    lead_type: "",
    lead_status: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [contactsRes, contactListRes] = await Promise.all([
        getAllContacts(),
        getAllContactLists(),
      ]);
      setContacts(contactsRes);
      setContactLists(contactListRes);
    } catch (err) {
      console.error("Error loading data", err);
      toast.error("Failed to load contacts");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refetch]);

  const deleteEntry = async (id: string) => {
    try {
      await deactivateContact(id);
      setRefetch(!refetch);
    } catch (err) {
      console.log(err);
    }
  };
  const resetForm = useCallback(() => {
    setForm({
      name: "",
      email: "",
      phone: "",
      other_data: {},
      contact_list_id: "",
      lead_utm: {},
      status: "active",
      newRemark: "",
      lead_status: "",
      lead_type: "",
    });
    setEditingId(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const openEditModal = useCallback((contact: Contact) => {
    setForm({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      other_data: contact.other_data || {},
      contact_list_id:
        typeof contact.contact_list_id === "object"
          ? contact.contact_list_id?._id || ""
          : contact.contact_list_id || "",
      lead_utm: contact.lead_utm || {},
      status: contact.status || "active",
      newRemark: "",
      lead_status: "",
      lead_type: "",
    });
    setEditingRemarks(contact.remarks || []);
    setEditingId(contact._id || null);
    setShowModal(true);
  }, []);

  const handleSave = async () => {
    if (!form.email) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);

      let payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        other_data: form.other_data,
        contact_list_id: form.contact_list_id,
        lead_utm: form.lead_utm,
        status: form.status,
      };

      if (editingId) {
        let allRemarks = [...editingRemarks];

        if (form.newRemark || form.newRemarkFile) {
          let fileLink = "";

          if (form.newRemarkFile) {
            const base64 = await convertFileToBase64(form.newRemarkFile);
            const uploaded = await createAmazonS3({
              fileName: `remarks/${Date.now()}_${form.newRemarkFile.name}`,
              fileContent: base64,
            });
            fileLink = uploaded.url;
          }

          const newRemark: Remark = {
            comment: form.newRemark || "",
            fileLink,
            createdAt: new Date().toISOString(),
          };

          allRemarks.push(newRemark);
        }

        payload.remarks = allRemarks;
      }

      if (editingId) {
        await updateContact(editingId, payload);
        toast.success("Contact updated successfully");
      } else {
        await createContact(payload);
        toast.success("Contact created successfully");
      }

      setShowModal(false);
      resetForm();
      setEditingRemarks([]);
      fetchData();
    } catch (err) {
      toast.error("Failed to save contact");
      console.error(err);
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
      toast.error("Failed to update lead type");
      console.error(err);
    }
  };

  const handleLeadStatusChange = async (contactId: string, value: string) => {
    try {
      await updateContact(contactId, { lead_status: value });
      setRefetch(!refetch);
      toast.success("Lead status updated");
    } catch (err) {
      toast.error("Failed to update lead status");
      console.error(err);
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
              marginBottom: "6px",
              fontSize: "15px",
              textDecoration: "underline",
              color: "blue",
            }}
          >
            {row.name || "—"}
          </div>
          <div style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>
            📧 {row.email || "-"}
          </div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
            ⏰ {row.createdAt?.split("T")[0] || "-"}
          </div>
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
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
        </div>
      ),
      sortable: true,
      width: "250px",
    },
    {
      name: "Phone",
      selector: (row: Contact) => row.phone || "",
      cell: (row: Contact) => (
        <div>
          <div
            style={{
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#0066cc",
            }}
          >
            {row.phone || "-"}
          </div>
          {row.phone && (
            <a
              href={`https://wa.me/${row.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "13px",
                color: "#25D366",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      ),
      width: "150px",
    },
    {
      name: "Other Data",
      cell: (row: Contact) =>
        row.other_data ? (
          <div style={{ fontSize: "13px" }}>
            {Object.entries(row.other_data)
              .filter(([key, value]) => key !== "created_time" && value)
              .reverse()
              .map(([key, value]) => {
                if (value === "shopify") {
                  return (
                    <Badge
                      key={key}
                      bg="success"
                      style={{
                        marginRight: "4px",
                        fontSize: "11px",
                        padding: "4px 8px",
                      }}
                    >
                      Shopify
                    </Badge>
                  );
                }
                return (
                  <div key={key} style={{ marginBottom: "4px" }}>
                    {value as string}
                  </div>
                );
              })}
          </div>
        ) : (
          "-"
        ),
      width: "150px",
    },
    {
      name: "Last Remark",
      cell: (row: Contact) => {
        const lastRemark = row.remarks?.[row.remarks.length - 1];
        return (
          <div style={{ fontSize: "13px" }}>
            {lastRemark ? (
              <>
                <div style={{ marginBottom: "6px", lineHeight: "1.4" }}>
                  {lastRemark.comment.substring(0, 50)}
                  {lastRemark.comment.length > 50 ? "..." : ""}
                </div>
                {lastRemark.fileLink && (
                  <a
                    href={lastRemark.fileLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                  >
                    📎 View File
                  </a>
                )}
              </>
            ) : (
              "-"
            )}
          </div>
        );
      },
      width: "200px",
    },
    {
      name: "UTM",
      cell: (row: Contact) => (
        <div style={{ fontSize: "12px" }}>
          <div
            style={{ fontWeight: "600", marginBottom: "6px", fontSize: "13px" }}
          >
            {row.contact_list_id?.name || "-"}
          </div>
          {row.lead_utm &&
            Object.entries(row.lead_utm)
              .filter(([_, v]) => v)
              .map(([k, v]) => (
                <div key={k} style={{ marginBottom: "3px" }}>
                  <strong>{k}:</strong> {v}
                </div>
              ))}
        </div>
      ),
      width: "180px",
    },
    {
      name: "Actions",
      cell: (row: Contact) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "10px 0",
          }}
        >
          <Form.Select
            size="sm"
            value={row.lead_type || ""}
            onChange={(e) => handleLeadTypeChange(row._id!, e.target.value)}
            style={{ fontSize: "13px", fontWeight: "500" }}
          >
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
          </Form.Select>
          <Form.Select
            size="sm"
            value={row.lead_status || ""}
            onChange={(e) => handleLeadStatusChange(row._id!, e.target.value)}
            style={{ fontSize: "13px", fontWeight: "500" }}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </Form.Select>
          <button onClick={() => deleteEntry(row._id || "")}>
            Delete Entry
          </button>
        </div>
      ),
      width: "150px",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Contacts</h2>
        <Button onClick={openCreateModal}>Add Contact</Button>
      </div>

      <DataTable
        columns={columns}
        data={contacts}
        pagination
        highlightOnHover
        striped
      />

      {/* Edit/Create Contact Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "Edit Contact" : "Add Contact"}
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Email <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact List</Form.Label>
                  <Form.Select
                    value={form.contact_list_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        contact_list_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {contactLists.map((cl) => (
                      <option key={cl._id} value={cl._id}>
                        {cl.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {!editingId && (
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Lead Type</Form.Label>
                    <Form.Select
                      value={form.lead_type || "cold"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lead_type: e.target.value as Contact["lead_type"],
                        })
                      }
                    >
                      <option value="cold">Cold</option>
                      <option value="warm">Warm</option>
                      <option value="hot">Hot</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Lead Status</Form.Label>
                    <Form.Select
                      value={form.lead_status || "new"}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          lead_status: e.target.value as Contact["lead_status"],
                        }))
                      }
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="lost">Lost</option>
                      <option value="converted">Converted</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            {editingId && (
              <>
                <hr />
                <h6 style={{ marginBottom: "15px" }}>Remarks</h6>

                {/* Display existing remarks for editing */}
                {showRemarksModal &&
                  editingRemarks.map((remark, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-2">
                            <Form.Label
                              style={{ fontSize: "13px", fontWeight: "600" }}
                            >
                              Comment
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={remark.comment}
                              onChange={(e) => {
                                const updated = [...editingRemarks];
                                updated[idx].comment = e.target.value;
                                setEditingRemarks(updated);
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          {remark.fileLink && (
                            <div style={{ marginBottom: "8px" }}>
                              <a
                                href={remark.fileLink}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: "13px", fontWeight: "600" }}
                              >
                                📎 Current File
                              </a>
                            </div>
                          )}
                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: "13px" }}>
                              Replace File (optional)
                            </Form.Label>
                            <Form.Control
                              type="file"
                              size="sm"
                              onChange={async (e: any) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const base64 = await convertFileToBase64(
                                    file
                                  );
                                  const uploaded = await createAmazonS3({
                                    fileName: `remarks/${Date.now()}_${
                                      file.name
                                    }`,
                                    fileContent: base64,
                                  });
                                  const updated = [...editingRemarks];
                                  updated[idx].fileLink = uploaded.url;
                                  setEditingRemarks(updated);
                                  toast.success("File uploaded");
                                }
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          const updated = editingRemarks.filter(
                            (_, i) => i !== idx
                          );
                          setEditingRemarks(updated);
                        }}
                      >
                        Delete Remark
                      </Button>
                    </div>
                  ))}

                {/* Add new remark section */}
                <div
                  style={{
                    padding: "12px",
                    border: "2px dashed #0d6efd",
                    borderRadius: "6px",
                    backgroundColor: "#f0f8ff",
                  }}
                >
                  <h6 style={{ marginBottom: "10px", color: "#0d6efd" }}>
                    Add New Remark
                  </h6>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={form.newRemark}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              newRemark: e.target.value,
                            }))
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Attachment</Form.Label>
                        <Form.Control
                          type="file"
                          onChange={(e: any) => {
                            if (e.target.files?.[0]) {
                              setForm((f) => ({
                                ...f,
                                newRemarkFile: e.target.files[0],
                              }));
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
                <button
                  className="btn btn-sm btn-outline-primary my-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowRemarksModal(!showRemarksModal);
                  }}
                >
                  {showRemarksModal ? "Hide" : "Show"} Remarks
                </button>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ContactScreen;
