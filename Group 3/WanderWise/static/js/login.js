function toggleForm() {
  let loginForm = document.getElementById("login-form");
  let signupForm = document.getElementById("signup-form");

  if (loginForm.style.display === "none") {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  }
}

// Ensure login form is visible initially
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("login-form").style.display = "block";
  document.getElementById("signup-form").style.display = "none";
});
