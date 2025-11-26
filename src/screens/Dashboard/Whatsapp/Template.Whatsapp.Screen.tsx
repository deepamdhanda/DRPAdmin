import { useEffect, useRef, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import DataTable from "react-data-table-component";
import {
  createTemplate, getAllTemplates, getTemplateById, updateTemplate
} from "../../../APIs/whatsapp/template";
import CreateTemplatePage from "../../../utils/CreateWhatsappTemplate";

export type Template = {
  _id?: string;
  name: string;
  subject: string;
  variables: string[];
  bodyHtml?: string;
  approved?: boolean;
  bodyJson?: any; // JSON representation of the template body
};

const TemplatesScreen = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const templateEditorRef = useRef<any>(null);

  useEffect(() => {
    getAllTemplates().then((res) => {
      setTemplates(res);
      setLoading(false);
    });
  }, [showModal]);


  const handleEdit = async (id: string) => {
    const res = await getTemplateById(id);
    if (selectedTemplate?.bodyHtml && templateEditorRef.current) {
      templateEditorRef.current.editor.loadHtml(selectedTemplate.bodyHtml);
    }
    setSelectedTemplate(res as any);
    setShowModal(true);
    setIsPreview(false);
  };

  const handlePreview = async (id: string) => {
    const res = await getTemplateById(id);
    setSelectedTemplate(res as any);
    setIsPreview(true);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedTemplate({
      name: "",
      subject: "",
      variables: [],
    });
    setIsPreview(false);
    setShowModal(true);
  };

  const handleSave = async (template: any) => {
    if (template._id) {
      await updateTemplate(template._id, template);
    } else {
      await createTemplate(template);
    }

    setShowModal(false);
    setSelectedTemplate(null);
  };

  const columns = [
    { name: "Name", selector: (row: Template) => row.name, sortable: true },
    { name: "Subject", selector: (row: Template) => row.subject, sortable: true },
    { name: "Approved", selector: (row: Template) => (row.approved ? "✅" : "❌") },
    {
      name: "Actions",
      cell: (row: Template) => (
        <>
          <Button size="sm" variant="primary" onClick={() => handleEdit(row._id!)}>Edit</Button>{" "}
          <Button size="sm" variant="info" onClick={() => handlePreview(row._id!)}>Preview</Button>
        </>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <h3>Template Templates</h3>
      <Button variant="primary" onClick={handleCreate}>+ New Template</Button>

      {loading ? (
        <Spinner animation="border" className="mt-3" />
      ) : (
        <DataTable columns={columns} data={templates} pagination className="mt-3" />
      )}

      <Modal size="xl" show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isPreview ? `Preview Template Template` : selectedTemplate?._id ? "Edit Template" : "Create Template"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreateTemplatePage onSubmit={handleSave} edit={selectedTemplate} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TemplatesScreen;
