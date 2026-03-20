import { useEffect, useState } from "react";
import { appAxios } from "../../axios/appAxios";
import { BASE_URL } from "../../axios/urls";
import {
  Tab,
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Card,
  Image,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { toast } from "react-toastify";

// --- Interfaces ---
interface Chat {
  type: "reporter" | "admin";
  message: string;
  attachment_key?: string;
  _id: string;
  createdAt: Date | string;
}

interface Dispute {
  _id: string;
  awb_number: string;
  entered_weight: number;
  initial_amount: number;
  charge_weight: number;
  final_charge: number;
  chat: Chat[];
  courier_images: string[];
  status: "pending" | "accepted" | "dispute";
}

const DisputeManager = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<string>("all");
  const [data, setData] = useState<Dispute[]>([]);

  // Modal States
  const [showDetails, setShowDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEdit, setShowEdit] = useState(false); // <--- NEW: Edit Modal State

  const [selectedItem, setSelectedItem] = useState<Dispute | null>(null);

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<Dispute>>({});
  const [updating, setUpdating] = useState(false);

  // Chat Reply State
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const isDispute = activeTab === "dispute";
      const url = `${BASE_URL}/weight-discrepancy${
        isDispute ? "?type=dispute" : ""
      }`;
      const { data: discrepancy } = await appAxios.get(url);
      setData(discrepancy.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- Handlers ---
  const handleOpenDetails = (item: Dispute) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const handleOpenChat = (item: Dispute) => {
    setSelectedItem(item);
    setShowChat(true);
    setReplyMessage("");
  };

  // NEW: Open Edit Modal and populate form
  const handleOpenEdit = (item: Dispute) => {
    setSelectedItem(item);
    setEditFormData({
      entered_weight: item.entered_weight,
      charge_weight: item.charge_weight,
      final_charge: item.final_charge,
      status: item.status,
    });
    setShowEdit(true);
  };

  // NEW: Handle Input Change for Edit Form
  const handleEditChange = (field: keyof Dispute, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  // NEW: Save Changes to Backend
  const handleSaveChanges = async () => {
    if (!selectedItem) return;
    setUpdating(true);
    try {
      // NOTE: Adjust the endpoint path if your API is different
      await appAxios.put(
        `${BASE_URL}/weight-discrepancy/update/${selectedItem._id}`,
        editFormData
      );

      // Refresh local data
      fetchData();
      setShowEdit(false);
      toast.success("Discrepancy Updated Successfully");
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update record.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedItem) return;

    setSending(true);
    try {
      const newChat: Chat = {
        _id: Date.now().toString(),
        type: "admin",
        message: replyMessage,
        createdAt: new Date(),
      };
      await appAxios.post(`${BASE_URL}/weight-discrepancy/add-message`, {
        awb_number: selectedItem.awb_number,
        message: replyMessage,
      });
      // Optimistic update
      const updatedItem = {
        ...selectedItem,
        chat: [...selectedItem.chat, newChat],
      };
      setSelectedItem(updatedItem);
      fetchData(); // Refresh to be safe
      setReplyMessage("");
    } catch (err) {
      console.error("Failed to send reply", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // --- Render Helpers ---
  const renderTable = () => (
    <Table striped bordered hover responsive className="mt-3">
      <thead>
        <tr>
          <th>AWB Number</th>
          <th>Entered Weight</th>
          <th>Charged Weight</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item) => (
            <tr key={item._id}>
              <td>{item.awb_number}</td>
              <td>{item.entered_weight} kg</td>
              <td>
                <span className="text-danger fw-bold">
                  {item.charge_weight} kg
                </span>
              </td>
              <td>
                <span
                  className={`badge ${
                    item.status === "accepted"
                      ? "bg-success"
                      : item.status === "dispute"
                      ? "bg-warning"
                      : "bg-secondary"
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  className="me-2 text-white"
                  onClick={() => handleOpenDetails(item)}
                >
                  View
                </Button>

                {/* NEW: Edit Button */}
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2 text-white"
                  onClick={() => handleOpenEdit(item)}
                >
                  Edit
                </Button>

                {(activeTab === "dispute" || item.chat.length > 0) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenChat(item)}
                  >
                    {item.chat.length > 0
                      ? `Chat (${item.chat.length})`
                      : "Start Dispute"}
                  </Button>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center py-4">
              No records found.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );

  return (
    <Container className="py-4">
      <h3 className="mb-4">Weight Discrepancy Manager</h3>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "all")}
        className="mb-3"
      >
        <Tab eventKey="all" title="All Discrepancies">
          {renderTable()}
        </Tab>
        <Tab eventKey="dispute" title="Active Disputes">
          {renderTable()}
        </Tab>
      </Tabs>

      {/* --- Modal 1: Details Popup --- */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Details: {selectedItem?.awb_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div>
              <div className="d-flex justify-content-between mb-4">
                <Card className="p-3 bg-light border-0">
                  <small>Entered Weight</small>
                  <h4>{selectedItem.entered_weight} kg</h4>
                </Card>
                <Card className="p-3 bg-light border-0">
                  <small>Charged Weight</small>
                  <h4 className="text-danger">
                    {selectedItem.charge_weight} kg
                  </h4>
                </Card>
                <Card className="p-3 bg-light border-0">
                  <small>Extra Charge</small>
                  <h4>
                    ₹ {selectedItem.final_charge - selectedItem.initial_amount}
                  </h4>
                </Card>
              </div>

              <h5>Courier Evidence</h5>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {selectedItem.courier_images.length > 0 ? (
                  selectedItem.courier_images.map((img, idx) => (
                    <Image
                      key={idx}
                      src={img}
                      thumbnail
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />
                  ))
                ) : (
                  <p className="text-muted">No images provided by courier.</p>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- NEW Modal 2: Edit/Update Popup --- */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Discrepancy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Entered Weight (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editFormData.entered_weight}
                    onChange={(e) =>
                      handleEditChange(
                        "entered_weight",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Charged Weight (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editFormData.charge_weight}
                    onChange={(e) =>
                      handleEditChange(
                        "charge_weight",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Final Charge Amount (₹)</Form.Label>
              <Form.Control
                type="number"
                value={editFormData.final_charge}
                onChange={(e) =>
                  handleEditChange("final_charge", parseFloat(e.target.value))
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editFormData.status}
                onChange={(e) => handleEditChange("status", e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="dispute">Dispute (Open)</option>
                <option value="accepted">Accepted (Closed)</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveChanges}
            disabled={updating}
          >
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- Modal 3: Chat/Reply Popup --- */}
      <Modal show={showChat} onHide={() => setShowChat(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Dispute Chat: {selectedItem?.awb_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column" style={{ height: "60vh" }}>
          {/* Chat History */}
          <div className="flex-grow-1 overflow-auto p-3 border rounded mb-3 bg-light">
            {selectedItem?.chat && selectedItem.chat.length > 0 ? (
              selectedItem.chat.map((msg) => (
                <div
                  key={msg._id}
                  className={`d-flex flex-column mb-3 ${
                    msg.type === "admin"
                      ? "align-items-end"
                      : "align-items-start"
                  }`}
                >
                  <div
                    className={`p-2 rounded text-white ${
                      msg.type === "admin" ? "bg-primary" : "bg-secondary"
                    }`}
                    style={{ maxWidth: "75%" }}
                  >
                    {msg.message}
                  </div>
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {msg.type.toUpperCase()} •{" "}
                    {new Date(msg.createdAt).toLocaleString()}
                  </small>
                </div>
              ))
            ) : (
              <div className="text-center text-muted mt-5">
                No messages yet.
              </div>
            )}
          </div>

          {/* Reply Input */}
          <Form.Group>
            <Form.Label>Reply as Admin</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Type your response here..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChat(false)}>
            Close
          </Button>
          <Button
            variant="success"
            onClick={handleSendReply}
            disabled={sending || !replyMessage.trim()}
          >
            {sending ? "Sending..." : "Send Reply"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DisputeManager;
