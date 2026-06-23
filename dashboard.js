const token = localStorage.getItem("siv_token");
let user = JSON.parse(localStorage.getItem("siv_user") || "null");

if (!token || !user) {
  window.location.href = "/login.html";
}

const DF_BOUNDS = {
  minLat: -16.08,
  maxLat: -15.45,
  minLng: -48.32,
  maxLng: -47.28,
};

const PUBLIC_APP_URL = "https://teste-crm-eleitoral-main.vercel.app";

const fallbackPoints = [
  {
    id: "l1",
    name: "Maria Souza",
    role: "LIDERES",
    localidade: "Taguatinga Centro",
    regiao_administrativa: "Taguatinga",
    latitude: -15.835,
    longitude: -48.056,
    root_leader_id: "l1",
    root_leader_name: "Maria Souza",
    parent_user_id: null,
    parent_user_name: null,
    level: 0,
    created_at: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "p1",
    name: "Joao Silva",
    role: "CADASTRADOS",
    localidade: "Ceilandia Norte",
    regiao_administrativa: "Ceilandia",
    latitude: -15.819,
    longitude: -48.113,
    root_leader_id: "l1",
    root_leader_name: "Maria Souza",
    parent_user_id: "l1",
    parent_user_name: "Maria Souza",
    level: 1,
    created_at: "2026-06-04T12:20:00.000Z",
  },
  {
    id: "p2",
    name: "Ana Paula",
    role: "CADASTRADOS",
    localidade: "Samambaia Sul",
    regiao_administrativa: "Samambaia",
    latitude: -15.879,
    longitude: -48.089,
    root_leader_id: "l1",
    root_leader_name: "Maria Souza",
    parent_user_id: "p1",
    parent_user_name: "Joao Silva",
    level: 2,
    created_at: "2026-06-05T09:10:00.000Z",
  },
  {
    id: "l2",
    name: "Carlos Lima",
    role: "LIDERES",
    localidade: "Plano Piloto",
    regiao_administrativa: "Plano Piloto",
    latitude: -15.793,
    longitude: -47.882,
    root_leader_id: "l2",
    root_leader_name: "Carlos Lima",
    parent_user_id: null,
    parent_user_name: null,
    level: 0,
    created_at: "2026-06-06T11:00:00.000Z",
  },
  {
    id: "p3",
    name: "Fernanda Rocha",
    role: "CADASTRADOS",
    localidade: "Asa Norte",
    regiao_administrativa: "Plano Piloto",
    latitude: -15.765,
    longitude: -47.882,
    root_leader_id: "l2",
    root_leader_name: "Carlos Lima",
    parent_user_id: "l2",
    parent_user_name: "Carlos Lima",
    level: 1,
    created_at: "2026-06-07T15:30:00.000Z",
  },
  {
    id: "l3",
    name: "Rafael Costa",
    role: "LIDERES",
    localidade: "Sobradinho",
    regiao_administrativa: "Sobradinho",
    latitude: -15.653,
    longitude: -47.792,
    root_leader_id: "l3",
    root_leader_name: "Rafael Costa",
    parent_user_id: null,
    parent_user_name: null,
    level: 0,
    created_at: "2026-06-08T16:00:00.000Z",
  },
  {
    id: "p4",
    name: "Beatriz Nunes",
    role: "CADASTRADOS",
    localidade: "Sobradinho II",
    regiao_administrativa: "Sobradinho II",
    latitude: -15.648,
    longitude: -47.833,
    root_leader_id: "l3",
    root_leader_name: "Rafael Costa",
    parent_user_id: "l3",
    parent_user_name: "Rafael Costa",
    level: 1,
    created_at: "2026-06-09T08:40:00.000Z",
  },
  {
    id: "p5",
    name: "Luciana Alves",
    role: "CADASTRADOS",
    localidade: "Gama Leste",
    regiao_administrativa: "Gama",
    latitude: -16.018,
    longitude: -48.061,
    root_leader_id: "l1",
    root_leader_name: "Maria Souza",
    parent_user_id: "p2",
    parent_user_name: "Ana Paula",
    level: 3,
    created_at: "2026-06-10T13:15:00.000Z",
  },
  {
    id: "p6",
    name: "Paulo Mendes",
    role: "CADASTRADOS",
    localidade: "Recanto das Emas",
    regiao_administrativa: "Recanto das Emas",
    latitude: -15.905,
    longitude: -48.062,
    root_leader_id: "l1",
    root_leader_name: "Maria Souza",
    parent_user_id: "l1",
    parent_user_name: "Maria Souza",
    level: 1,
    created_at: "2026-06-11T14:22:00.000Z",
  },
  {
    id: "p7",
    name: "Simone Araujo",
    role: "CADASTRADOS",
    localidade: "Planaltina",
    regiao_administrativa: "Planaltina",
    latitude: -15.617,
    longitude: -47.648,
    root_leader_id: "l3",
    root_leader_name: "Rafael Costa",
    parent_user_id: "p4",
    parent_user_name: "Beatriz Nunes",
    level: 2,
    created_at: "2026-06-12T17:50:00.000Z",
  },
];

