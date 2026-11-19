const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'blinkit data');
const outputFile = path.join(__dirname, 'processed_data.json');

// Seedable PRNG for reproducible simulation
function createPRNG(seed) {
    let current = seed;
    return function() {
        current = (current * 1664525 + 1013904223) % 4294967296;
        return current / 4294967296;
    };
}
const rand = createPRNG(42);

// Custom CSV Parser
function parseCSV(filePath) {
    console.log(`Parsing: ${path.basename(filePath)}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return { header: [], rows: [] };

    const header = parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        rows.push(parseCSVLine(lines[i]));
    }
    return { header, rows };
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Convert "DD-MM-YYYY" to "YYYY-MM-DD"
function convertInventoryDate(d) {
    const parts = d.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return d;
}

// Major holidays list (India 2023 & 2024)
const holidayList = new Set([
    '2023-01-26', '2024-01-26', // Republic Day
    '2023-03-08', '2024-03-25', // Holi
    '2023-04-07', '2024-03-29', // Good Friday
    '2023-04-22', '2024-04-11', // Eid-ul-Fitr
    '2023-08-15', '2024-08-15', // Independence Day
    '2023-10-02', '2024-10-02', // Gandhi Jayanti
    '2023-10-24', '2024-10-12', // Dussehra
    '2023-11-12', '2024-10-31', // Diwali
    '2023-12-25', '2024-12-25', // Christmas
]);

function isHoliday(dateStr) {
    return holidayList.has(dateStr);
}

// Get season based on month (0-indexed)
function getSeason(month) {
    if (month === 11 || month === 0 || month === 1) return 'Winter';
    if (month >= 2 && month <= 5) return 'Summer';
    if (month >= 6 && month <= 8) return 'Monsoon';
    return 'Autumn';
}

// Simulate temperature and rainfall for a given date
function simulateWeather(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth();
    const season = getSeason(month);
    
    let temp = 25;
    let rainProb = 0.05;
    
    if (season === 'Winter') {
        temp = 15 + rand() * 8; // 15°C to 23°C
        rainProb = 0.05;
    } else if (season === 'Summer') {
        temp = 32 + rand() * 10; // 32°C to 42°C
        rainProb = 0.08;
    } else if (season === 'Monsoon') {
        temp = 25 + rand() * 6; // 25°C to 31°C
        rainProb = 0.65;
    } else { // Autumn
        temp = 22 + rand() * 6; // 22°C to 28°C
        rainProb = 0.15;
    }
    
    const isRainy = rand() < rainProb;
    const rainfall = isRainy ? Math.round((5 + rand() * 45) * 10) / 10 : 0.0; // 5mm to 50mm
    
    let condition = 'Clear';
    if (isRainy) {
        condition = rainfall > 20 ? 'Heavy Rain' : 'Light Rain';
    } else if (temp > 38) {
        condition = 'Extreme Heat';
    } else if (temp < 15) {
        condition = 'Cold Wave';
    } else if (rand() < 0.2) {
        condition = 'Overcast';
    }
    
    return {
        temperature: Math.round(temp * 10) / 10,
        rainfall,
        is_rainy: isRainy ? 1 : 0,
        condition
    };
}

function run() {
    // 1. Load products
    const productsData = parseCSV(path.join(dataDir, 'blinkit_products.csv'));
    const productsMap = {};
    const categoriesList = new Set();
    const prodIdIdx = productsData.header.indexOf('product_id');
    const prodNameIdx = productsData.header.indexOf('product_name');
    const prodCatIdx = productsData.header.indexOf('category');
    const prodPriceIdx = productsData.header.indexOf('price');

    productsData.rows.forEach(r => {
        const pid = r[prodIdIdx];
        if (pid) {
            productsMap[pid] = {
                product_name: r[prodNameIdx],
                category: r[prodCatIdx],
                price: parseFloat(r[prodPriceIdx])
            };
            categoriesList.add(r[prodCatIdx]);
        }
    });

    // 2. Load order items and group by order_id
    const orderItemsData = parseCSV(path.join(dataDir, 'blinkit_order_items.csv'));
    const orderItemsMap = {};
    const itemOrderIdIdx = orderItemsData.header.indexOf('order_id');
    const itemProdIdIdx = orderItemsData.header.indexOf('product_id');
    const itemQtyIdx = orderItemsData.header.indexOf('quantity');
    const itemPriceIdx = orderItemsData.header.indexOf('unit_price');

    orderItemsData.rows.forEach(r => {
        const oid = r[itemOrderIdIdx];
        if (oid) {
            if (!orderItemsMap[oid]) orderItemsMap[oid] = [];
            orderItemsMap[oid].push({
                product_id: r[itemProdIdIdx],
                quantity: parseInt(r[itemQtyIdx], 10),
                unit_price: parseFloat(r[itemPriceIdx])
            });
        }
    });

    // 3. Load orders and aggregate daily metrics
    const ordersData = parseCSV(path.join(dataDir, 'blinkit_orders.csv'));
    const dailyData = {};
    const orderDateIdx = ordersData.header.indexOf('order_date');
    const orderTotalIdx = ordersData.header.indexOf('order_total');
    const orderIdIdx = ordersData.header.indexOf('order_id');

    ordersData.rows.forEach(r => {
        const rawDate = r[orderDateIdx];
        const orderId = r[orderIdIdx];
        if (!rawDate || !orderId) return;

        const dateStr = rawDate.split(' ')[0]; // Extract YYYY-MM-DD
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                total_sales: 0,
                total_orders: 0,
                total_items_sold: 0,
                category_sales: {}
            };
            categoriesList.forEach(c => {
                dailyData[dateStr].category_sales[c] = 0;
            });
        }

        const orderTotal = parseFloat(r[orderTotalIdx]) || 0;
        dailyData[dateStr].total_sales += orderTotal;
        dailyData[dateStr].total_orders += 1;

        const items = orderItemsMap[orderId] || [];
        items.forEach(item => {
            dailyData[dateStr].total_items_sold += item.quantity;
            const prod = productsMap[item.product_id];
            
            if (prod) {
                dailyData[dateStr].category_sales[prod.category] = (dailyData[dateStr].category_sales[prod.category] || 0) + item.quantity;
            }
        });
    });

    // 4. Generate sequence of days and enrich with weather, holidays, and average stock price
    const dates = Object.keys(dailyData).sort();
    if (dates.length === 0) {
        console.error('No dates found in orders!');
        return;
    }
    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);
    console.log(`Generating timeline: ${dates[0]} to ${dates[dates.length - 1]}`);

    const dailyTimeline = [];
    const currentDate = new Date(minDate);

    while (currentDate <= maxDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const isHolidayFlag = isHoliday(dateStr) ? 1 : 0;
        const weather = simulateWeather(dateStr);

        const record = dailyData[dateStr] || {
            total_sales: 0,
            total_orders: 0,
            total_items_sold: 0,
            category_sales: {}
        };

        if (Object.keys(record.category_sales).length === 0) {
            categoriesList.forEach(c => {
                record.category_sales[c] = 0;
            });
        }

        // Calculate average price of products sold (Stock Price indicator)
        const avgPrice = record.total_items_sold > 0 
            ? record.total_sales / record.total_items_sold 
            : 520.0; // Baseline average stock price

        dailyTimeline.push({
            date: dateStr,
            year,
            month: currentDate.getMonth() + 1,
            day_of_month: currentDate.getDate(),
            is_holiday: isHolidayFlag,
            season: getSeason(currentDate.getMonth()),
            temperature: weather.temperature,
            rainfall: weather.rainfall,
            is_rainy: weather.is_rainy,
            weather_condition: weather.condition,
            total_orders: record.total_orders,
            total_sales: Math.round(record.total_sales * 100) / 100,
            total_items_sold: record.total_items_sold,
            category_sales: record.category_sales,
            avg_price: Math.round(avgPrice * 100) / 100
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Processed ${dailyTimeline.length} days of simplified data.`);

    const outputJSON = {
        categories: Array.from(categoriesList),
        products: Object.keys(productsMap).map(id => ({ id, ...productsMap[id] })),
        daily_data: dailyTimeline
    };

    fs.writeFileSync(outputFile, JSON.stringify(outputJSON, null, 2), 'utf-8');
    console.log(`Saved processed data to: ${outputFile}`);
}

run();
