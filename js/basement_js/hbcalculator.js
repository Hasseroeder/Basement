import * as cookie from "./util/cookieUtil.js";
import { signedNumberFixedString } from "./util/stringUtil.js";
import { make, doTimestamps } from "./util/injectionUtil.js";
import { debounce } from "./util/inputUtil.js";

let traitcounter = 1;
let patreon = false;
let initialized = false;
let isDragging = false;

const table2El=document.getElementById("table2");
table2El.innerHTML="<tr><th></th><th>Cost</th><th>Essence</th><th>ROI</th></tr>";

const gridContainer= document.querySelector(".gridContainer");

class Trait{
    constructor ({name,unit,max,includeInTable,costParams,outputs}){
        [this.name,this.unit,this.max,this.costParams,this.outputs] = [name,unit,max,costParams,outputs]
        this.header = make("span");
        this.emoji = make("img",{src:`../media/owo_images/${this.name.toLowerCase()}.png`, style:{height:"1rem"}});

        const wrappers = [
            make("div",{className:"header-wrapper"},[this.emoji,this.header]),
            make("div",{style:{display:"flex", alignItems:"center"}}),
            make("ul")
        ];
        gridContainer.append(make("div",{className:"trait-box"},wrappers));

        if (includeInTable){
            const cells = [...Array(4)].map(() => make("td"));
            const row = make("tr",{},cells);
            table2El.append(row);
            this.table={cells,row}
        }
        
        [this._span, this.input] = [
            make("div",{
                textContent:"Lvl", className:"calculatorLevel",
                onclick:()=>input.focus()
            }),
            make("input",{
                type:"number", min:0, max:this.max, tabIndex:traitcounter++, className:"number-input no-arrows",
                onchange:() => modifyValueAndCookie(this)
            })
        ];
        const _numberWrapper = make("div",{className:"numberWrapper"},[this._span, this.input]);

        const _ttKids = [make("img",{className:"upgrade-image",src:"../media/owo_images/essence.gif"}),make("div")]
        const _tt = make("span",{className:"tooltip-text"},_ttKids);
        const text = make("div");
        const _btnP = make("button",{onclick: ()=>modifyValueAndCookie(this,true), className:"tooltip"},[text,_tt]);
        const _btnM = make("button",{onclick: ()=>modifyValueAndCookie(this,false)});
        this.btnM= _btnM;
        this.btnP= {text, ttText:_ttKids[1],ttEl:_tt};

        wrappers[1].append(
            make("div",{className:"hb-input-wrapper",
                onwheel: e =>{
                    e.preventDefault();
                    modifyValueAndCookie(this,e.deltaY < 0);
                }
            },[_btnM,_numberWrapper,_btnP])
        );

        this.outputs.forEach(output =>{
            output.el = document.createElement("li");
            wrappers[2].append(output.el);
        });

        modifyValueDirect(this,0);
    }

    cost(){
        const params = this.costParams;
        return Math.floor(params.mult * Math.pow(this.level + 1, params.exponent));
    }
}

const traits = [
    new Trait({
        name:"Efficiency", unit: " pets/h", max:215, includeInTable: true, 
        costParams: { mult: 10, exponent: 1.748 },
        outputs:[
            {text:({dailyPets})=>dailyPets+" pets/day"},
            {text:({hbPets})=>hbPets+" pets/hb"}
        ]
    }),
    new Trait({
        name:"Duration", unit: "h", max:235,
        costParams: { mult: 10, exponent: 1.700 },
        outputs:[]
    }),
    new Trait({
        name:"Cost", unit: " cowoncy", max:5,
        costParams: { mult: 1000, exponent: 3.4 },
        outputs:[
            {text:({dailyPets,values})=>"-"+(dailyPets*values[2])+" owo/day"},
            {text:({hbPets,values})=>"-"+(hbPets*values[2])+" owo/hb"}
        ]
    }),
    new Trait({
        name:"Gain", unit:" ess/h", max:200, includeInTable: true,
        costParams: { mult: 10, exponent: 1.800 },
        outputs:[
            {text:({values})=>(values[3]*24)+" ess/day"},
            {text:({values})=>(Math.floor(values[3]*values[1]))+" ess/hb"}
        ]
    }),
    new Trait({
        name:"Experience", unit: " exp/h", max:200,
        costParams: { mult: 10, exponent: 1.800 },
        outputs:[
            {text:({values})=>(values[4]*24)+" exp/day"},
            {text:({values})=>(Math.floor(values[4]*values[1]))+" exp/hb"}
        ]
    }),
    new Trait({
        name:"Radar", unit: "ppm", max:999, includeInTable: true,
        costParams: { mult: 50, exponent: 2.500 },
        outputs:[
            {text:({dailyPets})=>"weekly bot: "+(100-100*Math.pow(1 - (0.00000004*traits[5].level), dailyPets*7)).toFixed(1)+"%"},
            {text:({dailyPets})=>"monthly bot: "+(100-100*Math.pow(1 - (0.00000004*traits[5].level), dailyPets*30)).toFixed(1)+"%"}
        ]
    })
];

const graying= Array.from(document.querySelectorAll(".patreon-graying"));
const renderPatreon = () => graying.forEach(el=>el.hidden=patreon);

doTimestamps();
document.getElementById("sacToggles").querySelectorAll("button")
    .forEach(
        (b,i)=>b.onclick=()=>toggleAllCells(Boolean(i))
    );

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
    const rates = petRates();
    let sacWorth=0;
    let sellWorth=0;

    isSac.forEach((is,i) =>{
        if (is)   sacWorth += rates[i] * petWorth[i][1];
        else      sellWorth += rates[i] * petWorth[i][0];
    });

    return [sacWorth, sellWorth];
}

const cells = Array.from(document.querySelectorAll("#table-1 td"));
const isSac = cells.map(() => false);

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
    initialized = true;

    importFromHash();
    importFromCookie();

    toggleAllCells(true);
    saveDebounced();
    drawData();
});

function modifyValueDirect(trait, value) {
    const {input,btnM,btnP} = trait;
    value = Math.min(input.max,Math.max(0,+value));

    input.value= value;
    trait.level= value;

    btnM.textContent = value==0? "MIN":"<";
    btnP.text.textContent = value==input.max? "MAX":">";
    btnP.ttEl.hidden=value==input.max;
    btnP.ttText.textContent=trait.cost();
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
            const ROI = upgradeWorth[i]/trait.cost();
            if (ROI > maxROI) {
                maxROI = ROI;
                maxROIindex = i;
            }
            trait.table.row.style.textDecoration = trait.level === trait.max ? "line-through" : "none";
            trait.table.row.style.fontWeight="normal";
            trait.table.cells[0].textContent = trait.name;
            trait.table.cells[1].textContent = trait.cost();
            trait.table.cells[2].textContent = signedNumberFixedString(upgradeWorth[i],1)+` ess/day`;
            trait.table.cells[3].textContent = (ROI*100).toFixed(1) + "%/day"
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
        modifyValueAndCookie(traits[i], m[1]);
    });
}

function modifyValueAndCookie(trait, value){
    if (typeof value === "boolean") value = +trait.input.value + (value?+1:-1); // if boolean, just assume you want to go up/down
    else if (value === undefined)   value = +trait.input.value;                 // if no value given, take from input

    modifyValueDirect(trait, value);
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
                .forEach((value, index) => modifyValueAndCookie(traits[index], value));
}