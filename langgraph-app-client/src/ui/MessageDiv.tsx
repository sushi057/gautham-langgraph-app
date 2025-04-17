import React from "react";

interface MessageProps {
  text: string;
  sender: "function" | "human" | "ai" | "tool" | "system" | "remove";
}

const MessageDiv: React.FC<MessageProps> = ({ text, sender }) => {
  const isHuman = sender === "human";

  return (
    <div className={`mb-4 flex ${isHuman ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] p-3 rounded-lg ${
          isHuman
            ? "bg-blue-500 text-white rounded-tr-none"
            : "bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default MessageDiv;
