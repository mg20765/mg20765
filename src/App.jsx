import { useState, useRef, useEffect } from "react";
import ChatForm from "./../components/ChatForm";
import ChatMessage from "./../components/ChatMessage";
import ChatbotIcon from "./../components/ChatbotIcon";

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [jobTitle, setJobTitle] = useState("Junior Developer");
  const chatBodyRef = useRef();

  const updateHistory = (text) => {
    setChatHistory((prev) => [
      ...prev.filter((msg) => msg.text !== "Thinking..."),
      { role: "model", text },
    ]);
  };

  const generateBotResponse = async (history) => {
    const formattedHistory = history.map(({ role, text }) => ({
      role: role === "user" ? "user" : "model",
      parts: [{ text }],
    }));
    //REbecca /going to test it out as well as our class one so u wont need this*}
    const systemInstruction = {
      role: "user",
      parts: [
        {
          text: `You are an expert technical interviewer. Conduct a professional, realistic job interview for the position of "${jobTitle}". 
        Guidelines:
        - Ask exactly ONE clear interview question at a time.
        - Wait for the user's answer before asking the next question or moving on.
        - Provide brief, constructive feedback on their answers if necessary, but keep the interview moving naturally.
        - Stay strictly in character as a professional interviewer.`,
        },
      ],
    };

    const fullContentsPayload = [systemInstruction, ...formattedHistory];

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: fullContentsPayload }),
    };

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL,
        requestOptions,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Something went wrong");
      }

      const apiResponseText = data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();

      updateHistory(apiResponseText);
    } catch (error) {
      console.error("API Error:", error);
      setChatHistory((prev) =>
        prev.filter((msg) => msg.text !== "Thinking..."),
      );
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  return (
    <div className={`container ${showChatbot ? "show-chatbot" : ""}`}>
      <button
        className="chatbot-toggler"
        onClick={() => setShowChatbot((prev) => !prev)}
      >
        <span
          style={{
            fontSize: showChatbot ? "20px" : "26px",
            fontWeight: "bold",
          }}
        >
          {showChatbot ? "✕" : "💬"}
        </span>
      </button>

      <div className="chatbot-popup">
        <div className="chat-header">
          <div className="header-info">
            <ChatbotIcon />
            <h2 className="logo-text">AI Mock Interviewer</h2>
          </div>
          <button
            className="close-btn"
            onClick={() => setShowChatbot(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              color: "#1a3644",
            }}
          >
            ▼
          </button>
        </div>

        <div className="job-title-container">
          <label htmlFor="job-title">Job Title:</label>
          <input
            id="job-title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Junior Developer"
            className="job-title-input"
          />
        </div>

        <div className="chat-body-wrapper">
          <div className="chat-body" ref={chatBodyRef}>
            {chatHistory.map((message, index) => (
              <ChatMessage key={index} chat={message} />
            ))}
          </div>
        </div>

        <div className="chat-footer">
          <ChatForm
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            generateBotResponse={generateBotResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
