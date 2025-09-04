// Quick script to check authentication status
// Run this in the browser console or as a test

console.log('🔍 Checking authentication status...');

// Check if we're in browser environment
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  // Check localStorage
  const userData = localStorage.getItem('user_data');
  console.log('📦 Raw user_data from localStorage:', userData);
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      console.log('✅ Parsed user data:', parsed);
      console.log('🎫 Session token:', parsed.sessionToken);
      console.log('🔢 Token length:', parsed.sessionToken?.length || 'undefined');
      
      if (parsed.sessionToken) {
        console.log('🔑 Token preview:', parsed.sessionToken.substring(0, 20) + '...' + parsed.sessionToken.slice(-10));
        
        // Test API call
        console.log('🧪 Testing API call with token...');
        fetch('http://localhost:8000/api/v1/me', {
          headers: {
            'Authorization': `Bearer ${parsed.sessionToken}`,
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          console.log('📡 API Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          return response.json().catch(() => response.text());
        })
        .then(data => {
          console.log('📋 API Response data:', data);
        })
        .catch(error => {
          console.error('❌ API call failed:', error);
        });
      } else {
        console.log('❌ No session token found in user data');
      }
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
    }
  } else {
    console.log('❌ No user data found in localStorage');
    console.log('🔄 You need to log in first. Go to http://localhost:3000/login');
  }
} else {
  console.log('❌ Not in browser environment or localStorage not available');
}
