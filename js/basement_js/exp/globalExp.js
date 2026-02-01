import { make } from "../util/injectionUtil.js";

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
	.then(txt => txt.split(/\r?\n/).forEach(line => {
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

function attachBattleCalculator(){
	const output = () => outputField.textContent= 
		battleExp(+streak.value,+tierate.value).toFixed(2); 

	const streak = make('input',{ 
		className:'global-inputs no-arrows', 
		type: 'number', min: 0, max: 1e6, step: 1, value: 1, lang: 'en',
		oninput:output
	});
	const tierate = make('input',{ 
		className:'global-inputs no-arrows', 
		type: 'number', min: 0,	max: 100, step: 0.01, value: 0,	lang: 'en',
		oninput:output
	});
	const outputField = make('div');

	this.container.append(
		make('div', {className: 'global-column align-child-text-right'},[streak, tierate, outputField]), 
		make('div',  {className: 'global-column' },[
			make('div', {textContent:"streak"}), 
			make('div', {textContent:"% tierate"}), 
			make('div', {textContent:"exp/battle"})
		])
	);

	output();
}

function attachExpChart(){
	const ctx = make("canvas");
	const slider = make("input",{
		className:"global-tierate-slider", type:"range", min:"0", max:"100", step:"1", value:"0"
	});

	const percentText = make("div",{innerHTML:"0%"});
	const tierateText = make("div",{innerHTML:"tierate"});
	const textWrapper = make("div",{style:"height: 4.4rem"},[percentText,tierateText]);

	this.container.append(
		make("div",{className:"global-chart-wrapper"},[ctx]),
		make("div",{className:"global-slider-wrapper"},[slider,textWrapper])
	);

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
				borderColor: "rgba(154, 213, 213, 1)",
			}]
		},
		options: {
			animation: false,
			plugins:{
				legend: { display: false },
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
				y: { min:0, max:1400, 
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
						callback: value => value
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

function attachLatex(){
	const rawLatex = String.raw
	`$$
	\displaylines{  
		\mathrm{Multi}(n) =
		\begin{cases}
			25 & \mathrm{if} \ n\bmod 100=0,\\
			10 & \mathrm{if} \ n\bmod 50=0,\\
			5 & \mathrm{if} \ n\bmod 10=0,\\
			3 & \mathrm{if} \ n\bmod 5=0,\\
			1 & \mathrm{otherwise}
		\end{cases}        
		\\\\
		\mathrm{Exp}_\mathrm{bonus}(n) = 
			\min
			\biggr(
				100000,
				\Bigr\lfloor\mathrm{Multi}(n) \cdot \left( 10\sqrt{10n} +500\right)\Bigr\rceil
			\biggr)
		\\\\
		\mathrm{Exp}_\mathrm{streak}(s)=
			50
			+200s
			+\sum_{n=1}
			\Biggl[
				\bigg(\frac{s}{s+1}\bigg)^{10n}
				\cdot 
				\mathrm{Exp}_\mathrm{win}(n)
			\Biggl]
		\\\\
		\mathrm{Exp}_\mathrm{battle}(s,t)= 
		\frac
			{\mathrm{Exp}_\mathrm{streak}(s)\cdot (1-t)}
			{s+1}
			+100t
		}
	$$`;
	this.container.textContent=rawLatex;
	window.MathJax.typesetPromise([this.container]);
}

export function initGlobal(){
	const { cachedDiv } = this;
	window.MathJax.typesetPromise([cachedDiv]);
	const wrapper = cachedDiv.querySelector("#tabContainer");
	const buttonWrapper = make("div", { style: "display:flex;" });
  	const contentWrapper = make("div");
	wrapper.append(buttonWrapper,contentWrapper);

	const tabs = [
		{name:"Function", 	init:attachLatex 			/*, button, container */},
		{name:"Calculator", init:attachBattleCalculator /*, button, container */},
		{name:"Graph", 		init:attachExpChart 		/*, button, container */}
	]

	tabs.forEach(t =>{
		t.container = make("div", { className: "global-content-container" });
    	t.button =    make("button", { 
			className: "tab-button", 
			textContent: t.name,
			onclick: e =>{
				tabs.forEach(tab => tab.button.classList.remove("tab-button-active"))
				e.target.classList.add("tab-button-active");
				contentWrapper.replaceChildren(t.container);
			}
		});
		buttonWrapper.append(t.button);
		t.init();
	});

	tabs[0].button.click();
}