let allPoints = [];
let filteredPoints = [];
let selectedRegion = "";
let selectedLeaderId = "";
let isTeam = user?.role === "EQUIPE";

const els = {
  userLabel: document.getElementById("dashboardUser"),
  profile: document.getElementById("profileDetails"),
  editProfile: document.getElementById("btnEditProfile"),
  referralLink: document.getElementById("profileReferralLink"),
  copyReferral: document.getElementById("btnCopyReferral"),
  adminPanel: document.getElementById("adminPanel"),
  messagesPanel: document.getElementById("teamMessagesPanel"),
  messagesList: document.getElementById("contactMessagesList"),
  refreshMessages: document.getElementById("btnRefreshMessages"),
  adminForm: document.getElementById("adminCreateForm"),
  adminMsg: document.getElementById("adminMsg"),
  emailVisible: document.getElementById("btnEmailVisible"),
  role: document.getElementById("filterRole"),
  leader: document.getElementById("filterLeader"),
  region: document.getElementById("filterRegion"),
  level: document.getElementById("filterLevel"),
  search: document.getElementById("filterSearch"),
  map: document.getElementById("mapCanvas"),
  mapOverlay: document.getElementById("mapOverlay"),
  selected: document.getElementById("selectedPoint"),
  regionSummary: document.getElementById("regionSummary"),
  regionLeaders: document.getElementById("regionLeaders"),
  leaderNetwork: document.getElementById("leaderNetwork"),
  table: document.getElementById("peopleTable"),
  tree: document.getElementById("networkTree"),
  metricLeaders: document.getElementById("metricLeaders"),
  metricUsers: document.getElementById("metricUsers"),
  metricRegions: document.getElementById("metricRegions"),
  metricMap: document.getElementById("metricMap"),
  editDialog: document.getElementById("editDialog"),
  editForm: document.getElementById("editForm"),
  editMsg: document.getElementById("editMsg"),
  editTitle: document.getElementById("editDialogTitle"),
  closeEdit: document.getElementById("btnCloseEdit"),
  cancelEdit: document.getElementById("btnCancelEdit"),
};

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("siv_token");
  localStorage.removeItem("siv_user");
  window.location.href = "/login.html";
});

els.userLabel.textContent = `${user.name || user.email} - ${user.role}`;

els.role.addEventListener("input", render);
els.level.addEventListener("input", render);
els.search.addEventListener("input", render);
els.region.addEventListener("input", () => {
  selectedRegion = els.region.value;
  selectedLeaderId = "";
  els.leader.value = "";
  render();
});
els.leader.addEventListener("input", () => {
  selectedLeaderId = els.leader.value;
  render();
});
els.copyReferral?.addEventListener("click", copyReferralLink);
els.editProfile?.addEventListener("click", () => openEditDialog(user, { self: true }));
els.adminForm?.addEventListener("submit", createAdminUser);
els.emailVisible?.addEventListener("click", () => emailUsers(filteredPoints));
els.refreshMessages?.addEventListener("click", loadContactMessages);
els.editForm?.addEventListener("submit", saveEditForm);
els.closeEdit?.addEventListener("click", closeEditDialog);
els.cancelEdit?.addEventListener("click", closeEditDialog);

