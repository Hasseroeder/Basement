const xValues = Array.from({ length: 90 }, (_, index) => index + 1);
const yZero = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 0) / (125  + 2 * index * 0));
const yOne = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 1) / (125  + 2 * index * 1));
const yTwo = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 2) / (125  + 2 * index * 2));
const yThree = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 3) / (125  + 2 * index * 3));
const yFour = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 4) / (125  + 2 * index * 4));
const yFive = Array.from({ length: 90 }, (_, index) => 0.8 * (25+2 * index * 5) / (125  + 2 * index * 5));

const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    //listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'row';
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);
  
  
    items.forEach((item, index)=> {
      const li = document.createElement('li');
      li.style.position = 'relative';
      li.style.alignItems = 'center';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.flexDirection = 'row';
      li.style.marginLeft = '10px';
      li.style.marginBottom = '10px';

      li.onclick = () => {
        const {type} = chart.config;
        if (type === 'pie' || type === 'doughnut') {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
        }
        chart.update();
      };

      const image = document.createElement('img');
      image.src = `media/owo_images/resistance_chart/image_${5-index}.gif`; // Replace this with the image URL or logic to generate the image source dynamically
      image.alt = item.text; // Add an alt attribute for accessibility
      image.style.height = '20px'; // Set the image size to match the color box
      image.style.width = '20px';
      image.style.marginRight = '10px';
      image.style.position = 'absolute'; // Position the image absolutely
      image.style.top = '-1'; // Adjust positioning
      image.style.left = '0';

      
      // Color box
       
      const boxSpan = document.createElement('span');
      boxSpan.style.background = item.fillStyle;
      boxSpan.style.borderColor = item.strokeStyle;
      boxSpan.style.borderWidth = item.lineWidth + 'px';
      boxSpan.style.display = 'inline-block';
      boxSpan.style.flexShrink = 0;
      boxSpan.style.height = '20px';
      boxSpan.style.marginRight = '10px';
      boxSpan.style.width = '20px';
      
      
      // Text
      const textContainer = document.createElement('p');
    
      textContainer.style.margin = 0;
      textContainer.style.padding = 0;
      textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

      const text = document.createTextNode(item.text);
      textContainer.appendChild(text);
      
      li.appendChild(image);
      li.appendChild(boxSpan);
      li.appendChild(textContainer);
      ul.appendChild(li);
    });
  }
};


function initializeresChart(){    
  new Chart("myChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        pointHoverRadius: 7,
        fill: false,
        label:"5 Res",
        lineTension: 0.5,
        backgroundColor: "RGBA(139, 122, 190, 0.2)",
        borderColor: "RGBA(139, 122, 190, 1)",
        pointRadius:0,
        data: yFive
      },{
        pointHoverRadius: 7,
        fill: false,
        label:"4 Res",
        lineTension: 0.5,
        backgroundColor: "RGBA(149, 149, 149, 0.2)",
        borderColor: "RGBA(149, 149, 149, 1)",
        pointRadius:0,
        data: yFour
      },{
        pointHoverRadius: 7,
        fill: false,
        label:"3 Res",
        lineTension: 0.5,
        backgroundColor:"RGBA(255, 217, 102, 0.2)",
        borderColor: "RGBA(255, 217, 102, 1)",
        pointRadius:0,
        data: yThree
      },{
        pointHoverRadius: 7,
        fill: false,
        label:"2 Res",
        lineTension: 0.5,
        backgroundColor: "RGBA(111, 168, 220, 0.2)",
        borderColor: "RGBA(111, 168, 220, 1)",
        pointRadius:0,
        data: yTwo
      },{
        pointHoverRadius: 7,
        fill: false,
        label:"1 Res",
        lineTension: 0.5,
        backgroundColor: "RGBA(255, 217, 102, 0.2)",
        borderColor: "RGBA(255, 217, 102, 1)",
        pointRadius:0,
        data: yOne
      },{
        pointHoverRadius: 7,
        fill: false,
        label:"0 Res",
        lineTension: 0.5,
        backgroundColor: "RGBA(147, 196, 125, 0.2)",
        borderColor: "RGBA(147, 196, 125, 1)",
        pointRadius:0,
        data: yZero
      }]
    },
    plugins: [htmlLegendPlugin],
    options: {
      onHover: function(event, chartElement) {
          // Get the div to update
          const targetDiv5 = document.getElementById('percentage-container5');
          const targetDiv4 = document.getElementById('percentage-container4');
          const targetDiv3 = document.getElementById('percentage-container3');
          const targetDiv2 = document.getElementById('percentage-container2');
          const targetDiv1 = document.getElementById('percentage-container1');
          const targetDiv0 = document.getElementById('percentage-container0');
          const levelDiv   = document.getElementById('level-container');

          // Check if the mouse is over a chart element
          if (chartElement.length) {
              const index = chartElement[0].index; // Hovered index
              levelDiv.textContent = `Level ${index}`
              targetDiv5.textContent = `${(this.data.datasets[0].data[index]*100).toFixed(1)}%`;
              targetDiv4.textContent = `${(this.data.datasets[1].data[index]*100).toFixed(1)}%`;
              targetDiv3.textContent = `${(this.data.datasets[2].data[index]*100).toFixed(1)}%`;
              targetDiv2.textContent = `${(this.data.datasets[3].data[index]*100).toFixed(1)}%`;
              targetDiv1.textContent = `${(this.data.datasets[4].data[index]*100).toFixed(1)}%`;
              targetDiv0.textContent = `${(this.data.datasets[5].data[index]*100).toFixed(1)}%`;
              
          }
      },
      
      hover: {
        mode: 'index', // 'nearest' or 'index'
        intersect: false // Allows hovering even if not directly over a point
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
          // ID of the container to put the legend in
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
