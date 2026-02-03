import { getWearBonus, getWearName } from "./util.js";

export class Passive {
    constructor(config, boundWeapon) {
        Object.assign(this, config);

        this.boundWeapon = boundWeapon;
        this._wear = boundWeapon.wear;
        
        this.stats = this.statConfig.map(stat => {
            const noWear = 100;
            // gonna need more params
        });
    }

    get tier() {
        return getRarity(Math.floor(this.qualityWear));
    }

    get wear(){
        return this._wear;
    }
    get wearName(){
        return getWearName(this._wear)
    }
    get wearBonus(){
        return getWearBonus(this._wear)
    }

    remove() {
        this.boundWeapon.passives =
            this.boundWeapon.passives.filter(p => p !== this);

        this.boundWeapon.updateQualities();
    }
}
