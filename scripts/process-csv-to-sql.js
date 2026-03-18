const fs = require('fs');
const path = require('path');

// Function to escape SQL string values
function escapeSql(value) {
    if (value === null || value === undefined || value === '') return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return String(value);
    // Handle string values - escape single quotes and wrap in single quotes
    return `'${String(value).replace(/'/g, "''")}'`;
}

// Function to parse CSV line (handles quoted values)
function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            // Handle escaped quotes ("")
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
                continue;
            }
            inQuotes = !inQuotes;
            i++;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    values.push(current.trim());
    return values;
}

// Function to generate SQL inserts for a chunk of rows
function generateSqlInserts(tableName, columns, rows) {
    const columnList = columns.map(col => `"${col}"`).join(', ');
    
    const valueRows = rows.map(row => {
        const values = columns.map(col => {
            const value = row[col];
            return escapeSql(value);
        });
        return `(${values.join(', ')})`;
    }).join(',\n');
    
    return `INSERT INTO "${tableName}" (${columnList}) VALUES\n${valueRows}\nON CONFLICT (id) DO NOTHING;`;
}

// Main function
function main() {
    const scriptDir = __dirname;
    
    // PokemonSet columns (matching actual Supabase columns)
    const pokemonSetColumns = [
        'id', 'name', 'code', 'totalcards', 'releaseyear', 'imageurl', 'printedtotal'
    ];
    
    // Card columns (matching actual Supabase columns - lowercase)
    const cardColumns = [
        'id', 'gametype', 'name', 'supertype', 'setname', 'setcode', 'cardnumber', 'rarity', 'imageurl', 'pokemontcgid', 'language', 'createdat', 'setid'
    ];
    
    console.log('Starting CSV to SQL conversion...\n');
    
    // Process PokemonSet
    const pokemonSetPath = path.join(scriptDir, 'pokemon_set.csv');
    if (fs.existsSync(pokemonSetPath)) {
        console.log('Processing PokemonSet CSV...');
        const pokemonSetData = fs.readFileSync(pokemonSetPath, 'utf8');
        const pokemonSetLines = pokemonSetData.split('\n').filter(line => line.trim() !== '');
        
        // Skip header if present
        const hasHeader = pokemonSetLines[0]?.toLowerCase().includes('name');
        const pokemonSetRows = hasHeader ? pokemonSetLines.slice(1) : pokemonSetLines;
        
        console.log(`Found ${pokemonSetRows.length} PokemonSet rows`);
        
        // Parse all rows
        const parsedPokemonSets = pokemonSetRows.map(line => {
            const values = parseCsvLine(line);
            const row = {};
            pokemonSetColumns.forEach((col, i) => {
                row[col] = values[i] || '';
            });
            return row;
        });
        
        // Generate SQL (one batch for PokemonSet - likely small enough)
        const pokemonSetSql = generateSqlInserts('PokemonSet', pokemonSetColumns, parsedPokemonSets);
        
        // Save to file
        const pokemonSetOutputPath = path.join(scriptDir, 'pokemon_set_inserts.sql');
        fs.writeFileSync(pokemonSetOutputPath, pokemonSetSql);
        console.log(`Generated: ${pokemonSetOutputPath}`);
        console.log(`SQL size: ${(pokemonSetSql.length / 1024).toFixed(2)} KB\n`);
    } else {
        console.log('pokemon_set.csv not found. Skipping...\n');
    }
    
    // Process Card
    const cardPath = path.join(scriptDir, 'card.csv');
    if (fs.existsSync(cardPath)) {
        console.log('Processing Card CSV...');
        const cardData = fs.readFileSync(cardPath, 'utf8');
        const cardLines = cardData.split('\n').filter(line => line.trim() !== '');
        
        // Skip header if present
        const hasHeader = cardLines[0]?.toLowerCase().includes('name');
        const cardRows = hasHeader ? cardLines.slice(1) : cardLines;
        
        console.log(`Found ${cardRows.length} Card rows`);
        
        // Parse rows
        const parsedCards = cardRows.map(line => {
            const values = parseCsvLine(line);
            const row = {};
            cardColumns.forEach((col, i) => {
                row[col] = values[i] || '';
            });
            return row;
        });
        
        // Split into batches of 500 rows
        const batchSize = 500;
        const batches = [];
        for (let i = 0; i < parsedCards.length; i += batchSize) {
            batches.push(parsedCards.slice(i, i + batchSize));
        }
        
        console.log(`Splitting into ${batches.length} batches of ${batchSize} rows each`);
        
        // Generate SQL for each batch
        batches.forEach((batch, index) => {
            const cardSql = generateSqlInserts('Card', cardColumns, batch);
            const cardOutputPath = path.join(scriptDir, `card_inserts_batch_${index + 1}.sql`);
            fs.writeFileSync(cardOutputPath, cardSql);
            console.log(`Generated: card_inserts_batch_${index + 1}.sql (${(cardSql.length / 1024).toFixed(2)} KB)`);
        });
    } else {
        console.log('card.csv not found. Skipping...\n');
    }
    
    console.log('\n✅ Conversion complete!');
    console.log('Upload these SQL files to Supabase SQL Editor in order:');
    console.log('1. pokemon_set_inserts.sql');
    console.log('2. card_inserts_batch_1.sql');
    console.log('3. card_inserts_batch_2.sql');
    console.log('   ... and so on');
}

main();