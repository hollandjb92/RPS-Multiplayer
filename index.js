//initialize player objects that will be stored in Firebase
let playerOne = null;
let playerTwo = null;

//player Names
let playerOneName = "";
let playerTwoName = "";

//player RPS pick
let playerOnePick = "";
let playerTwoPick = "";

//differentiates between Player 1 and 2
let thisPlayer = "";

//toggle turn
let turn = 1;

//firebase config

var firebaseConfig = {
  apiKey: "AIzaSyCV7T_CLEgb4cR5UF4w0cDBhosReWRK-vg",
  authDomain: "rps-multiplayer-9196d.firebaseapp.com",
  databaseURL: "https://rps-multiplayer-9196d.firebaseio.com",
  projectId: "rps-multiplayer-9196d",
  storageBucket: "",
  messagingSenderId: "371507621261",
  appId: "1:371507621261:web:e44302b78130ccdd"
};

firebase.initializeApp(firebaseConfig);
let database = firebase.database();



//add player to firebase after they have submit their name
$("#submitName").on("click", function (event) {
  //prevent default action
  event.preventDefault();
  //if playerName input isn't empty and neither player 1 or 2 exists (make player 1 first)
  if (($("#playerName").val().trim().length > 0) && !(playerOne && playerTwo)) {
    if (playerOne === null) {
      //player 1 Object
      thisPlayer = $("#playerName").val().trim()
      playerOne = {
        name: thisPlayer,
        wins: 0,
        losses: 0,
        draws: 0,
        pick: ""
      }

      //add player 1 to firebase
      database.ref().child("/players/playerOne").set(playerOne);

      //remove user from database if they disconnect from game
      database.ref("/players/playerOne").onDisconnect().remove();
      //set turn 1
      database.ref().child("/turn").set(1);

      //if player 1 already exists create the player 2 object
    } else if (playerOne !== null && playerTwo === null) {

      thisPlayer = $("#playerName").val().trim()
      playerTwo = {
        name: thisPlayer,
        wins: 0,
        losses: 0,
        draws: 0,
        pick: ""
      }

      //store player2 in firebase and remove them if they disconnect
      database.ref().child("/players/playerTwo").set(playerTwo);

      database.ref("/players/playerTwo").onDisconnect().remove();
    }

    //created a message that player has joined the game/chat
    let message = thisPlayer + " has joined the game!"
    let key = database.ref().child("/chat/").push().key;

    database.ref("/chat/" + key).set(message)
    $("#playerName").val("")
  }
});

//when user clicks on chat submit button
$("#chatSubmit").on("click", function (event) {
  //prevent default action
  event.preventDefault();

  //if the player exists/has a name and they actually typed text
  if ((thisPlayer.length > 0) && ($("#chatInput").val().trim().length > 0)) {
    //grab the input, empty the input box, and add to chat box
    let message = thisPlayer + ": " + $("#chatInput").val().trim();
    $("#chatInput").val("");

    let key = database.ref().child("/chat/").push().key;
    database.ref("/chat/" + key).set(message);
  }
});

//when user clicks on answer option
$(".option").on("click", function (event) {
  event.preventDefault();
  console.log($(this))
  //if player 1 and two exist and it's player one's turn
  if (playerOne && playerTwo && (thisPlayer === playerOne.name) && turn === 1) {
    //grab alt value to use as answer text
    let playerChoice = $(this).children("img").attr("alt");
    console.log(playerChoice);
    //add their choice to database
    database.ref().child("/players/playerOne/pick").set(playerChoice);
    //switch to player 2
    turn = 2;
    database.ref().child("/turn").set(2);

    //if both players exist and it's player two's turn
  } else if (playerOne && playerTwo && (thisPlayer === playerTwo.name) && turn === 2) {

    //grab their choice from image and store in database
    let playerChoice = $(this).attr("alt");
    console.log(playerChoice)
    database.ref().child("/players/playerTwo/pick").set(playerChoice);

    //run check result function
    checkResult();
  }
});


//check for any changes in players 
database.ref("/players/").on("value", function (snapshot) {
  //if player 1 exists
  if (snapshot.child("playerOne").exists()) {
    //grab the object and the name
    playerOne = snapshot.val().playerOne;
    playerOneName = playerOne.name;

    //add the name and the win stats to the HTML
    $("#playerOneName").html(playerOneName)
    $("#playerOneStats").html("Wins: " + playerOne.wins + "<br/> Losses: " + playerOne.losses + "<br/> Draws: " + playerOne.draws)
  } else {
    //if player 1 doesn't exist remove from HTML and nullify playerOne Object
    playerOneName = "";
    playerOne = null;

    //reset stats, html, and database
    $("#playerOneStats").html("Wins: 0 <br/> Losses: 0 <br/> Draws: 0")
    $("#waitingForOpponent").html("");
    database.ref("/outcomes/").remove();


  }

  //if player 2 exists
  if (snapshot.child("playerTwo").exists()) {
    //grab player 2 object and name
    playerTwo = snapshot.val().playerTwo;
    playerTwoName = playerTwo.name;
    //change HTML
    $("#playerTwoName").html(playerTwoName)
    $("#playerTwoStats").html("Wins: " + playerTwo.wins + "<br/> Losses: " + playerTwo.losses + "<br/> Draws: " + playerTwo.draws)

    //or reset object/HTML
  } else {
    playerTwoName = "";
    playerTwo = null;

    $("#playerTwoStats").html("Wins: 0 <br/> Losses: 0 <br/> Draws: 0")
    $("#waitingForOpponent").html("");
    database.ref("/outcomes/").remove();
  }

  //if both players exists
  if (playerOne && playerTwo) {
    //let player 1 know it's there turn
    $("#waitingForOpponent").html("Waiting for " + playerOneName + " to make their move")
  }

  //if neither player exists reset the game/chat
  if (!playerOne && !playerTwo) {
    database.ref("/chat/").remove();
    database.ref("/turn/").remove();
    database.ref("/outcomes/").remove();

    $("#chat").empty();
    $("#waitingForOpponent").html("");
  }
});

