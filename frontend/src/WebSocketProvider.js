import React, { createContext, useContext, useState, useEffect } from 'react';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [currentSong, setCurrentSong] = useState('');
  const [ledColor, setLedColor] = useState('');
  const [socketStatus, setSocketStatus] = useState('Disconnected'); // New state for WebSocket status
  const [reconnecting, setReconnecting] = useState(false); // To prevent multiple reconnect attempts

  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket('ws://localhost:8000/ws'); // Ensure this is the correct URL

      socket.onopen = () => {
        console.log('WebSocket connected');
        setSocketStatus('Connected');
        setReconnecting(false); // Stop the reconnecting flag once connected
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.song) setCurrentSong(data.song);
        if (data.color) setLedColor(data.color);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSocketStatus('Error');
      };

      socket.onclose = (event) => {
        console.log('WebSocket closed:', event);
        setSocketStatus('Disconnected');
        if (!reconnecting) {
          setReconnecting(true); // Set reconnecting flag to prevent multiple attempts
          setTimeout(() => {
            connectWebSocket(); // Reconnect after 5 seconds if the connection is closed
          }, 5000);
        }
      };

      setWs(socket); // Update WebSocket connection
    };

    connectWebSocket(); // Initial WebSocket connection

    return () => {
      if (ws) ws.close(); // Clean up WebSocket on component unmount
    };
  }, [reconnecting]); // Re-run effect if reconnecting changes

  return (
    <WebSocketContext.Provider value={{ ws, currentSong, ledColor, socketStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
