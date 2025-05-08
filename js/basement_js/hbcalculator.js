const maxValues = {
    0: 215,
    1: 235,
    2: 5,
    3: 200,
    4: 200,
    5: 999
};

const efficiencyHeader= document.getElementById("efficiencyHeader");
const durationHeader= document.getElementById("durationHeader");
const costHeader= document.getElementById("costHeader");
const gainHeader= document.getElementById("gainHeader");
const expHeader= document.getElementById("expHeader");
const radarHeader= document.getElementById("radarHeader");

const efficiencyRow =document.getElementById("efficiencyRow");
const gainRow =document.getElementById("gainRow");
const radarRow =document.getElementById("radarRow");

const efficiencyCost = document.getElementById("efficiencyCost");
const gainCost = document.getElementById("gainCost");
const radarCost = document.getElementById("radarCost");

const efficiencyOutput1= document.getElementById("efficiencyOutput1");
const efficiencyOutput2= document.getElementById("efficiencyOutput2");

const costOutput1= document.getElementById("costOutput1");
const costOutput2= document.getElementById("costOutput2");

const gainOutput1= document.getElementById("gainOutput1");
const gainOutput2= document.getElementById("gainOutput2");

const expOutput1= document.getElementById("expOutput1");
const expOutput2= document.getElementById("expOutput2");

const radarOutput1= document.getElementById("radarOutput1");
const radarOutput2= document.getElementById("radarOutput2");

const petWorthSac = document.getElementById("petWorthSac");
const petWorthSell= document.getElementById("petWorthSell");
const petWorthProfit= document.getElementById("petWorthProfit");

const hbWorthSac = document.getElementById("hbWorthSac");
const hbWorthSell = document.getElementById("hbWorthSell");
const hbWorthProfit = document.getElementById("hbWorthProfit");

const efficiencyEssence = document.getElementById("efficiencyEssence");
const radarEssence = document.getElementById("radarEssence");

const efficiencyROI = document.getElementById("efficiencyROI");
const gainROI = document.getElementById("gainROI");
const radarROI = document.getElementById("radarROI");


let efficiency = 0;
let duration = 0;
let cost = 0;
let gain = 0;
let exp = 0;
let radar = 0;

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
        0.00000004*radar, //b
        0.00001,    //f
        0.000001,   //h
    
    ]    
    let cRate = petRates.reduce((acc, num) => acc - num, 1);

    return [cRate, ...petRates]

}

function getWorth(){
    // (sacrifice == false) => SELLING
    // (sacrifice == true)  => SACRIFICE

    sacWorth=0;
    sellWorth=0;

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
    switch (index) {
        case 0:
            return Math.floor(10 * Math.pow(level+1, 1.748));
        case 1:
            return Math.floor(10 * Math.pow(level+1, 1.700));
        case 2:
            return Math.floor(1000 * Math.pow(level+1, 3.4));
        case 3:
            return Math.floor(10 * Math.pow(level+1, 1.800));
        case 4:
            return Math.floor(10 * Math.pow(level+1, 1.800));
        case 5:
            return Math.floor(50 * Math.pow(level+1, 2.500));
        default:
            throw new Error("Invalid index");
    }
}

const cells = Array.from(document.querySelectorAll("#table-1 th"));
const isSac = cells.map(cell => cell.textContent.trim() === "Sac ");

// START

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
        if (isDragging) {
            let targetCell = event.target.closest("th"); 
            if (targetCell) toggleCell(targetCell,index);
        }
    });
});

function toggleCell(cell,index) {
    let targetText = cell.querySelector(".table-1-text");
    if (targetText.textContent === "Sac ") {
        targetText.innerHTML = 'Sell <img src="media/owo_images/cowoncy.png" style="width:1rem; margin-bottom:-0.2rem;">'; 
        isSac[index]=false;
    } else {
        targetText.innerHTML = 'Sac <img src="media/owo_images/essence.gif" style="width:1rem; margin-bottom:-0.2rem;">';
        isSac[index]=true;
    }
    drawData();
}

// END



document.getElementById("patreonCheck").addEventListener("change", function() {
    patreon=this.checked; 
    drawData();


});



