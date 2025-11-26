import { useEffect, useRef, useState } from "react";
import { Button, Modal, Form, Spinner } from "react-bootstrap";
import DataTable from "react-data-table-component";
import EmailEditor from "react-email-editor";
import {
    createEmailTemplate,
    getAllEmailTemplates,
    getEmailTemplateById,
    updateEmailTemplate
} from "../../../APIs/emailTemplate";
import { toast } from "react-toastify";
import basicTemplate from "../../../utils/emailTemplate.json";

export type EmailTemplate = {
    _id?: string;
    name: string;
    subject: string;
    variables: string[];
    bodyHtml?: string;
    approved?: boolean;
    bodyJson?: any; // JSON representation of the email body
};

const EmailTemplatesScreen = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isPreview, setIsPreview] = useState(false);
    const emailEditorRef = useRef<any>(null);

    useEffect(() => {
        getAllEmailTemplates().then((res) => {
            setTemplates(res);
            setLoading(false);
        });
    }, [showModal]);


    const handleEdit = async (id: string) => {
        const res = await getEmailTemplateById(id);
        if (selectedTemplate?.bodyHtml && emailEditorRef.current) {
            emailEditorRef.current.editor.loadHtml(selectedTemplate.bodyHtml);
        }
        setSelectedTemplate(res);
        setShowModal(true);
        setIsPreview(false);
    };

    const handlePreview = async (id: string) => {
        const res = await getEmailTemplateById(id);
        setSelectedTemplate(res);
        setIsPreview(true);
        setShowModal(true);
    };

    const handleCreate = () => {
        setSelectedTemplate({
            name: "",
            subject: "",
            variables: [],
        });
        setIsPreview(false);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;

        emailEditorRef.current?.editor.exportHtml(async (data: any) => {
            console.log("Exported JSON:", data.design);
            const updatedTemplate = { ...selectedTemplate, bodyHtml: data.html, bodyJson: data.design };
            if (updatedTemplate._id) {
                await updateEmailTemplate(updatedTemplate._id, updatedTemplate);
            } else {
                await createEmailTemplate(updatedTemplate);
            }

            setShowModal(false);
            setSelectedTemplate(null);
        });
    };

    const columns = [
        { name: "Name", selector: (row: EmailTemplate) => row.name, sortable: true },
        { name: "Subject", selector: (row: EmailTemplate) => row.subject, sortable: true },
        { name: "Approved", selector: (row: EmailTemplate) => (row.approved ? "✅" : "❌") },
        {
            name: "Actions",
            cell: (row: EmailTemplate) => (
                <>
                    <Button size="sm" variant="primary" onClick={() => handleEdit(row._id!)}>Edit</Button>{" "}
                    <Button size="sm" variant="info" onClick={() => handlePreview(row._id!)}>Preview</Button>
                </>
            ),
        },
    ];
    const loadDesign = (design: any) => {
        if (emailEditorRef.current) {
            emailEditorRef.current.editor.loadDesign(design);
        }
    };

    return (
        <div className="container mt-4">
            <h3>Email Templates</h3>
            <Button variant="primary" onClick={handleCreate}>+ New Template</Button>

            {loading ? (
                <Spinner animation="border" className="mt-3" />
            ) : (
                <DataTable columns={columns} data={templates} pagination className="mt-3" />
            )}

            <Modal size="xl" show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isPreview ? `Preview Email Template` : selectedTemplate?._id ? "Edit Template" : "Create Template"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTemplate && !isPreview && (
                        <Form>
                            <Form.Group>
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    required
                                    value={selectedTemplate.name}
                                    onChange={(e) =>
                                        setSelectedTemplate({ ...selectedTemplate, name: e.target.value })
                                    }
                                />
                            </Form.Group>

                            <Form.Group className="mt-2">
                                <Form.Label>Subject</Form.Label>
                                <Form.Control
                                    required
                                    value={selectedTemplate.subject}
                                    onChange={(e) =>
                                        setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })
                                    }
                                />
                            </Form.Group>

                            <Form.Group className="mt-2">
                                <Form.Label>Variables (comma-separated)</Form.Label>
                                <Form.Control
                                    value={selectedTemplate.variables.join(",")}
                                    onChange={(e) =>
                                        setSelectedTemplate({
                                            ...selectedTemplate,
                                            variables: e.target.value.split(",").map((v) => v.trim()),
                                        })
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Button variant="secondary" onClick={() => {
                                    const value = selectedTemplate?.bodyJson || {};
                                    if (!value) return;
                                    const text = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
                                    navigator.clipboard.writeText(text)
                                        .then(() => {
                                            toast.success("Template JSON copied to clipboard!");
                                        })
                                        .catch(() => {
                                            toast.error("Failed to copy!");
                                        });
                                }
                                }>Copy</Button>
                                <Button variant="secondary" onClick={async () => {
                                    const text = await navigator.clipboard.readText();
                                    let value;
                                    try {
                                        value = JSON.parse(text);
                                    } catch {
                                        value = text;
                                    }
                                    setSelectedTemplate({ ...selectedTemplate, bodyJson: value });
                                    loadDesign(value || {})
                                    toast.info("Template JSON pasted from clipboard!");
                                }}>Paste</Button>
                                <Button variant="secondary" onClick={async () => {
                                    let value = basicTemplate
                                    setSelectedTemplate({ ...selectedTemplate, bodyJson: value });
                                    loadDesign(value || {})
                                    toast.info("Template JSON pasted from clipboard!");
                                }}>Set Template</Button>
                            </Form.Group>

                            <div className="mt-4">
                                <EmailEditor ref={emailEditorRef} onLoad={() => {
                                    loadDesign(selectedTemplate?.bodyJson || {});
                                }}
                                    options={{ displayMode: "email" }}
                                />
                            </div>
                        </Form>
                    )}

                    {selectedTemplate && isPreview && (
                        <div>
                            <p><b>Name:</b> {selectedTemplate.name}</p>
                            <p><b>Subject:</b> {selectedTemplate.subject}</p>
                            <p><b>Variables:</b> {selectedTemplate.variables.join(", ")}</p>
                            <hr />
                            {selectedTemplate?.bodyHtml ? (
                                <div
                                    className="border p-3"
                                    style={{ background: "#fff", maxHeight: "70vh", overflowY: "auto" }}
                                    dangerouslySetInnerHTML={{ __html: selectedTemplate.bodyHtml }}
                                    key={selectedTemplate._id} // force rerender if modal is reused
                                />
                            ) : (
                                <p>No body available.</p>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!isPreview && <Button onClick={handleSave}>Save</Button>}
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EmailTemplatesScreen;
