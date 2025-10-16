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

function calcBonusXp(streak){
	const winChance = streak / (streak + 1);
	const accuracyFactor = 1; // this is basically a config constant, 
							  // make it higher if you want more accuracy,
							  // or lower if you want faster execution

	let sum = 0;
	for (let n=1; n<=streak*accuracyFactor; n++) {
		sum += winChance**(10*n) 
			* bonusXp(n);
	}
	return sum;
}

const _xpCache = new Map();
function cachedBonusXp(streak){
	const key = String(streak);
	if (_xpCache.has(key)) return _xpCache.get(key);
	const result = calcBonusXp(streak);
	_xpCache.set(key, result);
	return result;
}

await fetch('../csv/bonusXP.csv')
	.then(r => r.text())
	.then(txt => txt.split(/\r?\n/).slice(1))
	.then(lines => lines.forEach(line => {
		const [key, val] = line.split(',');
		_xpCache.set(key, +val);
	}));

function battleExp(s, t) {
	const tieChance = 0.01*t;             // converting from percent to decimal
	const lossPart  = 50;                 // adding 50xp because each streak will have a loss, giving 50
	const winPart   = 200 * s;            // average amount of wins in the streak, giving 200
	const bonusPart = cachedBonusXp(s);
	const sum = lossPart + winPart + bonusPart;

	const battleExp = 
		sum
		*(1-tieChance)
		/(s+1) 
		+ t;
	return battleExp;
}

function attachBattleCalculator(container){
	const el = (tag, cls) => {
		const e = document.createElement(tag);
		if (cls) e.className = cls;
		return e;
	};

	const createInput = (opts = {}) => {
		const i = el('input', 'global-inputs no-arrows');
		Object.assign(i, opts);
		i.addEventListener('input', output);
		return i;
	};

	function output(){ 
		outputField.textContent= 
		battleExp(
			+streak.value,
			+tierate.value
		).toFixed(2); 
	}

	const left = el('div', 'global-column align-child-text-right');
	const right = el('div', 'global-column');

	const streak = createInput({ type: 'number', min: 0, max: 1e6, step: 1, value: 1, lang: 'en' });
	const tierate = createInput({ type: 'number', min: 0, max: 100, step: 0.01, value: 0, lang: 'en' });
	const outputField = el('div');

	const label = text => {
		const d = el('div');
		d.textContent = text;
		return d;
	};

	left.append(streak, tierate, outputField);
	right.append(label('streak'), label('% tierate'), label('exp/battle'));
	container.append(left, right);

	output();
}

function attachExpChart(container){
	const chartWrapper= container.querySelector("#chartWrapper");
	const sliderWrapper= container.querySelector("#sliderWrapper");
	const ctx = document.createElement("canvas");
	chartWrapper.append(ctx);

	const slider = document.createElement("input");  
	Object.assign(slider, {
		style:"writing-mode: vertical-lr; direction: ltr; width: 2rem; height: 20rem; margin: 1.6rem 0 0.6rem 0; flex: max-content; padding-bottom: 0.35rem;",
		type:"range",
		min:"0", 
		max:"100", 
		step:"1",
		value:"0"
	});


	const percentText = document.createElement("div");
	percentText.innerHTML="0%";
	const tierateText = document.createElement("div");
	tierateText.innerHTML = "Tierate";

	const textWrapper = document.createElement("div");
	textWrapper.append(percentText, tierateText);
	textWrapper.style="height: 4.8rem";

	sliderWrapper.append(slider,textWrapper);



	let currentTierate = 0;

	const points = Array.from({ length: 101 }, (_, i) =>
		Array.from(_xpCache.keys(), k => {
			const x = +k;
			return { 
				x, 
				y: +battleExp(x, i).toFixed(1) 
			};
		})
	);

	const streakExpChart = new Chart(ctx, {
		type: "line",
		data: {
			datasets: [{
				label: "Exp/Battle",
				data: points[currentTierate],
				borderColor: "rgba(75,192,192,1)",
				fill: true,
				parsing:false
			}]
		},
		options: {
			animation: false,
			plugins:{
				legend: {
					display: false
				},
				tooltip: {
					mode: 'index',
					intersect: false,
					displayColors:false,
					callbacks: {
						title: function (tooltipData) {
							return `Streak: ${tooltipData[0].label}`;
						} 
				},
				}
			},
			hover: { mode: 'index', intersect: false },
			scales: {
				y: { 
					min:0, 
					max:1400, 
					title: {
						display: true,
						text: 'Exp/Battle',
						font: {size: 13},
					}
				},
				x:{
					title: {
						display:true,
						text: 'average Streak',
						font: {size: 13},
					},
					type: "logarithmic",
					ticks: {
						font: {size: 10},
						minRotation: 90,
						maxRotation: 90,
						callback: function(value) {
							return Number.isInteger(value) ? String(value) : '';
						}
					}
				}
			}
    	}
	});

	slider.addEventListener("input", ()=>{
		currentTierate=+slider.value;
		percentText.innerHTML=slider.value+"%";
		streakExpChart.data.datasets[0].data= points[currentTierate];
		streakExpChart.update("none");
	});
}

export function initGlobal(params){
	const container = params.cachedDiv;
	attachBattleCalculator(container.querySelector("#calcWrapper"));
	attachExpChart(container.querySelector("#chartContainer"));
}