const defaultConfig = {
  apiTarget: "render",
  apiBaseUrls: {
    render: {
      gestao: "https://api-de-gerenciamento-escolar.onrender.com",
      reserva: "https://api-de-reserva-de-salas.onrender.com",
      atividade: "https://atividade-microservice-api-escolar.onrender.com",
    },
    local: {
      gestao: "http://127.0.0.1:5000",
      reserva: "http://127.0.0.1:5001",
      atividade: "http://127.0.0.1:5002",
    },
  },
};

const state = {
  target: localStorage.getItem("apiTarget") || window.APP_CONFIG?.apiTarget || defaultConfig.apiTarget,
  professores: [],
  turmas: [],
  alunos: [],
  reservas: [],
  atividades: [],
  query: "",
  loading: false,
};

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function resolveConfig(target = state.target, userConfig = window.APP_CONFIG || {}) {
  const apiBaseUrls = {
    ...defaultConfig.apiBaseUrls,
    ...(userConfig.apiBaseUrls || {}),
  };
  const selectedUrls = apiBaseUrls[target] || apiBaseUrls.render;

  return {
    target,
    gestaoApiUrl: trimTrailingSlash(userConfig.gestaoApiUrl || selectedUrls.gestao),
    reservaApiUrl: trimTrailingSlash(userConfig.reservaApiUrl || selectedUrls.reserva),
    atividadeApiUrl: trimTrailingSlash(userConfig.atividadeApiUrl || selectedUrls.atividade),
  };
}

let config = resolveConfig();
let endpoints = buildEndpoints(config);

function buildEndpoints(activeConfig) {
  return {
    professores: `${activeConfig.gestaoApiUrl}/api/professores`,
    turmas: `${activeConfig.gestaoApiUrl}/api/turma`,
    alunos: `${activeConfig.gestaoApiUrl}/api/alunos`,
    reservas: `${activeConfig.reservaApiUrl}/reservas`,
    atividades: `${activeConfig.atividadeApiUrl}/atividades`,
  };
}

