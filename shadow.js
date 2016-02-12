var express = require('express'),
    bodyParser = require('body-parser'),
    awsIot = require('aws-iot-device-sdk'),
    app = express();

var thingShadow = awsIot.thingShadow({
  keyPath: process.env.AWS_IOT_KEY_PATH,
  certPath: process.env.AWS_IOT_CERT_PATH,
  caPath: process.env.AWS_IOT_CA_PATH,
  clientId: process.env.AWS_IOT_CLIENT_ID,
  region: process.env.AWS_IOT_REGION
});

thingShadow.on('connect', function () {
  console.log('connect');
  thingShadow.register(process.env.AWS_IOT_CLIENT_ID);
});

thingShadow.on('message', function (topic, message) {
  console.log('message', topic, message);
});

thingShadow.on('delta', function (thingName, state) {
  console.log('delta', thingName, state);
});

thingShadow.on('timeout', function (thingName, clientToken) {
  console.log('timeout', thingName, clientToken);
});

function listenForStatus (res) {
  thingShadow.on('status', function (thingName, status, clientToken, stateObject) {
    console.log('status');
    if (status === 'accepted') {
      console.log('request accepted');
      res.json({
        response_type: 'in_channel',
        attachments: [
          {
            title: 'Lounge status',
            title_link: 'https://s3-us-west-2.amazonaws.com/rpi-aws-iot/camera.jpg',
            image_url: 'https://s3-us-west-2.amazonaws.com/rpi-aws-iot/camera.jpg'
          }
        ]
      });
    } else {
      console.log('request rejected');
      res.json({
        response_type: 'in_channel',
        text: 'Error: request rejected'
      });
    }
  });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('port', (process.env.PORT || 5000));

app.post('/', function (req, res) {
  res.status(200);
  if (req.body.token === process.env.SLACK_TOKEN) {
    console.log('valid Slack token');

    listenForStatus(res);

    var clientToken = thingShadow.get(process.env.AWS_IOT_CLIENT_ID);
    if (!clientToken) {
      console.log('invalid client token');
      res.json({
        response_type: 'in_channel',
        text: 'Error: operation currently in progress'
      });
    } else {
      console.log('valid client token:', clientToken);
    }

  } else {
    console.log('invalid Slack token');
    res.json({
      response_type: 'in_channel',
      text: 'Error: token mismatch'
    });
  }
});

app.listen(app.get('port'), function () {
  console.log('Listening on port', app.get('port'));
});