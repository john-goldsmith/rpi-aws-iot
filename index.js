var express = require('express'),
    app = express();

app.set('port', (process.env.PORT || 5000));

app.post('/', function (req, res) {
  res.json({
    foo: 'bar'
  });
});

app.listen(app.get('port'));