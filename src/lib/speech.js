/** Opt-in, fail-closed on-device dictation. Never falls back to a cloud recognizer. */
export function localSpeechSupport() {
  const C = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!C || typeof C.available !== 'function') return null;
  try { if (!('processLocally' in new C())) return null; } catch { return null; }
  return C;
}
export async function localSpeechStatus() {
  const C = localSpeechSupport(); if(!C) return 'unsupported';
  try { return await C.available({langs:['zh-TW'],processLocally:true}); } catch { return 'unavailable'; }
}
export async function startLocalDictation(onText,onEnd,onError) {
  const C=localSpeechSupport();
  if(!C || await localSpeechStatus() !== 'available') throw new Error('這個瀏覽器尚無可用的繁體中文裝置端辨識。請使用文字輸入；不會改傳雲端。');
  const rec=new C(); rec.lang='zh-TW'; rec.processLocally=true; rec.continuous=false; rec.interimResults=false;
  let cancelled=false;
  rec.onresult=e=>{ if(!cancelled)onText(e.results[0][0].transcript); };
  rec.onerror=()=>{ if(!cancelled)onError('語音辨識未完成；沒有保存錄音，也沒有自動寫入日誌。'); };
  rec.onend=onEnd; rec.start();
  const stop=()=>{cancelled=true;rec.abort();}; setTimeout(stop,30000);
  return stop;
}
