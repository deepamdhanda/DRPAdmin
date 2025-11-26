import React, { useEffect, useState } from 'react';
import { Card, Modal, Button, Form } from 'react-bootstrap';
import Tree from 'react-d3-tree';

import { getAllTemplates } from '../APIs/whatsapp/template';
import { getAllEmailTemplates } from '../APIs/emailTemplate';
import { getAllAutomations } from '../APIs/automations';
import { toast } from 'react-toastify';
import type { EmailTemplate } from '../screens/Dashboard/Marketing/Template.Email.Screen';
import type { Template } from '../screens/Dashboard/Whatsapp/Template.Whatsapp.Screen';
import type { Automation } from '../screens/Dashboard/Marketing/Automation.Screen';
import { getAllContactLists } from '../APIs/contactList';
import type { ContactList } from '../screens/Dashboard/Marketing/ContactLists.Screen';

export interface TreeNode {
    id: string;
    name: string;
    type: string | null;
    key?: string;
    attributes: { type: string; description: string };
    children?: TreeNode[];
    nodeConfig?: any;
}

let initialTreeData: TreeNode[] = [
    {
        id: 'root',
        key: 'root',
        name: 'Trigger',
        type: null,
        attributes: {
            type: 'Step',
            description: 'Click on Edit to initiate the process',
        },
        children: [],
    },
];

const addChildToNode = (
    tree: TreeNode[],
    nodeId: string,
    newChild: TreeNode
): TreeNode[] => {
    return tree.map((node) => {
        if (node.id === nodeId) {
            if (
                newChild.name.toLowerCase().includes('if/else') &&
                Array.isArray(newChild.children)
            ) {
                const trueBranchIndex = newChild.children.findIndex(c => c.id.endsWith('_true'));
                if (trueBranchIndex !== -1) {
                    const existingChildren = node.children || [];
                    newChild.children[trueBranchIndex] = {
                        ...newChild.children[trueBranchIndex],
                        children: [...(newChild.children[trueBranchIndex].children || []), ...existingChildren],
                    };
                }
            }

            return {
                ...node,
                children: [newChild],
            };
        }

        if (node.children) {
            return {
                ...node,
                children: addChildToNode(node.children, nodeId, newChild),
            };
        }

        return node;
    });
};

