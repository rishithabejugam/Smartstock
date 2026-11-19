// ==========================================================================
// SMARTSTOCK PREDICTIVE CONTROLLER & SIMULATOR (SIMPLIFIED MODEL)
// ==========================================================================

let telemetryData = null;
let modelParams = null;
let historicalChart = null;
let weightsChart = null;


const PAGE_METADATA = {
    overview: { title: "Dashboard Overview", subtitle: "Real-time sales telemetry, weather correlations, and stock optimization." },
    predictor: { title: "Demand Predictor", subtitle: "Simulate custom parameters to predict future order volumes." },

    insights: { title: "Model Insights", subtitle: "In-depth look at model weights, coefficients, and mathematical validation." }
};

// ==========================================================================
// INITIALIZATION & DATA FETCHING
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    setupTabNavigation();
    updateDateBadge();
    
    try {
        const [dataRes, modelRes] = await Promise.all([
            fetch('/processed_data.json'),
            fetch('/trained_model.json')
        ]);
        
        telemetryData = await dataRes.json();
        modelParams = await modelRes.json();
        
        console.log("Telemetry loaded:", telemetryData.daily_data.length, "records");
        console.log("Model parameters loaded successfully.");

        populateCategoryFilters();
        initOverviewTab();
        initPredictorTab();

        initInsightsTab();
        
    } catch (err) {
        console.error("Error initializing dashboard data:", err);
        alert("Failed to load telemetry data. Please ensure data processing and model training scripts have run successfully.");
    }
});

function updateDateBadge() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("current-time-badge").innerText = today.toLocaleDateString('en-US', options);
}

function setupTabNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            
            const tabId = item.getAttribute("data-tab");
            
            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.remove("active");
            });
            document.getElementById(`tab-${tabId}`).classList.add("active");
            
            const meta = PAGE_METADATA[tabId];
            document.getElementById("page-title").innerText = meta.title;
            document.getElementById("page-subtitle").innerText = meta.subtitle;
        });
    });
}

function populateCategoryFilters() {
    const catSelectOverview = document.getElementById("category-filter");
    const catSelectPredictor = document.getElementById("pred-category");
    
    telemetryData.categories.forEach(cat => {
        const opt1 = document.createElement("option");
        opt1.value = cat;
        opt1.textContent = cat;
        catSelectOverview.appendChild(opt1);
        
        const opt2 = document.createElement("option");
        opt2.value = cat;
        opt2.textContent = cat;
        catSelectPredictor.appendChild(opt2);
    });
}

// ==========================================================================
// TAB: OVERVIEW TAB CONTROLLER
// ==========================================================================

function initOverviewTab() {
    calculateOverviewKPIs();
    renderHistoricalChart();
    renderCorrelationStats();
    
    document.getElementById("category-filter").addEventListener("change", updateHistoricalChart);
    document.getElementById("time-filter").addEventListener("change", updateHistoricalChart);
}

function calculateOverviewKPIs() {
    const records = telemetryData.daily_data;
    const totalOrders = records.reduce((sum, r) => sum + r.total_orders, 0);
    const totalSales = records.reduce((sum, r) => sum + r.total_sales, 0);
    const avgOrderValue = totalSales / totalOrders;
    
    document.getElementById("kpi-total-orders").innerText = totalOrders.toLocaleString();
    document.getElementById("kpi-total-revenue").innerText = "₹" + Math.round(totalSales).toLocaleString();
    document.getElementById("kpi-avg-order-val").innerText = "₹" + avgOrderValue.toFixed(2);
    
    // Average Stock Price
    const avgStockPrice = records.reduce((sum, r) => sum + r.avg_price, 0) / records.length;
    document.getElementById("kpi-avg-stock-price").innerText = "₹" + Math.round(avgStockPrice);
    
    // Holiday Lift
    const holidays = records.filter(r => r.is_holiday === 1);
    const nonHolidays = records.filter(r => r.is_holiday === 0);
    const avgHolidayOrders = holidays.reduce((sum, r) => sum + r.total_orders, 0) / (holidays.length || 1);
    const avgNonHolidayOrders = nonHolidays.reduce((sum, r) => sum + r.total_orders, 0) / (nonHolidays.length || 1);
    const holidayLift = ((avgHolidayOrders - avgNonHolidayOrders) / avgNonHolidayOrders) * 100;
    
    document.getElementById("kpi-holiday-lift").innerText = (holidayLift >= 0 ? "+" : "") + holidayLift.toFixed(1) + "%";
}

