import { make } from "../util/injectionUtil.js";

const wpp = (tier, patreon) => {
    const rest = [
        {rate:0.3,                  value: 10},     //uncommon
        {rate:0.1,                  value: 20},     //rare
        {rate:0.01,                 value: 400},    //epic
        {rate:0.001,                value: 1000},   //mythic
        {rate:patreon ? 0.005 : 0,  value: 400},    //patreon
        {rate:patreon ? 0.0001 : 0, value: 2000},   //custom patreon
        {rate:0.0005,               value: 2000},   //legendary
        {rate:0.00001 * tier,       value: 5000},   //gem
        {rate:0.00001,              value: 100000}, //fabled
        {rate:0.000001,             value: 300000}  //hidden
    ];

    const common = {
        rate: 1 - rest.reduce((s, v) => s + v.rate, 0),
        value: 1
    };

    const allTiers = [common, ...rest];

    return allTiers.reduce((s,v)=>s + v.rate * v.value,0);
};

const F = (tier,patreon) =>
    ([1,2,4,5,6,7,8,10][tier])  // pets with hunting gem
    *(tier>0? 2:1)              // empowering gem mult
    *wpp(tier,patreon)          // worth per pet

const tiers = [
    {                  label:"No Gems",           background: 'rgba(160, 160, 160, 0.2)', border:'rgb(200, 200, 200)'},
    {imageType:".png", label:"Common Gems",       background: 'rgba(154, 45, 43, 0.2)',   border:'rgb(168, 94, 93)'},
    {imageType:".png", label:"Uncommon Gems",     background: 'rgba(42, 137, 154, 0.2)',  border:'rgb(81, 151, 164)'},
    {imageType:".png", label:"Rare Gems",         background: 'rgba(217, 168, 61, 0.2)',  border:'rgb(219, 177, 85)'},
    {imageType:".png", label:"Epic Gems",         background: 'rgba(51, 77, 234, 0.2)',   border:'rgb(81, 103, 232)'},
    {imageType:".png", label:"Mythic Gems",       background: 'rgba(142, 73, 244, 0.2)',  border:'rgb(163, 108, 247)'},
    {imageType:".gif", label:"Legendary Gems",    background: 'rgba(251, 241, 61, 0.2)',  border:'rgb(234, 228, 105)'},
    {imageType:".gif", label:"Fabled Gems",       background: 'rgba(150, 220, 250, 0.2)', border:'rgb(181, 234, 248)'}
];

const gemImages = [1,2,3,4,5,6,7].map(i=>
    make("img",{
        src: `/media/owo_images/gem${i}1${tiers[i].imageType}`
    }
)); 

const drawImagesPlugin = {
  	id: 'drawImages',
	afterDatasetsDraw(chart, _) {
		const ctx = chart.ctx;
		const meta0 = chart.getDatasetMeta(0);
		const meta1 = chart.getDatasetMeta(1);
		const size = 32;
		const bottom = chart.chartArea.bottom;

		for (let i = 0; i <= meta0.data.length; i++) {
			const el0 = meta0.data[i+1];
			const el1 = meta1.data[i+1];
			const img = gemImages[i];
			if (!img || !img.complete) continue;
			const x = (el0.x + el1.x) / 2 - size / 2;
			const y = bottom - (size/2);

			ctx.drawImage(img, x, y, size, size);
		}
	}
};

new Chart(document.getElementById('myChart'), {
    type: 'bar',
    data: {
        labels: tiers.map(t=>t.label),
        datasets: [{
            label: 'no Patreon',
            data: tiers.map((_,i)=>F(i,false)),
            backgroundColor: tiers.map(t=>t.background),
            borderColor: tiers.map(t=>t.border),
            borderWidth: 1
        },{
            label: 'Patreon',
            data: tiers.map((_,i)=>F(i,true)),
            backgroundColor: tiers.map(t=>t.background),
            borderColor: tiers.map(t=>t.border),
            borderWidth: 1
        }]
    },
    options: {
      plugins: {
            customLabel: true,
            tooltip: {
                usePointStyle: false,
                xAlign:'center',
                yAlign:'bottom',
                
                displayColors: false ,
                callbacks: {
                    label: function(tooltipItem) {
                        let roundedValue = Math.round(tooltipItem.raw * 100) / 100;
                        return [tooltipItem.dataset.label, roundedValue+" exp/hunt"];
                    },
                    labelColor: () => {
                        return {
                            borderColor: 'transparent',
                            backgroundColor: 'transparent'
                        };
                    }
                    
                    
                }    
            },
            legend: {display: false}
        },
      	scales: {
            x: {
                grid:{color:'#404040'},
                ticks: {
                  callback: function(_,__) {
                    return "";
                  }
                } 
            },
            y: {
                beginAtZero: true,
                grid: {color:'#404040'},
                ticks: {color: 'lightgray'}
            }
        }
    },
    plugins: [drawImagesPlugin]
});