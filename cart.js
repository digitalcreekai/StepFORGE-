/* Shared cart store. Product page and checkout both use it: StepForgeCart.add('sneaker-air',42,1) */
(function(){
var KEY='stepforge.cart.v1',subs=[];
function ok(i){return i&&typeof i.id==='string'&&Number.isFinite(+i.size)&&Number.isInteger(+i.qty)&&i.qty>0}
function get(){try{var a=JSON.parse(localStorage.getItem(KEY));return Array.isArray(a)?a.filter(ok).map(function(i){return{id:i.id,size:+i.size,qty:Math.min(10,+i.qty)}}):[]}catch(e){return[]}}
function set(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}emit()}
function add(id,size,qty){var a=get(),f=a.find(function(i){return i.id===id&&i.size===+size});
 if(f)f.qty=Math.min(10,f.qty+(qty||1));else a.push({id:id,size:+size,qty:qty||1});set(a)}
function count(){return get().reduce(function(n,i){return n+i.qty},0)}
function emit(){document.querySelectorAll('[data-cart-count]').forEach(function(e){e.textContent=count()});subs.forEach(function(f){f()})}
window.addEventListener('storage',function(e){if(e.key===KEY)emit()});
document.addEventListener('DOMContentLoaded',emit);
window.StepForgeCart={get:get,set:set,add:add,count:count,clear:function(){set([])},subscribe:function(f){subs.push(f)}};
})();
