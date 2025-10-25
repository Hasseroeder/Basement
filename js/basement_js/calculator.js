import { loadJson } from "./util/jsonUtil.js";
import { make } from "./util/injectionUtil.js"

const timestamps =document.querySelectorAll("#timestamp");

const petContainer = document.getElementById("petContainer");
const effectContainer = document.getElementById("effectContainer");

const petButton = document.getElementById("petButton");

const statSpan =document.getElementById("statSpan");

const inputLvl = document.getElementById("inputLvl");
const levelWrapper = document.getElementById("levelWrapper");
const sliderLvl = document.getElementById("sliderLvl");
const inputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`input${i + 1}`));
const outputs = Array.from({ length: 10 }, (_, i) => document.getElementById(`output${i + 1}`));

const neonCache = new Map();
let currentQuery = '';

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
const petTiers= {
    "common":   " -----—— Common ——------ ",
    "uncommon": " -----—— Uncommon —----- ",
    "rare":     " -----—— Rare ———------- ",
    "epic":     " -----—— Epic ———------- ",
    "mythical": " -----—— Mythic ——------ ",
    "legendary":" -----—— Legendary —---- ",
    "gem":      " -----—— Gem ———-------- ",
    "bot":      " -----—— Bot ———-------- ",
    "distorted":" -----—— Distorted —---- ",
    "fabled":   " -----—— Fabled ——------ ",
    "hidden":   " -----—— Hidden ——------ ",
    "special":  " -----—— Special ——----- ",
    "patreon":  " -----—— Patreon ——----- ",
    "cpatreon": " -----—— Custom ——------ "
};
let petArray = [/*[NAME,ANIMATED,EMOJI,ALIAS,TYPE],*/];

//for Mode: searching pets
let suggestedPets  = [];    
let chosenPet      = [];
let selectedIndex  = -1;    
let debounceTimer;

const neonURL = "https://neonutil.com/zoo-stats?";

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

let effects = [
    // {"id":"0", "type":3, "quality":100}
    // {"id":"1", "type":2, "quality":60}
]

const effectMin = [0.05, 0.05, 0.15, 0.10, 0.05, 0.15, 0.05 ]
const effectMax = [0.20, 0.20, 0.35, 0.30, 0.20, 0.35, 0.15 ]

let effectCounter = 0;

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
    const formattedTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    timestamps.forEach(el => el.textContent = formattedTime);
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
        petContainer.innerHTML="";
        outputPetContainerMATCHING();
    }else if (!document.getElementById("textInput")){
        petContainer.innerHTML="";
        outputPetContainerSEARCH();
    }    
}

function outputPetContainerMATCHING(){
    columns=[createColumn()];
    page=0;
    let headersCreated = 0;
    petArray.forEach((_,i)=>{
        if (!petArray[i-1] || petArray[i][4]!=petArray[i-1][4]){
            headersCreated++;
            columns.at(-1).append(createHeader(petArray[i]));
        }
        if ((i+headersCreated) % 20 == 0){
            columns.push(createColumn());
        }
        columns.at(-1).append(displayPet(petArray[i]));
    });

    petContainer.append(
        make("div",{style:{display:"flex"}}),
        make("div",{style:{display:"flex"}},[   
            make("button",{
                textContent:"<", tabIndex:"9", className:"petButtonFromCalculator",
                onclick:()=>swapPages(page-1)
            }),
            make("button",{
                textContent:">", tabIndex:"10", className:"petButtonFromCalculator",
                onclick:()=>swapPages(page+1)
            })
        ]),
    );

    function swapPages(newPage){
        page = Math.min(Math.max(newPage,0),columns.length/2-1);
        displayColumns();
    }
    displayColumns();
}

