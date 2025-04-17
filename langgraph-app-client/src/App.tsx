import { useState } from "react";
import ChatButton from "./ui/ChatButton";
import ChatWindow from "./ui/ChatWindow";

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatOpen = () => {
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* ...existing code... */}
        <ChatButton onClick={handleChatOpen} />
        <ChatWindow isOpen={isChatOpen} onClose={handleChatClose} />
      </header>
    </div>
  );
}

export default App;
