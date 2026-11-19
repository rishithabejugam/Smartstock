const fs = require('fs');
const path = require('path');

const processedDataFile = path.join(__dirname, 'processed_data.json');
const outputFile = path.join(__dirname, 'trained_model.json');

// Ridge Regression Implementation
class RidgeRegression {
    constructor(alpha = 0.5, lr = 0.05, epochs = 2000) {
        this.alpha = alpha;
        this.lr = lr;
        this.epochs = epochs;
        this.weights = null;
    }

    train(X, y) {
        const numSamples = X.length;
        const numFeatures = X[0].length;
        this.weights = new Array(numFeatures).fill(0);

        for (let epoch = 0; epoch < this.epochs; epoch++) {
            const gradients = new Array(numFeatures).fill(0);
            
            for (let i = 0; i < numSamples; i++) {
                const xi = X[i];
                const yi = y[i];
                let prediction = 0;
                for (let j = 0; j < numFeatures; j++) {
                    prediction += xi[j] * this.weights[j];
                }
                const error = prediction - yi;
                for (let j = 0; j < numFeatures; j++) {
                    gradients[j] += error * xi[j];
                }
            }

            for (let j = 0; j < numFeatures; j++) {
                const reg = j === 0 ? 0 : this.alpha * this.weights[j];
                this.weights[j] -= (this.lr / numSamples) * (gradients[j] + reg);
            }
        }
    }

    predict(X) {
        return X.map(xi => {
            let pred = 0;
            for (let j = 0; j < this.weights.length; j++) {
                pred += xi[j] * this.weights[j];
            }
            return pred;
        });
    }
}

// Decision Tree Regressor Node
class DecisionTreeNode {
    constructor() {
        this.featureIndex = null;
        this.threshold = null;
        this.left = null;
        this.right = null;
        this.value = null;
    }

    toJSON() {
        if (this.value !== null) {
            return { value: this.value };
        }
        return {
            featureIndex: this.featureIndex,
            threshold: this.threshold,
            left: this.left.toJSON(),
            right: this.right.toJSON()
        };
    }
}

// Decision Tree Regressor Implementation
class DecisionTreeRegressor {
    constructor(maxDepth = 4, minSamplesSplit = 10) {
        this.maxDepth = maxDepth;
        this.minSamplesSplit = minSamplesSplit;
        this.root = null;
    }

    train(X, y) {
        this.root = this._buildTree(X, y, 0);
    }

    _buildTree(X, y, depth) {
        const numSamples = X.length;
        const numFeatures = X[0].length;

        if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || this._allSame(y)) {
            const leaf = new DecisionTreeNode();
            leaf.value = this._mean(y);
            return leaf;
        }

        let bestScore = Infinity;
        let bestFeature = null;
        let bestThreshold = null;
        let bestLeftIdx = [];
        let bestRightIdx = [];

        // Skip feature 0 (constant term 1.0)
        for (let f = 1; f < numFeatures; f++) {
            const values = X.map(xi => xi[f]);
            const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
            
            for (let i = 0; i < uniqueValues.length - 1; i++) {
                const threshold = (uniqueValues[i] + uniqueValues[i+1]) / 2;
                
                const leftIdx = [];
                const rightIdx = [];
                for (let s = 0; s < numSamples; s++) {
                    if (X[s][f] <= threshold) {
                        leftIdx.push(s);
                    } else {
                        rightIdx.push(s);
                    }
                }

                if (leftIdx.length === 0 || rightIdx.length === 0) continue;

                const leftY = leftIdx.map(idx => y[idx]);
                const rightY = rightIdx.map(idx => y[idx]);
                
                const score = this._variance(leftY) * leftY.length + this._variance(rightY) * rightY.length;

                if (score < bestScore) {
                    bestScore = score;
                    bestFeature = f;
                    bestThreshold = threshold;
                    bestLeftIdx = leftIdx;
                    bestRightIdx = rightIdx;
                }
            }
        }

        if (bestFeature === null) {
            const leaf = new DecisionTreeNode();
            leaf.value = this._mean(y);
            return leaf;
        }

        const node = new DecisionTreeNode();
        node.featureIndex = bestFeature;
        node.threshold = bestThreshold;

        const leftX = bestLeftIdx.map(idx => X[idx]);
        const leftY = bestLeftIdx.map(idx => y[idx]);
        const rightX = bestRightIdx.map(idx => X[idx]);
        const rightY = bestRightIdx.map(idx => y[idx]);

        node.left = this._buildTree(leftX, leftY, depth + 1);
        node.right = this._buildTree(rightX, rightY, depth + 1);

        return node;
    }

    _mean(y) {
        return y.reduce((sum, val) => sum + val, 0) / y.length;
    }

    _variance(y) {
        const m = this._mean(y);
        return y.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / y.length;
    }

    _allSame(y) {
        return y.every(val => val === y[0]);
    }
}

