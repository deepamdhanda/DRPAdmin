import React, { useEffect, useState, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import type { TableColumn } from 'react-data-table-component'
import axios from 'axios';
import { getAllTickets } from '../../APIs/ticket';

type Ticket = {
    _id: string;
    subject: string;
    description: string;
    category: { _id: string; name: string };
    subcategory: { _id: string; name: string };
    status: 'open' | 'closed' | 'pending' | 'escalated';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdBy: { name: string };
    attachments: string[];
    isEscalated: boolean;
    replies: Array<{ text: string; createdAt: string; repliedBy: string }>;
    slaDueBy: string;
    createdAt: string;
    updatedAt: string;
};

const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#d32f2f',
    high: '#f57c00',
    medium: '#fbc02d',
    low: '#388e3c',
};

const STATUS_COLORS: Record<string, string> = {
    open: '#0288d1',
    pending: '#f9a825',
    closed: '#4caf50',
    escalated: '#b71c1c',
};

const PAGE_SIZE = 30;

const TicketScreen: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
    const [filters, setFilters] = useState<{ status?: string; priority?: string }>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        setLoading(true);
        getAllTickets()
            .then((res) => setTickets(res))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Filtering & Searching
    const filteredTickets = useMemo(() => {
        let filtered = tickets;
        if (filters.status) filtered = filtered.filter((t) => t.status === filters.status);
        if (filters.priority) filtered = filtered.filter((t) => t.priority === filters.priority);
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.subject.toLowerCase().includes(term) ||
                    t._id.toLowerCase().includes(term) ||
                    t.category.name.toLowerCase().includes(term) ||
                    t.subcategory.name.toLowerCase().includes(term),
            );
        }
        if (filtered.length > 0) {
            filtered = filtered.sort((a, b) => new Date(a.slaDueBy).getTime() - new Date(b.slaDueBy).getTime());
        }
        return filtered;
    }, [tickets, filters, searchTerm]);

    // Columns for DataTable
    const columns: TableColumn<Ticket>[] = [
        {
            name: 'Subject',
            selector: (row) => row.subject,
            sortable: true,
            wrap: true,
            cell: (row) => (
                <>
                    <div>
                        <strong>{row.subject}</strong>{' '}
                        <span style={{ color: PRIORITY_COLORS[row.priority] || '#999', fontWeight: 'bold' }}>
                            [{row.priority.toUpperCase()}]
                        </span>{' '}
                        {row.isEscalated && (
                            <span style={{ color: 'red', fontWeight: 'bold', marginLeft: 6 }}>🚩 Escalated</span>
                        )}
                    </div>
                </>
            ),
        },
        {
            name: 'Status',
            selector: (row) => row.status,
            sortable: true,
            wrap: true,
            cell: (row) => (
                <>
                    <small>
                        <span style={{ color: STATUS_COLORS[row.status] || '#000' }}>{row.status}</span>
                    </small>
                </>
            ),
        },
        {
            name: 'Due Date',
            selector: (row) => row.slaDueBy,
            sortable: true,
            wrap: true,
            cell: (row) => (
                <>
                    <small>
                        {new Date(row.slaDueBy).toLocaleString()}
                    </small>
                </>
            ),
        },
        {
            name: 'Created By',
            selector: (row) => row.subject,
            sortable: true,
            wrap: true,
            cell: (row) => (
                <>
                    <div>
                        <strong>{row.createdBy.name}</strong>
                    </div>
                </>
            ),
        },
        {
            name: 'Category',
            selector: (row) => row.category.name,
            sortable: true,
        },
        {
            name: 'Subcategory',
            selector: (row) => row.subcategory.name,
            sortable: true,
        },
        {
            name: 'Created At',
            selector: (row) => new Date(row.createdAt).toLocaleString(),
            sortable: true,
            maxWidth: '180px',
        },
    ];

    // Expandable component for showing description, attachments, replies, and reply box
    const ExpandedComponent: React.FC<{ data: Ticket }> = ({ data }) => {
        return (
            <div style={{ padding: 16, backgroundColor: '#fafafa', borderRadius: 8, marginTop: 8 }}>
                <p>{data.description}</p>

                {data.attachments?.length > 0 && (
                    <div style={{ margin: '8px 0' }}>
                        <strong>Attachments:</strong>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {data.attachments.map((url, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ width: 80, height: 80, display: 'block' }}
                                >
                                    <img
                                        src={url}
                                        alt={`Attachment ${i + 1}`}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 8 }}>
                    <strong>Replies:</strong>
                    {data.replies.length === 0 ? (
                        <p>No replies yet.</p>
                    ) : (
                        data.replies.map((r, i) => (
                            <div
                                key={i}
                                style={{
                                    backgroundColor: '#f4f4f4',
                                    padding: 8,
                                    borderRadius: 6,
                                    marginBottom: 6,
                                }}
                            >
                                <small style={{ color: '#555' }}>
                                    {new Date(r.createdAt).toLocaleString()} by {r.repliedBy}
                                </small>
                                <p style={{ margin: '4px 0' }}>{r.text}</p>
                            </div>
                        ))
                    )}
                </div>

                <textarea
                    placeholder="Type your reply here..."
                    rows={3}
                    value={replyTexts[data._id] || ''}
                    onChange={(e) => handleReplyChange(data._id, e.target.value)}
                    style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 4 }}
                />
                <button
                    onClick={() => sendReply(data._id)}
                    disabled={!replyTexts[data._id]?.trim()}
                    style={{ marginTop: 6 }}
                >
                    Send Reply
                </button>
            </div>
        );
    };

    const handleReplyChange = (id: string, text: string) => {
        setReplyTexts((prev) => ({ ...prev, [id]: text }));
    };

    const sendReply = async (ticketId: string) => {
        if (!replyTexts[ticketId]?.trim()) return;
        try {
            await axios.post(`/api/tickets/${ticketId}/reply`, { message: replyTexts[ticketId] });
            alert('Reply sent');
            setReplyTexts((prev) => ({ ...prev, [ticketId]: '' }));
            // TODO: Refresh or update ticket replies in state here for instant UI update
        } catch {
            alert('Failed to send reply');
        }
    };

    const handleBulkClose = async () => {
        if (selectedTickets.length === 0) return alert('Select tickets first');
        try {
            await axios.post('/api/tickets/bulk-close', { ids: selectedTickets.map((t) => t._id) });
            alert('Tickets closed!');
            // TODO: Refresh tickets after bulk close
        } catch {
            alert('Error closing tickets');
        }
    };

    return (
        <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
            <h4>Support Tickets Dashboard</h4>

            {/* Filters + Search */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Search by subject, ID, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
                <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                    <option value="escalated">Escalated</option>
                </select>
                <select
                    value={filters.priority || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined }))}
                >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <button onClick={() => {
                    setFilters({})
                    setSearchTerm('')
                }}>Reset Filters</button>
            </div>

            {/* Bulk Actions */}
            <div style={{ marginBottom: 12 }}>
                <button onClick={handleBulkClose} disabled={selectedTickets.length === 0}>
                    Close Selected ({selectedTickets.length})
                </button>
            </div>

            <DataTable
                columns={columns}
                data={filteredTickets}
                progressPending={loading}
                pagination
                paginationPerPage={PAGE_SIZE}
                selectableRows
                selectableRowsHighlight
                onSelectedRowsChange={({ selectedRows }) => setSelectedTickets(selectedRows)}
                expandableRows
                expandableRowsComponent={ExpandedComponent}
                highlightOnHover
                persistTableHead
                paginationRowsPerPageOptions={[10, 20, 30, 50]}
                noDataComponent="No tickets found."
                striped
                conditionalRowStyles={[
                    {
                        when: (row) => row.isEscalated,
                        style: {
                            backgroundColor: '#ffebee',
                        },
                    },
                ]}
            />
        </div>
    );
};

export default TicketScreen;
