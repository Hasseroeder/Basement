import * as cookie from "../basement_js/util/cookieUtil.js";

const maxValues = {
    0: 215,
    1: 235,
    2: 5,
    3: 200,
    4: 200,
    5: 999
};

const headers =[
    document.getElementById("efficiencyHeader"),
    document.getElementById("durationHeader"),
    document.getElementById("costHeader"),
    document.getElementById("gainHeader"),
    document.getElementById("expHeader"),
    document.getElementById("radarHeader")
]

const table2={
    rows:[
        document.getElementById("efficiencyRow"),
        document.getElementById("gainRow"),
        document.getElementById("radarRow")
    ],
    cost: [
        document.getElementById("efficiencyCost"),
        document.getElementById("gainCost"),
        document.getElementById("radarCost")
    ],
    essence: [
        document.getElementById("efficiencyEssence"),
        document.getElementById("gainEssence"),
        document.getElementById("radarEssence")
    ],
    ROI:[
        document.getElementById("efficiencyROI"),
        document.getElementById("gainROI"),
        document.getElementById("radarROI")
    ]
}

const efficiencyOutput =[
    document.getElementById("efficiencyOutput1"),
    document.getElementById("efficiencyOutput2")
]

const costOutput =[
    document.getElementById("costOutput1"),
    document.getElementById("costOutput2")

]
const gainOutput =[
    document.getElementById("gainOutput1"),
    document.getElementById("gainOutput2")
]

const expOutput=[
    document.getElementById("expOutput1"),
    document.getElementById("expOutput2")
]

const radarOutput=[
    document.getElementById("radarOutput1"),
    document.getElementById("radarOutput2")
]

const petWorthSac = document.getElementById("petWorthSac");
const petWorthSell= document.getElementById("petWorthSell");
const petWorthProfit= document.getElementById("petWorthProfit");

const hbWorthSac = document.getElementById("hbWorthSac");
const hbWorthSell = document.getElementById("hbWorthSell");
const hbWorthProfit = document.getElementById("hbWorthProfit");

const levels = [
    0, //efficiency
    0, //duration
    0, //cost
    0, //gain
    0, //exp
    0  //radar
]

let patreon = false;

const petWorth = [
/*[sell,sac]*/
  [1,1], //c
  [3,5], //u
  [10,20], //r
  [250,250], //e
  [5000,3000], //m
  [1000,500], //p1
  [50000,25000], //p2
  [15000,10000], //l
  [50000,10000], //b
  [250000,100000], //f
  [1000000,500000]  //h
];

function petRates(){
    let petRates = [
        0.3,        //u
        0.1,        //r
        0.01,       //e
        0.001,      //m
        patreon? 0.005:0,      //p1
        patreon? 0.0001:0,     //p2
        0.0005,     //l
        0.00000004*levels[5], //b
        0.00001,    //f
        0.000001,   //h
    
    ]    
    let cRate = petRates.reduce((acc, num) => acc - num, 1);

    return [cRate, ...petRates]

}

function getWorth(){
    let sacWorth=0;
    let sellWorth=0;

    isSac.forEach((bool, index) => {
        if (bool) {
            sacWorth += petRates()[index]*petWorth[index][1];
        }else{
            sellWorth += petRates()[index]*petWorth[index][0];
        }
    });

    return [sacWorth, sellWorth];

}



function getUpgradeCost(index, level) {
  const paramsArray = [
    { multiplier: 10, exponent: 1.748 },    //efficiency
    { multiplier: 10, exponent: 1.700 },    //duration
    { multiplier: 1000, exponent: 3.4 },    //cost
    { multiplier: 10, exponent: 1.800 },    //gain
    { multiplier: 10, exponent: 1.800 },    //exp
    { multiplier: 50, exponent: 2.500 },    //radar
  ];

  const params = paramsArray[index];
  return Math.floor(params.multiplier * Math.pow(level + 1, params.exponent));
}

const cells = Array.from(document.querySelectorAll("#table-1 th"));
const isSac = cells.map(cell => cell.textContent.trim() === "Sac ");


let isDragging = false;

document.addEventListener("mouseup", () => {
    isDragging = false;
});
document.addEventListener("mousedown", () => {
    isDragging = true;
});

