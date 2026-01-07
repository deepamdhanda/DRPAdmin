import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import { getOutgoingRemittanceById } from "../APIs/outgoingRemittance";
import { toast } from "react-toastify";
import { createIncomingRemittance } from "../APIs/incomingRemittance";

interface EditRemittanceModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (transfers: PartialTransferData[]) => void;
  remittance: {
    _id: string;
    totalAmount: number;
    transfers: [any];
  } | null;
}

interface PartialTransferData {
  amount: number;
  transferMode: string;
  transferId: string;
  remarks: string;
  status: "initiated" | "processing" | "completed" | "failed";
  transferDate: Date;
}

interface OrderRow {
  _id: string;
  order_id: number;
  awb_number: string;
  store_order_id: string;
  total_amount: number;
  payment_method: string;
  shipping_courier_id: string;
  shipping_courier_name: string;
}

interface CourierGroup {
  courier_id: string;
  courier_name: string;
  orders: OrderRow[];
}

const EditIncomingRemittanceModal: React.FC<EditRemittanceModalProps> = ({
  show,
  onHide,
  // onSubmit,
  // remittance,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [courierGroups, setCourierGroups] = useState<CourierGroup[]>([]);
  const [orignalCourierGroups, setOrignalCourierGroups] = useState<CourierGroup[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // extra fields
  const [referenceId, setReferenceId] = useState("");
  const [codAmount, setCodAmount] = useState(0);
  const [netAmountReceived, setNetAmountReceived] = useState<number | "">("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"pending" | "reconciled">("pending");

  const openCalendar = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  // 1️⃣ Fetch data whenever modal opens
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await getOutgoingRemittanceById('incoming');
      if (response) {
        setOrignalCourierGroups(response);
        setCourierGroups(response); // expecting backend to send grouped format
      }
    } catch (err) {
      toast.error("Failed to fetch remittance details");
    }
  };

  // 2️⃣ Handle order selection
  const toggleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrders((prev) => {
      const updated = new Set(prev);
      if (checked) updated.add(orderId);
      else updated.delete(orderId);
      return updated;
    });
  };

  // 3️⃣ Auto calculate COD amount & courier commission
  useEffect(() => {
    const selectedOrderObjects = orignalCourierGroups.flatMap((cg) =>
      cg.orders.filter((o) => selectedOrders.has(o._id))
    );

    const totalCOD = selectedOrderObjects.reduce((sum, o) => {
      if (o.payment_method?.toLowerCase().includes("cod")) {
        return sum + (o.total_amount || 0);
      }
      return sum;
    }, 0);

    setCodAmount(totalCOD);
  }, [selectedOrders, orignalCourierGroups]);

  const courierCommission =
    netAmountReceived && typeof netAmountReceived === "number"
      ? netAmountReceived - codAmount
      : 0;

  const searchAWB = (searchText: any) => {
    if (!searchText.trim()) setCourierGroups(orignalCourierGroups); // if empty, return all

    const lowerSearch = searchText.toLowerCase();

    setCourierGroups(orignalCourierGroups
      .map((group) => ({
        ...group,
        orders: group.orders.filter((order) => {
          const str = order.awb_number + order._id + order.order_id + order.payment_method + order.total_amount + order.store_order_id
          return str.toLowerCase().includes(lowerSearch)
        }
        ),
      }))
      .filter((group) => group.orders.length > 0));
  }

  // 4️⃣ Submit handler
  const handleSubmitOrders = async () => {
    const payload = {
      orderIds: Array.from(selectedOrders),
      referenceId,
      codAmount,
      courierCommission,
      netAmountReceived,
      receivedDate,
      status,
    };
    try {
      await createIncomingRemittance(payload);

    } catch {

    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Outgoing Remittance - Orders by Courier</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        {/* extra fields */}
        <Form>
          <Row>
            <Col md={4}>
              <Form.Group className="mt-3">
                <Form.Label>Reference ID</Form.Label>
                <Form.Control
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mt-3">
                <Form.Label>COD Amount</Form.Label>
                <Form.Control type="number" value={codAmount} readOnly />
              </Form.Group>

            </Col>
            <Col md={4}>
              <Form.Group className="mt-3">
                <Form.Label>Net Amount Received</Form.Label>
                <Form.Control
                  type="number"
                  value={netAmountReceived}
                  onChange={(e) =>
                    setNetAmountReceived(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                />
              </Form.Group>

            </Col>
            <Col md={4}>
              <Form.Group className="mt-3">
                <Form.Label>Courier Commission</Form.Label>
                <Form.Control type="number" value={courierCommission} readOnly />
              </Form.Group>

            </Col>
            <Col md={4}>
              <Form.Group className="mt-3">
                <Form.Label>Received Date</Form.Label>
                <Form.Control
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  ref={dateInputRef}
                  onFocus={openCalendar}
                />
              </Form.Group>

            </Col>
            <Col md={4}>
              <Form.Group className="mt-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="pending">Pending</option>
                  <option value="reconciled">Reconciled</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <Form.Group className="mt-3">
          <Form.Label>Search AWB</Form.Label>
          <Form.Control
            type="text"
            onChange={(e) => searchAWB(e.target.value)}
          />
        </Form.Group>
        {courierGroups.map((courier) => (
          <div key={courier.courier_id} className="mb-4">
            <h5>{courier.courier_name}</h5>
            <DataTable
              columns={[
                {
                  name: "",
                  cell: (row: OrderRow) => (
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(row._id)}
                      onChange={(e) =>
                        toggleOrderSelection(row._id, e.target.checked)
                      }
                    />
                  ),
                  width: "50px",
                },
                { name: "Order ID", selector: (row) => row.order_id },
                { name: "Store Order ID", selector: (row) => row.store_order_id },
                { name: "Amount", selector: (row) => `₹${row.total_amount}` },
                { name: "AWB Number", selector: (row) => row.awb_number },
                { name: "Payment", selector: (row) => row.payment_method },
              ]}
              data={courier.orders}
              dense
              highlightOnHover
            />
          </div>
        ))}

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmitOrders}
          disabled={selectedOrders.size === 0}
        >
          Submit Selected Orders
        </Button>
      </Modal.Footer>
    </Modal >
  );
};

export default EditIncomingRemittanceModal;
