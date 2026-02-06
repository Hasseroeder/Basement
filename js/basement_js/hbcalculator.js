import * as cookie from "./util/cookieUtil.js";
import { signedNumberFixedString } from "./util/stringUtil.js";
import { make, doTimestamps } from "./util/injectionUtil.js";
import { debounce,roundToDecimals } from "./util/inputUtil.js";

let traitcounter = 1;
let patreon = false;
let isDragging = false;

const table2El=document.getElementById("table2");
table2El.innerHTML="<tr><th></th><th>Cost</th><th>Essence</th><th>ROI</th></tr>";

const gridContainer= document.querySelector(".gridContainer");

const dailyPets = ()=>Efficiency.value*24;
const hbPets = ()=>Math.floor(Efficiency.value*Duration.value);

class Trait{
    constructor (opts){
        Object.assign(this, opts);
        this.header = make("span");
        this.emoji = make("img",{src:`../media/owo_images/huntbot/${this.name.toLowerCase()}.png`, style:{height:"1rem"}});

        const wrappers = [
            make("div",{className:"header-wrapper"},[this.emoji,this.header]),
            make("div",{style:{display:"flex", alignItems:"center"}}),
            make("ul")
        ];
        gridContainer.append(make("div",{className:"trait-box"},wrappers));

        if (this.upgradeWorth){
            const cells = [...Array(4)].map(() => make("td"));
            const row = make("tr",{},cells);
            this.table={row,
                update:()=>{
                    row.style.textDecoration = this.level === this.max ? "line-through" : "none";
                    row.style.fontWeight = "normal";
                    cells[0].textContent = this.name;
                    cells[1].textContent = this.cost;
                    cells[2].textContent = signedNumberFixedString(this.upgradeWorth(),1)+` ess/day`;
                    cells[3].textContent = (this.ROI*100).toFixed(1) + "%/day"
                }
            }
            table2El.append(row);
        }
        
        [this._span, this.input] = [
            make("div",{
                textContent:"Lvl", className:"calculatorLevel",
                onclick:()=>this.input.focus()
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

        this.outputs.forEach((output,i) =>{
            const el = document.createElement("li");
            wrappers[2].append(el);
            this.outputs[i] = () => el.textContent = output();
        });
    }

    get cost() {
        const {mult,exponent} = this.costParams;
        return Math.floor(mult * Math.pow(this.level + 1, exponent));
    }

    get value(){
        const {mult=1, base=0} = this.valueParams;
        return mult*this.level + base;
    }

    get ROI(){
        return this.upgradeWorth()/this.cost;
    }
}

const Efficiency = new Trait({
    name:"Efficiency", unit:" pets/h", max:215,
    costParams: {mult:10, exponent:1.748}, valueParams:{base:25}, upgradeWorth: ()=>getWorth()[0] * 24,
    outputs:[
        ()=>dailyPets()+" pets/day",
        ()=>hbPets()+" pets/hb"
    ]
});
const Duration = new Trait({
    name:"Duration", unit:"h", max:235,
    costParams: {mult:10, exponent:1.700}, valueParams:{mult:0.1, base:0.5},
    outputs:[]
});
const Cost = new Trait({
    name:"Cost", unit:" cowoncy", max:5,
    costParams: {mult:1000, exponent:3.4}, valueParams:{mult:-1, base:10},
    outputs:[
        ()=>"-"+(dailyPets()*Cost.value)+" owo/day",
        ()=>"-"+(hbPets()*Cost.value)+" owo/hb"
    ]
});
const Gain = new Trait({
    name:"Gain", unit:" ess/h", max:200,
    costParams: {mult:10, exponent:1.800}, valueParams:{mult:25}, upgradeWorth: ()=>600,
    outputs:[
        ()=>(Gain.value*24)+" ess/day",
        ()=>(Math.floor(Gain.value*Duration.value))+" ess/hb"
    ]
});
const Experience = new Trait({
    name:"Experience", unit:" exp/h", max:200,
    costParams: {mult:10, exponent:1.800}, valueParams:{mult:35},
    outputs:[
        ()=>(Experience.value*24)+" exp/day",
        ()=>(Math.floor(Experience.value*Duration.value))+" exp/hb"
    ]
});
const Radar = new Trait({
    name:"Radar", unit:"ppm", max:999,
    costParams: {mult:50, exponent:2.500}, valueParams:{mult:0.04}, upgradeWorth: ()=>{
        return (isSac[8] ? 0.00000004 * petWorth[8][1] * dailyPets() : 0)  
        - (isSac[0] ? 0.00000004 * dailyPets() : 0)
    },
    outputs:[
        ()=>"weekly bot: "+(100-100*Math.pow(1 - (0.00000004*Radar.level), dailyPets()*7)).toFixed(1)+"%",
        ()=>"monthly bot: "+(100-100*Math.pow(1 - (0.00000004*Radar.level), dailyPets()*30)).toFixed(1)+"%"
    ]
})
const traits = [Efficiency,Duration,Cost,Gain,Experience,Radar];

const graying= Array.from(document.querySelectorAll(".patreon-graying"));
const renderPatreon = () => graying.forEach(el=>el.hidden=patreon);

doTimestamps();
const toggleAllButtons = document.getElementById("sacToggles").querySelectorAll("button");
toggleAllButtons[0].onclick = () => toggleAllCells(false);
toggleAllButtons[1].onclick = () => toggleAllCells(true);

const saveDebounced = debounce(saveData);
function saveData(){
    const tempLevels = traits.map(t => Number(t.level));

    history.replaceState(null, '', '#'+tempLevels.join(","));
    cookie.setCookie("Patreon",patreon.toString(),30);
    cookie.setCookie("Levels",tempLevels.join(","),30);
}

const hbWorthEls = Array.from(document.querySelectorAll(".hbworth"));
const petWorthEls= Array.from(document.querySelectorAll(".petworth"));

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
        0.3,                    //u
        0.1,                    //r
        0.01,                   //e
        0.001,                  //m
        patreon? 0.005:0,       //p1
        patreon? 0.0001:0,      //p2
        0.0005,                 //l
        0.00000004*Radar.level, //b
        0.00001,                //f
        0.000001,               //h
    
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
const isSac = new Array(cells.length).fill(undefined);
const toggleAllCells = boolean => cells.forEach((_,i) =>toggleCell(i, boolean))

document.addEventListener("mouseup", () => isDragging = false);
document.addEventListener("mousedown", () => isDragging = true);
document.addEventListener("paste", event => extractLevels(event.clipboardData.getData("text")));

cells.forEach((cell,index) => {
    cell.addEventListener("mousedown", () => toggleCell(index));

    cell.addEventListener("mouseenter",event => {
        if (event.relatedTarget && cell.contains(event.relatedTarget)) return;
        if (isDragging) toggleCell(index)
    });
});

function toggleCell(i, boolOverride) {
    isSac[i]= boolOverride ?? !isSac[i];
    cells[i].querySelector(".table-1-text").innerHTML = isSac[i]?'Sac':'Sell';
    cells[i].querySelector(".table-1-img").src = isSac[i]?"media/owo_images/essence.gif":"media/owo_images/cowoncy.png";
    drawData();
}

const   patreonCheckWrapper = document.getElementById("patreonCheck");
        patreonCheckWrapper.onmousedown = e => {
            e.preventDefault();
            patreonCheck.checked = !patreonCheck.checked;
            patreon=patreonCheck.checked; 
            saveDebounced();
            drawData();
            renderPatreon();
        }
const   patreonCheck = patreonCheckWrapper.querySelector("input");
        patreonCheck.onclick= e => e.preventDefault();

function modifyValueDirect(trait, value) {
    const {input,btnM,btnP} = trait;
    value = Math.min(input.max,Math.max(0,+value));

    input.value= value;
    trait.level= value;

    btnM.textContent = value==0? "MIN":"<";
    btnP.text.textContent = value==input.max? "MAX":">";
    btnP.ttEl.hidden=value==input.max;
    btnP.ttText.textContent=trait.cost;
    drawData();
}

function drawData(){    
    traits.forEach(trait => {
        trait.header.textContent = trait.name + " - " + roundToDecimals(trait.value,2) + trait.unit;
        trait.outputs.forEach(fn =>fn());
        trait.table?.update()
    });
    [Efficiency,Gain,Radar].sort((a, b) => b.ROI - a.ROI)[0]
        .table.row.style.fontWeight = "bolder";
    
    const worth=getWorth();
    petWorthEls[0].textContent = worth[1].toFixed(1) +" owo/pet"; 
    hbWorthEls[0].textContent  = (worth[1]*hbPets()).toFixed(0) +" owo/hb"; 

    petWorthEls[1].textContent = "Profit: "+(worth[1]-Cost.value).toFixed(1) +" owo/pet"; 
    hbWorthEls[1].textContent  = "Profit: "+((worth[1]-Cost.value)*hbPets()).toFixed(0)+" owo/hb";

    petWorthEls[2].textContent = worth[0].toFixed(1) +" ess/pet";      
    hbWorthEls[2].textContent  = (worth[0]*hbPets()).toFixed(0) +" ess/hb"; 

    patreonCheckWrapper.checked=patreon;
}

const extractLevels = text =>
    [...text.matchAll(/\bLvl (\d+)\b/g)]
        .slice(0, 6)
        .forEach((m, i) => modifyValueAndCookie(traits[i], m[1]));

function modifyValueAndCookie(trait, value){
    if (value === undefined)   value = +trait.input.value;                              // if no value given, take from input
    else if (typeof value === "boolean") value = +trait.input.value + (value?+1:-1);    // if boolean, just assume you want to go up/down
    else if (typeof value === "string") {}                                              // modifyValueDirect() recognizes strings as numbers, no need to convert

    modifyValueDirect(trait, value);
    saveDebounced();
}

function importFromCookie(){
    const levelsData = cookie.getCookie("Levels");
    stringToLevel(levelsData ?? "0,0,0,0,0,0");

    patreon = cookie.getCookie("Patreon") === "true";
    renderPatreon();
}

const stringToLevel = levelString => levelString
    .split(",")
    .forEach((value, index) => modifyValueAndCookie(traits[index], value||0));

importFromCookie();
if (location.hash) stringToLevel(location.hash.slice(1));
toggleAllCells(true);