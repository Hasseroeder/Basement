import { valueToPercent } from "./weaponCalcUtil.js";

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

function getStats(item,string){
	const stats = item.objectType == "passive"
        ? item.stats
        : item.statConfig.map(config => ({noWearConfig:config}));
        // passives have a stat object premade, I need to create it for weapons
        // TODO: do this better
    const separator = string.match(/\d([,\- ])\d/)?.[1] ?? ',';

	if (isOnlyNumbers(string) && 
		isValidJoinedNumbers(string,separator) &&
		isCorrectStatAmount(string,stats.length)
	) {
        const cleanedStats = string.replace(/^[\s,-]+|[\s,-]+$/g, "");
		const statInts = cleanedStats.split(separator).map(Number); 
        if (separator!="," && item.objectType != "passive") statInts.push(statInts.shift());
            // doing this because WP stat is first in "45-24" display and last in "24,45" display

        stats.map((stat, i) => {
            let toPush = separator === "," 
                ? Math.floor(statInts[i])
                : valueToPercent(statInts[i], stat.wearConfig);
            toPush = Math.max(0, Math.min(100, toPush));
            stat.noWear = toPush;
        });
	}else{
		stats.map(stat => stat.noWear=100);	
	}
    return stats;
}

function getMatches(arrayToSearch, query) {
    const queries   = query.map(q => q.toLowerCase());
    const results   = queries.flatMap((q, idx) => {
        return arrayToSearch.filter(item =>
            [item.name, ...item.aliases].some(n => n.toLowerCase() === q)
        ).map(item => ({ item, string: query[idx+1] ?? "" }));
    });
    return results;
}

export function toWeapon(inputHash, weapons, passives){
    const tokens         = splitHypenSpaces(inputHash);
    const {item: weapon, string: weaponStatToken}
        = getMatches(weapons, tokens)[0] ?? { item:weapons[initWeaponID], string:"" };
    const wear           = ["decent","fine","pristine"].includes(tokens[0]) ? tokens[0] : "worn";
    const stats          = getStats(weapon,weaponStatToken);
    const passive = getMatches(passives, tokens).map(({ item, string }) => {
        getStats(item, string);
        item.wear = wear;
        return item;
    });

    return {
        id: weapon.id-100, // TODO: I'll need to figure out what internal representation these should have
        wear,
        stats,
        passive
    };
}

export function toStrings(weapon){
    const formatStats = (stats) => {
        const isFabled = stats.every(({ noWear }) => noWear === 100)
        return isFabled ? "" : stats.map(({ noWear }) => noWear).join(",")
    }
    
    const { passives,stats,wear } = weapon.instance;
    const { aliases,name } = weapon.static;

    const wearString = wear !== "worn" ? wear : "";
    const shorthand  = (aliases[0]?? name).toLowerCase();
    const statstring = formatStats(stats);  

    const passiveParts = passives.length == 0
        ? ["none"]
        : passives.flatMap(
            ({ aliases, name, stats }) => [
                (aliases[0]?? name).toLowerCase(), 
                formatStats(stats)
            ]
        );
    
    return [wearString, shorthand, statstring, ...passiveParts].filter(Boolean);  
}
