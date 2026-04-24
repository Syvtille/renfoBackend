const baseUrl = 'http://localhost:3000';

async function testApi() {
    try {
        // 1. Register players
        const p1 = await fetch(`${baseUrl}/auth/register`, { method: 'POST', body: JSON.stringify({ username: 'p1_' + Date.now(), password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
        const p2 = await fetch(`${baseUrl}/auth/register`, { method: 'POST', body: JSON.stringify({ username: 'p2_' + Date.now(), password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
        const ref = await fetch(`${baseUrl}/auth/register`, { method: 'POST', body: JSON.stringify({ username: 'ref_' + Date.now(), password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());

        // 2. Login
        const login1 = await fetch(`${baseUrl}/auth/login`, { method: 'POST', body: JSON.stringify({ username: p1.username, password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
        const t1 = login1.accessToken;

        const login2 = await fetch(`${baseUrl}/auth/login`, { method: 'POST', body: JSON.stringify({ username: p2.username, password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
        const t2 = login2.accessToken;

        const loginRef = await fetch(`${baseUrl}/auth/login`, { method: 'POST', body: JSON.stringify({ username: ref.username, password: 'password123' }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
        const tRef = loginRef.accessToken;

        console.log("Tokens:", { t1: !!t1, t2: !!t2, tRef: !!tRef });
        if (!t1 || !t2 || !tRef) throw new Error("Missing tokens");

        // 3. Matchmaking
        console.log("P1 joining lobby...");
        const join1 = await fetch(`${baseUrl}/matchmaking/join/player`, { method: 'POST', headers: { 'Authorization': `Bearer ${t1}`, 'Content-Type': 'application/json' } });
        const lobby1Res = await join1.json();
        console.log("P1 joined:", lobby1Res);

        console.log("P2 joining lobby...");
        const join2 = await fetch(`${baseUrl}/matchmaking/join/player`, { method: 'POST', headers: { 'Authorization': `Bearer ${t2}`, 'Content-Type': 'application/json' } });
        const lobby2Res = await join2.json();
        console.log("P2 joined:", lobby2Res);

        console.log("Ref joining lobby...");
        const joinRef = await fetch(`${baseUrl}/matchmaking/join/referee`, { method: 'POST', headers: { 'Authorization': `Bearer ${tRef}`, 'Content-Type': 'application/json' } });
        const lobby3Res = await joinRef.json();
        console.log("Ref joined:", lobby3Res);

    } catch (e) {
        console.error("Error during test:", e);
    }
}

testApi();
