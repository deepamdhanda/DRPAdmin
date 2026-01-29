import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import { getOutgoingRemittanceById } from "../APIs/outgoingRemittance";
import { toast } from "react-toastify";
import type { IncomingRemittance } from "../screens/Dashboard/IncomingRemittace.Screen";

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

// Ensure this matches the structure passed from the parent

interface EditRemittanceModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (formData: any) => void; // Parent handles the API call
  remittance?: IncomingRemittance | null; // If null, it's Create mode
}

const EditIncomingRemittanceModal: React.FC<EditRemittanceModalProps> = ({
  show,
  onHide,
  onSubmit,
  remittance,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [courierGroups, setCourierGroups] = useState<CourierGroup[]>([]);
  const [originalCourierGroups, setOriginalCourierGroups] = useState<
    CourierGroup[]
  >([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Form Fields
  const [referenceId, setReferenceId] = useState("");
  const [codAmount, setCodAmount] = useState(0);
  const [netAmountReceived, setNetAmountReceived] = useState<number | "">("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"pending" | "reconciled" | "paid">(
    "pending"
  );

  const openCalendar = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  // --- 1. Initialization Logic (Create vs Edit) ---
  useEffect(() => {
    if (show) {
      initializeData();
    }
  }, [show, remittance]);

  const initializeData = async () => {
    try {
      // 1. Fetch "Unassigned" orders from backend (Orders not yet in a remittance)
      const unassignedData: CourierGroup[] = await getOutgoingRemittanceById(
        "incoming"
      );

      let finalGroups = unassignedData || [];
      const initialSelection = new Set<string>();

      // 2. If EDIT Mode: Merge Existing Orders into the list and Pre-fill form
      if (remittance) {
        setReferenceId(remittance.referenceId || "");
        setNetAmountReceived(remittance.netAmountReceived || 0);
        setStatus((remittance.status as any) || "pending");

        if (remittance.receivedDate) {
          setReceivedDate(
            new Date(remittance.receivedDate).toISOString().split("T")[0]
          );
        }

        // Prepare existing orders to match CourierGroup structure
        // We group them by courier name since that's how the UI displays them
        const existingOrdersByCourier: Record<string, OrderRow[]> = {};

        remittance.orders.forEach((ord) => {
          // Mark as selected
          initialSelection.add(ord._id);

          const courierName = ord.courier_name || "Unknown Courier";

          const mappedOrder: OrderRow = {
            _id: ord._id,
            order_id: Number(ord.order_id),
            awb_number: ord.awb_number || "",
            store_order_id: ord.store_order_id,
            total_amount: ord.amount,
            payment_method: "COD",
            shipping_courier_id: "unknown",
            shipping_courier_name: courierName,
          };

          if (!existingOrdersByCourier[courierName]) {
            existingOrdersByCourier[courierName] = [];
          }
          existingOrdersByCourier[courierName].push(mappedOrder);
        });

        // Merge Existing Orders into the `finalGroups` (Unassigned Orders)
        Object.keys(existingOrdersByCourier).forEach((cName) => {
          const existingGroupIndex = finalGroups.findIndex(
            (g) => g.courier_name === cName
          );

          if (existingGroupIndex > -1) {
            // Courier group exists in unassigned, push these orders into it
            finalGroups[existingGroupIndex].orders.push(
              ...existingOrdersByCourier[cName]
            );
          } else {
            // Create new group for this courier
            finalGroups.push({
              courier_id: `temp-${cName}`,
              courier_name: cName,
              orders: existingOrdersByCourier[cName],
            });
          }
        });
      } else {
        // CREATE Mode: Reset form
        setReferenceId("");
        setNetAmountReceived("");
        setStatus("pending");
        setReceivedDate(new Date().toISOString().split("T")[0]);
      }

      setOriginalCourierGroups(finalGroups);
      setCourierGroups(finalGroups);
      setSelectedOrders(initialSelection);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch remittance details");
    }
  };

  // --- 2. Handle Order Selection ---
  const toggleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrders((prev) => {
      const updated = new Set(prev);
      if (checked) updated.add(orderId);
      else updated.delete(orderId);
      return updated;
    });
  };

  // --- 3. Auto-Calculate COD Amount ---
  // Runs whenever selection changes or groups load
  useEffect(() => {
    if (!originalCourierGroups.length) return;

    // Flatten all orders to find selected ones easily
    const allOrders = originalCourierGroups.flatMap((cg) => cg.orders);

    const totalCOD = allOrders.reduce((sum, o) => {
      if (selectedOrders.has(o._id)) {
        // Optional: Check if payment method is COD if you have mixed types
        return sum + (o.total_amount || 0);
      }
      return sum;
    }, 0);

    setCodAmount(totalCOD);
  }, [selectedOrders, originalCourierGroups]);

  // Derived Calculation
  const courierCommission =
    netAmountReceived && typeof netAmountReceived === "number"
      ? netAmountReceived - codAmount
      : 0; // Or 0 if negative, depending on business logic

  // --- 4. Search Filter ---
  const searchAWB = (searchText: string) => {
    if (!searchText.trim()) {
      setCourierGroups(originalCourierGroups);
      return;
    }

    const lowerSearch = searchText.toLowerCase();

    const filtered = originalCourierGroups
      .map((group) => ({
        ...group,
        orders: group.orders.filter((order) => {
          const str =
            (order.awb_number || "") +
            (order._id || "") +
            (order.order_id || "") +
            (order.total_amount || "") +
            (order.store_order_id || "");
          return str.toLowerCase().includes(lowerSearch);
        }),
      }))
      .filter((group) => group.orders.length > 0);

    setCourierGroups(filtered);
  };

  // --- 5. Submit Handler ---
  const handleSubmitOrders = async () => {
    const payload = {
      orderIds: Array.from(selectedOrders),
      referenceId,
      codAmount,
      courierCommission: Number(courierCommission.toFixed(2)),
      netAmountReceived: Number(netAmountReceived),
      receivedDate,
      status,
    };

    // Pass data to parent component (which handles Create vs Update API calls)
    if (onSubmit) {
      onSubmit(payload);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          {remittance ? "Edit Remittance" : "Create Remittance"} - Orders by
          Courier
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
                <Form.Label>COD Amount (Selected)</Form.Label>
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
                <Form.Label>Difference (Commission/Deduction)</Form.Label>
                <Form.Control
                  type="number"
                  value={courierCommission.toFixed(2)}
                  readOnly
                  style={{
                    color: courierCommission < 0 ? "red" : "green",
                    fontWeight: "bold",
                  }}
                />
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
                  <option value="paid">Paid</option>
                  <option value="reconciled">Reconciled</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <hr />

        <Form.Group className="mt-3 mb-3">
          <Form.Label>Search Orders (AWB, Order ID, etc)</Form.Label>
          <Form.Control
            type="text"
            placeholder="Type to search..."
            onChange={(e) => searchAWB(e.target.value)}
          />
        </Form.Group>

        {courierGroups.length === 0 ? (
          <div className="text-center p-4">No available orders found.</div>
        ) : (
          courierGroups.map((courier) => (
            <div key={courier.courier_id} className="mb-4 border p-3 rounded">
              <h6 className="text-primary">{courier.courier_name}</h6>
              <DataTable
                columns={[
                  {
                    name: "Select",
                    cell: (row: OrderRow) => (
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(row._id)}
                        onChange={(e) =>
                          toggleOrderSelection(row._id, e.target.checked)
                        }
                        style={{
                          cursor: "pointer",
                          width: "16px",
                          height: "16px",
                        }}
                      />
                    ),
                    width: "80px",
                  },
                  {
                    name: "Order ID",
                    selector: (row) => row.order_id,
                    sortable: true,
                  },
                  { name: "Store OID", selector: (row) => row.store_order_id },
                  {
                    name: "Amount",
                    selector: (row) => `₹${row.total_amount}`,
                    sortable: true,
                  },
                  { name: "AWB", selector: (row) => row.awb_number },
                ]}
                data={courier.orders}
                dense
                pagination
                paginationPerPage={5}
                highlightOnHover
              />
            </div>
          ))
        )}
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
          {remittance ? "Update Remittance" : "Create Remittance"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditIncomingRemittanceModal;
