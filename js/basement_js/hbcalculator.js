import * as cookie from "./util/cookieUtil.js";
import { signedNumberFixedString } from "./util/stringUtil.js";
import { make, doTimestamps } from "./util/injectionUtil.js";

const traits = [
    {
        name:"Efficiency", unit: " pets/h", maxLvl:215,
        wrapper: document.querySelector(".item-2"), costParams: { mult: 10, exponent: 1.748 },
        outputs:[
            {text:({dailyPets})=>dailyPets+" pets/day"},
            {text:({hbPets})=>hbPets+" pets/hb"}
        ]
    },
    {
        name:"Duration", unit: "h", maxLvl:235,
        wrapper: document.querySelector(".item-3"), costParams: { mult: 10, exponent: 1.700 },
        outputs:[]
    },
    {
        name:"Cost", unit: " cowoncy", maxLvl:5,
        wrapper: document.querySelector(".item-4"), costParams: { mult: 1000, exponent: 3.4 },
        outputs:[
            {text:({dailyPets,values})=>"-"+(dailyPets*values[2])+" owo/day"},
            {text:({hbPets,values})=>"-"+(hbPets*values[2])+" owo/hb"}
        ]
    },
    {
        name:"Gain", unit:" ess/h", maxLvl:200,
        wrapper: document.querySelector(".item-5"), costParams: { mult: 10, exponent: 1.800 },
        outputs:[
            {text:({values})=>(values[3]*24)+" ess/day"},
            {text:({values})=>(Math.floor(values[3]*values[1]))+" ess/hb"}
        ]
    },
    {
        name:"Experience", unit: " exp/h", maxLvl:200,
        wrapper: document.querySelector(".item-6"), costParams: { mult: 10, exponent: 1.800 },
        outputs:[
            {text:({values})=>(values[4]*24)+" exp/day"},
            {text:({values})=>(Math.floor(values[4]*values[1]))+" exp/hb"}
        ]
    },
    {
        name:"Radar", unit: "ppm", maxLvl:999,
        wrapper: document.querySelector(".item-7"), costParams: { mult: 50, exponent: 2.500 },
        outputs:[
            {text:({dailyPets})=>"weekly bot: "+(100-100*Math.pow(1 - (0.00000004*traits[5].level), dailyPets*7)).toFixed(1)+"%"},
            {text:({dailyPets})=>"monthly bot: "+(100-100*Math.pow(1 - (0.00000004*traits[5].level), dailyPets*30)).toFixed(1)+"%"}
        ]
    }
];

populateITable();
function populateITable(){
    const table2El=document.getElementById("table2");
    table2El.innerHTML="<tr><th></th><th>Cost</th><th>Essence</th><th>ROI</th></tr>";

    [0,3,5].forEach(i =>{
        const trait = traits[i]

        const label = make("td",{textContent:trait.name});
        const cost = make("td");
        const essence = make("td");
        const roi = make("td");
        const row = make("tr",{},[label,cost,essence,roi]);
        table2El.append(row);
        Object.assign(trait,{
            table:{cost,essence,roi,row}
        })
    });
}

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
    const tempLevels = traits.map(t => Number(t.level));

    history.replaceState(null, '', '#'+tempLevels.join(","));
    cookie.setCookie("Patreon",patreon.toString(),30);
    cookie.setCookie("Levels",tempLevels.join(","),30);
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

let patreon = false;
let initialized = false;

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
        0.3,                        //u
        0.1,                        //r
        0.01,                       //e
        0.001,                      //m
        patreon? 0.005:0,           //p1
        patreon? 0.0001:0,          //p2
        0.0005,                     //l
        0.00000004*traits[5].level, //b
        0.00001,                    //f
        0.000001,                   //h
    
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

function getUpgradeCost(trait) {
    const params = trait.costParams;
    return Math.floor(params.mult * Math.pow(trait.level + 1, params.exponent));
}

const cells = Array.from(document.querySelectorAll("#table-1 td"));
const isSac = cells.map(() => false);