function outputPetContainerSEARCH(){
    const textInput = make("input",{
        id:"textInput", tabIndex:"9", className:"discord-code-lite", style:"width:11.6rem; text-align:unset;", autocomplete:"off",
        placeholder:"type pet here..."
    });

    const suggestionWrapper = make("div",{
        className:"suggestions",
        id : "suggestions"
    });

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
        suggestions.style.display = 'none';
    });

    petContainer.append(textInput,suggestionWrapper);
    if (chosenPet && chosenPet[0]) outputSmallPetContainer(chosenPet);
    textInput.focus();
}

const displayColumns = () =>
  petContainer.firstChild.replaceChildren(...columns.slice(page * 2, page * 2 + 2));

function onInput(textInput,suggestions) {
    const q = textInput.value.trim();
    clearTimeout(debounceTimer);
    
    if (!q || q.length<=2){
        debounceTimer = setTimeout(()=>suggestions.style.display = 'none', 200);
    }else {
        debounceTimer = setTimeout(()=>fetchAndRenderSuggestions(q,textInput,suggestions), 200);
    }
}

function onInputNoDebounce(textInput,suggestions){
    const q = textInput.value.trim();
    if (!q || q.length<=2) return suggestions.style.display = 'none';
    fetchAndRenderSuggestions(q,textInput,suggestions);
}

async function fetchAndRenderSuggestions(query, textInput,suggestions){
    suggestedPets = await fetchNeonWithRace("n="+encodeURIComponent(query));
    if (!suggestedPets.length || (suggestedPets[0][0] == chosenPet?.[0])){
        return suggestions.style.display = 'none';
    }
    renderSuggestions(query,textInput,suggestions);
}


function renderSuggestions(query,textInput,suggestions) {
    suggestions.innerHTML = '';
    suggestions.style.display = 'block';
    selectedIndex = -1;

    suggestedPets.forEach((pet, i) => {
        const aliases = pet[3]
            .filter(a => a.includes(query));

        suggestions.appendChild(
            make("div",{
                className: 'suggestion',
                textContent: pet[0],
                onmousedown:(e)=> {
                    e.preventDefault();
                    selectedIndex=i;
                    applyItem(textInput,suggestions);
                }
            },[
                make("div",{
                    className:"suggestionAlias",
                    innerHTML:aliases.join(', ')
                })
            ]
        ));
    });
}

function outputSmallPetContainer(pet){
    document.getElementById("petOutput")?.remove();
    
    const children = [
        make("img",{
            src:getPetImage(pet,true),
            style:{width:"3rem"}
        }), 
        make("div",{
            innerHTML:pet[0],
            className:"discord-code-lite",
            style: "width: max-content; text-align:unset; font-weight:bold;"
        }), 
        pet[3] && pet[3][0] && make("div",{
            innerHTML:"Aliases: " + pet[3].join(", "),
            className:"discord-code-lite",
            style: "display: inline; text-align:unset; font-size:0.75rem"
        })
    ].filter(Boolean)

    petContainer.append(
        make("div",{
            className:"pet-output-wrapper",
            id: "petOutput"
        },children)
    );
}

function onKeyDown(e,textInput,suggestions) {
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
        const tempArray = await fetchNeonWithRace("n="+encodeURIComponent(textInput.value.trim()));
        tempArray.forEach((_,i)=>{
            suggestedPets.push(tempArray[i]);
        })
    }
    chosenPet = suggestedPets[selectedIndex]? suggestedPets[selectedIndex]: suggestedPets[0];
    if (!chosenPet || !chosenPet[0]) return;
    petToStats(chosenPet)
    outputSmallPetContainer(chosenPet);
    suggestions.style.display = 'none'
}

function highlight(suggestions) {
    Array.from(suggestions.children).forEach((div, i) => {
        div.classList.toggle('active', i === selectedIndex);
    });
}

