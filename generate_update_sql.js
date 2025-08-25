const fs = require('fs');

function generateUpdateSQL() {
  try {
    const changes = JSON.parse(fs.readFileSync('categorization_changes.json', 'utf8'));
    
    let sql = `-- SQL příkazy pro aktualizaci kategorizace produktů\n`;
    sql += `-- Vygenerováno: ${new Date().toLocaleString()}\n`;
    sql += `-- Celkem změn: ${changes.length}\n\n`;
    
    sql += `-- Zálohování původních dat před aktualizací\n`;
    sql += `CREATE TABLE IF NOT EXISTS products_backup_${Date.now()} AS SELECT * FROM products;\n\n`;
    
    // Vytvoříme batch updaty pro lepší výkon
    const batchSize = 50;
    let currentBatch = 0;
    
    for (let i = 0; i < changes.length; i += batchSize) {
      currentBatch++;
      const batch = changes.slice(i, i + batchSize);
      
      sql += `-- Batch ${currentBatch}: Produkty ${i + 1}-${Math.min(i + batchSize, changes.length)}\n`;
      sql += `BEGIN;\n\n`;
      
      batch.forEach(change => {
        // Escapování hodnot pro SQL
        const escapeSql = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
        
        sql += `UPDATE products SET \n`;
        sql += `  category = ${escapeSql(change.new.category)},\n`;
        sql += `  subcategory = ${escapeSql(change.new.subcategory)},\n`;
        sql += `  gender = ${escapeSql(change.new.gender)},\n`;
        sql += `  updated_at = NOW()\n`;
        sql += `WHERE name = ${escapeSql(change.name)} AND sku = ${escapeSql(change.sku)};\n\n`;
      });
      
      sql += `COMMIT;\n\n`;
    }
    
    // Kontrolní dotazy
    sql += `-- Kontrolní dotazy pro ověření změn\n\n`;
    sql += `-- Počet produktů podle kategorií po aktualizaci\n`;
    sql += `SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC;\n\n`;
    
    sql += `-- Počet produktů podle pohlaví po aktualizaci\n`;
    sql += `SELECT gender, COUNT(*) as count FROM products GROUP BY gender ORDER BY count DESC;\n\n`;
    
    sql += `-- Kabelky podle podkategorií\n`;
    sql += `SELECT subcategory, COUNT(*) as count FROM products WHERE category = 'kabelky' GROUP BY subcategory ORDER BY count DESC;\n\n`;
    
    sql += `-- Ženské kabelky\n`;
    sql += `SELECT name, category, subcategory, gender FROM products WHERE gender = 'žena' AND category = 'kabelky' LIMIT 10;\n\n`;
    
    // Uložení SQL souboru
    fs.writeFileSync('update_product_categorization.sql', sql);
    
    console.log('✅ SQL script úspěšně vygenerován!');
    console.log(`📁 Soubor: update_product_categorization.sql`);
    console.log(`📊 Celkem SQL příkazů: ${changes.length}`);
    console.log(`📦 Rozděleno do ${Math.ceil(changes.length / batchSize)} batch-ů`);
    
    // Vytvoření rychlého přehledu změn
    const summary = {
      totalChanges: changes.length,
      categoryChanges: {},
      genderChanges: {},
      mostChangedProducts: {}
    };
    
    changes.forEach(change => {
      const catKey = `${change.old.category} → ${change.new.category}`;
      summary.categoryChanges[catKey] = (summary.categoryChanges[catKey] || 0) + 1;
      
      const genderKey = `${change.old.gender || 'NENÍ'} → ${change.new.gender}`;
      summary.genderChanges[genderKey] = (summary.genderChanges[genderKey] || 0) + 1;
    });
    
    fs.writeFileSync('categorization_summary.json', JSON.stringify(summary, null, 2));
    console.log('📋 Přehled změn uložen do: categorization_summary.json');
    
    console.log('\n📈 Přehled změn kategorií:');
    Object.entries(summary.categoryChanges)
      .sort((a, b) => b[1] - a[1])
      .forEach(([change, count]) => {
        console.log(`   ${change}: ${count}x`);
      });
    
    console.log('\n👥 Přehled změn pohlaví:');
    Object.entries(summary.genderChanges)
      .sort((a, b) => b[1] - a[1])
      .forEach(([change, count]) => {
        console.log(`   ${change}: ${count}x`);
      });
    
  } catch (error) {
    console.error('❌ Chyba při generování SQL:', error);
  }
}

console.log('🔧 Generuji SQL příkazy pro aktualizaci databáze...\n');
generateUpdateSQL();