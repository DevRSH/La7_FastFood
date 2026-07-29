import React, { useState, useEffect } from 'react';

export default function PinScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin.length === 4 && !loading) {
      handleLogin();
    }
  }, [pin]);

  const handleLogin = async () => {
    setLoading(true);
    const success = await onLogin(pin);
    setLoading(false);
    if (!success) {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 500);
    }
  };

  const handlePress = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="flex items-center justify-center h-screen w-full" style={{ backgroundColor: 'var(--bg)' }}>
      <div className={`card flex-col items-center gap-4 ${error ? 'animate-shake' : ''}`} style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
        <div className="text-center mb-6">
          <h1 className="mono" style={{ color: 'var(--cyan)', fontSize: '3rem', fontWeight: 700, margin: 0 }}>LA 7</h1>
          <p style={{ color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '0.875rem' }}>FASTFOOD</p>
        </div>

        <div className="flex gap-4 justify-center mb-8">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              style={{
                width: '16px', 
                height: '16px', 
                borderRadius: '50%', 
                backgroundColor: i < pin.length ? 'var(--cyan)' : 'var(--surface-3)',
                boxShadow: i < pin.length ? '0 0 10px var(--cyan-glow)' : 'none',
                transition: 'var(--transition)'
              }} 
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="secondary pos-btn mono" onClick={() => handlePress(num.toString())}>
              {num}
            </button>
          ))}
          <button className="secondary pos-btn" onClick={handleDelete} style={{ color: 'var(--red)' }}>
            ⌫
          </button>
          <button className="secondary pos-btn mono" onClick={() => handlePress('0')}>
            0
          </button>
          <button className="primary pos-btn" onClick={() => { if(pin.length === 4) handleLogin() }}>
            ↵
          </button>
        </div>
      </div>
    </div>
  );
}
