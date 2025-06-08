const input        = document.getElementById('search');
const container    = document.getElementById('suggestions');
let items          = [];      // current array of suggestions
let selectedIndex  = -1;      // for arrow navigation
let debounceTimer;

const neonCache = new Map();

const petTypeOrder = {
    "common":   1,
    "uncommon": 2,
    "rare":     3,
    "epic":     4,
    "mythical": 5,
    "legendary":6,
    "gem":      7,
    "bot":      8,
    "distorted":9,
    "fabled":   10,
    "hidden:":  11,
    "special":  12,
    "patreon":  13,
    "cpatreon": 14
};

const neonURL = "https://neonutil.vercel.app/zoo-stats?";

input.addEventListener('input', onInput);
input.addEventListener('keydown', onKeyDown);
input.addEventListener('blur',hideSuggestions);

function fetchNeon(query){ 
    let fetchURL = neonURL + query;

    return fetch(fetchURL) 
    .then(response => {
        return response.json();
    })
}

function throttle(fn, delay) {
  let last = 0,
      timer = null,
      pending = null;

  return function throttled(...args) {
    const now       = Date.now();
    const remaining = delay - (now - last);

    if (remaining <= 0) {
      clearTimeout(timer);
      timer  = null;
      last   = now;
      return Promise.resolve(fn.apply(this, args));
    }

    if (pending) {
      return pending;
    }

    pending = new Promise(resolve => {
      timer = setTimeout(() => {
        last    = Date.now();
        timer   = null;
        const result = fn.apply(this, args);
        resolve(result);
        pending = null;
      }, remaining);
    });

    return pending;
  };
}

const fetchNeonThrottled = throttle(fetchNeon, 500);

function fetchNeonWithCache(query) {
    query = query.trim();
    query = query.split(/\s+/)[0];

    if (neonCache.has(query)) {
        return Promise.resolve(neonCache.get(query));
    }

    return fetchNeonThrottled(query)
        .then(data => {
        neonCache.set(query, data);
        return data;
        });
}

function onInput(e) {
    const q = e.target.value.trim();
    if (!q || q.length<=2) return hideSuggestions();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async ()=> {

        items.length = 0;
        const tempArray = await fetchNeonWithCache("n="+encodeURIComponent(q));
        tempArray.forEach((item,i)=>{
            items.push(tempArray[i][0]);
        })
        renderSuggestions();
    }, 200);
}

function renderSuggestions() {
    container.innerHTML = '';
    selectedIndex = -1;
    if (!items.length) return hideSuggestions();

    items.forEach((text, i) => {
        const div = document.createElement('div');
        div.className = 'suggestion';
        div.textContent = text;
        div.addEventListener('mousedown', e => {
            e.preventDefault();
            applyItem(i);
        });
        container.appendChild(div);
    });
    showSuggestions();
}

function showSuggestions() {
    container.style.display = 'block';
}

function hideSuggestions() {
    container.style.display = 'none';
    items = [];
    selectedIndex = -1;
}

function onKeyDown(e) {
    const max = items.length - 1;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex < max ? selectedIndex + 1 : 0);
        highlight();
    }
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex > 0 ? selectedIndex - 1 : max);
        highlight();
    }
    else if (e.key === 'Enter') {
        e.preventDefault();
        applyItem(selectedIndex);
    }
    else if (e.key === 'Escape') {
        e.target.blur();
    }
}

function highlight() {
    Array.from(container.children).forEach((div, i) => {
        div.classList.toggle('active', i === selectedIndex);
    });
}

function applyItem(i) {
    if (items[i]){input.value = items[i]}
    updateStatsFromPet(input.value);
    hideSuggestions();
    input.focus();
}

function outputSmallPetContainer(pet){

    const wrapper = document.getElementById("petOutput");
    
    wrapper.style=` border-top: 2px solid #909090;
                    border-left: 2px solid #909090;
                    border-right: 2px solid #606060;
                    border-bottom: 2px solid #606060;
                    
                    border-radius: 0.2rem;  
                    width: 11rem;
                    margin-top: 0.5rem;
                    padding: 0.35rem;`;

    deleteChildren(wrapper);

    let imageContainer=document.createElement("img");
    imageContainer.src=pet?  getPetImage(pet,true):
                                `../media/owo_images/questionmark.jpg`;
    imageContainer.style.width="3rem";                            

    let aliasContainer=document.createElement("div");
    aliasContainer.innerHTML="Aliases: "+(pet?pet[3].join(", "): "undefined");
    aliasContainer.className="discord-code-lite";
    aliasContainer.style= ` width: max-content;
                            text-align:unset;
                            font-size:0.75rem`;

    let nameContainer=document.createElement("div");
    nameContainer.innerHTML=pet? pet[0]:"undefined";
    nameContainer.className="discord-code-lite";
    nameContainer.style= `  width: max-content;
                            text-align:unset;
                            font-weight:bold;`;

    wrapper.appendChild(imageContainer);
    wrapper.appendChild(nameContainer);
    wrapper.appendChild(aliasContainer);
}

async function updateStatsFromPet(petString){
    if (petString){
        petString = petString.toLowerCase();
        pet =await fetchNeonWithCache("q="+petString);
        pet = pet[0];
        outputSmallPetContainer(pet);
    }
}

function deleteChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function getPetImage(pet, wantAnimated){
    if (petTypeOrder[pet[4]]<=5){
        return `../media/owo_images/${pet[2]}.png`;
    }else if( wantAnimated && pet[1] == 1){
        return `https://cdn.discordapp.com/emojis/${pet[2]}.gif?size=96`;
    }else{
        return `https://cdn.discordapp.com/emojis/${pet[2]}.png?size=96`;
    }
}