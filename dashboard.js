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

const MAP_POSITION_PADDING = {
  minX: 13,
  maxX: 87,
  minY: 15,
  maxY: 87,
};

const REGION_COORDS = {
  "agua quente": { latitude: -15.935, longitude: -48.11 },
  "aguas claras": { latitude: -15.837, longitude: -48.023 },
  arapoanga: { latitude: -15.632, longitude: -47.653 },
  arniqueira: { latitude: -15.861, longitude: -48.018 },
  brasilia: { latitude: -15.793, longitude: -47.882 },
  brazlandia: { latitude: -15.67, longitude: -48.2 },
  candangolandia: { latitude: -15.852, longitude: -47.95 },
  ceilandia: { latitude: -15.819, longitude: -48.113 },
  cruzeiro: { latitude: -15.79, longitude: -47.938 },
  "estrutural (scia)": { latitude: -15.781, longitude: -47.997 },
  fercal: { latitude: -15.6, longitude: -47.87 },
  gama: { latitude: -16.018, longitude: -48.061 },
  guara: { latitude: -15.823, longitude: -47.978 },
  itapoa: { latitude: -15.745, longitude: -47.755 },
  "jardim botanico": { latitude: -15.865, longitude: -47.8 },
  "lago norte": { latitude: -15.725, longitude: -47.846 },
  "lago sul": { latitude: -15.84, longitude: -47.872 },
  "nucleo bandeirante": { latitude: -15.871, longitude: -47.965 },
  paranoa: { latitude: -15.775, longitude: -47.779 },
  "park way": { latitude: -15.898, longitude: -47.972 },
  planaltina: { latitude: -15.62, longitude: -47.73 },
  "plano piloto": { latitude: -15.793, longitude: -47.882 },
  "recanto das emas": { latitude: -15.905, longitude: -48.062 },
  "riacho fundo": { latitude: -15.88, longitude: -48.004 },
  "riacho fundo ii": { latitude: -15.908, longitude: -48.051 },
  samambaia: { latitude: -15.879, longitude: -48.089 },
  "santa maria": { latitude: -16.0, longitude: -47.987 },
  "sao sebastiao": { latitude: -15.9, longitude: -47.775 },
  sia: { latitude: -15.802, longitude: -47.957 },
  sobradinho: { latitude: -15.653, longitude: -47.792 },
  "sobradinho ii": { latitude: -15.648, longitude: -47.833 },
  "sol nascente e por do sol": { latitude: -15.823, longitude: -48.14 },
  "sudoeste/octogonal": { latitude: -15.797, longitude: -47.925 },
  taguatinga: { latitude: -15.835, longitude: -48.056 },
  varjao: { latitude: -15.711, longitude: -47.88 },
  "vicente pires": { latitude: -15.803, longitude: -48.02 },
};

const LOCALIDADE_COORDS = {
  "aguas claras": { latitude: -15.837, longitude: -48.023 },
  "areal": { latitude: -15.843, longitude: -48.033 },
  "arapoanga": { latitude: -15.632, longitude: -47.653 },
  "arapoanga centro": { latitude: -15.632, longitude: -47.653 },
  "arapoanga oeste": { latitude: -15.63, longitude: -47.668 },
  "arapoanga leste": { latitude: -15.633, longitude: -47.638 },
  "asa norte": { latitude: -15.765, longitude: -47.882 },
  "asa sul": { latitude: -15.815, longitude: -47.899 },
  "brazlandia centro": { latitude: -15.67, longitude: -48.2 },
  "buritis i": { latitude: -15.62, longitude: -47.665 },
  "buritis ii": { latitude: -15.615, longitude: -47.67 },
  "buritis iii": { latitude: -15.61, longitude: -47.675 },
  "buritis iv": { latitude: -15.606, longitude: -47.68 },
  "ceilandia centro": { latitude: -15.818, longitude: -48.106 },
  "ceilandia norte": { latitude: -15.79, longitude: -48.113 },
  "ceilandia sul": { latitude: -15.84, longitude: -48.115 },
  "condominio prive": { latitude: -15.816, longitude: -48.158 },
  "condominio sol nascente": { latitude: -15.822, longitude: -48.158 },
  "cruzeiro novo": { latitude: -15.79, longitude: -47.936 },
  "cruzeiro velho": { latitude: -15.786, longitude: -47.944 },
  "expansao do setor o": { latitude: -15.807, longitude: -48.17 },
  "gama centro": { latitude: -16.018, longitude: -48.061 },
  "gama leste": { latitude: -16.018, longitude: -48.044 },
  "gama norte": { latitude: -16.004, longitude: -48.064 },
  "gama oeste": { latitude: -16.02, longitude: -48.08 },
  "gama sul": { latitude: -16.035, longitude: -48.062 },
  "guara i": { latitude: -15.817, longitude: -47.98 },
  "guara ii": { latitude: -15.834, longitude: -47.985 },
  "guariroba": { latitude: -15.825, longitude: -48.118 },
  "itapoa i": { latitude: -15.746, longitude: -47.752 },
  "itapoa ii": { latitude: -15.742, longitude: -47.763 },
  "itapoa iii": { latitude: -15.738, longitude: -47.771 },
  "jardim roriz": { latitude: -15.625, longitude: -47.666 },
  "lago norte": { latitude: -15.725, longitude: -47.846 },
  "lago sul": { latitude: -15.84, longitude: -47.872 },
  "lucio costa": { latitude: -15.808, longitude: -47.984 },
  "m norte": { latitude: -15.807, longitude: -48.08 },
  "mestre d'armas": { latitude: -15.595, longitude: -47.661 },
  "noroeste": { latitude: -15.75, longitude: -47.9 },
  "nucleo bandeirante": { latitude: -15.871, longitude: -47.965 },
  "p norte": { latitude: -15.792, longitude: -48.135 },
  "p sul": { latitude: -15.846, longitude: -48.135 },
  "paranoa centro": { latitude: -15.775, longitude: -47.779 },
  "paranoa parque": { latitude: -15.77, longitude: -47.797 },
  "planaltina centro": { latitude: -15.62, longitude: -47.73 },
  "por do sol": { latitude: -15.822, longitude: -48.135 },
  "qna": { latitude: -15.831, longitude: -48.052 },
  "qnb": { latitude: -15.834, longitude: -48.058 },
  "qnc": { latitude: -15.838, longitude: -48.064 },
  "qnd": { latitude: -15.842, longitude: -48.07 },
  "qne": { latitude: -15.83, longitude: -48.066 },
  "qnf": { latitude: -15.826, longitude: -48.072 },
  "qng": { latitude: -15.822, longitude: -48.078 },
  "qnh": { latitude: -15.818, longitude: -48.084 },
  "qnl": { latitude: -15.81, longitude: -48.095 },
  "qn 5": { latitude: -15.901, longitude: -48.036 },
  "qn 7": { latitude: -15.906, longitude: -48.041 },
  "qn 8": { latitude: -15.91, longitude: -48.045 },
  "qn 10": { latitude: -15.914, longitude: -48.05 },
  "qn 12": { latitude: -15.918, longitude: -48.055 },
  "qnm": { latitude: -15.81, longitude: -48.11 },
  "qnn": { latitude: -15.818, longitude: -48.12 },
  "qno": { latitude: -15.804, longitude: -48.15 },
  "qnp": { latitude: -15.83, longitude: -48.145 },
  "qnr": { latitude: -15.82, longitude: -48.17 },
  "recanto das emas centro": { latitude: -15.905, longitude: -48.062 },
  "riacho fundo i": { latitude: -15.88, longitude: -48.004 },
  "riacho fundo ii": { latitude: -15.908, longitude: -48.051 },
  "samambaia centro": { latitude: -15.872, longitude: -48.085 },
  "samambaia norte": { latitude: -15.858, longitude: -48.09 },
  "samambaia sul": { latitude: -15.894, longitude: -48.09 },
  "santa maria centro": { latitude: -16.0, longitude: -47.987 },
  "santa maria norte": { latitude: -15.984, longitude: -47.99 },
  "santa maria sul": { latitude: -16.018, longitude: -47.986 },
  "setor c norte": { latitude: -15.815, longitude: -48.066 },
  "setor c sul": { latitude: -15.846, longitude: -48.06 },
  "setor o": { latitude: -15.805, longitude: -48.153 },
  "setor tradicional|planaltina": { latitude: -15.62, longitude: -47.73 },
  "setor tradicional|sobradinho": { latitude: -15.651, longitude: -47.795 },
  "sobradinho centro": { latitude: -15.653, longitude: -47.792 },
  "sol nascente": { latitude: -15.815, longitude: -48.155 },
  "taguatinga centro": { latitude: -15.835, longitude: -48.056 },
  "taguatinga norte": { latitude: -15.818, longitude: -48.06 },
  "taguatinga sul": { latitude: -15.852, longitude: -48.055 },
  "vale do amanhecer": { latitude: -15.604, longitude: -47.69 },
  "varjao centro": { latitude: -15.711, longitude: -47.88 },
  "vicente pires": { latitude: -15.803, longitude: -48.02 },
  "vila buritis": { latitude: -15.618, longitude: -47.662 },
  "vila planalto": { latitude: -15.79, longitude: -47.855 },
};

