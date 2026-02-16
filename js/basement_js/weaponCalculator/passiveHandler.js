import * as messageHandler from "./messageHandler.js"
import { getRarity } from './util.js';
import { make } from "../util/injectionUtil.js"

const pList = document.querySelector(".passiveContainer");
let passives, weapons, buffs, boundWeapon;

export const bindWeapon = weapon => boundWeapon = weapon;

export function init(weaponData,passiveData,buffData){
    weapons  = weaponData;
    passives = passiveData;
    buffs = buffData;
    const pGrid = document.querySelector('.passiveGrid');
    pGrid.append(...passives.map(
        (passive,id)=>make("img",{
            className:'passiveGridImage',
            src: `media/owo_images/battleEmojis/f_${passive.slug}.png`,
            alt: passive.slug,
            title: passive.slug,
            onmousedown: () => new Passive({slug: passive.slug})
        })
    ));
}

export function appendPassiveNode(passive) {
    const wrapper = make("div",{className:"passive-item"});

    passive.image = make("img",{
        ariaLabel: passive.slug,
        alt:":"+passive.slug+":",
        draggable:false,
        className:"discord-embed-emote weapon-desc-image",
        onclick: () => {passive.remove(); wrapper.remove();},
    });
    boundWeapon.updateQualities();

    wrapper.append(
        passive.image, 
        messageHandler.generateDescription(passive)
    );
    pList.appendChild(wrapper);
}

export class Passive {
    constructor({
        slug, 
        statOverride = []}
    ){
        Object.assign(
            this, 
            passives.find(passive => passive.slug == slug)
        );
        this.boundWeapon = boundWeapon;
        this.slug = slug;

        this.stats = this.statConfig.map((statConfig,i) => ({
            noWearConfig: statConfig, 
            noWear: statOverride[i] ?? 100
        }));

        const buffGenParams = this.buffSlugs.map((slug,i) => ({
            slug,
            statOverride: statOverride.buff[i]
        }));
        this.buffs = [];
        buffGenParams.forEach(params => new buffHandler.Buff(params));

        boundWeapon.passives.push(this);
        appendPassiveNode(this);
    }

    get allStats(){
        return [
            ...this.stats,
            ...this.buffs.flatMap(b => b.stats)
        ].filter(Boolean)
    }

    get selfStats(){
        return [
            ...this.stats,
            ...this.buffs.flatMap(b => b.stats)
        ].filter(Boolean)
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

    updateImage(){
        this.image.src = 
            "media/owo_images/battleEmojis/"
            + this.prefix
            + this.tier.at(0)
            + "_"
            + this.slug
            + ".png"
    }

    remove() {
        this.boundWeapon.passives =
            this.boundWeapon.passives.filter(p => p !== this);

        this.boundWeapon.updateQualities();
    }
}
