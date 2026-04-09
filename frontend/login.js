const loginForm = document.getElementById("login-form")

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username-login").value;

  const res = await fetch("/submit-username", {
    method: "POST",
    headers: {
      "Content-Type": "application-login/json"
    },
    body: JSON.stringify({ username })
  });

  const data = await res.json();
  console.log(data);
});
