import * as cookie from "./util/cookieUtil.js";
import { signedNumberFixedString } from "./util/stringUtil.js";
import { make, doTimestamps } from "./util/injectionUtil.js";

const maxValues = {
    0: 215,
    1: 235,
    2: 5,
    3: 200,
    4: 200,
    5: 999
};

const traits = [
    {name:"Efficiency", unit: " pets/h"},
    {name:"Duration", unit: "h"},
    {name:"Cost", unit: " cowoncy"},
    {name:"Gain", unit:" ess/h"},
    {name:"Experience", unit: " exp/h"},
    {name:"Radar", unit: "ppm"}
];

const headers = Array.from(document.querySelectorAll(".header"));

populateITable();

function populateITable(){
    const table2El=document.getElementById("table2");
    table2El.innerHTML="<tr><th></th><th>Cost</th><th>Essence</th><th>ROI</th></tr>";

    [0,3,5].forEach(i =>{
        const trait = traits[i]

        const tLabel = make("td",{textContent:trait.name});
        const tCost = make("td");
        const tEssence = make("td");
        const tRoi = make("td");
        const tRow = make("tr",{},[tLabel,tCost,tEssence,tRoi]);
        table2El.append(tRow);
        Object.assign(trait,{
            tCost,tEssence,tRoi,tRow
        })
    });
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

const graying= Array.from(document.querySelectorAll(".patreon-graying"));
const renderPatreon = () => graying.forEach(el=>el.hidden=patreon);

doTimestamps();
document.getElementById("sacToggles").querySelectorAll("button")
    .forEach(
        (b,i)=>b.onclick=()=>toggleAllCells(Boolean(i))
    );

function debounce(fn, wait = 200, immediate = false) {
    let timeoutId;

    return function debounced(...args) {
        const context = this;
        const callNow = immediate && !timeoutId;

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            timeoutId = null;
            if (!immediate) fn.apply(context, args);
        }, wait);

        if (callNow) fn.apply(context, args);
    };
}

const saveDebounced = debounce(saveData);

function saveData(){
    history.replaceState(null, '', '#'+levels.join(","));
    cookie.setCookie("Patreon",patreon.toString(),30);
    cookie.setCookie("Levels",levels.join(","),30)
}

function toggleAllCells(boolean){    
    isSac.forEach((tier,i) =>{
        if (tier != boolean) toggleCell(i);
    })
}

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

const cells = Array.from(document.querySelectorAll("#table-1 td"));
const isSac = cells.map(() => false);

let isDragging = false;
document.addEventListener("mouseup", () => isDragging = false);
document.addEventListener("mousedown", () => isDragging = true);

cells.forEach((cell,index) => {
    cell.addEventListener("mousedown", () => toggleCell(index));

    cell.addEventListener("mouseenter",event => {
        if (event.relatedTarget && cell.contains(event.relatedTarget)) return;
        if (isDragging) toggleCell(index)
    });
});

function toggleCell(i) {
    isSac[i]=!isSac[i];
    cells[i].querySelector(".table-1-text").innerHTML = isSac[i]?'Sac':'Sell';
    cells[i].querySelector(".table-1-img").src = isSac[i]?"media/owo_images/essence.gif":"media/owo_images/cowoncy.png";
    drawData();
}

document.getElementById("patreonCheck").addEventListener("change", function() {
    patreon=this.checked; 
    saveDebounced();
    drawData();
    renderPatreon();
});

document.addEventListener("DOMContentLoaded", () => {
    traits.forEach((trait,i) => {
        const container = document.getElementById(`inputContainer${i + 1}`);
        
        const input = make("input",{
            type:"number", min:0, max:maxValues[i], tabIndex:i+1, id:`num${i}`, className:"discord-code-lite no-arrows",
            style:{borderRadius:"0 0.2rem 0.2rem 0"},
            onchange:() => modifyValueAndCookie(i, +input.value)
        });

        const span = make("div",{
            textContent:"Lvl", className:"calculatorLevel",
            onclick:()=>input.focus()
        });

        //btnM
        const btnM = make("button",{onclick: ()=>modifyValueAndCookie(i, +input.value-1)});
        //btnP & tooltip
        const ttKids = [make("img",{className:"upgrade-image",src:"../media/owo_images/essence.gif"}),make("div")]
        const tt = make("span",{className:"tooltip-text"},[
            make("div",{style:{display:"flex", justifyItems: "center", justifyContent: "center", gap: "0.1rem"}},ttKids)
        ]);
        const text = make("div");
        const btnP = make("button",{onclick: ()=>modifyValueAndCookie(i, +input.value+1), className:"tooltip"},[text,tt]);
        const btnData = {text, ttText:ttKids[1],ttEl:tt}

        container.append(
            make("div",{className:"hb-input-wrapper",
                onwheel: e =>{
                    e.preventDefault();
                    const step = e.deltaY < 0? 1:-1;
                    modifyValueAndCookie(i, +input.value +step);
                }
            },[
                btnM,
                make("div",{className:"numberWrapper"},[span, input]),
                btnP
            ])
        );

        Object.assign(trait,{
            container,
            input,
            btnM,
            btnP:btnData
        })

        modifyValueDirect(i,0);
    });

    window.addEventListener('hashchange', importFromHash);
    importFromHash();
    importFromCookie();

    toggleAllCells(true);
    saveDebounced();
    drawData();
});

