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

    outputPetContainer();
});

let showPets = true;


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

const petTypeImages= {
    "common":   "../media/owo_images/common.png",
    "uncommon": "../media/owo_images/uncommon.png",
    "rare":     "../media/owo_images/rare.png",
    "epic":     "../media/owo_images/epic.png",
    "mythical": "../media/owo_images/mythic.png",
    "legendary":"../media/owo_images/legendary.gif",
    "gem":      "../media/owo_images/gem.gif",
    "bot":      "../media/owo_images/bot.gif",
    "distorted":"../media/owo_images/distorted.gif",
    "fabled":   "../media/owo_images/fabled.gif",
    "hidden:":  "../media/owo_images/hidden.gif",
    "special":  "../media/owo_images/special.png",
    "patreon":  "../media/owo_images/patreon.png",
    "cpatreon": "../media/owo_images/patreon.gif"
}

let petArray = [
    // NAME,ANIMATED, ID, ALIAS, TYPE
    /*
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    ["250kpeacock",1, "666875798590062592", ["250k", "250"],  "special"],
    ["toycat",     0, "653141221249908746", [],               "cpatreon"],
    ["Devlin",     0, "844131789147996210", [ "zk", "yumak" ],"cpatreon"],
    ["espe",       1, "719733304290705462", [],               "cpatreon"],
    */
    //TODO: remove all of these comments when I'm done testing
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
    deleteChildren(petContainer);

    if (showPets){
        let containerToApply = createColumn(petContainer);
        petArray.forEach((_,i)=>{
            displayPet(containerToApply, petArray[i]);
            if ((i+1) % 40 == 0){
                containerToApply = createColumn(petContainer);
            }
        });
    }else{
        let containerToApply = document.createElement("input");
        containerToApply.className="calculatorInput";
        containerToApply.style.width="11.6rem";
        containerToApply.style.textAlign="start";
        petContainer.appendChild(containerToApply);
        containerToApply.focus();
    }    
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

function fetchNeon(petString){
    const order = [0, 2, 4, 1, 3, 5];
    let fetchURL = neonURL;
    fetchURL += ( petString? 
                    `q=${petString}`
                    : `s=${order.map(i => stats[i]).join('.')}`
                );

    return fetch( fetchURL) 
    .then(response => {
        return response.json();
    })
}

function throttle(fn, delay) {
  let last = 0,
      timer = null;

  return function throttled(...args) {
    const now       = Date.now();
    const remaining = delay - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      last  = now;
      return fn.apply(this, args);
    }
    if (!timer) {
      return new Promise(resolve => {
        timer = setTimeout(() => {
          last  = Date.now();
          timer = null;
          resolve(fn.apply(this, args));
        }, remaining);
      });
    }
  };
}

const fetchNeonThrottled = throttle(fetchNeon, 500);

function lookForMatchingPets(){
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
async function updateStats(){
    inputs.forEach((input,i) => {
        stats[i]=input?.value;
    });
    updateStatSpan();
    updateInternalStats();
    updatePetArray();
}

async function updatePetArray(){

    tempArray = await fetchNeonThrottled();
    petArray = Array.isArray(tempArray) ? tempArray:petArray;
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

function displayPet(element, pet){
    const displayElement = document.createElement("div");
    displayElement.style.display = "flex";
    displayElement.style.alignItems="center";

    const imageElement = document.createElement("img");
    imageElement.src=petTypeImages[pet[4]];
    imageElement.style ="weight:1rem; height:1rem;";

    const codeWrapper = document.createElement("div");
    codeWrapper.className="tooltip";

    const codeElement = document.createElement("code");
    codeElement.textContent=pet[0];
    codeElement.className ="discord-code";
    codeElement.style.fontSize="0.7rem";

    const tooltip = document.createElement("span");
    tooltip.innerHTML = pet[3].length == 0 ? "no Alias" : pet[3].join(", ");
    tooltip.className="tooltip-text";
    tooltip.style.zIndex = '100';
    tooltip.style.transform='unset';
    tooltip.style.width='max-content';
    tooltip.style.padding='0.15rem';
    tooltip.style.pointerEvents ='none';
    tooltip.style.border ="2.5px solid #191919";
    tooltip.style.fontSize="0.7rem";
    tooltip.style.borderRadius="0.2rem";
    tooltip.style.bottom="-9%";
    tooltip.style.left="105%";

    displayElement.appendChild(imageElement);
    codeWrapper.appendChild(codeElement);
    codeWrapper.appendChild(tooltip);
    displayElement.appendChild(codeWrapper);
    element.append(displayElement);
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

    fetchNeonThrottled("wainie")
        .then(data => console.log(data))
        .catch(err  => console.error(err));

});



function initFields(){
    updateStats();
    updateLevelFromNumber();
}