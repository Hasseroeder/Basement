const ctx = document.getElementById('myChart').getContext('2d');

const u = 0.3;
const r = 0.1;
const e = 0.01;
const m = 0.001;
const p1 = [0,0.005];
const p2 = [0,0.0001];
const l  = 0.0005;
function g(x) { return 0.00001*x} 
const f  = 0.00001;
const h  = 0.000001;

function c(x,p) { return 1 - (u+r+e+m+p1[p]+p2[p]+l+g(x)+f+h);}

function w(x,p) { return (c(x,p) + 10*u + 20*r + 400*e + 1000*m+ 400*p1[p] + 2000*p2[p] + 2000*l + 5000*g(x) + 100000*f + 300000*h); }

function F(x,p) { return (1+x)*w(x,p)*(x>=1?2:1) }

const customLabelPlugin = {
  id: 'customLabel',
  afterDraw(chart) {
    const ctx = chart.ctx;
    chart.data.labels.forEach((label, index) => {
      const image = new Image();

      const meta = chart.getDatasetMeta(0);
      if (meta.data[index] && index != 0) {
        if (index <6){
          image.src = `/media/owo_images/gem${index}1.png`; 
        }else{
          image.src = `/media/owo_images/gem${index}1.gif`; 
        }  
      
        const position = meta.data[index].tooltipPosition();
        const offset = meta.data[index].height;
        ctx.drawImage(image, position.x, position.y -15 +offset, 30, 30);
      }
    });
  }
};


const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['no Gems', 'Common Gems', 'Uncommon Gems', 'Rare Gems', 'Epic Gems', 'Mythic Gems', 'Legendary Gems', 'Fabled Gems'],
        datasets: [{
            label: 'no Patreon',
            data: [
              F(0,0), 
              F(1,0), 
              F(2,0), 
              F(3,0), 
              F(4,0), 
              F(5,0),
              F(6,0),
              F(7,0)
              ],
            backgroundColor: [
                'rgba(160, 160, 160, 0.2)',
                'rgba(154, 45, 43, 0.2)',
                'rgba(42, 137, 154, 0.2)',
                'rgba(217, 168, 61, 0.2)',
                'rgba(51, 77, 234, 0.2)',
                'rgba(142, 73, 244, 0.2)',
                'rgba(251, 241, 61, 0.2)',
                'rgba(150, 220, 250, 0.2)'
            ],
            borderColor: [
                'rgba(200, 200, 200, 1)',
                'rgba(168, 94, 93, 1)',
                'rgba(81, 151, 164, 1)',
                'rgba(219, 177, 85, 1)',
                'rgba(81, 103, 232, 1)',
                'rgba(163, 108, 247, 1)',
                'rgba(251, 244, 116, 1)',
                'rgba(248,252,253, 1)'
            ],
            borderWidth: 1
        },{
            label: 'Patreon',
            data: [
              F(0,1), 
              F(1,1), 
              F(2,1), 
              F(3,1), 
              F(4,1), 
              F(5,1),
              F(6,1),
              F(7,1)
              ],
            backgroundColor: [
                'rgba(160, 160, 160, 0.2)',
                'rgba(154, 45, 43, 0.2)',
                'rgba(42, 137, 154, 0.2)',
                'rgba(217, 168, 61, 0.2)',
                'rgba(51, 77, 234, 0.2)',
                'rgba(142, 73, 244, 0.2)',
                'rgba(251, 241, 61, 0.2)',
                'rgba(150, 220, 250, 0.2)'
            ],
            borderColor: [
                'rgba(200, 200, 200, 1)',
                'rgba(168, 94, 93, 1)',
                'rgba(81, 151, 164, 1)',
                'rgba(219, 177, 85, 1)',
                'rgba(81, 103, 232, 1)',
                'rgba(163, 108, 247, 1)',
                'rgba(251, 244, 116, 1)',
                'rgba(248,252,253, 1)'
            ],
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
                    title: function(tooltipItem) {
                        //let temp = String(tooltipItem.dataset.label);
                      
                        return "";
                    },
                    labelColor: () => {
                        return {
                            borderColor: 'transparent',
                            backgroundColor: 'transparent'
                        };
                    }
                    
                    
                }    
            },
            legend: {
                display: false // This hides the legend
            }
        },
      scales: {
            x: {
                grid:{
                  color:'#404040'
                },
                ticks: {
                  callback: function(value, index) {
                    return ""; // Replace `desiredIndex` with the index of "May"
                  }
                } 
            },
        
            y: {
                beginAtZero: true,
                grid:{
                  color:'#404040'
                },
                ticks: {
                    color: 'lightgray',
                }
            }
        }
    },
    plugins: [customLabelPlugin]
});
