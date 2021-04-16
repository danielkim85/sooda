var express = require('express');
var router = express.Router();

const {google} = require('googleapis');
const oauth2 = google.oauth2('v2');

const getOauth2Client = function(redirect_uri) {
  return new google.auth.OAuth2(
    '564260860453-1pr2eu922676cmqg6vpc2skdsdqth7o9.apps.googleusercontent.com',
    'B-LpvYwLV9mRgO3mBNlDrgRL',
    redirect_uri
  );
};

/* GET auth url */
router.get('/', function(req, res, next) {
  const oauth2Client = getOauth2Client(req.query.redirect_uri);
  const scopes = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.send(url);
});

/* get refresh token from an auth code */
router.get('/accessToken', async function(req, res, next) {
  try {4
    const oauth2Client = getOauth2Client(req.query.redirect_uri);
    let {tokens} = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });
    tokens.email = userInfo.data.email;
    res.send(tokens);
  }
  catch (err) {
    console.error(err);
    res.send(err);
  }
});
module.exports = router;
