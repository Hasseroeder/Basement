import { loadJson } from '../util/jsonUtil.js';
import * as blueprinter from './blueprintParser.js';
import * as passiveHandler from './weaponCalcPassive.js';
import * as messageHandler from "./weaponCalcMessageGenerator.js"
import { getRarity } from './weaponCalcUtil.js';
import { debounce } from "../util/inputUtil.js";

const [weapons, weaponDB, passives] = await Promise.all([
    loadJson("../json/weapons.json"),
    loadJson("../json/weaponDatabase.json"),
    loadJson("../json/passives.json")
]);

console.log(weapons);
//weapons.forEach(weapon=>{
//    console.log(weapon.statConfig);
//});

delete weapons[100]; // gotta get rid of fists
passiveHandler.init(passives);

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
        this.static=weapons[blueprintObject.id];
        this.instance={
            owner,
            weaponID, 
            passives: blueprintObject.passive,
            stats: blueprintObject.stats,
            wear: blueprintObject.wear
        };
        passiveHandler.bindWeapon(this);
        passiveHandler.generatePassiveInputs();
        messageHandler.bindWeapon(this);
        messageHandler.generateStatInputs(this);
        this.updateVars();
        debouncedHash(this);
    }

    static fromDatabase(id){
        const weaponArray = weaponDB[id];
        const randWeapon = weaponArray[
            Math.floor(Math.random()*weaponArray.length)
        ]
        randWeapon.blueprintObject = blueprinter.toWeapon(randWeapon.blueprint,weapons,passives);
        return new Weapon(randWeapon);
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
        const blueprintObject = blueprinter.toWeapon(location.hash,weapons,passives);
        const weaponArray = weaponDB[blueprintObject.id];
        const randWeapon = weaponArray[  
            Math.floor(Math.random()*weaponArray.length)
        ];
        return new Weapon({...randWeapon, blueprintObject});
    }

    get wear(){
        return this.instance.wear;
    }

    get wpStat(){
        return this.instance.stats.find(stat => stat.noWearConfig.type =="WP-Cost");
    }

    updateVars(){
        const allStats = [
            ...this.instance.stats,
            ...this.instance.passives.flatMap(p => p.stats)
        ];

        
        allStats.forEach(stat => stat.IO.update(stat));

        const calculateQualities= statArray =>
            statArray.reduce(
                (acc, {withWear,noWear}) => [acc[0]+withWear,  acc[1]+noWear], [0,0]
            ).map(v => v / statArray.length);

        this.instance.passives.forEach(passive => {
            [passive.qualityWear, passive.qualityNoWear] = calculateQualities(passive.stats);
            passive.wear  = this.wear;
            passive.tier  = getRarity(passive.qualityWear);
        });
        
        [this.instance.qualityWear, this.instance.qualityNoWear] = calculateQualities(allStats);
        this.instance.tier = getRarity(Math.floor(this.instance.qualityWear));

        messageHandler.displayInfo(this);
        debouncedHash(this);
    }
}