document.addEventListener("DOMContentLoaded", () => {
    for (let i = 0; i < 6; i++) {
        const container = document.getElementById(`inputContainer${i + 1}`);
        
        if (container) {
            const wrapper = document.createElement("div");
            const input = document.createElement("input");
            input.type = "number";
            input.value = 0;
            input.min = 0; 
            input.max = maxValues[i];
            input.onchange = function() {
                modifyValueDirect(i, parseInt(this.value));
            };


            input.id = `num${i}`;
            input.className="calculatorInput no-arrows";

            
            const span =document.createElement("span");
            span.textContent="Lvl";
            span.className="calculatorLevel";

            const tooltip = document.createElement("span");
            tooltip.innerHTML = getUpgradeCost(i, 0).toLocaleString();
            tooltip.className="tooltip-text";


            const btnPlus = document.createElement("button");
            btnPlus.textContent = ">";
            btnPlus.onclick = () => modifyValue(i, 1);
            btnPlus.className ="tooltip";
            btnPlus.appendChild(tooltip);

            const btnMinus = document.createElement("button");
            btnMinus.textContent = "MIN";
            btnMinus.onclick = () => modifyValue(i, -1);

            const minusSpan = document.createElement("span");
            minusSpan.innerHTML = "&nbsp";
            minusSpan.style.padding = "0";

            const plusSpan = document.createElement("span");
            plusSpan.innerHTML = "&nbsp";
            plusSpan.style.padding = "0";

            wrapper.style.display = "flex";
            wrapper.style.alignItems= "center";

            wrapper.appendChild(btnMinus);
            wrapper.appendChild(minusSpan);
            wrapper.appendChild(span);
            wrapper.appendChild(input);
            wrapper.appendChild(plusSpan);
            wrapper.appendChild(btnPlus);
            container.appendChild(wrapper);
        }
    }
});

function modifyValueDirect(index, value) {
    const input = document.getElementById(`num${index}`);
    const plus_span = input.nextElementSibling;
    const btnPlus = plus_span.nextElementSibling;
    const span = input.previousElementSibling;
    const minus_span = span.previousElementSibling;
    const btnMinus = minus_span.previousElementSibling;

    const tooltip = document.createElement("span");
          tooltip.className="tooltip-text";


    if (input) {
        
        if (value >= maxValues[index] ) {
            btnPlus.textContent = "MAX";
            input.value = maxValues[index];

            tooltip.innerHTML = "<s>" + getUpgradeCost(index, parseInt(input.value)).toLocaleString() + "</s>";

        } else {
            btnPlus.textContent = ">";
            tooltip.innerHTML = getUpgradeCost(index, parseInt(input.value)).toLocaleString();

        }

        if (value <= 0) {
            btnMinus.textContent = "MIN";
            input.value =0;
        } else {
            btnMinus.textContent = "<";
        }

        btnPlus.appendChild(tooltip);
        updateLevel(index, parseInt(input.value));

    }
}

function modifyValue(index, change) {
    const input = document.getElementById(`num${index}`);
    const plus_span = input.nextElementSibling;
    const btnPlus = plus_span.nextElementSibling;
    const span = input.previousElementSibling;
    const minus_span = span.previousElementSibling;
    const btnMinus = minus_span.previousElementSibling;

    const tooltip = document.createElement("span");
          tooltip.className="tooltip-text";

    if (input) {
        let newValue = parseInt(input.value) + change;
        
        if (newValue <= input.min) {
            newValue = input.min;
            btnMinus.textContent = "MIN";
        } else {
            btnMinus.textContent = "<";
        }

        if (newValue >= input.max) {
            newValue = input.max;
            btnPlus.textContent = "MAX";
            input.value = newValue;
            tooltip.innerHTML = "<s>" + getUpgradeCost(index, parseInt(input.value)).toLocaleString() + "</s>";
        } else {
            btnPlus.textContent = ">";
            input.value = newValue;
            tooltip.innerHTML = getUpgradeCost(index, parseInt(input.value)).toLocaleString();
        }
        btnPlus.appendChild(tooltip);

        updateLevel(index, parseInt(input.value));
    }
}

function updateLevel(index, value){
    switch (index){
        case 0:
            efficiency=value;

        break;
        case 1:
            duration= value;

        break;
        case 2:
            cost= value;

        break;
        case 3:
            gain= value;

        break;
        case 4:
            exp= value;

        break;
        case 5:
            radar= value;

    }
    drawData();


}

