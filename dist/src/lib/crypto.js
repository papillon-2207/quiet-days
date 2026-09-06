const enc = new TextEncoder();
const AAD = enc.encode('quiet-days:encrypted-vault:v1');
export const KDF_ITERATIONS = 600000;
export const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
export function base64(bytes) {
  let s = ''; for (let i=0; i<bytes.length; i+=8192) s += String.fromCharCode(...bytes.subarray(i,i+8192)); return btoa(s);
}
export function unbase64(s) {
  if (typeof s !== 'string' || s.length > MAX_BACKUP_BYTES*2 || !/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 !== 0) throw new Error('備份編碼不正確。');
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
export function validateEnvelope(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e) || e.format !== 'quiet-days' || e.version !== 1 || e.kdf !== 'PBKDF2-SHA256' || e.iterations !== KDF_ITERATIONS || e.algorithm !== 'AES-GCM-256' || unbase64(e.salt).length !== 16 || unbase64(e.iv).length !== 12 || unbase64(e.ciphertext).length < 16 || !Number.isSafeInteger(e.revision) || e.revision < 0 || typeof e.id !== 'string' || !/^[a-f0-9-]{36}$/.test(e.id)) throw new Error('不支援或已損壞的加密備份；原資料未更動。');
  if (JSON.stringify(e).length > MAX_BACKUP_BYTES) throw new Error('備份過大；請保留原檔並尋求協助。');
  return e;
}
export async function deriveKey(password, salt) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw new Error('請使用 12–256 字元的密語。可貼上、使用中文與空白，不需特殊符號。');
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:KDF_ITERATIONS},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function seal(data, key, salt, revision = 0, id = crypto.randomUUID()) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clear = enc.encode(JSON.stringify(data));
  if (clear.length > MAX_BACKUP_BYTES * .7) throw new Error('資料已接近本版容量上限。請先備份；本次未儲存。');
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData: enc.encode(`${new TextDecoder().decode(AAD)}:${id}:${revision}`)},key,clear);
  clear.fill(0);
  return { format:'quiet-days', version:1, id, revision, kdf:'PBKDF2-SHA256', iterations:KDF_ITERATIONS, algorithm:'AES-GCM-256', salt:base64(salt), iv:base64(iv), ciphertext:base64(new Uint8Array(encrypted)) };
}
export async function unseal(envelope, password) {
  const e = validateEnvelope(envelope), salt = unbase64(e.salt), key = await deriveKey(password, salt);
  try {
    const clear = await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(e.iv),additionalData:enc.encode(`${new TextDecoder().decode(AAD)}:${e.id}:${e.revision}`)},key,unbase64(e.ciphertext));
    const bytes = new Uint8Array(clear);
    let data;
    try { data = JSON.parse(new TextDecoder().decode(bytes)); } finally { bytes.fill(0); }
    return { data, key, salt };
  } catch { throw new Error('無法解鎖：密語不正確，或檔案已損壞。原資料未更動。'); }
}