const localidadesDF = window.DF_LOCALIDADES || {};
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
let selectedPointId = "";
let focusedMapPointId = "";
let stableMapPositions = new Map();
let isTeam = user?.role === "EQUIPE";
let canViewFullMap = user?.role === "EQUIPE" || user?.role === "COORDENADORES";
let activeView = "home";
let contactMessages = [];
let activeMessageFilter = "pending";

const els = {
  userLabel: document.getElementById("dashboardUser"),
  profile: document.getElementById("profileDetails"),
  editProfile: document.getElementById("btnEditProfile"),
  referralLink: document.getElementById("profileReferralLink"),
  referralRole: document.getElementById("profileReferralRole"),
  copyReferral: document.getElementById("btnCopyReferral"),
  adminPanel: document.getElementById("adminPanel"),
  messagesPanel: document.getElementById("teamMessagesPanel"),
  messagesList: document.getElementById("contactMessagesList"),
  refreshMessages: document.getElementById("btnRefreshMessages"),
  adminForm: document.getElementById("adminCreateForm"),
  adminMsg: document.getElementById("adminMsg"),
  adminCreatedSummary: document.getElementById("adminCreatedSummary"),
  adminPeopleSearch: document.getElementById("adminPeopleSearch"),
  adminPeopleResults: document.getElementById("adminPeopleResults"),
  emailVisible: document.getElementById("btnEmailVisible"),
  role: document.getElementById("filterRole"),
  leader: document.getElementById("filterLeader"),
  region: document.getElementById("filterRegion"),
  level: document.getElementById("filterLevel"),
  search: document.getElementById("filterSearch"),
  map: document.getElementById("mapCanvas"),
  mapFrame: document.querySelector(".satelliteFrame"),
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
  deleteEdit: document.getElementById("btnDeleteEdit"),
  menuToggle: document.getElementById("btnToggleMenu"),
  exportLeaderSearch: document.getElementById("exportLeaderSearch"),
  exportPeopleOptions: document.getElementById("exportPeopleOptions"),
  exportNameResults: document.getElementById("exportNameResults"),
  exportLeader: document.getElementById("btnExportLeader"),
  exportStatus: document.getElementById("exportStatus"),
  sideMessageBadge: document.getElementById("sideMessageBadge"),
  homePendingMessages: document.getElementById("homePendingMessages"),
  homeMessageAlert: document.getElementById("homeMessageAlert"),
  messageStatusFilters: document.getElementById("messageStatusFilters"),
  sideButtons: document.querySelectorAll("[data-view-target]"),
  viewLinks: document.querySelectorAll("[data-go-view]"),
  views: document.querySelectorAll(".dashboardView"),
  teamNavItems: document.querySelectorAll(".teamOnlyNav"),
  teamHomeItems: document.querySelectorAll(".teamOnlyHome"),
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
  selectedPointId = "";
  els.leader.value = "";
  resetMapFrame();
  render();
});
els.leader.addEventListener("input", () => {
  selectedLeaderId = els.leader.value;
  render();
});
els.copyReferral?.addEventListener("click", copyReferralLink);
els.referralRole?.addEventListener("input", () => renderReferralLink(user));
els.editProfile?.addEventListener("click", () => openEditDialog(user, { self: true }));
els.adminForm?.addEventListener("submit", createAdminUser);
document.getElementById("adminRole")?.addEventListener("change", updateAdminLoginFields);
document.getElementById("editRole")?.addEventListener("change", updateEditLoginFields);
els.adminPeopleSearch?.addEventListener("input", renderAdminPeopleSearch);
els.emailVisible?.addEventListener("click", () => emailUsers(filteredPoints));
els.exportLeaderSearch?.addEventListener("input", renderExportPeopleResults);
els.exportLeader?.addEventListener("click", exportPeopleByName);
els.refreshMessages?.addEventListener("click", loadContactMessages);
els.editForm?.addEventListener("submit", saveEditForm);
els.closeEdit?.addEventListener("click", closeEditDialog);
els.cancelEdit?.addEventListener("click", closeEditDialog);
els.deleteEdit?.addEventListener("click", deleteFromEditDialog);
els.messageStatusFilters?.querySelectorAll("[data-message-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeMessageFilter = button.dataset.messageFilter || "pending";
    renderContactMessages(contactMessages);
  });
});
els.sideButtons.forEach((button) => {
  button.addEventListener("click", () => setDashboardView(button.dataset.viewTarget));
});
els.viewLinks.forEach((button) => {
  button.addEventListener("click", () => setDashboardView(button.dataset.goView));
});
els.menuToggle?.addEventListener("click", () => {
  const collapsed = document.body.classList.toggle("menuCollapsed");
  localStorage.setItem("siv_menu_collapsed", collapsed ? "1" : "0");
  updateMenuToggle(collapsed);
});
setupLocalidadeSelector("adminRegiao", "adminLocalidade");
setupLocalidadeSelector("editRegiao", "editLocalidade");
enhanceDownwardSelect(document.getElementById("adminRegiao"));
enhanceDownwardSelect(document.getElementById("editRegiao"));
updateAdminLoginFields();

