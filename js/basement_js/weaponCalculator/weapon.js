import { loadJson } from '../util/jsonUtil.js';
import * as blueprinter from './blueprintParser.js';
import * as passiveHandler from './weaponCalcPassive.js';
import * as messageHandler from "./weaponCalcMessageGenerator.js"
import { getRarity } from './weaponCalcUtil.js';
import { debounce } from "../util/inputUtil.js";

const [weapons, passives] = await Promise.all([
    loadJson("../json/weapons.json"),
    loadJson("../json/passives.json")
]);
weapons.forEach(weapon=>{
    weapon.statConfig.forEach(stat=>{
        stat.range = stat.max - stat.min;
        stat.step = stat.range/100;
    })
});
passives.forEach(passive=>{
    passive.statConfig.forEach(stat=>{
        stat.range = stat.max - stat.min;
        stat.step = stat.range/100;
    })
})

// delete weapons[100]; // gotta get rid of fists... somehow
passiveHandler.init(weapons, passives);
blueprinter.init(weapons, passives);

const updateHash = debounce(()=>
    history.replaceState(null,'','#'+blueprinter.toStrings().join("-"))
);

export class Weapon{
    constructor({
        blueprintObject,   // id:101,102, stats:{}, passives:[],wear:"worn"
        owner,             // {id:"hsse",name:"Heather"}
        weaponID,          // "664DFC"
    }={}){
        this.owner= owner;
        this.weaponID = weaponID;
        this.passives = blueprintObject.passive;
        this.stats = blueprintObject.stats;
        this.typeID = blueprintObject.id;
        this._wear = null;

        passiveHandler.bindWeapon(this);
        messageHandler.bindWeapon(this);
        blueprinter.bindWeapon(this);
        messageHandler.generateStatInputs();
        this.updateQualities();

        this.wear = blueprintObject.wear;
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
        const blueprintObject = blueprinter.toWeapon(location.hash.slice(1));
        return new Weapon({
            owner: {id:"hsse",name:"Heather"},  // TODO: figure out what kind of user's I want to feature?
            weaponID:"664DFC",                  // TODO: and IDs?
            blueprintObject
        });
    }

    static bigArray = weapons;

    set wear(v){
        [this, ...this.passives].forEach(wearHaver=>wearHaver._wear=v)
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
        return this.constructor.bigArray[this.typeID]
    }

    get typeName(){
        return this.staticData.name
    }

    get slug(){
        return this.staticData.slug
    }

    get aliases(){
        return this.staticData.aliases
    }

    get description(){
        return this.staticData.description
    }

    get wpStat(){
        return this.stats.find(stat => stat.noWearConfig.type =="WP-Cost");
    }

    get tier(){
        return getRarity(Math.floor(this.qualityWear));
    }

    get allStats(){
        return [
            ...this.stats,
            ...this.passives.flatMap(p => p.stats)
        ]
    }

    render(){
        messageHandler.displayInfo();
        updateHash(this);
    }

    updateQualities(){
        const calculateQualities= statArray =>
            statArray.reduce(
                (acc, {withWear,noWear}) => [acc[0]+withWear,  acc[1]+noWear], [0,0]
            ).map(v => v / statArray.length);

        [this, ...this.passives].forEach(statHaver=>{
            [statHaver.qualityWear, statHaver.qualityNoWear] = calculateQualities(statHaver.stats)
        })

        this.render();
    }
}