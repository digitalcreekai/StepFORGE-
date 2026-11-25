
// Display-only catalog (mirrors server.js PRODUCTS). The server recalculates every price.
// img: stand-in assets from the homepage; point these at your real product images.
const RA='https://stepforge-submission-home.aspiringminds15.chatgpt.site/assets/';
const CAT=Object.fromEntries(window.StepForgeProducts.map(p=>[String(p.id),{n:p.name,p:p.price,s:[6,7,8,9,10,11,12],img:p.img}]));
// Use the exact embedded product artwork from the product page, so checkout
// never falls back to stand-in shoe images.
function syncProductImages(){
 const frame=document.createElement('iframe');frame.hidden=true;frame.src='stepforge-30-products-responsive (4).html';
 frame.onload=()=>{try{const cards=[...frame.contentDocument.querySelectorAll('[data-product-id]')];
  Object.values(CAT).forEach(item=>{const card=cards.find(c=>c.querySelector('h3')?.textContent.trim()===item.n);const img=card?.querySelector('img')?.src;if(img)item.img=img});
  render();
 }catch(e){} finally{frame.remove()}};document.body.appendChild(frame);
}
const FREE=100000,SHIP={standard:2500,express:5500,pickup:0},PK='stepforge.checkout.v1',PEND='stepforge.pending.v1';
const $=s=>document.querySelector(s),N=v=>'₦'+Number(v).toLocaleString('en-NG');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=n=>`<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const th=(id,q)=>`<span class="th">${ic('shoe')}${CAT[id]?`<img src="${CAT[id].img}" alt="" onerror="this.remove()">`:''}${q?`<em>${q}</em>`:''}</span>`;
let saved={};try{saved=JSON.parse(localStorage.getItem(PK))||{}}catch{}
const S={step:0,view:'form',coupon:saved.coupon||'',ship:saved.ship||'standard',cust:saved.cust||{},err:{},terms:false,q:null,qk:'',paying:false,open:false,note:'',res:'',msg:'',d:null,ref:'',poll:0};
const save=()=>{try{localStorage.setItem(PK,JSON.stringify({coupon:S.coupon,ship:S.ship,cust:S.cust}))}catch{}};
const cart=()=>StepForgeStore.get().filter(i=>CAT[String(i.id)]).map(i=>({...i,id:String(i.id)}));
const key=()=>JSON.stringify([cart(),S.ship,S.coupon]);
function calc(){const c=cart(),sub=c.reduce((a,i)=>a+CAT[i.id].p*i.qty,0),disc=S.coupon.toUpperCase()==='WELCOME10'?Math.round(sub*.1):0,net=sub-disc,ship=!c.length||net>=FREE?0:SHIP[S.ship];return{sub,disc,net,ship,total:net+ship}}
const T=()=>S.q&&S.qk===key()?S.q:calc();
function quote(){const t=calc();S.q={sub:t.sub,disc:t.disc,net:t.net,ship:t.ship,total:t.total};S.qk=key();if(S.view==='form')render()}

function stepper(){const idx=S.res==='paid'&&S.view==='result'?4:S.view==='form'?S.step:2;
 $('#steps').innerHTML=['Cart','Delivery','Payment','Confirmation'].map((l,i)=>`<li class="${i<idx?'done':i===idx?'on':''}"${i===idx?' aria-current="step"':''}><b>${i<idx?ic('check'):i+1}</b><span>${l}</span></li>`).join('')}
function summary(){const c=cart(),t=T(),n=c.reduce((a,i)=>a+i.qty,0),left=FREE-t.net;
 $('#sum').innerHTML=`<button class="sum-t" data-a="sum" aria-expanded="${S.open}">Order summary <small>(${n} ${n===1?'item':'items'})</small><strong>${N(t.total)}</strong>${ic('chev')}</button>
 <div class="sum-b${S.open?' open':''}">${c.map(i=>`<div class="sm">${th(i.id,i.qty)}<div>${esc(CAT[i.id].n)}<small>Size EU ${i.size}</small></div><strong>${N(CAT[i.id].p*i.qty)}</strong></div>`).join('')}
 <div class="bar" role="progressbar" aria-valuenow="${Math.min(100,Math.round(t.net/FREE*100))}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100,t.net/FREE*100)}%"></i></div>
 <p class="mut" style="margin:0 0 12px">${!c.length?'':left<=0?'You get free delivery.':`Add ${N(left)} more for free delivery.`}</p>
 <div class="tr"><span>Subtotal</span><span>${N(t.sub)}</span></div>${t.disc?`<div class="tr"><span>Discount (${esc(S.coupon.toUpperCase())})</span><span>−${N(t.disc)}</span></div>`:''}
 <div class="tr"><span>Delivery</span><span>${t.ship?N(t.ship):'Free'}</span></div><div class="tr big"><span>Total</span><span>${N(t.total)}</span></div>
 <ul class="trust"><li>${ic('lock')}Secure payment with Paystack</li><li>${ic('truck')}Delivery across Nigeria</li><li>${ic('undo')}7-day easy returns</li></ul></div>`}
const fld=(f,l,a='',t='text')=>`<label class="fld${S.err[f]?' bad':''}"><span>${l}</span><input data-f="${f}" type="${t}" value="${esc(S.cust[f]||'')}" ${a} ${S.err[f]?`aria-invalid="true" aria-describedby="e-${f}"`:''}>${S.err[f]?`<small id="e-${f}">${S.err[f]}</small>`:''}</label>`;
const st=(k,i,t,b,x='')=>`<div class="st ${k}"><div class="bdg">${ic(i)}</div><h2 tabindex="-1" id="h">${t}</h2><p>${b}</p>${x}</div>`;
const note=()=>S.note?`<p class="al bad" role="alert">${ic('alert')}${esc(S.note)}</p>`:'';

function form(){const c=cart(),t=T();
 if(S.step===0){if(!c.length)return st('wait','cart','Your cart is empty','Pick a pair from the collection and it will show up here.','<div class="acts"><a class="btn" href="index.html">Shop collection</a></div>');
  const cm=!S.coupon?'':t.disc?`${esc(S.coupon.toUpperCase())} applied.`:'';
  return `<h2 tabindex="-1" id="h">Your cart</h2><p class="mut">Check sizes and quantities before you continue.</p>${note()}`+
  c.map((i,x)=>`<div class="ln">${th(i.id)}<div><b>${esc(CAT[i.id].n)}</b><span class="mut">${N(CAT[i.id].p)}</span><br><select data-a="size" data-i="${x}" aria-label="Size for ${esc(CAT[i.id].n)}">${CAT[i.id].s.map(z=>`<option value="${z}"${z===i.size?' selected':''}>EU ${z}</option>`).join('')}</select></div>
  <div class="rt"><div class="qty"><button data-a="dec" data-i="${x}" aria-label="Decrease quantity">${ic('minus')}</button><output>${i.qty}</output><button data-a="inc" data-i="${x}" aria-label="Increase quantity">${ic('plus')}</button></div><strong>${N(CAT[i.id].p*i.qty)}</strong><button class="ib" data-a="rm" data-i="${x}" aria-label="Remove ${esc(CAT[i.id].n)}">${ic('trash')}</button></div></div>`).join('')+
  `<div class="promo"><label class="fld"><span>Promo code</span><input id="cp" value="${esc(S.coupon)}" placeholder="Try WELCOME10" autocomplete="off"></label><button class="btn sec" data-a="apply">Apply</button></div>
  ${S.coupon&&!t.disc?`<p class="cm bad">That code isn’t valid.</p>`:cm?`<p class="cm">${cm}</p>`:''}
  <div class="acts"><button class="btn block" data-a="go" data-n="1">Continue to delivery</button></div>`}
 if(S.step===1)return `<h2 tabindex="-1" id="h">Delivery details</h2><p class="mut">Where should we send your order?</p>${fld('name','Full name','autocomplete="name"')}
  <div class="row2">${fld('email','Email','autocomplete="email"','email')}${fld('phone','Phone','autocomplete="tel"','tel')}</div>${fld('address','Delivery address','autocomplete="street-address"')}
  <div class="row2">${fld('city','City','autocomplete="address-level2"')}${fld('state','State','autocomplete="address-level1"')}</div><h3>Delivery method</h3>
  ${[['standard','Standard','3-5 days'],['express','Express','1-2 days'],['pickup','Store pickup','Collect when ready']].map(([k,l,d])=>`<label class="opt"><input type="radio" name="sh" data-a="ship" value="${k}"${S.ship===k?' checked':''}><span>${l}<small>${d}</small></span><strong>${SHIP[k]&&t.net<FREE?N(SHIP[k]):'Free'}</strong></label>`).join('')}
  <div class="acts"><button class="btn block" data-a="cust">Continue to payment</button><button class="btn link" data-a="go" data-n="0">Back to cart</button></div>`;
 const u=S.cust;return `<h2 tabindex="-1" id="h">Review and pay</h2><p class="mut">Confirm your details, then pay securely.</p>${note()}
  <div class="rev"><p><b>${esc(u.name)}</b><br>${esc(u.address)}, ${esc(u.city)}, ${esc(u.state)}<br><span class="mut">${esc(u.email)} · ${esc(u.phone)}</span></p><button class="btn link" data-a="go" data-n="1">Edit</button></div>
  <h3>Payment method</h3><div class="opt" style="cursor:default"><input type="radio" checked disabled aria-label="Paystack"><span>Pay with Paystack<small>You’ll choose how to pay on the next screen.</small><div class="chips"><i>Card</i><i>Bank</i><i>Transfer</i><i>USSD</i></div></span>${ic('lock')}</div>
  <label class="opt"><input type="checkbox" id="terms" data-a="terms"${S.terms?' checked':''}><span>I agree to the terms and the 7-day returns policy.</span></label>${S.err.terms?`<p class="cm bad" role="alert">${S.err.terms}</p>`:''}
  <div class="acts"><button class="btn block" id="pay" data-a="pay"${S.paying?' disabled aria-busy="true"':''}>${ic('lock')}Pay ${N(t.total)} securely</button><button class="btn link" data-a="go" data-n="1">Back to delivery</button></div>
  <p class="mut" style="margin:14px 0 0">We never see or store your card details.</p>`}

function result(){const r=S.res,ref=esc(S.ref),h=`<a class="btn" href="index.html">Continue shopping</a>`;
 if(r==='checking')return st('spin','clock','Confirming your payment','This takes a few seconds. Please keep this page open.');
 if(r==='paid'){const n=(S.cust.name||'').split(' ')[0];return st('','check','Order confirmed',`${n?esc(n)+', your':'Your'} payment was received. ${S.cust.email?'A receipt and tracking details will be sent to '+esc(S.cust.email)+'.':'A receipt and tracking details will be sent to your email.'}`,
  `<span class="ref">Order ${ref}</span><div class="rc">${(S.d.items||[]).map(i=>`<div class="ln">${th(i.id,i.qty)}<div><b>${esc(i.name)}</b><span class="mut">Size EU ${i.size}</span></div><strong>${N(i.unit*i.qty)}</strong></div>`).join('')}<div class="tr big"><span>Total paid</span><span>${N(S.d.total)}</span></div></div><div class="acts">${h}</div>`)}
 if(r==='pending')return st('wait','clock','Payment is still processing',`Bank transfers and USSD can take a few minutes. Please don’t pay again; we’ll confirm automatically.`,
  `<span class="ref">Order ${ref}</span><div class="acts"><button class="btn" data-a="check">Check status</button>${h.replace('btn"','btn sec"')}${S.poll>24?'<button class="btn link" data-a="retry">Closed the payment window? Start again</button>':''}</div>`);
 if(r==='review')return st('wait','clock','Payment under review','We received your payment and are confirming the amount. Contact stepforge@gmail.com if you don’t hear from us.',`<span class="ref">Order ${ref}</span><div class="acts">${h}</div>`);
 return st('bad','x','Payment didn’t go through',esc(S.msg||'The payment was not completed.')+' Your cart is saved.',`${S.ref?`<span class="ref">Order ${ref}</span>`:''}<div class="acts"><button class="btn" data-a="retry">Try payment again</button><a class="btn sec" href="mailto:stepforge@gmail.com">Contact support</a></div>`)}

function render(){stepper();summary();const busy=S.view==='busy';
 $('#lay').classList.toggle('solo',S.view==='result'&&S.res==='paid');
 $('#view').setAttribute('aria-busy',busy);
 $('#view').innerHTML=busy?st('spin','lock','Preparing secure payment','Taking you to Paystack. Please don’t close or refresh this page.'):S.view==='result'?result():form()}
const focusH=()=>{const h=$('#h');if(h)h.focus({preventScroll:false})};
function go(n){S.step=n;S.err={};S.note='';render();focusH();scrollTo({top:0})}
function validate(){const c=S.cust,e={};if(!c.name)e.name='Enter your full name.';if(!/^\S+@\S+\.\S+$/.test(c.email||''))e.email='Enter a valid email address.';
 if(!/^(\+?234|0)\d{10}$/.test((c.phone||'').replace(/\s/g,'')))e.phone='Enter a valid Nigerian phone number.';if((c.address||'').length<8)e.address='Enter your full delivery address.';
 if(!c.city)e.city='Enter your city.';if(!c.state)e.state='Enter your state.';return e}
const mut=f=>{StepForgeStore.set(f(cart()));S.note='';render();quote()};
const pend=()=>{try{return JSON.parse(sessionStorage.getItem(PEND))}catch{return null}};

async function pay(){
 if(S.paying)return;
 if(!S.terms){S.err={terms:'Accept the terms to continue.'};return render()}
 const items=cart(); if(!items.length){S.step=0;return render()}
 S.paying=true;S.err={};S.view='busy';render();
 const totals=calc(); const orderId='SF-'+Date.now();
 const order={orderNumber:orderId,orderId,orderDate:new Date().toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'}),paymentStatus:'paid',paymentMethod:'Simulated payment',items:items.map(i=>({productId:i.id,name:CAT[i.id].n,brand:window.StepForgeProducts.find(p=>String(p.id)===i.id)?.brand||'',size:'US '+i.size,quantity:i.qty,price:CAT[i.id].p,image:CAT[i.id].img})),subtotal:totals.sub,deliveryFee:totals.ship,total:totals.total,customerName:S.cust.name,phone:S.cust.phone,address:[S.cust.address,S.cust.city,S.cust.state].filter(Boolean).join(', '),deliveryDate:'To be confirmed'};
 // A real backend payment call can replace this simulated payment in the future.
 if(!StepForgeStore.saveOrder(order)){S.paying=false;S.view='form';S.note='Unable to save the order in this browser.';return render()}
 StepForgeStore.clear();location.href='order-confirmation.html';
}

async function confirm(){location.href='order-confirmation.html'}

document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.a,i=+b.dataset.i;
 if(a==='sum'){S.open=!S.open;return summary()}
 if(a==='go')return go(+b.dataset.n);
 if(a==='inc')return mut(c=>(c[i].qty=Math.min(10,c[i].qty+1),c));
 if(a==='dec')return mut(c=>(c[i].qty=Math.max(1,c[i].qty-1),c));
 if(a==='rm')return mut(c=>c.filter((_,x)=>x!==i));
 if(a==='apply'){S.coupon=$('#cp').value.trim();save();render();return quote()}
 if(a==='cust'){S.err=validate();if(Object.keys(S.err).length){render();const f=$('[aria-invalid]');return f&&f.focus()}save();return go(2)}
 if(a==='pay')return pay();
 if(a==='check')return confirm(S.ref);
 if(a==='retry'){history.replaceState(null,'','/');S.res='';S.view='form';S.step=cart().length?2:0;S.paying=false;if(S.step===2&&validate().email)S.step=1;render();focusH()}});
document.addEventListener('change',e=>{const t=e.target,a=t.dataset.a;
 if(a==='size')return mut(c=>(c[+t.dataset.i].size=+t.value,c));
 if(a==='ship'){S.ship=t.value;save();summary();return quote()}
 if(a==='terms'){S.terms=t.checked;S.err={}}});
document.addEventListener('input',e=>{const f=e.target.dataset.f;if(f)S.cust[f]=e.target.value.trim()});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='cp'){e.preventDefault();document.querySelector('[data-a=apply]').click()}});
addEventListener('pageshow',e=>{if(e.persisted){S.paying=false;if(S.view==='busy')S.view='form';render()}});   // back from Paystack
StepForgeStore.subscribe(()=>{if(S.view==='form')render()});

(function init(){if(!S.cust.city)S.cust.city='Lagos';if(!S.cust.state)S.cust.state='Lagos';render();quote()})();





