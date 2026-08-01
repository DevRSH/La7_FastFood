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
    <div className="flex items-center justify-center min-h-screen w-full p-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className={`card flex-col items-center gap-4 ${error ? 'animate-shake' : ''}`} style={{ maxWidth: '360px', width: '100%', padding: '2rem 1.5rem' }}>
        <div className="text-center mb-4">
          <h1 className="mono" style={{ color: 'var(--cyan)', fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '2px' }}>LA 7</h1>
          <p style={{ color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 700 }}>FASTFOOD</p>
        </div>

        {/* Indicadores de PIN */}
        <div className="flex gap-3 justify-center mb-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              style={{
                width: '16px', 
                height: '16px', 
                borderRadius: '50%', 
                backgroundColor: i < pin.length ? 'var(--cyan)' : 'var(--surface-3)',
                border: '1px solid var(--border)',
                boxShadow: i < pin.length ? '0 0 10px var(--cyan-glow)' : 'none',
                transition: 'var(--transition)'
              }} 
            />
          ))}
        </div>

        {/* Pad de Teclas Numéricas 3x4 Garantizado */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', width: '100%' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              type="button"
              className="secondary pos-btn mono" 
              onClick={() => handlePress(num.toString())}
              style={{ fontSize: '1.5rem', fontWeight: 700, height: '56px', borderRadius: 'var(--radius-sm)' }}
            >
              {num}
            </button>
          ))}
          <button 
            type="button"
            className="secondary pos-btn" 
            onClick={handleDelete} 
            style={{ color: 'var(--red)', fontSize: '1.3rem', height: '56px', borderRadius: 'var(--radius-sm)' }}
          >
            ⌫
          </button>
          <button 
            type="button"
            className="secondary pos-btn mono" 
            onClick={() => handlePress('0')}
            style={{ fontSize: '1.5rem', fontWeight: 700, height: '56px', borderRadius: 'var(--radius-sm)' }}
          >
            0
          </button>
          <button 
            type="button"
            className="primary pos-btn" 
            onClick={() => { if (pin.length === 4) handleLogin(); }}
            style={{ fontSize: '1.3rem', height: '56px', borderRadius: 'var(--radius-sm)' }}
          >
            ↵
          </button>
        </div>
      </div>
    </div>
  );
}
