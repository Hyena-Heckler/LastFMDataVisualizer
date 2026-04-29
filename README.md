# LastFMDataVisualizer
Using data from LastFM to help develop visualizations of the data in the form of animated charts and other graphics.

To run a cloudflare tunnel to allow other devices to access the backend:
Case 1 (No Ownership of Domain):
Run cloudflared tunnel --url http://localhost:3000 --protocol http2
Replace backend_server with the given tunnel link


To run python backend
$env:PORT=8000
python -m uvicorn main:app --port $env:PORT --log-level warning

To run javascript backend
npm start

To run frontend
npm run dev




Structure:
backend-python/
│
├── api/
│
├── services/
│   ├── accent_color_of_image.py
│   ├── data_points.py
│   ├── render_video.py
│   ├── song_positions.py
│
├── scripts/
│   ├── prep_data.py
│
├── data/
│   ├── cache/
│       ├── Data.json
│       ├── render_efficiency.json
│       ├── song_points.json
│       ├── song_points_by_positions.json
│       ├── song_positions.json
│
├── assets/
│   ├── fonts/
│   ├── frames/
│   ├── videos/
│
├── main.py

backend-nodejs/
│
├── node_modules/
├── .env
├── package.json
├── package-lock.json
│
├── server.js              → ALL API routes live here (for now)
│
├── services/             → business logic
│   ├── tracks.service.js
│   ├── tracks.transform.js
│   ├── week.js
│
├── db/                   → MySQL layer (important)
│
├── cache/                → JSON runtime data
│
├── data/                 → static JSON (like mappings)
│
├── integrations/
│   └── python/          → Node ↔ Python bridge

frontend/
│
├── index.html
├── styles/
│   ├── main.css
│
├── js/
│   ├── main.js              → entry point
│   ├── store.js             → global state
│
│   ├── components/
│   │   ├── button.js
│   │   ├── card-adder.js
│
│   ├── pages/
│   │   ├── login.js
│   │   ├── dashboard.js     (optional but useful)
│
│   ├── services/
│   │   ├── api.js           → calls backend-node
│
│   ├── utils/
│       ├── dom.js
│       ├── format.js