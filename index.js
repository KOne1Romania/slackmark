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
    return;
  }

  var resp = {
    response_type: "in_channel",
    text: `*${user}* saved ${link} ${alias ? 'as _' + alias + '_' : ''} ${tag ? '[' + tag + ']' : ''}`,
    "mrkdwn": true
  };

  myFirebaseRef.push().set({
    link,
    user,
    alias,
    tag,
  }, (error) => {
    if (error) {
      res.send(error);
      return;
    }

    res.send(resp);
  });
}

function listLinks(res, tag) {
  var resp = {
      text: 'Saved links:',
      attachments: []
  };

  function addLinkToResp(data) {
    resp.attachments.push({
      title: data.alias,
      text: `${data.link} ${data.tag ? '['+data.tag+']' : ''}`,
      mrkdwn_in: ["text"]
    });
  }

  function parseSnapshot(snapshot) {
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        var childData = childSnapshot.val();
        addLinkToResp(childData);
      });
    } else {
      resp.text = `No links with tag [${tag}]`;
    }
  }

  if (tag) {
    myFirebaseRef.orderByChild("tag").equalTo(tag).on("value", (snapshot) => {
      parseSnapshot(snapshot);
      res.send(resp);
    });
  } else {
    myFirebaseRef.once("value", (snapshot) => {
      parseSnapshot(snapshot);
      res.send(resp);
    });
  }
}

function displayHelp(res) {
  var resp = {
    text: "Here are the actions you can use",
    attachments: [
      {
        title: "Save a link",
        text: "/mark add example.com example-alias [tag]"
      },
      {
        title: "See all links",
        text: "/mark list"
      },
      {
        title: "See all links with a tag",
        text: "/mark list [tag]"
      }
    ]
  };

  res.send(resp);
}

app.post('/', (req, res) => {
  var args = req.body.text.split(' ');
  var command = args[0];
  var user = req.body.user_name;

  switch (command) {
    case 'list':
      var tag = args.length > 1 ? args[1] : null;
      listLinks(res, tag);
      break;
    case 'help':
      displayHelp(res);
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

var server = app.listen(8080, () => {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
