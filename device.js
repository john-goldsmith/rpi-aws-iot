require('dotenv').config();
var awsIot = require('aws-iot-device-sdk'),
    AWS = require('aws-sdk'),
    exec = require('child_process').exec,
    fs = require('fs'),
    s3 = new AWS.S3();

var device = awsIot.device({
   keyPath: process.env.AWS_IOT_KEY_PATH,
  certPath: process.env.AWS_IOT_CERT_PATH,
    caPath: process.env.AWS_IOT_CA_PATH,
  clientId: process.env.AWS_IOT_CLIENT_ID,
    region: process.env.AWS_IOT_REGION
});

function execute (command, callback){
  exec(command, function (error, stdout, stderr) {
    callback(stdout);
  });
}

device.on('connect', function () {
  console.log('connect');
  device.subscribe('$aws/things/RPi/shadow/get/accepted');
  // device.subscribe('$aws/things/RPi/shadow/get/rejected');
});

device.on('message', function (topic, payload) {
  console.log('message', topic, payload.toString());
  execute(`raspistill -vf -hf -w 800 -h 600 -v -o ~/camera/camera.jpg`, function () {
    s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: 'camera.jpg',
      ACL: 'public-read',
      Body: fs.createReadStream(`/home/pi/camera/camera.jpg`),
      ContentType: 'image/jpeg'
    }, function (err, data) {
      if (err) {
        console.log('S3 Error:', err);
      } else {
        console.log('S3 Success:', data);
        device.publish('$aws/things/RPi/shadow/update', JSON.stringify({
          state: {
            reported: {
              link: `https://s3-${process.env.AWS_IOT_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET}/key1`
            }
          }
        }));
      }
    });
  });
});