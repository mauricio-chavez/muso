const fs = require('fs');
const path = require('path');

const db = {};

const modelsDir = path.join(__dirname, 'models');
fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const modelPath = path.join(__dirname, 'models', file);
    const model = require(modelPath);
    db[model.name] = model;
  });

module.exports = db;