init();

async function init() {
  const collapsed = localStorage.getItem("siv_menu_collapsed") === "1";
  document.body.classList.toggle("menuCollapsed", collapsed);
  updateMenuToggle(collapsed);
  await loadProfile();
  configureAccess();
  setDashboardView(activeView);
  allPoints = await loadMapPoints();
  stableMapPositions = buildStableMapPositions(allPoints);

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
    canViewFullMap = user.role === "EQUIPE" || user.role === "COORDENADORES";
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
  els.teamNavItems.forEach((item) => {
    item.hidden = !isTeam;
  });
  els.teamHomeItems.forEach((item) => {
    item.hidden = !isTeam;
  });
  document.body.classList.toggle("isTeam", isTeam);
  if (isTeam) loadContactMessages();
}

function canRoleLogin(role) {
  return role === "EQUIPE" || role === "COORDENADORES";
}

function updateAdminLoginFields() {
  updateLoginFields({
    roleId: "adminRole",
    emailId: "adminEmail",
    passwordId: "adminPassword",
    passwordFieldId: "adminPasswordField",
    passwordRequired: true,
  });
}

function updateEditLoginFields() {
  updateLoginFields({
    roleId: "editRole",
    emailId: "editEmail",
    passwordId: "editPassword",
    passwordRequired: false,
  });
}

function updateLoginFields({ roleId, emailId, passwordId, passwordFieldId, passwordRequired = false }) {
  const role = document.getElementById(roleId)?.value || "";
  const email = document.getElementById(emailId);
  const password = document.getElementById(passwordId);
  const passwordField = passwordFieldId ? document.getElementById(passwordFieldId) : password?.closest("div");
  const needsPassword = canRoleLogin(role);

  if (email) {
    email.required = needsPassword;
    email.placeholder = needsPassword ? "email@exemplo.com" : "Opcional para lider/cadastrado";
    if (!needsPassword) email.value = "";
  }

  if (passwordField) passwordField.hidden = !needsPassword;
  if (password) {
    password.required = needsPassword && passwordRequired;
    if (!needsPassword) password.value = "";
  }
}

function setDashboardView(view) {
  const restricted = ["admin", "messages"];
  activeView = !isTeam && restricted.includes(view) ? "home" : view || "home";

  els.sideButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === activeView);
  });

  els.views.forEach((section) => {
    section.classList.toggle("isHiddenView", section.dataset.view !== activeView);
  });

  if (activeView === "messages") loadContactMessages();
}

function updateMenuToggle(collapsed) {
  if (!els.menuToggle) return;
  els.menuToggle.textContent = collapsed ? "›" : "‹";
  els.menuToggle.setAttribute("aria-label", collapsed ? "Abrir menu lateral" : "Recolher menu lateral");
}

async function loadMapPoints() {
  if (token === "local-test-token") return fallbackPoints;

  try {
    const endpoint = canViewFullMap ? "/api/admin/users?limit=200" : "/api/map/network?requireCoordinates=false";
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
}

function setupLocalidadeSelector(regiaoId, localidadeId) {
  const regiao = document.getElementById(regiaoId);
  const localidade = document.getElementById(localidadeId);
  if (!regiao || !localidade) return;

  fillLocalidadeSelect(localidade, regiao.value, localidade.value);
  regiao.addEventListener("change", () => fillLocalidadeSelect(localidade, regiao.value));
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

  if (els.exportPeopleOptions) {
    const names = [...new Set(points.map((point) => point.name).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
    els.exportPeopleOptions.innerHTML = names
      .map((name) => `<option value="${escapeHtml(name)}"></option>`)
      .join("");
  }
}

function render() {
  filteredPoints = applyFilters(allPoints);
  renderMetrics(filteredPoints);
  renderMap(filteredPoints);
  renderSummaries(filteredPoints);
  renderTable(filteredPoints);
  renderTree(filteredPoints);
  renderAdminPeopleSearch();
  renderExportPeopleResults();
}

function renderExportPeopleResults() {
  if (!els.exportNameResults) return;
  const search = normalizeLocalidadeKey(els.exportLeaderSearch?.value || "");
  if (!search) {
    els.exportNameResults.innerHTML = "";
    return;
  }

  const matches = getPeopleMatchingExportSearch(allPoints).slice(0, 5);
  if (!matches.length) {
    els.exportNameResults.innerHTML = `<div class="sideExportEmpty">Nenhuma pessoa encontrada.</div>`;
    return;
  }

  els.exportNameResults.innerHTML = matches.map((person) => `
    <button type="button" data-export-name="${escapeHtml(person.name || "")}">
      <strong>${escapeHtml(person.name || "-")}</strong>
      <span>${escapeHtml(person.localidade || person.regiao_administrativa || "")}</span>
    </button>
  `).join("");

  els.exportNameResults.querySelectorAll("[data-export-name]").forEach((button) => {
    button.addEventListener("click", () => {
      if (els.exportLeaderSearch) els.exportLeaderSearch.value = button.dataset.exportName || "";
      renderExportPeopleResults();
    });
  });
}

function renderAdminPeopleSearch() {
  if (!els.adminPeopleResults) return;
  const search = String(els.adminPeopleSearch?.value || "").trim().toLowerCase();
  const matches = (search ? allPoints.filter((point) => {
    const haystack = `${point.name || ""} ${point.email || ""} ${point.phone || ""} ${point.localidade || ""} ${point.regiao_administrativa || ""} ${point.role || ""}`.toLowerCase();
    return haystack.includes(search);
  }) : allPoints.slice(0, 6))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    .slice(0, 8);

  if (!matches.length) {
    els.adminPeopleResults.innerHTML = `<div class="emptyState">Nenhum cadastro encontrado.</div>`;
    return;
  }

  els.adminPeopleResults.innerHTML = matches.map((person) => `
    <button type="button" class="adminPeopleResult" data-person-id="${escapeHtml(person.id)}">
      <strong>${escapeHtml(person.name || "-")}</strong>
      <span>${escapeHtml(person.role || "-")} - ${escapeHtml(person.localidade || person.regiao_administrativa || "-")}</span>
      <small>${escapeHtml(person.email || person.phone || "")}</small>
    </button>
  `).join("");

  els.adminPeopleResults.querySelectorAll("[data-person-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const person = allPoints.find((point) => String(point.id) === String(button.dataset.personId));
      if (person) openEditDialog(person);
    });
  });
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
    renderReferralLink(profile);
  }
}

