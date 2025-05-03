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
        // Delete the <div> if it exists
        const divToRemove = document.querySelector(".dynamic-streak-div");
        if (divToRemove) {
            streakWorthContainer.removeChild(divToRemove);
        }
        isstreakWorthCreated = false; // Update the flag
    }else{ 
      try {
          const response = await fetch('donatorPages/streakExp.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          // Create a div and add the fetched content
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-streak-div";
        
          // Append the div to the container
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
        // Delete the <div> if it exists
        const divToRemove = document.querySelector(".dynamic-global-div");
        if (divToRemove) {
            globalContainer.removeChild(divToRemove);
        }
        isglobalCreated = false; // Update the flag
    }else{ 
      try {
          const response = await fetch('donatorPages/globalExp.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          // Create a div and add the fetched content
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-global-div";
        
          // Append the div to the container
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
        // Delete the <div> if it exists
        const divToRemove = document.querySelector(".dynamic-knowledge-div");
        if (divToRemove) {
            knowledgeContainer.removeChild(divToRemove);
        }
        isknowledgeCreated = false; // Update the flag
    }else{ 
      try {
          const response = await fetch('donatorPages/knowledge.html'); 
          if (!response.ok) {
              throw new Error('Failed to fetch the file');
          }
          const htmlContent = await response.text();
  
          // Create a div and add the fetched content
          const newDiv = document.createElement('div');
          newDiv.innerHTML = htmlContent;
          newDiv.className = "dynamic-knowledge-div";
        
          // Append the div to the container
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
