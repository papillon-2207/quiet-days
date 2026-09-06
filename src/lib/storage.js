import { emptyData, validateData } from '../domain/model.js';
import { deriveKey, seal, unseal, validateEnvelope } from './crypto.js';
const DB = 'quiet-days-v1';
function openDB() {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open(DB,1);
    request.onupgradeneeded = () => request.result.createObjectStore('vault');
    request.onerror = () => reject(new Error('瀏覽器未允許本機儲存。請勿使用私密瀏覽；目前沒有儲存成功。'));
    request.onblocked = () => reject(new Error('另一個分頁正在使用資料庫；請關閉其他分頁後重試。'));
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
  });
}
export async function readEnvelope() {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('vault','readonly'), request = tx.objectStore('vault').get('main');
    let value = null; request.onsuccess = () => {value = request.result ?? null;};
    tx.oncomplete = () => {db.close(); resolve(value);};
    tx.onabort = tx.onerror = () => {db.close(); reject(new Error('讀取失敗；請保留資料並重試。'));};
  });
}
/** Revision compare-and-swap INSIDE one readwrite transaction. Crypto runs before opening the transaction. */
export async function compareWrite(envelope, expected) {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    let conflict = false;
    const tx = db.transaction('vault','readwrite'), store = tx.objectStore('vault'), req = store.get('main');
    req.onsuccess = () => {
      const cur = req.result;
      if (expected === null ? Boolean(cur) : !cur || cur.id !== expected.id || cur.revision !== expected.revision) { conflict = true; tx.abort(); return; }
      if (envelope === null) store.delete('main'); else store.put(envelope,'main');
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error(conflict ? '其他分頁或操作已修改資料。本次未儲存，請複製未儲存內容後鎖定並重新解鎖；不會覆寫較新的資料。' : '儲存失敗，可能是儲存空間不足或瀏覽器拒絕。請先備份；本次未儲存。')); };
  });
}
export class Vault {
  constructor() { this.data = null; this.key = null; this.salt = null; this.envelope = null; this.demo = false; this.tail = Promise.resolve(); this.generation = 0; }
  async create(password) {
    if (await readEnvelope()) throw new Error('已有資料，請先解鎖或在確認後刪除。');
    const salt = crypto.getRandomValues(new Uint8Array(16)), key = await deriveKey(password,salt), data = emptyData();
    const envelope = await seal(data,key,salt);
    await compareWrite(envelope,null);
    Object.assign(this,{key,salt,data,envelope,demo:false});
  }
  async unlock(password) {
    const envelope = await readEnvelope(); if (!envelope) throw new Error('找不到資料，請建立或匯入備份。');
    const {data,key,salt} = await unseal(envelope,password); validateData(data);
    Object.assign(this,{data,key,salt,envelope,demo:false});
  }
  startDemo(data = emptyData()) { this.lock(); validateData(data); this.data = structuredClone(data); this.demo = true; }
  lock() { this.generation++; this.key = null; this.salt = null; this.data = null; this.envelope = null; this.demo = false; }
  update(change) {
    const generation = this.generation;
    const task = this.tail.then(async () => {
      if (!this.data || this.generation !== generation) throw new Error('已鎖定，請解鎖後重試。');
      const next = change(structuredClone(this.data)); validateData(next);
      if (this.demo) { this.data = next; return next; }
      const expected = this.envelope;
      const envelope = await seal(next,this.key,this.salt,expected.revision+1,expected.id);
      if (this.generation !== generation) throw new Error('已鎖定，本次未儲存。');
      await compareWrite(envelope,expected);
      if (this.generation === generation) { this.envelope = envelope; this.data = next; }
      return next;
    });
    this.tail = task.catch(() => {}); return task;
  }
  async backup() { await this.tail; if (!this.envelope || this.demo) throw new Error('體驗模式沒有永久備份；請建立私人日誌。'); return JSON.stringify(this.envelope); }
  async restore(raw,password,expected = null) {
    if (this.data) throw new Error('請先鎖定後再還原。');
    const incoming = validateEnvelope(JSON.parse(raw)); const { data,key,salt } = await unseal(incoming,password); validateData(data);
    // New identity prevents ABA conflicts with any previously unlocked tab.
    const envelope = await seal(data,key,salt,0);
    await compareWrite(envelope,expected);
    Object.assign(this,{data,key,salt,envelope,demo:false});
  }
  async deleteAll(expected) { await this.tail; await compareWrite(null,expected); this.lock(); }
}
