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
import { createContactList, getAllContactLists, updateContactList } from '../../../APIs/contactList';
import { toast } from 'react-toastify';

export interface ContactList {
    _id?: string;
    name: string;
    description?: string;
    sourceType:
    | 'facebook_instant_forms'
    | 'website_landing_page'
    | 'sign_up'
    | 'referral'
    | 'manual'
    | 'import'
    | 'other';
    sourceTypeId?: string;
    utmDefaults?: {
        source?: string;
        medium?: string;
        campaign?: string;
        content?: string;
        term?: string;
    };
    createdBy: string;
    createdAt?: string;
}

const sourceOptions: ContactList['sourceType'][] = [
    'facebook_instant_forms',
    'website_landing_page',
    'sign_up',
    'referral',
    'manual',
    'import',
    'other',
];

const ContactListScreen: React.FC = () => {
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [form, setForm] = useState<ContactList>({
        name: '',
        sourceType: 'other',
        createdBy: '',
    });
    const [loading, setLoading] = useState(false);

    const fetchContactLists = async () => {
        try {
            const res = await getAllContactLists();
            setContactLists(res);
        } catch (err) {
            console.error('Failed to fetch contact lists:', err);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            if (isEditMode && form._id) {
                await updateContactList(form._id, form);
                toast.success('Contact List updated successfully!');
            } else {
                await createContactList(form);
                toast.success('Contact List created successfully!');
            }
            fetchContactLists();
            handleClose();
        } catch (err) {
            console.error('Failed to save:', err);
            toast.error('Error while saving contact list.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (data: ContactList) => {
        setForm({ ...data });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleClose = () => {
        setForm({ name: '', sourceType: 'other', createdBy: '' });
        setIsEditMode(false);
        setShowModal(false);
    };

    useEffect(() => {
        fetchContactLists();
    }, []);

    const columns = [
        {
            name: 'Name',
            selector: (row: ContactList) => row.name,
            sortable: true,
        },
        {
            name: 'Source Type',
            selector: (row: ContactList) => row.sourceType,
        },
        {
            name: 'Source Type ID',
            selector: (row: ContactList) => row.sourceTypeId || '-',
        },
        {
            name: 'UTM Defaults',
            cell: (row: ContactList) =>
                row.utmDefaults
                    ? Object.entries(row.utmDefaults)
                          .filter(([_, v]) => v)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')
                    : '-',
        },
        {
            name: 'Created At',
            selector: (row: ContactList) =>
                new Date(row.createdAt || '').toLocaleString(),
        },
        {
            name: 'Actions',
            cell: (row: ContactList) => (
                <Button variant="outline-primary" size="sm" onClick={() => handleEdit(row)}>
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Contact Lists</h4>
                <Button onClick={() => setShowModal(true)}>Add Contact List</Button>
            </div>

            <DataTable
                columns={columns}
                data={contactLists}
                pagination
                highlightOnHover
                striped
                responsive
                dense
            />

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit' : 'Add'} Contact List</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Name *</Form.Label>
                                    <Form.Control
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, name: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Source Type</Form.Label>
                                    <Form.Select
                                        value={form.sourceType}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                sourceType: e.target.value as ContactList['sourceType'],
                                            }))
                                        }
                                    >
                                        {sourceOptions.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mt-2">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, description: e.target.value }))
                                }
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Source Type ID</Form.Label>
                            <Form.Control
                                value={form.sourceTypeId}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, sourceTypeId: e.target.value }))
                                }
                            />
                        </Form.Group>

                        <h6 className="mt-3">UTM Defaults</h6>
                        <Row>
                            {['source', 'medium', 'campaign', 'content', 'term'].map((key) => (
                                <Col md={4} key={key}>
                                    <Form.Group>
                                        <Form.Label>{key}</Form.Label>
                                        <Form.Control
                                            value={form.utmDefaults?.[key as keyof typeof form.utmDefaults] || ''}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    utmDefaults: {
                                                        ...f.utmDefaults,
                                                        [key]: e.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </Form.Group>
                                </Col>
                            ))}
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
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

export default ContactListScreen;
