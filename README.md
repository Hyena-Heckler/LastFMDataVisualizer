# LastFMDataVisualizer
Using data from LastFM to help develop visualizations of the data in the form of animated charts and other graphics.

To run a cloudflare tunnel to allow other devices to access the backend:
Case 1 (No Ownership of Domain):
Run cloudflared tunnel --url http://localhost:3000 --protocol http2
Replace backend_server with the given tunnel link


To run backend
cd ./backend
npm start


To run frontend
cd./frontend
npx live-server