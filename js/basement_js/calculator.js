function showTimestamps() {
    const now = new Date();
    let formattedTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    document.getElementById("timestamp1").textContent = formattedTime;
    document.getElementById("timestamp2").textContent = formattedTime;
}

const petContainer = document.getElementById("petContainer");

const petButton = document.getElementById("petButton");

petButton.addEventListener("click", function (){

    showPets = !showPets;
    petButton.textContent= showPets? "Mode: Matching Pets" : "Mode: Search Pets";

    updatePetArray();
});

const neonCache = new Map();

//for Mode: matching pets
let showPets = true;

//for Mode: searching pets
let suggestedPets  = [];    
let chosenPet      = [];
let selectedIndex  = -1;    
let debounceTimer;
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
    "hidden":  11,
    "special":  12,
    "patreon":  13,
    "cpatreon": 14
};

const petTypeNames= {
    "common":   "—— Common ——",
    "uncommon": "— Uncommon —",
    "rare":     "——— Rare ———",
    "epic":     "——— Epic ———",
    "mythical": "—— Mythic ——",
    "legendary":"— Legendary —",
    "gem":      "——— Gem ———",
    "bot":      "——— Bot ———",
    "distorted":"— Distorted —",
    "fabled":   "—— Fabled ——",
    "hidden":   "—— Hidden ——",
    "special":  "—— Special ——",
    "patreon":  "—— Patreon ——",
    "cpatreon": "—— Custom ——"
}

let petArray = [
    // NAME,ANIMATED, EMOJI, ALIAS, TYPE
];

function sortPetArray(){
    petArray.sort((petA, petB) => {
        const orderA = petTypeOrder[petA[4]] = petTypeOrder[petA[4]];
        const orderB = petTypeOrder[petB[4]] = petTypeOrder[petB[4]];

        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return petA[0].localeCompare(petB[0]);  
    });
    outputPetContainer();
}

function outputPetContainer(){
    if (showPets){
        deleteChildren(petContainer);
        let wrapper = document.createElement("div");
        wrapper.style.display="flex";
        petContainer.appendChild(wrapper);

        let myColumn = createColumn(wrapper);
        let headersCreated = 0;
        petArray.forEach((_,i)=>{
            if (!petArray[i-1] || petArray[i][4]!=petArray[i-1][4]){
                headersCreated++;
            }
            if ((i+headersCreated) % 40 == 0){
                myColumn = createColumn(wrapper);
            }
            displayPet(myColumn, petArray[i],petArray[i-1]);            
        });
    }else if (!document.getElementById("textInput")){
        deleteChildren(petContainer);
        const textInput = document.createElement("input");
        textInput.id="textInput";
        textInput.autocomplete="off";
        textInput.className="discord-code-lite";
        textInput.style="width:11.6rem; text-align:unset;";

        const suggestionWrapper = document.createElement("div");
        suggestionWrapper.className="suggestions";
        suggestionWrapper.id = "suggestions";

        const outputWrapper = document.createElement("div");
        outputWrapper.className="pet-output-wrapper";
        outputWrapper.id = "petOutput";

        textInput.addEventListener('input', () => {
             onInput(textInput,suggestionWrapper);
        });
        textInput.addEventListener('focus', () => {
            onInputNoDebounce(textInput,suggestionWrapper);
        });
        textInput.addEventListener('click', () => {
            onInputNoDebounce(textInput,suggestionWrapper);
        });
        textInput.addEventListener('keydown', () => {
            onKeyDown(textInput,suggestionWrapper,outputWrapper);
        });
        textInput.addEventListener('blur', () => {
            hideSuggestions(suggestionWrapper);
        });

        petContainer.append(textInput,suggestionWrapper,outputWrapper);
        textInput.focus();
    }    
}

function onInput(textInput,suggestions) {
    console.log("you've inputted a letter!")
    const q = textInput.value.trim();
    if (!q || q.length<=2) return hideSuggestions(suggestions);
    console.log("we're past input verification!")
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(()=>fetchAndRenderSuggestions(q,suggestions), 200);
}

function onInputNoDebounce(textInput,suggestions){
    const q = textInput.value.trim();
    if (!q || q.length<=2) return hideSuggestions(suggestions);
    fetchAndRenderSuggestions(q,suggestions);
}

async function fetchAndRenderSuggestions(query, suggestions){
    
    console.log("we're trying to fetch suggestions now!")
    suggestedPets.length = 0;
    const tempArray = await fetchNeonWithCache("n="+encodeURIComponent(query));
    tempArray.forEach((_,i)=>{
        suggestedPets.push(tempArray[i]);
    })

    console.log("these are the suggested pets: "+ suggestedPets);
    if (!suggestedPets.length || (suggestedPets[0][0] == chosenPet?.[0] && hideNextSuggestion)){
        hideNextSuggestion = false;
        return hideSuggestions(suggestions);
    }
    renderSuggestions(query,suggestions);
}


