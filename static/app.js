const config = window.APP_CONFIG;

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

function table(rows, columns) {
  if (!rows.length) {
    return "<p class=\"empty\">Nenhum registro encontrado.</p>";
  }

  const head = columns.map((column) => `<th>${column.label}</th>`).join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${row[column.key] ?? ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
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
  ]);

  document.getElementById("turmasList").innerHTML = table(state.turmas, [
    { key: "id", label: "ID" },
    { key: "nome", label: "Nome" },
    { key: "turno", label: "Turno" },
    { key: "professor_id", label: "Professor" },
  ]);

  document.getElementById("alunosList").innerHTML = table(state.alunos, [
    { key: "id", label: "ID" },
    { key: "nome", label: "Nome" },
    { key: "idade", label: "Idade" },
    { key: "turma_id", label: "Turma" },
    { key: "media_final", label: "Media" },
  ]);

  document.getElementById("reservasList").innerHTML = table(state.reservas, [
    { key: "id", label: "ID" },
    { key: "turma_id", label: "Turma" },
    { key: "sala", label: "Sala" },
    { key: "data", label: "Data" },
    { key: "hora_inicio", label: "Inicio" },
    { key: "hora_fim", label: "Fim" },
  ]);

  document.getElementById("atividadesList").innerHTML = table(state.atividades, [
    { key: "id", label: "ID" },
    { key: "id_professor", label: "Professor" },
    { key: "nome_atividade", label: "Atividade" },
    { key: "nota", label: "Nota" },
  ]);
}

async function loadAll() {
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
  try {
    await fetchJson(endpoints.reservas, {
      method: "POST",
      body: JSON.stringify(formDataToObject(event.currentTarget)),
    });
    event.currentTarget.reset();
    showMessage("reservaMessage", true, "Reserva criada com sucesso.");
    await loadAll();
  } catch (error) {
    showMessage("reservaMessage", false, error.message);
  }
});

document.getElementById("atividadeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await fetchJson(endpoints.atividades, {
      method: "POST",
      body: JSON.stringify(formDataToObject(event.currentTarget)),
    });
    event.currentTarget.reset();
    showMessage("atividadeMessage", true, "Atividade criada com sucesso.");
    await loadAll();
  } catch (error) {
    showMessage("atividadeMessage", false, error.message);
  }
});

loadAll();
