import { initializeTriangle } from './triangle.js';
import { initializeTriangle2 } from './triangle2.js';

const resButton = document.getElementById("resChartButton");
const resContainer = document.getElementById("resChartContainer");
let isResCreated = false; 

const hpButton = document.getElementById("effectiveHealthButton");
const hpContainer = document.getElementById("effectiveHealthContainer");
let isHpCreated = false;

const statButton = document.getElementById("effectiveStatsButton");
const statContainer = document.getElementById("effectiveStatsContainer");
let isStatCreated = false;

const triangleButton = document.getElementById("triangleButton");
const triangleContainer = document.getElementById("triangleContainer");
let isTriangleCreated = false;

const triangle2Button = document.getElementById("triangle2Button");
const triangle2Container = document.getElementById("triangle2Container");
let isTriangle2Created = false;

resButton.addEventListener('click', async function() {
    if (isResCreated) {
        const divToRemove = document.querySelector(".dynamic-chart-div");
        if (divToRemove) {
            resContainer.removeChild(divToRemove);
        }
        isResCreated = false; 
    }else{ 
      try {
          const response = await fetch('donatorPages/resChart.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-chart-div";
        
          document.getElementById('resChartContainer').appendChild(newDiv);
          isResCreated = true;
      } catch (error) {
          console.error('Error:', error);
      }
      createChart();
    }  
});

hpButton.addEventListener('click', async function() {
    if (isHpCreated) {
        const divToRemove = document.querySelector(".dynamic-hp-div");
        if (divToRemove) {
            hpContainer.removeChild(divToRemove);
        }
        isHpCreated = false; 
    }else{ 
      try {
          const response = await fetch('donatorPages/effectiveHP.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-hp-div";
        
          document.getElementById('effectiveHealthContainer').appendChild(newDiv);
          isHpCreated = true;
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});

statButton.addEventListener('click', async function() {
    if (isStatCreated) {
        const divToRemove = document.querySelector(".dynamic-stat-div");
        if (divToRemove) {
            statContainer.removeChild(divToRemove);
        }
        isStatCreated = false; 
    }else{ 
      try {
          const response = await fetch('donatorPages/effectiveStats.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-stat-div";
        
          document.getElementById('effectiveStatsContainer').appendChild(newDiv);
          isStatCreated = true;
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});

triangleButton.addEventListener('click', async function() {
    if (isTriangleCreated) {
        const divToRemove = document.querySelector(".dynamic-triangle-div");
        if (divToRemove) {
            triangleContainer.removeChild(divToRemove);
        }
        isTriangleCreated = false; 
    }else{ 
      try {
          const response = await fetch('donatorPages/triangle.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-triangle-div";
        
          document.getElementById('triangleContainer').appendChild(newDiv);
          isTriangleCreated = true;
          initializeTriangle();
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});

triangle2Button.addEventListener('click', async function() {
    if (isTriangle2Created) {
        const divToRemove = document.querySelector(".dynamic-triangle2-div");
        if (divToRemove) {
            triangle2Container.removeChild(divToRemove);
        }
        isTriangle2Created = false; 
    }else{ 
      try {
          const response = await fetch('donatorPages/triangle2.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-triangle2-div";
        
          document.getElementById('triangle2Container').appendChild(newDiv);
          isTriangle2Created = true;
          initializeTriangle2();
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});