function renderHistoricalChart() {
    const ctx = document.getElementById('historicalChart').getContext('2d');
    const chartData = getFilteredHistoricalData();
    
    historicalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.dates,
            datasets: [
                {
                    label: 'Orders',
                    data: chartData.orders,
                    backgroundColor: 'rgba(167, 139, 250, 0.45)',
                    borderColor: 'rgba(167, 139, 250, 0.9)',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    yAxisID: 'yOrders'
                },
                {
                    label: 'Average Price (INR)',
                    data: chartData.prices,
                    type: 'line',
                    borderColor: 'rgba(96, 165, 250, 0.85)',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    yAxisID: 'yPrice'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#64748b', maxTicksLimit: 12 }
                },
                yOrders: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Order Count', color: '#cbd5e1' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#cbd5e1' }
                },
                yPrice: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Average Item Price (₹)', color: '#60a5fa' },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#60a5fa' },
                    min: 0,
                    suggestedMax: 1000
                }
            },
            plugins: {
                legend: { labels: { color: '#cbd5e1' } }
            }
        }
    });
}

function updateHistoricalChart() {
    if (!historicalChart) return;
    const chartData = getFilteredHistoricalData();
    historicalChart.data.labels = chartData.dates;
    historicalChart.data.datasets[0].data = chartData.orders;
    historicalChart.data.datasets[1].data = chartData.prices;
    historicalChart.update();
}

function getFilteredHistoricalData() {
    const catFilter = document.getElementById("category-filter").value;
    const timeFilter = document.getElementById("time-filter").value;
    
    let records = telemetryData.daily_data;
    if (timeFilter !== "all") {
        const limit = parseInt(timeFilter, 10);
        records = records.slice(-limit);
    }
    
    const dates = records.map(r => r.date);
    const prices = records.map(r => r.avg_price);
    let orders;
    
    if (catFilter === "all") {
        orders = records.map(r => r.total_orders);
    } else {
        orders = records.map(r => r.category_sales[catFilter] || 0);
    }
    
    return { dates, prices, orders };
}

