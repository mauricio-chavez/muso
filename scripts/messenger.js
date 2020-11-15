const axios = require('axios');

const action = process.argv[2];
switch (action) {
  case 'whitelist':
    const domains = [];
    for (let i = 2; i < process.argv.length; i++) {
      const domain = process.argv[i];
      domains.push(domain);
    }
    axios
      .post(
        'https://graph.facebook.com/v9.0/me/messenger_profile',
        {
          whitelisted_domains: domains,
        },
        {
          params: {
            access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
          },
        }
      )
      .then(response => {
        if (response.data.result) {
          console.log(`${domains.join(', ')} has been successfully added to whitelist.`);
        } else {
          console.log(`An error ocurred while adding ${domains.join(', ')}} to whitelist.`);
        }
      });
    break;
}
