const xValues = Array.from({ length: 90 }, (_, index) => index + 1);

const makeSeries = resAmount =>
	Array.from({ length: 90 }, (_, i) =>
		0.8 * (25 + 2 * i * resAmount) / (125 + 2 * i * resAmount)
);

const colorPalette = [
	"rgb(147, 196, 125)", // spider
	"rgb(255, 217, 102)", // deer
	"rgb(111, 168, 220)", // gorilla
	"rgb(175, 85, 82)",   // parrot
	"rgb(149, 149, 149)", // giraffbot
	"rgb(139, 122, 190)"  // koala
]

const datasets = [5,4,3,2,1,0].map((resAmount) => ({
	label: `${resAmount} Res`,
	data: makeSeries(resAmount),
	borderColor: colorPalette[resAmount],
	pointRadius: 0,           
	pointHoverRadius: 7,
}));

const htmlLegendPlugin = {
  	id: 'htmlLegend',
  	beforeInit(chart) {
		const legendContainer = chart.options.plugins.htmlLegendPlugin.legendDiv;
		const ul = document.createElement('ul');
		ul.className = 'res-li-container';
		legendContainer.append(ul);

		chart.legendText = [];
		chart.percents   = [];

		chart.data.datasets.forEach((ds, idx) => {
			const li = document.createElement('li');
			li.className = 'res-li';

			li.onclick = () => {
				chart.setDatasetVisibility(idx, !chart.isDatasetVisible(idx));
				chart.update();
			};

			const img = document.createElement('img');
			img.src = `media/owo_images/resistance_chart/image_${5 - idx}.gif`;
			img.alt = ds.label;
			img.className = 'res-image';

			const box = document.createElement('span');
			box.style.background = ds.borderColor;
			box.style.borderRadius = "10px";
			box.style.width="7px";
			box.style.height="7px";
			box.style.marginRight="2px";
			
			const p = document.createElement('p');
			p.className = 'resTextContainer';
			p.textContent = ds.label;

			const percentSpan = document.createElement('span');
			percentSpan.style.color="#aaa";

			li.append(box, img, p, percentSpan);
			ul.appendChild(li);

			chart.percents.push(percentSpan);
			chart.legendText.push(li);
		});
  	},

	afterUpdate(chart) {
		chart.legendText.forEach((p, idx) => {
			p.style.textDecoration = chart.isDatasetVisible(idx)
				? ''
				: 'line-through';
			});
	}
};

function initializeResChart(){
	const container = this.cachedDiv.querySelector("#chartContainer");
	const lvlDiv = container.querySelector('#level-container');
	const legendDiv = container.querySelector("#legend-container");
	const ctx = container.querySelector('#myChart');

  	new Chart(ctx, {
		type: "line",
		data: {
			labels: xValues,
			datasets: datasets
		},
		plugins: [htmlLegendPlugin],
		options: {
      		onHover: function(_, chartElement,chart) {
        		if (chartElement.length) {
					const level = chartElement[0].index; 
					const nbsp  = "\u00A0";
					lvlDiv.textContent = `Level ${level}`
					this.data.datasets.forEach((ds, i) => {
						chart.percents[i].textContent = nbsp+nbsp+nbsp+(ds.data[level] * 100).toFixed(1) + '%';          
					});
        		}
      		},
			hover: {
				mode: 'index', 
				intersect: false 
			},
      		responsive:true,
			plugins: {
				tooltip: {enabled:false},
				legend: {display: false},
				htmlLegendPlugin:{legendDiv: legendDiv}
			},
			scales: {
				x: {
					grid:{color:'#404040'},
					ticks: { 
					color: 'lightgray',
						callback: function (value, index) {
							return index % 5 === 0 ? value : null; // Show every fifth tick
						},
					},
					title: {
						display: true, // Show the title
						text: 'Pet Level', // Title text
					}
				},  
				y: {
					beginAtZero:true,
					grid:{color:'#404040'},
					ticks:{
						color: 'lightgray',
							callback: function(value) {
								if (value === 0) {
									return '0%'; // Explicitly format 0
								}
								else{ 
									return (value * 100) + '%';
								}  
							}
					},
					title: {
						display: true, // Show the title
						text: 'Actual Resistance', // Title text
					}
				}
      		}
    	}
  	});
}    
