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