cells.forEach((cell,index) => {
    cell.addEventListener("mousedown", (event) => {
        isDragging = true;
        if (isDragging) {
            let targetCell = event.target.closest("th");
            if (targetCell) toggleCell(targetCell,index);
        }
    });

    cell.addEventListener("mouseenter",(event) => {
        if (event.relatedTarget && cell.contains(event.relatedTarget)) {
            return;
        }
        
        if (isDragging) {
            let targetCell = event.target.closest("th"); 
            if (targetCell) toggleCell(targetCell,index);
        }
    });
});

function toggleCell(cell,index) {
    let targetText = cell.querySelector(".table-1-text");
    let targetImg = cell.querySelector(".table-1-img");
    if (targetText.innerHTML === "Sac&nbsp;") {
        targetText.innerHTML = 'Sell&nbsp;';
        targetImg.src = "media/owo_images/cowoncy.png";
        isSac[index]=false;
    } else {
        targetText.innerHTML = 'Sac&nbsp;';
        targetImg.src = "media/owo_images/essence.gif";
        isSac[index]=true;
    }
    drawData();
}

document.getElementById("patreonCheck").addEventListener("change", function() {
    if (event.isTrusted) {
        patreon=this.checked; 
        saveDataCookie();
        drawData();
    }
});

function showTimestamps() {
    const now = new Date();
    let formattedTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    document.getElementById("timestamp1").textContent = formattedTime;
    document.getElementById("timestamp2").textContent = formattedTime;
}

document.addEventListener("DOMContentLoaded", () => {
    for (let i = 0; i < 6; i++) {
        const container = document.getElementById(`inputContainer${i + 1}`);
        
        const wrapper = document.createElement("div");
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0; 
        input.max = maxValues[i];
        input.tabIndex=i+1;
        input.onchange = () => modifyValueDirect(i, parseInt(input.value));

        input.id = `num${i}`;
        input.className="discord-code-lite no-arrows";

        const span =document.createElement("span");
        span.textContent="Lvl";
        span.className="calculatorLevel";

        const btnPlus = document.createElement("button");
        btnPlus.onclick = () => modifyValueDirect(i, parseInt(input.value)+1);
        btnPlus.className ="tooltip";

        const btnMinus = document.createElement("button");
        btnMinus.onclick = () => modifyValueDirect(i, parseInt(input.value)-1);

        wrapper.style = "display:flex; align-items:center; padding: 0.3rem 0;";
        wrapper.append(btnMinus,span,input,btnPlus);
        container.appendChild(wrapper);

        modifyValueDirect(i,0);
    }

    showTimestamps();
    loadDataCookie();
    importFromHash();
    drawData();
});

function modifyValueDirect(index, value) {
    const input = document.getElementById(`num${index}`);
    const btnPlus = input.nextElementSibling;
    const btnMinus = input.previousElementSibling.previousElementSibling;

    const tooltip = document.createElement("span");
          tooltip.className="tooltip-text";

    if (value >= input.max ) {
        btnPlus.textContent = "MAX";
        value = input.max;
        tooltip.style.textDecoration="line-through";
    } else {
        btnPlus.textContent = ">";
        tooltip.style.textDecoration="unset";
    }
    tooltip.innerHTML = `<img style="width: 0.6rem; padding: 0 0.25rem;" src="../media/owo_images/essence.gif"></img>` + 
                        getUpgradeCost(index, parseInt(value)).toLocaleString();

    if (value <= 0) {
        btnMinus.textContent = "MIN";
        value =0;
    } else {
        btnMinus.textContent = "<";
    }

    input.value= value;
    btnPlus.appendChild(tooltip);
    updateLevel(index, parseInt(input.value));
}

function updateLevel(index, value){
    levels[index]=value;
    saveDataCookie();
    drawData();
}