init();

async function init() {
  await loadProfile();
  configureAccess();
  allPoints = await loadMapPoints();

  fillFilters(allPoints);
  render();
}

async function loadProfile() {
  if (token === "local-test-token") {
    renderProfile(user);
    return;
  }

  try {
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Falha ao carregar perfil.");
    user = data.user;
    const referralProfile = await loadMyReferralLink();
    if (referralProfile) user = { ...user, ...referralProfile };
    localStorage.setItem("siv_user", JSON.stringify(user));
    isTeam = user.role === "EQUIPE";
    els.userLabel.textContent = `${user.name || user.email} - ${user.role}`;
    renderProfile(user);
  } catch {
    renderProfile(user);
  }
}

async function loadMyReferralLink() {
  try {
    const response = await fetch("/api/leaders/me/referral-link", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.ok) return null;
    return {
      referral_code: data.referralCode,
      referral_url: data.referralUrl,
    };
  } catch {
    return null;
  }
}

function configureAccess() {
  isTeam = user?.role === "EQUIPE";
  if (els.adminPanel) els.adminPanel.hidden = !isTeam;
  if (els.messagesPanel) els.messagesPanel.hidden = !isTeam;
  document.body.classList.toggle("isTeam", isTeam);
  if (isTeam) loadContactMessages();
}

async function loadMapPoints() {
  if (token === "local-test-token") return fallbackPoints;

  try {
    const endpoint = isTeam ? "/api/admin/users?limit=200" : "/api/map/network";
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Falha ao carregar mapa.");
    return Array.isArray(data.items) ? data.items : fallbackPoints;
  } catch {
    return fallbackPoints;
  }
}

function fillFilters(points) {
  const leaders = uniqueBy(
    points.filter((point) => point.role === "COORDENADORES" || point.role === "LIDERES"),
    "id"
  );
  const regions = [...new Set(points.map((point) => point.regiao_administrativa).filter(Boolean))].sort();

  els.leader.innerHTML = `<option value="">Todos</option>${leaders
    .map((leader) => `<option value="${leader.id}">${escapeHtml(leader.name)}</option>`)
    .join("")}`;

  els.region.innerHTML = `<option value="">Todas</option>${regions
    .map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`)
    .join("")}`;
}

function render() {
  filteredPoints = applyFilters(allPoints);
  renderMetrics(filteredPoints);
  renderMap(filteredPoints);
  renderSummaries(filteredPoints);
  renderTable(filteredPoints);
  renderTree(filteredPoints);
}

function renderProfile(profile) {
  if (!els.profile) return;
  els.profile.innerHTML = `
    <div><span>Nome</span><strong>${escapeHtml(profile.name || "-")}</strong></div>
    <div><span>Email</span><strong>${escapeHtml(profile.email || "-")}</strong></div>
    <div><span>Telefone</span><strong>${escapeHtml(profile.phone || "-")}</strong></div>
    <div><span>Tipo</span><strong>${escapeHtml(profile.role || "-")}</strong></div>
    <div><span>Localidade</span><strong>${escapeHtml(profile.localidade || "-")}</strong></div>
    <div><span>Regiao</span><strong>${escapeHtml(profile.regiao_administrativa || "-")}</strong></div>
  `;

  if (els.referralLink) {
    const link = getPublicReferralUrl(profile);
    els.referralLink.value = link;
    els.referralLink.closest(".invite").style.display = link ? "block" : "none";
  }
}

function applyFilters(points) {
  const role = els.role.value;
  const leaderId = els.leader.value;
  const region = els.region.value;
  const activeRegion = selectedRegion || region;
  const activeLeader = selectedLeaderId || leaderId;
  const level = els.level.value;
  const search = els.search.value.trim().toLowerCase();

  return points.filter((point) => {
    if (role && point.role !== role) return false;
    if (activeLeader && point.root_leader_id !== activeLeader && point.id !== activeLeader) return false;
    if (activeRegion && point.regiao_administrativa !== activeRegion) return false;
    if (level) {
      if (level === "3" && Number(point.level) < 3) return false;
      if (level !== "3" && Number(point.level) !== Number(level)) return false;
    }
    if (search) {
      const haystack = `${point.name} ${point.localidade} ${point.regiao_administrativa} ${point.root_leader_name}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function renderMetrics(points) {
  const leaders = points.filter((point) => point.role === "LIDERES").length;
  const people = points.filter((point) => point.role === "CADASTRADOS").length;
  const regions = new Set(points.map((point) => point.regiao_administrativa).filter(Boolean)).size;
  const located = points.filter((point) => hasLocation(point)).length;

  els.metricLeaders.textContent = leaders;
  els.metricUsers.textContent = people;
  els.metricRegions.textContent = regions;
  els.metricMap.textContent = located;
}

