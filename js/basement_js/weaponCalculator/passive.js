import { getWearBonus, getWearName } from "./util.js";
import { getRarity } from './util.js';


export class Passive {
    constructor(config, boundWeapon, statOverride = []) {
        Object.assign(this, config);
        this.boundWeapon = boundWeapon;

        this.stats = this.statConfig.map((statConfig,i) => {
            return {
                noWearConfig: statConfig, 
                noWear: statOverride[i] ?? 100
            }
        });
    }

    get tier() {
        return getRarity(this.qualityWear);
    }

    get wear(){
        return this.boundWeapon.wear;
    }
    get wearName(){
        return getWearName(this.wear)
    }
    get wearBonus(){
        return getWearBonus(this.wear)
    }

    remove() {
        this.boundWeapon.passives =
            this.boundWeapon.passives.filter(p => p !== this);

        this.boundWeapon.updateQualities();
    }
}