function renderCorrelationStats() {
    const records = telemetryData.daily_data;
    
    // 1. Price of the Stock (low price ₹450 vs high price ₹650)
    const cheapStock = records.filter(r => r.avg_price < 500).map(r => r.total_orders);
    const expensiveStock = records.filter(r => r.avg_price >= 500).map(r => r.total_orders);
    const cheapMean = cheapStock.reduce((a,b)=>a+b, 0) / (cheapStock.length || 1);
    const expMean = expensiveStock.reduce((a,b)=>a+b, 0) / (expensiveStock.length || 1);
    const pricePercent = Math.min(100, (cheapMean / (expMean || 1)) * 50);
    document.getElementById("corr-price-bar").style.width = pricePercent + "%";
    document.getElementById("corr-price-val").innerText = `Cheap Stock (<₹500) avg: ${cheapMean.toFixed(1)} vs Expensive (>=₹500): ${expMean.toFixed(1)}`;

    // 2. Monsoon Rainfall (Rainy vs Dry)
    const rainyOrders = records.filter(r => r.is_rainy === 1).map(r => r.total_orders);
    const dryOrders = records.filter(r => r.is_rainy === 0).map(r => r.total_orders);
    const rainyMean = rainyOrders.reduce((a,b)=>a+b, 0) / (rainyOrders.length || 1);
    const dryMean = dryOrders.reduce((a,b)=>a+b, 0) / (dryOrders.length || 1);
    const monsoonPercent = Math.min(100, (rainyMean / (dryMean || 1)) * 50);
    document.getElementById("corr-monsoon-bar").style.width = monsoonPercent + "%";
    document.getElementById("corr-monsoon-val").innerText = `Rainy days avg: ${rainyMean.toFixed(1)} vs Dry: ${dryMean.toFixed(1)}`;

    // 3. High Summer Temperature Lift
    const summerOrders = records.filter(r => r.temperature > 30).map(r => r.total_orders);
    const coldOrders = records.filter(r => r.temperature <= 30).map(r => r.total_orders);
    const summerMean = summerOrders.reduce((a,b)=>a+b, 0) / (summerOrders.length || 1);
    const coldMean = coldOrders.reduce((a,b)=>a+b, 0) / (coldOrders.length || 1);
    const summerPercent = Math.min(100, (summerMean / (coldMean || 1)) * 50);
    document.getElementById("corr-summer-bar").style.width = summerPercent + "%";
    document.getElementById("corr-summer-val").innerText = `Hot days (>30°C) avg: ${summerMean.toFixed(1)} vs Cool: ${coldMean.toFixed(1)}`;

    // 4. Holidays Spikes
    const holOrders = records.filter(r => r.is_holiday === 1).map(r => r.total_orders);
    const nonHolOrders = records.filter(r => r.is_holiday === 0).map(r => r.total_orders);
    const holMean = holOrders.reduce((a,b)=>a+b, 0) / (holOrders.length || 1);
    const nonHolMean = nonHolOrders.reduce((a,b)=>a+b, 0) / (nonHolOrders.length || 1);
    const festivalPercent = Math.min(100, (holMean / (nonHolMean || 1)) * 50);
    document.getElementById("corr-festival-bar").style.width = festivalPercent + "%";
    document.getElementById("corr-festival-val").innerText = `Holidays: ${holMean.toFixed(1)} vs Normal days: ${nonHolMean.toFixed(1)}`;
}

// ==========================================================================
// TAB: PREDICTOR TAB CONTROLLER
// ==========================================================================

function initPredictorTab() {
    const tempInput = document.getElementById("pred-temp");
    const tempVal = document.getElementById("pred-temp-val");
    tempInput.addEventListener("input", (e) => {
        tempVal.innerText = e.target.value + "°C";
        runRealTimePrediction();
    });

    const priceInput = document.getElementById("pred-price");
    const priceVal = document.getElementById("pred-price-val");
    priceInput.addEventListener("input", (e) => {
        priceVal.innerText = "₹" + e.target.value;
        runRealTimePrediction();
    });

    const form = document.getElementById("prediction-form");
    form.addEventListener("input", runRealTimePrediction);
    document.getElementById("pred-date").addEventListener("change", runRealTimePrediction);
    document.getElementById("pred-weather-state").addEventListener("change", runRealTimePrediction);
    document.getElementById("pred-category").addEventListener("change", runRealTimePrediction);

    runRealTimePrediction();
}

