var express = require('express'),
    app = express();

app.set('port', (process.env.PORT || 5000));

app.post('/', function (req, res) {
  res.status(200);
  res.json({
    response_type: 'in_channel',
    text: 'It\'s 80 degrees right now.',
    attachments: [
      {
        title: 'Lounge status',
        title_link: 'https://s3-us-west-2.amazonaws.com/rpi-aws-iot/camera.jpg',
        image_url: 'https://s3-us-west-2.amazonaws.com/rpi-aws-iot/camera.jpg'
      }
    ]
  });
});

app.listen(app.get('port'));