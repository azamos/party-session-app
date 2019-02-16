// @ts-nocheck
{
  const mainEndpoint = "ws://localhost:3000/ws/party";

  let socket;
  let currentUser;
  let eventId;
  let $myMessage;//for keepin track of event. Maybe shove to array/object?
  const $eTemplate = document.querySelector("#incoming-msg-template"); //message template
  const $inputBroadcast = document.querySelector("#broadcast"); //the user's msg's text input 
  const $subscribeButton = document.querySelector("#connect"); //to open webSocket
  const $connectedClients = document.querySelector("#connected-clients"); //htmlel showing connected clients.

  function saveUserName(name){
    currentUser = name;
  }
  
  function commitLike(onWho){
      if(currentUser !== onWho){
        socket.send(onWho);
      }
  }

  const handleIncoming = function (event) { //handle incoming from server
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      return console.error("unable to parse payload.")
    }
    if (eventId !== data.id) {
      eventId = data.id;
      //TODO: Likes counter per message. Users are only allowed to like msgs of other users.
      const $msgItem = $eTemplate.cloneNode(true); //clone template, and fill it with stuff(bellow).
      $msgItem.id = ""; //To avoid id issues
      $msgItem.querySelector(".socket-event-client").innerText = data.client; //to show who triggered the event(message or login)
      $msgItem.querySelector(".socket-event-type").innerText = data.type; //type of event
      const $payload = $msgItem.querySelector(".socket-event-payload");
      for (k in data.payload) { //put the data from the server into the element that we present to the user
        $payload.classList.add("event-payload-item"); //add css-bs design 
        $payload.innerHTML = `<span title="${k}">${data.payload[k]}</span>`;
      }


      const $likeButton = $msgItem.querySelector('.num-of-likes');
      console.log(data.client);
      $likeButton.addEventListener('click',commitLike.bind(this,data.client));//reminder to self:
      //reminder: this is the handler for when a message is sent from server via the socket.
      //          so, the data.client is who ever triggered the event. Q: so why do I have my issue?


      //bellow: using package to transform ugly time rep (for ex: 2131221321312) to a relative
      //and understandable rep(ex: 'a few seconds ago')
      //and do it every second
      setInterval(() => $msgItem.querySelector(".socket-event-timestamp").innerText = moment(data.timestamp).fromNow(), 1000);

      document.querySelector("#msgs").prepend($msgItem) //newest post/event rep goes to the top
      $msgItem.classList.remove("d-none"); //after rep is ready, show it.
      $myMessage = $msgItem;
    }
    $myMessage.querySelector("span[title = 'msg' ]").innerHTML = data.payload.msg;
  }

  const sendMsgAs = function sendMsgAs(socket, e) {
    if (e.keyCode === 13) { // if users pressed enter, means he wants to send 
      socket.send(this.value); //send the finished message through the socket to the server
      this.value = "";
    } else {
      socket.send("is typing..."); //
    }
    //TODO: while typing...
  }

  function connect() {
    /*const*/ socket = new WebSocket(mainEndpoint); //create connection when user presses 'subscribe'
    const msgSender = sendMsgAs.bind($inputBroadcast, socket);

    // Connection opened
    socket.addEventListener("open", function (event) {
      $subscribeButton.classList.add("d-none"); //hide the subscribe button, so will not sub again

      //bellow: show the connected clients and message input
      [$connectedClients, $inputBroadcast].forEach(e => e.classList.remove("d-none"));
      $inputBroadcast.addEventListener("keydown", msgSender); //when pressing keys while in input
      handleIncoming(event);
      socket.send("Can I join?"); //Just to show that something was sent. Not actually needed.
    });


    // Listen for messages
    socket.addEventListener("message", handleIncoming); //when server sends something, handle it.

    socket.addEventListener("error", function (event) {
      console.log("WS Error ", event);
      handleIncoming(event);
    });

    socket.addEventListener("close", function (event) {
      console.log("Closed connection ", event);
      $subscribeButton.classList.remove("d-none"); //allow user to subs again, because he is not sub now.
      [$connectedClients, $inputBroadcast].forEach(e => e.classList.add("d-none")); //hide these fields
      $inputBroadcast.removeEventListener("keydown", msgSender) //since it is now hidden, no need for listener.
    });
  }
}