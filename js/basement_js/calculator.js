function showTimestamps() {
    const now = new Date();
    let formattedTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    document.getElementById("timestamp1").textContent = formattedTime;
    document.getElementById("timestamp2").textContent = formattedTime;
}

const petContainer = document.getElementById("petContainer");

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
    "common":   "..media/owo_images/common.png",
    "uncommon": "..media/owo_images/uncommon.png",
    "rare":     "..media/owo_images/rare.png",
    "epic":     "..media/owo_images/epic.png",
    "mythical": "..media/owo_images/mythic.png",
    "legendary":"..media/owo_images/legendary.gif",
    "gem":      "..media/owo_images/gem.gif",
    "bot":      "..media/owo_images/bot.gif",
    "distorted":"..media/owo_images/distorted.gif",
    "fabled":   "..media/owo_images/fabled.gif",
    "hidden:":  "..media/owo_images/hidden.gif",
    "special":  "..media/owo_images/special.png",
    "patreon":  "..media/owo_images/patreon.png",
    "cpatreon": "..media/owo_images/patreon.gif"
}

let petArray = [
    // NAME,ANIMATED, ID, ALIAS, TYPE

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
    outputPetArray();
}

function outputPetArray(){
    deleteChildren(petContainer);
    let containerToApply = createColumn(petContainer);
    petArray.forEach((_,i)=>{
        displayPet(containerToApply, petArray[i]);
        if ((i+1) % 35 == 0){
            containerToApply = createColumn(petContainer);
        }
    });
}


const neonURL = "https://neonutil.vercel.app/zoo-stats?s=";

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

function fetchNeon(){
    return fetch(  neonURL 
                    + stats[0] +"."
                    + stats[2] +"."
                    + stats[4] +"."
                    + stats[1] +"."
                    + stats[3] +"."
                    + stats[5]
    ) 
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

const fetchNeonThrottled = throttle(fetchNeon, 1000);

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
    updateInternalStats();

    tempArray = await fetchNeonThrottled();
    petArray = Array.isArray(tempArray) ? tempArray:petArray;
    sortPetArray();
    console.log(petArray);    
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

    const imgSrc = petTypeImages[pet[4]];
    displayElement.innerHTML= ` <img src=${imgSrc}>
                                <code    class="discord-code"
                                        style="font-size:0.8rem;"
                                >${pet[0]}</div>`;
    element.append(displayElement);
}

function createColumn(element){
    const column = document.createElement("div");
    column.style.display = "flex";
    column.style.width ="9rem";
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