// Compute metrics
function evaluate(yTrue, yPred) {
    const n = yTrue.length;
    let sumAbsErr = 0;
    let sumSqErr = 0;
    let sumY = 0;

    for (let i = 0; i < n; i++) {
        const err = yTrue[i] - yPred[i];
        sumAbsErr += Math.abs(err);
        sumSqErr += err * err;
        sumY += yTrue[i];
    }

    const meanY = sumY / n;
    let totalVar = 0;
    for (let i = 0; i < n; i++) {
        totalVar += Math.pow(yTrue[i] - meanY, 2);
    }

    const mae = sumAbsErr / n;
    const rmse = Math.sqrt(sumSqErr / n);
    const r2 = 1 - (sumSqErr / totalVar);

    return {
        mae: Math.round(mae * 100) / 100,
        rmse: Math.round(rmse * 100) / 100,
        r2: Math.round(r2 * 1000) / 1000
    };
}

function run() {
    const rawData = JSON.parse(fs.readFileSync(processedDataFile, 'utf-8'));
    const dailyRecords = rawData.daily_data;
    const categories = rawData.categories;

    // Feature details (exactly weather, holidays, and price)
    const featureNames = [
        'constant',
        'temperature',
        'rainfall',
        'is_rainy',
        'is_holiday',
        'avg_price'
    ];

    // Chronological split (80% Train, 20% Test)
    const splitIndex = Math.floor(dailyRecords.length * 0.8);
    const trainRecords = dailyRecords.slice(0, splitIndex);
    const testRecords = dailyRecords.slice(splitIndex);

    console.log(`Training set: ${trainRecords.length} days`);
    console.log(`Test set: ${testRecords.length} days`);

    // Scale parameters
    const continuousFeatures = ['temperature', 'rainfall', 'avg_price'];
    const scaleParams = {};

    continuousFeatures.forEach(feat => {
        const values = trainRecords.map(r => r[feat]);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance) || 1.0;
        scaleParams[feat] = { mean, std };
    });

    // Helper to extract feature vector
    function getFeatureVector(r) {
        const tempScaled = (r.temperature - scaleParams.temperature.mean) / scaleParams.temperature.std;
        const rainScaled = (r.rainfall - scaleParams.rainfall.mean) / scaleParams.rainfall.std;
        const priceScaled = (r.avg_price - scaleParams.avg_price.mean) / scaleParams.avg_price.std;

        return [
            1.0,         // Constant
            tempScaled,
            rainScaled,
            r.is_rainy,
            r.is_holiday,
            priceScaled
        ];
    }

    const XTrain = trainRecords.map(getFeatureVector);
    const XTest = testRecords.map(getFeatureVector);

    const targets = ['total_orders', 'total_sales', ...categories.map(c => `category:${c}`)];
    const trainedModels = {};

    targets.forEach(target => {
        let yTrain, yTest;
        
        if (target.startsWith('category:')) {
            const catName = target.replace('category:', '');
            yTrain = trainRecords.map(r => r.category_sales[catName] || 0);
            yTest = testRecords.map(r => r.category_sales[catName] || 0);
        } else {
            yTrain = trainRecords.map(r => r[target]);
            yTest = testRecords.map(r => r[target]);
        }

        // Train Ridge Regression
        const ridgeModel = new RidgeRegression(0.5, 0.05, 2000);
        ridgeModel.train(XTrain, yTrain);
        const ridgeTrainPred = ridgeModel.predict(XTrain);
        const ridgeTestPred = ridgeModel.predict(XTest);

        const ridgeTrainMetrics = evaluate(yTrain, ridgeTrainPred);
        const ridgeTestMetrics = evaluate(yTest, ridgeTestPred);

        // Train Decision Tree
        const dtModel = new DecisionTreeRegressor(4, 10);
        dtModel.train(XTrain, yTrain);
        
        function predictTreeRow(node, xi) {
            if (node.value !== null) return node.value;
            if (xi[node.featureIndex] <= node.threshold) {
                return predictTreeRow(node.left, xi);
            } else {
                return predictTreeRow(node.right, xi);
            }
        }
        const dtTrainPred = XTrain.map(xi => predictTreeRow(dtModel.root, xi));
        const dtTestPred = XTest.map(xi => predictTreeRow(dtModel.root, xi));

        const dtTrainMetrics = evaluate(yTrain, dtTrainPred);
        const dtTestMetrics = evaluate(yTest, dtTestPred);

        trainedModels[target] = {
            ridge: {
                weights: ridgeModel.weights,
                metrics: {
                    train: ridgeTrainMetrics,
                    test: ridgeTestMetrics
                }
            },
            decision_tree: {
                tree: dtModel.root.toJSON(),
                metrics: {
                    train: dtTrainMetrics,
                    test: dtTestMetrics
                }
            }
        };

        console.log(`\n--- Target: ${target} ---`);
        console.log(`Ridge R2 (Train/Test): ${ridgeTrainMetrics.r2} / ${ridgeTestMetrics.r2} | MAE: ${ridgeTestMetrics.mae}`);
        console.log(`DT R2 (Train/Test): ${dtTrainMetrics.r2} / ${dtTestMetrics.r2} | MAE: ${dtTestMetrics.mae}`);
    });

    const outputModelJSON = {
        features: featureNames,
        scale_params: scaleParams,
        models: trainedModels
    };

    fs.writeFileSync(outputFile, JSON.stringify(outputModelJSON, null, 2), 'utf-8');
    console.log(`\nSuccessfully trained simplified models and saved to: ${outputFile}`);
}

run();