function updateStatSpan(){
    statAmount = stats.reduce((sum, plus) => sum + Number(plus), 0);
    statSpan.textContent= statAmount + " stats";
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

const fetchNeonThrottled = throttle(loadJson, 500);

function fetchNeonWithCache(query) {
    if (neonCache.has(query)) {
        return Promise.resolve(neonCache.get(query));
    }

    return fetchNeonThrottled(neonURL + query)
        .then(data => {
            neonCache.set(query, data);
            return data;
    });
}

function fetchNeonWithRace(query) {
    query = query.toLowerCase();
    currentQuery = query;

    return fetchNeonWithCache(query).then(data => {
        if (query === currentQuery) {
            return data;
        }else{
            return Promise.reject(new Error("Outdated query"));
        }
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
    const extraStats= [0,0,0,0,0,0];

    effects.forEach(effect=>{
        let stat = statOrder[effect.type];
        let boost = getBoost(effect.type, effect.quality)

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

function getBoost(type, quality){
    let range = effectMax[type]-effectMin[type];
    let boost = effectMin[type] + (range*quality/100);
    return boost;
}

function updateOutsideStats(){
    outsideStats.forEach((_,i)=>{
        if ( i<=3 ){
            outsideStats[i]=internalStats[i]; // hp, str, wp, mag
        }else if (i<=5){
            outsideStats[i]=  0.8*internalStats[i] / (100+internalStats[i]); // pr mr
        }else if (i<=7){
            outsideStats[i]=   internalStats[0] / (1-outsideStats[i-2]); // ehps
        }else {
            outsideStats[i]=internalStats[i-4]; //ipr imr
        }
    })
    updateOutputs();
}

function updateOutputs(){
    outputs.forEach((output,i )=>{    
        output.textContent=(i==4 || i==5)?
            (outsideStats[i]*100).toFixed(1)+"%":
            Math.round(outsideStats[i]);
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

    const tempArray = await fetchNeonWithRace(query);
    petArray = Array.isArray(tempArray) ? tempArray:[];
    sortPetArray();
}

function updateLevelFromNumber(){
    sliderLvl.value=inputLvl.value;
    updateInternalStats();
}

function updateLevelFromSlider(){
    inputLvl.value=sliderLvl.value;
    updateInternalStats();
}
//end of event listener functions

function displayPet(pet){
    const children = [
        make("img",{
            src: getPetImage(pet),
            className:"one-rem"
        }),
        make("code",{
            textContent:pet[0],
            className:"discord-code",
            style:"font-size: 0.7rem; line-height:unset;"
        }),
        make("span",{
            innerHTML: pet[3].length? pet[3].join(', '): 'no Alias',
            className:"pet-tooltip-text"
        })
    ];

    return make("div",{
        style:"display:flex; align-items:center; height:1.25rem;"
    },[
        make("div",
            {className:"tooltip",style:"display:flex; align-items:center; gap:0.1rem;"},
            children
        )
    ])
}

function createHeader(pet){
    return make("div",
        {style:{width:"10.8rem"}},
        [make("div",{ textContent: petTiers[pet[4]], className:"pet-type-header"})]
    )
}


function getPetImage(pet, wantAnimated){
    if( wantAnimated && pet[1] == 1){
        return `https://cdn.discordapp.com/emojis/${pet[2]}.gif?size=96`;
    }if (petTypeOrder[pet[4]]<=5 || petTypeOrder[pet[4]]==11){
        return `../media/owo_images/${pet[0]}.png`;
    }
    return `https://cdn.discordapp.com/emojis/${pet[2]}.png?size=96`;
}

function createColumn(){
    return make("div",{
        style:{
            display: "flex",
            width:"12rem",
            flexDirection: "column"
        }
    });
}

function addAddEffects(){
    const effectIcons=["f_hp","f_str","f_pr","f_wp","f_mag","f_mr","f_rune"]
    
    const wrapper = document.createElement("div");
    wrapper.classList.add("tooltip");
    wrapper.classList.add("passiveWrapperFromCalculator");

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
    const effect = {"id": effectCounter++, "type": type, "quality": 100};
    effects.push(effect);
    const index = effects.indexOf(effect);

    const outerWrapper = document.createElement("div");
    outerWrapper.className="passiveWrapperFromCalculator";

    const wrapper = document.createElement("div");
    wrapper.style="display: flex; align-items: center;position:relative; width: 100%;";

    const numberWrapper = document.createElement("div");
    numberWrapper.className="grayOnHover number-wrapper-pet-calculator";

    const listeningWrapper = document.createElement("div");
    listeningWrapper.className="listening-wrapper";

    const imgWrapper = document.createElement("div");
    imgWrapper.style = "align-items: center; display: flex; flex-direction: column; margin-top: 0.15rem; min-width: 28px;";

    const img = document.createElement("img");
    img.src=`../media/owo_images/${getImageForEffect(effects[index])}.png`;
    img.style="height:1.5rem; display:block;";

    const belowImg = document.createElement("div");
    belowImg.style ="font-size:0.5rem;"
    updateBoostDisplay(belowImg, effect);

    const number = document.createElement("input");
    number.type="number";
    number.className="passive-number-input no-arrows";
    number.min=0;
    number.max=100;
    number.value=100;

    const text = document.createElement("div");
    text.textContent="%"
    text.className="percent-span";
    
    const slider = document.createElement("input");
    slider.type="range";
    slider.min=0;
    slider.max=100;
    slider.value=100;

    slider.addEventListener('input', e => {
        effect.quality=Number(slider.value);
        number.value = slider.value
        img.src=`../media/owo_images/${getImageForEffect(effect)}.png`;
        updateBoostDisplay(belowImg, effect);
        updateInternalStats();
    });

    number.addEventListener('input', e => {
        effect.quality=Number(number.value);
        slider.value = number.value
        img.src=`../media/owo_images/${getImageForEffect(effect)}.png`;
        updateBoostDisplay(belowImg, effect);
        updateInternalStats();
    });

    const button = document.createElement("button");
    button.className="exitButtonFromCalculator";
    button.textContent="X";

    button.addEventListener('click', event => {
        effects = effects.filter(e => e.id !== effect.id);
        outerWrapper.remove(wrapper);
        updateInternalStats();
    });

    listeningWrapper.addEventListener("click", () => number.focus());

    imgWrapper.append(img, belowImg);
    numberWrapper.append(number,text);
    listeningWrapper.append(numberWrapper)
    wrapper.append(imgWrapper,listeningWrapper,slider,button);
    outerWrapper.append(wrapper);
    effectContainer.insertBefore(outerWrapper, effectContainer.lastChild);

    updateInternalStats();
}

function updateBoostDisplay(display, effect){
    boost = parseFloat((100*getBoost(effect.type, effect.quality)).toFixed(1));
    display.textContent=`+${boost}%`;
}

function getImageForEffect(effect){
    return getPrefix(effect.quality) + imgTypeSuffix[effect.type];
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
        input.addEventListener("change",updateStats)
        input.addEventListener("wheel", ev => {
            ev.preventDefault();
            let newValue = Number(input.value) - Math.sign(ev.deltaY);
            input.value = Math.min(Math.max(newValue, input.min), input.max);
            updateStats();
        });
    });
    inputLvl.addEventListener("change", updateLevelFromNumber);
    inputLvl.addEventListener("wheel", ev => {
            ev.preventDefault();
            inputLvl.value -= Math.sign(ev.deltaY);
            updateLevelFromNumber();
    });
    levelWrapper.addEventListener("click", ()=>inputLvl.focus());
    sliderLvl.addEventListener("input", updateLevelFromSlider);

    inputs[0].focus();

    petButton.addEventListener("click", function (){
        showPets = !showPets;
        petButton.textContent= showPets? "Mode: Matching Pets" : "Mode: Search Pets";
        updatePetArray();
    });

    updateStats();
    updateLevelFromNumber();
    addAddEffects();

});