// RandomCodeContext.js
import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const RandomCodeContext = createContext();

// Context provider component
function RandomNumberGenerator({ children }){
  const [randomCode, setRandomCode] = useState(generateRandomCode());

  // Function to generate a random 4-digit number
  function generateRandomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Update the random code every hour
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRandomCode(generateRandomCode());
    }, 3600000); // 1 hour in milliseconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <RandomCodeContext.Provider value={{ randomCode, generateNewCode: setRandomCode }}>
      {children}
    </RandomCodeContext.Provider>
  );
};

export default RandomNumberGenerator;
