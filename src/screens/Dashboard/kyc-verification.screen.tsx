import { useEffect, useState } from "react";
import { getkyc } from "../../APIs/kyc-verification";
import DataTable from "react-data-table-component";
import { Button } from "react-bootstrap";
import ViewKycModal from "../../utils/ViewKycModal";

export interface KycVerification {
  _id: string;
  name: string;
  status: string;
  kyc_documents: {
    section: string;
    document_type: string;
    value: string;
    is_optional: string;
    approval_status: string;
    status_message: string;
  }[];
  createdAt: string;
  kyc_status: string;
  comment: string;
}

const KycVerification = () => {
  const [data, setData] = useState<KycVerification[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [fetchAgain, setFetchAgain] = useState(false);

  const handleViewKyc = (row: any) => {
    setSelectedPool(row);
    setShowKycModal(true);
  };

  const fetchInitialData = async () => {
    try {
      const kycData = await getkyc(page, limit);
      setTotalRecords(kycData.total);
      setData(kycData.data);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    fetchInitialData();
  }, [page, limit, fetchAgain]);
  const columns = [
    {
      name: "Pool Name",
      selector: (row: KycVerification) => row.name || "—",
      cell: (row: KycVerification) => <strong>{row.name || "—"}</strong>,
      sortable: true,
    },

    {
      name: "KYC Docs",
      selector: (row: KycVerification) => row.kyc_documents?.length || 0,
      cell: (row: KycVerification) => (
        <span className="badge bg-info">{row.kyc_documents?.length || 0}</span>
      ),
      sortable: true,
      center: true,
    },

    {
      name: "KYC Status",
      selector: (row: KycVerification) => row.kyc_status || "—",
      sortable: true,
      cell: (row: KycVerification) => (
        <span
          className={`badge  ${
            row.kyc_status === "pending"
              ? "bg-warning text-dark"
              : row.kyc_status === "approved"
              ? "bg-success"
              : row.kyc_status === "rejected"
              ? "bg-danger"
              : "bg-secondary"
          }`}
          style={{ textTransform: "capitalize" }}
        >
          {row.kyc_status}
        </span>
      ),
    },

    {
      name: "Status",
      selector: (row: KycVerification) => row.status || "—",
      sortable: true,
      cell: (row: KycVerification) => (
        <span
          className={`badge ${
            row.status === "active"
              ? "bg-success"
              : row.status === "inactive"
              ? "bg-secondary"
              : "bg-primary"
          }`}
          style={{ textTransform: "capitalize" }}
        >
          {row.status}
        </span>
      ),
    },

    {
      name: "Created At",
      selector: (row: KycVerification) => row.createdAt,
      sortable: true,
      cell: (row: KycVerification) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },

    {
      name: "Action",
      cell: (row: KycVerification) => (
        <Button size="sm" variant="primary" onClick={() => handleViewKyc(row)}>
          View / Update KYC
        </Button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const onUpdate = () => {
    fetchAgain ? setFetchAgain(false) : setFetchAgain(true);
  };

  return (
    <div>
      <DataTable
        title="Kyc Data"
        columns={columns}
        data={data}
        pagination
        paginationServer
        paginationTotalRows={totalRecords}
        paginationDefaultPage={page}
        paginationPerPage={limit}
        onChangePage={(p) => {
          setPage(p);
        }}
        onChangeRowsPerPage={(newLimit) => {
          setLimit(newLimit);
          setPage(1); // ALWAYS reset to page 1 when limit changes
        }}
        highlightOnHover
        responsive
      />
      <ViewKycModal
        show={showKycModal}
        onHide={() => setShowKycModal(false)}
        pool={selectedPool}
        onUpdated={onUpdate}
      />
    </div>
  );
};

export default KycVerification;
