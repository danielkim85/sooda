const express = require('express');
const router = express.Router();

const Imap = require('imap');
const inspect = require('util').inspect;
const xoauth2 = require("xoauth2");

//helper
const generateXOAuth2 = async function(refreshToken,email) {
  //TODO the below to config file
  const xOAuth2gen = xoauth2.createXOAuth2Generator({
    user: email,
    refreshToken: refreshToken,
    clientId: '564260860453-1pr2eu922676cmqg6vpc2skdsdqth7o9.apps.googleusercontent.com',
    clientSecret: 'B-LpvYwLV9mRgO3mBNlDrgRL'
  });
  return new Promise(function (resolve, reject){
    xOAuth2gen.getToken(function(err, token) {
      if(err){
        reject(err);
      }
      resolve(token);
    });
  });
};

const getIMap = function(token) {
  //TODO move below to config file
  let imap = {
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    xoauth2 : token,
    tlsOptions: { rejectUnauthorized: false }
  }
  return new Imap(imap);
};

const parseFrom = function(from) {
  const parsed = from.match(/(.*)<(.*)>/);
  return {
    name : parsed && parsed[1] ? parsed[1].trim() : '',
    email : parsed && parsed[2] ? parsed[2].trim() : ''
  };
};

const addProcessEvent = function(eventName,res) {
  process.on(eventName, function(e) {
    console.warn(e);
    if(res._headerSent){
      return;
    }
    res.status(400).send(e.message);
  });
}
//end of helper

router.get('/', async function(req, res, next) {
  addProcessEvent('uncaughtException',res);
  addProcessEvent('unhandledRejection',res);

  if(!this.token) {
    this.token = await generateXOAuth2(req.query.refresh_token, req.query.email);
  }

  if(!this.imap) {
    this.imap = getIMap(this.token);
  }
  const imap = this.imap;

  imap.once('ready', function() {
    let senders = {};
    imap.openBox('INBOX', true, function(err,box){
      if (err) throw err;

      let messages = [];

      const size = req.query.size ? req.query.size : 10; //TODO get this from param
      const end = box.messages.total; //TODO get this from param
      const start = ((end-size) < 0 ? 0 : (end-size)) + 1;

      const f = imap.seq.fetch( start + ':' + end , {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
      });

      f.on('message', function(msg, seqno) {
        const id = seqno;
        let subject, from, attrs_, date;
        msg.on('body', function(stream, info) {
          let buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function() {
            console.info(inspect(Imap.parseHeader(buffer)));
            const parsed = Imap.parseHeader(buffer);
            date = new Date(parsed['date']);
            from = parseFrom(parsed.from[0]);
            subject = parsed.subject[0];
          });
        });

        msg.once('attributes', function(attrs) {
          attrs_ = attrs;
        });

        msg.once('end', function() {
          if(senders[from.email]){
            return;
          }

          senders[from.email] = true;
          messages.push({
            id:id,
            subject:subject,
            from:from,
            date:date
          });
        });
      });

      f.once('error', function(err) {
        console.error('Fetch error: ' + err);
      });

      f.once('end', function() {
        imap.end();
        res.json({
          //'token' : token,
          messages:messages
        });
      });

    });
  });

  //gogogo
  imap.connect();
});

module.exports = router;
