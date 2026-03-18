const fs = require('fs');
const path = require('path');

const scriptDir = __dirname;

// Function to extract just the VALUES part from a batch file
function extractValuesFromBatch(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find start of VALUES
    const valuesStart = content.indexOf('VALUES');
    if (valuesStart === -1) return '';
    
    // Find end (ON CONFLICT)
    const conflictStart = content.indexOf('ON CONFLICT', valuesStart);
    if (conflictStart === -1) return '';
    
    // Extract values section
    let valuesSection = content.substring(valuesStart + 6, conflictStart).trim();
    
    // Remove leading/trailing commas and whitespace
    valuesSection = valuesSection.replace(/^,/, '').replace(/,$/, '').trim();
    
    return valuesSection;
}

// Combine batches into groups
function combineBatches(startBatch, endBatch, outputFilename) {
    console.log(`Combining batches ${startBatch} to ${endBatch}...`);
    
    let allValues = '';
    
    for (let i = startBatch; i <= endBatch; i++) {
        const batchFile = path.join(scriptDir, `card_inserts_batch_${i}.sql`);
        
        if (fs.existsSync(batchFile)) {
            const values = extractValuesFromBatch(batchFile);
            if (values) {
                if (allValues.length > 0) {
                    // Add comma separator between batches
                    allValues += ',\n';
                }
                allValues += values;
            }
        }
    }
    
    // Ensure last row doesn't have trailing comma
    if (allValues.endsWith(',\n')) {
        allValues = allValues.slice(0, -2);
    }
    
    // Create combined SQL
    const sql = `INSERT INTO "Card" ("id", "gametype", "name", "supertype", "setname", "setcode", "cardnumber", "rarity", "imageurl", "pokemontcgid", "language", "createdat", "setid") VALUES\n${allValues}\nON CONFLICT (id) DO NOTHING;`;
    
    const outputPath = path.join(scriptDir, outputFilename);
    fs.writeFileSync(outputPath, sql);
    
    console.log(`Created: ${outputFilename} (${(sql.length / 1024 / 1024).toFixed(2)} MB)`);
}

// Create combined files
combineBatches(1, 8, 'cards_batches_1_to_8.sql');
combineBatches(9, 16, 'cards_batches_9_to_16.sql');
combineBatches(17, 24, 'cards_batches_17_to_24.sql');
combineBatches(25, 32, 'cards_batches_25_to_32.sql');
combineBatches(33, 41, 'cards_batches_33_to_41.sql');

console.log('\n✅ Combined files created!');
console.log('Upload these 5 files to Supabase SQL Editor in order.');