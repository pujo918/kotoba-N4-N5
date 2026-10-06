const fs = require('fs');
const path = require('path');

const currentReadings = require('../data/readings.json');
const newN4 = require('./new_n4.json');
const newN3 = require('./new_n3.json');
const newN2 = require('./new_n2.json');

const allReadings = [...currentReadings, ...newN4, ...newN3, ...newN2];

console.log('Total combined readings:', allReadings.length);
const counts = {};
allReadings.forEach(r => counts[r.level] = (counts[r.level] || 0) + 1);
console.log('Readings by level:', counts);

const targetJson = path.join(__dirname, '..', 'data', 'readings.json');
const targetJs = path.join(__dirname, '..', 'data', 'readings.js');

fs.writeFileSync(targetJson, JSON.stringify(allReadings, null, 2), 'utf-8');
const jsCode = '/* Auto-generated fallback so readings work even on file:// */\nwindow.READINGS = ' + JSON.stringify(allReadings, null, 2) + ';\n';
fs.writeFileSync(targetJs, jsCode, 'utf-8');

console.log('SUCCESS: Written', allReadings.length, 'readings to data/readings.json and data/readings.js!');
