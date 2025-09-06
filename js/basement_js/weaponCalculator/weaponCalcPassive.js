import { loadJson } from '../util/jsonUtil.js';
import { generateDescription, generateEverything,displayInfo }  from '../weaponCalculator/weaponCalcMessageGenerator.js'
import { getWeaponImage,fillMissingWeaponInfo,applyWearToWeapon } from './weaponCalcUtil.js';

var passives;

export async function initiatePassiveStuffs(weapon){
    const gridContainer = document.querySelector('.passiveGrid');
    const listContainer = document.querySelector('.passiveContainer');
    passives = await loadJson("../json/passives.json");

    Object.entries(passives).forEach(([id, passive]) => {
        const img = document.createElement('img');
        img.className = 'passiveGridImage';
        img.src = `media/owo_images/f_${passive.aliases[0]}.png`;
        img.dataset.passiveId = id;
        img.alt = passive.aliases[0];
        img.title = passive.aliases[0];
        img.addEventListener('click', () => {
            const statCount = passives[id].statConfig.length;
            const newPassive = {
                id: id,
                stats: Array.from({ length: statCount }, () => ({})),
                ...passives[id]
            }
            weapon.product.blueprint.passive.push(newPassive);
            fillMissingWeaponInfo(weapon);		
            applyWearToWeapon(weapon,weapon.product.blueprint.wear);
            //generateEverything(weapon);
            displayInfo(weapon);
            generatePassiveInputs(weapon);
        });
        gridContainer.appendChild(img);
    });
}

export function generatePassiveInputs(weapon) {
    const listContainer = document.querySelector(".passiveContainer");
    const fragment = document.createDocumentFragment();

    if (weapon.product.blueprint.passive.length === 0) {
        appendNoPassiveSpan(fragment);
    } else {
        weapon.product.blueprint.passive.forEach(passive =>
            appendPassive(fragment, weapon, passive)
        );
    }
    listContainer.innerHTML = "";
    listContainer.appendChild(fragment);
}

function appendNoPassiveSpan(container){
    const span = document.createElement("span");
    span.innerHTML="<b>Passives:</b> none";
    container.append(span);
    // <span><b>Passives:</b> none</span> 
}

function appendPassive(container,weapon, passive){
    const wrapper = document.createElement("div");
    wrapper.style="display:inline;";
    const passiveConfig = passives[passive.id];
    Object.assign(passive, passiveConfig);

    const image = getWeaponImage(passive);
    image.className = 'discord-embed-emote';
    image.style.margin = "0 0.1rem 0.15rem 0";
    passive.image = image;

    wrapper.append(image,generateDescription(passive,weapon))
    container.append(wrapper);
}