function renderMap(points) {
  els.mapOverlay.innerHTML = "";
  const locatedPoints = points.filter(hasLocation);

  renderRegionAreas(locatedPoints);

  for (const point of locatedPoints) {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `mapMarker ${point.role === "COORDENADORES" || point.role === "LIDERES" ? "leaderMarker" : "personMarker"}`;
    marker.style.left = `${lngToX(point.longitude)}%`;
    marker.style.top = `${latToY(point.latitude)}%`;
    marker.title = `${point.localidade || point.regiao_administrativa || "Sem localidade"} - ${point.name}`;
    marker.setAttribute("aria-label", marker.title);
    marker.addEventListener("click", () => selectPoint(point));
    els.mapOverlay.appendChild(marker);
  }

  if (!locatedPoints.length) {
    els.selected.textContent = "Nenhum ponto com latitude e longitude para os filtros atuais.";
  }
}

function renderRegionAreas(points) {
  const groups = groupBy(points, (point) => point.regiao_administrativa || "Sem regiao");
  for (const group of groups) {
    const located = group.items.filter(hasLocation);
    if (!located.length) continue;

    const lat = average(located.map((point) => Number(point.latitude)));
    const lng = average(located.map((point) => Number(point.longitude)));
    const leaders = located.filter((point) => point.role === "LIDERES").length;
    const people = located.filter((point) => point.role === "CADASTRADOS").length;

    const area = document.createElement("button");
    area.type = "button";
    area.className = `regionArea${selectedRegion === group.label ? " activeRegionArea" : ""}`;
    area.style.left = `${lngToX(lng)}%`;
    area.style.top = `${latToY(lat)}%`;
    area.style.width = `${Math.max(70, Math.min(150, located.length * 26))}px`;
    area.style.height = area.style.width;
    area.title = `${group.label}: ${leaders} lider(es), ${people} cadastrado(s)`;
    area.setAttribute("aria-label", area.title);
    area.addEventListener("click", () => selectRegion(group.label));
    els.mapOverlay.appendChild(area);
  }
}

function selectPoint(point) {
  if (point.role === "COORDENADORES" || point.role === "LIDERES") {
    selectedLeaderId = point.id;
    els.leader.value = point.id;
    render();
  }

  const locationLabel = point.localidade || point.regiao_administrativa || "Sem localidade";

  els.selected.innerHTML = `
    <strong>${escapeHtml(locationLabel)}</strong>
    <span>Pessoa: ${escapeHtml(point.name || "Nao informado")}</span>
    <span>${escapeHtml(point.role)} - ${escapeHtml(point.regiao_administrativa || "Sem regiao")}</span>
    <span>Nivel ${point.level ?? "-"}</span>
    <span>Responsavel: ${escapeHtml(point.root_leader_name || "Nao informado")}</span>
    <span>Cadastro: ${formatDate(point.created_at)}</span>
  `;
}

