import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";
import { BASE_URL } from "../../../axios/urls";
import { appAxios } from "../../../axios/appAxios";

interface ButtonConfig {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  payload?: string;
}

const CreateTemplatePage: React.FC = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en_US");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addButton = () => {
    setButtons([...buttons, { type: "QUICK_REPLY", text: "" }]);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !body) {
      setError("Template name and body are required.");
      return;
    }

    const payload = {
      name,
      category,
      parameter_format: "NAMED",
      language,
      components: [
        header ? { type: "HEADER", format: "TEXT", text: header } : null,
        { type: "BODY", text: body },
        footer ? { type: "FOOTER", text: footer } : null,
        buttons.length > 0
          ? {
              type: "BUTTONS",
              buttons: buttons
                .map((btn) => {
                  if (btn.type === "QUICK_REPLY") {
                    return { type: "QUICK_REPLY", text: btn.text };
                  }
                  if (btn.type === "URL") {
                    return { type: "URL", text: btn.text, url: btn.payload };
                  }
                  if (btn.type === "PHONE_NUMBER") {
                    return {
                      type: "PHONE_NUMBER",
                      text: btn.text,
                      phone_number: btn.payload,
                    };
                  }
                  return null;
                })
                .filter(Boolean),
            }
          : null,
      ].filter(Boolean),
    };

    try {
      setLoading(true);
      // const res = await fetch(`${BASE_URL}/whatsapp/template`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      const res = await appAxios.post(`${BASE_URL}/whatsapp/template`, {
        payload,
      });

      if (!res) throw new Error("Failed to create template");

      setSuccess("Template created successfully! 🎉");
      setName("");
      setHeader("");
      setBody("");
      setFooter("");
      setButtons([]);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: "800px" }}>
      <h3 className="mb-4 text-center fw-bold">Create WhatsApp Template</h3>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Alerts */}
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Template Name */}
            <Form.Group className="mb-3">
              <Form.Label>Template Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter template name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Use lowercase, numbers, and underscores only (e.g.,
                order_update_1).
              </Form.Text>
            </Form.Group>

            {/* Category & Language */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="MARKETING">MARKETING</option>
                    <option value="UTILITY">UTILITY</option>
                    <option value="AUTHENTICATION">AUTHENTICATION</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Language</Form.Label>
                  <Form.Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en_US">English (US)</option>
                    <option value="hi_IN">Hindi (IN)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Header */}
            <Form.Group className="mb-3">
              <Form.Label>Header (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter header text"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
              />
            </Form.Group>

            {/* Body */}
            <Form.Group className="mb-3">
              <Form.Label>Body</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter main message body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                You can use variables like {"{{1}}"}, {"{{2}}"} for
                personalization.
              </Form.Text>
            </Form.Group>

            {/* Footer */}
            <Form.Group className="mb-3">
              <Form.Label>Footer (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter footer text"
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
              />
            </Form.Group>

            {/* Buttons */}
            <Form.Group className="mb-3">
              <Form.Label>Buttons</Form.Label>
              {buttons.map((btn, idx) => (
                <Row key={idx} className="mb-2">
                  <Col md={3}>
                    <Form.Select
                      value={btn.type}
                      onChange={(e) => {
                        const updated = [...buttons];
                        updated[idx].type = e.target
                          .value as ButtonConfig["type"];
                        setButtons(updated);
                      }}
                    >
                      <option value="QUICK_REPLY">Quick Reply</option>
                      <option value="URL">URL</option>
                      <option value="PHONE_NUMBER">Phone Number</option>
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Control
                      type="text"
                      placeholder="Button text"
                      value={btn.text}
                      onChange={(e) => {
                        const updated = [...buttons];
                        updated[idx].text = e.target.value;
                        setButtons(updated);
                      }}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    {btn.type !== "QUICK_REPLY" && (
                      <Form.Control
                        type="text"
                        placeholder={
                          btn.type === "URL"
                            ? "Enter URL"
                            : "Enter phone number"
                        }
                        value={btn.payload || ""}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[idx].payload = e.target.value;
                          setButtons(updated);
                        }}
                        required
                      />
                    )}
                  </Col>
                  <Col md={1} className="d-flex align-items-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeButton(idx)}
                    >
                      ✕
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="outline-primary" size="sm" onClick={addButton}>
                + Add Button
              </Button>
            </Form.Group>

            {/* Submit */}
            <div className="d-flex justify-content-end">
              <Button type="submit" variant="success" disabled={loading}>
                {loading ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Live Preview */}
      <Card className="mt-4 border-0 shadow-sm">
        <Card.Header className="fw-bold">Live Preview</Card.Header>
        <Card.Body>
          <div className="border rounded p-3 bg-light">
            {header && <h6 className="text-muted">{header}</h6>}
            <p>{body || "Your message body will appear here..."}</p>
            {footer && <small className="text-muted">{footer}</small>}
            <div className="mt-3">
              {buttons.map((btn, idx) => (
                <Button
                  key={idx}
                  variant="outline-secondary"
                  size="sm"
                  className="me-2 mb-2"
                >
                  {btn.text || "Button"}
                </Button>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateTemplatePage;
