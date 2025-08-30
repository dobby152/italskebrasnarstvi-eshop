/**
 * Test API endpointů po migraci na PostgreSQL
 */

const http = require('http');
require('dotenv').config({ path: '../.env' });

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

// Funkce pro provedení HTTP požadavku
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {}
    };
    
    if (data) {
      options.headers['Content-Type'] = 'application/json';
    }
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Testovací funkce
async function runTests() {
  console.log('Spouštím testy API endpointů...');
  let success = 0;
  let failed = 0;
  
  try {
    // Test 1: Health check
    console.log('\n1. Test: Health check');
    const healthResult = await makeRequest(`${BASE_URL}/health`);
    if (healthResult.statusCode === 200 && healthResult.data.status === 'OK') {
      console.log('✅ Health check OK');
      success++;
    } else {
      console.log('❌ Health check selhalo:', healthResult);
      failed++;
    }
    
    // Test 2: Získání produktů
    console.log('\n2. Test: Získání produktů');
    const productsResult = await makeRequest(`${BASE_URL}/products`);
    if (productsResult.statusCode === 200 && productsResult.data.products) {
      console.log(`✅ Získání produktů OK (${productsResult.data.products.length} produktů)`);
      success++;
    } else {
      console.log('❌ Získání produktů selhalo:', productsResult);
      failed++;
    }
    
    // Test 3: Získání kolekcí
    console.log('\n3. Test: Získání kolekcí');
    const collectionsResult = await makeRequest(`${BASE_URL}/collections`);
    if (collectionsResult.statusCode === 200 && Array.isArray(collectionsResult.data)) {
      console.log(`✅ Získání kolekcí OK (${collectionsResult.data.length} kolekcí)`);
      success++;
    } else {
      console.log('❌ Získání kolekcí selhalo:', collectionsResult);
      failed++;
    }
    
    // Test 4: Získání statistik
    console.log('\n4. Test: Získání statistik');
    const statsResult = await makeRequest(`${BASE_URL}/stats`);
    if (statsResult.statusCode === 200 && statsResult.data.totalProducts) {
      console.log(`✅ Získání statistik OK (${statsResult.data.totalProducts.count} produktů celkem)`);
      success++;
    } else {
      console.log('❌ Získání statistik selhalo:', statsResult);
      failed++;
    }
    
    // Test 5: Vytvoření testovacího produktu
    console.log('\n5. Test: Vytvoření produktu');
    const testProduct = {
      name_cz: 'Testovací produkt',
      sku: `TEST-${Date.now()}`,
      price: 999,
      collection_cz: 'Testovací kolekce',
      description_cz: 'Popis testovacího produktu'
    };
    
    const createResult = await makeRequest(`${BASE_URL}/products`, 'POST', testProduct);
    if (createResult.statusCode === 201 && createResult.data.id) {
      console.log(`✅ Vytvoření produktu OK (ID: ${createResult.data.id})`);
      success++;
      
      // Test 6: Aktualizace vytvořeného produktu
      const productId = createResult.data.id;
      console.log(`\n6. Test: Aktualizace produktu (ID: ${productId})`);
      const updateData = {
        name_cz: 'Aktualizovaný testovací produkt',
        price: 1299
      };
      
      const updateResult = await makeRequest(`${BASE_URL}/products/${productId}`, 'PUT', updateData);
      if (updateResult.statusCode === 200 && updateResult.data.id === productId) {
        console.log('✅ Aktualizace produktu OK');
        success++;
      } else {
        console.log('❌ Aktualizace produktu selhala:', updateResult);
        failed++;
      }
      
      // Test 7: Smazání vytvořeného produktu
      console.log(`\n7. Test: Smazání produktu (ID: ${productId})`);
      const deleteResult = await makeRequest(`${BASE_URL}/products/${productId}`, 'DELETE');
      if (deleteResult.statusCode === 200 && deleteResult.data.message) {
        console.log('✅ Smazání produktu OK');
        success++;
      } else {
        console.log('❌ Smazání produktu selhalo:', deleteResult);
        failed++;
      }
    } else {
      console.log('❌ Vytvoření produktu selhalo:', createResult);
      failed++;
    }
    
    // Test 8: Získání objednávek
    console.log('\n8. Test: Získání objednávek');
    const ordersResult = await makeRequest(`${BASE_URL}/orders`);
    if (ordersResult.statusCode === 200 && ordersResult.data.orders) {
      console.log(`✅ Získání objednávek OK (${ordersResult.data.orders.length} objednávek)`);
      success++;
    } else {
      console.log('❌ Získání objednávek selhalo:', ordersResult);
      failed++;
    }
    
  } catch (error) {
    console.error('Chyba při provádění testů:', error.message);
  }
  
  // Souhrn testů
  console.log('\n=== Souhrn testů ===');
  console.log(`Celkem testů: ${success + failed}`);
  console.log(`Úspěšných: ${success}`);
  console.log(`Neúspěšných: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✅ Všechny testy proběhly úspěšně!');
    console.log('Migrace na PostgreSQL byla úspěšná.');
  } else {
    console.log('\n❌ Některé testy selhaly.');
    console.log('Zkontrolujte logy a opravte chyby.');
  }
}

// Spuštění testů
runTests();