function renderSummaries(points) {
  renderRegionSummary();
  renderRegionLeaders();
  renderLeaderNetwork();
}

function renderRegionSummary() {
  const items = countBy(allPoints, (point) => point.regiao_administrativa || "Nao informado");
  renderSummaryList(els.regionSummary, items, {
    activeLabel: selectedRegion || els.region.value,
    onClick: (label) => selectRegion(label),
  });
}

function renderRegionLeaders() {
  const region = selectedRegion || els.region.value;
  const leaders = allPoints.filter(
    (point) => (point.role === "COORDENADORES" || point.role === "LIDERES") && (!region || point.regiao_administrativa === region)
  );

  if (!leaders.length) {
    els.regionLeaders.innerHTML = `<div class="emptyState">Clique em uma regiao para ver os responsaveis.</div>`;
    return;
  }

  els.regionLeaders.innerHTML = leaders
    .map((leader) => {
      const total = allPoints.filter((point) => point.root_leader_id === leader.id || point.id === leader.id).length;
      const active = selectedLeaderId === leader.id ? " activeSummary" : "";
      return `
        <button class="summaryRow summaryButton${active}" type="button" data-leader-id="${escapeHtml(leader.id)}">
          <div>
            <strong>${escapeHtml(leader.name)}</strong>
            <span>${total} cadastro${total === 1 ? "" : "s"} na rede</span>
          </div>
          <div class="summaryBar"><i style="width:100%"></i></div>
        </button>
      `;
    })
    .join("");

  els.regionLeaders.querySelectorAll("[data-leader-id]").forEach((button) => {
    button.addEventListener("click", () => selectLeader(button.dataset.leaderId));
  });
}

function renderLeaderNetwork() {
  const leaderId = selectedLeaderId || els.leader.value;
  if (!leaderId) {
    els.leaderNetwork.innerHTML = `<div class="emptyState">Selecione um responsavel para ver a rede dele.</div>`;
    return;
  }

  const network = allPoints
    .filter((point) => point.root_leader_id === leaderId || point.id === leaderId)
    .sort((a, b) => Number(a.level || 0) - Number(b.level || 0));

  els.leaderNetwork.innerHTML = network
    .map(
      (point) => `
        <div class="networkMiniItem">
          <strong>${escapeHtml(point.name)}</strong>
          <span>${escapeHtml(point.role)} - nivel ${point.level ?? "-"}</span>
          <span>${escapeHtml(point.localidade || point.regiao_administrativa || "")}</span>
        </div>
      `
    )
    .join("");
}

function renderSummaryList(container, items, options = {}) {
  if (!items.length) {
    container.innerHTML = `<div class="emptyState">Sem dados para os filtros.</div>`;
    return;
  }

  const max = Math.max(...items.map((item) => item.total));
  container.innerHTML = items
    .map(
      (item) => `
        <button class="summaryRow summaryButton${options.activeLabel === item.label ? " activeSummary" : ""}" type="button" data-label="${escapeHtml(item.label)}">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${item.total} cadastro${item.total === 1 ? "" : "s"}</span>
          </div>
          <div class="summaryBar"><i style="width:${Math.max(8, (item.total / max) * 100)}%"></i></div>
        </button>
      `
    )
    .join("");

  if (options.onClick) {
    container.querySelectorAll("[data-label]").forEach((button) => {
      button.addEventListener("click", () => options.onClick(button.dataset.label));
    });
  }
}