const deleteConfig = {
  professores: {
    label: "professor",
    url: (id) => `${endpoints.professores}/${id}`,
    message: "gestaoMessage",
  },
  turmas: {
    label: "turma",
    url: (id) => `${endpoints.turmas}/${id}`,
    message: "gestaoMessage",
  },
  alunos: {
    label: "aluno",
    url: (id) => `${endpoints.alunos}/${id}`,
    message: "gestaoMessage",
  },
  reservas: {
    label: "reserva",
    url: (id) => `${endpoints.reservas}/${id}`,
    message: "reservaMessage",
  },
  atividades: {
    label: "atividade",
    url: (id) => `${endpoints.atividades}/${id}`,
    message: "atividadeMessage",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesQuery(row) {
  if (!state.query) return true;
  return normalize(Object.values(row).join(" ")).includes(normalize(state.query));
}

function filtered(rows) {
  return rows.filter(matchesQuery);
}

function setStatus(service, ok, text) {
  const dot = document.getElementById(`${service}Dot`);
  const label = document.getElementById(`${service}Status`);
  dot.classList.toggle("ok", ok);
  dot.classList.toggle("bad", !ok);
  label.textContent = text;
}

function showToast(text, ok = true) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.className = `toast show ${ok ? "ok" : "bad"}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function showMessage(id, ok, text) {
  const element = document.getElementById(id);
  element.textContent = text;
  element.classList.toggle("ok", ok);
  element.classList.toggle("bad", !ok);
  if (text) showToast(text, ok);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.erro || data?.mensagem || `Erro ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function formDataToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const numberFields = [
    "turma_id",
    "professor_id",
    "id_professor",
    "idade",
    "nota",
    "nota_primeiro_semestre",
    "nota_segundo_semestre",
  ];

  for (const key of Object.keys(data)) {
    if (numberFields.includes(key) && data[key] !== "") {
      data[key] = Number(data[key]);
    }
  }
  return data;
}

function optionList(rows, labelKey = "nome") {
  if (!rows.length) return '<option value="">Cadastre dados primeiro</option>';
  return rows
    .map((row) => `<option value="${escapeHtml(row.id)}">#${escapeHtml(row.id)} - ${escapeHtml(row[labelKey])}</option>`)
    .join("");
}

function fillSelects() {
  document.querySelectorAll('select[name="professor_id"], select[name="id_professor"]').forEach((select) => {
    select.innerHTML = optionList(state.professores);
  });
  document.querySelectorAll('select[name="turma_id"]').forEach((select) => {
    select.innerHTML = optionList(state.turmas);
  });
}

function table(rows, columns, actionsType = null) {
  const visibleRows = filtered(rows);
  if (!visibleRows.length) {
    return `<p class="empty">${rows.length ? "Nenhum registro combina com a busca." : "Nenhum registro encontrado."}</p>`;
  }

  const actionHead = actionsType ? "<th>Acoes</th>" : "";
  const head = columns.map((column) => `<th>${column.label}</th>`).join("") + actionHead;
  const body = visibleRows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${column.render ? column.render(row) : escapeHtml(row[column.key])}</td>`)
        .join("");
      const actions = actionsType
        ? `<td><button class="button danger small" data-delete-type="${actionsType}" data-delete-id="${escapeHtml(row.id)}" type="button">Excluir</button></td>`
        : "";
      return `<tr>${cells}${actions}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function professorName(id) {
  return state.professores.find((professor) => Number(professor.id) === Number(id))?.nome || `Professor #${id}`;
}

function turmaName(id) {
  return state.turmas.find((turma) => Number(turma.id) === Number(id))?.nome || `Turma #${id}`;
}

function renderEndpoints() {
  document.getElementById("endpointStrip").innerHTML = [
    ["Gestao", config.gestaoApiUrl],
    ["Reservas", config.reservaApiUrl],
    ["Atividades", config.atividadeApiUrl],
  ]
    .map(([label, url]) => `<span><strong>${label}</strong>${escapeHtml(url)}</span>`)
    .join("");
}

function renderInsights() {
  const futureReservas = [...state.reservas].sort((a, b) => `${a.data} ${a.hora_inicio}`.localeCompare(`${b.data} ${b.hora_inicio}`));
  const next = futureReservas[0];
  const notas = state.atividades.map((atividade) => Number(atividade.nota)).filter((nota) => !Number.isNaN(nota));
  const avg = notas.length ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length : 0;
  const activeTurmas = state.turmas.filter((turma) => turma.ativo !== false && turma.ativo !== 0).length;

  document.getElementById("nextReserva").textContent = next
    ? `${turmaName(next.turma_id)} - ${next.sala}`
    : "Sem reservas";
  document.getElementById("avgNota").textContent = avg.toFixed(1);
  document.getElementById("activeTurmas").textContent = activeTurmas;
}

function render() {
  document.getElementById("currentTargetLabel").textContent = config.target === "local" ? "Local" : "Nuvem";
  document.getElementById("environmentSelect").value = config.target;

  document.getElementById("professoresCount").textContent = state.professores.length;
  document.getElementById("turmasCount").textContent = state.turmas.length;
  document.getElementById("alunosCount").textContent = state.alunos.length;
  document.getElementById("reservasCount").textContent = state.reservas.length;
  document.getElementById("atividadesCount").textContent = state.atividades.length;

  document.getElementById("professoresList").innerHTML = table(state.professores, [
    { key: "id", label: "ID" },
    { key: "nome", label: "Nome" },
    { key: "disciplina", label: "Disciplina" },
  ], "professores");

  document.getElementById("turmasList").innerHTML = table(state.turmas, [
    { key: "id", label: "ID" },
    { key: "nome", label: "Nome" },
    { key: "turno", label: "Turno" },
    { key: "professor_id", label: "Professor", render: (row) => escapeHtml(professorName(row.professor_id)) },
    { key: "ativo", label: "Status", render: (row) => row.ativo === false || row.ativo === 0 ? '<span class="badge muted">Inativa</span>' : '<span class="badge ok">Ativa</span>' },
  ], "turmas");

  document.getElementById("alunosList").innerHTML = table(state.alunos, [
    { key: "id", label: "ID" },
    { key: "nome", label: "Nome" },
    { key: "idade", label: "Idade" },
    { key: "turma_id", label: "Turma", render: (row) => escapeHtml(turmaName(row.turma_id)) },
    { key: "media_final", label: "Media", render: (row) => Number(row.media_final ?? 0).toFixed(1) },
  ], "alunos");

  document.getElementById("reservasList").innerHTML = table(state.reservas, [
    { key: "id", label: "ID" },
    { key: "turma_id", label: "Turma", render: (row) => escapeHtml(turmaName(row.turma_id)) },
    { key: "sala", label: "Sala" },
    { key: "data", label: "Data" },
    { key: "hora_inicio", label: "Inicio" },
    { key: "hora_fim", label: "Fim" },
  ], "reservas");

  document.getElementById("atividadesList").innerHTML = table(state.atividades, [
    { key: "id", label: "ID" },
    { key: "id_professor", label: "Professor", render: (row) => escapeHtml(professorName(row.id_professor)) },
    { key: "nome_atividade", label: "Atividade" },
    { key: "nota", label: "Nota", render: (row) => Number(row.nota ?? 0).toFixed(1) },
  ], "atividades");

  renderEndpoints();
  renderInsights();
  fillSelects();
}

async function loadAll() {
  const refreshButton = document.getElementById("refreshAll");
  state.loading = true;
  refreshButton.disabled = true;
  refreshButton.textContent = "Atualizando...";
  renderEndpoints();

  try {
    const [professores, turmas, alunos] = await Promise.all([
      fetchJson(endpoints.professores),
      fetchJson(endpoints.turmas),
      fetchJson(endpoints.alunos),
    ]);
    state.professores = professores;
    state.turmas = turmas;
    state.alunos = alunos;
    setStatus("gestao", true, "online");
  } catch (error) {
    setStatus("gestao", false, error.message);
  }

  try {
    state.reservas = await fetchJson(endpoints.reservas);
    setStatus("reserva", true, "online");
  } catch (error) {
    setStatus("reserva", false, error.message);
  }

  try {
    state.atividades = await fetchJson(endpoints.atividades);
    setStatus("atividade", true, "online");
  } catch (error) {
    setStatus("atividade", false, error.message);
  }

  render();
  state.loading = false;
  refreshButton.disabled = false;
  refreshButton.textContent = "Atualizar";
}

async function submitForm(form, url, messageId, successText) {
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    await fetchJson(url, {
      method: "POST",
      body: JSON.stringify(formDataToObject(form)),
    });
    form.reset();
    showMessage(messageId, true, successText);
    await loadAll();
  } catch (error) {
    showMessage(messageId, false, error.message);
  } finally {
    submitButton.disabled = false;
  }
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

document.getElementById("refreshAll").addEventListener("click", loadAll);

document.getElementById("environmentSelect").addEventListener("change", async (event) => {
  state.target = event.target.value;
  localStorage.setItem("apiTarget", state.target);
  config = resolveConfig(state.target);
  endpoints = buildEndpoints(config);
  showToast(`Ambiente alterado para ${state.target === "local" ? "local" : "nuvem"}.`);
  await loadAll();
});

document.getElementById("globalSearch").addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

document.getElementById("professorForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, endpoints.professores, "gestaoMessage", "Professor criado com sucesso.");
});

document.getElementById("turmaForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, endpoints.turmas, "gestaoMessage", "Turma criada com sucesso.");
});

document.getElementById("alunoForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, endpoints.alunos, "gestaoMessage", "Aluno criado com sucesso.");
});

document.getElementById("reservaForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, endpoints.reservas, "reservaMessage", "Reserva criada com sucesso.");
});

document.getElementById("atividadeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, endpoints.atividades, "atividadeMessage", "Atividade criada com sucesso.");
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-type]");
  if (!button) return;

  const type = button.dataset.deleteType;
  const id = button.dataset.deleteId;
  const configItem = deleteConfig[type];
  if (!configItem || !id) return;

  const confirmed = window.confirm(`Excluir ${configItem.label} #${id}?`);
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Excluindo...";
  try {
    await fetchJson(configItem.url(id), { method: "DELETE" });
    showMessage(configItem.message, true, `${configItem.label} removido com sucesso.`);
    await loadAll();
  } catch (error) {
    showMessage(configItem.message, false, error.message);
    button.disabled = false;
    button.textContent = "Excluir";
  }
});

render();
loadAll();
