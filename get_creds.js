// get_creds.js
const baseUrl = 'http://localhost:3000';
async function test() {
    const p1 = await fetch(`${baseUrl}/auth/register`, { method: 'POST', body: JSON.stringify({ username: 'p1_' + Date.now(), password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
    const login1 = await fetch(`${baseUrl}/auth/login`, { method: 'POST', body: JSON.stringify({ username: p1.username, password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
    const join1 = await fetch(`${baseUrl}/matchmaking/join/player`, { method: 'POST', headers: { 'Authorization': `Bearer ${login1.accessToken}`, 'Content-Type': 'application/json' } }).then(r => r.json());

    console.log(`TOKEN=${login1.accessToken}\nLOBBY=${join1.lobby.id}`);
}
test();
