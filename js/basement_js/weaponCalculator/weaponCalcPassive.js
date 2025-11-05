import { generateDescription, displayInfo }  from '../weaponCalculator/weaponCalcMessageGenerator.js'
import { getWeaponImage,applyWearToWeapon } from './weaponCalcUtil.js';
import { make } from "../util/injectionUtil.js"

const pList = document.querySelector(".passiveContainer");
const pGrid = document.querySelector('.passiveGrid');
let passives;

export function initiatePassiveStuffs(weapon,passiveData){
    passives = passiveData;

    Object.values(passiveData).forEach(passive => {
        pGrid.append(
            make("img",{
                className:'passiveGridImage',
                src: `media/owo_images/f_${passive.aliases[0]}.png`,
                alt: passive.aliases[0],
                title: passive.aliases[0],
                onmousedown: () => generateNewPassive(passive.id,weapon)
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
        stats: passives[id].statConfig.map(() => ({noWear:100})),
        ...passives[id]
    };
}

async function appendPassiveNode(passive, weapon) {
    const blueprint = weapon.product.blueprint;
    const wrapper = make("div",{
        className:"passiveItem",
        dataset:{id:passive.id}
    });

    Object.assign(passive, passives[passive.id]);
    passive.image = getWeaponImage(passive);
    passive.image.className = 'discord-embed-emote weaponCalc-passive-emote';
    passive.image.onclick = () => removePassive(passive, wrapper, blueprint);
    const desc = await generateDescription(passive, weapon);

    if(blueprint.passive.length === 1) pList.innerHTML="";
        // we'll need to remove "passives: none" on the first append

    wrapper.append(passive.image, desc);
    pList.appendChild(wrapper);
}

export function generatePassiveInputs(weapon) {
    const passives = weapon.product.blueprint.passive;
    if (passives.length == 0) pList.innerHTML = '<span><b>Passives:</b> none</span>';
    passives.forEach(p => appendPassiveNode(p, weapon));
}

function removePassive(passive, wrapper, blueprint) {
    blueprint.passive =
        blueprint.passive.filter(p => p !== passive);
    wrapper.remove();
    blueprint.stats[0].IO.justUpdateDumbass();
    if (passives.length == 0) pList.innerHTML = '<span><b>Passives:</b> none</span>';
}