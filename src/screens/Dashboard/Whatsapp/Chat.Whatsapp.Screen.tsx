import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, ListGroup, Form, Button, Spinner } from "react-bootstrap";
import { createChat, getAllChats } from "../../../APIs/whatsapp/chat";
import { toast } from "react-toastify";

interface Message {
  message_id: string;
  message: {
    text: string;
    media_id?: string;
    template_name?: string;
    template_params?: string[];
  };
  from: string;
  createdAt?: string;
  status: string; // Added status field
}

export interface Chats {
  [myNumber: string]: {
    [customer: string]: Message[];
  };
}

const ChatScreen: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [chats, setChats] = useState<Chats>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [myNumber, setMyNumber] = useState<string>("");
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [selectedCustomer, chats]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = (await getAllChats())[0];
      setChats(res);
      if (res && Object.keys(res).length > 0) {
        const firstNumber = Object.keys(res)[0];
        setMyNumber(firstNumber);
        setSelectedCustomer(Object.keys(res[firstNumber])[0] || null);
      } else {
        setMyNumber("");
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error("Error loading chats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer || !myNumber) return;

    const form = e.target as HTMLFormElement;
    const messageInput = form.elements.namedItem("message") as HTMLInputElement | null;
    console.log(messageInput)
    if (!messageInput || !messageInput.value.trim()) return;

    const newMessage: Message = {
      message_id: Date.now().toString(),
      message: { text: messageInput.value.trim() },
      from: myNumber,
      createdAt: new Date().toISOString(),
      status: "pending", // Initial status
    };

    setChats((prevChats) => ({
      ...prevChats,
      [myNumber]: {
        ...prevChats[myNumber],
        [selectedCustomer]: [...(prevChats[myNumber][selectedCustomer] || []), newMessage],
      },
    }));

    messageInput.value = "";
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const payload = {
      from: myNumber,
      to: selectedCustomer,
      type: "text",
      content: {
        text: newMessage.message.text
      },
      direction: "outbound",
    }
    console.log("Sending message payload:", payload);
    try {
      const res = await createChat(payload);
      if (!res) {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast.error("Error sending message:" + error);
    }
  }
  const customers = myNumber && chats[myNumber] ? Object.keys(chats[myNumber]) : [];

  return (
    <Container fluid className=" p-0" style={{ height: "92%" }} >
      {loading ? (
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <Row className="h-100 no-gutters">
          {/* Left Panel: Chat List */}
          <Col md={3} className="border-end d-flex flex-column p-0 bg-white">
            {/* Header */}
            <div className="p-3 border-bottom fw-bold fs-5">Chats</div>

            {/* Search */}
            <div className="p-2 border-bottom">
              <Form.Control
                type="text"
                placeholder="Search chats"
                className="rounded-pill"
              />
            </div>

            {/* Chat List */}
            <div style={{ height: "100%", maxHeight: "500px", overflowY: "auto" }}>
              <ListGroup variant="flush" className="flex-grow-1 overflow-auto">
                {customers.map((cust) => {
                  const lastMsg = chats[myNumber][cust]?.slice(-1)[0];
                  return (
                    <ListGroup.Item
                      key={cust}
                      action
                      active={selectedCustomer === cust}
                      onClick={() => setSelectedCustomer(cust)}
                      className="d-flex flex-column"
                    >
                      <div className="fw-semibold">{cust}</div>
                      <div className="text-muted text-truncate" style={{ maxWidth: "100%" }}>
                        {lastMsg?.message?.text || "No messages yet"}
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </div>
          </Col>

          {/* Right Panel: Chat Window */}
          <Col md={9} className="d-flex bg-light flex-column p-0 h-100" style={{ overflow: "hidden", backgroundImage: "linear-gradient(rgba(255,255,255,0.70), rgba(255,255,255,0.70)),url('https://static.whatsapp.net/rsrc.php/v4/yi/r/x8OGwcrwtac.png')", }}>
            {selectedCustomer ? (
              <>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
                  <div className="d-flex align-items-center">
                    <div className="bg-secondary rounded-circle me-3" style={{ width: 40, height: 40 }}></div>
                    <div className="fw-semibold">{selectedCustomer}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-secondary">
                    <Button variant="link" className="p-0 text-decoration-none">🔍</Button>
                    <Button variant="link" className="p-0 text-decoration-none">⋮</Button>
                  </div>
                </div>

                {/* Messages */}
                {/* Messages */}
                <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-2">
                  {chats[myNumber][selectedCustomer]?.sort((a: Message, b: Message) => new Date(a.createdAt ?? "").getTime() - new Date(b.createdAt ?? "").getTime()).map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`d-flex ${msg.from === myNumber ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div
                        className={` flex rounded-lg max-w-75 break-words ${msg.from === myNumber ? "bg-success text-white rounded-end-0" : "bg-white rounded-start-0"}`}
                        style={{ maxWidth: "75%", minWidth: "100px", borderRadius: "10px", backgroundColor: "beige!important", padding: "5px 10px" }}
                      >
                        <span className="p-0 m-0 d-flex justify-content-start text-start">
                          {msg.message?.text || (msg.message?.media_id && <img src={msg.message?.media_id} className="img-fluid rounded" />)}
                        </span>
                        <span className="p-0 m-0 d-flex justify-content-end">
                          {msg.createdAt && (
                            <div className="text-end text-muted small d-flex align-items-start justify-content-end gap-1">
                              <span style={{ fontSize: "x-small" }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span style={{ fontSize: "xx-small" }}>
                                {msg.status === "pending" && "🕒"}
                                {msg.status === "sent" && "✔"}
                                {msg.status === "delivered" && "✔✔"}
                                {msg.status === "read" && <span style={{ color: '#4fc3f7' }}>✔✔</span>}
                                {msg.status === "failed" && "❌"}
                                {msg.status === "received" && ""}
                              </span>
                            </div>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} style={{ marginTop: 10 }} />

                  {/* Input */}
                  <Form onSubmit={handleSendMessage} className="d-flex gap-2 mt-auto shadow bg-white justify-content-center align-items-center" style={{ position: "sticky", bottom: 0, borderRadius: 100, padding: "0.5rem 1rem" }}>
                    <a style={{ fontSize: "x-large", fontFamily: "ui-rounded" }}>+</a>
                    <a >📎</a>
                    <Form.Control name="message" placeholder="Type a message" style={{ border: 0 }} />
                    <Button variant="success" type="submit" style={{ borderRadius: 100 }}>➤</Button>
                  </Form>
                </div>

              </>
            ) : (
              <div className="flex-grow-1 d-flex justify-content-center align-items-center text-secondary">
                Select a chat to start messaging
              </div>
            )}
          </Col>
        </Row>
      )
      }
    </Container >
  );
};

export default ChatScreen;
