console.log("script.js carregou ✅");

const ENDPOINT = "/api/siv";
const PUBLIC_APP_URL = "https://teste-crm-eleitoral-main.vercel.app";

const form = document.getElementById("formSIV");
const msg = document.getElementById("msg");
const btn = document.getElementById("btnEnviar");

const formArea = document.getElementById("formArea");
const successArea = document.getElementById("successArea");

const successText = document.getElementById("successText");
const btnNovoCadastro = document.getElementById("btnNovoCadastro");

// ✅ IDs do seu HTML (form + sucesso)
const inviteBox = document.getElementById("invite");                 // bloco dentro do form
const inviteLink = document.getElementById("inviteLink");            // input dentro do form
const btnCopy = document.getElementById("btnCopy");                  // botão copiar dentro do form

const inviteLinkSuccess = document.getElementById("inviteLinkSuccess"); // input na tela de sucesso
const btnCopySuccess = document.getElementById("btnCopySuccess");       // botão copiar na tela de sucesso
const contactForm = document.getElementById("contactForm");
const contactMsg = document.getElementById("contactMsg");
const btnContact = document.getElementById("btnContact");
const chatMessages = document.getElementById("chatMessages");
const coordinatorAccess = document.getElementById("coordinatorAccess");
const coordinatorEmail = document.getElementById("email");
const coordinatorPassword = document.getElementById("password");

function showError(text) {
  msg.className = "msg err";
  msg.textContent = text;
  msg.style.display = "block";
}

function showOk(text) {
  msg.className = "msg ok";
  msg.textContent = text;
  msg.style.display = "block";
}

function getRefFromURL() {
  const url = new URL(window.location.href);
  const r = url.searchParams.get("ref");
  return (r && r.trim()) ? r.trim() : "";
}

function getInviteRoleFromURL() {
  const url = new URL(window.location.href);
  const role = String(url.searchParams.get("tipo") || "").trim().toUpperCase();
  return ["COORDENADORES", "LIDERES", "CADASTRADOS"].includes(role) ? role : "";
}

function normalizeWhatsApp(input) {
  return (input || "").replace(/\D/g, "");
}

function isValidRef(ref) {
  // aceita AGxxx... ou SIVxxxxxx...
  return /^AG\d{3,}$/i.test(ref) || /^SIV[A-Z0-9]{6,}$/i.test(ref);
}

function lockRef(value) {
  const refInput = document.getElementById("ref");
  const hint = document.getElementById("refHint");
  const container = document.getElementById("refContainer");

  if (!refInput || !container) return;

  container.style.display = "block";
  refInput.value = value;

  refInput.setAttribute("readonly", "readonly");
  refInput.setAttribute("required", "required");

  refInput.onkeydown = (e) => e.preventDefault();
  refInput.onpaste = (e) => e.preventDefault();
  refInput.ondrop = (e) => e.preventDefault();

  if (hint) hint.textContent = "Referência definida pelo link de convite (não editável).";
}

function unlockRef() {
  const refInput = document.getElementById("ref");
  const hint = document.getElementById("refHint");
  const container = document.getElementById("refContainer");

  if (!refInput || !container) return;

  container.style.display = "none";
  refInput.value = "";

  refInput.removeAttribute("readonly");
  refInput.removeAttribute("required");

  refInput.onkeydown = null;
  refInput.onpaste = null;
  refInput.ondrop = null;

  if (hint) hint.textContent = "";
}

// ✅ coloca o link em ambos lugares (form e sucesso)
function setInviteLinkEverywhere(link) {
  // no form
  if (inviteLink) inviteLink.value = link;
  if (inviteBox) inviteBox.style.display = "block";

  // no success
  if (inviteLinkSuccess) inviteLinkSuccess.value = link;
}

function setupCoordinatorAccess() {
  const isCoordinatorLink = getInviteRoleFromURL() === "COORDENADORES";
  if (!coordinatorAccess) return;
  coordinatorAccess.style.display = isCoordinatorLink ? "block" : "none";
  coordinatorEmail?.toggleAttribute("required", isCoordinatorLink);
  coordinatorPassword?.toggleAttribute("required", isCoordinatorLink);
}

