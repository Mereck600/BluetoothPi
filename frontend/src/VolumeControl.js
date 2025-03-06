import React, { useState } from 'react';

const VolumeControl = () => {
  const [volume, setVolume] = useState(0);

  const changeVolume = async (newVolume) => {
    setVolume(newVolume);
    await fetch('http://localhost:8000/set-volume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ level: newVolume }),
    });
  };

  return (
    <div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => changeVolume(parseFloat(e.target.value))}
      />
      <p>Volume: {(volume * 100).toFixed(0)}%</p>
    </div>
  );
};

export default VolumeControl;
