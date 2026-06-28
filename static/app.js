const config = window.APP_CONFIG || {
  gestaoApiUrl: "https://api-de-gerenciamento-escolar.onrender.com",
  reservaApiUrl: "https://api-de-reserva-de-salas.onrender.com",
  atividadeApiUrl: "https://atividade-microservice-api-escolar.onrender.com",
};

const state = {
  professores: [],
  turmas: [],
  alunos: [],
  reservas: [],
  atividades: [],
};

const endpoints = {
  professores: `${config.gestaoApiUrl}/api/professores`,
  turmas: `${config.gestaoApiUrl}/api/turma`,
  alunos: `${config.gestaoApiUrl}/api/alunos/`,
  reservas: `${config.reservaApiUrl}/reservas`,
  atividades: `${config.atividadeApiUrl}/atividades`,
};

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
    url: (id) => `${config.gestaoApiUrl}/api/alunos/${id}`,
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

function setStatus(service, ok, text) {
  const dot = document.getElementById(`${service}Dot`);
  const label = document.getElementById(`${service}Status`);
  dot.classList.toggle("ok", ok);
  dot.classList.toggle("bad", !ok);
  label.textContent = text;
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function table(rows, columns, actionsType = null) {
  if (!rows.length) {
    return "<p class=\"empty\">Nenhum registro encontrado.</p>";
  }

  const actionHead = actionsType ? "<th>Acoes</th>" : "";
  const head = columns.map((column) => `<th>${column.label}</th>`).join("") + actionHead;
  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${escapeHtml(row[column.key])}</td>`)
        .join("");
      const actions = actionsType
        ? `<td><button class="danger small" data-delete-type="${actionsType}" data-delete-id="${row.id}">Excluir</button></td>`
        : "";
      return `<tr>${cells}${actions}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function render() {
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
    { key: "professor_id", label: "Professor" },
  ], "turmas");

  document.getElementById("alunosList").innerHTML = table(state.alunos, [
    { key: "id", label: "ID" },
    { key: "nome", label: "Nome" },
    { key: "idade", label: "Idade" },
    { key: "turma_id", label: "Turma" },
    { key: "media_final", label: "Media" },
  ], "alunos");

  document.getElementById("reservasList").innerHTML = table(state.reservas, [
    { key: "id", label: "ID" },
    { key: "turma_id", label: "Turma" },
    { key: "sala", label: "Sala" },
    { key: "data", label: "Data" },
    { key: "hora_inicio", label: "Inicio" },
    { key: "hora_fim", label: "Fim" },
  ], "reservas");

  document.getElementById("atividadesList").innerHTML = table(state.atividades, [
    { key: "id", label: "ID" },
    { key: "id_professor", label: "Professor" },
    { key: "nome_atividade", label: "Atividade" },
    { key: "nota", label: "Nota" },
  ], "atividades");
}

async function loadAll() {
  const refreshButton = document.getElementById("refreshAll");
  refreshButton.disabled = true;
  refreshButton.textContent = "Atualizando...";

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
  refreshButton.disabled = false;
  refreshButton.textContent = "Atualizar";
}

function formDataToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  for (const key of Object.keys(data)) {
    if (data[key] !== "" && !Number.isNaN(Number(data[key])) && ["turma_id", "id_professor", "nota"].includes(key)) {
      data[key] = Number(data[key]);
    }
  }
  return data;
}

function showMessage(id, ok, text) {
  const element = document.getElementById(id);
  element.textContent = text;
  element.classList.toggle("ok", ok);
  element.classList.toggle("bad", !ok);
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

document.getElementById("reservaForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    await fetchJson(endpoints.reservas, {
      method: "POST",
      body: JSON.stringify(formDataToObject(form)),
    });
    form.reset();
    showMessage("reservaMessage", true, "Reserva criada com sucesso.");
    await loadAll();
  } catch (error) {
    showMessage("reservaMessage", false, error.message);
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById("atividadeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    await fetchJson(endpoints.atividades, {
      method: "POST",
      body: JSON.stringify(formDataToObject(form)),
    });
    form.reset();
    showMessage("atividadeMessage", true, "Atividade criada com sucesso.");
    await loadAll();
  } catch (error) {
    showMessage("atividadeMessage", false, error.message);
  } finally {
    submitButton.disabled = false;
  }
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

loadAll();
