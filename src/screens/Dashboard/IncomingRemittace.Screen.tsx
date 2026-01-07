import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { getAllIncomingRemittances, updateIncomingRemittance } from "../../APIs/incomingRemittance";
import EditIncomingRemittanceModal from "../../utils/EditIncomingRemittanceModal";
import { Button } from "react-bootstrap";

export interface User {
    _id: string;
    name: string;
}

export interface IncomingRemittance {
    _id: string;
    pool_name: string;
    totalAmount: number;
    remittanceDate: Date;
    status: string;
    masked_account_number: string;
    createdAt: string;
    codAmount: number;
    courierCommission: number;
    tdsAmount: number;
    tcsAmount: number;
    netAmountReceived: number;
    receivedDate: Date;
    orders: {
        order_id: string;
        channel_order_id: string;
        store_order_id: string;
        amount: number;
        awb_number?: string;
        courier_name?: string;
        channel_account_name?: string;
        pool_name?: string;
        product_sku_id?: string;
        product_sku_name?: string;
    }[];
    transfers: [any]
}


const IncomingRemittances: React.FC = () => {
    const [incoming_remittances, setIncomingRemittances] = useState<IncomingRemittance[]>([]);
    const [loading, setLoading] = useState(true); // Added loading state
    const [selectedRemittance, setSelectedRemittance] = useState<IncomingRemittance | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleEditClick = (remittance: IncomingRemittance) => {
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
            await updateIncomingRemittance(selectedRemittance._id, transfers);
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
            const [incoming_remittancesData] = await Promise.all([
                getAllIncomingRemittances(),
            ]);
            setIncomingRemittances(incoming_remittancesData);
        } catch (error) {
            console.error("Error loading incoming_remittances or users", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            name: "Reference ID",
            selector: (row: IncomingRemittance) => row._id || "—",
            sortable: true,
            minWidth: "200px",
        },
        {
            name: "No. of Orders",
            selector: (row: IncomingRemittance) => row.orders?.length || 0,
            sortable: true,
        },
        {
            name: "COD Amount",
            selector: (row: IncomingRemittance) => row.codAmount,
            cell: (row: IncomingRemittance) => (
                <span>₹{row.codAmount?.toFixed(2) || "—"}</span>
            ),
            sortable: true,
            right: true,
        },
        {
            name: "Deductions",
            cell: (row: IncomingRemittance) => (
                <div style={{ textAlign: "right" }}>
                    <div>Courier: ₹{row.courierCommission?.toFixed(2) || "0.00"}</div>
                    <div>TDS: ₹{row.tdsAmount?.toFixed(2) || "0.00"}</div>
                    <div>TCS: ₹{row.tcsAmount?.toFixed(2) || "0.00"}</div>
                </div>
            ),
            sortable: false,
        },
        {
            name: "Net Received",
            selector: (row: IncomingRemittance) => row.netAmountReceived,
            cell: (row: IncomingRemittance) => (
                <strong>₹{row.netAmountReceived?.toFixed(2) || "—"}</strong>
            ),
            sortable: true,
            right: true,
        },
        {
            name: "Received Date",
            selector: (row: IncomingRemittance) =>
                row.receivedDate
                    ? new Date(row.receivedDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })
                    : "—",
            sortable: true,
        },
        {
            name: "Status",
            selector: (row: IncomingRemittance) => row.status || "—",
            cell: (row: IncomingRemittance) => (
                <span
                    className={`badge ${row.status === "pending"
                        ? "bg-warning"
                        : row.status === "paid"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                >
                    {row.status}
                </span>
            ),
            sortable: true,
        },
        {
            name: "Action",
            cell: (row: IncomingRemittance) => (
                <Button size="sm" onClick={() => handleEditClick(row)}>
                    Edit
                </Button>
            ),
        },
    ];


    const ExpandedComponent = ({ data: row }: any) => {

        const orderColumns = [
            {
                name: "Order Id",
                selector: (row: IncomingRemittance['orders'][number]) => row.order_id,
                cell: (row: IncomingRemittance['orders'][number]) => (
                    <>#{row.order_id || "—"}</>
                ),
                sortable: true,
            },
            {
                name: "Channel Details",
                selector: (row: IncomingRemittance['orders'][number]) => row.store_order_id,
                cell: (row: IncomingRemittance['orders'][number]) => (
                    <div>
                        <strong>Channel OID:</strong> {row.channel_order_id || "—"}
                        <br />
                        <strong>
                            Store OID:{" "}
                            <span style={{ color: "#f5891e", textDecoration: "underline" }}>
                                {row.store_order_id || "—"}
                            </span>
                        </strong>
                        <br />
                        <strong>Channel:</strong> {row.channel_account_name || "—"}
                        <br />
                        <strong>Pool:</strong> {row.pool_name || "—"}
                    </div>
                ),
                sortable: true,
            },
            {
                name: "AWB Number",
                selector: (row: IncomingRemittance['orders'][number]) => row.awb_number,
                cell: (row: IncomingRemittance['orders'][number]) => (
                    <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                        {row?.courier_name || "—"} <br />
                        🚚{" "}
                        <span style={{ color: "#f5891e", textDecoration: "underline" }}>
                            {row.awb_number || "—"}
                        </span>
                    </div>
                ),
                sortable: true,
            },
            {
                name: "Product",
                selector: (row: IncomingRemittance['orders'][number]) => row.product_sku_name,
                cell: (row: IncomingRemittance['orders'][number]) => (
                    <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                        {row?.product_sku_name || "—"}
                    </div>
                ),
                sortable: true,
            },
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
                <Button size={"sm"} onClick={() => setShowModal(true)}>Save Remittance</Button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : incoming_remittances.length === 0 ? (
                <p>No cod remittances found.</p>
            ) : (
                <DataTable
                    title="Your COD Remittances"
                    data={incoming_remittances}
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

            <EditIncomingRemittanceModal
                show={showModal}
                onHide={handleModalClose}
                onSubmit={handleModalSubmit}
                remittance={selectedRemittance}
            />
        </div>
    );
};

export { IncomingRemittances };