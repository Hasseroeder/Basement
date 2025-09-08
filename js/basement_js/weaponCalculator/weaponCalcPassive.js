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
    appendPassiveNode(newPassive, weapon);
}

function giveMeNewPassive(id){
    return {
        id,
        stats: passives[id].statConfig.map(() => ({})),
        ...passives[id]
    };
}

function appendPassiveNode(passive, weapon) {
    const listContainer = document.querySelector(".passiveContainer");
    const wrapper = document.createElement("div");
    wrapper.className = "passiveItem";
    wrapper.dataset.id = passive.id;

    Object.assign(passive, passives[passive.id]);
    passive.image = getWeaponImage(passive);
    passive.image.className = 'discord-embed-emote weaponCalc-passive-emote';
    passive.image.addEventListener("click", () => removePassive(passive, wrapper, weapon));
    
    const desc = generateDescription(passive, weapon);

    if( weapon.product.blueprint.passive.length === 1){
        // we'll need to remove "passives: none" on the first append
        listContainer.innerHTML="";
    }

    wrapper.append(passive.image, desc);
    listContainer.appendChild(wrapper);
}

export function generatePassiveInputs(weapon) {
    sayNoPassives(weapon);
    weapon.product.blueprint.passive.forEach(p => appendPassiveNode(p, weapon));
}

function sayNoPassives(weapon){
    const listContainer = document.querySelector(".passiveContainer");
    if (weapon.product.blueprint.passive.length === 0) {
        listContainer.innerHTML = '<span><b>Passives:</b> none</span>';
    } 
}

function removePassive(passive, wrapper, weapon) {
    weapon.product.blueprint.passive =
        weapon.product.blueprint.passive.filter(p => p !== passive);
    wrapper.remove();
    weapon.product.blueprint.stats[0].IO.justUpdateDumbass();
    sayNoPassives(weapon);
}