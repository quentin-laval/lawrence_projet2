// Select elements from the DOM
const toggleSwitch = document.getElementById("toggle-switch");
const loginTypeLabel = document.getElementById("login-type-label");
const emailInput = document.getElementById("email-input");
const usernameInput = document.getElementById("username-input");
const emailLabel = document.getElementById("email-label");
const usernameLabel = document.getElementById("username-label");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const switchToRegister = document.getElementById("switch-to-register");
const switchToLogin = document.getElementById("switch-to-login");
const registerButton = document.getElementById("register-button");
const loginButton = document.getElementById("login-button");

// Function to toggle between email and username input
toggleSwitch.addEventListener("change", () => {
  if (toggleSwitch.checked) {
    emailInput.classList.add("hidden");
    emailLabel.classList.add("hidden");
    usernameInput.classList.remove("hidden");
    usernameLabel.classList.remove("hidden");
  } else {
    emailInput.classList.remove("hidden");
    emailLabel.classList.remove("hidden");
    usernameInput.classList.add("hidden");
    usernameLabel.classList.add("hidden");
  }
});

// Function to switch to register form
switchToRegister.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});

// Function to switch to login form
switchToLogin.addEventListener("click", () => {
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});
