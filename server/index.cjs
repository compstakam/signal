const express = require('express');
const cors = require('cors');
const path = require('path');
const sessionRoutes = require('./routes/session.cjs');
const projectRoutes = require('./routes/projects.cjs');
const enrichRoutes = require('./routes/enrich.cjs');
const outreachRoutes = require('./routes/outreach.cjs');
const subscriptionRoutes = require('./routes/subscription.cjs');
const onboardingRoutes = require('./routes/onboarding.cjs');
const adminRoutes = require('./routes/admin.cjs');
const preferencesRoutes = require('./routes/preferences.cjs');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/session', sessionRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/enrich', enrichRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/preferences', preferencesRoutes);

// In production, serve the built frontend
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
