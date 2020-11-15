const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

const webhook = require('./routes/webhook');
const callback = require('./routes/callback');
const status = require('./routes/status');

const app = express();

// Logger
app.use(morgan('tiny'));

// Security
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/webhook', webhook);
app.use('/callback', callback);
app.use('/status', status);

const server = app.listen(process.env.PORT || 3000, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server listening on *:${server.address().port} 🚀`);
  }
});
