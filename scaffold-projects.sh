#!/bin/bash

# Scaffold remaining 9 AI projects

projects=(
  "ai-proposal-generator:3002:AI Proposal Generator from Call Notes"
  "ai-client-followup:3003:AI Client Follow-Up Engine"
  "ai-support-triage:3004:AI Customer Support Triage Bot"
  "ai-social-repurposer:3005:AI Social Media Content Repurposer"
  "ai-meeting-summary:3006:AI Meeting Summary & Action Tracker"
  "ai-knowledge-rag:3007:AI Internal Knowledge Base Search (RAG)"
  "ai-invoice-reminder:3008:AI Invoice & Payment Reminder System"
  "ai-resume-screener:3009:AI Hiring Resume Screener"
  "ai-bottleneck-detector:3010:AI Operations Bottleneck Detector"
)

for project_data in "${projects[@]}"; do
  IFS=':' read -r dir port name <<< "$project_data"
  
  cd /home/bigpoppacode/code/obelisk/$dir
  
  # package.json
  cat > package.json <<EOF
{
  "name": "$dir",
  "version": "1.0.0",
  "description": "$name",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@anthropic-ai/sdk": "^0.20.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
EOF

  # .env
  cat > .env <<EOF
ANTHROPIC_API_KEY=your_key_here_arthur_will_add
PORT=$port
EOF

  # .gitignore
  cat > .gitignore <<EOF
node_modules/
.env
*.log
data/
EOF

  # server.js
  cat > server.js <<EOF
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || $port;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.json({ message: '$name - Ready to build!' });
});

app.listen(PORT, () => {
  console.log(\`$name running on http://localhost:\${PORT}\`);
});
EOF

  echo "✅ Scaffolded $name"
done

echo "🎉 All 9 projects scaffolded!"
EOF

chmod +x /home/bigpoppacode/code/obelisk/scaffold-projects.sh
