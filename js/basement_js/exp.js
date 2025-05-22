const streakWorthButton = document.getElementById("streakWorthButton");
const streakWorthContainer = document.getElementById("streakWorthContainer");
let isstreakWorthCreated = false;

const globalButton = document.getElementById("globalButton");
const globalContainer = document.getElementById("globalContainer");
let isglobalCreated = false;

const knowledgeButton = document.getElementById("knowledgeButton");
const knowledgeContainer = document.getElementById("knowledgeContainer");
let isknowledgeCreated = false;


streakWorthButton.addEventListener('click', async function() {
    if (isstreakWorthCreated) {
        const divToRemove = document.querySelector(".dynamic-streak-div");
        if (divToRemove) {
            streakWorthContainer.removeChild(divToRemove);
        }
        isstreakWorthCreated = false;
    }else{ 
      try {
          const response = await fetch('donatorPages/streakExp.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-streak-div";
        
          document.getElementById('streakWorthContainer').appendChild(newDiv);
          
          MathJax.typeset();
          isstreakWorthCreated = true;
          
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});

globalButton.addEventListener('click', async function() {
    if (isglobalCreated) {
        const divToRemove = document.querySelector(".dynamic-global-div");
        if (divToRemove) {
            globalContainer.removeChild(divToRemove);
        }
        isglobalCreated = false;
    }else{ 
      try {
          const response = await fetch('donatorPages/globalExp.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-global-div";
        
          document.getElementById('globalContainer').appendChild(newDiv);
          
          MathJax.typeset();
          isglobalCreated = true;
          
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});

knowledgeButton.addEventListener('click', async function() {
    if (isknowledgeCreated) {
        const divToRemove = document.querySelector(".dynamic-knowledge-div");
        if (divToRemove) {
            knowledgeContainer.removeChild(divToRemove);
        }
        isknowledgeCreated = false; 
    }else{ 
      try {
          const response = await fetch('donatorPages/knowledge.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-knowledge-div";
        
          document.getElementById('knowledgeContainer').appendChild(newDiv);
          
          isknowledgeCreated = true;
          
      } catch (error) {
          console.error('Error:', error);
      }
    }  
});


function copyMedian(){
  navigator.clipboard.writeText("neonmath \nmedian(x) = log(2)/log(x/(x-1));");
}
