import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Table,
  Badge,
  Spinner,
} from "react-bootstrap";
import { kyc_verification_url } from "../axios/urls";
import { appAxios } from "../axios/appAxios";

interface RechargeRecord {
  _id: string;
  amount: number;
  payment_method: string;
  status: string;
  reason?: string; // Added reason to interface
  createdAt: string;
}

interface AddBalanceModalProps {
  show: boolean;
  onHide: () => void;
  poolId: string;
  poolName: string;
  onSuccess: () => void;
}

const AddBalanceModal: React.FC<AddBalanceModalProps> = ({
  show,
  onHide,
  poolId,
  poolName,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number | string>("");
  const [reason, setReason] = useState(""); // New state for reason
  const [history, setHistory] = useState<RechargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setFetchingHistory(true);
    try {
      const response = await appAxios.get(`${kyc_verification_url}/${poolId}`);
      setHistory(response.data.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  }, [poolId]);

  useEffect(() => {
    if (show) {
      fetchHistory();
    }
  }, [show, fetchHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      // Included reason in the payload
      await appAxios.post(`${kyc_verification_url}/${poolId}`, {
        amount: Number(amount),
        reason: reason.trim(),
      });

      setAmount("");
      setReason(""); // Reset reason
      fetchHistory();
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Manage Balance: {poolName}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* --- Top Section: Add Balance Form --- */}
        <Form onSubmit={handleSubmit} className="mb-4 p-3 bg-light rounded">
          <Form.Label className="fw-bold">Add New Balance (Admin)</Form.Label>
          <div className="d-flex flex-column gap-3">
            <InputGroup>
              <InputGroup.Text>₹</InputGroup.Text>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </InputGroup>

            {/* Added Reason Input Field */}
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Enter reason for adjustment (e.g., Refund, Correction, Promotional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={true} // Set to true if you want to force admins to provide a reason
              />
            </Form.Group>

            <Button
              variant="success"
              type="submit"
              disabled={loading}
              className="w-100"
            >
              {loading ? <Spinner size="sm" className="me-2" /> : null}
              Add Cash
            </Button>
          </div>
        </Form>

        <hr />

        {/* --- Bottom Section: Recharge History --- */}
        <h6 className="mb-3 fw-bold">Recent Recharge History</h6>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <Table striped bordered hover responsive size="sm">
            <thead className="sticky-top bg-white shadow-sm">
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reason</th> {/* New Table Header */}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fetchingHistory ? (
                <tr>
                  <td colSpan={5} className="text-center py-3">
                    <Spinner size="sm" animation="border" className="me-2" />{" "}
                    Loading history...
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="text-success fw-bold">
                      ₹{item.amount / 100}
                    </td>
                    <td>
                      <Badge bg="info text-dark">{item.payment_method}</Badge>
                    </td>
                    {/* Display the Reason */}
                    <td className="text-muted small">
                      {item.reason || (
                        <span className="fst-italic">No reason provided</span>
                      )}
                    </td>
                    <td>
                      <Badge
                        bg={
                          item.status === "freecash" ? "secondary" : "primary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No history found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddBalanceModal;
