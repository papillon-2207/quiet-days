/** DOM construction only; never inject user or imported content as HTML. */
export function el(tag, attrs={}, ...children) {
  const node=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)) {
    if(v===false || v===null || v===undefined) continue;
    if(k==='class') node.className=v;
    else if(k==='on') for(const [event,handler] of Object.entries(v)) node.addEventListener(event,handler);
    else if(k==='checked' || k==='disabled' || k==='required' || k==='hidden') node[k]=Boolean(v);
    else if(k==='value') node.value=v;
    else node.setAttribute(k,String(v));
  }
  for(const child of children.flat(Infinity)) if(child!==null && child!==undefined && child!==false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
export const p = (text,cls='') => el('p',{class:cls},text);
export const button = (text,fn,cls='',attrs={}) => el('button',{type:'button',class:cls,on:{click:fn},...attrs},text);
export function field(label,input,help='') {
  const id=input.id || `f-${crypto.randomUUID()}`; input.id=id;
  const helpId=`${id}-help`; if(help) input.setAttribute('aria-describedby',helpId);
  return el('div',{class:'field'},el('label',{for:id},label),input,help ? el('p',{class:'hint',id:helpId},help):null);
}
export function select(label,values,value,change,help='') {
  const input=el('select',{on:{change:e=>change(e.target.value)}});
  for(const [k,text] of Object.entries(values)) input.append(el('option',{value:k},text)); input.value=value;
  return field(label,input,help);
}
export function checkbox(label,checked,change,help='') {
  const id=`f-${crypto.randomUUID()}`, input=el('input',{id,type:'checkbox',checked,on:{change:e=>change(e.target.checked)}});
  return el('div',{class:'check-field'},el('label',{for:id},input,el('span',{},label)),help?p(help,'hint'):null);
}
export function heading(title,subtitle='',eyebrow='') { return el('div',{class:'page-heading'},eyebrow?p(eyebrow,'eyebrow'):null,el('h1',{id:'page-title',tabindex:'-1'},title),subtitle?p(subtitle,'lede'):null); }
export function card(title,...children) { return el('section',{class:'card'},title?el('h2',{},title):null,...children); }
export function details(title,...children) { return el('details',{},el('summary',{},title),el('div',{class:'details-content'},...children)); }
export function announce(message, urgent=false) {
  const n=document.getElementById(urgent?'alert':'status'); if(!n)return;
  if(!urgent){const prior=document.getElementById('alert');if(prior)prior.textContent='';}
  n.textContent=''; requestAnimationFrame(()=>{n.textContent=message;});
}
export function focusMain() { requestAnimationFrame(()=>document.getElementById('page-title')?.focus({preventScroll:true})); }
/** Native modal supplies focus trap and inert background; explicit focus and restoration remain necessary. */
export function modal(title,build) {
  const before=document.activeElement, dialog=el('dialog',{'aria-labelledby':'dialog-title'});
  const close=()=>dialog.close();
  dialog.append(el('h2',{id:'dialog-title'},title),...build(close),button('關閉',close,'secondary'));
  dialog.addEventListener('close',()=>{dialog.remove(); if(before?.isConnected)before.focus();});
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('input,button,select,textarea')?.focus(); return dialog;
}