// init ref
(function init() {
  const ref = getRefFromURL();
  if (ref) lockRef(ref);
  else unlockRef();

  setupCoordinatorAccess();

  // inicia bloco de convite escondido no form
  if (inviteBox) inviteBox.style.display = "none";
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.style.display = "none";

  // Honeypot
  const hp = document.getElementById("website");
  if (hp && hp.value.trim() !== "") {
    showError("Falha de verificação. Tente novamente.");
    return;
  }

  const nome = document.getElementById("nome").value.trim();
  const whatsapp = normalizeWhatsApp(document.getElementById("whatsapp").value.trim());
  const bairro = document.getElementById("bairro").value.trim();
  const ra = document.getElementById("ra").value;
  const foto = document.getElementById("foto")?.files?.[0];
  const inviteRole = getInviteRoleFromURL();
  const email = coordinatorEmail?.value?.trim() || "";
  const password = coordinatorPassword?.value || "";

  const urlRef = getRefFromURL();
  const veioPorLink = !!urlRef;

  const refEl = document.getElementById("ref");
  const ref = refEl ? refEl.value.trim() : "";

  if (veioPorLink) {
    if (!ref || ref.length < 3) return showError("Referência inválida.");
    if (!isValidRef(ref)) return showError("Referencia invalida. Use o link de cadastro enviado pelo responsavel.");
  }

  const aceite_lgpd = document.getElementById("aceiteLGPD").checked;
  const aceite_whatsapp = document.getElementById("aceiteWhats").checked;

  const recaptchaToken = (window.grecaptcha) ? grecaptcha.getResponse() : "";

  if (!nome || nome.length < 3) return showError("Informe seu nome completo.");
  if (!whatsapp || whatsapp.length < 10) return showError("Informe um WhatsApp válido (com DDD).");
  if (!bairro || bairro.length < 2) return showError("Selecione a localidade.");
  if (!foto) return showError("Tire ou selecione uma foto para concluir o cadastro.");
  if (!ra) return showError("Selecione a Região Administrativa (RA).");
  if (inviteRole === "COORDENADORES" && !email) return showError("Informe o email de login do coordenador.");
  if (inviteRole === "COORDENADORES" && password.length < 8) return showError("Informe uma senha com pelo menos 8 caracteres.");
  if (!aceite_lgpd) return showError("Você precisa aceitar o uso de dados (LGPD).");
  if (!aceite_whatsapp) return showError("Você precisa autorizar o contato por WhatsApp.");

  try {
    btn.disabled = true;
    btn.textContent = "Enviando foto...";
    const photoUrl = await uploadPhoto(foto);
    btn.textContent = "Enviando cadastro...";

    const body = new URLSearchParams({
      nome,
      whatsapp,
      bairro,
      ra,
      photoUrl,
      ref: veioPorLink ? ref : "",
      email: inviteRole === "COORDENADORES" ? email : "",
      password: inviteRole === "COORDENADORES" ? password : "",
      target_role: veioPorLink ? inviteRole : "",
      aceite_lgpd: "true",
      aceite_whatsapp: "true",
      recaptchaToken
    });

    const res = await fetch(ENDPOINT, { method: "POST", body });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); }
    catch {
      console.error("Resposta não-JSON:", text);
      throw new Error("Servidor retornou resposta inválida (não JSON). Verifique o Deploy do Apps Script.");
    }

    if (!json.ok) throw new Error(json.error || "Não foi possível concluir.");

    const codigo = (json.codigo_pessoa || "").trim();

    // ✅ SEMPRE usar invite_link do Apps Script se vier
    let link = (json.invite_link || "").trim();
    if (!link) {
      // fallback: cria link com o código da pessoa
      const publicOrigin = location.hostname.includes("localhost") ? PUBLIC_APP_URL : location.origin;
      link = `${publicOrigin.replace(/\/$/, "")}/?ref=${encodeURIComponent(codigo)}`;
    }

    // ✅ Mostra link em ambos os lugares
    setInviteLinkEverywhere(link);

    // texto de sucesso
    if (successText) {
      successText.textContent =
        `Seu cadastro foi concluído! Seu código é ${codigo}. Guarde o link abaixo: ele será usado para cadastrar novas pessoas abaixo de você na árvore.`;
    }

    // troca tela (se existir)
    if (formArea && successArea) {
      formArea.style.display = "none";
      successArea.style.display = "block";
    } else {
      showOk(`Cadastro OK! Código: ${codigo}`);
    }

    form.reset();
    if (window.grecaptcha) grecaptcha.reset();

    // mantém ref travado se veio por link
    if (urlRef) lockRef(urlRef);
    else unlockRef();

  } catch (err) {
    showError("Erro: " + (err.message || err));
    if (window.grecaptcha) grecaptcha.reset();
  } finally {
    btn.disabled = false;
    btn.textContent = "Cadastrar";
  }
});

