const multiTable = new Array(100).fill(1); 
for (let i = 0; i < 100; i += 5) multiTable[i] = 3; 
for (let i = 0; i < 100; i += 10) multiTable[i] = 5; 
for (let i = 0; i < 100; i += 50) multiTable[i] = 10; 
multiTable[0] = 25; 

function bonusXp(n){
  // for 10*n, since we're going in steps of 10
  const dynamic = 10 * Math.sqrt(10*n)
  const bonus = multiTable[n % 100]*(dynamic+500);
  return Math.min(100000, Math.round(bonus));
}

function battleExp(s, t) {
  const winChance = s / (s + 1);
  const lossPart  = 50;
  const winPart   = 200 * s;
  let sum = lossPart + winPart;

  for (let n=1; n<s; n++) {
    sum += winChance**(10*n) 
           * bonusXp(n);
  }

  const battleExp = 
    sum*(1-t)/(s+1) 
    + 100*t;
  return battleExp;
}

console.log(battleExp(700,0.1));