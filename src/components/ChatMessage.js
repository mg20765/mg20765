import React from "react";
import ChatbotIcon from "./ChatbotIcon";

const ChatMessage = ({ chat }) => {
  return (
    <div
      className={`message ${chat.role === "model" ? `bot` : `user`}-message`}
    >
      {chat.role === "model" && <ChatbotIcon />}
      <p className="message-text">{chat.text}</p>
      <h1>Job title</h1>
    </div>
  );
};

export default ChatMessage;
