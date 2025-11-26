import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { getAllOutgoingRemittances, updateOutgoingRemittance } from "../../APIs/outgoingRemittance";
import EditOutgoingRemittanceModal from "../../utils/EditOutgoingRemittanceModal";
import { Button } from "react-bootstrap";

export interface User {
    _id: string;
    name: string;
}

export interface OutgoingRemittance {
    _id: string;
    pool_name: string;
    totalAmount: number;
    remittanceDate: Date;
    status: string;
    masked_account_number: string;
    createdAt: string;
    orders: {
        order_id: string;
        channel_order_id: string;
        store_order_id: string;
        amount: number;
        awb_number?: string;
        courier_name?: string;
        channel_account_name?: string;
        product_sku_id?: string;
        product_sku_name?: string;
    }[];
    transfers: [any]
}


const OutgoingRemittances: React.FC = () => {
    const [outgoing_remittances, setOutgoingRemittances] = useState<OutgoingRemittance[]>([]);
    const [loading, setLoading] = useState(true); // Added loading state
    const [selectedRemittance, setSelectedRemittance] = useState<OutgoingRemittance | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleEditClick = (remittance: OutgoingRemittance) => {
        setSelectedRemittance(remittance);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedRemittance(null);
    };




    const handleModalSubmit = async (formData: any) => {
        const transfers = { transfers: formData }
        console.log(transfers)
        if (!formData) return;

        if (selectedRemittance?._id) {
            await updateOutgoingRemittance(selectedRemittance._id, transfers);
            fetchInitialData()
        }

        setSelectedRemittance(null);
        handleModalClose();
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [outgoing_remittancesData] = await Promise.all([
                getAllOutgoingRemittances(),
            ]);
            setOutgoingRemittances(outgoing_remittancesData);
        } catch (error) {
            console.error("Error loading outgoing_remittances or users", error);
        } finally {
            setLoading(false);
        }
    };


    const columns = [
        {
            name: "Pool Name",
            selector: (row: OutgoingRemittance) => <strong>{row.pool_name || "—"}</strong>,
            sortable: true,
        },
        {
            name: "No. of Orders",
            selector: (row: OutgoingRemittance) => row.orders?.length || 0,
            sortable: true,
        },
        {
            name: "Bank Details",
            selector: (row: OutgoingRemittance) => row.masked_account_number || 'NA',
            sortable: true,
        },
        {
            name: "Remittance Date",
            selector: (row: OutgoingRemittance) =>
                row.remittanceDate
                    ? new Date(row.remittanceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })
                    : "—",
            sortable: true,
        },
        {
            name: "Amount",
            selector: (row: OutgoingRemittance) => row.totalAmount,
            cell: (row: OutgoingRemittance) => {
                const totalTrensfered = row?.transfers?.reduce((sum: number, i: any) => sum + i.amount, 0)
                const totalAmount = row?.orders?.reduce((sum: number, i: any) => sum + i.amount, 0)
                return (
                    <div style={{ textAlign: "right" }}>
                        <strong>Total:</strong> ₹{totalAmount.toFixed(2) || "—"}{" "}
                        <br />
                        {
                            row.transfers?.length > 0 && <div>
                                <strong>
                                    Paid: {"\n"}
                                    <span style={{ color: "#f5891e", textDecoration: "underline" }}>₹{totalTrensfered.toFixed(2) || "—"} </span>
                                </strong>
                                <br />
                                {(totalAmount - totalTrensfered) > 0 && <div>< strong > Pending:</strong>{" "}
                                    ₹{(totalAmount - totalTrensfered).toFixed(2) || "—"}
                                </div>}
                            </div>
                        }
                    </div >
                )
            },
            sortable: true,
            // width: '200px'
        },
        {
            name: "Status",
            selector: (row: OutgoingRemittance) => row.status || "—",
            sortable: true,
            cell: (row: OutgoingRemittance) => (
                <span
                    className={`badge ${row.status === "pending"
                        ? "bg-warning"
                        : row.status === "completed"
                            ? "bg-success"
                            : "bg-primary"
                        }`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            name: "Action",
            cell: (row: OutgoingRemittance) => (
                <Button size="sm" onClick={() => handleEditClick(row)}>Edit</Button>
            ),
        },
    ];

    const ExpandedComponent = ({ data: row }: any) => {

        const orderColumns = [
            {
                name: "Order Id",
                selector: (row: OutgoingRemittance['orders'][number]) => row.order_id,
                cell: (row: OutgoingRemittance['orders'][number]) => (<>#{row.order_id || "—"}    </>),
                sortable: true,
            },
            {
                name: "Channel Details",
                selector: (row: OutgoingRemittance['orders'][number]) => row.store_order_id,
                cell: (row: OutgoingRemittance['orders'][number]) => (
                    <div>
                        <strong>Channel OID:</strong> {row.channel_order_id || "—"}{" "}
                        <br />
                        <strong>
                            Store OID: {"\n"}
                            <span style={{ color: "#f5891e", textDecoration: "underline" }}>{row.store_order_id || "—"} </span>
                        </strong>
                        <br />
                        <strong>Channel:</strong>{" "}
                        {row.channel_account_name || "—"}
                    </div>
                ),
                sortable: true,
            },
            {
                name: "AWB Number",
                selector: (row: OutgoingRemittance['orders'][number]) => row.courier_name,
                cell: (row: OutgoingRemittance['orders'][number]) => (
                    <div style={{ fontSize: "13px", lineHeight: "1.5" }}>

                        {row?.courier_name || "—"} <br />
                        🚚{"\n"}
                        <span style={{ color: "#f5891e", textDecoration: "underline" }}> {row.awb_number || "—"} </span>
                    </div >
                ),
                sortable: true,
            },
            {
                name: "Product",
                selector: (row: OutgoingRemittance['orders'][number]) => row.product_sku_id,
                cell: (row: OutgoingRemittance['orders'][number]) =>
                    <div style={{ fontSize: "13px", lineHeight: "1.5" }}>

                        {row?.product_sku_name || "—"} <br />
                        <span style={{ color: "#f5891e", textDecoration: "underline" }}> {row.product_sku_id || "—"} </span>
                    </div >,
                sortable: true,
            },
            {
                name: "Total Amount",
                selector: (row: OutgoingRemittance['orders'][number]) => `₹${row.amount || 0}`,
                sortable: true,
            }
        ];
        return (
            <div
                style={{
                    padding: "15px",
                    backgroundColor: "#f0f0f0",
                    borderLeft: "4px solid #F5891E", // your brand orange
                    margin: "10px 0",
                    fontSize: "0.9rem",
                    color: "#333",
                }}
            >
                <h6>Orders:</h6>
                <DataTable
                    // title="Your COD Remittances"
                    data={row.orders}
                    columns={orderColumns as any}
                    // highlightOnHover
                    // pagination
                    // paginationRowsPerPageOptions={[10, 20, 50, 100, 200, 500, 1000]}
                    responsive
                // striped
                // persistTableHead
                // expandableRows
                // expandableRowsComponent={ExpandedComponent}
                />
                {/* <ul>
          {row.orders.map((order: any) => (
            <li key={order._id}>
              Order ID: {order.orderId}, Amount: ₹{order.amount}, Courier: {order.courierPartner}
            </li>
          ))}
        </ul> */}
            </div>
        )
    }
    return (
        <div className="container mt-4 ms-2 me-2">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>COD Remittances</h4>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : outgoing_remittances.length === 0 ? (
                <p>No cod remittances found.</p>
            ) : (
                <DataTable
                    title="Your COD Remittances"
                    data={outgoing_remittances}
                    columns={columns as any}
                    highlightOnHover
                    pagination
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 200, 500, 1000]}
                    responsive
                    striped
                    persistTableHead
                    expandableRows
                    expandableRowsComponent={ExpandedComponent}
                />
            )}

            <EditOutgoingRemittanceModal
                show={showModal}
                onHide={handleModalClose}
                onSubmit={handleModalSubmit}
                remittance={selectedRemittance}
            />
        </div>
    );
};

export { OutgoingRemittances };