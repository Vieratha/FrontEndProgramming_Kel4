/*Ini bagian data akun customer*/
var USERS_KEY = "sotoBetawiUsers";
var USER_LOGIN_KEY = "sotoBetawiUserLogin";

/*Ini bagian mengambil data user*/
function loadUsers() {
  try {
    var data = JSON.parse(localStorage.getItem(USERS_KEY));
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch (error) {
    return [];
  }
}

/*Ini bagian menyimpan data user*/
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/*Ini bagian register*/
var registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = document.getElementById("registerName").value.trim();
    var email = document.getElementById("registerEmail").value.trim();
    var password = document.getElementById("registerPassword").value;
    var confirmPassword = document.getElementById(
      "registerConfirmPassword",
    ).value;
    var message = document.getElementById("registerMessage");

    /*Ini bagian mengecek password*/
    if (password !== confirmPassword) {
      message.textContent = "Konfirmasi password tidak sesuai.";

      return;
    }
    var users = loadUsers();
    /*Ini bagian mengecek email*/
    var emailExists = users.some(function (user) {
      return user.email.toLowerCase() === email.toLowerCase();
    });

    if (emailExists) {
      message.textContent = "Email sudah terdaftar.";
      return;
    }

    /*Ini bagian membuat akun baru*/
    var newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: password,
    };
    users.push(newUser);
    saveUsers(users);
    alert("Akun berhasil dibuat.");
    window.location.href = "login.html";
  });
}

/*Ini bagian login customer*/
var loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPassword").value;
    var message = document.getElementById("loginMessage");
    var users = loadUsers();

    /*Ini bagian mencari akun*/
    var user = users.find(function (item) {
      return (
        item.email.toLowerCase() === email.toLowerCase() &&
        item.password === password
      );
    });

    if (!user) {
      message.textContent = "Email atau password salah.";
      return;
    }

    /*Ini bagian menyimpan session user*/
    localStorage.setItem(
      USER_LOGIN_KEY,
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
      }),
    );
    window.location.href = "index.html";
  });
}
