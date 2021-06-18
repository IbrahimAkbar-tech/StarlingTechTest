/*

 @description This web application takes all transactions ands rounds them to the nearest pound, this value is then transferred into a savings goal. The application uses Express, axios, request,
 EJS and bodyParser to achieve its results.

 @input All information is extracted directly from Starling bank Sandbox API calls.

 @output Shows customer accounts/account type, SavingLists (if any), total in savings currently, outgoing transaction(s) and rounded up feature "total to be saved"

 @Issues Seems as though all transactions are made on the same day and same time. This must be due to Auto-simulator that populated the Feed API with a set of results with the same date. Cannot test
 for different weeks.

*/
require('dotenv').config();
const axios = require('axios');
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const ejs = require("ejs");

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');

const accountUid = process.env.ACCOUNTUID;
const categoryUid = process.env.CATEGORYUID;
const savingGoalsUid = process.env.SAVINGGOALSUID;
const transferUid = process.env.TRANSFERUID;

const token = "Bearer " + process.env.TOKEN;

const url = process.env.URL;
const saveGoalUrl = process.env.SAVEGOALURL;
const transferUrl = process.env.TRANSFERURL;
const addMoneyUrl = process.env.ADDMONEYURL;
const urlFeed = process.env.URLFEED;
const deleteSaving = process.env.DELETESAVING;
const port = 3000;

let moneySpent = [];
let savingGoals = [];
let saveGoals = [];
let moneyInPounds = [];
let saveListname, letTotalSavedGBP, accountData, accountType, saveGoalsInt, newnum;

/*--------------------------------------------- object(s) used to get/put data below ---------------------------------------------*/

//GET object used to retrieve info
var options = {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: token
  }
};

/*--------------------------------------------- Get requests below ---------------------------------------------*/

//axios request to retrieve Account information (name, type)
axios.get(url, options).then((resp, err) => {
  if (!err) {
    const data = resp.data;
    accountData = data.accounts[0].name;
    accountType = data.accounts[0].accountType;
  }
});

//axios request to retrieve feed data
//Loops through all feed items and filters out only those which are "OUT"
//converts minorUnits to GBP format
axios.get(urlFeed, options).then((resp, err) => {
  if (!err) {
    const data = resp.data;
    //console.log(data);
    //console.log(data.feedItems);
    const out = data.feedItems[4].direction;
    for (let i = 0; i < data.feedItems.length; i++) {
      if (data.feedItems[i].direction === out) {
        //console.log(data.feedItems[i]);
        moneySpent.push(data.feedItems[i].amount.minorUnits);
      }
    }

    moneyInPounds = moneySpent.map(x => {
      return x / 100;
    });

    for (let i = 0; i < moneyInPounds.length; i++) {
      savingGoals.push(Math.ceil(moneyInPounds[i]) - moneyInPounds[i]);
    }

    saveGoals.push(savingGoals.reduce((a, b) => a + b, 0));
    saveGoalsInt = saveGoals[0];
  } else {
    console.log(err);
  }
});

//axios request to retrieve savings goals
axios.get(saveGoalUrl, options).then((resp, err) => {
  if (!err) {
    const data = resp.data;
    console.log(data.savingsGoalList);

    saveListName = data.savingsGoalList[0].name;
    letTotalSavedGBP = data.savingsGoalList[0].totalSaved.minorUnits / 100;
    //console.log(saveGoals);
  }
});

app.get("/", function(req, res) {
  res.render("home", {
    moneyInPounds: moneyInPounds,
    saveGoals: saveGoals,
    saveListName: saveListName,
    letTotalSavedGBP: letTotalSavedGBP,
    accountData: accountData,
    accountType: accountType
  });
});

/*--------------------------------------------- Posting data ---------------------------------------------*/


//PLEASE UNCOMMENT PARTS OF THE CODE YOU WISH TO CHECK
//PLEASE ONLY UNCOMMENT ONE PUT REQUEST AT A TIME AND RUN EACH TIME
//THE "SEND" BUTTON WILL ACT AS THE SENDER FOR ANY OF THE BELOW LISTED PUT REQUESTS
//ORDER SHOULD BE:
// 1. CREATE SAVING LIST
// 2. CREATE TRANSFER (OBTAIN TFERUID)
// 3. ADD TO savings
// 4. DELETE SAVINGS (OPTIONAL)

app.post("/", (req, res) => {
      newnum = parseFloat(saveGoalsInt).toFixed(2);
      console.log(saveGoalsInt);
      console.log(newnum);

      // 1. create a savings list so users can add to their savings
      // request.put({
      //   url: saveGoalUrl,
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //     Authorization: token
      //   },
      //   json: true,
      //   body: {
      //     "name": "Trip to Starling",
      //     "currency": "GBP",
      //   }
      // }, (err, res, body) => {
      //       if(err){
      //         return console.log(err);
      //       }
      //       console.log('Status: ' + res.statuseCode);
      //       console.log(body);
      //     });

      // 2. create a transfer to obtain transferUid
      // request.put({
      //   url: transferUrl,
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //     Authorization: token
      //   },
      //   json: true,
      //   body: {
      //     "recurrenceRule": {
      //       "startDate": "2021-06-18",
      //       "frequency": "DAILY",
      //       "interval": 3,
      //       "count": 14,
      //       "untilDate": "2021-06-18",
      //       "days": [
      //         "FRIDAY"
      //       ]
      //     },
      //     "amount": {
      //       "currency": "GBP",
      //       "minorUnits": newnum * 100
      //     }
      //   }
      // }, (err, res, body) => {
      //   if (err) {
      //     return console.log(err);
      //   }
      //   console.log('Status: ' + res.statusCode);
      //   console.log(body);
      // });

      // 3. request to add to savings account, takes addToSavings object as a value
      // request.put({
      //   url: addMoneyUrl,
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //     Authorization: token
      //   },
      //   json: true,
      //   body: {
      //     "amount": {
      //       "currency": "GBP",
      //       "minorUnits": newnum * 100
      //     }
      //   }
      // }, (err, res, body) => {
      //   if (err) {
      //     return console.log(err);
      //   }
      //   console.log(newnum * 100);
      //   console.log('Status: ' + res.statusCode);
      //   console.log(body);
      // });

      // 4. request to delete a list, a better way to do this would be to assign the below as a function to an onClick and upon pressing executes the following:
          // request.delete({
          //   url: deleteSaving,
          //   headers: {
          //     Accept: 'application/json',
          //     Authorization: token
          //   }
          // }, (err, res, body) => {
          //   if (err) {
          //     return console.log(err);
          //   }
          //   console.log('Status: ' + res.statusCode);
          //   console.log(body);
          // });

      });

      app.listen(port, () => {
        console.log("Server started on port 3000");
      });
