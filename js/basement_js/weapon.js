import { loadJson } from "./util/jsonUtil.js";

const weaponDisplay ={
    image: document.getElementById("weaponImage"),
    text: document.getElementById("weaponText")
}

const customStatTexts = {
    106: 'none,<br> but two passives!',
    100: 'none,<br> not actually a weapon!'
};

const weaponContainer= document.getElementById("weaponContainer");

const buttons ={
    previous:document.getElementById("previous"),
    next:    document.getElementById("next")
}

var weapons;
var weaponIDs; 
var currentWeaponID = 100; // init id

function importFromHash(){
    const hash = window.location.hash;
    if (hash) {
        const value = decodeURIComponent(hash.slice(1));
        currentWeaponID = Number(value);
    }
}

function updateWeaponDisplay(){
    const weapon = weapons[currentWeaponID];
    var weaponShorthand= weapon.aliases[0]? weapon.aliases[0]: weapon.name;
    weaponShorthand = weaponShorthand.toLowerCase();

    if (weapon.objectType!="weapon"){
        //exception for fists, because they don't really have any ID
        weaponDisplay.text.textContent= `??? - fists`;
    }else{
        weaponDisplay.text.textContent= `${currentWeaponID} - ${weaponShorthand}`;
    }
    weaponDisplay.image.src= `media/owo_images/f_${weaponShorthand}.png`;

    fetch(`donatorPages/weapons/${currentWeaponID}.html`)
        .then(r => r.text())
        .then(html => weaponContainer.innerHTML = html)
        .then(()=>{
            createWikipediaContainer(weapon,weaponShorthand);
        })
}

function createWikipediaContainer(weapon,weaponShorthand){
    const wikipediaContainer = weaponContainer.querySelector("#wikipedia");
    
    const wikipediaHeader = document.createElement("div");
    wikipediaHeader.className="wikipedia-header";
    wikipediaHeader.innerHTML= "<b>"+weapon.name + "</b><br>";

    const wikipediaAliases = document.createElement("span");
    wikipediaAliases.style="font-size: 0.9rem; color:#999;";
    if(weapon.aliases[0]) {
        wikipediaAliases.innerHTML= "aka: " + weapon.aliases.join(", ");
    }
    wikipediaHeader.appendChild(wikipediaAliases);

    const wikipediaImage = document.createElement("img");
    wikipediaImage.src=`media/owo_images/f_${weaponShorthand}.png`;
    wikipediaImage.style="width:60%; padding: 0.5rem;";

    const renderStars = v =>
        [...Array(5)]
            .map((_, i) => (v > i ? "&starf;" : "&star;"))
            .join("");
    const wikipediaStars = document.createElement("div");
    wikipediaStars.style.marginBottom = ".5rem";
    wikipediaStars.innerHTML =
        `<span style="font-size:.85rem;">Viability:</span> ${renderStars(weapon.wikiStars.viability)}` +
        `<br><span style="font-size:.85rem;">Ease of use:</span> ${renderStars(weapon.wikiStars.ease)}`;
    
    const IDwrapper = document.createElement("div");
    IDwrapper.style="padding: 0 0.5rem;";
    IDwrapper.innerHTML= "ID: " + 
                        (weapon.objectType=="weapon"? currentWeaponID : "none");
    const wikipediaID = document.createElement("div");
    wikipediaID.className="wikipedia-id";
    wikipediaID.append(IDwrapper);
    
    var wikipediaTable = createWikipediaTable(weapon);
    if (customStatTexts[currentWeaponID]){
        wikipediaTable= document.createElement("div");
        wikipediaTable.style="margin:1rem 0 0.5rem 0;";
        wikipediaTable.innerHTML = customStatTexts[currentWeaponID];
    }
    
    const wikipediaStatsHeader = document.createElement("div");
    wikipediaStatsHeader.className="wikipedia-stats-header";
    wikipediaStatsHeader.textContent="Stats";

    const calcLink = document.createElement("div");
    if (currentWeaponID!=100){
        calcLink.style="padding: 0.5rem;";
        calcLink.innerHTML= `<a href="/weaponcalculator.html#${currentWeaponID}">Calculator</a>`;
    }
    
    wikipediaContainer.append(wikipediaHeader, wikipediaImage,wikipediaStars,wikipediaID,wikipediaStatsHeader,wikipediaTable,calcLink);
}

function createWikipediaTable(weapon){
    const wikipediaTable = document.createElement("table");
    wikipediaTable.style = "width:100%; border-top:none; table-layout: fixed;";
    const tableBody = document.createElement("tbody");
    wikipediaTable.append(tableBody);
    const rankHeader = document.createElement("tr");
    rankHeader.style= "height: 1rem"
    tableBody.append(rankHeader);

    ["common","fabled"].forEach(rank =>{
        const cell = document.createElement("th");
        cell.style = "border:none;";
        const wrapper = document.createElement("div");
        wrapper.style= "display:flex; justify-content: center; font-weight: normal; font-size: 0.75rem; margin-bottom: -0.4rem;";
        const image = document.createElement("img");
        image.style = "width:0.8rem; height: 0.8rem;";
        image.src = rank == "common"? "media/owo_images/common.png":"media/owo_images/fabled.gif";
        rankHeader.append(cell);
        cell.append(wrapper);
        wrapper.append(image);
        wrapper.innerHTML += rank == "common"? "&hairsp; 0%":"&hairsp; 100%";
    });

    weapon.statConfig.forEach(stat=>{
        const statRow = document.createElement("tr");
        statRow.class= "wikipedia-stat-row";  
        tableBody.append(statRow);              
    
        [stat.min,stat.max].forEach(extreme=>{
            const cell = document.createElement("th");
            const wrapper = document.createElement("div");
            wrapper.style= "display:flex; justify-content: center; align-items: center; font-weight: normal;";
            wrapper.innerHTML = extreme;
            
            stat.emoji.forEach(emoji=>{
                const image = document.createElement("img");
                image.style = "width:1rem; height: 1rem;";
                image.src = `media/owo_images/${emoji}.png`;
                image.onerror = function () {
                    this.onerror = null; 
                    this.src = `media/owo_images/${emoji}.gif`;
                };
                image.title = emoji;
                wrapper.append(image);
            });

            statRow.append(cell);
            cell.append(wrapper);
        });
    });
    return wikipediaTable;
}

async function main(){
    weapons = await loadJson("/json/weapons.json");
    weaponIDs = Object.keys(weapons).map(Number); 
    pageNewLoad();
    buttons.next.addEventListener("click", ()=>swapWeapon(+1));
    buttons.previous.addEventListener("click", ()=>swapWeapon(-1));
}

function pageNewLoad(){

    importFromHash();
    updateWeaponDisplay();
}

function swapWeapon(change) {
  const ids = weaponIDs;
  const currentIndex = ids.indexOf(currentWeaponID);
  const newIndex = (currentIndex + change + ids.length) % ids.length;
  currentWeaponID = ids[newIndex];

  history.replaceState(null, '', location.pathname);
  updateWeaponDisplay();
}

document.addEventListener("DOMContentLoaded", main);
window.addEventListener("hashchange", pageNewLoad);