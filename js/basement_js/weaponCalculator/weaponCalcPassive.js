import { loadJson } from '../util/jsonUtil.js';
import { generateDescription, generateEverything,displayInfo }  from '../weaponCalculator/weaponCalcMessageGenerator.js'
import { getWeaponImage,fillMissingWeaponInfo,applyWearToWeapon } from './weaponCalcUtil.js';

var passives;

export async function initiatePassiveStuffs(weapon){
    const gridContainer = document.querySelector('.passiveGrid');
    passives = await loadJson("../json/passives.json");

    Object.entries(passives).forEach(([id, passive]) => {
        const img = document.createElement('img');
        img.className = 'passiveGridImage';
        img.src = `media/owo_images/f_${passive.aliases[0]}.png`;
        img.dataset.passiveId = id;
        img.alt = passive.aliases[0];
        img.title = passive.aliases[0];
        img.addEventListener('click', () => generateNewPassive(id,weapon));
        gridContainer.appendChild(img);
    });
}

function generateNewPassive(id, weapon){
    const newPassive = giveMeNewPassive(id);
    weapon.product.blueprint.passive.push(newPassive);
    fillMissingWeaponInfo(weapon);
    applyWearToWeapon(weapon,weapon.product.blueprint.wear);
    displayInfo(weapon);
    generatePassiveInputs(weapon);
}

function giveMeNewPassive(id){
    return {
        id,
        stats: passives[id].statConfig.map(() => ({})),
        ...passives[id]
    };
}

export function generatePassiveInputs(weapon) {
    const listContainer = document.querySelector(".passiveContainer");
    const fragment = document.createDocumentFragment();

    if (weapon.product.blueprint.passive.length === 0) {
        fragment.innerHTML = '<span><b>Passives:</b> none</span>';
    } else {
        weapon.product.blueprint.passive.forEach(passive =>
            appendPassive(fragment, weapon, passive)
        );
    }
    listContainer.innerHTML = "";
    listContainer.appendChild(fragment);
}

function appendPassive(container,weapon, passive){
    const wrapper = document.createElement("div");
    wrapper.style="display:inline;";
    Object.assign(passive, passives[passive.id]);

    passive.image = getWeaponImage(passive);
    passive.image.className = 'discord-embed-emote';
    passive.image.style.margin = "0 0.1rem 0.15rem 0";

    wrapper.append(passive.image,generateDescription(passive,weapon))
    container.append(wrapper);
}