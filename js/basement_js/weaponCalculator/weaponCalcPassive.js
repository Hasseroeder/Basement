import { loadJson } from '../util/jsonUtil.js';
import { generateDescription, displayInfo }  from '../weaponCalculator/weaponCalcMessageGenerator.js'
import { getWeaponImage,applyWearToWeapon } from './weaponCalcUtil.js';
import { make } from './weaponCalcElementHelper.js';

const passivePromise = loadJson("../json/passives.json");
let passiveData;

export async function initiatePassiveStuffs(weapon){
    const gridContainer = document.querySelector('.passiveGrid');
    passiveData = await passivePromise;

    Object.values(passiveData).forEach(passive => {
        gridContainer.append(
            make("img",{
                className:'passiveGridImage',
                src: `media/owo_images/f_${passive.aliases[0]}.png`,
                alt: passive.aliases[0],
                title: passive.aliases[0],
                onclick: () => generateNewPassive(passive.id,weapon)
            })
        );
    });
}

function generateNewPassive(id, weapon){
    const newPassive = giveMeNewPassive(id);
    weapon.product.blueprint.passive.push(newPassive);
    applyWearToWeapon(weapon,weapon.product.blueprint.wear);
    displayInfo(weapon);
    appendPassiveNode(newPassive, weapon);
}

function giveMeNewPassive(id){
    return {
        id,
        stats: passiveData[id].statConfig.map(() => ({noWear:100})),
        ...passiveData[id]
    };
}

async function appendPassiveNode(passive, weapon) {
    const listContainer = document.querySelector(".passiveContainer");
    const wrapper = make("div",{className:"passiveItem"});
    wrapper.dataset.id = passive.id;

    Object.assign(passive, passiveData[passive.id]);
    passive.image = getWeaponImage(passive);
    passive.image.className = 'discord-embed-emote weaponCalc-passive-emote';
    passive.image.onclick = () => removePassive(passive, wrapper, weapon);
    const desc = await generateDescription(passive, weapon);

    if( weapon.product.blueprint.passive.length === 1){
        // we'll need to remove "passives: none" on the first append
        listContainer.innerHTML="";
    }

    wrapper.append(passive.image, desc);
    listContainer.appendChild(wrapper);
}

export function generatePassiveInputs(weapon) {
    const passives = weapon.product.blueprint.passive;
    sayNoPassives(passives);
    passives.forEach(p => appendPassiveNode(p, weapon));
}

function sayNoPassives(passives){
    const listContainer = document.querySelector(".passiveContainer");
    if (passives.length === 0) {
        listContainer.innerHTML = '<span><b>Passives:</b> none</span>';
    } 
}

function removePassive(passive, wrapper, weapon) {
    const blueprint = weapon.product.blueprint;
    blueprint.passive =
        blueprint.passive.filter(p => p !== passive);
    wrapper.remove();
    blueprint.stats[0].IO.justUpdateDumbass();
    sayNoPassives(blueprint.passive);
}