function renderSuggestions(query,suggestions) {
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

        let aliases = (pet[3] || [])
            .filter(a => typeof a === 'string' && a.trim())
            .filter(a => a.includes(query))
            .map(a => `"${a}"`);

        aliasDiv.innerHTML = aliases.length
            ? aliases.join(', ')
            : '';   

        div.appendChild(aliasDiv);
    });
    showSuggestions(suggestions);
}

function showSuggestions(suggestions) {
    suggestions.style.display = 'block';
}

function hideSuggestions(suggestions) {
    suggestions.style.display = 'none';
    suggestedPets = [];
    selectedIndex = -1;
}

function outputSmallPetContainer(wrapper, pet){
    deleteChildren(wrapper);

    let imageContainer=document.createElement("img");
    imageContainer.src=pet?  getPetImage(pet,true):
                                `../media/owo_images/questionmark.jpg`;
    imageContainer.style.width="3rem";                            

    let aliasContainer=document.createElement("div");
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

    wrapper.append(imageContainer, nameContainer);
    if (pet && pet[3][0]){
        aliasContainer.innerHTML="Aliases: " + pet[3].join(", ");
        wrapper.append(aliasContainer);
    }
}

function onKeyDown(e,textInput,suggestions,petWrapper) {
    const max = suggestedPets.length - 1;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex < max ? selectedIndex + 1 : 0);
        highlight(suggestions);
    }
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex > 0 ? selectedIndex - 1 : max);
        highlight(suggestions);
    }
    else if (e.key === 'Enter') {
        e.preventDefault();
        applyItem(selectedIndex,textInput,suggestions,petWrapper);
    }
    else if (e.key === 'Escape') {
        e.target.blur();
    }
    else if (e.key === ' ') {
        e.preventDefault();
        onInputNoDebounce(textInput, suggestions);
    }
}

async function applyItem(i,textInput,suggestions,petWrapper) {
    if (suggestedPets.length==0){
        const tempArray = await fetchNeonWithCache("n="+encodeURIComponent(textInput.value.trim()));
        tempArray.forEach((_,i)=>{
            suggestedPets.push(tempArray[i]);
        })
        hideNextSuggestion = !!suggestedPets[0];
    }

    chosenPet = suggestedPets[i]? suggestedPets[i]: suggestedPets[0];

    outputSmallPetContainer(petWrapper,chosenPet);
    hideSuggestions(suggestions);
}

function highlight(suggestions) {
    Array.from(suggestions.children).forEach((div, i) => {
        div.classList.toggle('active', i === selectedIndex);
    });
}



const neonURL = "https://neonutil.vercel.app/zoo-stats?";

const inputLvl = document.getElementById("inputLvl");
const sliderLvl = document.getElementById("sliderLvl");
const inputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`input${i + 1}`));
const outputs = Array.from({ length: 10 }, (_, i) => document.getElementById(`output${i + 1}`));

let level = 0;

const stats = [
    0, //hp
    0, //wp
    0, //str
    0, //mag
    0, //pr
    0  //mr
    // order is differently here from otherwise, because team stat display is rotated 
    // I'm using team stat display as reference here, instead of pet stat display
]

const internalStats = [
    0, //hp
    0, //wp
    0, //str
    0, //mag
    0, //iPr
    0  //iMr
]

const outsideStats = [
    0, //hp i=0
    0, //wp i=1
    0, //str i=2
    0, //mag i=3
    0, //pr i=4
    0, //mr i=5
    0, //(pr)ehp i=6
    0, //(mr)ehp i=7
    0, //iPR i=8
    0  //iMR i=9
]

// for outputs 1-4 & 9-10, use a multiplier and base stat amount
// for outputs 5-6, use 9-10
// for outputs 7-8, use 1+Res

const statSpan =document.getElementById("statSpan");

let statAmount = 0;

function updateStatSpan(){
    statAmount = stats.reduce((sum, plus) => sum + Number(plus), 0);
    statSpan.textContent=`${statAmount} stats`;
}

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

function updateInternalStats(){
    const base =[500,500,100,100,25,25]
    const multi =[2,2,1,1,2,2]

    for (let i = 0; i < internalStats.length; i++) {
        internalStats[i] = base[i] + multi[i] * stats[i] * level;
    }

    updateOutsideStats();
}

