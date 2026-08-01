// Utility for persistent offline sale queue using browser IndexedDB API
const DB_NAME = 'La7_FastFood_DB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_orders';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB no soportado en este navegador. Usando localStorage.');
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveOfflineOrder = async (order) => {
  const payload = {
    ...order,
    id: order.id || `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    sync_status: 'PENDING'
  };

  // 1. Guardar en localStorage para disponibilidad inmediata en UI
  try {
    const localSales = JSON.parse(localStorage.getItem('la7_ventas_locales') || '[]');
    localStorage.setItem('la7_ventas_locales', JSON.stringify([payload, ...localSales]));

    // Guardar comanda para el Monitor de Cocina (KDS)
    const localComandas = JSON.parse(localStorage.getItem('la7_comandas_cocina') || '[]');
    const newComanda = {
      id: payload.id,
      ticket_num: payload.numero_ticket || `#T-${payload.id.slice(-5)}`,
      fecha: payload.fecha || new Date().toISOString(),
      estado_cocina: 'PENDIENTE', // 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO'
      canal: payload.canal || 'Local',
      cliente: payload.cliente || 'Consumidor Final',
      items: (payload.detalles || payload.items || []).map(d => ({
        producto: typeof d.producto === 'string' ? d.producto : (d.producto?.nombre || 'Producto'),
        cantidad: d.cantidad || 1,
        modificadores: d.modificadores || []
      }))
    };
    localStorage.setItem('la7_comandas_cocina', JSON.stringify([newComanda, ...localComandas]));
  } catch (e) {
    console.error('Error guardando venta local:', e);
  }

  // 2. Guardar en IndexedDB para persistencia resiliente de largo plazo
  try {
    const db = await initDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await store.put(payload);
    }
  } catch (err) {
    console.error('Error guardando en IndexedDB:', err);
  }

  return payload;
};

export const getPendingOrders = async () => {
  try {
    const db = await initDB();
    if (!db) {
      const localSales = JSON.parse(localStorage.getItem('la7_ventas_locales') || '[]');
      return localSales.filter(s => s.sync_status === 'PENDING');
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.filter(r => r.sync_status === 'PENDING'));
      };
      request.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
};

export const syncOfflineOrders = async (sendApiCallback) => {
  if (!navigator.onLine) return 0;
  
  const pending = await getPendingOrders();
  if (pending.length === 0) return 0;

  let syncedCount = 0;
  for (const order of pending) {
    try {
      if (sendApiCallback) {
        await sendApiCallback(order);
      }
      order.sync_status = 'SYNCED';

      // Actualizar IndexedDB
      const db = await initDB();
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(order.id);
      }
      syncedCount++;
    } catch (e) {
      console.warn(`No se pudo sincronizar pedido ${order.id}:`, e);
    }
  }

  if (syncedCount > 0) {
    const localSales = JSON.parse(localStorage.getItem('la7_ventas_locales') || '[]');
    const updated = localSales.map(s => {
      if (pending.some(p => p.id === s.id)) {
        return { ...s, sync_status: 'SYNCED' };
      }
      return s;
    });
    localStorage.setItem('la7_ventas_locales', JSON.stringify(updated));
  }

  return syncedCount;
};

// Listener global para auto-sincronizar al recuperar conexión
window.addEventListener('online', () => {
  console.log('📶 Conexión restaurada: Intentando auto-sincronizar ventas offline...');
  syncOfflineOrders();
});
