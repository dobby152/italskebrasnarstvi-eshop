/**
 * Test API endpointů s Supabase
 */

const http = require('http');

// Konfigurace
const API_HOST = 'localhost';
const API_PORT = 3001;

/**
 * Funkce pro provedení HTTP požadavku
 * @param {string} method - HTTP metoda (GET, POST, PUT, DELETE)
 * @param {string} path - Cesta k API endpointu
 * @param {object} data - Data pro odeslání (pro POST a PUT)
 * @returns {Promise<object>} - Odpověď z API
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
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
        } catch (error) {
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

/**
 * Funkce pro testování API endpointů
 */
async function testAPI() {
  try {
    console.log('Testování API endpointů s Supabase...');
    console.log('-------------------------------------');

    // Test 1: Kontrola, zda server běží
    console.log('\n1. Test základního endpointu');
    try {
      const response = await makeRequest('GET', '/');
      console.log(`Status: ${response.statusCode}`);
      console.log('Odpověď:', response.data);
      console.log(response.statusCode === 200 ? '✅ Test úspěšný' : '❌ Test selhal');
    } catch (error) {
      console.error('❌ Test selhal:', error.message);
      console.log('Je server spuštěn? Zkuste: npm run start:supabase');
      process.exit(1);
    }

    // Test 2: Získání všech produktů
    console.log('\n2. Test získání všech produktů');
    try {
      const response = await makeRequest('GET', '/api/products');
      console.log(`Status: ${response.statusCode}`);
      console.log(`Počet produktů: ${response.data.length}`);
      console.log(response.statusCode === 200 ? '✅ Test úspěšný' : '❌ Test selhal');
    } catch (error) {
      console.error('❌ Test selhal:', error.message);
    }

    // Test 3: Získání všech kategorií
    console.log('\n3. Test získání všech kategorií');
    try {
      const response = await makeRequest('GET', '/api/categories');
      console.log(`Status: ${response.statusCode}`);
      console.log(`Počet kategorií: ${response.data.length}`);
      console.log(response.statusCode === 200 ? '✅ Test úspěšný' : '❌ Test selhal');
    } catch (error) {
      console.error('❌ Test selhal:', error.message);
    }

    // Test 4: Získání statistik
    console.log('\n4. Test získání statistik');
    try {
      const response = await makeRequest('GET', '/api/stats');
      console.log(`Status: ${response.statusCode}`);
      console.log('Statistiky:', response.data);
      console.log(response.statusCode === 200 ? '✅ Test úspěšný' : '❌ Test selhal');
    } catch (error) {
      console.error('❌ Test selhal:', error.message);
    }

    // Test 5: Vytvoření testovacího produktu
    console.log('\n5. Test vytvoření produktu');
    let testProductId;
    try {
      const testProduct = {
        name: 'Testovací produkt (Supabase)',
        description: 'Tento produkt byl vytvořen automatickým testem',
        price: 999.99,
        category: 'Test',
        stock: 10
      };

      const response = await makeRequest('POST', '/api/products', testProduct);
      console.log(`Status: ${response.statusCode}`);
      console.log('Vytvořený produkt:', response.data);
      testProductId = response.data.id;
      console.log(response.statusCode === 201 ? '✅ Test úspěšný' : '❌ Test selhal');
    } catch (error) {
      console.error('❌ Test selhal:', error.message);
    }

    // Test 6: Aktualizace testovacího produktu
    if (testProductId) {
      console.log('\n6. Test aktualizace produktu');
      try {
        const updatedProduct = {
          name: 'Testovací produkt (aktualizováno)',
          description: 'Tento produkt byl aktualizován automatickým testem',
          price: 1099.99,
          category: 'Test',
          stock: 5
        };

        const response = await makeRequest('PUT', `/api/products/${testProductId}`, updatedProduct);
        console.log(`Status: ${response.statusCode}`);
        console.log('Aktualizovaný produkt:', response.data);
        console.log(response.statusCode === 200 ? '✅ Test úspěšný' : '❌ Test selhal');
      } catch (error) {
        console.error('❌ Test selhal:', error.message);
      }

      // Test 7: Smazání testovacího produktu
      console.log('\n7. Test smazání produktu');
      try {
        const response = await makeRequest('DELETE', `/api/products/${testProductId}`);
        console.log(`Status: ${response.statusCode}`);
        console.log('Odpověď:', response.data);
        console.log(response.statusCode === 200 ? '✅ Test úspěšný' : '❌ Test selhal');
      } catch (error) {
        console.error('❌ Test selhal:', error.message);
      }
    }

    // Test 8: Získání všech objednávek
    console.log('\n8. Test získání všech objednávek');
    try {
      const response = await makeRequest('GET', '/api/orders');
      console.log(`Status: ${response.statusCode}`);
      console.log(`Počet objednávek: ${response.data.length}`);
      console.log(response.statusCode === 200 ? '✅ Test úspěšný' : '❌ Test selhal');
    } catch (error) {
      console.error('❌ Test selhal:', error.message);
    }

    console.log('\nTestování API dokončeno.');
  } catch (error) {
    console.error('Neočekávaná chyba při testování API:', error.message);
  }
}

// Spuštění testu
testAPI();