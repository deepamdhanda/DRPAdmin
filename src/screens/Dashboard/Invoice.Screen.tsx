import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { Button, Form, Row, Col } from "react-bootstrap";
import { getAllInvoices } from "../../APIs/invoice";

import { utils as XLSXUtils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
// import type { jsPDFOptions } from "jspdf";

declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export interface Invoice {
    invoice_id: string;
    invoice_number: string;
    company_name: string;
    company_gst: string;
    company_state: string;
    sac_no: string;
    party_name: string;
    party_state: string;
    party_gstin: string;
    party_address: string;
    party_company_type: string;
    period_start: string;
    period_end: string;
    invoice_date: string;
    service_name: string;
    service_description: string;
    taxable_value: number;
    cgst: number;
    sgst: number;
    utgst: number;
    igst: number;
    total_tax: number;
    value_after_tax: number;
    gst_type: string;
    refund_amount: number;
    net_total_after_refund: number;
    pending_amount: number;
    total_transactions: number;
    total_refund_transactions: number;
}

const Invoice: React.FC = () => {
    // Default dates → today & 1 month back
    const today = new Date();

    // Create a copy before modifying
    const oneMonthBack = new Date(today);
    oneMonthBack.setMonth(oneMonthBack.getMonth() - 1);

    // Safe formatter → ALWAYS returns YYYY-MM-DD
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [startDate, setStartDate] = useState<string>(formatDate(oneMonthBack));
    const [endDate, setEndDate] = useState<string>(formatDate(today));


    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<Invoice[]>([]);

    // ----------------------------
    // FETCH GST TRANSACTIONS
    // ----------------------------
    const fetchData = async () => {
        if (!startDate || !endDate) return alert("Please select both dates.");
        setLoading(true);
        try {
            const response = await getAllInvoices(startDate, endDate);
            setTransactions(response?.data?.invoices || []);
        } catch (error) {
            console.error(error);
            alert("Error fetching GST transactions.");
        }
        setLoading(false);
    };

    // ----------------------------
    // CSV EXPORT (Browser Safe)
    // ----------------------------
    const downloadCSV = () => {
        if (!transactions.length) return;

        const headers = Object.keys(transactions[0]);
        const csvRows = [];

        // header row
        csvRows.push(headers.join(","));

        // data rows
        transactions.forEach((row) => {
            const values = headers.map((h) => {
                let val = (row as any)[h];
                if (val === null || val === undefined) val = "";
                if (typeof val === "string") val = `"${val.replace(/"/g, '""')}"`;
                return val;
            });
            csvRows.push(values.join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `GST_Transactions_${startDate}_to_${endDate}.csv`;
        link.click();
    };

    // ----------------------------
    // EXCEL EXPORT
    // ----------------------------
    const downloadExcel = () => {
        if (!transactions.length) return;

        const ws = XLSXUtils.json_to_sheet(transactions);
        const wb = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(wb, ws, "GST Transactions");

        writeFile(wb, `GST_Transactions_${startDate}_to_${endDate}.xlsx`);
    };

    // ----------------------------
    // PDF EXPORT
    // ----------------------------
    const downloadPDF = () => {
        if (!transactions.length) return;

        const doc = new jsPDF("l", "mm", "a4");
        doc.text("GST Transactions Report", 14, 14);

        const tableData = transactions.map((row) => [
            row.invoice_number,
            row.company_name,
            row.party_name,
            row.taxable_value,
            row.total_tax,
            row.value_after_tax,
        ]);

        doc.autoTable({
            head: [["Invoice No", "Company", "Party", "Taxable Value", "Total Tax", "After Tax"]],
            body: tableData,
            startY: 20,
        });

        doc.save(`GST_Transactions_${startDate}_to_${endDate}.pdf`);
    };

    // ----------------------------
    // TABLE COLUMNS
    // ----------------------------
    const columns = [
        {
            name: "Invoice #",
            selector: (row: Invoice) => row.invoice_number,
            sortable: true,
            minWidth: "170px",
        },
        {
            name: "Company",
            selector: (row: Invoice) => row.company_name,
            sortable: true,
        },
        {
            name: "Party",
            selector: (row: Invoice) => row.party_name,
            sortable: true,
        },
        {
            name: "Taxable Value",
            selector: (row: Invoice) => row.taxable_value,
            cell: (row: Invoice) => <>₹{row.taxable_value.toFixed(2)}</>,
            sortable: true,
            right: true,
        },
        {
            name: "Total Tax",
            selector: (row: Invoice) => row.total_tax,
            cell: (row: Invoice) => <>₹{row.total_tax.toFixed(2)}</>,
            sortable: true,
            right: true,
        },
        {
            name: "After Tax",
            selector: (row: Invoice) => row.value_after_tax,
            cell: (row: Invoice) => <strong>₹{row.value_after_tax.toFixed(2)}</strong>,
            sortable: true,
            right: true,
        },
        {
            name: "Invoice Date",
            selector: (row: Invoice) =>
                new Date(row.invoice_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
            sortable: true,
        },
        {
            name: "Invoice Period",
            selector: (row: Invoice) => (
                new Date(row.period_start).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }) + "-" + new Date(row.period_end).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })),
            minWidth: "200px",
            sortable: true,
        },
    ];

    return (
        <div className="container mt-4 ms-2 me-2">
            <h4 className="mb-3">GST Transactions</h4>

            {/* DATE FILTERS */}
            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </Form.Group>
                </Col>

                <Col md={3}>
                    <Form.Group>
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </Form.Group>
                </Col>

                <Col md={3} className="d-flex align-items-end">
                    <Button variant="primary" onClick={fetchData}>
                        Fetch Transactions
                    </Button>
                </Col>
            </Row>

            {/* EXPORT BUTTONS */}
            {transactions.length > 0 && (
                <div className="mb-3 d-flex gap-2">
                    <Button size="sm" variant="dark" onClick={downloadCSV}>
                        Download CSV
                    </Button>
                    <Button size="sm" variant="success" onClick={downloadExcel}>
                        Download Excel
                    </Button>
                    <Button size="sm" variant="danger" onClick={downloadPDF}>
                        Download PDF
                    </Button>
                </div>
            )}

            {/* TABLE */}
            <DataTable
                title="GST Transactions"
                data={transactions}
                columns={columns as any}
                highlightOnHover
                pagination
                striped
                responsive
                progressPending={loading}
                paginationRowsPerPageOptions={[10, 20, 50, 100]}
            />
        </div>
    );
};

export { Invoice };
