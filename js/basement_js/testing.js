const input        = document.getElementById('search');
const container    = document.getElementById('suggestions');
let suggestedPets  = [];      // current array of suggestions
let chosenPet      = [];
let selectedIndex  = -1;      // for arrow navigation
let debounceTimer;

const neonCache = new Map();

let hideNextSuggestion = false;

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
input.addEventListener('focus', onInput);//this new
input.addEventListener('click', onInput);//this new

input.addEventListener('keydown', onKeyDown);
input.addEventListener('blur',hideSuggestions);

function fetchNeon(query){ 
    return fetch(neonURL + query) 
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
    query = query.toLowerCase();


    if (neonCache.has(query)) {
        return Promise.resolve(neonCache.get(query));
    }

    return fetchNeonThrottled(query)
        .then(data => {
        neonCache.set(query, data);
        return data;
        });
}

function onInput() {
    const q = input.value.trim();
    if (!q || q.length<=2) return hideSuggestions();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(()=>fetchAndRenderSuggestions(q), 200);
}

async function fetchAndRenderSuggestions(q){
    suggestedPets.length = 0;
    const tempArray = await fetchNeonWithCache("n="+encodeURIComponent(q));
    tempArray.forEach((_,i)=>{
        suggestedPets.push(tempArray[i]);
    })

    if (!suggestedPets.length || (suggestedPets[0][0] == chosenPet[0] && hideNextSuggestion)){
        hideNextSuggestion = false;
        return hideSuggestions();
    }
    renderSuggestions(q);
}

function renderSuggestions(q) {
    container.innerHTML = '';
    selectedIndex = -1;
    
    suggestedPets.forEach((pet, i) => {
        const div = document.createElement('div');
        div.className = 'suggestion';
        div.textContent = pet[0];
        div.addEventListener('mousedown', e => {
            e.preventDefault();
            applyItem(i);
        });
        container.appendChild(div);

        const aliasDiv = document.createElement('div');
        aliasDiv.className="suggestionAlias";

        const aliases = []
            .concat(pet[3] || [])         
            .filter(a => typeof a === 'string' && a.trim()); 

        const filteredAliases = aliases.filter(a => a.includes('q'));

        if (filteredAliases.length < aliases.length) {
            filteredAliases.push("...");
        }    

        aliasDiv.innerHTML = filteredAliases.length
            ? filteredAliases.join(', ')
            : 'no Alias';   

        div.appendChild(aliasDiv);
    });
    showSuggestions();
}

function showSuggestions() {
    container.style.display = 'block';
}

function hideSuggestions() {
    container.style.display = 'none';
    suggestedPets = [];
    selectedIndex = -1;
}

function onKeyDown(e) {
    const max = suggestedPets.length - 1;
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
    else if (e.key === ' ') {
        e.preventDefault();
        const q = input.value.trim();
        if (!q || q.length<=2) return hideSuggestions();
        fetchAndRenderSuggestions(q);
    }
}

function highlight() {
    Array.from(container.children).forEach((div, i) => {
        div.classList.toggle('active', i === selectedIndex);
    });
}

async function applyItem(i) {
    if (suggestedPets.length==0){
        const tempArray = await fetchNeonWithCache("n="+encodeURIComponent(input.value.trim()));
        tempArray.forEach((_,i)=>{
            suggestedPets.push(tempArray[i]);
        })
        hideNextSuggestion = suggestedPets[0]? true : false;
    }

    chosenPet = suggestedPets[i]? suggestedPets[i]: suggestedPets[0];

    outputSmallPetContainer(chosenPet);
    hideSuggestions();
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
    aliasContainer.style= ` display: inline;
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

function deleteChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function getPetImage(pet, wantAnimated){
    if( wantAnimated && pet[1] == 1){
        return `https://cdn.discordapp.com/emojis/${pet[2]}.gif?size=96`;
    }if (petTypeOrder[pet[4]]<=5 || petTypeOrder[pet[4]]==11){
        return `../media/owo_images/${pet[0]}.png`;
    }else{
        return `https://cdn.discordapp.com/emojis/${pet[2]}.png?size=96`;
    }
}