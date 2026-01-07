import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button, Card } from "react-bootstrap";
import { toast } from "react-toastify";

interface ButtonConfig {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  payload?: string;
  url?: string;
}

type CreateTemplatePageProps = {
  edit?: any;
  onSubmit: (data: any) => void;
};

const CreateTemplatePage: React.FC<CreateTemplatePageProps> = ({
  edit,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en_US");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [variableExamples, setVariableExamples] = useState<{
    [key: string]: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const updateVariableExamples = () => {
    const varsInBody = extractVariables(body);
    const varsInHeader = extractVariables(header);
    const varsInFooter = extractVariables(footer);
    const allVars = Array.from(
      new Set([...varsInBody, ...varsInHeader, ...varsInFooter])
    );

    // Add new variables with empty string if not already in state
    setVariableExamples((prev) => {
      const updated: { [key: string]: string } = {};
      allVars.forEach((v) => {
        updated[v] = prev[v] || "";
      });
      return updated;
    });
  };

  useEffect(() => {
    updateVariableExamples();
  }, [body, header, footer, buttons]);

  useEffect(() => {
    console.log("Value of Edit", edit);
    if (edit.name != "") {
      console.log("working and is causing crash");
      // console.log(edit[0].name, 'edit')
      setName(edit?.[0].name);
      setCategory(edit?.[0].category);
      setLanguage(edit?.[0].language);
      setHeader(
        edit?.[0]?.components?.filter((i: any) => i.type === "HEADER")?.[0]
          ?.text
      );
      setBody(
        edit?.[0]?.components?.filter((i: any) => i.type === "BODY")?.[0]?.text
      );
      setFooter(
        edit?.[0]?.components?.filter((i: any) => i.type === "FOOTER")?.[0]
          ?.text
      );
      setButtons(
        edit?.[0]?.components?.filter((i: any) => i.type === "BUTTONS")?.[0]
          ?.buttons
      );
      setVariableExamples(edit.variableExamples || {});
    }
  }, [edit]);

  const addButton = () =>
    setButtons([...buttons, { type: "QUICK_REPLY", text: "" }]);
  const removeButton = (index: number) =>
    setButtons(buttons.filter((_, idx) => idx !== index));

  const extractVariables = (text: string): string[] => {
    const regex = /{{(.*?)}}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  };

  // Generate components with named parameter examples
  const generateComponentsWithExamples = () => {
    const components: any[] = [];

    // HEADER
    if (header) {
      const headerVars = extractVariables(header);
      const headerExamples = headerVars.map((v) => ({
        param_name: v,
        example: variableExamples[v] || "",
      }));
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: header,
        example:
          headerVars.length > 0
            ? { header_text_named_params: headerExamples }
            : undefined,
      });
    }

    // BODY
    if (body) {
      const bodyVars = extractVariables(body);
      const bodyExamples = bodyVars.map((v) => ({
        param_name: v,
        example: variableExamples[v] || "",
      }));
      components.push({
        type: "BODY",
        text: body,
        example:
          bodyVars.length > 0
            ? { body_text_named_params: bodyExamples }
            : undefined,
      });
    }

    // FOOTER
    if (footer) {
      const footerVars = extractVariables(footer);
      const footerExamples = footerVars.map((v) => ({
        param_name: v,
        example: variableExamples[v] || "",
      }));
      components.push({
        type: "FOOTER",
        text: footer,
        example:
          footerVars.length > 0
            ? { footer_text_named_params: footerExamples }
            : undefined,
      });
    }

    // BUTTONS
    if (buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: buttons
          .map((btn: any) => {
            if (btn.type === "QUICK_REPLY")
              return { type: "QUICK_REPLY", text: btn.text };
            if (btn.type === "URL")
              return { type: "URL", text: btn.text, url: btn.payload };
            if (btn.type === "PHONE_NUMBER")
              return {
                type: "PHONE_NUMBER",
                text: btn.text,
                phone_number: btn.payload,
              };
            return null;
          })
          .filter(Boolean),
      });
    }

    return components;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !body) {
      toast.error("Template name and body are required.");
      return;
    }

    const payload = {
      name,
      category,
      parameter_format: "NAMED",
      language,
      type: "text",
      components: generateComponentsWithExamples(),
    };

    try {
      setLoading(true);
      await onSubmit(payload);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        {/* Template Name */}
        <Form.Group className="mb-3">
          <Form.Label>
            Template Name{" "}
            <span className="text-muted">(example: order_update_1)</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter template name (lowercase, underscores)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">UTILITY</option>
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
                <option value="es_ES">Spanish (ES)</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Header */}
        <Form.Group className="mb-3">
          <Form.Label>Header (Optional)</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter header text, e.g., Order Update and there should be no emojis."
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
            placeholder="Enter body text, use {{variable_name}} for dynamic fields"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <Form.Text className="text-muted">
            Example: "Hello {"{{full_name}}"}, your order #{"{{order_id}}"} has
            been shipped."
          </Form.Text>
        </Form.Group>

        {/* Footer */}
        <Form.Group className="mb-3">
          <Form.Label>Footer (Optional)</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter footer text and there should be no emojis."
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
          />
        </Form.Group>

        {/* Dynamic Variable Examples */}
        {Object.keys(variableExamples).length > 0 && (
          <Card className="mb-3">
            <Card.Header>Variable Examples</Card.Header>
            <Card.Body>
              {Object.keys(variableExamples).map((v) => (
                <Form.Group key={v} className="mb-2">
                  <Form.Label>{v} Example</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={`Enter example for ${v} (e.g., John Doe)`}
                    value={variableExamples[v]}
                    onChange={(e) => {
                      setVariableExamples((prev) => ({
                        ...prev,
                        [v]: e.target.value,
                      }));
                    }}
                  />
                </Form.Group>
              ))}
            </Card.Body>
          </Card>
        )}

        {/* Buttons */}
        <Form.Group className="mb-3">
          <Form.Label>Buttons (Optional)</Form.Label>
          {buttons?.map((btn, idx) => (
            <Row key={idx} className="mb-2">
              <Col md={3}>
                <Form.Select
                  value={btn.type}
                  onChange={(e) => {
                    const updated = [...buttons];
                    updated[idx].type = e.target.value as ButtonConfig["type"];
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
                  placeholder={
                    btn.type === "QUICK_REPLY"
                      ? "Quick reply text (Yes/No)"
                      : "Button text"
                  }
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
                        ? "Enter URL (https://example.com)"
                        : "Enter phone number (+919876543210)"
                    }
                    value={btn.payload || btn.url || ""}
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

      {/* Live Preview */}
      <Card className="mt-4 border-0">
        <Card.Header className="fw-bold">Live Preview</Card.Header>
        <Card.Body>
          <div className="border rounded p-3 bg-light">
            {header && <h6 className="text-muted">{header}</h6>}
            <p>
              {body?.replace(
                /{{\s*[\w]+\s*}}/g,
                (v) => variableExamples[v] || v
              )}
            </p>
            {footer && <small className="text-muted">{footer}</small>}
            <div className="mt-3">
              {buttons?.map((btn, idx) => (
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
    </>
  );
};

export default CreateTemplatePage;
