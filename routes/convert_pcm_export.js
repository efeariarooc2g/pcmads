var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('convert_pcm_export', {});
});

module.exports = router;
