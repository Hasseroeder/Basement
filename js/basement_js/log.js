main();
async function main(){
    
    var originalLog;
    var newlog;
    var enemy;
    var player;

    await fetch('../json/log.json')
        .then(response => response.json())
        .then(data => {
            originalLog = data.logs;
            newlog = data.logs;
            enemy = data.battle.enemy;
            player = data.battle.player;
        })
        .catch(error => console.error('Error fetching JSON:', error));

    newlog = addSubturns(newlog);
    newlog = addWrapper(newlog);
    console.log(newlog);

}

function addSubturns(oldLog){
    const logWithSubturns = JSON.parse(JSON.stringify(oldLog));
    logWithSubturns.forEach((newTurn,i) => {
        newTurn.battleLogs.length = 0;
        var currentSubTurn=[];
        oldLog[i].battleLogs.forEach((string,j) =>{
            if (string.at(0)!=" " && j!=0){
                pushTurnToLog(newTurn, currentSubTurn);
            }  
            currentSubTurn.push(string);
        })
        pushTurnToLog(newTurn, currentSubTurn);
    });
    return logWithSubturns;
}

function pushTurnToLog(newTurn, currentTurn){
    newTurn.battleLogs.push(JSON.parse(JSON.stringify(currentTurn)));
    currentTurn.length=0;
}

function addWrapper(oldLog){
    const logWithWrapper = JSON.parse(JSON.stringify(oldLog));
    logWithWrapper.forEach((Turn,i) => {
        Turn.battleLogs.forEach((_, j) => {
            Turn.battleLogs[j] = { 
                stringsArray : oldLog[i].battleLogs[j]
            }; 
        });
    });
    return logWithWrapper;
}

function extractTime(Log){
    Log.forEach(Turn => {
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

            }
        });
    });
}

function extractActer(oldLog){
    const logWithWrapper = JSON.parse(JSON.stringify(oldLog));
    logWithWrapper.forEach(Turn => {
        Turn.battleLogs.forEach((_, j) => {
            // I'll need position of said pet, thus needing pre/main/post phase tags 
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
        
    });
    return logWithAOE;
}