function drawData(){
    
    efficiencyHeader.textContent="⏱ Efficiency - " + (efficiency+25) + "/h";
    let hours = (duration/10+0.5);
    durationHeader.textContent="⏳ Duration - "+hours+"h"
    costHeader.textContent="Cost - "+ (10-cost) +" cowoncy";
    gainHeader.textContent="🔧 Gain - "+ (gain*25)+" ess/h";
    expHeader.textContent="⚔ Experience - "+ (exp*35) +" exp/h";
    radarHeader.textContent= (radar*0.04).toFixed(2)+"ppm";

    if (efficiency == maxValues[0]){
        efficiencyRow.style="text-decoration: line-through;";
    }else{
        efficiencyRow.style="text-decoration: none;";
    }
    efficiencyCost.textContent=getUpgradeCost(0,efficiency).toLocaleString();
    let dailyPets = ((efficiency+25)*24);
    efficiencyOutput1.textContent=dailyPets.toLocaleString()+" pets/day";
    let hbPets = Math.floor((efficiency+25)*hours);
    efficiencyOutput2.textContent=hbPets.toLocaleString()+" pets/hb";

    costOutput1.textContent="-"+(dailyPets*(10-cost)).toLocaleString()+" owo/day";
    costOutput2.textContent="-"+(hbPets*(10-cost)).toLocaleString()+" owo/hb";   

    gainOutput1.textContent=(gain*25*24).toLocaleString()+" ess/day";
    gainOutput2.textContent=(Math.floor(gain*25*hours)).toLocaleString()+" ess/hb";   

    expOutput1.textContent=(exp*35*24).toLocaleString()+" exp/day";
    expOutput2.textContent=(Math.floor(exp*35*hours)).toLocaleString()+" exp/hb";   

    let noBot = 1 - (0.00000004*radar);
    //console.log("noBot: "+ noBot);
    //console.log("noBot^10: "+ Math.pow(noBot, 5000));

    radarOutput1.textContent="weekly bot: "+(100-100*Math.pow(noBot, dailyPets*7)).toFixed(1)+"%";
    radarOutput2.textContent="monthly bot: "+(100-100*Math.pow(noBot, dailyPets*30)).toFixed(1)+"%";
    
    if (gain == maxValues[3]){
        gainRow.style="text-decoration: line-through;";
    }else{
        gainRow.style="text-decoration: none;";
    }
    gainCost.textContent=getUpgradeCost(3,gain).toLocaleString();


    
    if (radar == maxValues[5]){
        radarRow.style="text-decoration: line-through;";
    }else{
        radarRow.style="text-decoration: none;";
    }
    radarCost.textContent=getUpgradeCost(5,radar).toLocaleString();

    petWorthSell.textContent = getWorth()[1].toFixed(2).toLocaleString() +" owo/pet"; 
    petWorthProfit.textContent = "Profit: "+(getWorth()[1]-10+cost).toFixed(2).toLocaleString() +" owo/pet"; 
    petWorthSac.textContent = getWorth()[0].toFixed(2).toLocaleString() +" ess/pet"; 

    hbWorthSell.textContent = Number((getWorth()[1]*hbPets).toFixed(0)).toLocaleString() +" owo/hb"; 
    hbWorthProfit.textContent = "Profit: "+Number(((getWorth()[1]-10+cost)*hbPets).toFixed(0)).toLocaleString() +" owo/hb";     
    hbWorthSac.textContent = Number((getWorth()[0]*hbPets).toFixed(0)).toLocaleString() +" ess/hb"; 


    efficiencyEssence.textContent= "+"+Number((getWorth()[0]*24).toFixed(1)).toLocaleString()+" ess/day";
    efficiencyROI.textContent=Number((getWorth()[0]*24/getUpgradeCost(0,efficiency)*100).toFixed(1)).toLocaleString() + "%/day";

    
    gainROI.textContent=Number((600/getUpgradeCost(3,gain)*100).toFixed(1)).toLocaleString() + "%/day";
    
    let radarUpg = 0;
    if (isSac[8]){
        radarUpg = 0.00000004*petWorth[8][1]*dailyPets;
    }if(isSac[0]){
        radarUpg -= (petRates()[8]*dailyPets);
    }

    radarEssence.textContent="+"+Number(radarUpg.toFixed(1)).toLocaleString() + " ess/day";

    radarROI.textContent=Number((radarUpg/getUpgradeCost(5,radar)*100).toFixed(1)).toLocaleString() + "%/day";

 
}