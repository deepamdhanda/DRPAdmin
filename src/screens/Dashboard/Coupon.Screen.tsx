import React, { useReducer, useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Row,
  Col,
  Spinner,
  Card,
  Alert,
} from "react-bootstrap";
import { appAxios } from "../../axios/appAxios";
import { BASE_URL } from "../../axios/urls";

enum CouponType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

interface Coupon {
  _id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  validTill: string;
  isGlobal: boolean;
  isActive: boolean;
}

type CouponFormData = Omit<Coupon, "_id">;

const initialFormState: CouponFormData = {
  code: "",
  type: CouponType.PERCENTAGE,
  value: 0,
  minOrderAmount: 0,
  validTill: new Date().toISOString().split("T")[0],
  isGlobal: true,
  isActive: true,
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useReducer(
    (state: CouponFormData, newState: Partial<CouponFormData>) => ({
      ...state,
      ...newState,
    }),
    initialFormState
  );

  const getCoupons = async () => {
    try {
      const { data } = await appAxios.get(`${BASE_URL}/coupon`);

      setCoupons(data.data || []);
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        await appAxios.put(`${BASE_URL}/coupon/${editingId}`, formData);
      } else {
        await appAxios.post(`${BASE_URL}/coupon`, formData);
      }

      await getCoupons();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving coupon:", err);
      alert("Failed to save coupon. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await appAxios.delete(`${BASE_URL}/coupon/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Error deleting coupon:", err);
      alert("Failed to delete coupon.");
      getCoupons(); // Revert if failed
    }
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingId(coupon._id);
    setFormData({
      ...coupon,
      validTill: new Date(coupon.validTill).toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    Object.keys(initialFormState).forEach((key) => {
      setFormData({ [key]: initialFormState[key as keyof CouponFormData] });
    });
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-0">Coupons</h2>
              <small className="text-muted">Manage your store discounts</small>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              + Create New
            </Button>
          </div>

          {coupons.length === 0 ? (
            <Alert variant="light" className="text-center text-muted">
              No coupons found. Create one to get started!
            </Alert>
          ) : (
            <Table hover responsive className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Conditions</th>
                  <th>Expiry</th>
                  <th>Scope</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td>
                      <code className="fw-bold text-primary">
                        {coupon.code}
                      </code>
                    </td>
                    <td>
                      {coupon.type === CouponType.PERCENTAGE
                        ? `${coupon.value}%`
                        : `$${coupon.value}`}
                    </td>
                    <td>
                      <small className="text-muted">
                        Min: ${coupon.minOrderAmount}
                      </small>
                    </td>
                    <td>
                      <Badge
                        bg={
                          new Date(coupon.validTill) > new Date()
                            ? "light"
                            : "danger"
                        }
                        text={
                          new Date(coupon.validTill) > new Date()
                            ? "dark"
                            : "white"
                        }
                      >
                        {new Date(coupon.validTill).toLocaleDateString()}
                      </Badge>
                    </td>
                    <td>
                      <Badge pill bg={coupon.isGlobal ? "success" : "info"}>
                        {coupon.isGlobal ? "Global" : "Private"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-primary text-decoration-none me-2"
                        onClick={() => handleEditClick(coupon)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger text-decoration-none"
                        onClick={() => handleDelete(coupon._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        size="lg"
        backdrop="static" // Prevents closing by clicking outside during edits
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">
              {editingId ? "Edit Coupon" : "Create Promo Code"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-light p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">COUPON CODE</Form.Label>
                  <Form.Control
                    required
                    placeholder="E.G. FLASH50"
                    value={formData.code}
                    disabled={!!editingId} // Usually codes shouldn't change after creation
                    onChange={(e) =>
                      setFormData({ code: e.target.value.toUpperCase() })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    DISCOUNT TYPE
                  </Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ type: e.target.value as CouponType })
                    }
                  >
                    <option value={CouponType.PERCENTAGE}>
                      Percentage (%)
                    </option>
                    <option value={CouponType.FIXED}>Fixed Amount ($)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">VALUE</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ value: Number(e.target.value) })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    MIN. PURCHASE
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({ minOrderAmount: Number(e.target.value) })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">EXPIRY DATE</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.validTill}
                    onChange={(e) => setFormData({ validTill: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Check
                  type="switch"
                  label="Visible to all users (Global)"
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData({ isGlobal: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner size="sm" animation="border" />
              ) : editingId ? (
                "Update Coupon"
              ) : (
                "Save Coupon"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
