//imports the npm package
var express = require("express");
var dateFormat = require('dateformat');

//creates the router controller from the express servers
var router = express.Router();

// Import the model to use its database functions.
var user = require("../models/userModel.js");
var race = require("../models/raceModel.js");
var user_race = require("../models/userRaceModel.js");
var userRace_history = require("../models/userRaceHistoryModel.js");

//api for returning active race of user
router.get("/getRaceInfo/:raceId", function(req, res){
  race.selectAllForOne("id",req.params.raceId, function(data){
    res.send(data);
  });
});

//main activity route shows home page
router.get("/:id", function(req, res) {
  var userId = req.params.id;
  if(req.params.id != 'favicon.ico')
    user.one(userId, function(data){
      user_race.getActiveRace(userId, function(data2){
        race.selectAllForOne("id", data2, function(raceInfo){

          var raceId = null;
          if(raceInfo){
            raceId = raceInfo.ID;
            raceInfo.startDate = dateFormat(raceInfo.startDate, "mmmm dS, yyyy") || 'N/A';
            raceInfo.endDate = dateFormat(raceInfo.endDate, "mmmm dS, yyyy") || 'N/A';
          }

          user_race.getNumOfRaces(userId, function(numRaces){
            var extraInfo = {};

            extraInfo.numRaces = numRaces.count || 0;
            
            user_race.getNumOf1st(userId, function(numOf1st){
              extraInfo.placeFirst = numOf1st.count || 0;

              userRace_history.getTotalDistance(userId, function(dist){
                extraInfo.totDistance = dist.sum || 0;

                userRace_history.getSumStatsOfRaceUser(userId, raceId, function(sumStats){
                  extraInfo.totDistance = (sumStats.totDistance/1609.34).toFixed(2) || 0;
                  extraInfo.totTime = (sumStats.totTime/60/60).toFixed(2) || 0;
                  extraInfo.distRemaining = (sumStats.distRemaining/1609.34).toFixed(2) || 0;
                  extraInfo.avgSpeed = (sumStats.avgSpeed/0.44704).toFixed(2) || 0;
                  extraInfo.avgPace = (sumStats.avgPace/0.0372823).toFixed(2) || 0;

                  userRace_history.getSelectedActivity(userId, raceId, function(recentActivity){
                    if(recentActivity){
                      extraInfo.latestDist = (recentActivity.distance/1609.34).toFixed(2);
                      extraInfo.latestTime = (recentActivity.time/60/60).toFixed(2);
                      extraInfo.latestDt = dateFormat(recentActivity.activityDt, "mmmm dS, yyyy");
                    }
                    else{
                      extraInfo.latestDist = 0;
                      extraInfo.latestTime = 0;
                      extraInfo.latestDt = 'N/A';
                    }

                    res.render("activity", {user:data, race:data2, raceInfo:raceInfo, extraInfo});
                  });
                });
              });
            });
          });
        });
      });
    });
});

router.get("/chart/:userid/:raceid", function(req, res){
  userRace_history.chartSelectedInfo(["user_id", "race_id"], [req.params.userid, req.params.raceid], function(data){
    res.send(data);
  })
});

router.get("/new/:id", function(req, res){
  user.one(req.params.id, function(data){
    res.render("newRace", data);
  });
});

router.get("/join/:id", function(req, res){
  res.render("joinRace");
});

router.get("/past/:id", function(req, res){
  res.render("pastRaces");
});

//main index route shows home page
router.get("*", function(req, res) {
  res.render("index", {error:false});
});

//main update route for the devour button
router.put("/:id", function(req, res) {
    user.update({
    devoured: true
  }, req.params.id, function() {
    res.redirect("/");
  });
});
 //main post route that creates the new user
router.post("/progress/:userId/:raceId", function(req, res) {
  user.insert([
    "user_id","race_id","distance","time","activityDt"
  ], [
    req.params.userId, req.params.raceId, req.body.distance,
  ], function(id) {
    res.redirect("/"+id);
  });
});

//main post route that creates the new user
router.post("/", function(req, res) {
  user.insert([
    "userName", "firstName", "lastName", "password",
    "city", "state", "email"
  ], [
    req.body.userName, req.body.firstName, req.body.lastName, req.body.password,
    req.body.city, req.body.state, req.body.email
  ], function(id) {
    res.redirect("/"+id);
  });
});

//main route to the activity page for sign in
router.post("/activity", function(req, res){
  user.login("userName", req.body.userName, "password", req.body.password,
  function(id){
    if(id)
      res.redirect("/"+id);
    else
      res.render("index", {error:true});
  });
});

router.post("/id/race_id")

// Export routes for server.js to use.
module.exports = router;