async function uploadPhoto(file) {
  const preparedFile = await preparePhotoFile(file);
  const body = new FormData();
  body.append("photo", preparedFile, preparedFile.name || file.name || "foto.jpg");
  const res = await fetch("/api/upload/profile-photo", { method: "POST", body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error("Servidor retornou resposta invalida ao enviar a foto."); }
  if (!res.ok || !json.ok) throw new Error(json.error || "Nao foi possivel enviar a foto.");
  return json.photoUrl;
}

async function preparePhotoFile(file) {
  if (!file?.type?.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const maxSize = 1024;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) return file;
  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}

// voltar
btnNovoCadastro?.addEventListener("click", () => {
  if (successArea) successArea.style.display = "none";
  if (formArea) formArea.style.display = "block";
  msg.style.display = "none";

  // esconde o bloco do link no form (novo cadastro)
  if (inviteBox) inviteBox.style.display = "none";

  // restaura ref conforme URL atual
  const ref = getRefFromURL();
  if (ref) lockRef(ref);
  else unlockRef();
});

// copiar (form)
btnCopy?.addEventListener("click", async () => {
  if (!inviteLink) return;
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    btnCopy.textContent = "Copiado!";
    setTimeout(() => (btnCopy.textContent = "Copiar"), 1200);
  } catch {
    inviteLink.select();
    document.execCommand("copy");
  }
});

// copiar (sucesso)
btnCopySuccess?.addEventListener("click", async () => {
  if (!inviteLinkSuccess) return;
  try {
    await navigator.clipboard.writeText(inviteLinkSuccess.value);
    btnCopySuccess.textContent = "Copiado!";
    setTimeout(() => (btnCopySuccess.textContent = "Copiar"), 1200);
  } catch {
    inviteLinkSuccess.select();
    document.execCommand("copy");
  }
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  contactMsg.style.display = "none";

  const body = {
    name: document.getElementById("contactName").value.trim(),
    phone: document.getElementById("contactPhone").value.trim(),
    email: document.getElementById("contactEmail").value.trim(),
    message: document.getElementById("contactMessage").value.trim(),
  };

  try {
    appendChatBubble(body.message, "user");
    btnContact.disabled = true;
    btnContact.textContent = "...";
    const response = await fetch("/api/contact/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel enviar.");
    appendChatBubble("Mensagem enviada. A equipe recebeu seu contato no painel.", "bot");
    contactForm.reset();
  } catch (error) {
    appendChatBubble(`Nao consegui enviar agora: ${error.message || error}`, "bot error");
  } finally {
    btnContact.disabled = false;
    btnContact.textContent = "Enviar";
  }
});

function appendChatBubble(text, type) {
  if (!chatMessages) return;
  const bubble = document.createElement("div");
  bubble.className = `chatBubble ${type.includes("user") ? "userBubble" : "botBubble"}${type.includes("error") ? " errorBubble" : ""}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
