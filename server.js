require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const dns = require('dns');
const urlbodyparser = require('url');

app.use(bodyParser.urlencoded({extended: true}));

// Basic Configuration
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
mongoose.connect(process.env.URL, {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Connection to MongoDB was successful");
});



app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let urlSchemma = mongoose.Schema({
  original:{type:String,require: true},
  short: Number
})

let Url = mongoose.model('Url',urlSchemma);

let responseObject = {};

app.post('/api/shorturl/new',function(req,res){
  let urlInput = req.body.url;

  // var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;

  // let urlRegex = new RegExp(expression);
  // if(!urlInput.match(expression)){
  //   res.json({error: 'invalid url'});
  //   return;
  // }
  dns.lookup(urlbodyparser.parse(urlInput).hostname,function(err,temp){
    if(!temp){
      res.json({error: 'invalid url'});
      return;
    }
  })

  responseObject['original_url']=urlInput;
  let inputShort =1;
  Url.findOne({}).sort({short:'desc'}).exec((err,result)=>{
    if(!err && result != undefined){
      inputShort = result.short +1;
    }
    if(!err){
      Url.findOneAndUpdate({original:urlInput},{
        original:urlInput,short:inputShort
      },{new:true,upsert:true},(err,temp)=>{
        if(!err){
          responseObject['short_url']= temp.short;
          res.json(responseObject);
        }
      })
    }else{
      res.json({ error: 'invalid url' });
    }
  });
})

app.get('/api/shorturl/:input',function(req,res){
  let userInput = req.params.input;
  Url.findOne({short:userInput},function(err,temp){
    if(!err && temp != undefined){
      res.redirect(temp.original);
    }else{
      res.json({error: 'invalid url'});
    }
  })
})