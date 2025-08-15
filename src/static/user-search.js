document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("user-search-btn");
  const input = document.getElementById("user-search-input");
  const resultDiv = document.getElementById("user-search-result");

  searchBtn.addEventListener("click", async () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      resultDiv.innerHTML = '<div class="error">Digite parte do email para buscar.</div>';
      return;
    }
    resultDiv.innerHTML = '<p>Buscando...</p>';
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      let found = [];
      Object.entries(activities).forEach(([name, details]) => {
        const match = details.participants.some(email => email.toLowerCase().includes(query));
        if (match) {
          found.push({ name, ...details });
        }
      });
      if (found.length === 0) {
        resultDiv.innerHTML = `<p>Nenhuma atividade encontrada para o email: <b>${query}</b></p>`;
      } else {
        let html = `<h4>Atividades encontradas para: <b>${query}</b></h4>`;
        html += '<ul>' + found.map(a => `<li><b>${a.name}</b> - ${a.schedule}</li>`).join('') + '</ul>';
        resultDiv.innerHTML = html;
      }
    } catch (err) {
      resultDiv.innerHTML = '<div class="error">Erro ao buscar atividades.</div>';
    }
  });
});
