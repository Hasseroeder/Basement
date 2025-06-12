const petContainer = document.getElementById("petContainer");
const effectContainer = document.getElementById("effectContainer");

const petButton = document.getElementById("petButton");

const statSpan =document.getElementById("statSpan");

const inputLvl = document.getElementById("inputLvl");
const sliderLvl = document.getElementById("sliderLvl");
const inputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`input${i + 1}`));
const outputs = Array.from({ length: 10 }, (_, i) => document.getElementById(`output${i + 1}`));

const neonCache = new Map();

//for Mode: matching pets
let showPets = true;
let page = 0;
let columns=[];
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
};
let petArray = [/*[NAME,ANIMATED,EMOJI,ALIAS,TYPE],*/];

//for Mode: searching pets
let suggestedPets  = [];    
let chosenPet      = [];
let selectedIndex  = -1;    
let debounceTimer;
let hideNextSuggestion = false;

const neonURL = "https://neonutil.vercel.app/zoo-stats?";

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

let statAmount = 0;

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

const effects = [
    // {"type":0, "quality":100}
    // {"type":1, "quality":60}
]
const imgQualityPrefix ={
    0:"c_",     //quality starting at 0
    20:"u_",    //quality starting at 20
    40:"r_",    //quality starting at ...
    60:"e_",
    80:"m_",
    94:"l_",
    99:"f_"
}

const imgTypeSuffix =[
    "hp",
    "str",
    "pr",
    "wp",
    "mag",
    "mr",
    "rune"
]  

function showTimestamps() {
    const now = new Date();
    let formattedTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    document.getElementById("timestamp1").textContent = formattedTime;
    document.getElementById("timestamp2").textContent = formattedTime;
}

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
        outputPetContainerMATCHING();
    }else if (!document.getElementById("textInput")){
        deleteChildren(petContainer);
        outputPetContainerSEARCH();
    }    
}

function outputPetContainerMATCHING(){
    let wrapper = document.createElement("div");
    wrapper.style.display="flex";
    petContainer.appendChild(wrapper);

    columns.length=0;
    page=0;
    columns.push(createColumn());        
    let headersCreated = 0;
    petArray.forEach((_,i)=>{
        if (!petArray[i-1] || petArray[i][4]!=petArray[i-1][4]){
            headersCreated++;
        }
        if ((i+headersCreated) % 20 == 0){
            columns.push(createColumn());
        }
        displayPet(columns.at(-1), petArray[i],petArray[i-1]);            
    });

    let buttonWrapper = document.createElement("div");
    buttonWrapper.style.display="flex";
    petContainer.appendChild(buttonWrapper);

    let minusButton = document.createElement("button");
    minusButton.textContent="<";
    minusButton.tabIndex="9";
    minusButton.className="petButtonFromCalculator";
    let plusButton = document.createElement("button");
    plusButton.textContent=">";
    plusButton.tabIndex="10";
    plusButton.className="petButtonFromCalculator";
    buttonWrapper.append(minusButton,plusButton);

    minusButton.addEventListener('click', ()=>{
        if (page > 0){page--;}
        displayColumns();
    });
    plusButton.addEventListener('click', ()=>{
        if (page < (columns.length/2)-1){page++;}
        displayColumns();
    });

    displayColumns();
}

function outputPetContainerSEARCH(){
    const textInput = document.createElement("input");
    textInput.id="textInput";
    textInput.tabIndex="9";
    textInput.autocomplete="off";
    textInput.className="discord-code-lite";
    textInput.style="width:11.6rem; text-align:unset;";
    textInput.placeholder="type pet here..."

    const suggestionWrapper = document.createElement("div");
    suggestionWrapper.className="suggestions";
    suggestionWrapper.id = "suggestions";


    textInput.addEventListener('input', () => {
        onInput(textInput,suggestionWrapper);
    });
    textInput.addEventListener('focus', () => {
        onInputNoDebounce(textInput,suggestionWrapper);
    });
    textInput.addEventListener('click', () => {
        onInputNoDebounce(textInput,suggestionWrapper);
    });
    textInput.addEventListener('keydown', (event) => {
        onKeyDown(event,textInput,suggestionWrapper);
    });
    textInput.addEventListener('blur', () => {
        hideSuggestions(suggestionWrapper);
    });

    petContainer.append(textInput,suggestionWrapper);
    outputSmallPetContainer(chosenPet);
    textInput.focus();
}


function displayColumns(){
    deleteChildren(petContainer.firstChild)
    if (columns[2*page])
    petContainer.firstChild.append(columns[2*page]);
    if (columns[1+2*page])
    petContainer.firstChild.append(columns[1+2*page]);
}

