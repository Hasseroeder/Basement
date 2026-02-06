import { valueToPercent } from "./util.js";

const initWeaponID = 1;	// start with sword if nothing is given

var weapons, passives;
export const init = (weaponData,passiveData) => [weapons,passives] = [weaponData,passiveData]

let boundWeapon;
export const bindWeapon = weapon => boundWeapon = weapon;

function splitHypenSpaces(string){
    const normalized = string
        .replace(/-+/g, '-')     // "---" → "-"
        .replace(/\s+/g, ' ')    // "   " → " "
        .replace(/,+/g, ',')     // ",,," → ","
        .replace(/\.{2,}/g, '.') // "..." → "."
        .trim();

    // split on hyphen or space
    // but don’t split when it’s between two digits
    const parts = normalized.split(
        /(?<!\d)[ -]|[ -](?!\d)/
    );

    // drop any empty tokens just in case
    return parts.filter(Boolean);
}

const isValidJoinedNumbers= (str,separator) =>
    str.split(separator)
        .every(part => /^\d+(?:\.\d+)?$/.test(part));
        // "5,20,30"   → valid
        // "5 30 30"   → valid
        // "5-20-30"   → valid
        // "5"		   → valid
        // "5.2-30"    → valid
        // "5-20,30"   → invalid due to mixed seperator
        // "5.2,30"    → valid for now, I will round later due to comma
        // "5.2"       → valid for now, I will round later due to implied comma

function isCorrectStatAmount(str, statsNeeded) {
    const matches = str.match(/\d+(?:\.\d+)?/g);
    const amount = matches ? matches.length : 0;
    return amount === statsNeeded;
}

const isOnlyNumbers =
    str => /^[\d.,\s-]+$/.test(str);

function getStats(dataArray, {id,statToken}){
    const item = dataArray[id];
    const separator = statToken.match(/\d([,\- ])\d/)?.[1] ?? ',';

	if (isOnlyNumbers(statToken) && 
		isValidJoinedNumbers(statToken,separator) &&
		isCorrectStatAmount(statToken,item.statConfig.length)
	) {
        const cleanedStats = statToken.replace(/^[\s,-]+|[\s,-]+$/g, "");
		const statInts = cleanedStats.split(separator).map(Number); 
        if (separator!="," && item.objectType != "passive") statInts.push(statInts.shift());
            // doing this because WP stat is first in "45-24" display and last in "24,45" display

        return item.statConfig.map((stat, i) => 
            separator === "," 
                ? statInts[i]
                : valueToPercent(statInts[i], stat.wearConfig)
        );
	}
	return item.statConfig.map(_=>100)
}

function getMatches(arrayToSearch, query) {
    const queries   = query.map(q => q.toLowerCase());
    const checkItemMatch = (item,q) => [item.name, item.slug, ...item.aliases].some(n => n.toLowerCase() == q);

    return queries.flatMap((q, idx) => 
        arrayToSearch.filter(item => checkItemMatch(item,q))
            .map(item => ({ 
                id: arrayToSearch.indexOf(item), 
                statToken: query[idx+1] ?? "" 
            }))
    );
}

export function toWeapon(inputHash){
    const tokens         = splitHypenSpaces(inputHash);
    const weaponMatch    = getMatches(weapons, tokens)[0] ?? { id:initWeaponID, statToken:"" };
    const wear           = ["decent","fine","pristine"].includes(tokens[0]) ? tokens[0] : "worn";
    const statOverride   = getStats(weapons ,weaponMatch);
    const passiveGenParams = getMatches(passives, tokens).map(passiveMatch => ({
        id: passiveMatch.id,
        statOverride: getStats(passives, passiveMatch)
    }));  
        
    return {
        id: weaponMatch.id,
        wear,
        statOverride,
        passiveGenParams
    };
}

export function toStrings(){
    const formatStats = (stats) => {
        const isFabled = stats.every(({ noWear }) => noWear === 100)
        return isFabled ? "" : stats.map(({ noWear }) => noWear).join(",")
    }
    
    const wearString = boundWeapon.wear !== "worn" ? boundWeapon.wear : "";
    const statstring = formatStats(boundWeapon.stats);  

    const passiveParts = boundWeapon.passives.length == 0
        ? ["none"]
        : boundWeapon.passives.flatMap(
            passive => [ passive.slug, formatStats(passive.stats) ]
        );
    
    return [wearString, boundWeapon.slug, statstring, ...passiveParts].filter(Boolean);  
}
