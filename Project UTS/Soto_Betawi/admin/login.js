/*Ini bagian login admin*/
var ADMIN_USERNAME = "admin123";
var ADMIN_PASSWORD = "admin123";
var loginForm = document.getElementById("adminLoginForm");
var loginMessage = document.getElementById("loginMessage");

/*Ini bagian proses login*/
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  var username = document.getElementById("adminUsername").value;
  var password = document.getElementById("adminPassword").value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem("sotoBetawiAdminLogin", "true");
    window.location.href = "index.html";
  } else {
    loginMessage.textContent = "Username atau password salah.";
  }
});
