import { loadJson } from "./util/jsonUtil.js";
import { make } from "./util/injectionUtil.js";

const weaponDisplay ={
    image: document.getElementById("weaponImage"),
    text: document.getElementById("weaponText")
}

const customStatTexts = {
    "Orb of Potency": 'none,<br> but two passives!',
    "Physically Attacking": 'none,<br> not actually a weapon!'
};

const weaponContainer= document.getElementById("weaponContainer");

const buttons ={
    previous:document.getElementById("previous"),
    next:    document.getElementById("next")
}

const weapons = await loadJson("/json/weapons.json");
var currentWeaponID = fromWeaponString(location.hash.slice(1));

if (document.readyState==="loading")
    document.addEventListener("DOMContentLoaded", main);
else 
    main();

window.addEventListener("hashchange", ()=>{
    currentWeaponID = fromWeaponString(location.hash.slice(1));
    updateWeaponDisplay();
});

function fromWeaponString(query){
    const defaultWeaponID = 1;
    const idx = weapons.findIndex(weapon => weapon.slug == query);
    return idx == -1 ? defaultWeaponID : idx;
}

function main(){
    updateWeaponDisplay();
    buttons.next.addEventListener("click", ()=>swapWeapon(+1));
    buttons.previous.addEventListener("click", ()=>swapWeapon(-1));
}

function updateWeaponDisplay(){
    const weapon = weapons[currentWeaponID];
    history.replaceState(null, "", "#"+weapon.slug);

    weaponDisplay.text.textContent = (weapon.id ?? "???") + " - "+ (weapon.aliases[0] ?? weapon.name);
    weaponDisplay.image.src = `media/owo_images/${weapon.slug}.png`;

    fetch(`donatorPages/weapons/${weapon.slug}.html`)
        .then(async r => {
            weaponContainer.innerHTML = await r.text();
            createWikipediaContainer(weapon);
        })    
}

function createWikipediaContainer(weapon){
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
    
    const makeAliasString = aliases => aliases[0]
        ? "aliases: " + weapon.aliases.join(", ")
        : "";

    const calcLink = make("div",{
        className:"wikipedia-calc-link",
        innerHTML: weapon.objectType == "weapon"
            ?`<a href="/weaponcalculator.html#${weapon.slug}">Calculator</a>`
            :""
    });

    wikipediaContainer.append(
        make("div",{className:"wikipedia-header"},[
            weapon.name,
            make("div",{className:"wikipedia-aliases"},[makeAliasString(weapon.aliases)])
        ]),
        make("img",{className:"wikipedia-image", src:`media/owo_images/${weapon.slug}.png`}),
        make("div", {className:"wikipedia-stars"},weapon.wikiStars.map(makeStarDisplay)),
        make("div",{className:"wikipedia-id"}, [
            make("div",{innerHTML:"ID: " + (weapon.id ?? "???")})
        ]),
        make("div",{className:"wikipedia-stats-header", textContent:"Stats"}),
        createWikipediaTable(weapon),
        calcLink
    );
}

function createWikipediaTable(weapon){
    if (customStatTexts[weapon.name]){
        return make("div",{
            className:"wikipedia-nostat",
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

function swapWeapon(change) {
    currentWeaponID = (currentWeaponID + change + weapons.length) % weapons.length;
    updateWeaponDisplay();
}