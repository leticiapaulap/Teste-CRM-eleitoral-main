const token = localStorage.getItem("siv_token");
const user = JSON.parse(localStorage.getItem("siv_user") || "null");

if (!token || !user) {
  window.location.href = "/login.html";
}

const DF_BOUNDS = {
  minLat: -16.08,
  maxLat: -15.45,
  minLng: -48.32,
  maxLng: -47.28,
};

const fallbackPoints = [
  {
    id: "l1",
    name: "Maria Souza",
    role: "LIDER",
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
    role: "PESSOA",
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
    role: "PESSOA",
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
    role: "LIDER",
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
    role: "PESSOA",
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
    role: "LIDER",
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
    role: "PESSOA",
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
    role: "PESSOA",
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
    role: "PESSOA",
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
    role: "PESSOA",
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

const els = {
  userLabel: document.getElementById("dashboardUser"),
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

init();

async function init() {
  allPoints = await loadMapPoints();

  if (user.role === "LIDER") {
    allPoints = allPoints.filter((point) => point.root_leader_id === user.id || token === "local-test-token");
  }

  fillFilters(allPoints);
  render();
}

async function loadMapPoints() {
  if (token === "local-test-token") return fallbackPoints;

  try {
    const response = await fetch("/api/map/network", {
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
    points.filter((point) => point.role === "LIDER"),
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
  const leaders = points.filter((point) => point.role === "LIDER").length;
  const people = points.filter((point) => point.role === "PESSOA").length;
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
    marker.className = `mapMarker ${point.role === "LIDER" ? "leaderMarker" : "personMarker"}`;
    marker.style.left = `${lngToX(point.longitude)}%`;
    marker.style.top = `${latToY(point.latitude)}%`;
    marker.title = `${point.name} - ${point.regiao_administrativa}`;
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
    const leaders = located.filter((point) => point.role === "LIDER").length;
    const people = located.filter((point) => point.role === "PESSOA").length;

    const area = document.createElement("button");
    area.type = "button";
    area.className = `regionArea${selectedRegion === group.label ? " activeRegionArea" : ""}`;
    area.style.left = `${lngToX(lng)}%`;
    area.style.top = `${latToY(lat)}%`;
    area.style.width = `${Math.max(70, Math.min(150, located.length * 26))}px`;
    area.style.height = area.style.width;
    area.title = `${group.label}: ${leaders} lider(es), ${people} pessoa(s)`;
    area.setAttribute("aria-label", area.title);
    area.addEventListener("click", () => selectRegion(group.label));
    els.mapOverlay.appendChild(area);
  }
}

function selectPoint(point) {
  if (point.role === "LIDER") {
    selectedLeaderId = point.id;
    els.leader.value = point.id;
    render();
  }

  els.selected.innerHTML = `
    <strong>${escapeHtml(point.name)}</strong>
    <span>${escapeHtml(point.role)} - ${escapeHtml(point.regiao_administrativa || "Sem regiao")}</span>
    <span>${escapeHtml(point.localidade || "Sem localidade")} | Nivel ${point.level ?? "-"}</span>
    <span>Lider: ${escapeHtml(point.root_leader_name || "Nao informado")}</span>
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
    (point) => point.role === "LIDER" && (!region || point.regiao_administrativa === region)
  );

  if (!leaders.length) {
    els.regionLeaders.innerHTML = `<div class="emptyState">Clique em uma regiao para ver os lideres.</div>`;
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
    els.leaderNetwork.innerHTML = `<div class="emptyState">Selecione um lider para ver a rede dele.</div>`;
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
    els.table.innerHTML = `<tr><td colspan="6">Nenhum cadastro encontrado.</td></tr>`;
    return;
  }

  els.table.innerHTML = points
    .map(
      (point) => `
        <tr>
          <td><strong>${escapeHtml(point.name)}</strong></td>
          <td><span class="rolePill ${point.role === "LIDER" ? "roleLeader" : "rolePerson"}">${escapeHtml(point.role)}</span></td>
          <td>${escapeHtml(point.localidade || "-")}<small>${escapeHtml(point.regiao_administrativa || "")}</small></td>
          <td>${escapeHtml(point.root_leader_name || "-")}</td>
          <td>${point.level ?? "-"}</td>
          <td>${formatDate(point.created_at)}</td>
        </tr>
      `
    )
    .join("");
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
