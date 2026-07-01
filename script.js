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
const chatBox = document.querySelector(".chatContactBox");
const chatLauncher = document.getElementById("chatLauncher");
const chatClose = document.getElementById("chatClose");
const coordinatorAccess = document.getElementById("coordinatorAccess");
const coordinatorEmail = document.getElementById("email");
const coordinatorPassword = document.getElementById("password");
const FORMAL_CHAT_GREETING = "Olá. Envie sua mensagem e nossa equipe retornará em até 4 horas.";
const localidadesDF = window.DF_LOCALIDADES || {};

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
  return normalizeReferralCode(r);
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

function normalizeReferralCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeLocalidadeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getLocalidadesByRegiao(regiao) {
  const target = normalizeLocalidadeKey(regiao);
  const key = Object.keys(localidadesDF).find((item) => normalizeLocalidadeKey(item) === target);
  return key ? localidadesDF[key] : [];
}

function fillLocalidadeSelect(select, regiao, selectedValue = "") {
  if (!select) return;
  const localidades = getLocalidadesByRegiao(regiao);
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = localidades.length ? "Selecione o bairro/localidade" : "Selecione a RA primeiro";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  for (const localidade of localidades) {
    const option = document.createElement("option");
    option.value = localidade;
    option.textContent = localidade;
    select.appendChild(option);
  }

  if (selectedValue && !localidades.includes(selectedValue)) {
    const option = document.createElement("option");
    option.value = selectedValue;
    option.textContent = selectedValue;
    select.appendChild(option);
  }

  select.value = selectedValue || "";
  select.disabled = !localidades.length && !selectedValue;
  syncEnhancedSelect(select);
}

function setupLocalidadeSelector(regiaoId, localidadeId) {
  const regiao = document.getElementById(regiaoId);
  const localidade = document.getElementById(localidadeId);
  if (!regiao || !localidade) return;

  fillLocalidadeSelect(localidade, regiao.value, localidade.value);
  regiao.addEventListener("change", () => fillLocalidadeSelect(localidade, regiao.value));
}

function positionLocationFields() {
  const whatsapp = document.getElementById("whatsapp");
  const regiao = document.getElementById("ra");
  const firstRow = whatsapp?.closest(".row");
  const regiaoField = regiao?.closest("div");
  if (!firstRow || !regiaoField || firstRow.contains(regiaoField)) return;
  firstRow.appendChild(regiaoField);
}

function enhanceDownwardSelect(select) {
  if (!select || select.dataset.enhancedDownward === "true") return;
  select.dataset.enhancedDownward = "true";
  select.classList.add("nativeDownSelect");

  const wrapper = document.createElement("div");
  wrapper.className = "downSelect";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "downSelectButton";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.className = "downSelectMenu";
  menu.setAttribute("role", "listbox");

  select.parentNode.insertBefore(wrapper, select.nextSibling);
  wrapper.append(button, menu);
  select._downSelect = { wrapper, button, menu };

  button.addEventListener("click", () => {
    if (select.disabled) return;
    const isOpen = wrapper.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    syncEnhancedSelect(select);
  });

  select.addEventListener("change", () => syncEnhancedSelect(select));
  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target) && event.target !== select) closeDownSelect(wrapper, button);
  });

  syncEnhancedSelect(select);
}

function syncEnhancedSelect(select) {
  const state = select?._downSelect;
  if (!state) return;

  const { wrapper, button, menu } = state;
  const selected = Array.from(select.options).find((option) => option.value === select.value);
  button.textContent = selected?.textContent || select.options[0]?.textContent || "Selecione";
  button.disabled = select.disabled;
  wrapper.classList.toggle("isDisabled", select.disabled);
  menu.innerHTML = "";

  Array.from(select.options)
    .filter((option) => !option.disabled && option.value !== "")
    .forEach((option) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "downSelectOption";
      item.setAttribute("role", "option");
      item.dataset.value = option.value || option.textContent;
      item.textContent = option.textContent;
      const active = item.dataset.value === select.value;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
      item.addEventListener("click", () => {
        select.value = item.dataset.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        closeDownSelect(wrapper, button);
      });
      menu.appendChild(item);
    });
}

function closeDownSelect(wrapper, button) {
  wrapper.classList.remove("open");
  button.setAttribute("aria-expanded", "false");
}

function lockRef(value) {
  const refInput = document.getElementById("ref");
  const hint = document.getElementById("refHint");
  const container = document.getElementById("refContainer");

  if (!refInput || !container) return;

  container.style.display = "block";
  refInput.value = normalizeReferralCode(value);

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
  const initialChatBubble = chatMessages?.querySelector(".botBubble");
  if (initialChatBubble) initialChatBubble.textContent = FORMAL_CHAT_GREETING;

  const ref = getRefFromURL();
  if (ref) lockRef(ref);
  else unlockRef();

  setupCoordinatorAccess();
  positionLocationFields();
  setupLocalidadeSelector("ra", "bairro");
  enhanceDownwardSelect(document.getElementById("ra"));
  enhanceDownwardSelect(document.getElementById("bairro"));

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
  const ref = refEl ? normalizeReferralCode(refEl.value) : "";

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
  if (!ra) return showError("Selecione a Região Administrativa (RA).");
  if (inviteRole === "COORDENADORES" && !email) return showError("Informe o email de login do coordenador.");
  if (inviteRole === "COORDENADORES" && password.length < 8) return showError("Informe uma senha com pelo menos 8 caracteres.");
  if (!aceite_lgpd) return showError("Você precisa aceitar o uso de dados (LGPD).");
  if (!aceite_whatsapp) return showError("Você precisa autorizar o contato por WhatsApp.");

  try {
    btn.disabled = true;
    btn.textContent = foto ? "Enviando foto..." : "Enviando cadastro...";
    const photoUrl = foto ? await uploadPhoto(foto) : "/img/LOGO-SIV.png";
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
    document.getElementById("ra")?.dispatchEvent(new Event("change"));
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

  if (body.message.length < 2) {
    appendChatBubble("Digite uma mensagem antes de enviar.", "bot error");
    return;
  }

  try {
    appendChatBubble(body.message, "user");
    btnContact.disabled = true;
    btnContact.textContent = "...";
    const requestBody = {
      ...body,
      message: body.message.length < 5 ? `${body.message} ...` : body.message,
    };
    const response = await fetch("/api/contact/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel enviar.");
    appendChatBubble("Mensagem enviada. Nossa equipe retornará em até 4 horas.", "bot");
    contactForm.reset();
  } catch (error) {
    appendChatBubble(`Nao consegui enviar agora: ${error.message || error}`, "bot error");
  } finally {
    btnContact.disabled = false;
    btnContact.textContent = "Enviar";
  }
});

chatLauncher?.addEventListener("click", () => {
  chatBox?.classList.remove("chatMinimized");
});

chatClose?.addEventListener("click", () => {
  chatBox?.classList.add("chatMinimized");
});

function appendChatBubble(text, type) {
  if (!chatMessages) return;
  const bubble = document.createElement("div");
  bubble.className = `chatBubble ${type.includes("user") ? "userBubble" : "botBubble"}${type.includes("error") ? " errorBubble" : ""}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
