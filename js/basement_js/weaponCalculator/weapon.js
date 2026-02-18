import { loadJson } from '../util/jsonUtil.js';
import * as blueprinter from './blueprintParser.js';
import * as passiveHandler from './passiveHandler.js';
import * as buffHandler from "./buffHandler.js";
import * as messageHandler from "./messageHandler.js";
import { getRarity } from './util.js';
import { debounce } from "../util/inputUtil.js";

const [weapons, passives, buffs] = await Promise.all([
    loadJson("../json/weapons.json"),
    loadJson("../json/passives.json"),
    loadJson("../json/buffs.json")
]);

[...weapons,...passives,...buffs].forEach(StatHaver=>{
    [ ...StatHaver.statConfig , StatHaver.wpStatConfig ]
    .filter(Boolean)
    .forEach(stat=>{
        stat.range = stat.max - stat.min;
        stat.step = stat.range/100;
    })
})

passiveHandler.init(passives, buffs);
blueprinter.init(weapons, passives, buffs);

const updateHash = debounce(()=>
    history.replaceState(null,'','#'+blueprinter.toString())
);

export class Weapon{
    constructor({
        owner,             // {id:"hsse",name:"Heather"}
        weaponID,          // "664DFC"
        slug,              // 1
        wear,              // "worn"
        statOverride,      // { buff: [], base: [ 55 ], wpStat: 55 }
        passiveGenParams   // []
    }={}){
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

        passiveHandler.bindWeapon(this);
        messageHandler.bindWeapon(this);
        blueprinter.bindWeapon(this);

        this.passives = [];
        this.buffs = [];
        passiveGenParams.forEach(params=> new passiveHandler.Passive(params));
        const buffGenParams = this.buffSlugs.map((slug,i) => ({
            parent: this,
            staticData: buffs.find(buff => buff.slug == slug),
            statOverride: statOverride.buff[i]
        }));
        buffGenParams.forEach(params => new buffHandler.Buff(params));

        messageHandler.generateStatInputs();
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

    static fromHash(){
        const {slug, wear, statOverride, passiveGenParams } = blueprinter.toWeapon(location.hash.slice(1));
        return new Weapon({
            owner: {id:"@hsse",name:"Heather"},  // TODO: figure out what kind of user's I want to feature?
            weaponID:"664DFC",                  // TODO: and IDs?
            slug,
            wear,
            statOverride,
            passiveGenParams
        });
    }

    static bigArray = weapons;

    get prefix() {
        if (this.passives.length > this.staticData.normalPassiveAmount)
            return "b"
        else if (this.wear != "worn")
            return "p"
        else 
            return ""
    }

    get shardValue() {
        if (this.slug=="rune") return
        var value = {
            common: 	1,
            uncommon:   3,
            rare:   	5,
            epic:     	25,
            mythic:  	300,
            legendary:	1000,
            fabled: 	5000
        }[this.tier];
        if (this.prefix == "b") value = 1.5 * value;
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
        return this.constructor.bigArray.find(
            weaponStatics => weaponStatics.slug == this.slug
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
        messageHandler.displayInfo();
        updateHash(this);
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