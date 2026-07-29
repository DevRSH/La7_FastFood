import React, { useState, useEffect } from 'react';
import { api, formatCLP, client } from '../api/client';

const mockProducts = [
  { id: 1, categoria: 'Hamburguesas', nombre: 'Classic Burger', precio: 5000, icono: '🍔', stock: 10 },
  { id: 2, categoria: 'Hamburguesas', nombre: 'Cheese Burger', precio: 5500, icono: '🍔', stock: 5 },
  { id: 3, categoria: 'Papas', nombre: 'Papas Fritas Chicas', precio: 2000, icono: '🍟', stock: 0 },
  { id: 4, categoria: 'Bebidas', nombre: 'Coca Cola 500ml', precio: 1500, icono: '🥤', stock: 20 },
  { id: 5, categoria: 'Promos', nombre: 'Combo 1', precio: 7000, icono: '🔥', stock: 10 },
  { id: 6, categoria: 'Salado', nombre: 'Empanada Queso', precio: 1500, icono: '🥟', stock: 15 },
];

const mockModifiers = [
  { id: 1, label: 'Sin Mayo', price: 0 },
  { id: 2, label: 'Sin Tomate', price: 0 },
  { id: 3, label: 'Extra Queso', price: 500 },
  { id: 4, label: 'Extra Tocino', price: 700 },
];

const normalizeProduct = (p) => {
  let catName = 'Hamburguesas';
  if (typeof p.categoria === 'string') {
    catName = p.categoria;
  } else if (p.categoria && typeof p.categoria === 'object' && p.categoria.nombre) {
    catName = p.categoria.nombre;
  } else if (p.categoria_nombre) {
    catName = p.categoria_nombre;
  }

  const nombreLower = (p.nombre || '').toLowerCase();
  let icon = '🍔';
  if (catName.toLowerCase().includes('bebida') || nombreLower.includes('coca') || nombreLower.includes('bebida')) icon = '🥤';
  else if (catName.toLowerCase().includes('papa') || nombreLower.includes('papa')) icon = '🍟';
  else if (catName.toLowerCase().includes('empanada') || catName.toLowerCase().includes('salado') || nombreLower.includes('empanada')) icon = '🥟';
  else if (catName.toLowerCase().includes('postre') || nombreLower.includes('postre')) icon = '🍰';
  else if (catName.toLowerCase().includes('promo') || nombreLower.includes('combo')) icon = '🔥';

  return {
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    categoria: catName,
    icono: p.icono || icon,
    stock: p.stock ?? 20
  };
};