export default function VisualTree({ content, onChange }: any) {

    const [allAutomations, setAllAutomations] = useState<Automation[]>([]);
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [whatsappMessageTemplates, setWhatsappMessageTemplates] = useState<Template[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

    if (content.length > 0) {
        initialTreeData = content;
    }

    const [treeData, setTreeData] = useState<TreeNode[]>(initialTreeData);
    const [showModal, setShowModal] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedNodeType, setSelectedNodeType] = useState<any>(null);
    const [nodeConfig, setNodeConfig] = useState<any>();
    const [isEditing, setIsEditing] = useState(false);
    const [editingNodePath, setEditingNodePath] = useState<string[]>([]);

    useEffect(() => {
        getAllAutomations()
            .then((automations) => setAllAutomations(automations as any))
            .catch(() => toast.error('Failed to load automations'));

        getAllTemplates()
            .then((templates) => setWhatsappMessageTemplates(templates as any))
            .catch(() => toast.error('Failed to load WhatsApp templates'));

        getAllEmailTemplates()
            .then((templates) => setEmailTemplates(templates as any))
            .catch(() => toast.error('Failed to load email templates'));
        getAllContactLists()
            .then((lists) => setContactLists(lists as any))
            .catch(() => toast.error('Failed to load contact lists'));
    }, []);

    useEffect(() => {
        onChange(treeData);
    }, [treeData]);

    const nodeOptions = [
        {
            type: "logic",
            key: "root",
            label: "Trigger",
            childNodeCount: 0,
            fields: [
                {
                    type: "select",
                    label: "Select Trigger",
                    key: "trigger",
                    values: [
                        // { label: "Lead Registered (ID Required)", value: "lead_registered" },
                        { label: "Contact List Added", value: "contact_list_added" },
                        { label: "New Signup", value: "new_signup" },
                        { label: "New Unshipped Orders", value: "new_unshipped_orders" },
                        { label: "Call Scheduled", value: "call_scheduled" },
                        { label: "Feedback", value: "feedback" },
                    ],
                }
            ],
        },
        {
            type: "logic",
            key: "if_else",
            label: "If/Else",
            childNodeCount: 2,
            fields: [
                {
                    type: "select",
                    label: "Condition Type",
                    key: "applies_on",
                    values: [
                        { label: "CTA Clicked", value: "cta_clicked" },
                    ],
                }
            ],
        },
        {
            type: "action",
            key: "send_whatsapp",
            label: "Send WhatsApp",
            fields: [
                {
                    type: "select",
                    label: "WhatsApp Template",
                    key: "whatsapp_template_id",
                    values: whatsappMessageTemplates.map((t: any) => ({
                        label: t.template_name || t.name,
                        value: t._id,
                    })),
                }
            ],
        },
        {
            type: "action",
            key: "send_email",
            label: "Send Email",
            fields: [
                {
                    type: "select",
                    label: "Email Template",
                    key: "email_template_id",
                    values: emailTemplates.map((t: any) => ({
                        label: t.name || t.template_name || t.id,
                        value: t._id,
                    })),
                }
            ],
        },
        {
            type: "action",
            key: "initiate_call",
            label: "Initiate Call",
            fields: [
                {
                    type: "text",
                    label: "Pitch Link",
                    key: "pitch_link",
                    placeholder: "e.g. https://aws...",
                },
            ],
        },
        {
            type: "logic",
            key: "wait",
            label: "Wait",
            fields: [
                {
                    type: "number",
                    label: "Wait Time",
                    key: "duration",
                    placeholder: "e.g. 60",
                },
                {
                    type: "select",
                    label: "Unit",
                    key: "unit",
                    values: [
                        { label: "Minutes", value: "minutes" },
                        { label: "Hours", value: "hours" },
                        { label: "Days", value: "days" },
                    ],
                },
            ],
        },
        {
            type: "action",
            key: "finish_automation",
            label: "Finish Automation",
            fields: []
        },
        {
            type: "logic",
            key: "link_automation",
            label: "Link Automation",
            fields: [
                {
                    type: "select",
                    label: "Select Automation",
                    key: "automation_id",
                    values: allAutomations.map((a: any) => ({
                        label: a.name || a.title || a._id,
                        value: a._id,
                    })),
                },
            ],
        },
    ];


    useEffect(() => {
        onChange(treeData)
    }, [treeData])

    const closeModal = () => {
        setShowModal(false);
        setSelectedNodeId(null);
        setSelectedNodeType(null);
        setStep(1);
        setNodeConfig('');
    };

    const handleNodeTypeSelect = (node: any) => {
        setSelectedNodeType(node);
        setStep(2);
        !node.fields && setShowModal(false)
    };


    const openModal = (nodeId: string) => {
        setShowModal(true);
        setSelectedNodeId(nodeId);
        setStep(1);
        setSelectedNodeType(null);
        setNodeConfig({});
        setIsEditing(false);
    };

    const openEditModal = (node: TreeNode, path: string[]) => {
        setShowModal(true);
        setSelectedNodeId(node.id);
        console.log(nodeOptions.find(opt => opt.key === node.key))
        setSelectedNodeType(nodeOptions.find(opt => opt.key === node.key) || null);
        setNodeConfig({});
        setIsEditing(true);
        setStep(2);
        setEditingNodePath(path);
    };

    const updateNodeInTree = (
        tree: TreeNode[],
        path: string[],
        updatedFields: Partial<TreeNode>
    ): TreeNode[] => {
        if (path.length === 0) return tree;
        return tree.map((node) => {
            if (node.id === path[0]) {
                if (path.length === 1) {
                    return { ...node, ...updatedFields };
                } else if (node.children) {
                    return {
                        ...node,
                        children: updateNodeInTree(node.children, path.slice(1), updatedFields),
                    };
                }
            }
            return node;
        });
    };
    const findLabel = (key: string, value: string) => {
        if (key === "Send Email") {
            const template = emailTemplates.find(t => t._id === value);
            return template ? (template.name) : value;
        }
        if (key === "Send Whatsapp") {
            const template = whatsappMessageTemplates.find(t => t._id === value);
            return template ? (template.name) : value;
        }
        if (key === "Link Automation") {
            const automation = allAutomations.find(a => a._id === value);
            return automation ? (automation.name) : value;
        }
        return value;
    }
    const handleAddConfiguredNode = () => {
        if (!selectedNodeId || !selectedNodeType) return;

        const toTitleCase = (str: string | string[]) =>
            (
                typeof str === "string"
                    ? str
                    : Array.isArray(str)
                        ? str.join(", ")
                        : ""
            )
                .replace(/_/g, " ")
                .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1));

        const configString = Object.entries(nodeConfig)
            .map(([k, v]) => `${toTitleCase(k)}: ${toTitleCase(v as string)}`)
            .join(', \n');


        if (isEditing) {
            const updated = updateNodeInTree(treeData, editingNodePath, {
                name: selectedNodeType.label,
                type: selectedNodeType.type,
                key: selectedNodeType.key,
                attributes: {
                    type: selectedNodeType.label,
                    description: configString,
                },
                nodeConfig
            });
            setTreeData(structuredClone(updated));
        } else {
            const newNodeId = `node_${Date.now()}`;

            const trueChild: TreeNode = {
                id: `${newNodeId}_true`,
                name: 'Yes',
                type: 'condition_true_branch',
                key: "true_node",
                attributes: {
                    type: 'Branch',
                    description: 'This path is taken if condition is TRUE',
                },
                children: [],
                nodeConfig
            };

            const falseChild: TreeNode = {
                id: `${newNodeId}_false`,
                name: 'No',
                key: "false_node",
                type: 'condition_false_branch',
                attributes: {
                    type: 'Branch',
                    description: 'This path is taken if condition is FALSE',
                },
                children: [],
            };

            let newNode: TreeNode = {
                id: newNodeId,
                name: selectedNodeType.label,
                type: selectedNodeType.type,
                key: selectedNodeType.key,
                attributes: {
                    type: selectedNodeType.label,
                    description: configString || `Auto-generated ${selectedNodeType.label}`,
                },
                nodeConfig,
                children: selectedNodeType.label.toLowerCase().includes('if/else')
                    ? [trueChild, falseChild]
                    : [],
            };

            const updated = addChildToNode(treeData, selectedNodeId, newNode);
            setTreeData(structuredClone(updated));
        }

        closeModal();
    };


    const findNodePath = (nodeId: string, tree: TreeNode[], path: string[] = []): string[] | null => {
        for (let node of tree) {
            const newPath = [...path, node.id];
            if (node.id === nodeId) return newPath;
            if (node.children) {
                const childPath = findNodePath(nodeId, node.children, newPath);
                if (childPath) return childPath;
            }
        }
        return null;
    };

    const renderForeignObjectNode = ({
        nodeDatum,
        toggleNode,
        foreignObjectProps,
    }: any) => (
        <g>
            <foreignObject {...foreignObjectProps}>
                {nodeDatum.type !== "condition_true_branch" && nodeDatum.type !== "condition_false_branch" ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', top: 15, left: 10, position: 'relative', zIndex: 1000 }}>
                            <div style={circleBtnStyle} onClick={toggleNode}>
                                {nodeDatum.__rd3t.collapsed ? '➡' : '⬇'}
                            </div>
                            <div style={circleBtnStyle} onClick={() => {
                                const path = findNodePath(nodeDatum.id, treeData);
                                if (path) openEditModal(nodeDatum, path);
                            }}>
                                ✏️
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <Card style={{ width: '200px', padding: '10px', textAlign: 'center' }}>
                                <b>{nodeDatum.name}</b>
                                <p>{
                                    nodeDatum.attributes.description.split(": ")[0]
                                }: <i>{findLabel(nodeDatum.attributes.type, nodeDatum.attributes.description.split(": ")[1])}</i></p>
                            </Card>
                            {!nodeDatum.name.toLowerCase().includes('if/else') && !nodeDatum.name.toLowerCase().includes('link automation') && !nodeDatum.name.toLowerCase().includes('block user') && (<div style={addBtnStyle} onClick={() => openModal(nodeDatum.id)}>
                                +
                            </div>)}
                        </div>
                    </div>
                ) :
                    (
                        <div style={{ top: 0, position: "relative" }}>
                            <div style={{ left: 0, top: 10, position: "relative" }} onClick={toggleNode}>
                                {nodeDatum.__rd3t.collapsed ? '➡' : '⬇'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                <Card style={{ padding: '5px', width: 44, height: 44, borderRadius: 100, textAlign: 'center', backgroundColor: "#f5891e", color: "white", fontSize: 12, justifyContent: "center", alignItems: "center", display: "flex" }}>
                                    <b>{nodeDatum.name}</b>
                                </Card>
                                <div style={addBtnStyle} onClick={() => openModal(nodeDatum.id)}>
                                    +
                                </div>
                            </div>
                        </div>
                    )}
            </foreignObject>
        </g>
    );


    return (
        <div style={treeWrapperStyle}>
            <Tree
                data={treeData}
                orientation="vertical"
                translate={{ x: 500, y: 100 }}
                nodeSize={{ x: 150, y: 150 }}
                renderCustomNodeElement={(rd3tProps) =>
                    renderForeignObjectNode({
                        ...rd3tProps,
                        foreignObjectProps: { width: 220, height: 220, x: -110, y: -90 },
                    })
                }
            />

            <Modal show={showModal} onHide={closeModal} centered style={{ zIndex: 2000 }}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {step === 1 ? 'Select Node Type' : `Configure ${selectedNodeType?.label}`}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ backgroundColor: '#f9f9fb', borderRadius: '8px', padding: '20px' }}>
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <span style={{ color: '#000434', fontWeight: 600 }}>🧠 Logic Nodes</span>
                                <div style={btnGridStyle}>
                                    {nodeOptions.filter(n => n.type === 'logic' && n.key != 'root').map((node) => (
                                        <Button
                                            key={node.key}
                                            variant="outline-dark"
                                            style={logicBtnStyle}
                                            size='sm'
                                            onClick={() => handleNodeTypeSelect(node)}
                                        >
                                            {node.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span style={{ color: '#F5891E', fontWeight: 600 }}>⚡ Action Nodes</span>
                                <div style={btnGridStyle}>
                                    {nodeOptions.filter(n => n.type === 'action').map((node) => (
                                        <Button
                                            key={node.key}
                                            variant="outline-primary"
                                            style={actionBtnStyle}
                                            size='sm'
                                            onClick={() => handleNodeTypeSelect(node)}
                                        >
                                            {node.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && selectedNodeType && selectedNodeType.fields && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {selectedNodeType.key !== "root" && <Button variant="link" onClick={() => setStep(1)} style={{ padding: 0 }}>
                                ← Back
                            </Button>}

                            {selectedNodeType.fields.map((field: any) => (
                                <div>
                                    <Form.Group key={field.key}>
                                        <Form.Label>{field.label} </Form.Label>

                                        {field.type === 'text' && (
                                            <Form.Control
                                                type="text"
                                                placeholder={field.placeholder || ''}
                                                value={nodeConfig[field.key] || ''}
                                                onChange={(e) =>
                                                    setNodeConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))
                                                }
                                            />
                                        )}

                                        {field.type === 'textarea' && (
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder={field.placeholder || ''}
                                                value={nodeConfig[field.key] || ''}
                                                onChange={(e) =>
                                                    setNodeConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))
                                                }
                                            />
                                        )}

                                        {field.type === 'number' && (
                                            <Form.Control
                                                type="number"
                                                placeholder={field.placeholder || ''}
                                                value={nodeConfig[field.key] || ''}
                                                onChange={(e) =>
                                                    setNodeConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))
                                                }
                                            />
                                        )}

                                        {field.type === 'select' && (
                                            <Form.Select
                                                value={nodeConfig[field.key] || ''}
                                                onChange={(e) =>
                                                    setNodeConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))
                                                }
                                            >
                                                <option value="">Select</option>
                                                {field.values.map((option: any) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        )}
                                    </Form.Group>
                                    {
                                        selectedNodeType.key === "root" && nodeConfig['trigger'] === 'contact_list_added' && (
                                            <Form.Group key={field.key}>
                                                <Form.Label>Select Contact List </Form.Label>

                                                <Form.Select
                                                    multiple={true}
                                                    value={nodeConfig['id'] || []}
                                                    onChange={(e) => {
                                                        const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value);
                                                        setNodeConfig((prev: any) => ({ ...prev, id: selectedValues }));
                                                    }}
                                                >
                                                    <option value="">Select</option>
                                                    {contactLists.map((option: any) => (
                                                        <option key={option._id} value={option._id}>
                                                            {option.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        )
                                    }
                                </div>
                            ))}

                            <Button variant="primary" onClick={handleAddConfiguredNode}>
                                Add {selectedNodeType.label}
                            </Button>
                        </div>
                    )}

                </Modal.Body>
            </Modal>
        </div>
    );
}

// Styles
const treeWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: "700px",
    border: '1px solid #ccc',
    backgroundColor: 'white',
    backgroundImage: 'radial-gradient(#ccc 0.5px, transparent 1px)',
    backgroundSize: '10px 10px',
};

const circleBtnStyle: React.CSSProperties = {
    cursor: 'pointer',
    fontSize: '14px',
    userSelect: 'none',
    color: '#000434',
    backgroundColor: '#f5891e',
    width: 30,
    height: 30,
    borderRadius: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const addBtnStyle: React.CSSProperties = {
    marginTop: '4px',
    backgroundColor: '#000434',
    color: '#fff',
    borderRadius: 100,
    width: 30,
    height: 30,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '20px',
};

const btnGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '10px',
};

const logicBtnStyle: React.CSSProperties = {
    minWidth: '140px',
    borderRadius: '20px',
    fontWeight: '500',
    backgroundColor: '#fff',
    border: '1px solid #000434',
    color: '#000434',
};

const actionBtnStyle: React.CSSProperties = {
    minWidth: '140px',
    borderRadius: '20px',
    fontWeight: '500',
    backgroundColor: '#fff',
    border: '1px solid #F5891E',
    color: '#F5891E',
};
