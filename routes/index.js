require('dotenv').config()
var express = require('express');
var router = express.Router();
const multer = require('multer');
const {Storage} = require('@google-cloud/storage')
const crypto = require('crypto')
const path = require('path')
const googleCloudStorage = new Storage({
  projectId: process.env.GCLOUD_STORAGE_BUCKET,
  keyFilename: process.env.GCLOUD_KEY_FILE
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});

const bucket = googleCloudStorage.bucket('bucket-cv-test');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).json({
    message: 'done'
  })
});

router.post('/', upload.single('profpic'), function (req, res, next) {
  const newFileName = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname)
  const blob = bucket.file(newFileName);

  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  blobStream.on("error", err => {
    next(err);
    return;
  });

  blobStream.on("finish", () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

    // Make the image public to the web (since we'll be displaying it in browser)
    blob.makePublic().then(() => {
      res.status(200).json({
        url: publicUrl
      });
    });
  });

  blobStream.end(req.file.buffer);


})
module.exports = router;
