import React, { useState, useEffect } from 'react';
import {
    Button,
    Container,
    ListGroup,
    Spinner,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAllAutomations } from '../../../APIs/automations';

type Step = {
    stepOrder: number;
    stepName: string;
    sendAfterSeconds: number;
    channel: 'email' | 'whatsapp' | 'call';
    template: string;
    ctaText?: string;
    ctaLink?: string;
    condition?: any; // JSON or string condition
};

export type Automation = {
    _id?: string;
    name: string;
    description?: string;
    trigger_contact_list?: string;
    trigger_event: 'created' | 'updated' | 'deleted';
    trigger_condition?: any;
    steps: Step[];
};


const AutomationScreen: React.FC = () => {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()

    useEffect(() => {
        const fetchAutomations = async () => {
            setLoading(true);
            try {
                const res = await getAllAutomations();
                setAutomations(res);
            } catch (e: any) {
                console.error('Failed to fetch automations', e);
            }
            setLoading(false);
        };
        fetchAutomations();
    }, []);


    return (
        <Container className="my-4">
            <h1 className="mb-4" style={{ color: '#000434' }}>
                Automations
            </h1>
            <Button
                variant="warning"
                className="mb-3"
                onClick={() => {
                    navigate("/dashboard/marketing/createAutomation")
                }}
            >
                + Add New Automation
            </Button>

            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <ListGroup>
                    {automations.map((auto) => (
                        <ListGroup.Item
                            key={auto._id}
                            action
                            onClick={() => {
                                navigate(`/dashboard/marketing/createAutomation/${auto._id}`);
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1">{auto.name}</h5>
                                </div>
                                <span className="badge bg-primary rounded-pill">{auto.steps.length} Steps</span>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </Container>
    );
};

export default AutomationScreen;