function renderTable(points) {
  if (!points.length) {
    els.table.innerHTML = `<tr><td colspan="${isTeam ? 9 : 6}">Nenhum cadastro encontrado.</td></tr>`;
    return;
  }

  els.table.innerHTML = points
    .map(
      (point) => `
        <tr>
          <td>${isTeam ? `<a class="personNameLink" href="/cadastro-detalhe.html?id=${encodeURIComponent(point.id)}">${escapeHtml(point.name)}</a>` : `<strong>${escapeHtml(point.name)}</strong>`}</td>
          <td><span class="rolePill ${point.role === "COORDENADORES" || point.role === "LIDERES" ? "roleLeader" : "rolePerson"}">${escapeHtml(point.role)}</span></td>
          ${isTeam ? `<td>${escapeHtml(point.email || "-")}<small>${escapeHtml(point.phone || "")}</small></td>` : ""}
          <td>${escapeHtml(point.localidade || "-")}<small>${escapeHtml(point.regiao_administrativa || "")}</small></td>
          <td>${escapeHtml(point.root_leader_name || "-")}</td>
          ${isTeam ? `<td>${renderReferralCell(point)}</td>` : ""}
          <td>${point.level ?? "-"}</td>
          <td>${formatDate(point.created_at)}</td>
          ${isTeam ? `
            <td>
              <div class="tableActions">
                <button type="button" class="btnTiny" data-action="edit" data-id="${escapeHtml(point.id)}">Editar</button>
              </div>
            </td>
          ` : ""}
        </tr>
      `
    )
    .join("");

  if (isTeam) {
    els.table.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => handleTableAction(button.dataset.action, button.dataset.id));
    });
  }
}

