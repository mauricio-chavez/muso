const dialogflow = require('@google-cloud/dialogflow');
const spotify = require('./spotify');

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} query The query to be executed
 * @param {string} psid Page Scoped ID from Messenger Platform
 */
async function detectIntent(query, psid) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  const clientOptions = {};
  if (process.env.NODE_ENV === 'production') {
    clientOptions.credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT);
  }
  const sessionClient = new dialogflow.SessionsClient(clientOptions);
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, psid);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: 'es',
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;

  if (result.intent.displayName === 'Top Spotify') {
    const type = result.parameters.fields['music-entity'].stringValue;
    return await spotify.sendTopListResponse(type, psid);
  } else {
    return { text: result.fulfillmentText };
  }
}

module.exports = { detectIntent };
