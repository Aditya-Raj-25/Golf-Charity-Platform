import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = 'https://vmyjflgfctalmyyxbqno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZteWpmbGdmY3RhbG15eXhicW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTUxOTMsImV4cCI6MjA4OTkzMTE5M30.69Qjzvq9M_2yWYY1KoYT19HFDs1QwETLbMSBHgKYHIg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Signing up test user...');
    const { data, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    });
    
    if (error) throw error;
    
    const token = data.session.access_token;
    console.log('Got token. Fetching /api/auth/profile from Render...');
    
    const res = await axios.get('https://golf-charity-backend-pku8.onrender.com/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Network Error / Exception:', err.message);
    }
  }
}

test();
