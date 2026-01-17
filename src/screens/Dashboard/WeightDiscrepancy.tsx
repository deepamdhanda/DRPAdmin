import React, { useState, type ChangeEvent } from "react";
import Papa from "papaparse";

interface CSVRow {
  [key: string]: string;
}

// Predefined target fields
const TARGET_FIELDS = [
  "AWB",
  "Entered Weight",
  "Initial Amount Charge",
  "Charge Weight",
  "Final Charge",
] as const;

type TargetField = (typeof TARGET_FIELDS)[number];

const MultiFieldCSVProcessor: React.FC = () => {
  const [rawData, setRawData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  // Standard mappings (Single select)
  const [mappings, setMappings] = useState<Record<TargetField, string>>(
    {} as Record<TargetField, string>
  );

  // Multi-select mapping for Courier Images
  const [imageMappings, setImageMappings] = useState<string[]>([]);

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

  const processAndLogData = () => {
    const processedData = rawData.map((row) => {
      const initialAmount =
        parseFloat(row[mappings["Initial Amount Charge"]]) || 0;
      const finalCharge = parseFloat(row[mappings["Final Charge"]]) || 0;

      // Extract all selected image columns into one array
      const courierImages = imageMappings
        .map((colName) => row[colName])
        .filter((val) => val && val.trim() !== ""); // Remove empty values

      return {
        awb: row[mappings["AWB"]],
        courierImages: courierImages, // This is now your array of multiple fields
        enteredWeight: parseFloat(row[mappings["Entered Weight"]]) || 0,
        initialAmountCharge: initialAmount,
        chargeWeight: parseFloat(row[mappings["Charge Weight"]]) || 0,
        finalCharge: finalCharge,
        ourCharge: Number((finalCharge - initialAmount).toFixed(2)),
      };
    });

    console.log("Final Processed Array:", processedData);
    alert("Data processed! Check the console for the array of objects.");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <h2>CSV Mapping Tool</h2>

      <div
        style={{ padding: "15px", background: "#f9f9f9", borderRadius: "8px" }}
      >
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>

      {csvHeaders.length > 0 && (
        <div style={{ marginTop: "20px", display: "flex", gap: "40px" }}>
          {/* Standard Fields Section */}
          <div style={{ flex: 1 }}>
            <h3>Standard Field Mapping</h3>
            {TARGET_FIELDS.map((field) => (
              <div
                key={field}
                style={{
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {field}:
                </label>
                <select
                  onChange={(e) => handleMappingChange(field, e.target.value)}
                  value={mappings[field] || ""}
                  style={{ width: "200px", padding: "5px" }}
                >
                  <option value="">-- Select Column --</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Multi-Select Image Section */}
          <div
            style={{
              flex: 1,
              borderLeft: "1px solid #ddd",
              paddingLeft: "40px",
            }}
          >
            <h3>Courier Images (Select Multiple)</h3>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Select all columns that contain image URLs/Paths:
            </p>
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #ddd",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              {csvHeaders.map((header) => (
                <div key={header} style={{ marginBottom: "5px" }}>
                  <label
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={imageMappings.includes(header)}
                      onChange={() => toggleImageMapping(header)}
                    />
                    {header}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {csvHeaders.length > 0 && (
        <button
          onClick={processAndLogData}
          style={{
            marginTop: "30px",
            padding: "12px 24px",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Generate & Log Final Array
        </button>
      )}
    </div>
  );
};

export default MultiFieldCSVProcessor;
