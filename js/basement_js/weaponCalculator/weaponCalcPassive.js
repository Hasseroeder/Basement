import { loadJson } from '../util/jsonUtil.js';
import { generateDescription }  from '../weaponCalculator/weaponCalcMessageGenerator.js'

var passives;

export async function initiatePassiveStuffs(weapon){
    const gridContainer = document.querySelector('.passiveGrid');
    const listContainer = document.querySelector('.passiveContainer');
    passives = await loadJson("../json/passives.json");

    Object.entries(passives).forEach(([id, passive]) => {
        const img = document.createElement('img');
        img.className = 'passiveGridImage';
        img.src = `media/owo_images/f_${passive.shorthand}.png`;
        img.dataset.passiveId = id;
        img.alt = passive.shorthand;
        img.title = passive.shorthand;
        img.addEventListener('click', () => {
            // something in here
        });
        gridContainer.appendChild(img);
    });

    displayPassives(listContainer, weapon);
    //console.log(weapon);
}

function displayPassives(container,weapon){
    container.innerHTML="";

    if (weapon.product.blueprint.passive.length == 0) appendNoPassiveSpan(container);
    else appendPassive(container, weapon.product.blueprint.passive[0]);

}

function appendNoPassiveSpan(container){
    const span = document.createElement("span");
    span.innerHTML="<b>Passives:</b> none";
    container.append(span);
    // <span><b>Passives:</b> none</span> 
}

function appendPassive(container, passive){
    const passiveConfig = passives[passive.id];
    Object.assign(passive, passiveConfig);
    console.log(passive);

    container.append(generateDescription(passive,container));
}