const express = require('express');
const path = require('path');
const messenger = require('../utils/messenger')

const router = express.Router();

router.get('', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  await messenger.welcomeUser(code, state)

  const projectRoot = path.dirname(__dirname);
  res.sendFile(path.join(projectRoot, 'public/callback.html'));
});

module.exports = router;
