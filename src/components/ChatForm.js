import { useRef } from "react";

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
  const inputRef = useRef();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;
    inputRef.current.value = "";

    const newUsersMessage = { role: "user", text: userMessage };

    const updatedHistoryWithThinking = [
      ...chatHistory,
      newUsersMessage,
      { role: "model", text: "Thinking..." },
    ];

    setChatHistory(updatedHistoryWithThinking);

    setTimeout(() => {
      generateBotResponse(updatedHistoryWithThinking);
    }, 600);
  };

  return (
    <form className="chat-form" onSubmit={handleFormSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Message..."
        className="message-input"
        required
      />
      {/* FIXED: Changed to a standard HTML arrow symbol so it never fails to load */}
      <button type="submit" style={{ fontSize: "18px", fontWeight: "bold" }}>
        ▲
      </button>
    </form>
  );
};

export default ChatForm;