async function createAdminUser(event) {
  event.preventDefault();
  showAdminMessage("", "");
  const formData = new FormData(els.adminForm);
  const body = Object.fromEntries(formData.entries());
  const photoFile = formData.get("photo");
  delete body.photo;

  try {
    if (photoFile && photoFile.size) {
      body.photoUrl = await uploadPhoto(photoFile);
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel adicionar.");
    els.adminForm.reset();
    showAdminMessage("Cadastro adicionado.", "ok");
    allPoints = await loadMapPoints();
    fillFilters(allPoints);
    render();
  } catch (error) {
    showAdminMessage(`Erro: ${error.message || error}`, "err");
  }
}

async function uploadPhoto(file) {
  const preparedFile = await preparePhotoFile(file);
  const data = new FormData();
  data.append("photo", preparedFile, preparedFile.name || file.name || "foto.jpg");
  const response = await fetch("/api/upload/profile-photo", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: data,
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

async function handleTableAction(action, id) {
  try {
    const person = allPoints.find((point) => String(point.id) === String(id));
    if (!person) return;

    if (action === "email") {
      emailUsers([person]);
      return;
    }

    if (action === "copy-link") {
      const link = getPublicReferralUrl(person);
      await copyText(link);
      showAdminMessage(link ? "Link copiado." : "Este cadastro ainda nao tem link salvo.", link ? "ok" : "err");
      return;
    }

    if (action === "delete") {
      if (!confirm(`Excluir o cadastro de ${person.name}?`)) return;
      await adminRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
      allPoints = allPoints.filter((point) => String(point.id) !== String(id));
      render();
      return;
    }

    if (action === "edit") {
      openEditDialog(person);
    }
  } catch (error) {
    showAdminMessage(`Erro: ${error.message || error}`, "err");
  }
}

function openEditDialog(person, { self = false } = {}) {
  if (!person || !els.editDialog || !els.editForm) return;
  els.editForm.dataset.self = self ? "true" : "false";
  els.editTitle.textContent = self ? "Editar minhas informacoes" : `Editar ${person.name || "cadastro"}`;
  setEditValue("editId", person.id || "");
  setEditValue("editName", person.name || "");
  setEditValue("editEmail", person.email || "");
  setEditValue("editPhone", person.phone || "");
  setEditValue("editRole", person.role || "CADASTRADOS");
  setEditValue("editLocalidade", person.localidade || "");
  setEditValue("editRegiao", person.regiao_administrativa || "");
  setEditValue("editPassword", "");
  const active = document.getElementById("editActive");
  if (active) active.checked = person.active !== false;
  const role = document.getElementById("editRole");
  const activeBlock = active?.closest(".editActive");
  if (role) role.disabled = self && !isTeam;
  if (active) active.disabled = self && !isTeam;
  if (activeBlock) activeBlock.classList.toggle("isDisabled", self && !isTeam);
  const photo = document.getElementById("editPhoto");
  if (photo) photo.value = "";
  showEditMessage("", "");
  els.editDialog.showModal();
}

function setEditValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value;
}

function closeEditDialog() {
  els.editDialog?.close();
}

async function saveEditForm(event) {
  event.preventDefault();
  showEditMessage("", "");
  const formData = new FormData(els.editForm);
  const id = formData.get("id");
  const photoFile = formData.get("photo");
  const isSelfEdit = els.editForm.dataset.self === "true";
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    localidade: formData.get("localidade"),
    regiao_administrativa: formData.get("regiao_administrativa"),
  };
  if (!isSelfEdit || isTeam) {
    payload.role = formData.get("role");
    payload.active = document.getElementById("editActive")?.checked ? "true" : "false";
  }
  const password = String(formData.get("password") || "").trim();
  if (password) payload.password = password;

  try {
    if (photoFile && photoFile.size) {
      payload.photo_url = await uploadPhoto(photoFile);
    }

    const updated = await adminRequest(isSelfEdit ? "/api/auth/me" : `/api/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (String(id) === String(user.id)) {
      user = { ...user, ...updated.user };
      localStorage.setItem("siv_user", JSON.stringify(user));
      els.userLabel.textContent = `${user.name || user.email} - ${user.role}`;
      renderProfile(user);
    }

    allPoints = updated.user.active === false
      ? allPoints.filter((point) => String(point.id) !== String(id))
      : allPoints.map((point) => String(point.id) === String(id) ? updated.user : point);
    fillFilters(allPoints);
    render();
    closeEditDialog();
    showAdminMessage("Cadastro atualizado.", "ok");
  } catch (error) {
    showEditMessage(`Erro: ${error.message || error}`, "err");
  }
}

function showEditMessage(text, type) {
  if (!els.editMsg) return;
  els.editMsg.textContent = text;
  els.editMsg.className = type ? `msg ${type}` : "msg";
  els.editMsg.style.display = text ? "block" : "none";
}

async function adminRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "Operacao administrativa falhou.");
  return data;
}

function emailUsers(points) {
  const emails = [...new Set(points.map((point) => point.email).filter(Boolean))];
  if (!emails.length) {
    showAdminMessage("Nenhum email disponivel para os filtros atuais.", "err");
    return;
  }
  window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}`;
}

function renderReferralCell(point) {
  const link = getPublicReferralUrl(point);
  if (!link) return "-";
  return `<small>${escapeHtml(point.referral_code || "")}</small><span class="linkCell">${escapeHtml(link)}</span>`;
}

function getPublicReferralUrl(point) {
  const code = point.referral_code || point.referralCode || extractReferralCode(point.referral_url || point.referralUrl);
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

async function loadContactMessages() {
  if (!isTeam || !els.messagesList) return;
  try {
    const response = await fetch("/api/contact/messages?limit=50", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel carregar mensagens.");
    renderContactMessages(data.items || []);
  } catch (error) {
    els.messagesList.innerHTML = `<div class="emptyState">Erro ao carregar mensagens: ${escapeHtml(error.message || error)}</div>`;
  }
}

function renderContactMessages(messages) {
  if (!messages.length) {
    els.messagesList.innerHTML = `<div class="emptyState">Nenhuma mensagem recebida.</div>`;
    return;
  }

  els.messagesList.innerHTML = messages.map((message) => `
    <article class="messageItem" data-message-id="${escapeHtml(message.id)}">
      <div>
        <strong>${escapeHtml(message.user_name || message.name)}</strong>
        <span>${escapeHtml(message.status || "NOVO")} - ${formatDate(message.created_at)}</span>
      </div>
      <p>${escapeHtml(message.message)}</p>
      <small>${escapeHtml(message.email || "-")} ${escapeHtml(message.phone || "")}</small>
      ${message.reply ? `
        <div class="messageReply">
          <strong>Resposta</strong>
          <p>${escapeHtml(message.reply)}</p>
          <small>${formatDate(message.replied_at)}</small>
        </div>
      ` : `
        <label for="reply-${escapeHtml(message.id)}">Responder</label>
        <textarea id="reply-${escapeHtml(message.id)}" class="replyTextarea" placeholder="Digite a resposta da equipe"></textarea>
        <button type="button" class="btnTiny" data-action="reply-message" data-id="${escapeHtml(message.id)}">Salvar resposta</button>
      `}
    </article>
  `).join("");

  els.messagesList.querySelectorAll('[data-action="reply-message"]').forEach((button) => {
    button.addEventListener("click", () => replyContactMessage(button.dataset.id));
  });
}

async function replyContactMessage(id) {
  const textarea = document.getElementById(`reply-${id}`);
  const reply = textarea?.value?.trim();
  if (!reply) return showAdminMessage("Digite a resposta antes de salvar.", "err");
  try {
    const response = await fetch(`/api/contact/messages/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reply }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel responder.");
    showAdminMessage("Resposta salva.", "ok");
    await loadContactMessages();
  } catch (error) {
    showAdminMessage(`Erro: ${error.message || error}`, "err");
  }
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
}

async function copyReferralLink() {
  if (!els.referralLink?.value) return;
  await copyText(els.referralLink.value);
  els.copyReferral.textContent = "Copiado!";
  setTimeout(() => (els.copyReferral.textContent = "Copiar"), 1200);
}

function showAdminMessage(text, type) {
  if (!els.adminMsg) return;
  els.adminMsg.textContent = text;
  els.adminMsg.className = type ? `msg ${type}` : "msg";
  els.adminMsg.style.display = text ? "block" : "none";
}

function renderTree(points) {
  const byLeader = new Map();
  for (const point of points) {
    const key = point.root_leader_id || point.id;
    if (!byLeader.has(key)) {
      byLeader.set(key, {
        leaderName: point.root_leader_name || point.name,
        levels: new Map(),
      });
    }
    const group = byLeader.get(key);
    const level = Number(point.level || 0);
    if (!group.levels.has(level)) group.levels.set(level, []);
    group.levels.get(level).push(point);
  }

  if (!byLeader.size) {
    els.tree.innerHTML = `<div class="emptyState">Sem rede para exibir.</div>`;
    return;
  }

  els.tree.innerHTML = [...byLeader.values()]
    .map((group) => {
      const levels = [...group.levels.entries()]
        .sort(([a], [b]) => a - b)
        .map(
          ([level, members]) => `
            <div class="treeLevel">
              <span>Nivel ${level}</span>
              ${members.map((member) => `<strong>${escapeHtml(member.name)}</strong>`).join("")}
            </div>
          `
        )
        .join("");

      return `
        <div class="treeGroup">
          <h3>${escapeHtml(group.leaderName)}</h3>
          ${levels}
        </div>
      `;
    })
    .join("");
}

function countBy(points, getLabel) {
  const map = new Map();
  for (const point of points) {
    const label = getLabel(point);
    map.set(label, (map.get(label) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function groupBy(points, getLabel) {
  const map = new Map();
  for (const point of points) {
    const label = getLabel(point);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(point);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function selectRegion(region) {
  selectedRegion = selectedRegion === region ? "" : region;
  els.region.value = selectedRegion;
  selectedLeaderId = "";
  els.leader.value = "";
  render();
}

function selectLeader(leaderId) {
  selectedLeaderId = leaderId;
  els.leader.value = leaderId;
  render();
}

function uniqueBy(items, key) {
  const map = new Map();
  for (const item of items) map.set(item[key], item);
  return [...map.values()];
}

function hasLocation(point) {
  return Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude));
}

function lngToX(lng) {
  return clamp(((Number(lng) - DF_BOUNDS.minLng) / (DF_BOUNDS.maxLng - DF_BOUNDS.minLng)) * 100, 3, 97);
}

function latToY(lat) {
  return clamp(((DF_BOUNDS.maxLat - Number(lat)) / (DF_BOUNDS.maxLat - DF_BOUNDS.minLat)) * 100, 3, 97);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
