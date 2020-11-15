const axios = require('axios');
const spotify = require('./spotify');
const dialogflow = require('./dialogflow');
const { User } = require('../database');

// Handles messages events
async function handleMessage(sender_psid, received_message) {
  let response;
  if (received_message.text) {
    response = await dialogflow.detectIntent(
      received_message.text,
      sender_psid
    );
  }
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
async function handlePostback(sender_psid, received_postback) {
  let response;
  const payload = received_postback.payload;
  if (payload === 'FACEBOOK_WELCOME') {
    response = await spotify.sendLoginUrl(sender_psid);
  }
  callSendAPI(sender_psid, response);
}

async function welcomeUser(code, state) {
  const userId = parseInt(state);
  const user = await User.findByPk(userId);
  const response = await spotify.sendWelcomeForNewUser(code, user);
  callSendAPI(user.psid, response);
}

// Sends response messages via the Send API
async function callSendAPI(sender_psid, response) {
  const data = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  try {
    await axios.post('https://graph.facebook.com/v2.6/me/messages', data, {
      params: { access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN },
    });
  } catch (err) {
    const error = err.response.data.error;
    console.error(`${error.type}: ${error.message}`);
  }
}

module.exports = {
  handleMessage,
  handlePostback,
  callSendAPI,
  welcomeUser,
};
