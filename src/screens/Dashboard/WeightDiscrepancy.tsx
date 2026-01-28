import React, { useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { appAxios } from "../../axios/appAxios";
import { BASE_URL } from "../../axios/urls";
import { toast } from "react-toastify";

interface CSVRow {
  [key: string]: string;
}

// Target fields updated to match your Model labels for clarity
const TARGET_FIELDS = [
  "AWB Number",
  "Entered Weight",
  "Initial Amount",
  "Charge Weight",
  "Final Charge",
] as const;

type TargetField = (typeof TARGET_FIELDS)[number];

const MultiFieldCSVProcessor: React.FC = () => {
  const [rawData, setRawData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<TargetField, string>>(
    {} as Record<TargetField, string>
  );
  const [imageMappings, setImageMappings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRawData(results.data);
        if (results.data.length > 0) {
          setCsvHeaders(Object.keys(results.data[0]));
        }
      },
    });
  };

  const handleMappingChange = (field: TargetField, csvColumn: string) => {
    setMappings((prev) => ({ ...prev, [field]: csvColumn }));
  };

  const toggleImageMapping = (column: string) => {
    setImageMappings((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const processAndLogData = async () => {
    if (!mappings["AWB Number"]) {
      toast.error("Please map the AWB Number field");
      return;
    }

    setIsProcessing(true);

    const processedData = rawData.map((row) => {
      // Map multi-select images
      const courier_images = imageMappings
        .map((colName) => row[colName])
        .filter((val) => val && val.trim() !== "");

      // Match the Mongoose Model exactly
      return {
        awb_number: row[mappings["AWB Number"]],
        entered_weight: parseFloat(row[mappings["Entered Weight"]]) || 0,
        initial_amount: parseFloat(row[mappings["Initial Amount"]]) || 0,
        charge_weight: parseFloat(row[mappings["Charge Weight"]]) || 0,
        final_charge: parseFloat(row[mappings["Final Charge"]]) || 0,
        courier_images: courier_images,
        chat: [], // Defaulting to empty array as per model
      };
    });

    try {
      // Sending the array of objects to your POST route
      await appAxios.post(`${BASE_URL}/weight-discrepancy`, processedData);
      toast.success(`${processedData.length} Discrepancies Created`);
      setRawData([]); // Clear after success
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload data");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <Card
        style={{ padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
      >
        <h2>Weight Discrepancy CSV Uploader</h2>
        <p className="text-muted">
          Map your CSV columns to the database fields below.
        </p>

        <div
          style={{
            padding: "20px",
            border: "2px dashed #ccc",
            borderRadius: "8px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </div>

        {csvHeaders.length > 0 && (
          <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
            {/* Standard Fields Section */}
            <div style={{ flex: "1 1 400px" }}>
              <h3
                style={{
                  fontSize: "18px",
                  borderBottom: "2px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                Database Field Mapping
              </h3>
              {TARGET_FIELDS.map((field) => (
                <div
                  key={field}
                  style={{
                    marginBottom: "15px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      color: "#555",
                    }}
                  >
                    {field}
                  </label>
                  <select
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                    value={mappings[field] || ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <option value="">-- Select CSV Column --</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Courier Images Section */}
            <div
              style={{
                flex: "1 1 300px",
                background: "#fcfcfc",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ fontSize: "18px" }}>Courier Images</h3>
              <p style={{ fontSize: "12px", color: "#666" }}>
                Select all columns containing proof images.
              </p>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid #eee",
                  padding: "10px",
                  background: "#fff",
                }}
              >
                {csvHeaders.map((header) => (
                  <label
                    key={header}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "5px 0",
                      cursor: "pointer",
                      borderBottom: "1px solid #f9f9f9",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={imageMappings.includes(header)}
                      onChange={() => toggleImageMapping(header)}
                    />
                    <span style={{ fontSize: "14px" }}>{header}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {csvHeaders.length > 0 && (
          <button
            onClick={processAndLogData}
            disabled={isProcessing}
            style={{
              marginTop: "30px",
              width: "100%",
              padding: "15px",
              backgroundColor: isProcessing ? "#666" : "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: isProcessing ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {isProcessing ? "Processing..." : "Upload to Database"}
          </button>
        )}
      </Card>
    </div>
  );
};

// Helper Card Component for styling
const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div style={{ background: "#fff", borderRadius: "12px", ...style }}>
    {children}
  </div>
);

export default MultiFieldCSVProcessor;
