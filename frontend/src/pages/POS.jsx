import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';
import { saveOfflineOrder } from '../utils/offlineQueue';

const mockModifiers = [];

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
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.some(p => ['Classic Burger','Cheese Burger','Papas Fritas Chicas','Coca Cola 500ml','Combo 1','Empanada Queso'].includes(p.nombre))) {
          localStorage.removeItem('la7_productos_cache');
          return [];
        }
        return parsed;
      }
    } catch (e) {}
    return [];
  });

  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.categoria)))];
  const [activeCategory, setActiveCategory] = useState('Todas');
  
  // Mobile Tab State: 'catalog' | 'ticket'
  const [mobileTab, setMobileTab] = useState('catalog');

  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Local'); // 'Local' | 'Delivery'

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
    api.productos.getAll()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeProduct);
          setProducts(normalized);
          localStorage.setItem('la7_productos_cache', JSON.stringify(normalized));
        }
      })
      .catch(err => console.log('Usando caché de productos local:', err));

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

  const totalItemsCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.qty, 0);

  const calcDeliveryFee = () => {
    if (orderType !== 'Delivery') return 0;
    const { reparto_tipo, reparto_valor } = businessConfig;

    if (reparto_tipo === 'fijo') {
      return Number(reparto_valor) || 0;
    } else if (reparto_tipo === 'porcentaje') {
      return Math.round(subtotal * ((Number(reparto_valor) || 0) / 100));
    }
    return 0;
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

      let isOffline = !navigator.onLine;
      let response = null;

      if (!isOffline) {
        response = await api.ventas.create(payload).catch((err) => {
          console.warn('API no disponible, guardando en cola offline:', err);
          isOffline = true;
          return null;
        });
      }

      const ticketNumber = response?.numero_ticket || `#T-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;

      const newTicket = {
        id: response?.id ? String(response.id) : `OFF-${Date.now()}`,
        numero: ticketNumber.startsWith('#') ? ticketNumber : `#${ticketNumber}`,
        numero_ticket: ticketNumber,
        fecha: response?.fecha || new Date().toISOString(),
        items: cart,
        detalles: cart.map(i => ({ producto: i.nombre, cantidad: i.qty, precioUnitario: i.precio, subtotal: i.unitTotal * i.qty })),
        paymentMethod,
        medio_pago: paymentMethod,
        orderType,
        canal: orderType,
        customer,
        cliente: customer ? customer.nombre : 'Consumidor Final',
        deliveryFee: currentDeliveryFee,
        change: response?.vuelto ?? (paymentMethod === 'Efectivo' && cashAmount ? parseInt(cashAmount) - total : 0),
        pointsEarned: response?.puntos_ganados ?? Math.floor(total / 100),
        total: response?.total ?? total,
        estado: 'Completada',
        anulada: false,
        sync_status: isOffline ? 'PENDING' : 'SYNCED'
      };

      // Guardar de forma resiliente en IndexedDB y crear comanda de cocina KDS
      await saveOfflineOrder(newTicket);

      setTicket(newTicket);
      setShowPayment(false);
    } catch (err) {
      console.error(err);
      alert('Error al registrar la venta en el sistema.');
    }
  };

  const resetVenta = () => {
    setCart([]);
    setCustomer(null);
    setPhone('');
    setTicket(null);
    setOrderType('Local');
    setMobileTab('catalog');
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
    <div className="flex-col gap-4 animate-slide-up" style={{ minHeight: '85vh' }}>
      
      {/* Mobile Screen Tab Switcher (< 1024px) */}
      <div className="flex gap-2 hidden-desktop p-1 rounded card" style={{ backgroundColor: 'var(--surface-3)', border: '1px solid var(--border)' }}>
        <button
          className={`flex-1 ${mobileTab === 'catalog' ? 'primary' : 'ghost'}`}
          onClick={() => setMobileTab('catalog')}
          style={{ fontSize: '0.9rem', padding: '0.5rem' }}
        >
          🍔 Catálogo ({filteredProducts.length})
        </button>
        <button
          className={`flex-1 ${mobileTab === 'ticket' ? 'primary' : 'ghost'}`}
          onClick={() => setMobileTab('ticket')}
          style={{ fontSize: '0.9rem', padding: '0.5rem' }}
        >
          🛒 Ticket ({totalItemsCount}) - {formatCLP(total)}
        </button>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="flex pos-container-responsive gap-4 flex-1">
        
        {/* Left/Main Section: Categories & Products Grid */}
        <div 
          className="flex-col gap-4 flex-1"
          style={{ display: mobileTab === 'catalog' || window.innerWidth >= 1024 ? 'flex' : 'none' }}
        >
          {/* Categories Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`pos-btn ${activeCategory === cat ? 'primary' : 'secondary'}`}
                onClick={() => setActiveCategory(cat)}
                style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {filteredProducts.map(p => (
              <div 
                key={p.id} 
                className={`card flex-col items-center justify-center p-3 cursor-pointer relative ${p.stock <= 0 ? 'opacity-50' : ''}`}
                onClick={() => addToCart(p)}
                style={{ minHeight: '110px', textAlign: 'center' }}
              >
                <span style={{ fontSize: '2.5rem' }}>{p.icono}</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.3rem' }}>{p.nombre}</h3>
                <p className="mono" style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '0.9rem' }}>{formatCLP(p.precio)}</p>
                {p.stock <= 0 && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 'var(--radius)' }}>
                    <span className="badge danger" style={{ fontSize: '0.85rem' }}>Agotado</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Ticket / Cart Panel */}
        <div 
          className="card pos-cart-panel flex-col flex gap-3" 
          style={{ 
            width: '360px', 
            display: mobileTab === 'ticket' || window.innerWidth >= 1024 ? 'flex' : 'none' 
          }}
        >
          <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ticket de Venta</h2>
            
            <div className="flex gap-1" style={{ background: 'var(--surface-3)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              <button
                className={orderType === 'Local' ? 'primary' : 'ghost'}
                onClick={() => setOrderType('Local')}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              >
                🏪 Local
              </button>
              <button
                className={orderType === 'Delivery' ? 'primary' : 'ghost'}
                onClick={() => setOrderType('Delivery')}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
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
                style={{ fontSize: '0.85rem' }}
              />
              <button className="secondary" title="Buscar Cliente" onClick={handlePhoneSearch} style={{ minWidth: '44px' }}>🔍</button>
            </div>
          ) : (
            <div className="flex-col gap-1 p-2 rounded card" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>👤 {customer.nombre}</span>
                <div className="flex items-center gap-1">
                  <span className="badge warning" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}>
                    ⭐ {customer.puntos_acumulados ?? customer.puntos ?? 0} pts
                  </span>
                  <button className="ghost danger" style={{ padding: '0.1rem 0.3rem', fontSize: '0.75rem' }} onClick={() => setCustomer(null)}>✕</button>
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

          {/* Cart Items List */}
          <div className="flex-col flex-1 overflow-y-auto gap-2" style={{ maxHeight: '350px' }}>
            {cart.map(item => (
              <div key={item.cartId} className="flex-col gap-1 p-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.nombre}</span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCLP(item.unitTotal * item.qty)}</span>
                </div>
                {item.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.modifiers.map(m => (
                      <span key={m.id} className="badge info" style={{ fontSize: '0.7rem' }}>{m.label}</span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-2">
                    <button className="secondary pos-touch-btn" aria-label="Disminuir" onClick={() => updateQty(item.cartId, -1)}>-</button>
                    <span className="mono font-bold" style={{ minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button className="secondary pos-touch-btn" aria-label="Aumentar" onClick={() => updateQty(item.cartId, 1)}>+</button>
                  </div>
                  <button className="danger ghost pos-touch-btn" aria-label="Eliminar" onClick={() => removeItem(item.cartId)}>🗑️</button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="empty-state">El carrito está vacío</div>
            )}
          </div>

          {/* Cart Totals & Checkout Button */}
          <div className="flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span className="mono font-bold">{formatCLP(subtotal)}</span>
            </div>

            {orderType === 'Delivery' && (
              <div className="flex justify-between items-center p-2 card" style={{ background: 'var(--amber-dim)', border: '1px solid #fef08a' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--amber)' }}>
                  🛵 Delivery ({businessConfig.reparto_tipo === 'fijo' ? 'Fijo' : `${businessConfig.reparto_valor}%`}):
                </span>
                <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--amber)' }}>
                  +{formatCLP(currentDeliveryFee)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1" style={{ borderTop: '1.5px solid var(--border)', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>TOTAL</span>
              <span className="mono" style={{ color: 'var(--cyan)' }}>{formatCLP(total)}</span>
            </div>
            
            <button 
              className="primary pos-btn w-full mt-1" 
              disabled={cart.length === 0}
              onClick={() => setShowPayment(true)}
            >
              COBRAR {formatCLP(total)}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) Mobile Cart */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <button 
          className="pos-fab" 
          onClick={() => setMobileTab('ticket')}
        >
          <span>🛒 {totalItemsCount} ítems</span>
          <span className="mono">{formatCLP(total)}</span>
        </button>
      )}

      {/* MODAL CREAR CLIENTE RÁPIDO POS */}
      {showQuickCreate && (
        <div className="modal-overlay">
          <div className="modal-content flex-col gap-4" style={{ maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>➕ Registrar Nuevo Cliente</h3>
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
          <div className="modal-content flex-col gap-4" style={{ maxWidth: '420px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Personalizar {selectedProduct.nombre}</h2>
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
          <div className="modal-content flex-col gap-4" style={{ maxWidth: '480px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Cobro de Ticket ({orderType})</h2>
            
            <div className="flex gap-2">
              {['Efectivo', 'Tarjeta', 'Transferencia'].map(method => (
                <button 
                  key={method} 
                  className={`flex-1 ${paymentMethod === method ? 'primary' : 'secondary'}`}
                  onClick={() => setPaymentMethod(method)}
                  style={{ fontSize: '0.85rem' }}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'Efectivo' && (
              <div className="flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 2000, 5000, 10000, 20000].map(amount => (
                    <button 
                      key={amount} 
                      className="secondary pos-btn mono"
                      onClick={() => setCashAmount(amount.toString())}
                      style={{ fontSize: '0.9rem' }}
                    >
                      {formatCLP(amount)}
                    </button>
                  ))}
                  <button className="primary pos-btn mono" onClick={() => setCashAmount(total.toString())} style={{ fontSize: '0.9rem' }}>Exacto</button>
                </div>
                
                <input 
                  type="number" 
                  className="mono text-center" 
                  style={{ fontSize: '1.35rem', fontWeight: 800 }} 
                  placeholder="Monto Recibido"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                />
                
                {cashAmount && parseInt(cashAmount) >= total && (
                  <div className="text-center p-3 rounded card" style={{ backgroundColor: 'var(--green-dim)', border: '1px solid #bbf7d0' }}>
                    <p style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>Vuelto a Entregar</p>
                    <p className="mono" style={{ fontSize: '2rem', color: 'var(--green)', fontWeight: 800 }}>
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
          <div className="modal-content text-center flex-col gap-3" style={{ maxWidth: '380px', background: '#f4f1e8', border: '1px solid #d4cebe' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1b1d1f' }}>{businessConfig.nombre_negocio || 'La 7 FastFood'}</h2>
            <p className="mono" style={{ color: '#666', fontSize: '0.85rem' }}>Ticket {ticket.numero} ({ticket.orderType})</p>

            {ticket.customer && (
              <div className="text-left text-xs p-2 rounded" style={{ background: '#e2e8f0', color: '#1e293b' }}>
                <p><strong>Cliente:</strong> {ticket.customer.nombre}</p>
                <p><strong>Teléfono:</strong> {ticket.customer.telefono}</p>
                {ticket.customer.direccion && <p><strong>Dirección:</strong> {ticket.customer.direccion}</p>}
              </div>
            )}
            
            <div className="flex-col gap-2 text-left border-y py-3" style={{ borderColor: '#999', fontFamily: 'JetBrains Mono', color: '#1b1d1f', fontSize: '0.85rem' }}>
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

            <div className="flex justify-between font-bold text-lg" style={{ color: '#1b1d1f' }}>
              <span>TOTAL</span>
              <span className="mono">{formatCLP(ticket.total)}</span>
            </div>

            <div className="flex justify-between text-xs" style={{ color: '#555' }}>
              <span>Pago: {ticket.paymentMethod}</span>
              {ticket.change > 0 && <span>Vuelto: {formatCLP(ticket.change)}</span>}
            </div>

            {ticket.pointsEarned > 0 && customer && (
              <div className="badge success" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem' }}>
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
