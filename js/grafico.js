// Selecciona elementos HTML específicos para interactuar con el menú, botones y cambio de tema
const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const themeToggler = document.querySelector(".theme-toggler");

// Obtiene los valores de los colores para el fondo de los gráficos, el color de la fuente y el de los ejes
var chartBGColor = getComputedStyle(document.body).getPropertyValue("--chart-background");
var chartFontColor = getComputedStyle(document.body).getPropertyValue("--chart-font-color");
var chartAxisColor = getComputedStyle(document.body).getPropertyValue("--chart-axis-color");

/*
  Asigna eventos de clic a los botones de menú y tema
*/
menuBtn.addEventListener("click", () => {
  sideMenu.style.display = "block"; // Muestra el menú lateral
});

closeBtn.addEventListener("click", () => {
  sideMenu.style.display = "none"; // Oculta el menú lateral
});

themeToggler.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme-variables"); // Cambia entre el tema claro y oscuro
  themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
  themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");

  // Actualiza los colores de fondo y ejes de los gráficos según el nuevo tema
  chartBGColor = getComputedStyle(document.body).getPropertyValue("--chart-background");
  chartFontColor = getComputedStyle(document.body).getPropertyValue("--chart-font-color");
  chartAxisColor = getComputedStyle(document.body).getPropertyValue("--chart-axis-color");
  updateChartsBackground(); // Llama a la función para actualizar los gráficos con los nuevos colores
});

/*
  Configuración inicial de gráficos y medidores con Plotly.js
*/
// Selecciona los divs HTML donde se dibujarán los gráficos y medidores
var temperatureHistoryDiv = document.getElementById("temperature-history");
var humidityHistoryDiv = document.getElementById("humidity-history");
var temperatureGaugeDiv = document.getElementById("temperature-gauge");
var humidityGaugeDiv = document.getElementById("humidity-gauge");

// Agrupa los elementos gráficos en arrays para facilitar su acceso en funciones
const historyCharts = [temperatureHistoryDiv, humidityHistoryDiv];
const gaugeCharts = [temperatureGaugeDiv, humidityGaugeDiv];

// Define los trazos de los gráficos de línea para el historial de temperatura y humedad
var temperatureTrace = {
  x: [], // Valores en el eje x
  y: [], // Valores en el eje y
  name: "Temperature",
  mode: "lines+markers", // Modo de visualización (líneas y puntos)
  type: "line",
};

var humidityTrace = {
  x: [],
  y: [],
  name: "Humidity",
  mode: "lines+markers",
  type: "line",
};

// Configuración de diseño para el gráfico de temperatura
var temperatureLayout = {
  autosize: true,
  title: { text: "Temperatura" },
  font: { size: 12, color: chartFontColor, family: "poppins, san-serif" },
  colorway: ["#05AD86"], // Colores del gráfico
  margin: { t: 40, b: 40, l: 60, r: 60, pad: 10 },
  plot_bgcolor: chartBGColor,
  paper_bgcolor: chartBGColor,
  xaxis: { color: chartAxisColor, linecolor: chartAxisColor, gridwidth: "2", autorange: true },
  yaxis: { color: chartAxisColor, linecolor: chartAxisColor, gridwidth: "2", autorange: true },
};

// Configuración de diseño para el gráfico de humedad
var humidityLayout = {
  autosize: true,
  title: { text: "Humedad" },
  font: { size: 12, color: chartFontColor, family: "poppins, san-serif" },
  colorway: ["#011818"],
  margin: { t: 40, b: 40, l: 30, r: 30, pad: 0 },
  plot_bgcolor: chartBGColor,
  paper_bgcolor: chartBGColor,
  xaxis: { color: chartAxisColor, linecolor: chartAxisColor, gridwidth: "2" },
  yaxis: { color: chartAxisColor, linecolor: chartAxisColor },
};

// Configuración de respuesta del gráfico para dispositivos pequeños
var config = { responsive: true };

// Inicializa los gráficos de línea al cargar la página
window.addEventListener("load", (event) => {
  Plotly.newPlot(temperatureHistoryDiv, [temperatureTrace], temperatureLayout, config);
  Plotly.newPlot(humidityHistoryDiv, [humidityTrace], humidityLayout, config);
  handleDeviceChange(mediaQuery); // Llama a la función de ajuste para dispositivos móviles
});

// Configuración inicial de los medidores de temperatura y humedad
var temperatureData = [
  {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    title: { text: "Temperatura" },
    type: "indicator",
    mode: "gauge+number+delta", // Muestra un número y un delta (diferencia)
    delta: { reference: 30 },
    gauge: {
      axis: { range: [null, 50] },
      steps: [{ range: [0, 20], color: "lightgray" }, { range: [20, 30], color: "gray" }],
      threshold: { line: { color: "red", width: 4 }, thickness: 0.75, value: 30 },
    },
  },
];

