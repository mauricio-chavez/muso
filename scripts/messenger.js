const axios = require('axios');

const action = process.argv[2];
switch (action) {
  case 'whitelist':
    const url = process.argv[3];
    axios
      .post(
        'https://graph.facebook.com/v9.0/me/messenger_profile',
        {
          whitelisted_domains: [url],
        },
        {
          params: {
            access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
          },
        }
      )
      .then(response => {
        if (response.data.result) {
          console.log(`${url} has been successfully added to whitelist.`);
        } else {
          console.log(`An error ocurred while adding ${url} to whitelist.`);
        }
      });
    break;
}
