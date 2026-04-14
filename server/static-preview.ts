import express from 'express';
import path from 'path';

const app = express();
const PORT = 3001;

// Serve static files from the static-site directory
app.use('/static-preview', express.static(path.join(process.cwd(), 'static-site')));

// Redirect root to clean.html
app.get('/static-preview', (req, res) => {
  res.redirect('/static-preview/clean.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static preview server running on port ${PORT}`);
  console.log(`Access the site at: http://localhost:${PORT}/static-preview/clean.html`);
});