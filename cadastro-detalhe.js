const token = localStorage.getItem("siv_token");
const loggedUser = JSON.parse(localStorage.getItem("siv_user") || "null");
const PUBLIC_APP_URL = "https://teste-crm-eleitoral-main.vercel.app";

if (!token || !loggedUser) {
  window.location.href = "/login.html";
}

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

const els = {
  title: document.getElementById("detailTitle"),
  subtitle: document.getElementById("detailSubtitle"),
  photo: document.getElementById("detailPhoto"),
  role: document.getElementById("detailRole"),
  name: document.getElementById("detailName"),
  contact: document.getElementById("detailContact"),
  location: document.getElementById("detailLocation"),
  grid: document.getElementById("detailGrid"),
  referral: document.getElementById("detailReferralLink"),
  form: document.getElementById("detailEditForm"),
  msg: document.getElementById("detailMsg"),
  copyTop: document.getElementById("btnCopyDetailLink"),
  copyInline: document.getElementById("btnCopyDetailLinkInline"),
  email: document.getElementById("btnEmailDetail"),
  delete: document.getElementById("btnDeleteDetail"),
  logout: document.getElementById("btnLogout"),
};

let currentUser = null;

els.logout.addEventListener("click", () => {
  localStorage.removeItem("siv_token");
  localStorage.removeItem("siv_user");
  window.location.href = "/login.html";
});
els.form.addEventListener("submit", saveUser);
els.copyTop.addEventListener("click", copyReferralLink);
els.copyInline.addEventListener("click", copyReferralLink);
els.email.addEventListener("click", emailUser);
els.delete.addEventListener("click", deleteUser);

init();

async function init() {
  if (!userId) {
    showMessage("Cadastro nao informado.", "err");
    return;
  }
  await loadUser();
}

async function loadUser() {
  try {
    const data = await requestJson(`/api/admin/users/${encodeURIComponent(userId)}`);
    currentUser = data.user;
    renderUser();
  } catch (error) {
    showMessage(`Erro: ${error.message || error}`, "err");
  }
}

function renderUser() {
  const user = currentUser;
  const link = getPublicReferralUrl(user);
  els.title.textContent = user.name || "Cadastro";
  els.subtitle.textContent = `${user.role || "-"} - ${formatDate(user.created_at)}`;
  els.photo.src = user.photo_url || "img/LOGO-SIV.png";
  els.role.textContent = user.role || "-";
  els.role.className = `rolePill ${user.role === "COORDENADORES" || user.role === "LIDERES" ? "roleLeader" : "rolePerson"}`;
  els.name.textContent = user.name || "-";
  els.contact.textContent = `${user.email || "-"} | ${user.phone || "-"}`;
  els.location.textContent = `${user.localidade || "-"} ${user.regiao_administrativa ? `- ${user.regiao_administrativa}` : ""}`;
  els.referral.value = link;

  els.grid.innerHTML = `
    ${detailItem("Nome", user.name)}
    ${detailItem("Email", user.email)}
    ${detailItem("Telefone", user.phone)}
    ${detailItem("Tipo", user.role)}
    ${detailItem("Localidade", user.localidade)}
    ${detailItem("Regiao", user.regiao_administrativa)}
    ${detailItem("Nivel", user.level)}
    ${detailItem("Quem indicou", user.parent_user_name || user.parent_user_id)}
    ${detailItem("Responsavel raiz", user.root_leader_name || user.root_leader_id)}
    ${detailItem("Codigo usado", user.referral_code_used)}
    ${detailItem("Codigo do link", user.referral_code)}
    ${detailItem("Ativo", user.active === false ? "Nao" : "Sim")}
    ${detailItem("Consentimento", user.consent_accepted ? "Sim" : "Nao")}
    ${detailItem("Criado em", formatDate(user.created_at))}
    ${detailItem("Atualizado em", formatDate(user.updated_at))}
  `;

  setValue("editName", user.name || "");
  setValue("editEmail", user.email || "");
  setValue("editPhone", user.phone || "");
  setValue("editRole", user.role || "CADASTRADOS");
  setValue("editLocalidade", user.localidade || "");
  setValue("editRegiao", user.regiao_administrativa || "");
  setValue("editPassword", "");
  document.getElementById("editActive").checked = user.active !== false;
  document.getElementById("editPhoto").value = "";
}

function detailItem(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? "-")}</strong></div>`;
}

async function saveUser(event) {
  event.preventDefault();
  showMessage("", "");
  const formData = new FormData(els.form);
  const photoFile = formData.get("photo");
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    localidade: formData.get("localidade"),
    regiao_administrativa: formData.get("regiao_administrativa"),
    active: document.getElementById("editActive").checked ? "true" : "false",
  };
  const password = String(formData.get("password") || "").trim();
  if (password) payload.password = password;

  try {
    if (photoFile && photoFile.size) {
      payload.photo_url = await uploadPhoto(photoFile);
    }
    const data = await requestJson(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    currentUser = data.user;
    renderUser();
    showMessage("Cadastro atualizado.", "ok");
  } catch (error) {
    showMessage(`Erro: ${error.message || error}`, "err");
  }
}

async function uploadPhoto(file) {
  const preparedFile = await preparePhotoFile(file);
  const body = new FormData();
  body.append("photo", preparedFile, preparedFile.name || file.name || "foto.jpg");
  const response = await fetch("/api/upload/profile-photo", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || "Nao foi possivel enviar a foto.");
  return result.photoUrl;
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

async function copyReferralLink() {
  if (!els.referral.value) return;
  await navigator.clipboard.writeText(els.referral.value);
  showMessage("Link copiado.", "ok");
}

function emailUser() {
  if (!currentUser?.email) return showMessage("Este cadastro nao tem email.", "err");
  window.location.href = `mailto:${currentUser.email}`;
}

async function deleteUser() {
  if (!currentUser) return;
  if (!confirm(`Excluir o cadastro de ${currentUser.name}?`)) return;
  try {
    await requestJson(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
    window.location.href = "/dashboard.html";
  } catch (error) {
    showMessage(`Erro: ${error.message || error}`, "err");
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "Operacao falhou.");
  return data;
}

function getPublicReferralUrl(user) {
  const code = user.referral_code || extractReferralCode(user.referral_url);
  if (!code) return "";
  const currentOrigin = window.location.origin && !window.location.hostname.includes("localhost")
    ? window.location.origin
    : PUBLIC_APP_URL;
  return `${currentOrigin.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;
}

function extractReferralCode(url) {
  if (!url) return "";
  try {
    return new URL(url).searchParams.get("ref") || "";
  } catch (_) {
    const match = String(url).match(/[?&]ref=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }
}

function setValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value;
}

function showMessage(text, type) {
  els.msg.textContent = text;
  els.msg.className = type ? `msg ${type}` : "msg";
  els.msg.style.display = text ? "block" : "none";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
