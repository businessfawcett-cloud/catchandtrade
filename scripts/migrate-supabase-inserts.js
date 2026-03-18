const fs = require('fs');
const path = require('path');

// Function to sanitize and escape SQL string values
function escapeSql(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return String(value);
    // Handle string values - escape single quotes and wrap in single quotes
    return `'${String(value).replace(/'/g, "''")}'`;
}

// Function to generate INSERT statement for a single row
function generateInsertStatement(tableName, columns, row) {
    const columnList = columns.map(col => `"${col}"`).join(', ');
    const values = columns.map(col => escapeSql(row[col])).join(', ');
    return `INSERT INTO "${tableName}" (${columnList}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`;
}

// Function to process CSV file and generate SQL inserts
function processCsvFile(filePath, tableName, columns) {
    console.log(`Processing ${filePath}...`);
    
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    // Remove header if present
    const hasHeader = lines[0].toLowerCase().includes(columns[0].toLowerCase());
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    console.log(`Found ${dataLines.length} rows to insert`);
    
    const sqlStatements = [];
    let batchSize = 500;
    let currentBatch = [];
    
    dataLines.forEach((line, index) => {
        const values = parseCsvLine(line);
        
        if (values.length === columns.length) {
            const row = {};
            columns.forEach((col, i) => {
                row[col] = values[i];
            });
            
            currentBatch.push(row);
            
            if (currentBatch.length >= batchSize || index === dataLines.length - 1) {
                const batchSql = currentBatch.map(row => 
                    generateInsertStatement(tableName, columns, row)
                ).join('\n');
                
                sqlStatements.push(batchSql);
                currentBatch = [];
            }
        }
    });
    
    return sqlStatements;
}

// Simple CSV line parser (handles quoted values)
function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values;
}

// Main function
async function main() {
    const pokemonSetColumns = [
        'id', 'name', 'series', 'printedTotal', 'total', 'legalities', 
        'ptcgoCode', 'releaseDate', 'updatedAt', 'createdAt', 'images', 'symbolUrl', 'logoUrl'
    ];
    
    const cardColumns = [
        'id', 'name', 'supertype', 'subtypes', 'level', 'hp', 'types', 
        'evolvesFrom', 'attacks', 'weaknesses', 'resistances', 'retreatCost', 
        'convertedRetreatCost', 'number', 'artist', 'rarity', 'flavorText', 
        'nationalPokedexNumbers', 'legalities', 'images', 'tcgplayer', 
        'cardmarket', 'set', 'setId', 'lastUpdated'
    ];

    try {
        // Process PokemonSet
        const pokemonSetSql = processCsvFile(
            './pokemon_set.csv',
            'PokemonSet',
            pokemonSetColumns
        );
        
        // Save to file
        fs.writeFileSync('./pokemon_set_inserts.sql', pokemonSetSql.join('\n\n'));
        console.log(`Generated ${pokemonSetSql.length} batch files for PokemonSet`);
        
        // Process Card (in chunks)
        const cardSql = processCsvFile(
            './card.csv',
            'Card',
            cardColumns
        );
        
        // Save to multiple files if needed
        cardSql.forEach((batch, index) => {
            fs.writeFileSync(`./card_inserts_batch_${index + 1}.sql`, batch);
        });
        
        console.log(`Generated ${cardSql.length} batch files for Card`);
        
        console.log('\nSQL files generated successfully!');
        console.log('Upload these to Supabase SQL Editor in order.');
        
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

main();