function showTimestamps() {
    const now = new Date();
    let formattedTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    document.getElementById("timestamp1").textContent = formattedTime;
    document.getElementById("timestamp2").textContent = formattedTime;
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
        console.log(response);
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

    const data = await fetchNeonThrottled();
    console.log(data);    
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
});