const form = document.getElementById("formLogin");
const msg = document.getElementById("loginMsg");
const btn = document.getElementById("btnLogin");

const TEST_LOGIN = {
  email: "lelekapaula@hotmail.com",
  password: "123",
};

function showMessage(text, type) {
  msg.className = `msg ${type}`;
  msg.textContent = text;
  msg.style.display = "block";
}

function canUseLocalTestLogin(email, password) {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocal && email.toLowerCase() === TEST_LOGIN.email && password === TEST_LOGIN.password;
}

function saveTestLogin() {
  const user = {
    id: "local-test-user",
    name: "Leticia Paula",
    email: TEST_LOGIN.email,
    role: "EQUIPE",
  };

  localStorage.setItem("siv_token", "local-test-token");
  localStorage.setItem("siv_user", JSON.stringify(user));
}

function goToDashboard() {
  window.location.href = "/dashboard.html";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  msg.style.display = "none";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage("Informe email e senha.", "err");
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Entrando...";

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel entrar.");

    localStorage.setItem("siv_token", data.token);
    localStorage.setItem("siv_user", JSON.stringify(data.user));
    showMessage("Login realizado com sucesso.", "ok");
    setTimeout(goToDashboard, 500);
  } catch (error) {
    if (canUseLocalTestLogin(email, password)) {
      saveTestLogin();
      showMessage("Login de teste realizado com sucesso.", "ok");
      setTimeout(goToDashboard, 500);
      return;
    }

    showMessage(`Erro: ${error.message || error}`, "err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
});
