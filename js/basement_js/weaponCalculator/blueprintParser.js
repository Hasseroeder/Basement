import { valueToPercent, getWearConfig } from "./weaponCalcUtil.js";

const initWeaponID = 101;	// start with sword if nothing is given

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

function isValidJoinedNumbers(str,separator) {
    // "5,20,30"   → valid
    // "5 30 30"   → valid
    // "5-20-30"   → valid
    // "5"		   → valid
    // "5.2-30"    → valid
    // "5-20,30"   → invalid due to mixed seperator
    // "5.2,30"    → valid for now, I will round later due to comma
    // "5.2"       → valid for now, I will round later due to implied comma

    return str
        .split(separator)
        .every(part => /^\d+(?:\.\d+)?$/.test(part));
}

function isCorrectStatAmount(str, statsNeeded) {
    const matches = str.match(/\d+(?:\.\d+)?/g);
    const amount = matches ? matches.length : 0;
    return amount === statsNeeded;
}

function isOnlyNumbers(str){
	return /^[\d.,\s-]+$/.test(str);
}

function getStats(weaponsOrPassives,item,blueprintArray, { isWeapon=false, wear="worn" } = {}){
	const toCheck = blueprintArray[item.matchIndex+1] || "";
	const statConfig = weaponsOrPassives[item.id].statConfig;
	const statAmount = statConfig.length;
    const separator = toCheck.match(/\d([,\- ])\d/)?.[1] ?? ',';

	if (isOnlyNumbers(toCheck) && 
		isValidJoinedNumbers(toCheck,separator) &&
		isCorrectStatAmount(toCheck,statAmount)
	) {
        const cleanedStats = toCheck.replace(/^[\s,-]+|[\s,-]+$/g, "");
		const stats = cleanedStats.split(separator).map(Number); 
        if (separator!="," && isWeapon) stats.push(stats.shift());
            // doing this because WP stat is first in "45-24" display and last in "24,45" display

        return statConfig.map((config, i) => {
            const wearConfig = getWearConfig(config, wear);
            let toPush = separator === "," 
                ? Math.floor(stats[i])
                : valueToPercent(stats[i], wearConfig);
            toPush = Math.max(0, Math.min(100, toPush));
            return { noWear: toPush };
        });
	}else{
		return Array(statAmount).fill({noWear:100});	
	}
}

function itemIDs(objectToSearch, query) {
    const queries   = query.map(q => q.toLowerCase());
    const items     = Object.values(objectToSearch);
    const results   = queries.flatMap((q, idx) => {
        return items.filter(item =>
            [item.name, ...item.aliases].some(n => n.toLowerCase() === q)
        ).map(item => ({ id: item.id, matchIndex: idx }));
    });
    return results;
}

export function blueprintStringToWeapon(inputHash, weapons, passives){
    const tokens         = splitHypenSpaces(inputHash);
    const weapon         = itemIDs(weapons, tokens)[0] ?? { id: initWeaponID, matchIndex: -1 };
    const wear           = ["decent","fine","pristine"].includes(tokens[0]) ? tokens[0] : "worn";
    const stats          = getStats(weapons, weapon, tokens, { isWeapon: true, wear });
    const passive = itemIDs(passives, tokens).map(match => ({
        id:    match.id,
        stats: getStats(passives, match, tokens, { wear }),
        ...passives[match.id]
    }));

    return {
        id: weapon.id,
        wear,
        stats,
        passive
    };
}

export function weaponToBlueprintString(weapon){
    const formatStats = (stats) => {
        const isFabled = stats.every(({ noWear }) => noWear === 100)
        return isFabled ? "" : stats.map(({ noWear }) => noWear).join(",")
    }
    
    const { blueprint } = weapon.product;
    const { aliases,name } = weapon;

    const wear = blueprint.wear !== "worn" ? blueprint.wear : "";
    const shorthand = (aliases[0]?? name).toLowerCase();
    const statstring = formatStats(blueprint.stats);  

    const passiveParts = blueprint.passive.length == 0
        ? ["none"]
        : blueprint.passive.flatMap(
            ({ aliases, name, stats }) => [
                (aliases[0]?? name).toLowerCase(), 
                formatStats(stats)
            ]
        );

    const parts = [wear, shorthand, statstring, ...passiveParts].filter(Boolean);
    location.hash=parts.join("-");
}