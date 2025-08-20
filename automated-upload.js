const fs = require('fs');
const path = require('path');

// Function to read and execute SQL batches
async function uploadAllBatches() {
    console.log('🚀 Začínam automatické nahrávanie všetkých batch-ov do Supabase...');
    
    // Find all batch files
    const files = fs.readdirSync('.');
    const batchFiles = files.filter(file => file.startsWith('batch_') && file.endsWith('.sql'))
                           .sort((a, b) => {
                               const numA = parseInt(a.match(/batch_(\d+)\.sql/)[1]);
                               const numB = parseInt(b.match(/batch_(\d+)\.sql/)[1]);
                               return numA - numB;
                           });
    
    console.log(`📁 Nájdených ${batchFiles.length} batch súborov`);
    
    // Start from batch 2 since batch 1 is already uploaded
    const startBatch = 2;
    const batchesToUpload = batchFiles.filter(file => {
        const batchNum = parseInt(file.match(/batch_(\d+)\.sql/)[1]);
        return batchNum >= startBatch;
    });
    
    console.log(`⏭️ Preskakujem batch 1 (už nahraný)`);
    console.log(`📤 Nahrávam ${batchesToUpload.length} zostávajúcich batch-ov...\n`);
    
    // Process each batch
    for (let i = 0; i < batchesToUpload.length; i++) {
        const batchFile = batchesToUpload[i];
        const batchNum = parseInt(batchFile.match(/batch_(\d+)\.sql/)[1]);
        
        console.log(`📦 Spracovávam ${batchFile} (${i + 1}/${batchesToUpload.length})...`);
        
        try {
            const sqlContent = fs.readFileSync(batchFile, 'utf8');
            
            // Log the SQL content for verification
            console.log(`   📝 SQL príkaz pripravený (${sqlContent.length} znakov)`);
            
            // Here you would execute the SQL using MCP
            // For now, we'll just prepare the commands
            const outputFile = `mcp_command_${batchNum}.txt`;
            const mcpCommand = `MCP Command for batch ${batchNum}:\n\nrun_mcp("mcp.config.usrlocalmcp.supabase", "execute_sql", {\n  "project_id": "dbnfkzctensbpktgbsgn",\n  "query": ${JSON.stringify(sqlContent)}\n})\n\n`;
            
            fs.writeFileSync(outputFile, mcpCommand);
            console.log(`   ✅ MCP príkaz uložený do ${outputFile}`);
            
        } catch (error) {
            console.error(`   ❌ Chyba pri spracovaní ${batchFile}:`, error.message);
        }
        
        console.log('');
    }
    
    console.log('🎉 Všetky batch-y boli spracované!');
    console.log('\n📋 Súhrn:');
    console.log(`   • Celkovo batch-ov: ${batchFiles.length}`);
    console.log(`   • Už nahraných: 1 (batch_1)`);
    console.log(`   • Spracovaných teraz: ${batchesToUpload.length}`);
    console.log('\n🔧 Pre nahratie použite vygenerované MCP príkazy v súboroch mcp_command_*.txt');
}

// Run the automated upload
if (require.main === module) {
    uploadAllBatches()
        .then(() => {
            console.log('\n✨ Automatizácia dokončená!');
        })
        .catch((error) => {
            console.error('❌ Chyba pri automatizácii:', error);
            process.exit(1);
        });
}

module.exports = { uploadAllBatches };