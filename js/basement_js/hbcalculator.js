document.querySelectorAll("#table-1 td").forEach(cell => {
    cell.addEventListener("click", () => {

        if (cell.textContent === "Sac ") {
            cell.innerHTML = 'Sell <img src="media/owo_images/cowoncy.png" style="width:1rem; margin-bottom:-0.2rem;">'; 
        } else {
            cell.innerHTML = 'Sac <img src="media/owo_images/essence.gif" style="width:1rem; margin-bottom:-0.2rem;">';
        }


    });
});