function onInput(textInput,suggestions) {
    const q = textInput.value.trim();
    clearTimeout(debounceTimer);
    
    if (!q || q.length<=2){
        debounceTimer = setTimeout(()=>hideSuggestions(suggestions), 200);
    }else {
        debounceTimer = setTimeout(()=>fetchAndRenderSuggestions(q,textInput,suggestions), 200);
    }
}

function onInputNoDebounce(textInput,suggestions){
    const q = textInput.value.trim();
    if (!q || q.length<=2) return hideSuggestions(suggestions);
    fetchAndRenderSuggestions(q,textInput,suggestions);
}

async function fetchAndRenderSuggestions(query, textInput,suggestions){
    suggestedPets.length = 0;
    const tempArray = await fetchNeonWithCache("n="+encodeURIComponent(query));
    tempArray.forEach((_,i)=>{
        suggestedPets.push(tempArray[i]);
    })
    if (!suggestedPets.length || (suggestedPets[0][0] == chosenPet?.[0] && hideNextSuggestion)){
        hideNextSuggestion = false;
        return hideSuggestions(suggestions);
    }
    renderSuggestions(query,textInput,suggestions);
}


function renderSuggestions(query,textInput,suggestions) {
    suggestions.innerHTML = '';
    selectedIndex = -1;
    
    suggestedPets.forEach((pet, i) => {
        const div = document.createElement('div');
        div.className = 'suggestion';
        div.textContent = pet[0];
        div.addEventListener('mousedown', e => {
            e.preventDefault();
            selectedIndex=i;
            applyItem(textInput,suggestions);
        });
        suggestions.appendChild(div);

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

function outputSmallPetContainer(pet){
    if (!pet || !pet[0]){
        return;
    }

    let wrapper = document.getElementById("petOutput");
    if (wrapper) {
        wrapper.remove();
    }
    
    wrapper = document.createElement("div");
    wrapper.className="pet-output-wrapper";
    wrapper.id = "petOutput";

    petContainer.append(wrapper);

    let imageContainer=document.createElement("img");
    imageContainer.src=  getPetImage(pet,true);
    imageContainer.style.width="3rem";                            

    let aliasContainer=document.createElement("div");
    aliasContainer.innerHTML="Aliases: " + pet[3].join(", ");
    aliasContainer.className="discord-code-lite";
    aliasContainer.style= ` display: inline;
                            text-align:unset;
                            font-size:0.75rem`;

    let nameContainer=document.createElement("div");
    nameContainer.innerHTML=pet[0];
    nameContainer.className="discord-code-lite";
    nameContainer.style= `  width: max-content;
                            text-align:unset;
                            font-weight:bold;`;

    wrapper.append(imageContainer, nameContainer);
    if (pet[3][0]){
        wrapper.append(aliasContainer);
    }
}

function onKeyDown(e,textInput,suggestions) {
    const max = suggestedPets.length - 1;
    console.log(e.key);
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
        applyItem(textInput,suggestions);
    }
    else if (e.key === 'Escape') {
        e.target.blur();
    }
    else if (e.key === ' ') {
        e.preventDefault();
        onInputNoDebounce(textInput, suggestions);
    }
}

async function applyItem(textInput,suggestions) {
    if (suggestedPets.length==0){
        const tempArray = await fetchNeonWithCache("n="+encodeURIComponent(textInput.value.trim()));
        tempArray.forEach((_,i)=>{
            suggestedPets.push(tempArray[i]);
        })
        hideNextSuggestion = !!suggestedPets[0];
    }
    chosenPet = suggestedPets[selectedIndex]? suggestedPets[selectedIndex]: suggestedPets[0];

    if (chosenPet) continueApplyingItem(suggestions);
}

function continueApplyingItem(suggestions){
    petToStats(chosenPet)
    outputSmallPetContainer(chosenPet);
    hideSuggestions(suggestions);
}

function highlight(suggestions) {
    Array.from(suggestions.children).forEach((div, i) => {
        div.classList.toggle('active', i === selectedIndex);
    });
}

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

    // buff types are this order: hp, str, pr,  wp,  mag, mr, rune
    // internal stats are this;   hp, wp,  str, mag, pr,  mr
    const statOrder = [0, 2, 4, 1, 3, 5];

                    // hp,   str,  pr,   wp,   mag,  mr,   rune
    const effectMin = [0.05, 0.05, 0.15, 0.10, 0.05, 0.15, 0.05 ]
    const effectMax = [0.20, 0.20, 0.35, 0.30, 0.20, 0.35, 0.15 ]
    const extraStats= [0,0,0,0,0,0];

    effects.forEach(effect=>{
        let stat = statOrder[effect.type];
        let range = effectMax[effect.type]-effectMin[effect.type];
        let boost = effectMin[effect.type] + (range*effect.quality/100);


        if (effect.type<6){
                extraStats[stat]+=internalStats[stat]*boost;
        }else{
            for (let i = 0; i < extraStats.length; i++) {
                extraStats[i] += internalStats[i] * boost;
            }
        }
    });

    extraStats.forEach((stat,i) => internalStats[i]+=stat);

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

function petToStats(pet){
    const order =[0, 3, 1, 4, 2, 5];
    inputs.forEach((input,i) => {
            input.value=pet[5][order[i]];
    });
    updateStats();
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
    imageElement.src= getPetImage(pet);           
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

function createColumn(){
    const column = document.createElement("div");
    column.style.display = "flex";
    column.style.width ="12rem";
    column.style.flexDirection = "column";

    return column;
}

function deleteChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function addAddEffects(){
    const effectIcons=["f_hp","f_str","f_pr","f_wp","f_mag","f_mr","f_rune"]
    
    const wrapper = document.createElement("div");
    wrapper.style="display: flex; align-items: center; height:2rem;";
    wrapper.className="tooltip pet-output-wrapper";

    const text = document.createElement("div");
    text.style="position:absolute;width:inherit; font-family: monospace;font-size: 0.8rem; text-align: center;";
    text.textContent="add effect";

    const imgContainer = document.createElement("div");
    imgContainer.style="display:flex; background-color: #303030; justify-content: center; align-items: center; width:100%; z-index: 100;"
    imgContainer.className="hidden";
    for (let i = 0; i<effectIcons.length; i++){
        const Img = document.createElement("img");
        Img.src=`../media/owo_images/${effectIcons[i]}.png`;
        Img.style="height:1.5rem;";
        if(i==6) Img.style.height="1.4rem"; 
        // rune image has to be made smaller simply cus it doesn't have transparent border 

        Img.addEventListener('click', e => {
            addEffect(i);
        });
        imgContainer.append(Img);
    }
    wrapper.append(text,imgContainer);
    effectContainer.append(wrapper);
}

function addEffect(type){
    const effect = {"type": type, "quality": 100};
    effects.push(effect);
    const index = effects.indexOf(effect);


    const outerWrapper = document.createElement("div");
    outerWrapper.className="pet-output-wrapper";
    outerWrapper.style="display: flex; align-items: center; height:2rem";

    const wrapper = document.createElement("div");
    wrapper.style="display: flex; align-items: center;position:relative;";

    const Img = document.createElement("img");
    Img.src=`../media/owo_images/${getImageForEffect(effects[index])}.png`;
    Img.style="height:1.5rem; display:block;";
    
    const slider = document.createElement("input");
    slider.type="range";
    slider.min=0;
    slider.max=100;
    slider.value=100;

    slider.addEventListener('input', e => {
        if (index !== -1) {
            effects[index].quality=Number(slider.value);
        }
        Img.src=`../media/owo_images/${getImageForEffect(effects[index])}.png`;
        updateInternalStats();
    });


    const button = document.createElement("button");
    button.className="exitButtonFromCalculator";
    button.textContent="X";

    button.addEventListener('click', e => {
        if (index !== -1) {
            effects.splice(index, 1);
        }
        outerWrapper.remove(wrapper);
        updateInternalStats();

    });


    wrapper.append(Img, slider,button);
    outerWrapper.append(wrapper);
    effectContainer.insertBefore(outerWrapper, effectContainer.lastChild);

    updateInternalStats();
}

function getImageForEffect(effect){
    myString = getPrefix(effect.quality) + imgTypeSuffix[effect.type]; 
    return myString;
}

function getPrefix(quality) {
    const qualities = Object.keys(imgQualityPrefix).map(Number).sort((a, b) => a - b);
    let chosenQuality = qualities[0];

    for (let q of qualities) {
        if (quality > q) {
            chosenQuality = q;
        } else {
            break;
        }
    }
    return imgQualityPrefix[chosenQuality];
}

document.addEventListener("DOMContentLoaded", () => {

    showTimestamps();
    inputs.forEach(input=>{
        input.addEventListener("change", function(){    
            //if (event.isTrusted) {
            //}
            updateStats();
            console.log("we're triggering an update stats!")
            // will see if I don't need this if
        })
        input.onmousewheel = ev => {
            input.preventDefault();
            input.value -= Math.sign(ev.deltaY);
            updateStats();
            console.log("we're triggering an update stats!")
        }
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

    petButton.addEventListener("click", function (){
        showPets = !showPets;
        petButton.textContent= showPets? "Mode: Matching Pets" : "Mode: Search Pets";
        updatePetArray();
    });

    initFields();
    addAddEffects();

});

function initFields(){
    updateStats();
    updateLevelFromNumber();
}