function updateOutsideStats(){
    outsideStats.forEach((_,i)=>{
        if ( i<=3 ){
            outsideStats[i]=internalStats[i];
        }else if (i<=5){
            outsideStats[i]=  0.8*internalStats[i]
                / (100+internalStats[i]);
        }else if (i<=7){
            outsideStats[i]=   internalStats[0]
                / (1-outsideStats[i-2]);
        }else {
            outsideStats[i]=internalStats[i-4];
        }
    })
    updateOutputs();
}

function updateOutputs(){
    outputs.forEach((output,i )=>{    
        let temp;
        if (i==4 || i ==5){
            temp= ((outsideStats[i]*100).toFixed(1)).toLocaleString()+"%"; 
        }else{
            temp= Math.round(outsideStats[i]).toLocaleString();
        }  
        output.textContent=temp;       
    });
}

//start of event listener functions
function updateStats(){
    inputs.forEach((input,i) => {
        stats[i]=input?.value;
    });
    updateStatSpan();
    updateInternalStats();
    updatePetArray();
}

async function updateStatsFromPet(wrapper,query){
    if (query){
        pet =await fetchNeonWithCache("q="+query);
        pet = pet[0];
        outputSmallPetContainer(wrapper,pet);
        
        if (pet) {petToStats(pet)}

        updateStatSpan();
        updateInternalStats();
    }
}

function petToStats(pet){
    const order =[0, 3, 1, 4, 2, 5];
    inputs.forEach((input,i) => {
            input.value=pet[5][order[i]];
            stats[i]=input?.value;
    });

}

async function updatePetArray(){
    const statOrder = [0, 2, 4, 1, 3, 5];
    const query=`s=${statOrder.map(i => stats[i]).join('.')}`;

    tempArray = await fetchNeonWithCache(query);
    petArray = Array.isArray(tempArray) ? tempArray:[];
    sortPetArray();
}

function updateLevelFromNumber(){

    level = inputLvl.value;
    sliderLvl.value=level;
    updateInternalStats();
}

function updateLevelFromSlider(){
    level = sliderLvl.value;
    inputLvl.value=level;
    updateInternalStats();
}
//end of event listener functions

function displayPet(element, pet, prevPet){

    if (!prevPet || pet[4]!=prevPet[4]){
        element.appendChild(createHeader(pet));
    }

    const wrapper = document.createElement("div");
    wrapper.style = "display:flex; align-items:center; height:1.25rem;"

    const codeWrapper = document.createElement("div");
    codeWrapper.className="tooltip";
    codeWrapper.style="display:flex; align-items:center; gap:0.1rem;";

    const imageElement = document.createElement("img");
    imageElement.src= getPetImage(pet);           // TODO: decide whether to keep animated=true
    imageElement.style ="weight:1rem; height:1rem;";

    const codeElement = document.createElement("code");
    codeElement.textContent=pet[0];
    codeElement.className ="discord-code";
    codeElement.style="font-size: 0.7rem; line-height:unset;";

    const tooltip = document.createElement("span");

    const aliases =(pet[3] || [])         
        .filter(a => typeof a === 'string' && a.trim()); 
    tooltip.innerHTML = aliases.length
        ? aliases.join(', ')
        : 'no Alias';
    tooltip.className="pet-tooltip-text";

    codeWrapper.append(imageElement,codeElement,tooltip);
    wrapper.appendChild(codeWrapper);
    element.append(wrapper);
}

function createHeader(pet){
    const wrapper = document.createElement("div");
    const headerElement = document.createElement("div");
    
    wrapper.style.width="10.8rem";

    headerElement.textContent   = ` ------${petTypeNames[pet[4]]}------ `;
    headerElement.className="pet-type-header";
    wrapper.appendChild(headerElement);
    return wrapper;
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

function createColumn(element){
    const column = document.createElement("div");
    column.style.display = "flex";
    column.style.width ="12rem";
    column.style.flexDirection = "column";

    element.append(column);
    return column;
}

function deleteChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

document.addEventListener("DOMContentLoaded", () => {

    showTimestamps();
    inputs.forEach((input,i)=>{
        input.addEventListener("change", function(){    
            if (event.isTrusted) {
                updateStats();
            }
        })
    });
    inputLvl.addEventListener("change", function(){
        if (event.isTrusted) {
            updateLevelFromNumber();
        }
    });
    sliderLvl.addEventListener("input", function(){
        if (event.isTrusted) {
            updateLevelFromSlider();
        }
    });
    inputs[0].focus();

    initFields();
});

function initFields(){
    updateStats();
    updateLevelFromNumber();
}