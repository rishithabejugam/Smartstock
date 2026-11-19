# 🛒 SmartStock – Retail Demand Forecasting & Inventory Optimization

<p align="center">   <strong>Demand Intelligence AI</strong>   <br/>   An intelligent retail demand forecasting and inventory optimization system powered by Machine Learning.   <br/><br/>   Predict Demand • Analyze Trends • Optimize Inventory • Make Smarter Decisions </p>


---

## 📌 Overview

**SmartStock** is an AI-powered retail demand forecasting and inventory optimization system designed to help retailers make smarter, data-driven business decisions.

Managing inventory is one of the biggest challenges in the retail industry. Overstocking increases storage costs, while understocking results in lost sales and customer dissatisfaction.

SmartStock addresses these challenges using **LightGBM (Light Gradient Boosting Machine)** to analyze historical retail data and predict future demand.

The system considers multiple factors, including historical sales, product pricing, discounts, inventory levels, seasonal trends, holidays, and promotional activities.

It combines machine learning predictions with interactive analytics to provide actionable insights for better demand forecasting and inventory planning.

### 🎯 Key Objectives

- Predict future retail demand using machine learning.
- Analyze historical sales and demand patterns.
- Identify factors influencing customer demand.
- Estimate future sales revenue.
- Identify potential stock shortages.
- Support inventory planning and replenishment decisions.

---

## ✨ Key Features

| Feature                     | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| 📈 Demand Forecasting       | Predicts future retail demand using LightGBM.             |
| 📊 Interactive Dashboard    | Displays retail performance and historical sales trends.  |
| 💰 Sales Prediction         | Estimates future sales revenue.                           |
| 📦 Inventory Intelligence   | Supports stock monitoring and replenishment decisions.    |
| 🌦️ Weather Impact Analysis | Analyzes the influence of weather conditions on demand.   |
| 📅 Holiday Impact Analysis  | Identifies demand variations during holidays.             |
| 🏷️ Price Impact Analysis   | Evaluates how pricing influences customer demand.         |
| 🔍 Prediction Insights      | Highlights factors influencing forecasts.                 |
| 🛍️ Category-wise Analysis  | Provides insights into different product categories.      |
| ⚡ Scenario Simulation       | Allows users to explore different forecasting conditions. |

---

## 🖥️ Application Preview

SmartStock features a modern dark-themed dashboard with interactive visualizations and forecasting controls.

### 1. Dashboard Overview

The dashboard provides a centralized view of retail performance, historical sales trends, and factors influencing demand.
<img width="1249" height="601" alt="image" src="https://github.com/user-attachments/assets/1692e7ad-cec9-4805-b346-e3e46561daaa" />



**Dashboard Components**

| Component                        | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| Orders Analyzed                  | Displays the number of historical orders analyzed.            |
| Sales Revenue                    | Shows total sales revenue and average revenue per order.      |
| Average Stock Price              | Displays the average price of stock items.                    |
| Holiday Volume Impact            | Highlights differences between holiday and non-holiday sales. |
| Historical Sales & Demand Trends | Visualizes historical order counts and average prices.        |
| Weather Impact                   | Shows the relationship between weather conditions and demand. |
| Price Impact                     | Analyzes how product pricing influences demand.               |
| Holiday Impact                   | Compares demand during holidays and normal days.              |

### 2. Demand Predictor

The Demand Predictor allows users to simulate different business and environmental conditions to estimate future retail demand.
<img width="1239" height="629" alt="image" src="https://github.com/user-attachments/assets/641bb90b-c436-4e8e-946a-ecb513045948" />



**Prediction Parameters**

| Parameter          | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| Target Date        | Selects the date for demand prediction.                    |
| Holiday Selection  | Indicates whether the selected date is a holiday.          |
| Weather State      | Specifies the weather conditions.                          |
| Temperature        | Allows users to simulate different temperature conditions. |
| Average Item Price | Evaluates the influence of product pricing.                |
| Forecast Category  | Selects the forecasting category or scope.                 |

**Prediction Results**

| Output             | Description                                     |
| ------------------ | ----------------------------------------------- |
| Predicted Demand   | Displays the estimated number of future orders. |
| Predicted Sales    | Displays estimated sales revenue.               |
| Prediction Drivers | Visualizes factors influencing the forecast.    |

---

## 🧰 Technology Stack

| Category              | Technologies          |
| --------------------- | --------------------- |
| Programming Languages | Python, JavaScript    |
| Machine Learning      | LightGBM              |
| Data Processing       | Pandas, NumPy         |
| ML Utilities          | Scikit-learn          |
| Backend               | Node.js               |
| Frontend              | HTML, CSS, JavaScript |
| Data Storage          | CSV, JSON             |
| Model Serialization   | Pickle / Joblib       |

---

## 📂 Dataset Description

**Dataset:** Blinkit Retail Inventory Dataset

The project uses approximately **75,172 records** containing retail sales, inventory, pricing, discounts, and promotional information.

### Important Dataset Features

| Feature             | Description                                   |
| ------------------- | --------------------------------------------- |
| Units Sold          | Number of units sold.                         |
| Inventory Level     | Available stock of a product.                 |
| Units Ordered       | Number of units ordered for replenishment.    |
| Price               | Selling price of the product.                 |
| Discount            | Discount offered on the product.              |
| Competitor Pricing  | Pricing information from competing retailers. |
| Product Category    | Category of the product.                      |
| Region              | Geographical region associated with sales.    |
| Year / Month / Week | Time-related information.                     |
| Seasonality         | Seasonal demand information.                  |
| Holiday / Promotion | Indicates holiday or promotional periods.     |

