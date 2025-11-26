import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";

interface EditRemittanceModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (transfers: PartialTransferData[]) => void;
  remittance: {
    _id: string;
    totalAmount: number;
    transfers: [any]
  } | null;
}

interface PartialTransferData {
  amount: number;
  transferMode: string;
  transferId: string;
  remarks: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed';
  transferDate: Date

}

const EditOutgoingRemittanceModal: React.FC<EditRemittanceModalProps> = ({
  show,
  onHide,
  onSubmit,
  remittance,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    dateInputRef.current?.showPicker?.(); // for browsers that support it (Chrome, Edge)
    dateInputRef.current?.focus();        // fallback
  };

  const [form, setForm] = useState<PartialTransferData>({
    amount: 0,
    transferMode: "NEFT",
    transferId: "",
    remarks: "",
    status: "initiated",
    transferDate: new Date()
  });
  const [edit, setEdit] = useState(false)
  const [transfers, setTransfers] = useState<PartialTransferData[]>([]);
  useEffect(() => {
    // console.log(remittance)
    if (remittance) {
      setForm({
        amount: remittance?.totalAmount
          ? transfers.length > 0 ? remittance.totalAmount - transfers.reduce((sum: number, i: any) => sum + i.amount, 0)
            : remittance.totalAmount : 0,
        transferMode: "NEFT",
        transferId: "",
        remarks: "",
        status: "initiated",
        transferDate: new Date()
      });
      setTransfers(remittance.transfers || []);
    }
  }, [remittance]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };
  const handleDeleteTransfer = (index: number) => {
    setTransfers((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!edit) {
      setForm({
        amount: remittance?.totalAmount
          ? remittance.totalAmount - transfers.reduce((sum: number, i: any) => sum + i.amount, 0)
          : 0,
        transferMode: "NEFT",
        transferId: "",
        remarks: "",
        status: "initiated",
        transferDate: new Date()
      });
    }
  }, [transfers])

  const handleAddTransfer = () => {
    if (!form.amount || !form.transferId) {
      toast.error("Check amount and transfer ID!")

      return
    };
    const totalTrensfered = transfers.reduce((sum: number, i: any) => sum + i.amount, 0);
    if (remittance && ((totalTrensfered + form.amount) <= remittance?.totalAmount))
      setTransfers((prev) => [...prev, form]);
    else {
      toast.error("Amount cannot be greater than total Amount!")
      return
    }
  };

  const handleEditTransfer = (t: PartialTransferData, idx: number) => {
    handleDeleteTransfer(idx)
    setForm(t);
    setEdit(true)
  }
  const handleSubmitAll = () => {
    if (transfers.length > 0) {
      onSubmit(transfers);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Transfers</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!(transfers.length > 0 && remittance?.totalAmount && transfers.reduce((sum: number, i: any) => sum + i.amount, 0) >= remittance?.totalAmount) && <Form>
          <Form.Group controlId="amount">
            <Form.Label>Transfer Amount</Form.Label>
            <Form.Control
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min={1}
            />
          </Form.Group>

          <Form.Group controlId="transferMode" className="mt-3">
            <Form.Label>Transfer Mode</Form.Label>
            <Form.Select
              name="transferMode"
              value={form.transferMode}
              onChange={handleChange}
            >
              <option value="NEFT">NEFT</option>
              <option value="UPI">UPI</option>
              <option value="IMPS">IMPS</option>
              <option value="Wallet">Wallet</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="transferId" className="mt-3">
            <Form.Label>Transfer ID</Form.Label>
            <Form.Control
              type="text"
              name="transferId"
              value={form.transferId}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group controlId="transferId" className="mt-3">
            <Form.Label>Transfer Date</Form.Label>
            <Form.Control
              type="date"
              name="transferDate"
              value={new Date(form.transferDate).toISOString()?.split('T')?.[0] || ''}
              onChange={handleChange}
              ref={dateInputRef}
              onFocus={openCalendar} // 👈 optional auto-open
              max={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            />
          </Form.Group>

          <Form.Group controlId="transferMode" className="mt-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              {['initiated', 'processing', 'completed', 'failed'].map(i => <option value={i}>{i.toUpperCase()}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="remarks" className="mt-3">
            <Form.Label>Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
            />
          </Form.Group>

          <Button className="mt-3" variant="success" onClick={handleAddTransfer}>
            ➕ Add Transfer
          </Button>
        </Form>}

        {transfers.length > 0 && (
          <div className="mt-4">
            <h5>Transfers Added:</h5>
            <Table bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Transfer ID</th>
                  <th>Transfer Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>₹{t.amount}</td>
                    <td>{t.transferMode}</td>
                    <td>{t.transferId}</td>
                    <td>{(new Date(t.transferDate)).toISOString().split('T')[0] || ''}</td>
                    <td>{t.status}</td>
                    <td>{t.remarks}</td>
                    <td>
                      <Button variant="primary" size="sm" onClick={() => handleEditTransfer(t, idx)}>
                        ❌ Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteTransfer(idx)}>
                        ❌ Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmitAll} disabled={transfers.length === 0}>
          ✅ Submit All Transfers
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditOutgoingRemittanceModal;
