let playerOne = null;
let playerTwo = null;

let playerOneName = "";
let playerTwoName = "";

let playerOnePick = "";
let playerTwoPick = "";

let thisPlayer = "";

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



$("#submitName").on("click", function (event) {
  event.preventDefault();

  if (($("#playerName").val().trim().length > 0) && !(playerOne && playerTwo)) {
    if (playerOne === null) {
      thisPlayer = $("#playerName").val().trim()
      playerOne = {
        name: thisPlayer,
        wins: 0,
        losses: 0,
        draws: 0,
        pick: ""
      }

      database.ref().child("/players/playerOne").set(playerOne);


      database.ref("/players/playerOne").onDisconnect().remove();
      database.ref().child("/turn").set(1);
    } else if (playerOne !== null && playerTwo === null) {

      thisPlayer = $("#playerName").val().trim()
      playerTwo = {
        name: thisPlayer,
        wins: 0,
        losses: 0,
        draws: 0,
        pick: ""
      }

      database.ref().child("/players/playerTwo").set(playerTwo);

      database.ref("/players/playerTwo").onDisconnect().remove();
    }

    let message = thisPlayer + " has joined the game!"
    let join = database.ref().child("/chat/").push().key;

    database.ref("/chat/" + join).set(message)
    $("#playerName").val("")
  }
});

$("#chatSubmit").on("click", function (event) {
  event.preventDefault();

  if ((thisPlayer !== "") && ($("#chatInput").val().trim() !== "")) {
    let message = thisPlayer + ": " + $("#chatInput").val().trim();
    $("#chatInput").val("");

    let chatMessage = database.ref().child("/chat/").push().key;
    database.ref("/chat/" + chatMessage).set(message);
  }
});

$(".option").on("click", function (event) {
  event.preventDefault();

  if (playerOne && playerTwo && (thisPlayer === playerOne.name) && turn === 1) {
    let playerChoice = $(this).text().trim();

    database.ref().child("/players/playerOne/pick").set(playerChoice);

    turn = 2;
    database.ref().child("/turn").set(2);
  }
});

$(".option").on("click", function (event) {
  event.preventDefault();

  if (playerOne && playerTwo && (thisPlayer === playerTwo.name) && turn === 2) {
    let playerChoice = $(this).text().trim();

    database.ref().child("/players/playerTwo/pick").set(playerChoice);


    checkResult();
  }
});







database.ref("/players/").on("value", function (snapshot) {
  if (snapshot.child("playerOne").exists()) {
    playerOne = snapshot.val().playerOne;
    playerOneName = playerOne.name;

    $("#playerOneName").html(playerOneName)
    $("#playerOneStats").html("Wins: " + playerOne.wins + "<br/> Losses: " + playerOne.losses + "<br/> Draws: " + playerOne.draws)
  } else {
    playerOneName = "";
    playerOne = null;

    $("#playerOneStats").html("Wins: 0 <br/> Losses: 0 <br/> Draws: 0")
    $("#waitingForOpponent").html("");
    $("#result").html("Rock, Paper, Scissors")
    database.ref("/outcomes/").remove();


  }

  if (snapshot.child("playerTwo").exists()) {
    playerTwo = snapshot.val().playerTwo;
    playerTwoName = playerTwo.name;

    $("#playerTwoName").html(playerTwoName)
    $("#playerTwoStats").html("Wins: " + playerTwo.wins + "<br/> Losses: " + playerTwo.losses + "<br/> Draws: " + playerTwo.draws)
  } else {
    playerTwoName = "";
    playerTwo = null;

    $("#playerTwoStats").html("Wins: 0 <br/> Losses: 0 <br/> Draws: 0")
    $("#waitingForOpponent").html("");
    $("#result").html("Rock, Paper, Scissors")
    database.ref("/outcomes/").remove();
  }

  if (playerOne && playerTwo) {
    $("#waitingForOpponent").html("Waiting for " + playerOneName + " to make their move")
  }

  if (!playerOne && !playerTwo) {
    database.ref("/chat/").remove();
    database.ref("/turn/").remove();
    database.ref("/outcomes/").remove();

    $("#chat").empty();
    $("#result").html("Rock, Paper, Scissors");
    $("#waitingForOpponent").html("");
  }
});


database.ref("/players/").on("child_removed", function (snapshot) {
  let message = snapshot.val().name + " has left the game!";
  let left = database.ref().child("/chat/").push().key;

  database.ref("/chat/" + left).set(message)
})

database.ref("/chat/").on("child_added", function (snapshot) {
  let message = snapshot.val();
  let chatMessage = $("<div>").html(message);


  $("#chat").append(chatMessage);
  $("#chat").scrollTop($("#chat")[0].scrollHeight);
})

database.ref("/turn/").on("value", function (snapshot) {
  if (snapshot.val() == 1) {
    turn = 1;

    if (playerOne && playerTwo) {

      $("#waitingForOpponent").html("Waiting on " + playerOneName + "to make their move")
    }

  } else if (snapshot.val() == 2) {
    turn = 2;

    if (playerOne && playerTwo) {
      $("#waitingForOpponent").html("Waiting on " + playerTwoName + "to make their move")
    }
  }
});

database.ref("/outcomes/").on("value", function (snapshot) {
  $("#result").html(snapshot.val())
})


function checkResult() {
  if (playerOne.pick === "Rock") {
    if (playerTwo.pick === "Paper") {
      database.ref().child("/outcomes/").set("Paper wins!");
      database.ref().child("/players/playerOne/losses").set(playerOne.losses + 1);
      database.ref().child("/players/playerTwo/wins").set(playerTwo.wins + 1);
    } else if (playerTwo.pick === "Scissors") {
      database.ref().child("/outcomes/").set("Rock wins!");
      database.ref().child("/players/playerOne/wins").set(playerOne.win + 1);
      database.ref().child("/players/playerTwo/losses").set(playerTwo.loss + 1);
    } else if (playerTwo.pick === "Rock") {
      database.ref().child("/outcomes/").set("Draw!");
      database.ref().child("/players/playerOne/draws").set(playerOne.draws + 1);
      database.ref().child("/players/playerTwo/draws").set(playerTwo.draws + 1);
    }
  } else if (playerOne.pick === "Paper") {
    if (playerTwo.pick === "Rock") {

      database.ref().child("/outcomes/").set("Paper wins!");
      database.ref().child("/players/playerOne/wins").set(playerOne.win + 1);
      database.ref().child("/players/playerTwo/losses").set(playerTwo.loss + 1);
    } else if (player2.pick === "Paper") {
      database.ref().child("/outcomes/").set("Draw!");
      database.ref().child("/players/playerOne/draws").set(playerOne.draws + 1);
      database.ref().child("/players/playerTwo/draws").set(playerTwo.draws + 1);
    } else if (player2.pick === "Scissors") {
      database.ref().child("/outcomes/").set("Scissors win!");
      database.ref().child("/players/playerOne/losses").set(playerOne.loss + 1);
      database.ref().child("/players/playerTwo/wins").set(playerTwo.win + 1);
    }
  } else if (playerOne.pick === "Scissors") {
    if (playerTwo.pick === "Rock") {

      database.ref().child("/outcomes/").set("Rock wins!");
      database.ref().child("/players/playerOne/losses").set(playerOne.loss + 1);
      database.ref().child("/players/playerTwo/wins").set(playerTwo.win + 1);
    } else if (player2.pick === "Paper") {

      database.ref().child("/outcomes/").set("Scissors win!");
      database.ref().child("/players/playerOne/wins").set(playerOne.win + 1);
      database.ref().child("/players/playerTwo/losses").set(playerTwo.loss + 1);
    } else if (playerTwo.pick === "Scissors") {

      database.ref().child("/outcomes/").set("Draw!");
      database.ref().child("/players/playerOne/draws").set(player1.draws + 1);
      database.ref().child("/players/playerTwo/draws").set(player2.draws + 1);
    }
  }

  turn = 1;
  database.ref().child("/turn").set(1);
}