**Target Variable:** Units Sold

---

## ⚙️ Machine Learning Workflow

SmartStock follows an end-to-end machine learning pipeline.

1. **Data Collection:** Load historical retail data.
2. **Data Preprocessing:** Handle missing values, duplicates, and inconsistent records.
3. **Exploratory Data Analysis:** Analyze relationships between sales, pricing, inventory, and seasonal factors.
4. **Feature Engineering:** Extract relevant numerical, categorical, and temporal features.
5. **Model Training:** Train a LightGBM regression model.
6. **Demand Prediction:** Generate future demand estimates.
7. **Inventory Analysis:** Compare predicted demand with available inventory.
8. **Visualization:** Display predictions and business insights through the dashboard.

### Machine Learning Model – LightGBM

SmartStock uses **LightGBM (Light Gradient Boosting Machine)**, a gradient boosting framework based on decision trees.

It is suitable for structured retail datasets and helps identify complex relationships between multiple demand-related features.

**Why LightGBM?**

- Efficient training on structured datasets.
- Captures nonlinear relationships between features.
- Handles complex interactions between retail variables.
- Provides fast prediction performance.
- Supports feature importance analysis.

### Model Performance

| Evaluation Metric | Score |
| ----------------- | ----: |
| MAE               |  8.66 |
| RMSE              | 10.66 |
| R² Score          |  0.96 |

*Previously recorded evaluation results for the LightGBM model.*

---

## 📦 Inventory Optimization

SmartStock connects predicted demand with available inventory to support replenishment decisions.

### Reorder Quantity Calculation

**Reorder Quantity = max(0, Predicted Demand − Available Inventory)**

**Example:**

| Parameter                    |     Value |
| ---------------------------- | --------: |
| Predicted Demand             | 150 units |
| Available Inventory          | 100 units |
| Recommended Reorder Quantity |  50 units |

### Inventory Status

| Condition                                              | Status           | Recommended Action       |
| ------------------------------------------------------ | ---------------- | ------------------------ |
| Available stock is below predicted demand              | Low Stock        | Consider replenishment.  |
| Available stock meets predicted demand                 | Sufficient Stock | Maintain inventory.      |
| Available stock significantly exceeds predicted demand | Excess Stock     | Review inventory levels. |

---

## 🏗️ System Architecture

SmartStock integrates data processing, machine learning, inventory analysis, and a web-based dashboard.

```text
             BLINKIT DATASET
                    |
                    v
             DATA PROCESSING
                    |
                    v
            FEATURE ENGINEERING
                    |
                    v
              LIGHTGBM MODEL
                    |
                    v
             DEMAND PREDICTION
                    |
                    v
             INVENTORY ANALYSIS
                    |
                    v
              BACKEND SERVER
                    |
                    v
              WEB APPLICATION
                    |
                    v
           INTERACTIVE DASHBOARD
                    |
                    v
              RETAIL INSIGHTS
```

---

## 📁 Project Structure

```text
Smartstock/
│
├── blinkit data/
│
├── models/
│   └── lightgbm_model.pkl
│
├── notebooks/
│   └── model_training.ipynb
│
├── screenshots/
│   ├── dashboard-overview.png
│   └── demand-predictor.png
│
├── public/
│   ├── index.html
│   ├── css/
│   └── js/
│
├── data_processor.js
├── trainer.js
├── server.js
│
├── processed_data.json
├── trained_model.json
│
├── package.json
├── requirements.txt
└── README.md
```

---

## 🚀 Installation and Setup

### Prerequisites

- Python 3.9+
- Node.js
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/rishithabejugam/Smartstock.git
cd Smartstock
```

### 2. Install Dependencies

```bash
npm install
```

Install Python machine learning dependencies:

```bash
pip install lightgbm pandas numpy scikit-learn joblib
```

### 3. Run the Application

```bash
npm start
```

Open the local URL displayed in your terminal.

---

## 🔮 Future Enhancements

- Real-time inventory tracking.
- Automated stock replenishment.
- Explainable AI using SHAP.
- Advanced time-series forecasting.
- Multi-store demand prediction.
- Cloud deployment.
- Automated demand alerts.

---

## 👩‍💻 Project Information

| Attribute    | Details                                            |
| ------------ | -------------------------------------------------- |
| Project Name | SmartStock                                         |
| Domain       | Machine Learning / Retail Analytics                |
| Algorithm    | LightGBM Regressor                                 |
| Dataset      | Blinkit Retail Inventory Dataset                   |
| Dataset Size | Approximately 75,172 records                       |
| Backend      | Node.js                                            |
| Frontend     | HTML, CSS, JavaScript                              |
| Objective    | Retail Demand Forecasting & Inventory Optimization |

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome!

1. Fork this repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit and push your changes.
5. Submit a Pull Request.

---

⭐ Support
If you find SmartStock interesting or useful, consider giving this repository a ⭐ on GitHub!

<p align="center">
  <strong>SmartStock – Turning Retail Data into Smarter Inventory Decisions.</strong>
  <br/>
  <em>Predict Better. Stock Smarter. Grow Faster.</em>
</p>
