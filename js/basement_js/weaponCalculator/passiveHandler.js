import * as messageHandler from "./messageHandler.js"
import { getWeaponImage, getRarity } from './util.js';
import { make } from "../util/injectionUtil.js"

const pList = document.querySelector(".passiveContainer");
let passives, weapons, boundWeapon;

export const bindWeapon = weapon => boundWeapon = weapon;

export function init(weaponArray, passiveArray){
    weapons  = weaponArray;
    passives = passiveArray;
    const pGrid = document.querySelector('.passiveGrid');
    pGrid.append(...passives.map(
        (passive,id)=>make("img",{
            className:'passiveGridImage',
            src: `media/owo_images/battleEmojis/f_${passive.slug}.png`,
            alt: passive.slug,
            title: passive.slug,
            onmousedown: () => new Passive({id})
        })
    ));
}

export function appendPassiveNode(passive) {
    const wrapper = make("div",{className:"passive-item"});

    passive.image = getWeaponImage(passive);
    passive.image.className = 'discord-embed-emote weaponCalc-passive-emote';
    passive.image.onclick = () => {passive.remove(); wrapper.remove();};

    boundWeapon.updateQualities();

    wrapper.append(
        passive.image, 
        messageHandler.generateDescription(passive)
    );
    pList.appendChild(wrapper);
}

export class Passive {
    constructor({
        id, 
        statOverride = []}
    ){
        Object.assign(this, passives[id]); // I probably don't need all these params...
        this.boundWeapon = boundWeapon;

        this.stats = this.statConfig.map((statConfig,i) => ({
            noWearConfig: statConfig, 
            noWear: statOverride[i] ?? 100
        }));

        boundWeapon.passives.push(this);
        appendPassiveNode(this);
    }

    get prefix() { return "" }

    get tier() {
        return getRarity(this.qualityWear);
    }

    get wear(){
        return this.boundWeapon.wear;
    }
    get wearName(){
        return this.boundWeapon.wearName;
    }
    get wearBonus(){
        return this.boundWeapon.wearBonus;
    }

    remove() {
        this.boundWeapon.passives =
            this.boundWeapon.passives.filter(p => p !== this);

        this.boundWeapon.updateQualities();
    }
}
