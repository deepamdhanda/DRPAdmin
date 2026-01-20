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
  const [history, setHistory] = useState<RechargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  // 1. Fetch History Function
  const fetchHistory = useCallback(async () => {
    setFetchingHistory(true);
    try {
      // Adjust this endpoint to wherever you fetch Wallet_Recharge records by pool_id
      const response = await appAxios.get(`${kyc_verification_url}/${poolId}`);
      setHistory(response.data.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  }, [poolId]);

  // Fetch history when modal opens
  useEffect(() => {
    if (show) {
      fetchHistory();
    }
  }, [show, fetchHistory]);

  // 2. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      await appAxios.post(`${kyc_verification_url}/${poolId}`, {
        amount: Number(amount),
      });
      setAmount("");
      fetchHistory(); // Refresh history list
      onSuccess(); // Refresh parent table balance
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
          <InputGroup>
            <InputGroup.Text>₹</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Add Cash"}
            </Button>
          </InputGroup>
        </Form>

        <hr />

        {/* --- Bottom Section: Recharge History --- */}
        <h6 className="mb-3 fw-bold">Recent Recharge History</h6>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <Table striped bordered hover responsive size="sm">
            <thead className="sticky-top bg-white">
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fetchingHistory ? (
                <tr>
                  <td colSpan={4} className="text-center py-3">
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
                  <td colSpan={4} className="text-center text-muted">
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
