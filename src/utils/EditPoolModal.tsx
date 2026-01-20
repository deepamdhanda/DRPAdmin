import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Spinner,
  Row,
  Col,
  Tab,
  Tabs,
} from "react-bootstrap";
import { updatePool } from "../APIs/kyc-verification";

// Re-defining parts of the Pool type for local safety
interface EditPoolModalProps {
  show: boolean;
  onHide: () => void;
  pool: any;
  onSuccess: () => void;
}

const EditPoolModal: React.FC<EditPoolModalProps> = ({
  show,
  onHide,
  pool,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Initialize state with all possible fields
  const [formData, setFormData] = useState({
    name: "",
    status: "",
    kyc_status: "",
    website: "",
    company_type: "",
    wallet_balance: 0,
    gstin: "",
    address: "",
    state: "",
    owner: {
      full_name: "",
      email: "",
      phone: "",
    },
    bank_details: {
      account_number: "",
      ifsc: "",
      holder_name: "",
      // Files (cheque) usually require FormData handling,
      // keeping strictly text/data editing for this example
    },
  });

  // Populate form when pool data changes
  useEffect(() => {
    if (pool) {
      setFormData({
        name: pool.name || "",
        status: pool.status || "active",
        kyc_status: pool.kyc_status || "pending",
        website: pool.website || "",
        company_type: pool.company_type || "",
        wallet_balance: pool.wallet_balance || 0,
        gstin: pool.gstin || "",
        address: pool.address || "",
        state: pool.state || "",
        owner: {
          full_name: pool.owner?.full_name || "",
          email: pool.owner?.email || "",
          phone: pool.owner?.phone || "",
        },
        bank_details: {
          account_number: pool.bank_details?.account_number || "",
          ifsc: pool.bank_details?.ifsc || "",
          holder_name: pool.bank_details?.holder_name || "",
        },
      });
    }
  }, [pool]);

  // Generic handler for top-level fields
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for nested objects (owner, bank_details)
  const handleNestedChange = (
    section: "owner" | "bank_details",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // NOTE: If you are uploading files (logo/cheque), you must use FormData instead of JSON.
      // Currently sending JSON as per your request structure.
      await updatePool(pool._id, formData);
      onSuccess();
      onHide();
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Pool: {pool?.name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || "general")}
            className="mb-3"
          >
            {/* --- TAB 1: GENERAL INFO --- */}
            <Tab eventKey="general" title="General Info">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pool Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Type</Form.Label>
                    <Form.Control
                      type="text"
                      name="company_type"
                      value={formData.company_type}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Wallet Balance</Form.Label>
                    <Form.Control
                      type="number"
                      name="wallet_balance"
                      value={formData.wallet_balance}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pool Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>KYC Status</Form.Label>
                    <Form.Select
                      name="kyc_status"
                      value={formData.kyc_status}
                      onChange={handleChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* --- TAB 2: OWNER INFO --- */}
            <Tab eventKey="owner" title="Owner Details">
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Owner Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="full_name"
                      value={formData.owner.full_name}
                      onChange={(e: any) => handleNestedChange("owner", e)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Owner Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.owner.email}
                      onChange={(e: any) => handleNestedChange("owner", e)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Owner Phone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={formData.owner.phone}
                      onChange={(e: any) => handleNestedChange("owner", e)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* --- TAB 3: LOCATION & LEGAL --- */}
            <Tab eventKey="location" title="Location & Legal">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>GSTIN</Form.Label>
                    <Form.Control
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* --- TAB 4: BANK DETAILS --- */}
            <Tab eventKey="bank" title="Bank Details">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="account_number"
                      value={formData.bank_details.account_number}
                      onChange={(e: any) =>
                        handleNestedChange("bank_details", e)
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>IFSC Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="ifsc"
                      value={formData.bank_details.ifsc}
                      onChange={(e: any) =>
                        handleNestedChange("bank_details", e)
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Account Holder Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="holder_name"
                      value={formData.bank_details.holder_name}
                      onChange={(e: any) =>
                        handleNestedChange("bank_details", e)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />{" "}
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditPoolModal;
