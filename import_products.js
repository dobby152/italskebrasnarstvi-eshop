const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importProducts(filename) {
  console.log(`Začínám import z ${filename}...`)
  
  if (!fs.existsSync(filename)) {
    console.error(`❌ Soubor ${filename} neexistuje!`)
    return
  }

  let products
  try {
    const fileContent = fs.readFileSync(filename, 'utf8')
    products = JSON.parse(fileContent)
  } catch (error) {
    console.error('❌ Chyba při čtení souboru:', error)
    return
  }

  console.log(`📦 Načteno ${products.length} produktů pro import`)

  let updated = 0
  let errors = 0

  for (const product of products) {
    if (!product.sku) {
      console.log('⚠️ Přeskakujem produkt bez SKU')
      continue
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description,
          updated_at: new Date().toISOString()
        })
        .eq('sku', product.sku)

      if (error) {
        console.error(`❌ Chyba při aktualizaci ${product.sku}:`, error)
        errors++
      } else {
        updated++
        if (updated % 50 === 0) {
          console.log(`📈 Aktualizováno ${updated} produktů...`)
        }
      }
    } catch (error) {
      console.error(`❌ Chyba při zpracování ${product.sku}:`, error)
      errors++
    }
  }

  console.log('🎉 Import dokončen!')
  console.log(`✅ Úspěšně aktualizováno: ${updated} produktů`)
  console.log(`❌ Chyby: ${errors} produktů`)
}

// Získá název souboru z argumentů
const filename = process.argv[2] || 'products_translated.json'
importProducts(filename).catch(console.error)