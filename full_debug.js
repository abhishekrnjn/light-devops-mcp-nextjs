// Comprehensive authentication debugging script
const http = require('http');
const https = require('https');

// Simulate frontend localStorage check
function simulateLocalStorageCheck() {
  console.log('🔍 Step 1: Simulating frontend localStorage check...\n');
  console.log('To check your actual localStorage:');
  console.log('1. Open http://localhost:3000 in browser');
  console.log('2. Open Developer Tools (F12) → Console');
  console.log('3. Run: localStorage.getItem("user_data")');
  console.log('4. If you see data, run: JSON.parse(localStorage.getItem("user_data")).sessionToken');
  console.log('5. Copy that token and run: node full_debug.js "YOUR_TOKEN_HERE"\n');
}

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: jsonData 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: data 
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function analyzeJWT(token) {
  console.log('🔍 Step 3: Analyzing JWT token...\n');
  
  if (!token) {
    console.log('❌ No token provided');
    return false;
  }
  
  console.log(`📏 Token length: ${token.length} characters`);
  console.log(`🔍 Token preview: ${token.substring(0, 30)}...${token.substring(token.length - 30)}`);
  
  // Check JWT structure
  const parts = token.split('.');
  console.log(`🧩 JWT parts: ${parts.length} (should be 3)`);
  
  if (parts.length !== 3) {
    console.log('❌ Invalid JWT format - should have 3 parts separated by dots');
    return false;
  }
  
  try {
    // Decode header
    const headerDecoded = Buffer.from(parts[0], 'base64').toString();
    const header = JSON.parse(headerDecoded);
    console.log('📋 JWT Header:', JSON.stringify(header, null, 2));
  } catch (e) {
    console.log('❌ Cannot decode JWT header:', e.message);
  }
  
  try {
    // Decode payload with proper padding
    let payload = parts[1];
    while (payload.length % 4) {
      payload += '=';
    }
    const payloadDecoded = Buffer.from(payload, 'base64').toString();
    const payloadObj = JSON.parse(payloadDecoded);
    
    console.log('📋 JWT Payload:');
    console.log('  - Subject (sub):', payloadObj.sub);
    console.log('  - Email:', payloadObj.email);
    console.log('  - Name:', payloadObj.name);
    console.log('  - Roles:', payloadObj.roles);
    console.log('  - Permissions:', payloadObj.permissions);
    console.log('  - Tenant:', payloadObj.tenant || payloadObj.tenantId);
    
    // Check expiration
    if (payloadObj.exp) {
      const expDate = new Date(payloadObj.exp * 1000);
      const now = new Date();
      console.log('  - Expires:', expDate.toISOString());
      console.log('  - Current time:', now.toISOString());
      console.log('  - Is expired:', now > expDate ? '❌ YES' : '✅ NO');
      
      if (now > expDate) {
        console.log('⚠️ WARNING: Token is expired! You need to log in again.');
        return false;
      }
    } else {
      console.log('  - Expires: No expiration set');
    }
    
    // Check issued time
    if (payloadObj.iat) {
      const issuedDate = new Date(payloadObj.iat * 1000);
      console.log('  - Issued:', issuedDate.toISOString());
    }
    
  } catch (e) {
    console.log('❌ Cannot decode JWT payload:', e.message);
    return false;
  }
  
  console.log('✅ JWT format appears valid\n');
  return true;
}

async function testBackendEndpoints(token) {
  console.log('🔍 Step 4: Testing backend endpoints...\n');
  
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:8000/api/v1/health', requiresAuth: false },
    { name: 'Current User', url: 'http://localhost:8000/api/v1/me', requiresAuth: true },
    { name: 'User Permissions', url: 'http://localhost:8000/api/v1/permissions', requiresAuth: true },
    { name: 'Metrics', url: 'http://localhost:8000/api/v1/metrics', requiresAuth: true },
    { name: 'Logs', url: 'http://localhost:8000/api/v1/logs', requiresAuth: true },
    { name: 'Deployments', url: 'http://localhost:8000/api/v1/deployments', requiresAuth: true },
    { name: 'Rollbacks', url: 'http://localhost:8000/api/v1/rollbacks', requiresAuth: true }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      
      const headers = endpoint.requiresAuth && token ? 
        { 'Authorization': `Bearer ${token}` } : {};
        
      const result = await makeRequest(endpoint.url, headers);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        if (endpoint.name === 'Current User' || endpoint.name === 'User Permissions') {
          console.log('📋 Response:', JSON.stringify(result.data, null, 2));
        }
      } else if (result.status === 401) {
        console.log(`🚫 ${endpoint.name}: UNAUTHORIZED`);
        console.log('📝 Response:', result.data);
      } else if (result.status === 403) {
        console.log(`⛔ ${endpoint.name}: FORBIDDEN (insufficient permissions)`);
        console.log('📝 Response:', result.data);
      } else {
        console.log(`❌ ${endpoint.name}: ERROR (${result.status})`);
        console.log('📝 Response:', result.data);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: NETWORK ERROR - ${error.message}`);
    }
    
    console.log(''); // Add spacing
  }
}

async function checkFrontendConnection() {
  console.log('🔍 Step 2: Testing frontend connection...\n');
  
  try {
    const result = await makeRequest('http://localhost:3000');
    if (result.status === 200) {
      console.log('✅ Frontend is running on port 3000');
    } else {
      console.log(`⚠️ Frontend returned status ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Cannot connect to frontend on port 3000:', error.message);
    console.log('💡 Make sure your Next.js frontend is running with: npm run dev');
  }
  
  console.log('');
}

async function main() {
  console.log('🚀 DevOps MCP Authentication Full Debug\n');
  console.log('=' .repeat(50) + '\n');
  
  // Step 1: Instructions for getting token
  simulateLocalStorageCheck();
  
  // Step 2: Check frontend
  await checkFrontendConnection();
  
  // Get token from command line
  const token = process.argv[2];
  
  if (token) {
    // Step 3: Analyze JWT
    const isValidJWT = analyzeJWT(token);
    
    // Step 4: Test backend endpoints
    if (isValidJWT) {
      await testBackendEndpoints(token);
    } else {
      console.log('⚠️ Skipping backend tests due to invalid JWT');
    }
    
    console.log('🎯 DIAGNOSIS:');
    if (isValidJWT) {
      console.log('✅ Your JWT token appears to be valid');
      console.log('💡 If you\'re still having issues, check:');
      console.log('   1. Browser console for JavaScript errors');
      console.log('   2. Network tab in dev tools for failed requests');
      console.log('   3. Make sure you\'re accessing the correct URLs');
    } else {
      console.log('❌ Your JWT token has issues');
      console.log('💡 Try logging out and logging back in at http://localhost:3000/login');
    }
  } else {
    console.log('⚠️ No JWT token provided for testing');
    console.log('💡 Get your token from the frontend and run:');
    console.log('   node full_debug.js "YOUR_JWT_TOKEN_HERE"');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Debug complete!');
}

main().catch(console.error);
