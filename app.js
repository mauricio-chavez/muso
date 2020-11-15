const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./database');

const webhook = require('./routes/webhook');
const callback = require('./routes/callback');

const app = express();

// Logger
app.use(morgan('tiny'));

// Security
// app.use(helmet());
app.use(cors());

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/webhook', webhook);
app.use('/callback', callback);

const server = app.listen(process.env.PORT || 3000, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server listening on *:${server.address().port} 🚀`);
  }
});
