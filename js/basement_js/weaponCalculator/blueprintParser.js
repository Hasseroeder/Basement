import { valueToPercent } from "./util.js";

const initWeaponSlug = "sword";	// start with sword if nothing is given
const fabledPercent = 100;      // default to this quality if can't read stats

var weapons, passives, buffs;
export const init = (weaponData,passiveData,buffData) => [weapons,passives,buffs] = [weaponData,passiveData,buffData]

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

function getStats(wear, {item,statToken}){
    const separator = statToken.match(/\d([,\- ])\d/)?.[1] ?? ',';

    const itemStatics = item;
    const buffArray = itemStatics.buffSlugs
        .map(slug => buffs.find(buff => buff.slug == slug));

    const buffStatLength = buffArray.flatMap(buff=> buff.statConfig).length;
    const itemStatLength = itemStatics.statConfig.length
    const wpStatLength = itemStatics.wpStatConfig ? 1 : 0; 

    const statLength = buffStatLength + itemStatLength + wpStatLength;

	if (isOnlyNumbers(statToken) && 
		isValidJoinedNumbers(statToken,separator) &&
		isCorrectStatAmount(statToken,statLength)
	) {
		const statInts = statToken
            .replace(/^[\s,-]+|[\s,-]+$/g, "")
            .split(separator)
            .map(Number); 
        const wearBonus = { pristine: 5, fine: 3, decent: 1}[wear] ?? 0;
        const statOverrides = {};
        const percentageMode = separator === ",";
        let cursor = 0;
        const read = config => { 
            const raw = statInts[cursor++]; 
            return percentageMode 
                ? raw 
                : valueToPercent(raw, config) - wearBonus; 
        };

        if (itemStatics.wpStatConfig){
            const wpIndex = percentageMode ? statInts.length - 1 : 0;
            statOverrides.wpStat = percentageMode 
                ? statInts[wpIndex] 
                : valueToPercent(statInts[wpIndex], itemStatics.wpStatConfig) - wearBonus;
            if (!percentageMode) cursor++;
                // Move cursor past wpStat if it's at the front
        }

        statOverrides.base = itemStatics.statConfig.map(read);
        statOverrides.buff = buffArray.map(buff =>
            buff.statConfig.map(read)
        );

        return statOverrides
	}
	return {
        base: itemStatics.statConfig.map(_=>fabledPercent),
        buff: buffArray.map(buff =>
            buff.statConfig.map(_=>fabledPercent)
        ),
        wpStat: itemStatics.wpStatConfig
            ? fabledPercent 
            : undefined
    }
}

function getMatches(arrayToSearch, query) {
    const queries   = query.map(q => q.toLowerCase());
    const checkItemMatch = (item,q) => [item.name, item.slug, ...item.aliases].some(n => n.toLowerCase() == q);

    return queries.flatMap((q, idx) => 
        arrayToSearch.filter(item => checkItemMatch(item,q))
            .map(item => ({ 
                item,
                statToken: query[idx+1] ?? "" 
            }))
    );
}

export function toWeapon(inputHash){
    const tokens         = splitHypenSpaces(inputHash);
    const weaponMatch    = getMatches(weapons, tokens)[0] ?? { slug:initWeaponSlug, statToken:"" };
    const wear           = ["decent","fine","pristine"].includes(tokens[0]) ? tokens[0] : "worn";
    const statOverride   = getStats(wear, weaponMatch);
    const passiveGenParams = getMatches(passives, tokens).map(passiveMatch => ({
        staticData: passiveMatch.item,
        statOverride: getStats(wear, passiveMatch)
    }));  
        
    return {
        slug: weaponMatch.item.slug,
        wear,
        statOverride,
        passiveGenParams
    };
}

export function toString(){
    const formatStats = (stats) => {
        const isFabled = stats.every(({ noWear }) => noWear === 100)
        return isFabled ? "" : stats.map(({ noWear }) => noWear).join(",")
    }
    
    const wearString = boundWeapon.wear !== "worn" ? boundWeapon.wear : "";
    const statstring = formatStats(boundWeapon.selfStats);  

    const passiveParts = boundWeapon.passives.length == 0
        ? ["none"]
        : boundWeapon.passives.flatMap(
            passive => [ passive.slug, formatStats(passive.selfStats) ]
        );
    
    return [wearString, boundWeapon.slug, statstring, ...passiveParts]
        .filter(Boolean)
        .join("-");  
}
