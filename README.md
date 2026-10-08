# FSD (Full Stack Development) Lab

College lab experiments for Full Stack Development, one folder per experiment.

| Folder | Content |
|---|---|
| `1` | HTML/CSS: landing page and post-lab |
| `2` | HTML/CSS/JS: contact manager UI and post-lab |
| `3` | Frontend app with an API layer (has its own README) |
| `4a`, `4b` | Node/Express apps with views and static assets |
| `5b` | Express server with Mongoose models |
| `6` | Express server with a public frontend |

## Run an experiment
For folders with a `package.json`:

```bash
cd 4a
npm install
node index.js      # or: node server.js for 5b and 6
```

Folders with a `.env.example` or a MongoDB connection need a `.env` file with your own values. Experiments `1` and `2` are static; open `index.html`.
