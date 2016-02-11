var express = require('express'),
    bodyParser = require('body-parser'),
    app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('port', (process.env.PORT || 5000));

app.post('/', function (req, res) {
  console.log(req.body);
  res.status(200);
  if (req.body.token === process.env.SLACK_TOKEN) {
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
    res.json({
      response_type: 'in_channel',
      text: 'Error: token mismatch'
    });
  }
});

app.listen(app.get('port'), function () {
  console.log('Listening on port', app.get('port'));
});