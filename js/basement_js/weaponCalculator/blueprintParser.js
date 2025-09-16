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

function getSeparator(str) {
	const match = str.match(/\d(\D)\d/);
	return match ? match[1] : ',';
}

function namesAndAliases(weapon){
	return [weapon.name, ...weapon.aliases]
}

function getWear(array){
	const wearValues = {
		unknown:"worn",
		worn:"worn",
		decent:"decent",
		fine:"fine",
		pristine:"pristine"
	}
	return wearValues[array[0]] || "worn";
}


function checkArrayForQuery(array,query){
	return array.some(str => str.toLowerCase() === query);
}

function getWeaponStats(weapons,weapon,array){
	const toCheck = array[weapon.matchIndex+1];
	const statConfig = weapons[weapon.id].statConfig;
	const statAmount = statConfig.length;

	if (isOnlyNumbers(toCheck) && 
		isValidJoinedNumbers(toCheck) &&
		isCorrectStatAmount(toCheck,statAmount)
	) {
		const seperator = getSeparator(toCheck);
		const tempStats = toCheck.split(seperator).map(Number); 
		var statReturn = []
		if (seperator!=",") tempStats.push(tempStats.shift());
			// doing this because WP stat is first in "45-24" display and last in "24,45" display
		
		statConfig.forEach((config,i) => {
			const wearConfig = getWearConfig(config,weapon.wear);
			var toPush = seperator=="," ?
				tempStats[i] : 
				valueToPercent(tempStats[i], wearConfig);
			toPush = Math.max(0,toPush);
			toPush = Math.min(100,toPush);
			statReturn.push({noWear:toPush});
		});
		return statReturn;	
	}else{
		// assume fabled when stats aren't valid
		return Array(statAmount).fill({noWear:100});	
	}
}

function getWeaponID(objectToSearch, query) {
	// query = ["worn","Bow"] or ["Bow"]
	const queries = query.map(q => q.toLowerCase());

	for (const id in objectToSearch) {
		const item = objectToSearch[id];
		const names = namesAndAliases(item);
		const matchIndex = queries.findIndex(q => checkArrayForQuery(names, q));

		if (matchIndex !== -1) return { matchIndex: matchIndex, id: item.id };
	}
	return { matchIndex: -1, id: initWeaponID };
}

export function blueprintMain(inputHash, weapons){
	var blueprintArray = splitHypenSpaces(inputHash);
	const blueprintObject= getWeaponID(weapons,blueprintArray.slice(0, 2));
	blueprintObject.wear= getWear(blueprintArray);
	blueprintObject.stats= getWeaponStats(weapons,blueprintObject,blueprintArray);

	console.log(blueprintObject);
    return blueprintObject;
}