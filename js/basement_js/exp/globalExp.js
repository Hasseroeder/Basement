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
	.then(txt => txt.split(/\r?\n/))
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

function attachBattleCalculator(){
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
	this.container.append(left, right);

	output();
}

function attachExpChart(){
	const chartWrapper = document.createElement("div");
	const sliderWrapper = document.createElement("div");
	this.container.append(chartWrapper,sliderWrapper);
	chartWrapper.style="aspect-ratio: auto 600 / 300; display:flex; width:100%; min-width: 0;";
	sliderWrapper.style="padding:0rem 0.5rem; text-align: center; font-size: 0.8rem; color:#707070; display: flex; flex-direction: column; align-items: center;";

	const ctx = document.createElement("canvas");
	chartWrapper.append(ctx);

	const slider = document.createElement("input");  
	Object.assign(slider, {
		style:"writing-mode: vertical-lr; direction: ltr; width: 2rem; height: 20rem; margin: 0.6rem 0 0 0; flex: max-content; padding-bottom: 0.5rem;",
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
	textWrapper.style="height: 4.4rem";

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
	const make = (tag, props = {}) => Object.assign(document.createElement(tag), props);
	window.MathJax.typesetPromise([cachedDiv]);
	const wrapper = cachedDiv.querySelector("#tabContainer");
	const buttonWrapper = make("div", { style: "display:flex;" });
  	const contentWrapper = make("div");
	wrapper.append(buttonWrapper,contentWrapper);

	const tabs = [
		{name:"Function", init:attachLatex},
		{name:"Calculator", init:attachBattleCalculator},
		{name:"Graph", init:attachExpChart}
	]

	tabs.forEach(t =>{
		t.container = make("div", { className: "global-content-container" });
    	t.button =    make("button", { className: "tab-button", textContent: t.name });
		buttonWrapper.append(t.button);
		t.init();
		t.button.addEventListener("click", () =>{
			tabs.forEach(tab => tab.button.classList.remove("tab-button-active"))
			t.button.classList.add("tab-button-active");
			contentWrapper.replaceChildren(t.container);
		});
	});

	tabs[0].button.click();
}