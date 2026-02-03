import * as messageHandler from "./weaponCalcMessageGenerator.js"
import { getWeaponImage} from './weaponCalcUtil.js';
import { make } from "../util/injectionUtil.js"
import { Passive } from "./passive.js";

const pList = document.querySelector(".passiveContainer");
let passives, weapons, boundWeapon;

export const bindWeapon = weapon => {
    boundWeapon = weapon;
    boundWeapon.passives.forEach(p => appendPassiveNode(p));
};

export function init(weaponArray, passiveArray){
    weapons  = weaponArray;
    passives = passiveArray;
    const pGrid = document.querySelector('.passiveGrid');
    pGrid.append(...passives.map(
        passive=>make("img",{
            className:'passiveGridImage',
            src: `media/owo_images/f_${passive.slug}.png`,
            alt: passive.slug,
            title: passive.slug,
            onmousedown: () => generateNewPassive(passive)
        })
    ));
}

function generateNewPassive(passiveConfig) {
    const newPassive = new Passive(passiveConfig, boundWeapon);

    boundWeapon.passives.push(newPassive);
    appendPassiveNode(newPassive);
    messageHandler.displayInfo();
}


function appendPassiveNode(passive) {
    const wrapper = make("div",{
        className:"passiveItem",
        dataset:{id:passive.id}
    });

    Object.assign(passive,passives[passive.id]);
    const desc = messageHandler.generateDescription(passive);
    boundWeapon.updateQualities();

    passive.image = Object.assign(getWeaponImage(passive),{
        className: 'discord-embed-emote weaponCalc-passive-emote',
        onclick: () => {passive.remove(); wrapper.remove();}
    })
    wrapper.append(passive.image, desc);
    pList.appendChild(wrapper);
}