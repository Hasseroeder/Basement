import { make } from "../util/injectionUtil.js"
import * as messageHandler from "./messageHandler.js"

const bList  = document.querySelector(".buffContainer");
let passives, weapons, buffs, boundWeapon;

export const init = (weaponData,passiveData,buffData) => [weapons,passives,buffs] = [weaponData,passiveData,buffData]
export const bindWeapon = weapon => boundWeapon = weapon;

export class Buff{
    constructor({
        slug, 
        statOverride = []}
    ){
        Object.assign(
            this, 
            buffs.find(buff => buff.slug == slug)
        ); // I probably don't need all these params...
        this.boundWeapon = boundWeapon;

        this.stats = this.statConfig.map((statConfig,i) => ({
            noWearConfig: statConfig, 
            noWear: statOverride[i] ?? 100
        }));

        boundWeapon.buffs.push(this);
        appendBuffNode(this);
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
}

export function appendBuffNode(buff) {
    const wrapper = make("div",{className:"buff-item"});

    const image = make("img",{
        src:"/media/owo_images/battleEmojis/" + buff.slug + ".png" ,
        ariaLabel: buff.slug,
        alt:":"+buff.slug+":",
        draggable:false,
        className:"discord-embed-emote weapon-desc-image",
    });

    wrapper.append(
        image, 
        messageHandler.generateDescription(buff)
    );
    bList.appendChild(wrapper);
}