function drawData(){
    
    const labels = ["⏱ Efficiency - ", "⏳ Duration - ", "&nbsp;Cost - ", "🔧 Gain - ", "⚔ Experience - ", "📡 Radar - "];
    const suffixes = ["/h", "h", " cowoncy", " ess/h", " exp/h", "ppm"];
    const values = [
        levels[0] + 25,                 //efficiency
        levels[1]/10+0.5,               //duration
        10 - levels[2],                 //cost
        levels[3] * 25,                 //gain
        levels[4] * 35,                 //exp
        (levels[5] * 0.04).toFixed(2)   //radar
    ];

    const upgradeWorth = [
        getWorth()[0] * 24,
        600,
        (isSac[8] ? 0.00000004 * petWorth[8][1] * values[0] * 24 : 0)   // add if bots sacced
        - (isSac[0] ? petRates()[8] * values[0] * 24 : 0)               // subtract if commons sacced
    ];

    headers.forEach((header, index) => {
        header.innerHTML = labels[index] + values[index] + suffixes[index];
    });

    let maxROIindex = -1;
    let maxROI = -Infinity;

    [0, 3, 5].forEach((index, i) => {
        let ROI = upgradeWorth[i]/getUpgradeCost(index,levels[index]);

        if (ROI > maxROI) {
            maxROI = ROI;
            maxROIindex = i;
        }

        table2.cost[i].textContent = getUpgradeCost(index, levels[index]).toLocaleString();
        table2.rows[i].style.textDecoration = levels[index] === maxValues[index] ? "line-through" : "none";
        table2.rows[i].style.fontWeight="normal";
        table2.essence[i].textContent = `+${numberFixedString(upgradeWorth[i],1)} ess/day`;
        table2.ROI[i].textContent= numberFixedString(ROI*100,1) + "%/day"
    });

    if (maxROIindex !== -1) {
        table2.rows[maxROIindex].style.fontWeight = "bolder";
    }

    let dailyPets = values[0]*24;
    let hbPets = Math.floor(values[0]*values[1]);

    efficiencyOutput[0].textContent=dailyPets.toLocaleString()+" pets/day";
    efficiencyOutput[1].textContent=hbPets.toLocaleString()+" pets/hb";

    costOutput[0].textContent="-"+(dailyPets*values[2]).toLocaleString()+" owo/day";
    costOutput[1].textContent="-"+(hbPets*values[2]).toLocaleString()+" owo/hb";   

    gainOutput[0].textContent=(values[3]*24).toLocaleString()+" ess/day";
    gainOutput[1].textContent=(Math.floor(values[3]*values[1])).toLocaleString()+" ess/hb";   

    expOutput[0].textContent=(values[4]*24).toLocaleString()+" exp/day";
    expOutput[1].textContent=(Math.floor(values[4]*values[1])).toLocaleString()+" exp/hb";   

    radarOutput[0].textContent="weekly bot: "+(100-100*Math.pow(1 - (0.00000004*levels[5]), dailyPets*7)).toFixed(1)+"%";
    radarOutput[1].textContent="monthly bot: "+(100-100*Math.pow(1 - (0.00000004*levels[5]), dailyPets*30)).toFixed(1)+"%";
    
    let worth=getWorth();

    petWorthSell.textContent = numberFixedString(worth[1],1) +" owo/pet"; 
    hbWorthSell.textContent  = numberFixedString(worth[1]*hbPets,0) +" owo/hb"; 

    petWorthProfit.textContent = "Profit: "+numberFixedString(worth[1]-values[2],1) +" owo/pet"; 
    hbWorthProfit.textContent  = "Profit: "+numberFixedString((worth[1]-values[2])*hbPets,0)+" owo/hb";

    petWorthSac.textContent = numberFixedString(worth[0],1) +" ess/pet";      
    hbWorthSac.textContent  = numberFixedString(worth[0]*hbPets,0) +" ess/hb"; 
 
    document.getElementById("patreonCheck").checked=patreon;
}

function numberFixedString(input,fixed){
    return Number(input.toFixed(fixed)).toLocaleString();
}

document.addEventListener("paste", (event) => {
    extractLevels(event.clipboardData.getData("text"));
});

function extractLevels(text) {
    const levelPattern = /\bLvl (\d+)\b/g;
    const extractedLevels = [];
    let match;

    while ((match = levelPattern.exec(text)) !== null) {
        extractedLevels.push(parseInt(match[1], 10));
    }

    for (var i =0; i<6;i++){
        if (extractedLevels[i] !== undefined) {
            modifyValueDirect(i, extractedLevels[i]);
        }
    }
}

function importFromHash(){
    const hash = window.location.hash;
    if (hash) {
        const value = decodeURIComponent(hash.slice(1));
        stringToLevel(value);
    }
}

function saveDataCookie(){
    cookie.setCookie("Patreon",patreon.toString(),30);
    cookie.setCookie("Levels",levels.join(","),30)
}

function loadDataCookie(){
    const patreonData = cookie.getCookie("Patreon");
    const levelsData = cookie.getCookie("Levels");
    if (levelsData) {
        stringToLevel(levelsData);
    }
    patreon = patreonData === "true";
}

function stringToLevel(levelString){
    levelString .split(",")
                .map(Number)
                .forEach((value, index) => modifyValueDirect(index, value));
}