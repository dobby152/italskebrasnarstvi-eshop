const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'

const supabase = createClient(supabaseUrl, supabaseKey)

async function exportProducts() {
  console.log('Začínám export produktů...')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('sku, name, description')
    .order('sku')

  if (error) {
    console.error('Chyba při exportu:', error)
    return
  }

  console.log(`Nalezeno ${products.length} produktů`)

  // Vytvoří CSV soubor
  let csvContent = 'SKU,Name,Description\n'
  
  products.forEach(product => {
    const sku = (product.sku || '').replace(/"/g, '""')
    const name = (product.name || '').replace(/"/g, '""')
    const description = (product.description || '').replace(/"/g, '""')
    
    csvContent += `"${sku}","${name}","${description}"\n`
  })

  // Uloží do souboru
  fs.writeFileSync('products_export.csv', csvContent, 'utf8')
  console.log('✅ Export dokončen! Soubor: products_export.csv')
  
  // Také vytvoří JSON pro jednodušší práci
  fs.writeFileSync('products_export.json', JSON.stringify(products, null, 2), 'utf8')
  console.log('✅ JSON export dokončen! Soubor: products_export.json')
  
  console.log('📊 Statistiky:')
  console.log(`- Celkem produktů: ${products.length}`)
  console.log(`- Produkty s názvem: ${products.filter(p => p.name).length}`)
  console.log(`- Produkty s popisem: ${products.filter(p => p.description).length}`)
}

exportProducts().catch(console.error)