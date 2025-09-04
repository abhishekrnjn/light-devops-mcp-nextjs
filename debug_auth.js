// Debug authentication flow
// This script helps identify why authentication is failing

const http = require('http');

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
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

async function debugAuth() {
  console.log('🔍 Debugging DevOps MCP Authentication...\n');
  
  // Step 1: Check if backend is running
  console.log('1️⃣ Checking if backend is running...');
  try {
    const healthResult = await makeRequest('http://localhost:8000/api/v1/health');
    if (healthResult.status === 200) {
      console.log('✅ Backend is running');
      console.log('📋 Health response:', healthResult.data);
    } else {
      console.log('❌ Backend health check failed:', healthResult.status);
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    console.log('💡 Make sure the backend is running on port 8000');
    return;
  }
  
  // Step 2: Test without authentication
  console.log('\n2️⃣ Testing protected endpoint without auth...');
  try {
    const noAuthResult = await makeRequest('http://localhost:8000/api/v1/me');
    console.log('📊 Status:', noAuthResult.status);
    console.log('📋 Response:', noAuthResult.data);
    
    if (noAuthResult.status === 401) {
      console.log('✅ Good: Endpoint properly requires authentication');
    } else {
      console.log('⚠️ Unexpected: Endpoint should require authentication');
    }
  } catch (error) {
    console.log('❌ Error testing endpoint:', error.message);
  }
  
  // Step 3: Instructions for getting token
  console.log('\n3️⃣ How to get your JWT token from frontend:');
  console.log('🔧 Steps:');
  console.log('   1. Open http://localhost:3000 in browser');
  console.log('   2. Make sure you are logged in');
  console.log('   3. Open Developer Tools (F12)');
  console.log('   4. Go to Console tab');
  console.log('   5. Run: JSON.parse(localStorage.getItem("user_data")).sessionToken');
  console.log('   6. Copy the token and test with: node debug_auth.js "TOKEN_HERE"');
  
  // Step 4: Test with sample token if provided
  const sampleToken = process.argv[2];
  
  if (sampleToken) {
    console.log('\n4️⃣ Testing with provided token...');
    console.log('🔑 Token preview:', sampleToken.substring(0, 20) + '...' + sampleToken.substring(sampleToken.length - 20));
    console.log('📏 Token length:', sampleToken.length);
    
    // Check if it looks like a JWT
    const parts = sampleToken.split('.');
    console.log('🧩 JWT parts:', parts.length, '(should be 3 for valid JWT)');
    
    if (parts.length === 3) {
      console.log('✅ Token format looks correct');
      
      try {
        // Test with the token
        const authResult = await makeRequest('http://localhost:8000/api/v1/me', {
          'Authorization': `Bearer ${sampleToken}`
        });
        
        console.log('\n📊 Authentication Test Results:');
        console.log('Status:', authResult.status);
        console.log('Response:', JSON.stringify(authResult.data, null, 2));
        
        if (authResult.status === 200) {
          console.log('🎉 SUCCESS! Authentication working correctly');
          
          // Test permissions endpoint too
          console.log('\n🔍 Testing permissions endpoint...');
          const permResult = await makeRequest('http://localhost:8000/api/v1/permissions', {
            'Authorization': `Bearer ${sampleToken}`
          });
          console.log('Permissions Status:', permResult.status);
          console.log('Permissions Response:', JSON.stringify(permResult.data, null, 2));
          
        } else if (authResult.status === 401) {
          console.log('❌ Authentication failed - token may be invalid or expired');
        } else {
          console.log('⚠️ Unexpected response');
        }
      } catch (error) {
        console.log('❌ Error testing with token:', error.message);
      }
    } else {
      console.log('❌ Token does not appear to be a valid JWT format');
    }
  } else {
    console.log('\n💡 To test with a token, run: node debug_auth.js "YOUR_JWT_TOKEN"');
  }
  
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Verify you are logged in at http://localhost:3000');
  console.log('2. Check browser console for any errors');
  console.log('3. Verify the frontend is sending Authorization header');
  console.log('4. Check if the JWT token is expired');
}

debugAuth().catch(console.error);
