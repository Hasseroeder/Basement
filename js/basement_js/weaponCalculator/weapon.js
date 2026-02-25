import * as blueprinter from './blueprintParser.js';
import * as passiveHandler from './passiveHandler.js';
import * as buffHandler from "./buffHandler.js";
import * as messageHandler from "./messageHandler.js";
import { getRarity, wpEmojiPath } from './util.js';
import { debounce } from "../util/inputUtil.js";

export class Weapon{
    constructor({
        owner,
        weaponID,
        slug,
        wear,
        statOverride,
        passiveGenParams,
    }){
        this.owner = owner;
        this.weaponID = weaponID;
        this.slug = slug;
        this.stats = statOverride.base.map((override,i)=>({
            noWearConfig: this.staticData.statConfig[i],
            noWear: override
        }));

        if (statOverride.wpStat)
            this.wpStat = {
                noWearConfig: this.staticData.wpStatConfig,
                noWear: statOverride.wpStat
            }

        this.bList = document.getElementById("buffContainer");
        this.image = document.getElementById("weaponImage");
        this._wear; 

        this.passives = [];
        this.buffs = [];
        passiveGenParams.forEach(params=> params.parent=this)
        passiveGenParams.forEach(params=> new passiveHandler.Passive(params));
        const buffGenParams = this.buffSlugs.map((slug,i) => ({
            parent: this,
            staticData: buffs.find(buff => buff.slug === slug),
            statOverride: statOverride.buff[i]
        }));
        buffGenParams.forEach(params => new buffHandler.Buff(params));

        messageHandler.generateStatInputs(this);
        this.wear = wear;
    }

    static fromRandom(id,settings={
        doPassives: true,
        defaultQuality: NaN,
        defaultWear:"worn"
    }){
        // will need to generate random weapon stats and passives and such
        // note: rune needs special stats
    }

    static fromHash(wpbData){
        const {slug, wear, statOverride, passiveGenParams } = 
            blueprinter.toWeapon(
                location.hash.slice(1),
                wpbData
            );
            
        Weapon.wpbData = wpbData;

        return new Weapon({
            owner: {id:"@hsse",name:"Heather"},
            weaponID:"664DFC",                  // TODO: get rid of these stupid defaults
            slug,
            wear,
            statOverride,
            passiveGenParams,
        });
    }

    get isEmpowered(){
        return this.passives.length > this.staticData.normalPassiveAmount;
    }

    get hasWear(){
        return this.wearBonus!=0;
    }

    get prefix() {
        if (this.isEmpowered)
            return "b"
        else if (this.hasWear)
            return "p"
        else 
            return ""
    }

    get shardValue() {
        if (this.slug==="rune") return
        var value = {
            common: 	1,
            uncommon:   3,
            rare:   	5,
            epic:     	25,
            mythic:  	300,
            legendary:	1000,
            fabled: 	5000
        }[this.tier];
        if (this.prefix === "b") value = 1.5 * value;
        return value
    }

    get buffSlugs(){
        return this.staticData.buffSlugs
    }

    set wear(v){
        this._wear = v;
        this.allStats.forEach(stat => stat.IO.updateWear());
        this.updateQualities();
    }
    get wear(){
        return this._wear;
    }
    get wearName(){
        return ({
            pristine:"Pristine\u00A0", 
            fine:"Fine\u00A0", 
            decent:"Decent\u00A0"
        })[this.wear] ?? ""
    }
    get wearBonus(){
        return ({
            pristine: 5, 
            fine: 3, 
            decent: 1
        })[this.wear] ?? 0
    }

    get staticData(){
        return this.constructor.wpbData.weapons.find(
            weaponStatics => weaponStatics.slug === this.slug
        )
    }

    get typeName(){
        return this.staticData.name
    }

    get aliases(){
        return this.staticData.aliases
    }

    get description(){
        return this.staticData.description
    }

    get tier(){
        return getRarity(this.qualityWear);
    }

    get allStats(){
        return [
            ...this.stats,
            ...this.buffs.flatMap(b => b.stats),
            this.wpStat,
            ...this.passives.flatMap(p => p.allStats)
        ].filter(Boolean)
    }

    get selfStats(){
        return [
            ...this.stats,
            ...this.buffs.flatMap(b => b.stats),
            this.wpStat
        ].filter(Boolean)
    }

    render(){
        messageHandler.displayInfo(this);
        this.updateHash();
    }

    updateHash = debounce(()=>
        history.replaceState(null,'','#'+blueprinter.toString(this))
    );

    updateImage(){ this.image.src = wpEmojiPath(this) }

    updateQualities(){
        const calculateQualities= statArray =>
            statArray.reduce(
                (acc, {withWear,noWear}) => [acc[0]+withWear,  acc[1]+noWear], [0,0]
            ).map(v => v / statArray.length);

        [this, ...this.passives].forEach(statHaver=>{
            [statHaver.qualityWear, statHaver.qualityNoWear] = calculateQualities(statHaver.allStats);
            statHaver.updateImage();
        })

        this.render();
    }
}