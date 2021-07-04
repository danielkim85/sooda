const express = require('express');
const router = express.Router();

const Imap = require('imap');
const inspect = require('util').inspect;
const xoauth2 = require("xoauth2");
const simpleParser = require('mailparser').simpleParser;

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
    email : parsed && parsed[2] ? parsed[2].trim() : from
  };
};

const sanitizeHtml = function(message) {
  /*
  message_ = '<a href="http://whatever" id="an_id" rel="a_rel">the link</a>\n' +
            '<a href="/absolute_url/whatever" id="an_id" rel="a_rel">the link</a>';
  */
  const matches = message.match(/<a[^>]*>/g);
  for(const match of matches) {
    if(match.indexOf('target="_blank"') === -1) {
      const replace = '<a target="_blank"' + match.substring(2, match.length);
      message = message.replace(match, replace);
    }
  }
  return message;
};

const addProcessEvent = function(eventName,res) {
  process.on(eventName, function(e) {
    if(res._headerSent){
      return;
    }
    res.status(400).send(e.message);
  });
}
//end of helper


router.get('/unseen/count/', async function(req, res) {
  addProcessEvent('uncaughtException',res);
  addProcessEvent('unhandledRejection',res);

  const token = await generateXOAuth2(req.query.refresh_token, req.query.email);
  const imap = getIMap(token);
  imap.once('ready', function() {
    imap.openBox('INBOX', false, function(err,box) {
      if (err) throw err;
      imap.search([ 'UNSEEN' ], function(err, results) {
        if (err) throw err;
        const f = imap.fetch(results, { bodies: '' });
        f.once('end', function() {
          imap.end();
          imap.closeBox();
          res.json({
            uid:results[results.length-1]
          });
        });
      });
    });
  });
  imap.connect();
});

router.get('/get/:uid/', async function(req, res) {
  addProcessEvent('uncaughtException',res);
  addProcessEvent('unhandledRejection',res);

  const token = await generateXOAuth2(req.query.refresh_token, req.query.email);
  const imap = getIMap(token);
  imap.once('ready', function() {
    imap.openBox('INBOX', false, function(err,box) {
      if (err) throw err;

      const options = {
        markSeen: true,
        bodies: ['']
      };

      const f = imap.fetch( req.params.uid , options );
      f.on('message', function(msg, seqno) {

        msg.on('body', function(stream, info) {
          simpleParser(stream, (err, mail) => {
            if(err){
              res.status(400).send(err);
            }
            else if (req.query.json !== undefined){
              res.send(mail);
            }
            else {
              const messageTypes = ['html','textAsHtml','text'];
              let message;
              for(const type of messageTypes) {
                if(mail[type]) {
                  if(type === 'html') {
                    message = sanitizeHtml(mail[type]);
                  } else {
                    message = mail[type];
                  }
                  break;
                }
              }
              res.send(message);
            }
          });
        });

      });
      f.once('error', function(err) {
        console.error('Fetch error: ' + err);
        res.status(400).send(err);
      });
      f.once('end', function() {
        imap.end();
        imap.closeBox();
      });
    });
  });
  imap.connect();
});

router.get('/list/:unseen/', async function(req, res, next) {
  addProcessEvent('uncaughtException',res);
  addProcessEvent('unhandledRejection',res);

  const DEFAULT_SIZE = 20;
  const MAX_SIZE = 200;
  const token = await generateXOAuth2(req.query.refresh_token, req.query.email);
  const imap = getIMap(token);

  imap.once('ready', function() {
    let senders = {};
    imap.openBox('INBOX', true, function(err,box){
      if (err) throw err;

      const options = {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
      }
      let messages = [];
      let f;
      imap.search([ req.params.unseen.toUpperCase() ], function(err, results) {
        if (err) throw err;
        if (req.params.unseen === 'unseen') {
          f = imap.fetch(results, options);
        } else {
          //const size = req.query.size ? req.query.size : 10;
          //const end = req.query.start ? box.messages.total - parseInt(req.query.start) : box.messages.total;
          //const start = ((end - size) < 0 ? 0 : (end - size)) + 1;
          console.info(req.query.start);
          console.info(req.query.end);
          console.info(box.messages.total);
          const start = parseInt(req.query.start === '-1' ? box.messages.total - DEFAULT_SIZE : req.query.start);
          const end = parseInt(req.query.end === '-1' ? box.messages.total : req.query.end);
          console.info (start + '->' + end);
          if(start > end) {
            imap.end();
            imap.closeBox();
            res.json({
              messages: []
            });
          }
          if(end - start > MAX_SIZE) {
            imap.end();
            imap.closeBox();
            res.json({
              reset : true
            });
          }
          f = imap.seq.fetch(start + ':' + end, options);
        }

        f.on('message', function (msg, seqno) {
          const id = seqno;
          let subject, from, attrs_, date;
          msg.on('body', function (stream, info) {
            let buffer = '';
            stream.on('data', function (chunk) {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', function () {
              const parsed = Imap.parseHeader(buffer);
              date = new Date(parsed['date']);
              from = parseFrom(parsed.from[0]);
              if (from.name) {
                from.name = from.name.replace(/"/g, '');
              }
              subject = parsed.subject[0];
            });
          });

          msg.once('attributes', function (attrs) {
            attrs_ = attrs;
          });

          msg.once('end', function () {
            /* disable for now
            if(senders[from.email]){
              return;
            }
            */
            senders[from.email] = true;
            messages.unshift({
              id: id,
              subject: subject,
              from: from,
              date: date,
              attrs: attrs_
            });
          });
        });

        f.once('error', function (err) {
          console.error('Fetch error: ' + err);
          res.status(400).send(err);
        });

        f.once('end', function () {
          imap.end();
          imap.closeBox();
          res.json({
            messages: messages
          });
        });
      });
    });
  });

  imap.connect();
});

module.exports = router;
