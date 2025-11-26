import React, { useRef, useCallback } from "react";
import EmailEditor from "react-email-editor";
import { Button } from "react-bootstrap";

type Props = {
  onChange?: (design: any) => void;
};

const EmailTemplateEditor: React.FC<Props> = ({ onChange }) => {
  const emailEditorRef = useRef<any>(null);

  const exportHtml = useCallback(() => {
    if (!emailEditorRef.current) {
      console.warn("EmailEditor ref not ready");
      return;
    }
    const editor = emailEditorRef.current.editor;
    if (!editor) {
      console.warn("Editor instance not ready");
      return;
    }
    editor.exportHtml(({ design, html }: any) => {
      console.log("Exported HTML:", html);
      console.log("Exported Design:", design);
    });
  }, []);

  const handleDesignChange = useCallback(() => {
    if (!emailEditorRef.current || !onChange) return;

    const editor = emailEditorRef.current.editor;
    if (!editor) return;

    editor.saveDesign((design: any) => {
      onChange(design);
    });
  }, [onChange]);
  handleDesignChange();
  return (
    <div>
      <EmailEditor ref={emailEditorRef} />
      <div className="mt-3">
        <Button onClick={exportHtml} variant="primary" size="sm">
          Export HTML
        </Button>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
