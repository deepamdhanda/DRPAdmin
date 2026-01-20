import { Modal, Button, Form, Badge } from "react-bootstrap";
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
  if (!pool) {
    return;
  }
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [status, setStatus] = useState("pending");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const documents = pool?.kyc_documents || [];
  const selectedDoc = documents[selectedDocIndex];

  useEffect(() => {
    setStatus(pool.kyc_status || "pending");
    setComment(pool.comment || "");
  }, [pool]);

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

  if (!selectedDoc) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>KYC Verification – {pool.name}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Document selector */}
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
              }}
            >
              <img
                src={doc.value.endsWith(".pdf") ? "/pdf.png" : doc.value}
                alt={doc.document_type}
                style={{
                  width: "100%",
                  height: 70,
                  objectFit: "cover",
                }}
              />
              <small className="d-block mt-1">
                {doc.document_type.slice(0, 20)}
              </small>
            </div>
          ))}
        </div>

        {/* Selected document */}
        <div className="mb-3">
          <h6>{selectedDoc.document_type}</h6>
          <a href={selectedDoc.value} target="_blank" rel="noreferrer">
            Open Document
          </a>
          <div className="mt-2">
            <Badge bg="secondary">Current: {selectedDoc.approval_status}</Badge>
          </div>
        </div>

        {/* Status */}
        <Form.Group className="mb-3">
          <Form.Label>Update Status</Form.Label>
          <Form.Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* Comment */}
        <Form.Group>
          <Form.Label>Comment</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Add verification comment..."
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
          {loading ? "Updating..." : "Update Status"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
