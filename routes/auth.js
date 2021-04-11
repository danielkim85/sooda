var express = require('express');
var router = express.Router();

const {google} = require('googleapis');

/* GET users listing. */
router.get('/', function(req, res, next) {
  const redirect_uri = req.query.redirect_uri;
  const oauth2Client = new google.auth.OAuth2(
    '564260860453-1pr2eu922676cmqg6vpc2skdsdqth7o9.apps.googleusercontent.com',
    'LpvYwLV9mRgO3mBNlDrgRL',
    redirect_uri
  );
  const scopes = [
    'https://mail.google.com'
  ];
  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',

    // If you only need one scope you can pass it as a string
    scope: scopes
  });
  console.info(url);
  res.send(url);
});

module.exports = router;