function runRealTimePrediction() {
    const dateStr = document.getElementById("pred-date").value;
    const weatherState = document.getElementById("pred-weather-state").value;
    const tempVal = parseFloat(document.getElementById("pred-temp").value);
    const isHoliday = document.getElementById("pred-holiday").checked ? 1 : 0;
    const priceVal = parseFloat(document.getElementById("pred-price").value);
    const targetCategory = document.getElementById("pred-category").value;

    let isRainy = 0;
    let rainfall = 0.0;
    if (weatherState === 'light_rain') {
        isRainy = 1;
        rainfall = 10.0;
    } else if (weatherState === 'heavy_rain') {
        isRainy = 1;
        rainfall = 35.0;
    }

    const featureParams = {
        tempVal, rainfall, isRainy, isHoliday, priceVal
    };

    const targetModelName = targetCategory === 'all' ? 'total_orders' : `category:${targetCategory}`;
    
    const ridgePred = predictRidge(targetModelName, featureParams);
    const ridgeSalesPred = predictRidge('total_sales', featureParams);
    
    const dtPred = predictDecisionTree(targetModelName, featureParams);
    const dtSalesPred = predictDecisionTree('total_sales', featureParams);

    // Calculate unified ensemble prediction (average of Ridge and Decision Tree)
    const unifiedOrders = Math.max(0, Math.round((ridgePred + dtPred) / 2));
    const rawUnifiedSales = Math.max(0, (ridgeSalesPred + dtSalesPred) / 2);
    
    let categorySalesMultiplier = 1.0;
    if (targetCategory !== 'all') {
        const totalCatQ = telemetryData.daily_data.reduce((s, r) => s + (r.category_sales[targetCategory] || 0), 0);
        const totalAllQ = telemetryData.daily_data.reduce((s, r) => s + r.total_items_sold, 0);
        categorySalesMultiplier = totalCatQ / (totalAllQ || 1);
    }
    
    const unifiedSales = Math.round(rawUnifiedSales * categorySalesMultiplier);

    document.getElementById("forecast-orders").innerText = unifiedOrders;
    document.getElementById("forecast-sales").innerText = "₹" + unifiedSales.toLocaleString();

    renderRidgeWaterfall(targetModelName, featureParams);
}

function getNormalizedFeatureVector(params) {
    const scale = modelParams.scale_params;
    
    const tempScaled = (params.tempVal - scale.temperature.mean) / scale.temperature.std;
    const rainScaled = (params.rainfall - scale.rainfall.mean) / scale.rainfall.std;
    const priceScaled = (params.priceVal - scale.avg_price.mean) / scale.avg_price.std;

    return [
        1.0,         // Constant
        tempScaled,
        rainScaled,
        params.isRainy,
        params.isHoliday,
        priceScaled
    ];
}

function predictRidge(modelName, params) {
    const model = modelParams.models[modelName].ridge;
    const X = getNormalizedFeatureVector(params);
    let pred = 0;
    for (let i = 0; i < X.length; i++) {
        pred += X[i] * model.weights[i];
    }
    return Math.max(0, pred);
}

function predictDecisionTree(modelName, params) {
    const model = modelParams.models[modelName].decision_tree;
    const X = getNormalizedFeatureVector(params);
    
    function traverse(node, xi) {
        if (node.value !== undefined) return node.value;
        if (xi[node.featureIndex] <= node.threshold) {
            return traverse(node.left, xi);
        } else {
            return traverse(node.right, xi);
        }
    }
    
    return Math.max(0, traverse(model.tree, X));
}

