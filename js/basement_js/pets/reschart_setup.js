const xValues = Array.from({ length: 90 }, (_, index) => index + 1);
const yZero = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 0) / (125  + 2 * index * 0));
const yOne = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 1) / (125  + 2 * index * 1));
const yTwo = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 2) / (125  + 2 * index * 2));
const yThree = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 3) / (125  + 2 * index * 3));
const yFour = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 4) / (125  + 2 * index * 4));
const yFive = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 5) / (125  + 2 * index * 5));

const htmlLegendPlugin = {
  id: 'htmlLegend',
  beforeInit(chart, _, options) {
    const legendContainer = document.getElementById(options.containerID);
    const ul = document.createElement('ul');
    ul.className = 'res-li-container';
    legendContainer.insertBefore(ul, legendContainer.firstChild);

    chart.legendText = [];

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
      box.style.background = ds.borderColor; // or backgroundColor/borderColor
      box.style.borderRadius = "10px";
      box.style.width="7px";
      box.style.height="7px";
      box.style.marginRight="2px";
      //box.className = 'res-image';
      
      const p = document.createElement('p');
      p.className = 'resTextContainer';
      p.textContent = ds.label;

      li.append(box, img, p);
      ul.appendChild(li);

      chart.legendText.push(p);
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


function initializeresChart(){    
  const divs = {
    0:document.getElementById('percentage-container5'),
    1:document.getElementById('percentage-container4'),
    2:document.getElementById('percentage-container3'),
    3:document.getElementById('percentage-container2'),
    4:document.getElementById('percentage-container1'),
    5:document.getElementById('percentage-container0'),
    lvl: document.getElementById('level-container')
  }

  new Chart("myChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        pointHoverRadius: 7, // koala
        fill: false,
        label:"5 Res",
        lineTension: 0.5,
        borderColor: "rgb(139, 122, 190)",
        pointRadius:0,
        data: yFive
      },{
        pointHoverRadius: 7, // giraffe
        fill: false,
        label:"4 Res",
        lineTension: 0.5,
        borderColor: "rgb(149, 149, 149)",
        pointRadius:0,
        data: yFour
      },{
        pointHoverRadius: 7, // owl
        fill: false,
        label:"3 Res",
        lineTension: 0.5,
        borderColor: "rgb(255, 217, 102)",
        pointRadius:0,
        data: yThree
      },{
        pointHoverRadius: 7, // gorilla
        fill: false,
        label:"2 Res",
        lineTension: 0.5,
        borderColor: "rgb(111, 168, 220)",
        pointRadius:0,
        data: yTwo
      },{
        pointHoverRadius: 7, // deer
        fill: false,
        label:"1 Res",
        lineTension: 0.5,
        borderColor: "rgb(255, 217, 102)",
        pointRadius:0,
        data: yOne
      },{
        pointHoverRadius: 7, // spider
        fill: false,
        label:"0 Res",
        lineTension: 0.5,
        borderColor: "rgb(147, 196, 125)",
        pointRadius:0,
        data: yZero
      }]
    },
    plugins: [htmlLegendPlugin],
    options: {
      onHover: function(_, chartElement) {
        if (chartElement.length) {
          const index = chartElement[0].index; // Hovered level
          divs.lvl.textContent = `Level ${index}`
          this.data.datasets.forEach((ds, i) => {
            divs[i].textContent = (ds.data[index] * 100).toFixed(1) + '%';
          });
        }
      },
      
      hover: {
        mode: 'index', 
        intersect: false 
      },
      responsive:true,
      plugins: {
        tooltip: {
          enabled:false,
        },
        legend: {
          display: false,
        },
        htmlLegend: {
          containerID: 'legend-container',
        },
      },
      scales: {
        x: {
          beginAtZero:true,
          grid:{
            color:'#404040'
          },
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
          grid:{
            color:'#404040'
          },
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
