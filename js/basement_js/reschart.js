
function createChart(){    
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