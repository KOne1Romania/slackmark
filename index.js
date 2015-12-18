var express = require('express');
var bodyParser = require('body-parser');
var Firebase = require("firebase");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var myFirebaseRef = new Firebase("https://slackmark.firebaseio.com/");

function addLink(res, user, link, alias, tag){
  if(!link) {
    displayHelp(res);
  } else {
    var resp = {
        "text": user + " saved " + link,
    };

    myFirebaseRef.push().set({
      link,
      user,
      alias,
      tag,
    }, (error) => {
      res.send(resp);
    });
  }
}

function listLinks(res, tag) {
  var resp = {
      "text": 'Saved links:',
      "attachments" : []
  };
  myFirebaseRef.once("value", function(snapshot) {
    var index = 0;
    snapshot.forEach(function(childSnapshot) {

      var childData = childSnapshot.val();
      if(tag) {
        if(childData.tag == tag) {
          index += 1;
          resp.attachments.push({
            "title": childData.alias,
            "text": `*\`${index}\`*  ${childData.link}`,
            "mrkdwn_in": ["text"]
          });
        }
      } else {
        index += 1;
        resp.attachments.push({
          "title": childData.alias,
          "text": `*\`${index}\`*  ${childData.link} ${childData.tag ? '['+childData.tag+']' : ''}`,
          "mrkdwn_in": ["text"]
        });
      }
    });
    res.send(resp);
  });
}

function displayHelp(res) {
  var resp = {
    "text": "Here are the actions you can use",
    "attachments": [
      {
        "title": "Save a link",
        "text": "/mark add http://example.com example[alias]"
      },
      {
        "title": "See all links",
        "text": "/mark list"
      }
    ]
  };

  res.send(resp);
}

app.post('/', function (req, res) {

  var args = req.body.text.split(' ');
  var command = args[0];
  var user = req.body.user_name;

  switch (command) {
    case 'list':
      var tag = args.length > 1 ? args[1] : null;
      listLinks(res, tag);
      break;
    case 'help':

      break;
    case 'add':
      var link = args.length > 1 ? args[1] : null;
      var alias = args.length > 2 ? args[2] : null;
      var tag = args.length > 3 ? args[3] : null;
      addLink(res, user, link, alias, tag);
      break;
    default:
      displayHelp(res);
  }

});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