let isDragging = false;
document.addEventListener("mouseup", () => isDragging = false);
document.addEventListener("mousedown", () => isDragging = true);
window.addEventListener('hashchange', importFromHash);
document.addEventListener("paste", event => extractLevels(event.clipboardData.getData("text")));

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

document.getElementById("patreonCheck").onchange= e =>{
    patreon=e.target.checked; 
    saveDebounced();
    drawData();
    renderPatreon();
};

document.addEventListener("DOMContentLoaded", () => {
    traits.forEach((trait,i) => {
        const container = document.getElementById(`inputContainer${i + 1}`);
        
        const input = make("input",{
            type:"number", min:0, max:trait.maxLvl, tabIndex:i+1, className:"discord-code-lite no-arrows",
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

        const outputWrapper = trait.wrapper.querySelector(".output-container");
        trait.outputs.forEach(output =>{
            output.el = document.createElement("li");
            outputWrapper.append(output.el);
        });

        Object.assign(trait,{
            input,
            btnM,
            btnP:btnData,
            header: trait.wrapper.querySelector(".header"),
        })

        modifyValueDirect(i,0);
    });

    initialized = true;

    importFromHash();
    importFromCookie();

    toggleAllCells(true);
    saveDebounced();
    drawData();
});

function modifyValueDirect(i, value) {
    const trait = traits[i];
    const {input,btnM,btnP} = trait;

    value = Math.min(input.max,Math.max(0,+value));
    btnM.textContent = value==0? "MIN":"<";
    btnP.text.textContent = value==input.max? "MAX":">";
    btnP.ttEl.hidden=value==input.max;
    btnP.ttText.textContent=getUpgradeCost(trait);

    input.value= value;
    trait.level= value;
    drawData();
}

function drawData(){    
    if (!initialized) return;

    const values = [
        traits[0].level + 25,
        traits[1].level/10+0.5,
        10 - traits[2].level,
        traits[3].level * 25,
        traits[4].level * 35,
        (traits[5].level * 0.04).toFixed(2)
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

    const dailyPets = values[0]*24;
    const hbPets = Math.floor(values[0]*values[1]);
    const worth=getWorth();

    const params = {dailyPets,hbPets,values};

    let maxROIindex = -1;
    let maxROI = -Infinity;

    traits.forEach((trait, i) => {
        trait.header.textContent = trait.name + " - " + values[i] + trait.unit;
        trait.outputs.forEach(output =>{
            output.el.textContent=output.text(params);
        });
        if (trait.table){
            const ROI = upgradeWorth[i]/getUpgradeCost(trait);
            if (ROI > maxROI) {
                maxROI = ROI;
                maxROIindex = i;
            }
            trait.table.cost.textContent = getUpgradeCost(trait);
            trait.table.row.style.textDecoration = trait.level === trait.maxLvl ? "line-through" : "none";
            trait.table.row.style.fontWeight="normal";
            trait.table.essence.textContent = signedNumberFixedString(upgradeWorth[i],1)+` ess/day`;
            trait.table.roi.textContent= (ROI*100).toFixed(1) + "%/day"
        }
    });
    traits[maxROIindex].table.row.style.fontWeight = "bolder";

    petWorthSell.textContent = worth[1].toFixed(1) +" owo/pet"; 
    hbWorthSell.textContent  = (worth[1]*hbPets).toFixed(0) +" owo/hb"; 

    petWorthProfit.textContent = "Profit: "+(worth[1]-values[2]).toFixed(1) +" owo/pet"; 
    hbWorthProfit.textContent  = "Profit: "+((worth[1]-values[2])*hbPets).toFixed(0)+" owo/hb";

    petWorthSac.textContent = worth[0].toFixed(1) +" ess/pet";      
    hbWorthSac.textContent  = (worth[0]*hbPets).toFixed(0) +" ess/hb"; 

    document.getElementById("patreonCheck").checked=patreon;
}

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