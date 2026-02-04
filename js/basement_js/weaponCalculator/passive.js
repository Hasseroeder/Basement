import { getWearBonus, getWearName } from "./util.js";
import { getRarity } from './util.js';


export class Passive {
    constructor(config, boundWeapon) {
        Object.assign(this, config);

        this.boundWeapon = boundWeapon;
        this._wear = boundWeapon.wear;

        this.stats = this.statConfig.map(statConfig => {
            return {
                noWearConfig: statConfig, 
                noWear : 100
            }
            // gonna need more params
        });
    }

    get tier() {
        return getRarity(this.qualityWear);
    }

    get wear(){
        return this._wear;
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
