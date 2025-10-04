main();
async function main(){
    
    var turnlist;
    var enemy;
    var player;

    await fetch('../json/sampleLogs/log.json')
        .then(response => response.json())
        .then(data => {
            turnlist = data.logs;
            enemy = data.battle.enemy;
            player = data.battle.player;
        })
        .catch(error => console.error('Error fetching JSON:', error));

    turnlist = addSubturns(turnlist);
    turnlist = addWrapper(turnlist);
    simplifyPets(turnlist);
    addWantsPreturn(turnlist);
    console.log(turnlist);
}

function addSubturns(oldTurns){
    const newTurns = clone(oldTurns);
    newTurns.forEach((turn,i) => {
        let subTurn = [];
        let subTurns = turn.battleLogs = [];
        oldTurns[i].battleLogs.forEach((string,j) =>{
            if (string.at(0)!=" " && j!=0){
                subTurns.push(clone(subTurn));
                subTurn=[];
            }  
            subTurn.push(string);
        })
        subTurns.push(subTurn);
    });
    return newTurns;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function sumArray(numbers) {
  return numbers.reduce((accumulator, current) => accumulator + current, 0);
}

function addWrapper(oldTurns){
    const wrappedTurns = JSON.parse(JSON.stringify(oldTurns));
    wrappedTurns.forEach((Turn,i) => {
        Turn.battleLogs.forEach((_, j) => {
            Turn.battleLogs[j] = { 
                stringArray : oldTurns[i].battleLogs[j]
            }; 
        });
    });
    return wrappedTurns;
}

function simplifyPets(turnlist){
    turnlist.forEach(turn =>{
        const pets = [...turn.enemy, ...turn.player];
        pets.forEach(pet => simplifyPetsHelper(pet));
    });
}

function simplifyPetsHelper(pet){
    combineAllStats(pet);
    pet.info ={
        animal: removeAnimalStats(pet.info.animal),
        weapon: removeWeaponStats(pet.info.weapon),
        buffs: pet.info.buffs,
        nickname: pet.info.nickname,
        pos: pet.info.pos
    }
    pet.buffs = pet.buffs.map(getBuff);
    delete pet.hp;
    delete pet.wp;
}

function makeStatsGood(input){
    return {
        current     : input[0],
        max	        : input[1]+input[3],
        previous    : input[2]
    }
}

function combineAllStats(pet){
    pet.stats = {
        hp: makeStatsGood(pet.hp),
        str: sumArray(pet.info.stats.att),
        pr: sumArray(pet.info.stats.pr),
        wp: makeStatsGood(pet.wp),
        mag: sumArray(pet.info.stats.mag),
        mr: sumArray(pet.info.stats.mr),
    };
}

function removeAnimalStats(input){
    return {
        stats: [input.hp, input.att, input.pr, input.wp, input.mag, input.mr],
        imageUrl : input.imageUrl,
        names: input.alt,
        rank: input.rank
    }
}

function removeWeaponStats(input){
    return {
        buffs: input.buffs,
        id: formatWeaponID(input.id),
        imageUrl: getUrl(input.emoji),
        manaCost: input.manaCost,
        name: input.name,
        passives: input.passives.map(removePassiveStats),
        qualities: input.qualities,
        qualityList: input.qualityList,
        stats: input.stats,
        wid: input.uwid,
        weaponQuality: input.weaponQuality,
        wear:input.wear,
    }
}

function removePassiveStats(input){
    return {
        id: input.id,
        imageUrl: getUrl(input.emoji),
        name: input.name,
        qualities: input.qualities,
        qualityList: input.qualityList,
        stats: input.stats,
        wear: input.wear
    }
}

function formatWeaponID(num){
    var formatted = String(num).padStart(2, '0');
    formatted = "1"+formatted;
    
    return Number(formatted);
}

function getBuff(buff){
    var buffstring = buff.emoji;
    return {
        imageUrl: getUrl(buffstring),
        name: buffstring.split(":")[1]
    }
}

function getUrl(emojiString){
    emojiString = emojiString.split(":").at(-1);
    emojiString = emojiString.replace(/[>]+/g,'');
    return `https://cdn.discordapp.com/emojis/${emojiString}.png`;
}

function addWantsPreturn(turnList){
    turnList.forEach((turn, i) =>{
        ['enemy', 'player'].forEach(team => {
            turn[team].forEach((pet, j) => {
                var prevTurn = turnList[i-1];
                const prevBuffs = prevTurn?.[team]?.[j]?.buffs || [];                
                var weapon = pet.info.weapon;

                if (weapon.name== "Defender's Aegis" &&
                    enoughHPWP(weapon, pet) &&
                    !hasbuff(prevBuffs,"taunt"))
                {
                    console.log("pet owns a shield and wants to taunt");
                }
                if(weapon.name== "vanguard's banner" &&
                    enoughHPWP(weapon, pet) &&
                    !hasbuff(prevBuffs,"????"))
                {
                    // banner logic is annoyingly complicated
                    // I'll need to track banner buffs seperately first, before i can try tracking other buffs?
                    // stop here for now, come back later
                }
            });
        });    
    });
}

function enoughHPWP(weapon, pet){
    return (  
        weapon.manaCost<=pet.stats.wp.previous &&
        pet.stats.hp.previous >= 0
    )
}

function hasbuff(buffs, query){
    return buffs.some(buff => buff.name === query);
}

function extractTime(log){
    log.forEach(Turn => {
        Turn.battleLogs.forEach(subturn => {
            const step1 = subturn.stringsArray[0];
            const step2 = step1.split(" ")[0];
            const type  = step2.replace(/[\[\]]+/g,'').toLowerCase();
                
            console.log(type);    
            switch (type){
                case "aegis","vban":
                    subturn.time="preturn";
                    break;
                case "phys", "gsword","":
                    // what are the shortened weapon names again?
                    // I'll need to complete extractWantsPreturn() for this, because freeze can be any time
            }
        });
    });
}

function extractActer(oldLog){
    const logWithWrapper = JSON.parse(JSON.stringify(oldLog));
    logWithWrapper.forEach(Turn => {
        Turn.battleLogs.forEach((_, j) => {
            // I'll need position of said pet, thus needing pre/main/post phase tags 
            // i need this because pets could have same names
        });
    });
    return logWithWrapper;
}

function extractWP(oldLog){
    const logWithWrapper = JSON.parse(JSON.stringify(oldLog));
    logWithWrapper.forEach(Turn => {
        // I'll need acter to get accurate WP measurements, especially for banner
    });
    return logWithWrapper;
}

function accountForAOE(originalLog){
    const logWithAOE = JSON.parse(JSON.stringify(oldLog));

    logWithAOE.logs.forEach(newTurn => {
        // I'll need to extract the WP string first, because that's annoying
    });
    return logWithAOE;
}