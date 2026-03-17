const fs = require('fs');
const path = require('path');

const targetFile = 'c:/Users/Shaun/Desktop/LessPaper/LESSPAPER/backend/src/app/documents/services/documents-service.js';

let content = fs.readFileSync(targetFile, 'utf8');

// Replace standard template literals going up two levels to three levels
content = content.replace(/`\.\.\/\.\.\/uploads\//g, '`../../../uploads/');

// Fix the over-replaced 4-levels deep issue that might have existed
content = content.replace(/"\.\.",\s*"\.\.",\s*"\.\.",\s*"\.\.",\s*"uploads"/g, '"..", "..", "..", "uploads"');

fs.writeFileSync(targetFile, content, 'utf8');

console.log("Replacements complete part 2.");
