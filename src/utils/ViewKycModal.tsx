import { Modal, Button, Form, Badge, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";

import { updateKyc } from "../APIs/kyc-verification";
import type { Pool } from "../screens/Dashboard/kyc-verification.screen";

type Props = {
  show: boolean;
  onHide: () => void;
  pool: Pool;
  onUpdated?: () => void;
};

const STATUS_OPTIONS = [
  "pending",
  "approved",
  "rejected",
  "permanent_rejected",
];

export default function ViewKycModal({ show, onHide, pool, onUpdated }: Props) {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [status, setStatus] = useState("pending");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pool) {
      setStatus(pool.kyc_status || "pending");
      setComment(pool.comment || "");
    }
  }, [pool]);

  if (!pool) return null;

  const documents = pool.kyc_documents || [];
  const selectedDoc = documents[selectedDocIndex];

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateKyc(pool._id, { kyc_status: status, comment });
      onUpdated?.();
      onHide();
    } catch (err) {
      console.error("KYC update failed", err);
      alert("Failed to update KYC status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>KYC Verification – {pool.name}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* SECTION 1: Business & Owner Details */}
        <div className="mb-4">
          <h6 className="text-primary border-bottom pb-2 mb-3">
            Business Information
          </h6>
          <Row className="gy-3">
            <Col md={6}>
              <label className="text-muted small d-block">Company Name</label>
              <span className="fw-bold">{pool.name}</span>
            </Col>
            <Col md={6}>
              <label className="text-muted small d-block">Company Type</label>
              <span className="fw-bold text-capitalize">
                {pool.company_type || "N/A"}
              </span>
            </Col>
            <Col md={6}>
              <label className="text-muted small d-block">GSTIN</label>
              <span className="fw-bold">{pool.gstin || "Not Provided"}</span>
            </Col>
            <Col md={6}>
              <label className="text-muted small d-block">Website</label>
              {pool.website ? (
                <a
                  href={pool.website}
                  target="_blank"
                  rel="noreferrer"
                  className="d-block"
                >
                  {pool.website}
                </a>
              ) : (
                <span>N/A</span>
              )}
            </Col>
            <Col md={12}>
              <label className="text-muted small d-block">
                Registered Address
              </label>
              <span>
                {pool.address}, {pool.state}
              </span>
            </Col>
          </Row>
        </div>

        <div className="mb-4">
          <h6 className="text-primary border-bottom pb-2 mb-3">
            Owner Details
          </h6>
          <Row>
            <Col md={4}>
              <label className="text-muted small d-block">Full Name</label>
              <span className="fw-bold">{pool.owner?.full_name || "N/A"}</span>
            </Col>
            <Col md={4}>
              <label className="text-muted small d-block">Email</label>
              <span className="fw-bold">{pool.owner?.email || "N/A"}</span>
            </Col>
            <Col md={4}>
              <label className="text-muted small d-block">Phone</label>
              <span className="fw-bold">{pool.owner?.phone || "N/A"}</span>
            </Col>
          </Row>
        </div>

        {/* SECTION 2: Bank Details */}
        <div className="mb-4 p-3 bg-light rounded">
          <h6 className="text-primary border-bottom pb-2 mb-3">
            Bank Account Details
          </h6>
          <Row className="gy-2">
            <Col md={6}>
              <label className="text-muted small d-block">Account Holder</label>
              <span className="fw-bold">
                {pool.bank_details?.holder_name || "N/A"}
              </span>
            </Col>
            <Col md={6}>
              <label className="text-muted small d-block">Account Number</label>
              <span className="fw-bold">
                {pool.bank_details?.account_number || "N/A"}
              </span>
            </Col>
            <Col md={6}>
              <label className="text-muted small d-block">IFSC Code</label>
              <span className="fw-bold text-uppercase">
                {pool.bank_details?.ifsc || "N/A"}
              </span>
            </Col>
            <Col md={6}>
              <label className="text-muted small d-block">
                Cancelled Cheque
              </label>
              {pool.bank_details?.cheque ? (
                <a
                  href={pool.bank_details.cheque as string}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Cheque Image
                </a>
              ) : (
                <span className="text-danger">Not Uploaded</span>
              )}
            </Col>
          </Row>
        </div>

        {/* SECTION 3: KYC Documents Viewer */}
        <div className="mb-4">
          <h6 className="text-primary border-bottom pb-2 mb-3">
            KYC Documents
          </h6>
          <div className="d-flex gap-3 mb-3 flex-wrap">
            {documents.map((doc: any, index: number) => (
              <div
                key={index}
                onClick={() => setSelectedDocIndex(index)}
                style={{
                  cursor: "pointer",
                  border:
                    index === selectedDocIndex
                      ? "2px solid #0d6efd"
                      : "1px solid #ddd",
                  padding: 8,
                  borderRadius: 6,
                  width: 110,
                  textAlign: "center",
                  backgroundColor:
                    index === selectedDocIndex ? "#f0f7ff" : "transparent",
                }}
              >
                <img
                  src={
                    doc.value?.endsWith(".pdf") ? "/pdf-icon.png" : doc.value
                  }
                  alt={doc.document_type}
                  style={{ width: "100%", height: 70, objectFit: "cover" }}
                />
                <small
                  className="d-block mt-1 text-truncate"
                  title={doc.document_type}
                >
                  {doc.document_type}
                </small>
              </div>
            ))}
          </div>

          {selectedDoc && (
            <div className="p-3 border rounded bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">{selectedDoc.document_type}</h6>
                <Badge
                  bg={
                    selectedDoc.approval_status === "approved"
                      ? "success"
                      : "secondary"
                  }
                >
                  {selectedDoc.approval_status}
                </Badge>
              </div>
              <a
                href={selectedDoc.value}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-primary"
              >
                View Full Document
              </a>
            </div>
          )}
        </div>

        <hr />

        {/* SECTION 4: Action Form */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Update Global KYC Status</Form.Label>
          <Form.Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label className="fw-bold">Verifier Comment</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Reason for approval/rejection..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUpdate} disabled={loading}>
          {loading ? "Updating..." : "Submit Verification"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
