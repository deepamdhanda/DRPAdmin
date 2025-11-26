import React, { useEffect, useState } from "react";
import { Card, Col, Row, Spinner, Button } from "react-bootstrap";
import { Folder, FileText, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createAmazonS3, getAllAmazonS3s } from "../../APIs/amazonS3";

interface S3Item {
    key: string;
    url: string;
    size: number;
    lastModified: string;
}

interface S3Folder {
    prefix: string;
}

export interface S3Response {
    bucket: string;
    prefix: string | null;
    files: S3Item[];
    folders: S3Folder[];
}
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";

interface FilePreviewModalProps {
    show: boolean;
    onHide: () => void;
    file: S3Item | null;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ show, onHide, file }) => {
    if (!file) return null;

    const isImage = file.url.match(/\.(jpeg|jpg|png|webp|gif)$/i);

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title className="text-lg font-semibold">
                    {file.key.split("/").pop()}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                {isImage ? (
                    <img
                        src={file.url}
                        alt={file.key}
                        className="max-h-[400px] mx-auto rounded shadow"
                        style={{ objectFit: "contain", maxWidth: "100%", cursor: "pointer" }}
                    />
                ) : (
                    <div className="text-gray-500 text-center py-10">
                        <FileText className="w-10 h-10 mx-auto mb-2" />
                        <p>No preview available for this file type</p>
                    </div>
                )}
                <div className="mt-4 text-sm text-gray-600">
                    Size: {Math.ceil(file.size / 1024)} KB <br />
                    Last Modified:{" "}
                    {formatDistanceToNow(new Date(file.lastModified), {
                        addSuffix: true,
                    })}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                >
                    Download
                </a>
            </Modal.Footer>
        </Modal>
    );
};

const AmazonS3Screen: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<S3Item | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [data, setData] = useState<S3Response | null>(null);
    const [loading, setLoading] = useState(false);
    const [prefixStack, setPrefixStack] = useState<string[]>([]);

    const currentPrefix = prefixStack.join("");

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const res = await getAllAmazonS3s(currentPrefix);
            setData(res);
        } catch (err) {
            console.error("Failed to fetch files:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [currentPrefix]);

    const goIntoFolder = (folderPrefix: string) => {
        setPrefixStack((prev) => [...prev, folderPrefix]);
    };

    const goBack = () => {
        setPrefixStack((prev) => prev.slice(0, -1));
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const res = await createAmazonS3({
                fileName: currentPrefix + file.name,
                fileContent: base64,
            })
            if (res) {
                await fetchFiles();
            } else {
                toast.error("Upload failed");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (key: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this file?");
        if (!confirmed) return;

        const res = await fetch("/api/s3/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
        });

        if (res.ok) {
            await fetchFiles();
        } else {
            toast.error("Failed to delete file");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 mt-4">
                <div className="flex gap-3 justify-content-center" style={{ display: "flex" }}>
                    {prefixStack.length > 0 && (
                        <Button variant="outline-secondary" size="sm" onClick={goBack}>
                            ⬅️ Back
                        </Button>
                    )}
                    <label className="inline-block" style={{ gap: "0.5rem" }}>
                        <input
                            type="file"
                            hidden
                            onChange={handleUpload}
                        />
                        <Button variant="primary" size="sm" onClick={() =>
                            document.querySelector<HTMLInputElement>("input[type='file']")?.click()
                        }>
                            ⬆️ Upload
                        </Button>
                    </label>
                </div>
            </div>

            {/* Loading Spinner */}
            {loading && (
                <div className="text-center py-12">
                    <Spinner animation="border" />
                    <p className="mt-3">Loading files...</p>
                </div>
            )}

            {/* Folders */}
            {!loading && data && data.folders.length > 0 && (
                <Row className="mb-4">
                    {data.folders.map((folder) => (
                        <Col xs={6} sm={4} md={3} lg={2} key={folder.prefix} className="mb-4">
                            <Card
                                onClick={() =>
                                    goIntoFolder(folder.prefix.replace(currentPrefix, ""))
                                }
                                className="cursor-pointer text-center border-0 shadow-sm hover:shadow-lg transition"
                            >
                                <Card.Body className="flex flex-col items-center py-5">
                                    <Folder className="text-yellow-500 w-8 h-8 mb-2" /><br />
                                    <span className="text-sm font-medium text-gray-800">
                                        {folder.prefix
                                            .replace(currentPrefix, "")
                                            .replace("/", "")}
                                    </span>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Files */}
            {!loading && data && data.files.length > 0 && (
                <Row>
                    {data.files.map((file) => (
                        <Col xs={6} sm={4} md={3} lg={2} key={file.key} className="mb-4">
                            <Card
                                className="cursor-pointer border-0 shadow-sm hover:shadow-lg transition"
                                onClick={() => {
                                    setSelectedFile(file);
                                    setShowModal(true);
                                }}
                            >
                                <Card.Body className="p-3">
                                    {file.url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                                        <img
                                            src={file.url}
                                            alt={file.key}
                                            className="rounded w-full h-28 object-cover mb-2"
                                            style={{ objectFit: "cover", maxWidth: "100%", maxHeight: "100px", cursor: "nwse-resize" }}
                                        />
                                    ) : (
                                        <div className="flex justify-center items-center h-28 mb-2 bg-gray-50 rounded">
                                            <FileText className="text-gray-500 w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center gap-1">
                                        <div className="text-sm font-medium text-truncate w-full">
                                            {file.key.split("/").pop()}
                                        </div>
                                        <Trash2
                                            size={16}
                                            className="text-red-500 hover:text-red-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.key);
                                            }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {Math.ceil(file.size / 1024)} KB •{" "}
                                        {formatDistanceToNow(new Date(file.lastModified), {
                                            addSuffix: true,
                                        })}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )
            }

            {/* Empty State */}
            {
                !loading && data && data.folders.length === 0 && data.files.length === 0 && (
                    <div className="text-center text-gray-500 mt-12">
                        <p>📂 This folder is empty. Upload a file to get started.</p>
                    </div>
                )
            }
            <FilePreviewModal
                show={showModal}
                onHide={() => setShowModal(false)}
                file={selectedFile}
            />

        </div >
    );
};

export default AmazonS3Screen;
