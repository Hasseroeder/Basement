const resButton = document.getElementById("resChartButton");
const resContainer = document.getElementById("resChartContainer");
let isResCreated = false; // Flag to track the state

const hpButton = document.getElementById("effectiveHealthButton");
const hpContainer = document.getElementById("effectiveHealthContainer");
let isHpCreated = false;

const statButton = document.getElementById("effectiveStatsButton");
const statContainer = document.getElementById("effectiveStatsContainer");
let isStatCreated = false;

resButton.addEventListener('click', async function() {
    if (isResCreated) {
        // Delete the <div> if it exists
        const divToRemove = document.querySelector(".dynamic-chart-div");
        if (divToRemove) {
            resContainer.removeChild(divToRemove);
        }
        isResCreated = false; // Update the flag
    }else{ 
      try {
          const response = await fetch('donatorPages/resChart.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          // Create a div and add the fetched content
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-chart-div";
        
          // Append the div to the container
          document.getElementById('resChartContainer').appendChild(newDiv);
          isResCreated = true;
      } catch (error) {
          console.error('Error:', error);
      }
      createChart();
    }  
});

hpButton.addEventListener('click', async function() {
    // Fetch the external HTML file
    if (isHpCreated) {
        // Delete the <div> if it exists
        const divToRemove = document.querySelector(".dynamic-hp-div");
        if (divToRemove) {
            hpContainer.removeChild(divToRemove);
        }
        isHpCreated = false; // Update the flag
    }else{ 
      try {
          const response = await fetch('donatorPages/effectiveHP.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          // Create a div and add the fetched content
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-hp-div";
        
          // Append the div to the container
          document.getElementById('effectiveHealthContainer').appendChild(newDiv);
          isHpCreated = true;
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});

statButton.addEventListener('click', async function() {
    // Fetch the external HTML file
    if (isStatCreated) {
        // Delete the <div> if it exists
        const divToRemove = document.querySelector(".dynamic-stat-div");
        if (divToRemove) {
            statContainer.removeChild(divToRemove);
        }
        isStatCreated = false; // Update the flag
    }else{ 
      try {
          const response = await fetch('donatorPages/effectiveStats.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          // Create a div and add the fetched content
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-stat-div";
        
          // Append the div to the container
          document.getElementById('effectiveStatsContainer').appendChild(newDiv);
          isStatCreated = true;
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});
