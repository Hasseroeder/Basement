import { generateDescription, displayInfo }  from '../weaponCalculator/weaponCalcMessageGenerator.js'
import { getWeaponImage} from './weaponCalcUtil.js';
import { make } from "../util/injectionUtil.js"

const pList = document.querySelector(".passiveContainer");
let passives;
let boundWeapon;
export const bindWeapon = weapon => boundWeapon = weapon;

export function init(passiveData){
    passives = passiveData;
    const pGrid = document.querySelector('.passiveGrid');
    pGrid.append(...Object.values(passives).map(
        passive=>make("img",{
            className:'passiveGridImage',
            src: `media/owo_images/f_${passive.aliases[0]}.png`,
            alt: passive.aliases[0],
            title: passive.aliases[0],
            onmousedown: () => generateNewPassive(passive)
        })
    ));
}

function generateNewPassive(passive){
    const newPassive = {...passive, wear:boundWeapon.wear};
    newPassive.stats.map(stat => stat.noWear=100);
    newPassive.remove = ()=>{
        boundWeapon.passives = boundWeapon.passives.filter(p => p !== passive);
        if (boundWeapon.passives.length == 0) pList.innerHTML = '<span><b>Passives:</b> none</span>';
        boundWeapon.updateVars();
    }

    boundWeapon.passives.push(newPassive);
    appendPassiveNode(newPassive);
    displayInfo(boundWeapon);
}

function appendPassiveNode(passive) {
    const wrapper = make("div",{
        className:"passiveItem",
        dataset:{id:passive.id}
    });

    Object.assign(passive,passives[passive.id]);
    const desc = generateDescription(passive);

    if(boundWeapon.passives.length === 1) pList.innerHTML="";
        // we'll need to remove "passives: none" on the first append
    boundWeapon.updateVars();

    passive.image = Object.assign(getWeaponImage(passive),{
        className: 'discord-embed-emote weaponCalc-passive-emote',
        onclick: () => {passive.remove(); wrapper.remove();}
    })
    wrapper.append(passive.image, desc);
    pList.appendChild(wrapper);
}

export function generatePassiveInputs() {
    if (boundWeapon.passives.length == 0) pList.innerHTML = '<span><b>Passives:</b> none</span>';
    boundWeapon.passives.forEach(p => appendPassiveNode(p));
}