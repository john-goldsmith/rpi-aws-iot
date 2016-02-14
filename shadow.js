var express = require('express'),
    bodyParser = require('body-parser'),
    awsIot = require('aws-iot-device-sdk'),
    app = express();

var thingShadow = awsIot.thingShadow({
  keyPath: process.env.AWS_IOT_KEY_PATH,
  certPath: process.env.AWS_IOT_CERT_PATH,
  caPath: process.env.AWS_IOT_CA_PATH,
  // clientId: process.env.AWS_IOT_CLIENT_ID,
  region: process.env.AWS_IOT_REGION
});

thingShadow.on('connect', function () {
  console.log('connect');
});

thingShadow.on('message', function (topic, message) {
  console.log('message', topic, message);
});

thingShadow.on('delta', function (thingName, state) {
  console.log('delta', thingName, state);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('port', (process.env.PORT || 5000));

app.post('/', function (req, res) {
  console.log('incoming request');
  if (req.body.token === process.env.SLACK_TOKEN) {
    console.log('valid Slack token');
    thingShadow.register(process.env.AWS_IOT_CLIENT_ID);
    console.log('registered interest');

    thingShadow.subscribe('s3_success');
    // thingShadow.subscribe('s3_success', {qos: 0}, function (err, granted) {
    //   console.log('s3_success', err, granted);
    // });

    thingShadow.on('timeout', function (thingName, clientToken) {
      console.log('timeout', thingName, clientToken);
      res.status(200).json({
        response_type: 'in_channel',
        text: 'Error: timeout'
      });
    });
    // thingShadow.on('status', function (thingName, status, clientToken, stateObject) {
    thingShadow.on('message', function (topic, message) {
      // console.log('status', thingName);
      console.log('message', topic, message);
      // if (status === 'accepted') {
      if (topic === 's3_success') {
        console.log('request accepted');
        res.status(200).json({
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
        res.status(200).json({
          response_type: 'in_channel',
          text: 'Error: request rejected'
        });
      }
      thingShadow.unregister(process.env.AWS_IOT_CLIENT_ID);
      console.log('unregistered interest');
    });

    setTimeout(function () {
      var clientToken = thingShadow.get(process.env.AWS_IOT_CLIENT_ID);
      if (!clientToken) {
        console.log('invalid client token');
        res.status(200).json({
          response_type: 'in_channel',
          text: 'Error: operation currently in progress'
        });
      } else {
        console.log('valid client token:', clientToken);
      }
    }, 3000);

  } else {
    console.log('invalid Slack token');
    res.status(200).json({
      response_type: 'in_channel',
      text: 'Error: token mismatch'
    });
  }
});

app.listen(app.get('port'), function () {
  console.log('Listening on port', app.get('port'));
});