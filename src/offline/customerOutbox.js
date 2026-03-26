const DB_NAME = 'sme360_offline';
const DB_VERSION = 1;
const STORE = 'customer_outbox';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'clientCustomerId' });
        os.createIndex('status', 'status', { unique: false });
        os.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function enqueueCustomer(customer) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put({
    clientCustomerId: customer.clientCustomerId,
    payload: customer,
    status: 'pending',
    createdAt: Date.now(),
  });
  await txDone(tx);
  db.close();
}

export async function listPendingCustomers(limit = 50) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const index = tx.objectStore(STORE).index('status');

  const rows = await new Promise((resolve, reject) => {
    const req = index.getAll('pending', limit);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  await txDone(tx);
  db.close();
  return rows;
}

export async function markCustomerSynced(clientCustomerId) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const os = tx.objectStore(STORE);

  const row = await new Promise((resolve, reject) => {
    const req = os.get(clientCustomerId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });

  if (row) {
    row.status = 'synced';
    row.syncedAt = Date.now();
    os.put(row);
  }

  await txDone(tx);
  db.close();
}

