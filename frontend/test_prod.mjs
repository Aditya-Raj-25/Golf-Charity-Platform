import axios from 'axios';

const API_URL = 'https://golf-charity-backend-pku8.onrender.com/api';

async function test() {
  console.log('Testing Production Backend...');
  try {
    const res = await axios.post(`${API_URL}/auth/login-notification`, { email: 'test@example.com' });
    console.log('Response:', res.data);
  } catch (err) {
    console.error('Error status:', err.response?.status);
    console.error('Error data:', err.response?.data);
    console.error('Message:', err.message);
  }
}

test();
