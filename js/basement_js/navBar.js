fetch("/donatorPages/navbar.html")
.then(response => response.text())
.then(data => {
  document.getElementById("navbar").innerHTML = data;
})
.catch(error => console.error("Error loading navbar:", error));