//when a user leaves the game
database.ref("/players/").on("child_removed", function (snapshot) {
  //push a message in chat and remove their name from HTML
  let message = snapshot.val().name + " has left the game!";
  let key = database.ref().child("/chat/").push().key;

  database.ref("/chat/" + key).set(message)

  // if ($("#playerOneName") === snapshot.val().name) {
  //   $("#playerOneName").val("");
  // } else if ($("#playerTwoName") === snapshot.val().name) {
  //   $("#playerTwoName").val("");
  // }

})

//whenever a new message is posted in chat
database.ref("/chat/").on("child_added", function (snapshot) {
  let message = snapshot.val();
  let chatMessage = $("<div class='chatText'>").html(message);
  $("#chat").append(chatMessage);
})

//whenever the turn changes
database.ref("/turn/").on("value", function (snapshot) {
  //if player 1s turn
  if (snapshot.val() == 1) {
    turn = 1;

    if (playerOne && playerTwo) {
      //alert them to make their move
      $("#waitingForOpponent").html("Waiting for " + playerOneName + " to make their move")
    }
    //if player twos turn
  } else if (snapshot.val() == 2) {
    turn = 2;
    //alert them to make their move
    if (playerOne && playerTwo) {
      $("#waitingForOpponent").html("Waiting for " + playerTwoName + " to make their move")
    }
  }
});

//add winning player in HTML
database.ref("/outcomes/").on("value", function (snapshot) {
  $("#result").html(snapshot.val())
})

//compare player picks, adjust stats and switch back to turn 1 
function checkResult() {

  if (playerOne.pick === "Rock") {

    if (playerTwo.pick === "Paper") {
      database.ref().child("/outcomes/").set(playerTwo.name + " wins!");
      database.ref().child("/players/playerOne/losses").set(playerOne.losses + 1);
      database.ref().child("/players/playerTwo/wins").set(playerTwo.wins + 1);
    } else if (playerTwo.pick === "Scissors") {
      database.ref().child("/outcomes/").set(playerOne.name + " wins!");
      database.ref().child("/players/playerOne/wins").set(playerOne.wins + 1);
      database.ref().child("/players/playerTwo/losses").set(playerTwo.losses + 1);
    } else if (playerTwo.pick === "Rock") {
      database.ref().child("/outcomes/").set("Draw!");
      database.ref().child("/players/playerOne/draws").set(playerOne.draws + 1);
      database.ref().child("/players/playerTwo/draws").set(playerTwo.draws + 1);
    }
  } else if (playerOne.pick === "Paper") {


    if (playerTwo.pick === "Rock") {

      database.ref().child("/outcomes/").set(playerOne.name + " wins!");
      database.ref().child("/players/playerOne/wins").set(playerOne.wins + 1);
      database.ref().child("/players/playerTwo/losses").set(playerTwo.losses + 1);
    } else if (player2.pick === "Paper") {
      database.ref().child("/outcomes/").set("Draw!");
      database.ref().child("/players/playerOne/draws").set(playerOne.draws + 1);
      database.ref().child("/players/playerTwo/draws").set(playerTwo.draws + 1);
    } else if (player2.pick === "Scissors") {
      database.ref().child("/outcomes/").set(playerTwo.name + " wins!");
      database.ref().child("/players/playerOne/losses").set(playerOne.losses + 1);
      database.ref().child("/players/playerTwo/wins").set(playerTwo.wins + 1);
    }
  } else if (playerOne.pick === "Scissors") {


    if (playerTwo.pick === "Rock") {

      database.ref().child("/outcomes/").set(playerTwo.name + " wins!");
      database.ref().child("/players/playerOne/losses").set(playerOne.losses + 1);
      database.ref().child("/players/playerTwo/wins").set(playerTwo.wins + 1);
    } else if (player2.pick === "Paper") {

      database.ref().child("/outcomes/").set(playerOne.name + " wins!");
      database.ref().child("/players/playerOne/wins").set(playerOne.wins + 1);
      database.ref().child("/players/playerTwo/losses").set(playerTwo.losses + 1);
    } else if (playerTwo.pick === "Scissors") {

      database.ref().child("/outcomes/").set("Draw!");
      database.ref().child("/players/playerOne/draws").set(player1.draws + 1);
      database.ref().child("/players/playerTwo/draws").set(player2.draws + 1);
    }
  }

  turn = 1;
  database.ref().child("/turn").set(1);


}