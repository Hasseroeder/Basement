import { loadJson } from "./util/jsonUtil.js";
import { capitalizeFirstLetter } from "./util/stringUtil.js";
import { make } from "./util/injectionUtil.js";

const weaponDisplay ={
    image: document.getElementById("weaponImage"),
    text: document.getElementById("weaponText")
}

const customStatTexts = {
    "Orb of Potency": 'none,<br> but two passives!',
    "Fists": 'none,<br> not actually a weapon!'
};

const weaponContainer= document.getElementById("weaponContainer");

const buttons ={
    previous:document.getElementById("previous"),
    next:    document.getElementById("next")
}

var weapons;
var weaponIDs; 
var currentWeaponID = 1; // init id

function importFromHash(){
    const hash = window.location.hash;
    if (hash) {
        const newID = Number(hash.slice(1))-100;
        if (newID>=0 && newID<weapons.length)
            currentWeaponID = newID;
    }
}

function updateWeaponDisplay(){
    const weapon = weapons[currentWeaponID];
    const weaponShorthand = (weapon.aliases[0]?? weapon.name)
                            .toLowerCase();

    weaponDisplay.text.textContent  = (weapon.showThisID? weapon.id : "???")
                                    + " - " 
                                    + capitalizeFirstLetter(weaponShorthand);
    weaponDisplay.image.src= `media/owo_images/f_${weaponShorthand}.png`;

    fetch(`donatorPages/weapons/${weapon.id}.html`)
        .then(r => r.text())
        .then(html => weaponContainer.innerHTML = html)
        .then(()=>{
            createWikipediaContainer(weapon,weaponShorthand);
        })
}

function createWikipediaContainer(weapon,weaponShorthand){
    const wikipediaContainer = weaponContainer.querySelector("#wikipedia");
    const renderStars = v =>
        [...Array(5)]
            .map((_, i) => (v > i ? "&starf;" : "&star;"))
            .join("");

    const makeStarDisplay = statistic =>
        make("div",{
            innerHTML:
                "<span>"+statistic.name+"</span>"
                +renderStars(statistic.stars)
        });
    
    const makeAliasString = aliases =>
        aliases[0]
            ? "aliases: " + weapon.aliases.join(", ")
            : "";

    const calcLink = make("div",{
        className:"wikipedia-calc-link",
        innerHTML: `<a href="/weaponcalculator.html#${weaponShorthand}">Calculator</a>`
    });

    wikipediaContainer.append(
        make("div",{className:"wikipedia-header"},[
            weapon.name,
            make("div",{className:"wikipedia-aliases"},[makeAliasString(weapon.aliases)])
        ]),
        make("img",{className:"wikipedia-image", src:`media/owo_images/f_${weaponShorthand}.png`}),
        make("div", {className:"wikipedia-stars"},weapon.wikiStars.map(makeStarDisplay)),
        make("div",{className:"wikipedia-id"}, [
            make("div",{innerHTML:"ID: " + (weapon.showThisID? weapon.id : "???")})
        ]),
        make("div",{className:"wikipedia-stats-header", textContent:"Stats"}),
        createWikipediaTable(weapon),
        weapon.showThisID? calcLink : ""
    );
}

function createWikipediaTable(weapon){
    if (customStatTexts[weapon.name]){
        return make("div",{
            className:".wikipedia-nostat",
            innerHTML: customStatTexts[weapon.name]
        })
    }

    const table = make("div",{className:"wikipedia-table"});
    const rankHeader = make("div");
    table.append(rankHeader);

    ["common.png","fabled.gif"].forEach(rank => rankHeader.append(
        make("div",{className:"wikipedia-stat-header"},[
            make("img",{src:"media/owo_images/"+rank}),
            rank == "common.png"? "0%":"100%"
        ])
    ));

    const makeImg = emoji => make("img",{
        src:`media/owo_images/${emoji}.png`, title: emoji,
        onerror: function () {
            this.onerror = null; 
            this.src = `media/owo_images/${emoji}.gif`;
        }
    });

    weapon.statConfig.forEach(stat=>
        table.append(make("div",{className:"wikipedia-stat-row"},
            [stat.min,stat.max].map(extreme=>
                make("div",
                    {textContent: extreme + stat.unit},
                    stat.emoji.map(makeImg)
                )
            )
        )
    ));
    return table;
}

async function main(){
    weapons = await loadJson("/json/weapons.json");
    weaponIDs = Object.keys(weapons).map(Number); 
    pageLoad();
    buttons.next.addEventListener("click", ()=>swapWeapon(+1));
    buttons.previous.addEventListener("click", ()=>swapWeapon(-1));
}

function pageLoad(){
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
window.addEventListener("hashchange", pageLoad);