function renderReferralLink(profile) {
  if (!els.referralLink) return;
  const targetRole = profile?.role === "EQUIPE" ? els.referralRole?.value : "";
  const link = getPublicReferralUrl(profile, targetRole);
  els.referralLink.value = link;
  els.referralLink.closest(".invite").style.display = link ? "block" : "none";
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
  const located = points.filter((point) => hasMapPosition(point)).length;

  els.metricLeaders.textContent = leaders;
  els.metricUsers.textContent = people;
  els.metricRegions.textContent = regions;
  els.metricMap.textContent = located;
}

function renderMap(points) {
  els.mapOverlay.innerHTML = "";
  const locatedPoints = points.filter(hasMapPosition);
  const visiblePositions = getSpreadMapPositions(locatedPoints);

  renderRegionAreas(locatedPoints);

  for (const point of locatedPoints) {
    const position = visiblePositions.get(String(point.id)) || stableMapPositions.get(String(point.id)) || getSingleMapPosition(point);
    if (!position) continue;

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `mapMarker ${point.role === "COORDENADORES" || point.role === "LIDERES" ? "leaderMarker" : "personMarker"}${String(point.id) === String(selectedPointId) ? " selectedMapMarker" : ""}`;
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.title = `${point.localidade || point.regiao_administrativa || "Sem localidade"} - ${point.name}`;
    marker.setAttribute("aria-label", marker.title);
    marker.dataset.pointId = point.id;
    marker.innerHTML = `
      <span class="mapMarkerPin" aria-hidden="true">
        ${point.photo_url
          ? `<img class="mapMarkerPhoto" src="${escapeHtml(point.photo_url)}" alt="" aria-hidden="true" />`
          : `<span class="mapPersonIcon" aria-hidden="true"></span>`}
      </span>
    `;
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
    const located = group.items.filter(hasMapPosition);
    if (!located.length) continue;

    const lat = average(located.map((point) => getPointPosition(point).latitude));
    const lng = average(located.map((point) => getPointPosition(point).longitude));
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
  selectedPointId = point.id;
  focusedMapPointId = point.id;
  focusMapOnPointLocation(point);

  render();

  const locationLabel = point.localidade || point.regiao_administrativa || "Sem localidade";
  const registeredBy = getRegisteredByLabel(point);
  const rootLeader = point.root_leader_name || findPointName(point.root_leader_id) || "Nao informado";
  const lineage = getLineage(point);
  const descendants = getDescendants(point.id);

  els.selected.innerHTML = `
    <div class="selectedPointHeader">
      <div>
        <strong>${escapeHtml(point.name || "Nao informado")}</strong>
        <span>${escapeHtml(point.role)} - nivel ${point.level ?? "-"}</span>
      </div>
      ${isTeam ? `<a href="/cadastro-detalhe.html?id=${encodeURIComponent(point.id)}">Abrir cadastro</a>` : ""}
    </div>
    <div class="selectedPointGrid">
      <span><b>Regiao adm.</b>${escapeHtml(point.regiao_administrativa || "Sem regiao")}</span>
      <span><b>Localidade</b>${escapeHtml(locationLabel)}</span>
      <span><b>Por quem cadastrou</b>${escapeHtml(registeredBy)}</span>
      <span><b>Responsavel raiz</b>${escapeHtml(rootLeader)}</span>
      <span><b>Cadastro</b>${formatDate(point.created_at)}</span>
      <span><b>Pessoas abaixo</b>${descendants.length}</span>
    </div>
    <div class="selectedTreeBlock">
      <h3>Arvore da pessoa</h3>
      ${renderSelectedLineage(lineage)}
      ${renderSelectedDescendants(point, descendants)}
    </div>
  `;
}

function updateSelectedMarkerState() {
  els.mapOverlay.querySelectorAll(".mapMarker").forEach((marker) => {
    marker.classList.toggle("selectedMapMarker", String(marker.dataset.pointId) === String(selectedPointId));
  });
}

function focusMapOnPointLocation(point) {
  const region = point.regiao_administrativa || "";
  const localidade = point.localidade || "";

  const query = [localidade, region, "Distrito Federal", "Brasil"].filter(Boolean).join(", ");
  setMapFrameQuery(query || "Distrito Federal, Brasil", localidade ? 14 : 12);
}

function setMapFrameQuery(query, zoom) {
  if (!els.mapFrame) return;
  els.mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&t=k&z=${zoom}&output=embed`;
}

function resetMapFrame() {
  focusedMapPointId = "";
  setMapFrameQuery("Distrito Federal, Brasil", 10);
}

function getRegisteredByLabel(point) {
  if (!point.parent_user_id) return "Cadastro raiz";
  return point.parent_user_name || findPointName(point.parent_user_id) || "Nao informado";
}

function findPointName(id) {
  if (!id) return "";
  return allPoints.find((item) => String(item.id) === String(id))?.name || "";
}

function getLineage(point) {
  const lineage = [];
  const visited = new Set();
  let current = point;

  while (current && !visited.has(String(current.id))) {
    visited.add(String(current.id));
    lineage.unshift(current);
    current = allPoints.find((item) => String(item.id) === String(current.parent_user_id));
  }

  return lineage;
}

function getDescendants(id) {
  const descendants = [];
  const queue = allPoints.filter((point) => String(point.parent_user_id) === String(id));
  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(String(current.id))) continue;
    visited.add(String(current.id));
    descendants.push(current);
    queue.push(...allPoints.filter((point) => String(point.parent_user_id) === String(current.id)));
  }

  return descendants.sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
}

function renderSelectedLineage(lineage) {
  if (!lineage.length) return "";
  return `
    <div class="selectedTreePath">
      ${lineage.map((item) => `<span>${escapeHtml(item.name || "Sem nome")}</span>`).join("")}
    </div>
  `;
}

function renderSelectedDescendants(point, descendants) {
  if (!descendants.length) {
    return `<div class="emptyState">Nenhuma pessoa cadastrada abaixo de ${escapeHtml(point.name || "este cadastro")}.</div>`;
  }

  return `
    <div class="selectedTreeList">
      ${descendants.map((item) => `
        <div>
          <strong>${escapeHtml(item.name || "Sem nome")}</strong>
          <span>${escapeHtml(item.regiao_administrativa || "Sem regiao")} - cadastrado por ${escapeHtml(getRegisteredByLabel(item))}</span>
        </div>
      `).join("")}
    </div>
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
  const people = allPoints
    .filter((point) => !region || point.regiao_administrativa === region)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  if (!people.length) {
    els.regionLeaders.innerHTML = `<div class="emptyState">Clique em uma regiao para ver os cadastros.</div>`;
    return;
  }

  els.regionLeaders.innerHTML = people
    .map((person) => {
      const total = allPoints.filter((point) => point.root_leader_id === person.id || point.id === person.id).length;
      const isResponsible = isLeaderRole(person.role);
      const active = selectedPointId === person.id ? " activeSummary" : "";
      return `
        <button class="summaryRow summaryButton${active}" type="button" data-person-id="${escapeHtml(person.id)}">
          <div>
            <strong>${escapeHtml(person.name)}</strong>
            <span>${escapeHtml(person.role || "-")} - ${escapeHtml(person.localidade || person.regiao_administrativa || "-")}</span>
          </div>
          <div class="summaryBar"><i style="width:${isResponsible ? "100" : "35"}%"></i></div>
          ${isResponsible ? `<small>${total} cadastro${total === 1 ? "" : "s"} na rede</small>` : ""}
        </button>
      `;
    })
    .join("");

  els.regionLeaders.querySelectorAll("[data-person-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const person = allPoints.find((point) => String(point.id) === String(button.dataset.personId));
      if (!person) return;
      selectPoint(person);
    });
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
          <td>${escapeHtml(getRegisteredByLabel(point))}</td>
          ${isTeam ? `<td>${renderReferralCell(point)}</td>` : ""}
          <td>${point.level ?? "-"}</td>
          <td>${formatDate(point.created_at)}</td>
          ${isTeam ? `
            <td>
              <div class="tableActions">
                <button type="button" class="btnTiny" data-action="edit" data-id="${escapeHtml(point.id)}">Editar</button>
                <button type="button" class="btnTiny btnTinyDanger" data-action="delete" data-id="${escapeHtml(point.id)}">Excluir</button>
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
  hideCreatedSummary();
  const formData = new FormData(els.adminForm);
  const body = Object.fromEntries(formData.entries());
  body.consent_accepted = true;
  if (!canRoleLogin(body.role)) delete body.password;
  const photoFile = formData.get("photo");
  let photoPreviewUrl = "";
  delete body.photo;

  try {
    if (photoFile && photoFile.size) {
      photoPreviewUrl = URL.createObjectURL(photoFile);
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
    const createdUser = {
      ...data.user,
      localidade: body.localidade,
      regiao_administrativa: body.regiao_administrativa,
      photo_url: body.photoUrl,
    };
    els.adminForm.reset();
    document.getElementById("adminRegiao")?.dispatchEvent(new Event("change"));
    const generatedLink = data.leaderProfile?.referral_url || "";
    renderCreatedSummary(createdUser, data.leaderProfile, photoPreviewUrl || body.photoUrl);
    showAdminMessage(generatedLink ? `Cadastro adicionado. Link gerado: ${generatedLink}` : "Cadastro adicionado.", "ok");
    allPoints = await loadMapPoints();
    stableMapPositions = buildStableMapPositions(allPoints);
    fillFilters(allPoints);
    render();
  } catch (error) {
    showAdminMessage(`Erro: ${error.message || error}`, "err");
  }
}

function hideCreatedSummary() {
  if (!els.adminCreatedSummary) return;
  els.adminCreatedSummary.hidden = true;
  els.adminCreatedSummary.innerHTML = "";
}

function renderCreatedSummary(createdUser, leaderProfile, photoUrl = "") {
  if (!els.adminCreatedSummary || !createdUser) return;
  const link = leaderProfile?.referral_url || getPublicReferralUrl({ ...createdUser, ...leaderProfile });
  const code = leaderProfile?.referral_code || createdUser.referral_code || "-";
  const displayPhoto = photoUrl || createdUser.photo_url || "img/LOGO-SIV.png";

  els.adminCreatedSummary.hidden = false;
  els.adminCreatedSummary.innerHTML = `
    <div class="createdSummaryHeader">
      <div>
        <span>Cadastro confirmado</span>
        <h3>${escapeHtml(createdUser.name || "-")}</h3>
      </div>
      <span class="rolePill ${createdUser.role === "COORDENADORES" || createdUser.role === "LIDERES" ? "roleLeader" : "rolePerson"}">${escapeHtml(createdUser.role || "-")}</span>
    </div>
    <div class="createdSummaryBody">
      <img class="createdSummaryPhoto" src="${escapeHtml(displayPhoto)}" alt="Foto de ${escapeHtml(createdUser.name || "cadastro")}" />
      <div class="createdSummaryGrid">
        ${createdSummaryItem("Nome", createdUser.name)}
        ${createdSummaryItem("Email", createdUser.email)}
        ${createdSummaryItem("Telefone", createdUser.phone)}
        ${createdSummaryItem("Localidade", createdUser.localidade || "Brasilia")}
        ${createdSummaryItem("Regiao administrativa", createdUser.regiao_administrativa)}
        ${createdSummaryItem("Codigo de cadastro", code)}
      </div>
    </div>
    <div class="createdSummaryInvite">
      <label for="createdReferralLink">Link para enviar</label>
      <div class="inviteRow">
        <input id="createdReferralLink" readonly value="${escapeHtml(link)}" />
        <button type="button" class="btnSecondary" data-copy-created-link>Copiar</button>
      </div>
    </div>
  `;

  els.adminCreatedSummary.querySelector("[data-copy-created-link]")?.addEventListener("click", async () => {
    await copyText(link);
    showAdminMessage("Link copiado.", "ok");
  });
}

function createdSummaryItem(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "-")}</strong>
    </div>
  `;
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
      if (!confirm(`Excluir o cadastro de ${person.name}? Esta acao remove o cadastro do banco.`)) return;
      await deletePerson(id);
      showAdminMessage("Cadastro excluido do banco.", "ok");
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
  els.editForm.dataset.editingId = person.id || "";
  els.editTitle.textContent = self ? "Editar minhas informacoes" : `Editar ${person.name || "cadastro"}`;
  setEditValue("editId", person.id || "");
  setEditValue("editName", person.name || "");
  setEditValue("editEmail", person.email || "");
  setEditValue("editPhone", person.phone || "");
  setEditValue("editRole", person.role || "CADASTRADOS");
  setEditValue("editRegiao", person.regiao_administrativa || "");
  fillLocalidadeSelect(document.getElementById("editLocalidade"), person.regiao_administrativa || "", person.localidade || "");
  setEditValue("editPassword", "");
  updateEditLoginFields();
  const active = document.getElementById("editActive");
  if (active) active.checked = person.active !== false;
  const role = document.getElementById("editRole");
  const activeBlock = active?.closest(".editActive");
  if (role) role.disabled = self && !isTeam;
  if (active) active.disabled = self && !isTeam;
  if (activeBlock) activeBlock.classList.toggle("isDisabled", self && !isTeam);
  if (els.deleteEdit) els.deleteEdit.hidden = self || !isTeam;
  const photo = document.getElementById("editPhoto");
  if (photo) photo.value = "";
  showEditMessage("", "");
  els.editDialog.showModal();
}

function setEditValue(id, value) {
  const field = document.getElementById(id);
  if (!field) return;
  field.value = value;
  field.dispatchEvent(new Event("change"));
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

  const options = Array.from(select.options).filter((option) => !option.disabled && option.value !== "");
  for (const option of options) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "downSelectOption";
    item.setAttribute("role", "option");
    item.dataset.value = option.value || option.textContent;
    item.textContent = option.textContent;
    item.addEventListener("click", () => {
      select.value = item.dataset.value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      closeDownSelect(wrapper, button);
    });
    menu.appendChild(item);
  }

  select.parentNode.insertBefore(wrapper, select.nextSibling);
  wrapper.append(button, menu);

  button.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    updateDownSelect(select, wrapper, button);
  });

  select.addEventListener("change", () => updateDownSelect(select, wrapper, button));
  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target) && event.target !== select) closeDownSelect(wrapper, button);
  });

  updateDownSelect(select, wrapper, button);
}

