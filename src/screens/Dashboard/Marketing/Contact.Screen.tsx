import React, { useEffect, useState } from 'react';
import {
    Button,
    Modal,
    Form,
    Row,
    Col,
    Spinner,
} from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { toast } from 'react-toastify';
import type { ContactList } from './ContactLists.Screen';
import {
    getAllContacts,
    createContact,
    updateContact,
} from '../../../APIs/contact'; // <-- replace with your actual paths
import { getAllContactLists } from '../../../APIs/contactList';
import { createAmazonS3 } from '../../../APIs/amazonS3';

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
    lead_type?: 'cold' | 'warm' | 'hot';
    lead_status?: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';
    remarks?: {
        comment: string;
        commentedBy?: string;
        fileLink?: string;
        file?: File; // temporary, for new uploads
    }[];
    status?: 'active' | 'inactive' | 'suspended';
    createdAt?: string;
}



const ContactScreen: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<Contact>({
        name: '',
        email: '',
        phone: '',
        other_data: {},
        contact_list_id: '',
        lead_utm: {},
        status: 'active',
    });

    const fetchData = async () => {
        try {
            const [contactsRes, contactListRes] = await Promise.all([
                getAllContacts(),
                getAllContactLists(),
            ]);
            setContacts(contactsRes);
            setContactLists(contactListRes);
        } catch (err) {
            console.error('Error loading data', err);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // 🔹 Upload remark files if any
            const remarksWithUploads = await Promise.all(
                (form.remarks || []).map(async (remark) => {
                    if ((remark as any).file) {
                        const file: File = (remark as any).file;

                        // Convert file to base64
                        const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                        });

                        // Upload to S3
                        const uploaded = await createAmazonS3({
                            fileName: `remarks/${Date.now()}_${file.name}`,
                            fileContent: base64,
                        });

                        return {
                            ...remark,
                            fileLink: uploaded.url, // assume API returns { url }
                            file: undefined,        // cleanup temp file
                        };
                    }
                    return remark;
                })
            );

            const payload = {
                ...form,
                remarks: remarksWithUploads,
            };

            // 🔹 Update or Create
            if (editingId) {
                await updateContact(editingId, payload);
                toast.success("Contact updated!");
            } else {
                await createContact(payload);
                toast.success("Contact created!");
            }

            // 🔹 Reset state
            setShowModal(false);
            setForm({
                name: "",
                email: "",
                phone: "",
                other_data: {},
                contact_list_id: {} as any,
                lead_utm: {},
                status: "active",
                remarks: [],
            });
            setEditingId(null);
            fetchData();

        } catch (err) {
            toast.error("Failed to save contact.");
            console.error(err);
        } finally {
            fetchData();
            setLoading(false);
        }
    };


    const columns = [
        {
            name: 'Name',
            selector: (row: Contact) => row.name,
            cell: (row: Contact) => (
                <div>
                    <a
                        href="#"
                        onClick={() => {
                            setForm(row);
                            setEditingId(row._id || null);
                            setShowModal(true);
                        }}
                    >
                        {row.name || '—'}
                    </a><br />
                    📧 {row.email || '-'}<br />
                    ⏰ {row.createdAt?.split("T")[0] || '-'}

                </div>
            ), sortable: true,
        },
        {
            name: 'Phone',
            selector: (row: Contact) => row.phone,
            cell: (row: Contact) => {
                return (
                    <div>
                        <a
                            className="btn btn-primary btn-sm me-2"
                            href={row.phone ? `tel:${row.phone}` : '#'}
                        >
                            {row.phone || '-'}
                        </a>
                        <a
                            className="btn btn-success btn-sm"
                            href={row.phone ? `https://wa.me/${row.phone}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginTop: '5px', fontSize: '10px' }}
                        >
                            💬 Whatsapp
                        </a>
                    </div>
                );
            },

        },
        {
            name: 'Other Data',
            cell: (row: Contact) =>
                row.other_data ? (
                    <div style={{ lineHeight: '1.5' }}>
                        {Object.entries(row.other_data)
                            .filter(([_, v]) => _ != "created_time" && v).reverse()
                            .map(([key, value]) => {
                                if (value === "shopify") {
                                    return (
                                        <div key={key}>
                                            <img src="https://cdn.shopify.com/shopifycloud/web/assets/v1/favicon-default-6cbad9de243dbae3.ico" width={50} />
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={key}>
                                            {value as string}
                                        </div>
                                    )
                                }
                            })
                        }
                    </div>
                ) : '-',
        },
        {
            name: 'Last Remark',
            cell: (row: Contact) => {
                const lastRemark = row.remarks ? row.remarks[row.remarks.length - 1] : null;
                return lastRemark ? (
                    <div style={{ lineHeight: '1.5' }}>
                        {lastRemark.comment}<br />
                        {lastRemark.fileLink && (
                            <a href={lastRemark.fileLink} target="_blank" rel="noopener noreferrer">
                                View File
                            </a>
                        )}
                    </div>
                ) : '-';
            },
        },
        {
            name: 'UTM',
            cell: (row: Contact) => (
                <>
                    {row.contact_list_id?.name}<br />
                    {row.lead_utm
                        ? Object.entries(row.lead_utm)
                            .filter(([_, v]) => v)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')
                        : '-'
                    }
                </>
            )
        },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Contacts</h4>
                <Button onClick={() => { setShowModal(true); setEditingId(null); }}>
                    Add Contact
                </Button>
            </div>

            <DataTable
                columns={columns as any}
                data={contacts}
                pagination
                paginationRowsPerPageOptions={[50, 100, 200, 500, 1000]}
                striped
                highlightOnHover
                responsive
            />

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Edit Contact' : 'Add Contact'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {/* Basic Details */}
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        value={form.name || ''}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, name: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control
                                        required
                                        value={form.email || ''}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, email: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-2">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        value={form.phone || ''}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, phone: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Contact List</Form.Label>
                                    <Form.Select
                                        value={form.contact_list_id?._id || form.contact_list_id || ''}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                contact_list_id: e.target.value as any,
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

                        {/* Lead Type & Status */}
                        <Row className="mt-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Lead Type</Form.Label>
                                    <Form.Select
                                        value={form.lead_type || 'cold'}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                lead_type: e.target.value as Contact['lead_type'],
                                            }))
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
                                        value={form.lead_status || 'new'}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                lead_status: e.target.value as Contact['lead_status'],
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


                        <h6 className="mt-3">Remarks</h6>

                        {form.remarks?.map((remark, idx) => (
                            <Row key={idx} className="mb-2">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Comment</Form.Label>
                                        <Form.Control
                                            value={remark.comment || ''}
                                            onChange={(e) => {
                                                const newRemarks = [...form.remarks as any];
                                                newRemarks[idx].comment = e.target.value;
                                                setForm((f) => ({ ...f, remarks: newRemarks }));
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label>File</Form.Label>
                                        {remark.fileLink ? (
                                            // Show file link if already uploaded
                                            <div>
                                                <a href={remark.fileLink} target="_blank" rel="noopener noreferrer">
                                                    View File
                                                </a>
                                            </div>
                                        ) : (
                                            // Upload new file
                                            <Form.Control
                                                type="file"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    if (e.target.files?.[0]) {
                                                        const file = e.target.files[0];
                                                        // Option 1: Upload immediately via API and store link
                                                        // Option 2: Store file in state for later upload when saving

                                                        // For now, store file object directly:
                                                        const newRemarks = [...form.remarks as any];
                                                        (newRemarks[idx] as any).file = file; // keep temp file
                                                        setForm((f) => ({ ...f, remarks: newRemarks }));
                                                    }
                                                }}
                                            />
                                        )}
                                    </Form.Group>
                                </Col>
                                <Col md={1} className="d-flex align-items-end">
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                remarks: f.remarks?.filter((_, i) => i !== idx) || [],
                                            }))
                                        }
                                    >
                                        ✕
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() =>
                                setForm((f) => ({
                                    ...f,
                                    remarks: [...(f.remarks || []), { comment: '', fileLink: '' }],
                                }))
                            }
                        >
                            + Add Remark
                        </Button>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default ContactScreen;
