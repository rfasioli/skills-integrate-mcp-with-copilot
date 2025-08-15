
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const statsBarChart = document.getElementById("stats-bar-chart");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");
  let allActivities = {};
  let currentRegisterActivity = null;

  // Modal para registro
  let modal = document.createElement("div");
  modal.id = "register-modal";
  modal.className = "hidden";
  modal.innerHTML = `
    <div class="modal-content">
      <span id="close-modal" class="close-modal">&times;</span>
      <h4>Registrar estudante</h4>
      <input type="email" id="modal-email" placeholder="your-email@mergington.edu" required />
      <button id="modal-register-btn">Registrar</button>
      <div id="modal-error" class="error hidden"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderActivities();
      populateCategories();
      renderStatistics();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      if (statsBarChart) statsBarChart.innerHTML = "<p>Erro ao carregar estatísticas.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderStatistics() {
    if (!statsBarChart) return;
    // Limpa gráfico
    statsBarChart.innerHTML = "";
    const data = Object.entries(allActivities);
    if (data.length === 0) {
      statsBarChart.innerHTML = "<p>Nenhuma atividade encontrada.</p>";
      return;
    }
    // Encontrar máximo de participantes para escala
    const max = Math.max(...data.map(([_, d]) => d.participants.length));
    // Renderizar barras
    data.forEach(([name, details]) => {
      const barContainer = document.createElement("div");
      barContainer.className = "bar-container";
      const label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = name;
      const bar = document.createElement("div");
      bar.className = "bar";
      const count = details.participants.length;
      bar.style.width = max > 0 ? `${(count / max) * 100}%` : "0%";
      bar.textContent = `${count} participante${count !== 1 ? 's' : ''}`;
      barContainer.appendChild(label);
      barContainer.appendChild(bar);
      statsBarChart.appendChild(barContainer);
    });
  }

  function renderActivities() {
    activitiesList.innerHTML = "";
    const search = searchInput ? searchInput.value.toLowerCase() : "";
    const category = categoryFilter ? categoryFilter.value : "";
    const sortBy = sortFilter ? sortFilter.value : "name";
    let filtered = Object.entries(allActivities).filter(([name, details]) => {
      let matchesSearch =
        name.toLowerCase().includes(search) ||
        (details.description && details.description.toLowerCase().includes(search)) ||
        (details.schedule && details.schedule.toLowerCase().includes(search));
      let matchesCategory = !category || (details.category === category);
      return matchesSearch && matchesCategory;
    });
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a[0].localeCompare(b[0]);
      } else if (sortBy === "schedule") {
        return (a[1].schedule || "").localeCompare(b[1].schedule || "");
      }
      return 0;
    });
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
        <button class="register-btn" data-activity="${name}">Registrar estudante</button>
      `;
      activitiesList.appendChild(activityCard);
    });
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
    document.querySelectorAll(".register-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        currentRegisterActivity = button.getAttribute("data-activity");
        document.getElementById("modal-email").value = "";
        document.getElementById("modal-error").classList.add("hidden");
        modal.classList.remove("hidden");
      });
    });
  }

  function populateCategories() {
    if (!categoryFilter) return;
    // Extrai categorias únicas das atividades
    const categories = new Set();
    Object.values(allActivities).forEach((details) => {
      if (details.category) categories.add(details.category);
    });
    // Limpa e adiciona opções
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Modal events
  document.getElementById("close-modal").onclick = () => {
    modal.classList.add("hidden");
  };
  document.getElementById("modal-register-btn").onclick = async () => {
    const email = document.getElementById("modal-email").value;
    if (!email) {
      document.getElementById("modal-error").textContent = "Informe um email válido.";
      document.getElementById("modal-error").classList.remove("hidden");
      return;
    }
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(currentRegisterActivity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        modal.classList.add("hidden");
        fetchActivities();
      } else {
        document.getElementById("modal-error").textContent = result.detail || "Erro ao registrar.";
        document.getElementById("modal-error").classList.remove("hidden");
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      document.getElementById("modal-error").textContent = "Erro ao registrar.";
      document.getElementById("modal-error").classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  };

  // Eventos de filtro e busca
  if (searchInput) searchInput.addEventListener("input", renderActivities);
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (sortFilter) sortFilter.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
