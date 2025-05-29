const waterLevelEl = document.getElementById("waterLevel");
const tankStatusEl = document.getElementById("tankStatus");
const infoCard = document.getElementById("info-card");
const ctx = document.getElementById("waterLevelChart").getContext("2d");

const channelId = '2940207';
const readApiKey = 'IZU510LZFHXBIB02';

let waterLevels = [];
let timestamps = [];

const waterLevelChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: timestamps,
    datasets: [{
      label: 'Water Level (%)',
      data: waterLevels,
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      fill: true,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Time',
        }
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Water Level (%)',
        }
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  }
});

// ✅ This fetches the chart data
function fetchChartData() {
  fetch(`https://api.thingspeak.com/channels/${channelId}/fields/1.json?api_key=${readApiKey}&results=10`)
    .then(response => response.json())
    .then(data => {
      const feeds = data.feeds;
      waterLevels.length = 0;
      timestamps.length = 0;

      feeds.forEach(feed => {
        const level = parseFloat(feed.field1);
        const time = new Date(feed.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (!isNaN(level)) {
          waterLevels.push(level);
          timestamps.push(time);
        }
      });

      waterLevelChart.update();
    })
    .catch(error => {
      console.error("Chart Fetch Error:", error);
    });
}

// ✅ This fetches only the latest value
function fetchLatestValue() {
  fetch(`https://api.thingspeak.com/channels/${channelId}/fields/1/last.json?api_key=${readApiKey}`)
    .then(response => response.json())
    .then(data => {
      const latestLevel = parseFloat(data.field1);
      const latestTime = new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!isNaN(latestLevel)) {
        waterLevelEl.textContent = `${latestLevel.toFixed(1)} %`;

        let statusText = "", bgColor = "";
        if (latestLevel < 25) {
          statusText = "Low";
          bgColor = "var(--low)";
        } else if (latestLevel < 60) {
          statusText = "Medium";
          bgColor = "var(--medium)";
        } else if (latestLevel < 85) {
          statusText = "High";
          bgColor = "var(--high)";
        } else {
          statusText = "Full";
          bgColor = "var(--full)";
        }

        tankStatusEl.textContent = statusText;
        infoCard.style.backgroundColor = bgColor;

        // Update chart with the latest value
        if (timestamps[timestamps.length - 1] !== latestTime) {
          waterLevels.push(latestLevel);
          timestamps.push(latestTime);

          if (waterLevels.length > 10) {
            waterLevels.shift();
            timestamps.shift();
          }

          waterLevelChart.update();
        }
      }
    })
    .catch(error => {
      console.error("Latest Fetch Error:", error);
      waterLevelEl.textContent = "--";
      tankStatusEl.textContent = "Error";
    });
}

// Initial fetch
fetchChartData();
fetchLatestValue();

// Periodic updates
setInterval(fetchChartData, 15000);   // Chart every 15 sec
setInterval(fetchLatestValue, 5000); // Latest value every 5 sec
