import { Injectable } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import { Router } from '@angular/router';
@Injectable()
export class PlayerService {

  players: FirebaseListObservable<any>;
  currentPlayer: FirebaseObjectObservable<any>;
  friends: FirebaseListObservable<any>;
  localFriends = [];
  foundPotentialFriends = [];
  ourGameRequests: FirebaseListObservable<any>;
  currentGameState: FirebaseObjectObservable<any>;
  currentGameId;
  currentPlayerKey;

  constructor(private database: AngularFireDatabase, private router: Router) {
    this.players = this.database.list('players');
  }


  loginPlayer(userId: string, username: string){
    let exists = false;
    this.players.subscribe(data=>{
      //checks to see if player with this userId already exists
      data.forEach(player=>{
        if (player.uid === userId) {
          exists = true;
          this.currentPlayer = this.database.object('players'+player.$key);
          this.router.navigate(['user', 'display', player.$key]);
        }
      });
      //if player does not already exist, create a new player
      if (!exists) {
        let name = (username) ? username : 'guest';
        let newPlayer = {
          uid: userId,
          username: name,
          currentGame: null,
          wins: 0,
          losses: 0,
          loggedIn: true
        }
        this.players.push(newPlayer)
        .then(snap=>{
          this.currentPlayer = this.database.object('players/' + snap.key);
          this.router.navigate(['user', 'display', snap.key]);
        });
      }
    });
  }

  checkIfInGame = ()=>{
    console.log("Seeing if should route");
    console.log(this.currentGameId);
    if (this.currentGameId == -1){
      this.router.navigate(['user', 'display', this.currentPlayerKey]);
    }
    setTimeout(this.checkIfInGame, 3000);
  }

  getFriends(){
    this.currentPlayer.subscribe(player=>{
      this.friends = this.database.list('players/'+player.$key+'/friends');
      this.friends.subscribe(friends=>{
        this.localFriends = [];
        friends.forEach(friendKey=>{
          this.localFriends.push(this.database.object('players/'+friendKey.friendKey));
          this.localFriends[this.localFriends.length-1].subscribe(friend=>{
          })
        });
      })
    })
  }

  addFriend(friendKey){
    let myFirstSubscription = this.currentPlayer.subscribe(player => {
      let myFriends = this.database.list('players/'+player.$key+'/friends');
      myFriends.push({"friendKey": friendKey});
      myFirstSubscription.unsubscribe();
    })
    this.foundPotentialFriends = [];
  }

  findFriends(input: string, element){
    if (input.length >= 3){
      this.players.subscribe(players=>{
        let potentialFriends = [];
        players.forEach(player=>{
          console.log("reading player.username: " + player.username);
          if (player.username){
            if (player.username.search(input) !== -1){
              potentialFriends.push({username: player.username, key: player.$key})
            }
          }
        })
        this.foundPotentialFriends = potentialFriends;
      })
    } else {
      this.foundPotentialFriends = [];
    }
  }

  setPlayer(key){
    this.currentPlayer = this.database.object('players/' + key);
    this.currentGameState = this.database.object('players/'+key+'/currentGame');
    this.currentPlayer.subscribe(player=>{
      console.log("This is the state: " + player.currentGame);
      this.currentGameId = player.currentGame;
      this.currentPlayerKey = player.$key;
      this.ourGameRequests = this.database.list('players/'+key+'/requests/');
    })
  }

  setGameIds(gameId){
    let currentGame = this.database.object('allGames/'+gameId);
    currentGame.subscribe(game=>{
      let player1Id = game.player1;
      let player2Id = game.player2;
      let player1 = this.database.object('players/'+player1Id);
      let player2 = this.database.object('players/'+player2Id);
      player1.update({currentGame: gameId});
      player2.update({currentGame: gameId});
    })
  }

  logoutPlayer(){
    this.currentPlayer.update({loggedIn: false});
    this.router.navigate(['']);
  }
}
