const axios = require('axios');
const { get } = require('http');
const qs = require('querystring');
const { User } = require('../database');

const spotifyApi = axios.create({
  baseURL: 'https://api.spotify.com/v1',
});

const spotifyAuthUrl = 'https://accounts.spotify.com/api/token';

const clientSecrets = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
const encodedSecret = Buffer.from(clientSecrets).toString('base64');
const spotifyAuthOptions = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${encodedSecret}`,
  },
};

async function sendLoginUrl(psid) {
  let response;
  const [user, created] = await User.findOrCreate({
    where: { psid },
  });

  if (!created && user.accessToken) {
    // Here, user has been previously created
    try {
      response = await getDisplayNameResponse(user);
    } catch (err) {
      // At this point, maybe is not authenticated
      if (err.response.status === 403) {
        // We update user's tokens and retry getting display name
        const success = getOrUpdateTokens(
          user.refreshToken,
          'refresh_token',
          user
        );
        if (success) {
          // If everything went ok, we return a nice response
          try {
            // Successfully refreshed tokens
            response = await getDisplayNameResponse(user);
          } catch {
            // At this point it may be my error
            dropUserTokens(user);
            response = getLoginGenericTemplate(user.id);
          }
        } else {
          // Probably session has expired
          dropUserTokens(user);
          response = getLoginGenericTemplate(user.id);
        }
      } else if (err.response.status !== 403) {
        // Maybe is my error lol
        console.error(err);
        dropUserTokens(user);
        response = getLoginGenericTemplate(user.id);
      }
    }
  } else if (created || !user.accessToken) {
    response = getLoginGenericTemplate(user.id);
  }
  return response;
}

async function sendWelcomeForNewUser(code, user) {
  const success = await getOrUpdateTokens(code, 'authorization_code', user);
  if (!success) {
    return getBadLoginResponse();
  } else {
    return await getDisplayNameResponse(user);
  }
}

async function sendTopListResponse(type, psid) {
  let response;
  const [user, created] = await User.findOrCreate({
    where: { psid },
  });
  if (created || !user.accessToken) {
    response = getLoginGenericTemplate(user.id);
  } else {
    try {
      response = await getTopList(type, user);
    } catch (err) {
      // At this point, maybe is not authenticated
      if (err.response && err.response.status === 403) {
        // We update user's tokens and retry getting display name
        const success = getOrUpdateTokens(
          user.refreshToken,
          'refresh_token',
          user
        );
        if (success) {
          // If everything went ok, we return a nice response
          try {
            // Successfully refreshed tokens
            response = await getTopList(type, user);
          } catch {
            // At this point it may be my error
            dropUserTokens(user);
            response = getLoginGenericTemplate(user.id);
          }
        } else {
          // Probably session has expired
          dropUserTokens(user);
          response = getLoginGenericTemplate(user.id);
        }
      } else if (err.response.status !== 403) {
        // Maybe is my error lol
        console.error(err);
        dropUserTokens(user);
        response = getLoginGenericTemplate(user.id);
      }
    }
  }
  return response;
}

// Private functions

async function getTopList(type, user) {
  const { data } = await spotifyApi.get(`/me/top/${type}`, {
    params: {
      limit: 10,
    },
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });
  return getTopListTemplate(data.items, type);
}

async function getDisplayNameResponse(user) {
  const { data } = await spotifyApi.get('/me', {
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  const response = {
    text: `¡Hola, ${data.display_name}! ¿Sabías que puedes preguntarme cuáles son tus canciones y artistas favoritos? Inténtalo 🤓`,
  };
  return response;
}

async function dropUserTokens(user) {
  user.accessToken = null;
  user.refreshToken = null;
  await user.save();
}

async function getOrUpdateTokens(codeOrToken, grantType, user) {
  const requestData = {
    grant_type: grantType,
  };

  if (grantType === 'authorization_code') {
    requestData.code = codeOrToken;
    requestData.redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
  } else if (grantType === 'refresh_token') {
    requestData.refresh_token = codeOrToken;
  }

  try {
    const body = qs.stringify(requestData);
    const { data } = await axios.post(spotifyAuthUrl, body, spotifyAuthOptions);
    user.accessToken = data.access_token;
    user.refreshToken = data.refresh_token
      ? data.refresh_token
      : user.refreshToken;
    await user.save();
    return true;
  } catch (err) {
    console.error(
      `${err.response.data.error}: ${err.response.data.error_description}`
    );
    return false;
  }
}

function getBadLoginResponse() {
  const response = {
    text: `Lo siento, no he podido autenticarte. Estoy trabajando en solucionarlo.`,
  };
  return response;
}

function generateTopTracksItems(items) {
  return items.map(item => {
    const artists = item.artists.map(artist => artist.name);
    return {
      title: item.name,
      subtitle: artists.join(','),
      image_url: item.album.images[0].url,
      default_action: {
        type: 'web_url',
        url: item.external_urls.spotify,
      },
      buttons: [
        {
          title: 'Ver en Spotify',
          type: 'web_url',
          url: item.external_urls.spotify,
        },
      ],
    };
  });
}

function generateTopArtistsItems(items) {
  return items.map(item => {
    let genre = item.genres[0];
    genre = genre.charAt(0).toUpperCase() + genre.slice(1);
    return {
      title: item.name,
      subtitle: `Género: ${genre} | Popularidad: ${item.popularity}%`,
      image_url: item.images[0].url,
      default_action: {
        type: 'web_url',
        url: item.external_urls.spotify,
      },
      buttons: [
        {
          title: 'Ver en Spotify',
          type: 'web_url',
          url: item.external_urls.spotify,
        },
      ],
    };
  });
}

function getTopListTemplate(items, type) {
  const elements =
    type === 'artists'
      ? generateTopArtistsItems(items)
      : generateTopTracksItems(items);
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: elements,
      },
    },
  };
}

function getLoginGenericTemplate(id) {
  const queryString = qs.encode({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: 'user-top-read',
    state: id,
  });
  const loginUrl = `https://accounts.spotify.com/authorize?${queryString}`;
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [
          {
            title: 'Inicia sesión en Spotify',
            image_url: 'https://www.scdn.co/i/_global/open-graph-default.png',
            subtitle: 'Para continuar, primero necesitas iniciar sesión',
            default_action: {
              type: 'web_url',
              url: loginUrl,
              messenger_extensions: true,
              webview_height_ratio: 'TALL',
            },
            buttons: [
              {
                type: 'web_url',
                url: loginUrl,
                title: 'Iniciar sesión',
              },
            ],
          },
        ],
      },
    },
  };
}

module.exports = {
  sendLoginUrl,
  sendWelcomeForNewUser,
  sendTopListResponse,
};
