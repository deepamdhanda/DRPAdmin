import React, { useEffect, useState } from 'react';
import {
    Button,
    Form,
    Container,
} from 'react-bootstrap';
import ConditionBuilder from '../../../utils/ConditionBuilder';
import { createAutomation, getAutomationById, updateAutomation } from '../../../APIs/automations';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

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

type Automation = {
    _id?: string;
    name: string;
    steps: Step[];
};


const AutomationCreateScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const { automationId } = useParams<{ automationId?: string }>(); // use `?` for optional
    useEffect(() => {
        if (automationId) {
            setLoading(true);
            getAutomationById(automationId).then((automation) => {
                if (automation) {
                    setForm({
                        _id: automation._id,
                        name: automation.name,
                        steps: automation.steps || [],
                    });
                }
                setLoading(false);
            }).catch((error) => {
                console.error('Error fetching automation:', error);
                toast.error('Failed to load automation');
            });
        } else {
            setLoading(false);

        }
    }, [automationId]);

    const navigate = useNavigate();
    const [form, setForm] = useState<Automation>({
        name: '',
        steps: [],
    });


    const handleChange = (field: keyof Automation, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = automationId ? await updateAutomation(automationId, form) : await createAutomation(form);
            if (!res) {
                toast.error('Failed to save automation');
                throw new Error('Failed to create automation');
            }
            toast.success('Automation saved successfully');
            navigate('/dashboard/marketing/automation');
        } catch (e: any) {
            toast.error('Error saving automation');
            console.error(e);
        }
    };

    return (
        <Container className="mt-2">
            {loading ? (
                <>
                    <h2>Loading...</h2>
                    <p>Please wait while we load the automation details.</p>
                    <div className="d-flex justify-content-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <p>If this takes too long, please try refreshing the page.</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard/automations')}>
                        Go Back to Automations
                    </Button>
                </>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <div>
                        <Form.Group className="mb-3 " controlId="automationName" style={{ display: "flex", position: "fixed", margin: 10 }} >
                            <Form.Control
                                type="text"
                                value={form.name}
                                onChange={(e: any) => handleChange('name', e.target.value)}
                                placeholder="Enter automation name"
                                required
                                disabled={form.name.startsWith("FIXED_")}
                            />

                            <Button type="submit" variant="success" style={{ marginLeft: -5 }} >
                                Save
                            </Button>
                        </Form.Group>
                    </div>
                    <ConditionBuilder
                        content={form.steps}
                        onChange={(tree: any) => { handleChange('steps', tree) }}
                    />
                </Form>)}
        </Container >
    );
};

export default AutomationCreateScreen;
