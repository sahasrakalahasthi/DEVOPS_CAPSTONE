require('dotenv').config()
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const express = require('express');
const Movie = require('./Models/Movie');
const multer = require('multer');
const cors = require('cors')
const AWS = require('aws-sdk');
const fs = require('fs');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

mongoose.connect('mongodb+srv://kalahasthisahasra:sahasra2002@cluster0.jvg0wxr.mongodb.net/api', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));



const app = express();
const port = 5000;

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors())

// multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage });


// routes
app.post('/api/movies', upload.single('poster'), async (req, res) => {
  try {
    const fileContent = fs.readFileSync(req.file.path);
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${Date.now()}-${req.file.originalname}`,
      Body: fileContent,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    };
    const s3Data = await s3.upload(params).promise();
    const movie = new Movie({
      title: req.body.title,
      director: req.body.director,
      releaseYear: req.body.releaseYear,
      poster: s3Data.Location,
    });
    await movie.save(); 
    res.send(movie);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in package.json
RUN npm install

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Start the app when the container launches
CMD ["npm", "start"]

app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.send(movies);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
});