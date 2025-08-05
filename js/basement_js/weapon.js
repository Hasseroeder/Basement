let   currentWeaponID = 100;

const weaponDisplay ={
    image: document.getElementById("weaponImage"),
    text: document.getElementById("weaponText")
}

const weaponContainer= document.getElementById("weaponContainer");

const buttons ={
    previous:document.getElementById("previous"),
    next:    document.getElementById("next")
}

const weapons = {
    100:{
        name:"Physically Attacking",
        aliases:["Fists","Strength Attacking"],
        viability:0,
        ease:0,
        stats:[],
    },
    101:{
        name:"Greatsword",
        aliases:["Sword","Gsword"],
        viability:1,
        ease:4,
        stats:[
            ["200","100","WP"],
            ["35%","55%","Str"]
        ],
    },
    102:{
        name:"Healing Staff",
        aliases:["Hstaff","Healstaff"],
        viability:0,
        ease:2,
        stats:[
            ["225","150","WP"],
            ["100%","150%","Mag"]
        ],
    },
    103:{
        name:"Bow",
        aliases:[],
        viability:4,
        ease:3,
        stats:[
            ["220","120","WP"],
            ["110%","160%","Str"]
        ],
    },
    104:{
        name:"Rune of the Forgotten",
        aliases:["Rune"],
        viability:4,
        ease:3,
        stats:[
            ["5%","15%","stat_increase"]
        ],
    },
    105:{
        name:"Defender's Aegis",
        aliases:["Shield","Aegis"],
        viability:5,
        ease:5,
        stats:[
            ["250","150","WP"],
            ["30%","50%","taunt"]
        ],
    },
    106:{
        name:"Orb of Potency",
        aliases:["Orb"],
        viability:1,
        ease:1,
        stats:[],
    },
    107:{
        name:"Vampiric Staff",
        aliases:["Vstaff","Vampstaff"],
        viability:1,
        ease:2,
        stats:[
            ["200","100","WP"],
            ["25%","45%","Mag"]
        ],
    },
    108:{
        name:"Poison Dagger",
        aliases:["Dagger","Pdag"],
        viability:3,
        ease:4,
        stats:[
            ["200","100","WP"],
            ["70%","100%","Str"],
            ["40%","65%","Mag","poison"]
        ],
    },
    109:{
        name:"Wand of Absorption",
        aliases:["Wand","Awand"],
        viability:4,
        ease:0,
        stats:[
            ["250","150","WP"],
            ["80%","100%","Mag"],
            ["20%","40%","wp_transfer"]
        ],
    },
    110:{
        name:"Flame Staff",
        aliases:["Fstaff"],
        viability:1,
        ease:2,
        stats:[
            ["200","100","WP"],
            ["75%","95%","Mag"],
            ["20%","40%","Mag","flame"],
            ["60%","80%","Mag","explosion"],
        ],
    },
    111:{
        name:"Energy Staff",
        aliases:["Estaff"],
        viability:4,
        ease:3,
        stats:[
            ["200","100","WP"],
            ["35%","65%","Mag"],
        ],
    },
    112:{
        name:"Spirit Staff",
        aliases: ["Sstaff"],
        viability:4,
        ease:4,
        stats:[
            ["225","125","WP"],
            ["30%","50%","Mag"],
            ["20%","30%","defup"],
        ],
    },
    113:{
        name:"Arcane Scepter",
        aliases: ["Scepter", "Ascept"],
        viability:0,
        ease:0,
        stats:[
            ["200","125","WP"],
            ["40%","70%","Mag"],
        ],
    },
    114:{
        name:"Resurrection Staff",
        aliases:["Rstaff"],
        viability:5,
        ease:5,
        stats:[
            ["400","300","WP"],
            ["50%","80%","Mag"],
        ],
    },
    115:{
        name:"Glacial Axe",
        aliases:["Axe", "Gaxe"],
        viability:3,
        ease:2,
        stats:[            
            ["280","180","WP"],
            ["20%","40%","Str"]
        ],
    },
    116:{
        name:"Vanguard's Banner",
        aliases:["Banner","Vban"],
        viability:0,
        ease:1,
        stats:[
            ["300","250","WP"],
            ["15%","25%","attup"],
            ["25%","35%","attup+"],
            ["40%","50%","attup++"],
        ],
    },
    117:{
        name:"Culling Scythe",
        aliases:["Scythe","Cscythe"],
        viability:5,
        ease:2,
        stats:[
            ["200","100","WP"],
            ["70%","100%","Str"],
            ["45%","75%","mort"],
        ],
    },
    118:{
        name:"Rune of Celebration",
        aliases:["Crune","Roc"],
        viability:5,
        ease:3,
        stats:[
            ["200","100","WP"],
            ["20%","50%","iPR"],
            ["15%","40%","iMR"],
        ],
    },  
    119:{
        name: "Staff of Purity",
        aliases: ["Pstaff"],
        viability:4,
        ease:2,
        stats:[
            ["200","100","WP"],
            ["50%","100%","Str"],
            ["50%","100%","Mag"],    
        ],
    },
    120:{
        name: "Leeching Scythe",
        aliases: ["Lscythe"],
        viability:5,
        ease:2,
        stats:[
            ["230","130","WP"],
            ["50%","80%","Str"],
            ["+40%","+60%","Str"],
            ["30%","60%","leech_hp"],
            ["30%","60%","leech_wp"],
        ],
    },
    121:{
        name:"Foul fish",
        aliases:["Ffish"],
        viability:5,
        ease:1,
        stats:[
            ["280","180","WP"],
            ["50%","80%","Str"],
            ["20%","50%","Mag"],
        ],
    },
    122:{
        name: "Rune of Luck",
        aliases: ["Lrune"],
        viability:0,
        ease:1,
        stats:[
            ["200","100","WP"],
            ["1%","40%","StrMag"],
            ["1%","40%","StrMag"],
            ["1%","40%","StrMag"],
            ["1%","40%","StrMag"],
            ["1%","40%","StrMag"],
        ],
    }
}