function updateDownSelect(select, wrapper, button) {
  const selected = Array.from(select.options).find((option) => option.value === select.value);
  button.textContent = selected?.textContent || "Selecione a RA";
  wrapper.querySelectorAll(".downSelectOption").forEach((item) => {
    const active = item.dataset.value === select.value;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });
}

function closeDownSelect(wrapper, button) {
  wrapper.classList.remove("open");
  button.setAttribute("aria-expanded", "false");
}

function closeEditDialog() {
  els.editDialog?.close();
}

async function deleteFromEditDialog() {
  const id = els.editForm?.dataset.editingId || document.getElementById("editId")?.value;
  if (!id || String(id) === String(user.id)) return;

  const person = allPoints.find((point) => String(point.id) === String(id));
  if (!person) return;

  if (!confirm(`Excluir o cadastro de ${person.name}? Esta acao remove o cadastro do banco.`)) return;

  try {
    await deletePerson(id);
    closeEditDialog();
    showAdminMessage("Cadastro excluido do banco.", "ok");
  } catch (error) {
    showEditMessage(`Erro: ${error.message || error}`, "err");
  }
}

async function deletePerson(id) {
  await adminRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  allPoints = allPoints.filter((point) => String(point.id) !== String(id));
  stableMapPositions = buildStableMapPositions(allPoints);
  if (String(selectedPointId) === String(id)) selectedPointId = "";
  if (String(selectedLeaderId) === String(id)) {
    selectedLeaderId = "";
    els.leader.value = "";
  }
  fillFilters(allPoints);
  render();
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
    stableMapPositions = buildStableMapPositions(allPoints);
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

async function exportPeopleByName() {
  const points = await getPeopleForExport();
  if (!points) return;
  const matches = getPeopleMatchingExportSearch(points);
  const search = (els.exportLeaderSearch?.value || "").trim();
  if (!matches.length) {
    notifyExport(search ? "Nenhum cadastro disponivel com esse nome." : "Nenhum cadastro disponivel para exportar.", "err");
    return;
  }
  exportPeopleCsv(matches, search ? `cadastros-${slugify(search)}` : "lista-geral-cadastros");
}

async function getPeopleForExport() {
  if (!isTeam || token === "local-test-token") return allPoints;

  try {
    const items = [];
    let page = 1;
    let total = Infinity;
    while (items.length < total) {
      const response = await fetch(`/api/admin/users?limit=200&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel carregar todos os cadastros.");
      items.push(...(data.items || []));
      total = Number(data.total || items.length);
      if (!data.items?.length) break;
      page += 1;
    }
    return items;
  } catch (error) {
    notifyExport(`Erro ao carregar exportacao completa: ${error.message || error}`, "err");
    return null;
  }
}

function getPeopleMatchingExportSearch(points = allPoints) {
  const search = normalizeLocalidadeKey(els.exportLeaderSearch?.value || "");
  if (!search) return [...points].sort(sortPeopleByName);
  return points
    .filter((point) => normalizeLocalidadeKey(point.name).includes(search))
    .sort(sortPeopleByName);
}

function sortPeopleByName(a, b) {
  return String(a.name || "").localeCompare(String(b.name || ""));
}

function exportPeopleCsv(points, baseName) {
  if (!points.length) {
    notifyExport("Nenhum cadastro encontrado para exportar.", "err");
    return;
  }

  const columns = [
    ["Nome", "name"],
    ["Tipo", "role"],
    ["Email", "email"],
    ["Telefone", "phone"],
    ["Localidade", "localidade"],
    ["Regiao administrativa", "regiao_administrativa"],
    ["Responsavel raiz", "root_leader_name"],
    ["Cadastrado por", (point) => getRegisteredByLabel(point)],
    ["Nivel", "level"],
    ["Data do cadastro", (point) => formatDate(point.created_at)],
    ["Codigo do link", "referral_code"],
    ["Link de cadastro", (point) => getPublicReferralUrl(point)],
  ];

  const csv = [
    columns.map(([label]) => csvEscape(label)).join(";"),
    ...points.map((point) => columns
      .map(([, accessor]) => csvEscape(typeof accessor === "function" ? accessor(point) : point[accessor]))
      .join(";")),
  ].join("\r\n");

  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${baseName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  notifyExport(`${points.length} cadastro${points.length === 1 ? "" : "s"} exportado${points.length === 1 ? "" : "s"}.`, "ok");
}

function notifyExport(message, type) {
  if (els.exportStatus) {
    els.exportStatus.textContent = message;
    els.exportStatus.hidden = false;
    els.exportStatus.className = `sideMenuStatus ${type === "err" ? "err" : "ok"}`;
    window.clearTimeout(els.exportStatus.dataset.timer);
    const timer = window.setTimeout(() => {
      els.exportStatus.hidden = true;
      els.exportStatus.textContent = "";
    }, 4200);
    els.exportStatus.dataset.timer = String(timer);
  }
  if (els.adminMsg) showAdminMessage(message, type);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function slugify(value) {
  return String(value || "exportacao")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "exportacao";
}

function isLeaderRole(role) {
  return role === "COORDENADORES" || role === "LIDERES";
}

function renderReferralCell(point) {
  const link = getPublicReferralUrl(point);
  if (!link) return "-";
  return `<small>${escapeHtml(point.referral_code || "")}</small><span class="linkCell">${escapeHtml(link)}</span>`;
}

function getPublicReferralUrl(point, targetRole = "") {
  const code = point.referral_code || point.referralCode || extractReferralCode(point.referral_url || point.referralUrl);
  if (!code) return "";

  const currentOrigin = window.location.origin && !window.location.hostname.includes("localhost")
    ? window.location.origin
    : PUBLIC_APP_URL;
  const url = new URL(`${currentOrigin.replace(/\/$/, "")}/`);
  url.searchParams.set("ref", code);
  if (point.role === "EQUIPE" && ["COORDENADORES", "LIDERES", "CADASTRADOS"].includes(targetRole)) {
    url.searchParams.set("tipo", targetRole);
  }
  return url.toString();
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
    contactMessages = data.items || [];
    updateMessageBadge(contactMessages);
    renderContactMessages(contactMessages);
  } catch (error) {
    els.messagesList.innerHTML = `<div class="emptyState">Erro ao carregar mensagens: ${escapeHtml(error.message || error)}</div>`;
  }
}

function updateMessageBadge(messages) {
  const pending = messages.filter(isPendingMessage).length;
  if (els.sideMessageBadge) {
    els.sideMessageBadge.textContent = pending > 99 ? "99+" : String(pending);
    els.sideMessageBadge.hidden = pending <= 0;
  }
  if (els.homePendingMessages) els.homePendingMessages.textContent = String(pending);
  els.homeMessageAlert?.classList.toggle("hasPending", pending > 0);
}

function renderContactMessages(messages) {
  updateMessageStatusFilters(messages);
  const filteredMessages = filterContactMessages(messages);
  if (!filteredMessages.length) {
    els.messagesList.innerHTML = `<div class="emptyState">Nenhuma mensagem neste filtro.</div>`;
    return;
  }

  els.messagesList.innerHTML = filteredMessages.map((message) => `
    <article class="messageItem" data-message-id="${escapeHtml(message.id)}">
      <div class="messageHeader">
        <div>
          <strong>${escapeHtml(message.user_name || message.name)}</strong>
          <span>${escapeHtml(getMessageStatusLabel(message))} - ${formatDate(message.created_at)}</span>
        </div>
        <div class="messageActions">
          ${message.status !== "RESOLVIDO" ? `<button type="button" class="btnTiny" data-action="resolve-message" data-id="${escapeHtml(message.id)}">Resolvido</button>` : ""}
          <button type="button" class="btnTiny btnTinyDanger" data-action="delete-message" data-id="${escapeHtml(message.id)}">Excluir</button>
        </div>
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
        <div class="messageActions">
          <button type="button" class="btnTiny" data-action="reply-message" data-id="${escapeHtml(message.id)}">Salvar resposta</button>
        </div>
      `}
    </article>
  `).join("");

  els.messagesList.querySelectorAll('[data-action="reply-message"]').forEach((button) => {
    button.addEventListener("click", () => replyContactMessage(button.dataset.id));
  });
  els.messagesList.querySelectorAll('[data-action="resolve-message"]').forEach((button) => {
    button.addEventListener("click", () => updateContactMessageStatus(button.dataset.id, "RESOLVIDO"));
  });
  els.messagesList.querySelectorAll('[data-action="delete-message"]').forEach((button) => {
    button.addEventListener("click", () => deleteContactMessage(button.dataset.id));
  });
}

function updateMessageStatusFilters(messages) {
  const counts = {
    pending: messages.filter(isPendingMessage).length,
    answered: messages.filter((message) => message.status === "RESPONDIDO").length,
    resolved: messages.filter((message) => message.status === "RESOLVIDO").length,
  };

  els.messageStatusFilters?.querySelectorAll("[data-message-filter]").forEach((button) => {
    const filter = button.dataset.messageFilter || "pending";
    button.classList.toggle("active", filter === activeMessageFilter);
    const counter = button.querySelector("span");
    if (counter) counter.textContent = String(counts[filter] ?? 0);
  });
}

function filterContactMessages(messages) {
  if (activeMessageFilter === "answered") return messages.filter((message) => message.status === "RESPONDIDO");
  if (activeMessageFilter === "resolved") return messages.filter((message) => message.status === "RESOLVIDO");
  return messages.filter(isPendingMessage);
}

function isPendingMessage(message) {
  return message.status !== "RESPONDIDO" && message.status !== "RESOLVIDO";
}

function getMessageStatusLabel(message) {
  if (message.status === "RESPONDIDO") return "Respondido";
  if (message.status === "RESOLVIDO") return "Resolvido";
  return "Pra responder";
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

async function updateContactMessageStatus(id, status) {
  try {
    const response = await fetch(`/api/contact/messages/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel atualizar a mensagem.");
    showAdminMessage("Mensagem atualizada.", "ok");
    await loadContactMessages();
  } catch (error) {
    showAdminMessage(`Erro: ${error.message || error}`, "err");
  }
}

async function deleteContactMessage(id) {
  if (!confirm("Excluir esta mensagem?")) return;
  try {
    const response = await fetch(`/api/contact/messages/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Nao foi possivel excluir a mensagem.");
    showAdminMessage("Mensagem excluida.", "ok");
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
  selectedPointId = "";
  resetMapFrame();

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

function hasMapPosition(point) {
  return Boolean(getPointPosition(point));
}

function getPointPosition(point) {
  if (hasLocation(point)) {
    return {
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
    };
  }

  return getLocalidadeCoords(point.localidade, point.regiao_administrativa)
    || getEstimatedLocalidadeCoords(point.localidade, point.regiao_administrativa)
    || getRegionCoords(point.regiao_administrativa || point.localidade);
}

function getSpreadMapPositions(points) {
  const positions = new Map();
  const groups = groupBy(points, getMapPositionKey);

  for (const group of groups) {
    const sorted = [...group.items].sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));

    sorted.forEach((point, index) => {
      const base = getPointPosition(point);
      const baseX = lngToX(base.longitude);
      const baseY = latToY(base.latitude);
      const offset = getVisualMarkerOffset(index, sorted.length);

      positions.set(String(point.id), {
        x: clamp(baseX + offset.x, MAP_POSITION_PADDING.minX, MAP_POSITION_PADDING.maxX),
        y: clamp(baseY + offset.y, MAP_POSITION_PADDING.minY, MAP_POSITION_PADDING.maxY),
      });
    });
  }

  return positions;
}

function buildStableMapPositions(points) {
  return getSpreadMapPositions(points.filter(hasMapPosition));
}

function getSingleMapPosition(point) {
  const position = getPointPosition(point);
  if (!position) return null;
  return {
    x: lngToX(position.longitude),
    y: latToY(position.latitude),
  };
}

function getFocusedRegionMapPositions(points) {
  const positions = new Map();
  const sorted = [...points].sort((a, b) => {
    if (String(a.id) === String(focusedMapPointId)) return -1;
    if (String(b.id) === String(focusedMapPointId)) return 1;
    return String(a.name || a.id).localeCompare(String(b.name || b.id));
  });

  sorted.forEach((point, index) => {
    if (String(point.id) === String(focusedMapPointId)) {
      positions.set(String(point.id), { x: 50, y: 50 });
      return;
    }

    const offset = getVisualMarkerOffset(index, sorted.length);
    positions.set(String(point.id), {
      x: clamp(50 + offset.x * 1.35, 12, 88),
      y: clamp(50 + offset.y * 1.35, 12, 88),
    });
  });

  return positions;
}

function getMapPositionKey(point) {
  if (hasLocation(point)) {
    const position = getPointPosition(point);
    return `coords:${position.latitude.toFixed(3)}:${position.longitude.toFixed(3)}`;
  }

  const position = getPointPosition(point);
  if (position) {
    return `fallback:${normalizeRegion(point.localidade || point.regiao_administrativa)}:${position.latitude.toFixed(3)}:${position.longitude.toFixed(3)}`;
  }

  return `region:${normalizeRegion(point.regiao_administrativa || point.localidade)}`;
}

function getVisualMarkerOffset(index, total) {
  if (total <= 1) return { x: 0, y: 0 };

  if (total <= 8) {
    const angle = ((index / total) * 360 - 90) * (Math.PI / 180);
    const radius = total <= 3 ? 3.1 : 4.3;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  }

  const ringIndex = Math.floor(index / 8);
  const positionInRing = index % 8;
  const angle = ((positionInRing / 8) * 360 + ringIndex * 22.5 - 90) * (Math.PI / 180);
  const radius = 3.6 + ringIndex * 2.4;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function getRegionCoords(region) {
  const key = normalizeRegion(region);
  return REGION_COORDS[key] || null;
}

function getLocalidadeCoords(localidade, regiao) {
  const key = normalizeRegion(localidade);
  const scopedKey = regiao ? `${key}|${normalizeRegion(regiao)}` : "";
  return LOCALIDADE_COORDS[scopedKey] || LOCALIDADE_COORDS[key] || null;
}

function getEstimatedLocalidadeCoords(localidade, regiao) {
  if (!localidade || !regiao) return null;
  const base = getRegionCoords(regiao);
  if (!base) return null;

  const hash = hashString(`${regiao}:${localidade}`);
  const angle = (hash % 360) * (Math.PI / 180);
  const distance = 0.008 + ((hash % 9) * 0.002);
  return {
    latitude: clamp(base.latitude + Math.sin(angle) * distance, DF_BOUNDS.minLat, DF_BOUNDS.maxLat),
    longitude: clamp(base.longitude + Math.cos(angle) * distance, DF_BOUNDS.minLng, DF_BOUNDS.maxLng),
  };
}

function hashString(value) {
  let hash = 0;
  for (const char of normalizeRegion(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function normalizeRegion(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function lngToX(lng) {
  const ratio = (Number(lng) - DF_BOUNDS.minLng) / (DF_BOUNDS.maxLng - DF_BOUNDS.minLng);
  const value = MAP_POSITION_PADDING.minX + ratio * (MAP_POSITION_PADDING.maxX - MAP_POSITION_PADDING.minX);
  return clamp(value, MAP_POSITION_PADDING.minX, MAP_POSITION_PADDING.maxX);
}

function latToY(lat) {
  const ratio = (DF_BOUNDS.maxLat - Number(lat)) / (DF_BOUNDS.maxLat - DF_BOUNDS.minLat);
  const value = MAP_POSITION_PADDING.minY + ratio * (MAP_POSITION_PADDING.maxY - MAP_POSITION_PADDING.minY);
  return clamp(value, MAP_POSITION_PADDING.minY, MAP_POSITION_PADDING.maxY);
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
