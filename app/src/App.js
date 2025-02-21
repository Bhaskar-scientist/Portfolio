import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { FaMicrophone, FaPaperPlane, FaPlus, FaExpand } from "react-icons/fa";


let recognition;
let shouldStopImmediately = false;

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [userId, setUserId] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    let storedUserId = localStorage.getItem("user_id");
    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem("user_id", storedUserId);
    }
    setUserId(storedUserId);

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        setInputText((prev) => (prev.trim() ? prev.trim() + " " + transcript : transcript));
      };

      recognition.onerror = (event) => console.error("Speech recognition error:", event.error);
      recognition.onend = () => {
        if (isRecording && !shouldStopImmediately) {
          recognition.start();
        }
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) return;
    if (isRecording) {
      shouldStopImmediately = true;
      recognition.stop();
      setIsRecording(false);
    } else {
      shouldStopImmediately = false;
      recognition.start();
      setIsRecording(true);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    setMessages((prev) => [...prev, { sender: "User", text: inputText }]);
    setInputText("");

    try {
      const response = await fetch("https://gen1-8201.onrender.com/process-text/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ user_id: userId, question: inputText }),
      });
      const data = await response.json();

      setMessages((prev) => [...prev, { sender: "Bot", text: data.answer || "Error processing response." }]);
    } catch (error) {
      console.error("Error communicating with chatbot:", error);
      setMessages((prev) => [...prev, { sender: "Bot", text: "Error communicating with chatbot." }]);
    }
  };

  return (
    <div className="main-container">
      <div className="chat-container">
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender.toLowerCase()}`}>
              <strong>{msg.sender}:</strong>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
      <div className="input-container">
          <div className="plus-button-container">
            <button onClick={() => setShowMoreOptions(!showMoreOptions)} className="icon-button">
              <FaPlus />
            </button>
            {showMoreOptions && (
              <div className="extra-options">
                <button onClick={toggleFullScreen} className="icon-button fullscreen-button">
                  <FaExpand />
                </button>
              </div>
            )}
          </div>
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." />
          <button onClick={toggleRecording} className={`icon-button ${isRecording ? "recording" : ""}`}>
            <FaMicrophone />
          </button>
          <button onClick={sendMessage} className="icon-button">
            <FaPaperPlane />
          </button>
      </div>
      <footer className="footer">Interview Assist</footer>

      <style jsx>{`
        .main-container {
          display: flex;
          flex-direction: column;
          height: 100vh; /* Full viewport height */
          background-color: #212121; /* Gray shade background */
          color: white;
          justify-content: space-between;
        }        
        .chat-container {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          overflow-y: auto;
          height: 100vh;
          background-color: #212121;
          color: white;
          padding: 5px;
          font-family: 'Arial', sans-serif;
          font-size: 13.2px;
          overflow: hidden;
          max-height: calc(98vh - 120px); 
        }
        .chat-box {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          border-radius: 10px;
          background-color: #212121;
          box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1);
          margin: 0 0.6cm; /* 1cm gap on both sides */
        }
        @media (max-width: 600px) {
          .chat-container {
            margin: 0 0.5cm;
            max-height: calc(100vh - 140px);
          }
          .input-container {
            width: calc(100% - 1cm);
            margin: 0 0.5cm;
            bottom: 50px;
          }
        }
        /* Scrollbar track (background) */
        .chat-box::-webkit-scrollbar {
          width: 8px; /* Width of the scrollbar */
        }

        /* Scrollbar handle (thumb) */
        .chat-box::-webkit-scrollbar-thumb {
          background-color: #888; /* Change this to your preferred color */
          border-radius: 4px; /* Round edges */
        }

        /* Scrollbar handle on hover */
        .chat-box::-webkit-scrollbar-thumb:hover {
          background-color: #555;
        }

        /* Scrollbar track */
        .chat-box::-webkit-scrollbar-track {
          background: #222; /* Background color of scrollbar track */
        }

        .message {
          padding: 12px;
          margin: 8px 0;
          border-radius: 8px;
          max-width: 70%;
        }
        .user {
          background-color: #303030;
          align-self: flex-end;
        }
        .bot {
          background-color: #212121;
          align-self: flex-start;
        }
        .input-container {
          display: flex;
          align-items: flex-end; /* Align buttons at the bottom */
          background-color: #303030;
          padding: 10px;
          border-radius: 10px;
          box-shadow: 0px 0px 8px rgba(255, 255, 255, 0.1);
          position: fixed;
          bottom: 1cm; /* Moved 1cm above the bottom */
          width: calc(100% - 2cm); /* Reduced width by 2cm */
          justify-content: space-between;
          margin: 0 1cm;
          min-height: 35px; /* Reduced minimum height */
          max-height: 60px; /* Set a max height */
        }

        .footer {
          position: fixed;
          bottom: 0;
          width: 100%;
          background: #1f1f1f;
          text-align: center;
          padding: 3px;
          color: white;
        }
        .button-container {
          display: flex;
          flex-direction: column; /* Stack buttons vertically */
          align-items: center;
          gap: 10px; /* Space between buttons */
        }

        textarea {
          width: 100%;
          background: transparent;
          color: white;
          border: none;
          padding: 12px;
          outline: none;
          resize: none;
          min-height: 35px;
          font-size: 14px;
        }

        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          color: white;
          font-size: 24px;
          transition: transform 0.2s ease;
        }
        .icon-button:hover {
          transform: scale(1.1);
        }
        .recording {
          color: red;
          animation: pulse 1.5s infinite;
        }
          
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @media (max-width: 600px) {
          .chat-container {
            padding: 10px;
          }
        .popup-menu {
          position: absolute;
          bottom: 60px;
          left: 10px;
          background: #1f2937;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.3);
        }
        .plus-button-container {
          position: relative;
        }
        .extra-options {
          position: absolute;
          bottom: 50px;
          background: #222;
          padding: 10px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .option-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 5px;
        }
        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          color: white;
          font-size: 24px;
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ChatApp;