function importFromHash(){
    const hash = window.location.hash;
    if (hash) {
        const value = decodeURIComponent(hash.slice(1));
        currentWeaponID = Number(value);
    }
}

function updateWeaponDisplay(){
    const weapon = weapons[currentWeaponID];
    const weaponShorthand= weapon.aliases[0]? weapon.aliases[0]: weapon.name;

    if (currentWeaponID == 100){
        //exception for fists, because they don't really have any ID, nor image
        weaponDisplay.text.textContent= `??? - Fists`;
    }else{
        weaponDisplay.text.textContent= `${currentWeaponID} - ${weaponShorthand}`;
    }
    weaponDisplay.image.src= `media/owo_images/f_${weaponShorthand.toLowerCase()}.png`;

    fetch(`donatorPages/weapons/${currentWeaponID}.html`)
        .then(r => r.text())
        .then(html => weaponContainer.innerHTML = html)
        .then(()=>{
                    
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

            const wikipediaStars= document.createElement("div");
            wikipediaStars.style="margin-bottom:0.5rem;";
            wikipediaStars.innerHTML= `<span style="font-size: 0.85rem;">Viability:</span> `
            for (var i = 0; i<5; i++){
                wikipediaStars.innerHTML+= weapon.viability>i?"&starf;":"&star;";
            }
            wikipediaStars.innerHTML+= `<br><span style="font-size: 0.85rem;">Ease of use:</span> `
            for (var i = 0; i<5; i++){
                wikipediaStars.innerHTML+= weapon.ease>i?"&starf;":"&star;";
            }
            
            const IDwrapper = document.createElement("div");
            IDwrapper.style="padding: 0 0.5rem;";
            IDwrapper.innerHTML= "ID: " + 
                                (currentWeaponID == 100?
                                "none <br> not actually a weapon":
                                currentWeaponID);
            const wikipediaID = document.createElement("div");
            wikipediaID.className="wikipedia-id";
            wikipediaID.append(IDwrapper);
            
            var wikipediaTable = createWikipediaTable(weapon);
            if (!weapon.stats[0]){
                wikipediaTable= document.createElement("div");
                wikipediaTable.innerHTML+=currentWeaponID==106?"none,<br> but two passives!":"none!";
                wikipediaTable.style="margin:1rem 0 0.5rem 0;";
            }
            
            const wikipediaStatsHeader = document.createElement("div");
            wikipediaStatsHeader.className="wikipedia-stats-header";
            wikipediaStatsHeader.textContent="Stats";

            wikipediaContainer.append(wikipediaHeader, wikipediaImage,wikipediaStars,wikipediaID,wikipediaStatsHeader,wikipediaTable);
        })
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

    weapon.stats.forEach(stat=>{
        const statRow = document.createElement("tr");
        statRow.class= "wikipedia-stat-row";  
        tableBody.append(statRow);              
    
        [stat[0],stat[1]].forEach(extreme=>{
            const cell = document.createElement("th");
            const wrapper = document.createElement("div");
            wrapper.style= "display:flex; justify-content: center; font-weight: normal;";
            wrapper.innerHTML = extreme;
            
            [stat[2],stat[3]].forEach(emoji=>{
                if (emoji){
                    const image = document.createElement("img");
                    image.style = "width:1rem; height: 1rem;";
                    image.src = `media/owo_images/${emoji}.png`;
                    image.title = emoji;
                    wrapper.append(image);
                }
            });

            statRow.append(cell);
            cell.append(wrapper);
        });
    });
    return wikipediaTable;
}

function main(){
    pageNewLoad();
    buttons.next.addEventListener("click", ()=>swapWeapon(+1));
    buttons.previous.addEventListener("click", ()=>swapWeapon(-1));
}

function pageNewLoad(){

    importFromHash();
    updateWeaponDisplay();
}

function swapWeapon (change){
    wantToSwapTo = currentWeaponID + change;
    if (weapons[wantToSwapTo]){
        currentWeaponID = wantToSwapTo;
        updateWeaponDisplay();
    }
}

document.addEventListener("DOMContentLoaded", main);
window.addEventListener("hashchange", pageNewLoad);