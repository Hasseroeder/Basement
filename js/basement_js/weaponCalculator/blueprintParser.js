import { valueToPercent, getWearConfig } from "./weaponCalcUtil.js";

const initWeaponID = 101;	// start with sword if nothing is given

function splitHypenSpaces(string){
	// collapse multiple hyphens into one, multiple spaces into one
	const normalized = string.replace(/-+/g, '-').replace(/\s+/g, ' ').trim();
	// split on single hyphen or space not adjacent to digits
	return normalized.split(/(?<!\d)[ -]|[ -](?!\d)/);
}

function isValidJoinedNumbers(str) {
  // "5,20,30"   → valid
  // "5 30 30"   → valid
  // "5-20-30"   → valid
  // "5"		 → valid
  // "5-20,30"   → invalid
  const regex = /^\d+(?:([-, ])\d+(?:\1\d+)*)?$/;
  return regex.test(str);
}

function isCorrectStatAmount(str,statsNeeded){
	const matches = str.match(/\d+/g);
  	const amount  = matches ? matches.length : 0;
	return amount === statsNeeded;
}

function isOnlyNumbers(str){
	return !/[^0-9\.,\s-]/.test(str);
}

function getWear(array){
	const wearValues = { unknown:"worn", worn:"worn", decent:"decent", fine:"fine", pristine:"pristine" };
	return wearValues[array[0]] || "worn";
}

function getStats(weaponsOrPassives,item,blueprintArray, { isWeapon=false, wear="worn" } = {}){
	const toCheck = blueprintArray[item.matchIndex+1];
	const statConfig = weaponsOrPassives[item.id].statConfig;
	const statAmount = statConfig.length;

	if (isOnlyNumbers(toCheck) && 
		isValidJoinedNumbers(toCheck) &&
		isCorrectStatAmount(toCheck,statAmount)
	) {
		const separator = toCheck.match(/\d(\D)\d/)?.[1] ?? ',';;
		const tempStats = toCheck.split(separator).map(Number); 
        if (separator!="," && isWeapon) tempStats.push(tempStats.shift());
            // doing this because WP stat is first in "45-24" display and last in "24,45" display

        return statConfig.map((config, i) => {
            const wearConfig = getWearConfig(config, wear);
            let toPush = separator === "," 
                ? tempStats[i] 
                : valueToPercent(tempStats[i], wearConfig);
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

export function blueprintMain(inputHash, weapons, passives){
    const tokens         = splitHypenSpaces(inputHash);
    const weapon         = itemIDs(weapons, tokens)[0] ?? { id: initWeaponID, matchIndex: -1 };
    const wear           = getWear(tokens);
    const stats          = getStats(weapons, weapon, tokens, { isWeapon: true, wear });
    const passiveMatches = itemIDs(passives, tokens);

    return {
        id: weapon.id,
        wear,
        stats,
        passive: passiveMatches.map(p => ({
            id: p.id,
            stats: getStats(passives, p, tokens, { wear }),
            ...passives[p.id]
        }))
    };
}