export default function POS() {
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('la7_productos_cache');
      return cached ? JSON.parse(cached) : mockProducts.map(normalizeProduct);
    } catch (e) {
      return mockProducts.map(normalizeProduct);
    }
  });

  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.categoria)))];
  const [activeCategory, setActiveCategory] = useState('Todas');
  
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Local'); // 'Local' | 'Delivery'

  // Business config state for delivery calculations
  const [businessConfig, setBusinessConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('la7_config');
      return saved ? JSON.parse(saved) : { reparto_tipo: 'fijo', reparto_valor: 1500 };
    } catch (e) {
      return { reparto_tipo: 'fijo', reparto_valor: 1500 };
    }
  });

  // Customer state
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({ nombre: '', telefono: '', direccion: '' });
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashAmount, setCashAmount] = useState('');
  
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    // Fetch products from backend
    api.productos.getAll()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeProduct);
          setProducts(normalized);
          localStorage.setItem('la7_productos_cache', JSON.stringify(normalized));
        }
      })
      .catch(err => console.log('Usando caché de productos local:', err));

    // Fetch live config from server
    api.config?.get?.()
      .then(cfg => {
        if (cfg && typeof cfg === 'object') {
          setBusinessConfig(prev => ({ ...prev, ...cfg }));
          localStorage.setItem('la7_config', JSON.stringify(cfg));
        }
      })
      .catch(() => {});
  }, []);

  const handlePhoneSearch = async () => {
    if (!phone.trim()) return;
    try {
      const data = await api.clientes.getByTelefono(phone).catch(() => null);
      if (data) {
        setCustomer(data);
        setShowQuickCreate(false);
      } else {
        // Customer not found, open quick create modal
        setQuickCustomerForm({ nombre: '', telefono: phone, direccion: '' });
        setShowQuickCreate(true);
      }
    } catch (err) {
      setQuickCustomerForm({ nombre: '', telefono: phone, direccion: '' });
      setShowQuickCreate(true);
    }
  };

  const handleQuickCreateSave = async (e) => {
    e.preventDefault();
    if (!quickCustomerForm.nombre.trim() || !quickCustomerForm.telefono.trim()) return;

    try {
      const created = await api.clientes.create(quickCustomerForm).catch(() => ({
        id: Date.now(),
        ...quickCustomerForm,
        puntos_acumulados: 0
      }));
      setCustomer(created);
      setShowQuickCreate(false);
    } catch (err) {
      console.error(err);
      const fallback = { id: Date.now(), ...quickCustomerForm, puntos_acumulados: 0 };
      setCustomer(fallback);
      setShowQuickCreate(false);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setSelectedProduct(product);
    setSelectedModifiers([]);
  };

  const confirmProductAdd = () => {
    const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
    const item = {
      ...selectedProduct,
      cartId: Date.now(),
      qty: 1,
      modifiers: selectedModifiers,
      unitTotal: selectedProduct.precio + modifierTotal
    };
    setCart([...cart, item]);
    setSelectedProduct(null);
  };

  const updateQty = (cartId, delta) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.qty, 0);

  // Dynamic delivery fee calculation based strictly on Configuracion
  const calcDeliveryFee = () => {
    if (orderType !== 'Delivery') return 0;
    const { reparto_tipo, reparto_valor } = businessConfig;

    if (reparto_tipo === 'fijo') {
      return Number(reparto_valor) || 0;
    } else if (reparto_tipo === 'porcentaje') {
      return Math.round(subtotal * ((Number(reparto_valor) || 0) / 100));
    }
    return 0; // 'ninguno'
  };

  const currentDeliveryFee = calcDeliveryFee();
  const discount = 0;
  const total = subtotal + currentDeliveryFee - discount;

  const handlePaymentConfirm = async () => {
    try {
      const payload = {
        cliente_id: customer ? customer.id : null,
        medio_pago: paymentMethod.toLowerCase(),
        canal: orderType.toLowerCase(),
        monto_recibido: paymentMethod === 'Efectivo' && cashAmount ? parseInt(cashAmount) : total,
        puntos_canjeados: 0,
        descuento_fidelizacion: discount,
        detalles: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.qty,
          precio_unitario: item.precio || item.unitTotal,
          modificadores: (item.modifiers || []).map(m => ({
            modificador_id: m.id,
            precio_adicional: m.price || 0
          }))
        }))
      };

      const response = await api.ventas.create(payload).catch((err) => {
        console.warn('API de ventas no disponible, usando fallback local de ticket:', err);
        const num = Math.floor(Math.random() * 1000).toString().padStart(5, '0');
        return {
          numero_ticket: `T-${num}`,
          vuelto: paymentMethod === 'Efectivo' && cashAmount ? parseInt(cashAmount) - total : 0,
          puntos_ganados: Math.floor(total / 100),
          total: total
        };
      });

      const newTicket = {
        id: response.id || Date.now(),
        numero: response.numero_ticket ? (response.numero_ticket.startsWith('#') ? response.numero_ticket : `#${response.numero_ticket}`) : `#T-00001`,
        numero_ticket: response.numero_ticket || `#T-00001`,
        fecha: response.fecha || new Date().toISOString(),
        items: cart,
        detalles: cart.map(i => ({ producto: i.nombre, cantidad: i.qty, precioUnitario: i.precio, subtotal: i.unitTotal * i.qty, costoCongelado: i.precio * 0.4, margen: 60 })),
        paymentMethod,
        medio_pago: paymentMethod,
        orderType,
        customer,
        cliente: customer ? customer.nombre : null,
        deliveryFee: currentDeliveryFee,
        change: response.vuelto ?? 0,
        pointsEarned: response.puntos_ganados ?? Math.floor(total / 100),
        total: response.total ?? total,
        estado: 'Completada',
        anulada: false
      };

      try {
        const saved = JSON.parse(localStorage.getItem('la7_ventas_locales') || '[]');
        localStorage.setItem('la7_ventas_locales', JSON.stringify([newTicket, ...saved]));
      } catch (e) {
        console.error('Error guardando venta local', e);
      }

      setTicket(newTicket);
      setShowPayment(false);
    } catch (err) {
      console.error('Error al procesar la venta:', err);
      alert('Error al registrar la venta en el sistema.');
    }
  };


  const resetVenta = () => {
    setCart([]);
    setCustomer(null);
    setPhone('');
    setTicket(null);
    setOrderType('Local');
  };

  const toggleModifier = (mod) => {
    if (selectedModifiers.find(m => m.id === mod.id)) {
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== mod.id));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  const filteredProducts = activeCategory === 'Todas' ? products : products.filter(p => p.categoria === activeCategory);

  return (
    <div className="h-full flex gap-4 p-4 animate-slide-up" style={{ minHeight: '90vh' }}>
      {/* Left/Top Category Bar + Center Grid */}
      <div className="flex-col gap-4 flex-1">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`pos-btn ${activeCategory === cat ? 'primary' : 'secondary'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 150px)' }}>
          {filteredProducts.map(p => (
            <div 
              key={p.id} 
              className={`card flex-col items-center justify-center p-4 cursor-pointer relative ${p.stock <= 0 ? 'opacity-50' : ''}`}
              onClick={() => addToCart(p)}
              style={{ minHeight: '120px', textAlign: 'center' }}
            >
              <span style={{ fontSize: '3rem' }}>{p.icono}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem' }}>{p.nombre}</h3>
              <p className="mono" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{formatCLP(p.precio)}</p>
              {p.stock <= 0 && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius)' }}>
                  <span className="badge danger" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>Agotado</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Cart Panel */}
      <div className="card flex-col flex" style={{ width: '360px', display: 'flex', gap: '1rem' }}>
        <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ticket</h2>
          
          <div className="flex gap-1" style={{ background: 'var(--surface-3)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            <button
              className={orderType === 'Local' ? 'primary' : 'ghost'}
              onClick={() => setOrderType('Local')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
            >
              🏪 Local
            </button>
            <button
              className={orderType === 'Delivery' ? 'primary' : 'ghost'}
              onClick={() => setOrderType('Delivery')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
            >
              🛵 Delivery
            </button>
          </div>
        </div>

        {/* Customer Search & Card */}
        {!customer ? (
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Teléfono Cliente (+569...)" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePhoneSearch()}
            />
            <button className="secondary" title="Buscar Cliente por Teléfono" onClick={handlePhoneSearch}>🔍</button>
          </div>
        ) : (
          <div className="flex-col gap-1 p-2.5 rounded card" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>👤 {customer.nombre}</span>
              <div className="flex items-center gap-1">
                <span className="badge warning" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                  ⭐ {customer.puntos_acumulados ?? customer.puntos ?? 0} pts
                </span>
                <button className="ghost danger" style={{ padding: '0.1rem 0.3rem', fontSize: '0.8rem' }} onClick={() => setCustomer(null)}>✕</button>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 600 }} className="mono">
              📞 {customer.telefono}
            </span>
            {customer.direccion && (
              <span style={{ fontSize: '0.8rem', color: orderType === 'Delivery' ? 'var(--amber)' : 'var(--text-secondary)', fontWeight: orderType === 'Delivery' ? 700 : 400 }}>
                📍 {customer.direccion}
              </span>
            )}
          </div>
        )}

        <div className="flex-col flex-1 overflow-y-auto gap-2">
          {cart.map(item => (
            <div key={item.cartId} className="flex-col gap-1 p-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 600 }}>{item.nombre}</span>
                <span className="mono" style={{ fontWeight: 700 }}>{formatCLP(item.unitTotal * item.qty)}</span>
              </div>
              {item.modifiers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.modifiers.map(m => (
                    <span key={m.id} className="badge info" style={{ fontSize: '0.7rem' }}>{m.label}</span>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <button className="secondary pos-touch-btn" aria-label="Disminuir cantidad" onClick={() => updateQty(item.cartId, -1)}>-</button>
                  <span className="mono" style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center', fontSize: '1.1rem' }}>{item.qty}</span>
                  <button className="secondary pos-touch-btn" aria-label="Aumentar cantidad" onClick={() => updateQty(item.cartId, 1)}>+</button>
                </div>
                <button className="danger ghost pos-touch-btn" aria-label="Eliminar producto" onClick={() => removeItem(item.cartId)}>🗑️</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="empty-state">El carrito está vacío</div>
          )}
        </div>

        <div className="flex-col gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal Productos</span>
            <span className="mono" style={{ fontWeight: 600 }}>{formatCLP(subtotal)}</span>
          </div>

          {/* Delivery Cost Line Item */}
          {orderType === 'Delivery' && (
            <div className="flex justify-between items-center p-2 card" style={{ background: 'var(--amber-dim)', border: '1px solid #fef08a' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--amber)' }}>
                🛵 Delivery ({businessConfig.reparto_tipo === 'fijo' ? 'Tarifa Fija' : businessConfig.reparto_tipo === 'porcentaje' ? `${businessConfig.reparto_valor}%` : 'Sin Costo'}):
              </span>
              <span className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--amber)' }}>
                +{formatCLP(currentDeliveryFee)}
              </span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--green)' }}>
              <span>Descuento Recompensa</span>
              <span className="mono">-{formatCLP(discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2" style={{ borderTop: '1.5px solid var(--border)', fontSize: '1.4rem', fontWeight: 800 }}>
            <span>TOTAL</span>
            <span className="mono" style={{ color: 'var(--cyan)' }}>{formatCLP(total)}</span>
          </div>
          
          <button 
            className="primary pos-btn w-full mt-2" 
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
          >
            PAGAR {formatCLP(total)}
          </button>
        </div>
      </div>

      {/* MODAL CREAR CLIENTE RÁPIDO POS */}
      {showQuickCreate && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '400px', padding: '1.5rem', margin: 'auto 0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>➕ Registrar Nuevo Cliente</h3>
            <form onSubmit={handleQuickCreateSave} className="flex-col gap-3">
              <div className="form-group mb-0">
                <label>Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={quickCustomerForm.nombre}
                  onChange={e => setQuickCustomerForm({ ...quickCustomerForm, nombre: e.target.value })}
                />
              </div>
              <div className="form-group mb-0">
                <label>Teléfono / Celular *</label>
                <input
                  type="text"
                  required
                  value={quickCustomerForm.telefono}
                  onChange={e => setQuickCustomerForm({ ...quickCustomerForm, telefono: e.target.value })}
                />
              </div>
              <div className="form-group mb-0">
                <label>Dirección de Despacho (Delivery)</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Providencia 1234, Depto 402"
                  value={quickCustomerForm.direccion}
                  onChange={e => setQuickCustomerForm({ ...quickCustomerForm, direccion: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="secondary flex-1" onClick={() => setShowQuickCreate(false)}>Cancelar</button>
                <button type="submit" className="primary flex-1">Guardar y Vincular</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICADORES */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '400px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Personalizar {selectedProduct.nombre}</h2>
            <div className="flex-col gap-2">
              {mockModifiers.map(mod => {
                const isSelected = selectedModifiers.find(m => m.id === mod.id);
                return (
                  <button 
                    key={mod.id} 
                    className={`pos-btn w-full justify-between ${isSelected ? 'primary' : 'secondary'}`}
                    onClick={() => toggleModifier(mod)}
                  >
                    <span>{mod.label}</span>
                    {mod.price > 0 && <span className="mono">+{formatCLP(mod.price)}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between gap-2 mt-2">
              <button className="secondary flex-1" onClick={() => setSelectedProduct(null)}>Cancelar</button>
              <button className="primary flex-1" onClick={confirmProductAdd}>Agregar al Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGO */}
      {showPayment && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '500px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Cobro de Ticket ({orderType})</h2>
            
            <div className="flex gap-2">
              {['Efectivo', 'Tarjeta', 'Transferencia'].map(method => (
                <button 
                  key={method} 
                  className={`flex-1 ${paymentMethod === method ? 'primary' : 'secondary'}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'Efectivo' && (
              <div className="flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 2000, 5000, 10000, 20000].map(amount => (
                    <button 
                      key={amount} 
                      className="secondary pos-btn mono"
                      onClick={() => setCashAmount(amount.toString())}
                    >
                      {formatCLP(amount)}
                    </button>
                  ))}
                  <button className="primary pos-btn mono" onClick={() => setCashAmount(total.toString())}>Exacto</button>
                </div>
                
                <input 
                  type="number" 
                  className="mono text-center" 
                  style={{ fontSize: '1.5rem', fontWeight: 800 }} 
                  placeholder="Monto Recibido"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                />
                
                {cashAmount && parseInt(cashAmount) >= total && (
                  <div className="text-center p-4 rounded card" style={{ backgroundColor: 'var(--green-dim)', border: '1px solid #bbf7d0' }}>
                    <p style={{ color: 'var(--green)', fontWeight: 600 }}>Vuelto a Entregar</p>
                    <p className="mono" style={{ fontSize: '2.5rem', color: 'var(--green)', fontWeight: 800 }}>
                      {formatCLP(parseInt(cashAmount) - total)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between gap-2 mt-2">
              <button className="secondary flex-1" onClick={() => setShowPayment(false)}>Cancelar</button>
              <button 
                className="primary flex-1" 
                onClick={handlePaymentConfirm}
                disabled={paymentMethod === 'Efectivo' && (!cashAmount || parseInt(cashAmount) < total)}
              >
                Confirmar y Cobrar {formatCLP(total)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET POST-VENTA */}
      {ticket && (
        <div className="modal-overlay">
          <div className="card text-center flex-col gap-3" style={{ width: '380px', background: '#f4f1e8', border: '1px solid #d4cebe' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b1d1f' }}>{businessConfig.nombre_negocio || 'La 7 FastFood'}</h2>
            <p className="mono" style={{ color: '#666' }}>Ticket {ticket.numero} ({ticket.orderType})</p>

            {ticket.customer && (
              <div className="text-left text-xs p-2 rounded" style={{ background: '#e2e8f0', color: '#1e293b' }}>
                <p><strong>Cliente:</strong> {ticket.customer.nombre}</p>
                <p><strong>Teléfono:</strong> {ticket.customer.telefono}</p>
                {ticket.customer.direccion && <p><strong>Dirección:</strong> {ticket.customer.direccion}</p>}
              </div>
            )}
            
            <div className="flex-col gap-2 text-left border-y py-3" style={{ borderColor: '#999', fontFamily: 'JetBrains Mono', color: '#1b1d1f' }}>
              {ticket.items.map(item => (
                <div key={item.cartId} className="flex justify-between">
                  <span>{item.qty}x {item.nombre}</span>
                  <span style={{ fontWeight: 700 }}>{formatCLP(item.unitTotal * item.qty)}</span>
                </div>
              ))}
              {ticket.orderType === 'Delivery' && (
                <div className="flex justify-between" style={{ color: '#d97706', fontWeight: 700 }}>
                  <span>🛵 Envío Delivery</span>
                  <span>+{formatCLP(ticket.deliveryFee)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-bold text-xl" style={{ color: '#1b1d1f' }}>
              <span>TOTAL</span>
              <span className="mono">{formatCLP(ticket.total)}</span>
            </div>

            <div className="flex justify-between text-sm" style={{ color: '#555' }}>
              <span>Pago: {ticket.paymentMethod}</span>
              {ticket.change > 0 && <span>Vuelto: {formatCLP(ticket.change)}</span>}
            </div>

            {ticket.pointsEarned > 0 && customer && (
              <div className="badge success" style={{ background: '#dcfce7', color: '#15803d' }}>
                +{ticket.pointsEarned} Puntos Acumulados para {customer.nombre}
              </div>
            )}

            <button className="primary w-full pos-btn mt-2" onClick={resetVenta}>NUEVA VENTA</button>
          </div>
        </div>
      )}

    </div>
  );
}
