const express = require('express');
const bodyParser = require('body-parser');
const client = require("@mailchimp/mailchimp_marketing");
var md5 = require('md5');

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}))

client.setConfig({
  apiKey: "MAILCHIMP API KEY",
  server: "LAST 3 DIGITS",
});
let listID = "MD5 OF MEMBER";

//client.setConfig({
//   apiKey: "a063396a43ddbb9d3aa544cbbf0fee09-us8",
//   server: "us8",
// });
// let listID = "c404a3b406"; 

function createOrResubscribeMember(firstName, lastName, email, emailHash, res){

  const addNewOrUnsubscribedMember = async () => {
    try {
      const response = await client.lists.setListMember(
        listID,
        emailHash,
        {
          email_address: email, 
          status: "subscribed",
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
          }
      }
      );
      if(res.statusCode==200){
        res.sendFile(__dirname + "/public/pages/succefull.html");
      } else{
        res.sendFile(__dirname + "/public/pages/failure.html");
      }
    } catch (error) {
      res.sendFile(__dirname + "/public/pages/failure.html");
    }
  };

  const checkIfMemberExistsToLogin = async () => {
    try {
      const response = await client.lists.getListMember(
        listID,
        emailHash,
      );
      if(res.statusCode==200){
        if(response.status=='unsubscribed'){
          run();
        } else{
          res.sendFile(__dirname + "/public/pages/alreadySubscribed.html");
        }
    }} catch (err) {
      addNewOrUnsubscribedMember();
  }};
  
  checkIfMemberExistsToLogin();
}

function unsubscribeSupossedMember(emailToCancel, emailHash, res){

  const updateMember = async () => {
    const response = await client.lists.updateListMember(
        listID,
        emailHash,
        {
          email_address: emailToCancel,
          status:"unsubscribed",
        }
      );
      if(res.statusCode==200){
        res.sendFile(__dirname + "/public/pages/unsubscribed.html");
    }
  }

  const checkIfMemberExistsToCancel = async () => {
    try {
      const response = await client.lists.getListMember(
        listID,
        emailHash,
      );
      if(res.statusCode==200){
        if(response.status=='unsubscribed'){
          res.sendFile(__dirname + "/public/pages/alreadyUnsubscribed.html");
        } else{
          updateMember();
        }
      }
    } catch (err) {
      res.sendFile(__dirname + "/public/pages/error404.html");
    }
  }

  checkIfMemberExistsToCancel();
}

app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
})

app.get("/subscribe", function(req, res){
    res.sendFile(__dirname + "/public/pages/subscribe.html");
})

app.post("/new_user", function(req, res){
    const firstName = req.body.fName;
    const lastName = req.body.lName;
    const email = req.body.email;
    const emailHash = md5(email);

    createOrResubscribeMember(firstName, lastName, email, emailHash, res);    
})

app.get("/unsubscribe", function(req, res){
    res.sendFile(__dirname + "/public/pages/unsubscribe.html");
})

app.post("/cancel_user", function(req, res){
    let emailToCancel = req.body.emailToCancel;
    emailHash = md5(emailToCancel);

    unsubscribeSupossedMember(emailToCancel, emailHash, res);
})

app.listen(process.env.PORT ||3000, function(req, res){
  console.log('Running on port 3000');
})
