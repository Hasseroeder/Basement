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
    passive.stats.forEach(stat=>{

    })
})

// delete weapons[100]; // gotta get rid of fists... somehow
passiveHandler.init(weapons, passives);
blueprinter.init(weapons, passives);


function updateHash(weapon){
    history.replaceState(null,'','#'+blueprinter.toStrings(weapon).join("-"));
}
const debouncedHash = debounce(updateHash);

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
        this.wear = blueprintObject.wear;
        this.typeID = blueprintObject.id;
        this.tier = "fabled"; // default, will change later
        this.wearName = "worn"; // default, will change later

        passiveHandler.bindWeapon(this);
        messageHandler.bindWeapon(this);
        messageHandler.generateStatInputs();
        this.updateVars();
        debouncedHash(this);
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

    updateVars(){
        const allStats = [
            ...this.stats,
            ...this.passives.flatMap(p => p.stats)
        ];

        
        allStats.forEach(stat => stat.IO.update(stat));

        const calculateQualities= statArray =>
            statArray.reduce(
                (acc, {withWear,noWear}) => [acc[0]+withWear,  acc[1]+noWear], [0,0]
            ).map(v => v / statArray.length);

        this.passives.forEach(passive => {
            [passive.qualityWear, passive.qualityNoWear] = calculateQualities(passive.stats);
            passive.wear  = this.wear;
            passive.tier  = getRarity(passive.qualityWear);
        });
        
        [this.qualityWear, this.qualityNoWear] = calculateQualities(allStats);
        this.tier = getRarity(Math.floor(this.qualityWear));

        messageHandler.displayInfo();
        debouncedHash(this);
        console.log(this);
    }
}