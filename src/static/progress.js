document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("search-progress-btn");
  const emailInput = document.getElementById("student-email-input");
  const resultDiv = document.getElementById("student-progress-result");

  searchBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
      resultDiv.innerHTML = '<div class="error">Digite um email válido.</div>';
      return;
    }
    resultDiv.innerHTML = '<p>Buscando progresso...</p>';
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      let participated = [];
      let notParticipated = [];
      Object.entries(activities).forEach(([name, details]) => {
        if (details.participants.includes(email)) {
          participated.push({ name, ...details });
        } else {
          notParticipated.push({ name, ...details });
        }
      });
      let html = `<h4>Progresso de: ${email}</h4>`;
      html += `<p><strong>Atividades inscritas (${participated.length}):</strong></p>`;
      if (participated.length > 0) {
        html += '<ul>' + participated.map(a => `<li><b>${a.name}</b> - ${a.schedule}</li>`).join('') + '</ul>';
      } else {
        html += '<p>Nenhuma atividade inscrita.</p>';
      }
      html += `<p><strong>Atividades disponíveis (${notParticipated.length}):</strong></p>`;
      if (notParticipated.length > 0) {
        html += '<ul>' + notParticipated.map(a => `<li>${a.name}</li>`).join('') + '</ul>';
      } else {
        html += '<p>Inscrito em todas as atividades!</p>';
      }
      resultDiv.innerHTML = html;
    } catch (err) {
      resultDiv.innerHTML = '<div class="error">Erro ao buscar progresso.</div>';
    }
  });
});
