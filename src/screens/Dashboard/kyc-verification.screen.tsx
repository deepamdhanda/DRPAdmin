import { useEffect, useState } from "react";
import { getkyc } from "../../APIs/kyc-verification";
import DataTable, { type TableColumn } from "react-data-table-component";
import { Button } from "react-bootstrap";
import ViewKycModal from "../../utils/ViewKycModal";
import { useCallback } from "react";

import { Stack } from "react-bootstrap";

import EditPoolModal from "../../utils/EditPoolModal"; // New Component
import AddBalanceModal from "../../utils/AddBalanceModal";

export interface User {
  _id: string;
  name: string;
}

type Owner = {
  full_name?: string;
  email?: string;
  phone?: string;
};

export type Pool = {
  _id: string;
  name: string;
  status: string;
  admins?: User[];
  wallet_balance?: number;
  created_by?: { name: string };
  createdAt?: string;
  company_type?: string;
  owner?: Owner;
  website?: string;
  business_logo?: string | File | null;
  bank_details?: {
    account_number?: string;
    ifsc?: string;
    holder_name?: string;
    cheque?: string | File | null;
    approval_status?: string;
    status_message?: string;
  };
  kyc_documents: {
    section: string;
    document_type: string;
    value: string;
    is_optional: string;
    approval_status: string;
    status_message: string;
  }[];
  gstin?: string;
  address?: string;
  state?: string;
  kyc_status: string;
  comment: string;
};

// ... (Keep your User, Owner, and Pool types as they are)

const PoolComponent = () => {
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const handleAddBalanceClick = (row: Pool) => {
    setSelectedPool(row);
    setShowBalanceModal(true);
  };
  const [data, setData] = useState<Pool[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showKycModal, setShowKycModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const kycData = await getkyc(page, limit);
      setTotalRecords(kycData.total);
      setData(kycData.data);
    } catch (err) {
      console.error("Error fetching KYC data:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleViewKyc = (row: Pool) => {
    setSelectedPool(row);
    setShowKycModal(true);
  };

  const handleEditPool = (row: Pool) => {
    setSelectedPool(row);
    setShowEditModal(true);
  };

  const columns: TableColumn<Pool>[] = [
    {
      name: "Pool Name",
      selector: (row) => row.name || "—",
      cell: (row) => <strong>{row.name || "—"}</strong>,
      sortable: true,
    },
    {
      name: "KYC Status",
      selector: (row) => row.kyc_status || "—",
      sortable: true,
      cell: (row) => (
        <span
          className={`badge ${
            row.kyc_status === "approved"
              ? "bg-success"
              : row.kyc_status === "pending"
              ? "bg-warning text-dark"
              : "bg-danger"
          }`}
          style={{ textTransform: "capitalize" }}
        >
          {row.kyc_status}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status || "—",
      cell: (row) => (
        <span
          className={`badge ${
            row.status === "active" ? "bg-success" : "bg-secondary"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Wallet Balance",
      selector: (row) => row.wallet_balance || 0,
      cell: (row) => (
        <strong>₹{row.wallet_balance?.toLocaleString() || 0}</strong>
      ),
      sortable: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <Stack direction="horizontal" gap={2}>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleViewKyc(row)}
          >
            View
          </Button>
          <Button
            variant="outline-success" // Different color for clarity
            size="sm"
            onClick={() => handleAddBalanceClick(row)}
          >
            + Balance
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handleEditPool(row)}
          >
            Edit
          </Button>
        </Stack>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "250px", // Increased width to fit 3 buttons
    },
  ];

  return (
    <div className="p-3">
      <DataTable
        title="KYC Management"
        columns={columns}
        data={data}
        progressPending={loading}
        pagination
        paginationServer
        paginationTotalRows={totalRecords}
        onChangePage={setPage}
        onChangeRowsPerPage={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        highlightOnHover
        responsive
      />

      {/* View Modal */}
      {selectedPool && (
        <ViewKycModal
          show={showKycModal}
          onHide={() => setShowKycModal(false)}
          pool={selectedPool}
          onUpdated={fetchInitialData}
        />
      )}

      {/* Edit Modal */}
      {selectedPool && (
        <EditPoolModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          pool={selectedPool}
          onSuccess={fetchInitialData}
        />
      )}
      {selectedPool && (
        <AddBalanceModal
          show={showBalanceModal}
          onHide={() => setShowBalanceModal(false)}
          poolId={selectedPool._id}
          poolName={selectedPool.name}
          onSuccess={fetchInitialData}
        />
      )}
    </div>
  );
};

export default PoolComponent;