function renderRidgeWaterfall(modelName, params) {
    const model = modelParams.models[modelName].ridge;
    const X = getNormalizedFeatureVector(params);
    const container = document.getElementById("ridge-waterfall");
    container.innerHTML = "";

    const featureDisplayNames = [
        "Baseline",
        "Temperature (Weather)",
        "Rainfall (Weather)",
        "Is Rainy (Weather)",
        "Is Holiday (Holidays)",
        "Price of the Stock (Price)"
    ];

    const contributions = X.map((xi, idx) => {
        return {
            name: featureDisplayNames[idx],
            val: xi * model.weights[idx]
        };
    });

    const maxVal = Math.max(...contributions.map(c => Math.abs(c.val)));

    contributions.forEach(c => {
        const row = document.createElement("div");
        row.className = "waterfall-row";

        const factor = document.createElement("div");
        factor.className = "wf-factor";
        
        let icon = "fa-ellipsis";
        if (c.name.includes("Baseline")) icon = "fa-warehouse";
        else if (c.name.includes("Price")) icon = "fa-tag";
        else if (c.name.includes("Holiday")) icon = "fa-gift";
        else if (c.name.includes("Temp")) icon = "fa-thermometer-half";
        else if (c.name.includes("Rain")) icon = "fa-umbrella";
        
        factor.innerHTML = `<i class="fa-solid ${icon} text-muted"></i> <span>${c.name}</span>`;

        const barContainer = document.createElement("div");
        barContainer.className = "wf-bar-container";

        const bar = document.createElement("div");
        bar.className = "wf-bar";

        const widthPercent = maxVal > 0 ? (Math.abs(c.val) / maxVal) * 90 : 0;

        if (c.name === "Baseline") {
            bar.style.backgroundColor = "var(--text-secondary)";
            bar.style.left = "0%";
            bar.style.width = widthPercent + "%";
        } else if (c.val >= 0) {
            bar.style.backgroundColor = "var(--green)";
            bar.style.left = "50%";
            bar.style.width = (widthPercent / 2) + "%";
        } else {
            bar.style.backgroundColor = "var(--red)";
            bar.style.left = (50 - (widthPercent / 2)) + "%";
            bar.style.width = (widthPercent / 2) + "%";
        }

        barContainer.appendChild(bar);

        const val = document.createElement("div");
        val.className = "wf-val";
        val.classList.add(c.name === "Baseline" ? "text-white" : (c.val >= 0 ? "text-green" : "text-red"));
        val.innerText = (c.val >= 0 && c.name !== "Baseline" ? "+" : "") + c.val.toFixed(2);

        row.appendChild(factor);
        row.appendChild(barContainer);
        row.appendChild(val);
        container.appendChild(row);
    });
}


// ==========================================================================
// TAB: MODEL INSIGHTS CONTROLLER
// ==========================================================================

function initInsightsTab() {
    populateValidationMetrics();
    renderWeightsChart();
}

function populateValidationMetrics() {
    const models = modelParams.models;
    const ordersRidge = models.total_orders.ridge.metrics;
    const ordersDT = models.total_orders.decision_tree.metrics;

    document.getElementById("m-ridge-train-r2").innerText = ordersRidge.train.r2;
    document.getElementById("m-ridge-train-mae").innerText = ordersRidge.train.mae;
    document.getElementById("m-ridge-train-rmse").innerText = ordersRidge.train.rmse;

    document.getElementById("m-ridge-test-r2").innerText = ordersRidge.test.r2;
    document.getElementById("m-ridge-test-mae").innerText = ordersRidge.test.mae;
    document.getElementById("m-ridge-test-rmse").innerText = ordersRidge.test.rmse;

    document.getElementById("m-dt-train-r2").innerText = ordersDT.train.r2;
    document.getElementById("m-dt-train-mae").innerText = ordersDT.train.mae;
    document.getElementById("m-dt-train-rmse").innerText = ordersDT.train.rmse;

    document.getElementById("m-dt-test-r2").innerText = ordersDT.test.r2;
    document.getElementById("m-dt-test-mae").innerText = ordersDT.test.mae;
    document.getElementById("m-dt-test-rmse").innerText = ordersDT.test.rmse;
}

function renderWeightsChart() {
    const ctx = document.getElementById('insightsWeightsChart').getContext('2d');
    const model = modelParams.models.total_orders.ridge;
    
    const featureDisplayNames = [
        "Baseline",
        "Temperature (Weather)",
        "Rainfall (Weather)",
        "Is Rainy (Weather)",
        "Is Holiday (Holidays)",
        "Price of the Stock (Price)"
    ];

    const names = featureDisplayNames.slice(1);
    const weights = model.weights.slice(1);

    const colors = weights.map(w => w >= 0 ? 'rgba(52, 211, 153, 0.75)' : 'rgba(248, 113, 113, 0.75)');
    const borderColors = weights.map(w => w >= 0 ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)');

    weightsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: names,
            datasets: [{
                label: 'Coefficient Impact Weight',
                data: weights,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#cbd5e1' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#cbd5e1' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
