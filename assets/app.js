const brands=[
  {name:'Nike',type:'Brand'},
  {name:'New Balance',type:'Brand'},
  {name:'Adidas',type:'Brand'},
  {name:'Air Jordan',type:'Brand'},
  {name:'ASICS',type:'Brand'},
  {name:'Puma',type:'Brand'},
  {name:'Converse',type:'Brand'},
  {name:'Vans',type:'Brand'},
  {name:'Reebok',type:'Brand'},
  {name:'Saucony',type:'Brand'},
  {name:'Skechers',type:'Brand'},
  {name:'Under Armour',type:'Brand'}
];

const search=document.getElementById('brandSearch');
const suggestions=document.getElementById('searchSuggestions');
const brandButtons=[...document.querySelectorAll('[data-brand]')];
const toast=document.getElementById('toast');
let toastTimer;

const hero=document.querySelector('.hero');
const showcaseShoes=[...document.querySelectorAll('.showcase-shoe')];
let showcaseReady=false;
let showcaseStarted=false;

function startShowcase(){
  if(!showcaseReady||showcaseStarted||document.visibilityState!=='visible')return;
  showcaseStarted=true;
  requestAnimationFrame(()=>hero.classList.add('motion-ready'));
}

function imageLoaded(image){
  return new Promise(resolve=>{
    if(image.complete){resolve(image.naturalWidth>0);return;}
    image.addEventListener('load',()=>resolve(true),{once:true});
    image.addEventListener('error',()=>resolve(false),{once:true});
  });
}

if(hero&&showcaseShoes.length===3){
  const heroImage=new Image();
  heroImage.src='assets/stepforge-hero-real-shoes.jpg';
  Promise.all([...showcaseShoes.map(imageLoaded),imageLoaded(heroImage)]).then(async(results)=>{
    if(results.some(loaded=>!loaded))return;
    await Promise.all(showcaseShoes.map(async shoe=>{try{await shoe.decode?.();}catch{}}));
    showcaseReady=true;
    startShowcase();
  });
  document.addEventListener('visibilitychange',startShowcase);
  window.addEventListener('pageshow',startShowcase);
}

function showMessage(message){
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),3000);
}

function setBrand(name){
  brandButtons.forEach(button=>button.classList.toggle('active',button.dataset.brand===name));
  search.value=name==='All brands'?'':name;
  suggestions.hidden=true;
  search.setAttribute('aria-expanded','false');
  showMessage(name==='All brands'?'All brands selected':`${name} selected — the collection page will be connected by your team.`);
}

function renderSuggestions(){
  const query=search.value.trim().toLowerCase();
  if(!query){suggestions.hidden=true;search.setAttribute('aria-expanded','false');return;}
  const matches=brands.filter(brand=>brand.name.toLowerCase().includes(query)).slice(0,7);
  suggestions.innerHTML=matches.length
    ? matches.map(brand=>`<button type="button" role="option" data-suggestion="${brand.name}"><b>${brand.name}</b><span>${brand.type}</span></button>`).join('')
    : '<button type="button" disabled><b>No matching brand</b><span>Try another letter</span></button>';
  suggestions.hidden=false;
  search.setAttribute('aria-expanded','true');
  suggestions.querySelectorAll('[data-suggestion]').forEach(button=>button.addEventListener('click',()=>setBrand(button.dataset.suggestion)));
}

search.addEventListener('input',renderSuggestions);
search.addEventListener('focus',renderSuggestions);
search.addEventListener('keydown',event=>{
  if(event.key==='Escape'){suggestions.hidden=true;search.setAttribute('aria-expanded','false')}
  if(event.key==='Enter'){
    const first=suggestions.querySelector('[data-suggestion]');
    if(first){event.preventDefault();setBrand(first.dataset.suggestion)}
  }
});
document.addEventListener('click',event=>{if(!event.target.closest('.search-shell')){suggestions.hidden=true;search.setAttribute('aria-expanded','false')}});
brandButtons.forEach(button=>button.addEventListener('click',()=>setBrand(button.dataset.brand)));
document.querySelectorAll('[data-message]').forEach(button=>button.addEventListener('click',()=>showMessage(button.dataset.message)));
document.querySelectorAll('footer button:not([type="submit"])').forEach(button=>button.addEventListener('click',()=>showMessage(`${button.textContent.trim()} will be connected by your project team.`)));
document.getElementById('newsletterForm').addEventListener('submit',event=>{event.preventDefault();event.currentTarget.reset();showMessage('Demo only — no email was collected.')});