function modifyValueDirect(i, value) {
    const {input,btnM,btnP} = traits[i]

    value = Math.min(input.max,Math.max(0,+value));
    btnM.textContent = value==0? "MIN":"<";
    btnP.text.textContent = value==input.max? "MAX":">";
    btnP.ttEl.hidden=value==input.max;
    btnP.ttText.textContent=getUpgradeCost(i,value);

    input.value= value;
    levels[i]= value;
    drawData();
}

function drawData(){    
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
        0,
        0,                                  
        600,        
        0,                                                    
        (isSac[8] ? 0.00000004 * petWorth[8][1] * values[0] * 24 : 0)  
        - (isSac[0] ? petRates()[8] * values[0] * 24 : 0)              
    ];

    headers.forEach((header, index) => {
        header.textContent = traits[index].name + " - " + values[index] + traits[index].unit;
    });

    let maxROIindex = -1;
    let maxROI = -Infinity;

    [0, 3, 5].forEach(i => {
        const trait = traits[i];

        const ROI = upgradeWorth[i]/getUpgradeCost(i,levels[i]);

        if (ROI > maxROI) {
            maxROI = ROI;
            maxROIindex = i;
        }

        trait.tCost.textContent = getUpgradeCost(i, levels[i]).toLocaleString();
        trait.tRow.style.textDecoration = levels[i] === maxValues[i] ? "line-through" : "none";
        trait.tRow.style.fontWeight="normal";
        trait.tEssence.textContent = signedNumberFixedString(upgradeWorth[i],1)+` ess/day`;
        trait.tRoi.textContent= (ROI*100).toFixed(1) + "%/day"
    });

    traits[maxROIindex].tRow.style.fontWeight = "bolder";

    let dailyPets = values[0]*24;
    let hbPets = Math.floor(values[0]*values[1]);
    let worth=getWorth();

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

    petWorthSell.textContent = worth[1].toFixed(1) +" owo/pet"; 
    hbWorthSell.textContent  = (worth[1]*hbPets).toFixed(0) +" owo/hb"; 

    petWorthProfit.textContent = "Profit: "+(worth[1]-values[2]).toFixed(1) +" owo/pet"; 
    hbWorthProfit.textContent  = "Profit: "+((worth[1]-values[2])*hbPets).toFixed(0)+" owo/hb";

    petWorthSac.textContent = worth[0].toFixed(1) +" ess/pet";      
    hbWorthSac.textContent  = (worth[0]*hbPets).toFixed(0) +" ess/hb"; 

    document.getElementById("patreonCheck").checked=patreon;
}

document.addEventListener("paste", event => extractLevels(event.clipboardData.getData("text")));

function extractLevels(text) {
    const levelPattern = /\bLvl (\d+)\b/g;
    const matches = [...text.matchAll(levelPattern)].slice(0, 6);
    matches.forEach((m, i) => {
        modifyValueAndCookie(i, m[1]);
    });
}

function modifyValueAndCookie(index, value){
    modifyValueDirect(index, value);
    saveDebounced();
}

function importFromHash(){
    const hash = location.hash;
    if (hash) stringToLevel(hash.slice(1));
}

function importFromCookie(){
    const levelsData = cookie.getCookie("Levels");
    if (levelsData) stringToLevel(levelsData);

    const patreonData = cookie.getCookie("Patreon");
    patreon = patreonData === "true";
    renderPatreon();
}

function stringToLevel(levelString){
    levelString .split(",")
                .map(Number)
                .forEach((value, index) => modifyValueAndCookie(index, value));
}