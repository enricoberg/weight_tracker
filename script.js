document.addEventListener("DOMContentLoaded", () => {
  const weightInput = document.getElementById("weightInput");
  const submitBtn = document.getElementById("submitBtn");
  const monthlyChangeEl = document.getElementById("monthlyChange");
  const rateChangeEl = document.getElementById("rateChange");
  const copyBtn = document.getElementById("copyBtn");
  const chartBtn = document.getElementById("chartBtn");
  const chartCanvas = document.getElementById("weightChart");

  let weights = JSON.parse(localStorage.getItem("weights")) || [];

  let weightChart = null;

  updateIndicators();
  createChart();

  weightInput.addEventListener("input", formatWeightInput);
  weightInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveWeight();
  });
  submitBtn.addEventListener("click", saveWeight);
  copyBtn.addEventListener("click", copyToClipboard);
  chartBtn.addEventListener("click", createChart);

  function formatWeightInput(e) {
    let input = e.target.value.replace(/[^\d,]/g, "");

    if (input.includes(",")) {
      const parts = input.split(",");
      if (parts[0].length > 2) parts[0] = parts[0].substring(0, 2);
      if (parts[1] && parts[1].length > 1) parts[1] = parts[1].substring(0, 1);
      input = parts.join(",");
    } else if (input.length > 2) {
      input = input.substring(0, 2) + "," + input.substring(2, 3);
    }

    e.target.value = input;
  }

  function saveWeight() {
    const weightStr = weightInput.value.trim();
    if (!weightStr) return;

    const weight = parseFloat(weightStr.replace(",", "."));

    if (isNaN(weight) || weight <= 0 || weight > 300) {
      alert("Inserisci un peso valido");
      return;
    }

    const now = new Date();
    const date = formatDate(now);
    const time = formatTime(now);

    const formattedWeight = weight.toFixed(1);

    weights.push(`${formattedWeight},${date},${time}`);
    localStorage.setItem("weights", JSON.stringify(weights));

    weightInput.value = "";
    updateIndicators();
    createChart();
  }

  function formatDate(date) {
    return `${padZero(date.getDate())}.${padZero(
      date.getMonth() + 1
    )}.${date.getFullYear()}`;
  }

  function formatTime(date) {
    return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }

  function padZero(num) {
    return num < 10 ? `0${num}` : num;
  }

  function updateIndicators() {
    if (weights.length < 2) {
      monthlyChangeEl.textContent = "-- kg";
      rateChangeEl.textContent = "-- kg/mese";
      return;
    }

    const parsedWeights = weights
      .map((entry) => {
        const [weight, date, time] = entry.split(",");
        return {
          weight: parseFloat(weight),
          date: parseDate(date),
          dateStr: date,
        };
      })
      .sort((a, b) => a.date - b.date);

    const firstEntry = parsedWeights[0];
    const lastEntry = parsedWeights[parsedWeights.length - 1];
    let oneMonthAgo = new Date(lastEntry.date);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let closestEntry = firstEntry;
    let minDiff = Number.MAX_VALUE;

    for (const entry of parsedWeights) {
      const diffTime = Math.abs(entry.date - oneMonthAgo);
      if (diffTime < minDiff) {
        minDiff = diffTime;
        closestEntry = entry;
      }
    }

    const monthOldEntry = closestEntry;
    const monthlyChange = lastEntry.weight - monthOldEntry.weight;
    monthlyChangeEl.textContent = formatWeight(monthlyChange) + " kg";
    monthlyChangeEl.className =
      "indicator-value " + getChangeClass(monthlyChange);
    const totalDays =
      (lastEntry.date - firstEntry.date) / (1000 * 60 * 60 * 24);
    const totalMonths = totalDays / 30.44;
    if (totalMonths >= 0.5) {
      const totalChange = lastEntry.weight - firstEntry.weight;
      const monthlyRate = totalChange / totalMonths;
      rateChangeEl.textContent = formatWeight(monthlyRate) + " kg/mese";
      rateChangeEl.className =
        "indicator-value " + getChangeClass(-monthlyRate);
    } else {
      rateChangeEl.textContent = "Dati insufficienti";
    }
  }

  function parseDate(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);
    return new Date(year, month - 1, day);
  }

  function formatWeight(weight) {
    return weight.toFixed(1).replace(".", ",");
  }

  function getChangeClass(change) {
    return change < 0 ? "negative" : change > 0 ? "positive" : "";
  }

  function copyToClipboard() {
    if (weights.length === 0) {
      alert("Nessun dato da copiare");
      return;
    }
    const header = "Peso,Data,Ora\n";
    const csvContent = header + weights.join("\n");
    navigator.clipboard
      .writeText(csvContent)
      .then(() => console.log("Dati copiati negli appunti!"))
      .catch((err) => {
        console.error("Errore durante la copia:", err);
        alert("Errore durante la copia dei dati");
      });
  }

  function createChart() {
    if (weights.length === 0) return;
    const chartData = weights
      .map((entry) => {
        const [weight, date, time] = entry.split(",");
        return {
          weight: parseFloat(weight),
          date: parseDate(date),
          dateStr: date,
        };
      })
      .sort((a, b) => a.date - b.date);
    const labels = chartData.map((entry) => entry.dateStr);
    const data = chartData.map((entry) => entry.weight);

    if (weightChart) weightChart.destroy();

    weightChart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Peso (kg)",
            data: data,
            borderColor: "rgba(0, 255, 255, 0.8)",
            backgroundColor: "rgba(0, 255, 255, 0.1)",
            borderWidth: 3,
            pointBackgroundColor: "rgba(0, 255, 255, 1)",
            pointBorderColor: "#121212",
            pointRadius: 5,
            pointHoverRadius: 8,
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grace: "5%",
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
            },
          },
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              maxRotation: 45,
              minRotation: 45,
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "rgba(255, 255, 255, 0.8)",
            },
          },
        },
      },
    });
  }
});