var humidityData = [
  {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    title: { text: "Humedad" },
    type: "indicator",
    mode: "gauge+number+delta",
    delta: { reference: 50 },
    gauge: {
      axis: { range: [null, 100] },
      steps: [{ range: [0, 20], color: "lightgray" }, { range: [20, 30], color: "gray" }],
      threshold: { line: { color: "red", width: 4 }, thickness: 0.75, value: 30 },
    },
  },
];

// Tamaño de diseño de los medidores
var layout = { width: 300, height: 250, margin: { t: 0, b: 0, l: 0, r: 0 } };

// Inicializa los medidores de temperatura y humedad
Plotly.newPlot(temperatureGaugeDiv, temperatureData, layout);
Plotly.newPlot(humidityGaugeDiv, humidityData, layout);

// Arrays para almacenar los valores recibidos del sensor
let newTempXArray = [];
let newTempYArray = [];
let newHumidityXArray = [];
let newHumidityYArray = [];

// Número máximo de puntos en el gráfico de línea
let MAX_GRAPH_POINTS = 12;
let ctr = 0; // Contador para el eje x de los gráficos

// Actualiza las lecturas del sensor y redibuja los medidores y gráficos
function updateSensorReadings(jsonResponse) {
  let temperature = Number(jsonResponse.temperature).toFixed(2);
  let humidity = Number(jsonResponse.humidity).toFixed(2);

  updateBoxes(temperature, humidity); // Muestra las lecturas en el HTML
  updateGauge(temperature, humidity); // Actualiza los medidores
  updateCharts(temperatureHistoryDiv, newTempXArray, newTempYArray, temperature); // Actualiza gráfico de temperatura
  updateCharts(humidityHistoryDiv, newHumidityXArray, newHumidityYArray, humidity); // Actualiza gráfico de humedad
}

// Actualiza los cuadros HTML con los valores actuales de temperatura y humedad
function updateBoxes(temperature, humidity) {
  document.getElementById("temperature").innerHTML = temperature + " C";
  document.getElementById("humidity").innerHTML = humidity + " %";
}

// Actualiza los valores en los medidores de temperatura y humedad
function updateGauge(temperature, humidity) {
  Plotly.update(temperatureGaugeDiv, { value: temperature });
  Plotly.update(humidityGaugeDiv, { value: humidity });
}

// Añade nuevos puntos de datos a los gráficos de línea
function updateCharts(lineChartDiv, xArray, yArray, sensorRead) {
  if (xArray.length >= MAX_GRAPH_POINTS) xArray.shift(); // Elimina el primer elemento si supera el límite
  if (yArray.length >= MAX_GRAPH_POINTS) yArray.shift();
  xArray.push(ctr++); // Añade un nuevo punto al eje x
  yArray.push(sensorRead); // Añade una nueva lectura en el eje y

  Plotly.update(lineChartDiv, { x: [xArray], y: [yArray] });
}

// Actualiza el fondo de los gráficos históricos y medidores al cambiar el tema
function updateChartsBackground() {
  var updateHistory = {
    plot_bgcolor: chartBGColor,
    paper_bgcolor: chartBGColor,
    font: { color: chartFontColor },
    xaxis: { color: chartAxisColor, linecolor: chartAxisColor },
    yaxis: { color: chartAxisColor, linecolor: chartAxisColor },
  };
  historyCharts.forEach((chart) => {
    Plotly.relayout(chart, updateHistory); // Actualiza los gráficos de historial
  });

  var updateGauges = { paper_bgcolor: chartBGColor };
  gaugeCharts.forEach((chart) => {
    Plotly.relayout(chart, updateGauges); // Actualiza los medidores
  });
}

// Llama a `retrieveSensorReadings()` cada 3 segundos para actualizar los datos
setInterval(retrieveSensorReadings, 3000);

// Realiza una petición para obtener las lecturas del sensor del endpoint `/sensorReadings`
async function retrieveSensorReadings() {
  const response = await fetch("/sensorReadings");
  const jsonResponse = await response.json();
  updateSensorReadings(jsonResponse);
}

// Ajusta el tamaño de los gráficos en dispositivos móviles
function handleDeviceChange(e) {
  if (e.matches) {
    Plotly.relayout(temperatureHistoryDiv, { width: 270 });
    Plotly.relayout(humidityHistoryDiv, { width: 270 });
  }
}

const mediaQuery = window.matchMedia("(max-width: 600px)");
mediaQuery.addListener(handleDeviceChange);
handleDeviceChange(mediaQuery);
