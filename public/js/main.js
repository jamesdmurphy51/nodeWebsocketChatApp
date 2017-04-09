function onDOMLoaded(){

    //start time loop for home page
    timeLoop();
    
    //instantiate client side socket.io & connect to our node socket
    let socket = io.connect(); 
    //add event listeners
    addEventListeners(socket);

    //unhide homepage div (SPA)
    render(window.location.hash);

    //clear session storage in case of browser refresh
    sessionStorage.clear();

} //end onDOMLoaded


//****************************START EVENT LISTENERS************************************************
function addEventListeners(socket){
    

     //1. REGULAR EVENT HANDLERS
     //--------------------------------------------
    //Event listener for user login (click)
    const btn_go = document.getElementById("go_btn");
    btn_go.addEventListener("click", (e)=>{
        e.preventDefault();

        if(sessionStorage.userName){
            alert(sessionStorage.userName + ' is already logged in via this window');
            return;
        }

        //get uName from uname-input
        let unameText = document.getElementById("uname_input").value;

        $.ajax({
            type: "POST",
            url: "/",
            contentType: "application/json",
            data: JSON.stringify( {userName: unameText} ),
            success:(data) => {
                if(data !="")
                {
                    let obj = JSON.parse(data);
                    if (obj.error){
                        alert(obj.error);
                    }else{
                        //update sessionStorage to reflect user is logged in
                        sessionStorage.userName = obj.userName;
                        sessionStorage.fName = obj.fName;
                        sessionStorage.lName = obj.lName;
                        //personalize page
                        updatePage(obj);

                        //*****COMMUNICATE NEW USER TO SERVER VIA WEBSOCKET*****
                        socket.emit('newUserToServer', obj.userName);
                    }
                } //end if(data !=
            }
        });
    })//end handler
    //--------------------------------------------


    //----------------------------
    //Event listener for message submit (submit)    
    document.getElementById('messageForm').addEventListener('submit', (e) => {
        e.preventDefault();

        //check if user is logged in....if OK then send msg
        if(sessionStorage.userName == undefined){
            alert("Please login if you wish to chat");
        }else{
            //*****COMMUNICATE NEW MESSAGE TO SERVER VIA WEBSOCKET*****
            let txtArea_msg = document.getElementById('message');
            socket.emit('msgObjectToServer', {userName: sessionStorage.userName, msg: txtArea_msg.value});
            //clear textArea
            txtArea_msg.value = "";
        }
    });
    //----------------------------



    //------------------------------------
    //Event listener for user registration (click)
    const btn_submit = document.getElementById("submit_btn");
    btn_submit.addEventListener("click", (e)=>{
        e.preventDefault();

        //get details from form
        let userNameText = document.getElementById("userName").value;
        let fNameText = document.getElementById("fName").value;
        let lNameText = document.getElementById("lName").value;
        let emailText = document.getElementById("email").value;

        let payload = {
            userName: userNameText,
            fName: fNameText,
            lName: lNameText,
            email: emailText
        }

        $.ajax({
            type: "POST",
            url: "/register",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success:(data)=>{
                if(data !="")
                {
                    alert(data);
                }
            }
        });   
    });//end handler 
    //------------------------------------


    //2. SOCKET.IO EVENT HANDLERS

    //MESSAGES
    //websocket receives msgArray from server (on connection) = FROM SCRATCH 
    socket.on('msgArrayToClient', (data) => {
        //loop through object array and dynamically add divs
        let div_chat = document.getElementById('chat');
        
        for (let i=data.length - 1; i>=0; --i){
            div_chat.innerHTML += "<div class='well'><strong>" + data[i].userName + ": </strong>" + data[i].msg + "</div>"
        }
    });
    //ALL websockets receive single msg object /from server (when other user posts) = PREPEND 
        socket.on('msgObjectToClients', (data) => {
        //loop through object array and dynamically add li's to ul
        let html = "<div class='well'><strong>" + data.userName + ": </strong>" + data.msg + "</div>";
        html += document.getElementById('chat').innerHTML;
        document.getElementById('chat').innerHTML = html;
    });


    //USERS
    //ALL websockets receive userArray from server (on connect/disconnect/new user) = REFRESH
    socket.on('userArrayToClients', (data) => {
        //populate users ul 
        let html = "";
        for (let i=data.length - 1; i>=0; --i){
            html += "<li class='list-group-item'>" + data[i] + "</li>";
        }
        document.getElementById('users').innerHTML = html;
    });
    //------------------------------------



    //------------------------------------
    //NATIVE JS WEBSOCKET EVENT LISTENERS
    
    //make socket connection to BIFINEX API server 
    let ws = new WebSocket("wss://api.bitfinex.com/ws");
    ws.onopen = () =>{
        ws.send(JSON.stringify({
            "event":"subscribe",
            "channel":"ticker",
            "pair":"BTCUSD"
        }));
    }
    let div_price = document.getElementById("price");
    ws.onmessage = (msg) =>{
        let res = JSON.parse(msg.data);
        console.log(res);
        if (res[1] != "hb"){
            div_price.innerHTML = `<p>ASK PRICE: ${res[3]}</p> <p>LAST TRADE: ${res[7]}</p> <p>BID PRICE: ${res[1]}</p>`; 
        }
    }   
    //------------------------------------






    //handler for SPA navigation
    window.onhashchange = function(){
        // render function is called every hash change.
        render(window.location.hash);
    };


}
//******************************END EVENT LISTENERS*****************************



//****************************SPA NAVIGATION***********************************************************
function render(hashKey) {

    //first hide all divs
    let pages = document.querySelectorAll(".page");
    for (let i = 0; i < pages.length; ++i) {
        pages[i].style.display = 'none';
    }

     //...now do same with lis
    let lis_nav = document.querySelectorAll(".navLi");
    for (let i = 0; i < lis_nav.length; ++i) {
        lis_nav[i].classList.remove("active");
    }

    //then unhide the one that user selected
    //console.log(hashKey);
    switch(hashKey){
        case "":
            pages[0].style.display = 'block';
            document.getElementById("li_home").classList.add("active");
            break;
        case "#home":
            pages[0].style.display = 'block';
            document.getElementById("li_home").classList.add("active");
            break;
        case "#register":
            pages[1].style.display = 'block';
            document.getElementById("li_register").classList.add("active");
            break;
        case "#about":
            pages[2].style.display = 'block';
            document.getElementById("li_about").classList.add("active");
            break;
        default:
            pages[0].style.display = 'block';
            document.getElementById("li_home").classList.add("active");
    }// end switch

} //end fn

//****************************END SPA NAVIGATION********************************************************









//**************************CHILD FNS****************************************************
function updatePage(data){
    //console.log(data);
    document.getElementById("uNameSpan").innerHTML = data.userName;
    document.getElementById("fNameSpan1").innerHTML = " " + data.fName;
    document.getElementById("fNameSpan2").innerHTML = " " + data.fName;
    document.getElementById("fNameSpan3").innerHTML = " " + data.fName;
    document.getElementById("lNameSpan1").innerHTML = " " + data.lName;
    document.getElementById("lNameSpan2").innerHTML = " " + data.lName;
    document.getElementById("lNameSpan3").innerHTML = " " + data.lName;
}

function timeLoop(){
    let timeSpan = document.getElementById('time');

    setInterval(function(){ 
        let timeNow = formatTime();
        timeSpan.innerHTML=timeNow;
    }, 1000);
}

function formatTime() {
var d = new Date(),
    minutes = d.getMinutes().toString().length == 1 ? '0'+d.getMinutes() : d.getMinutes(),
    hours = d.getHours().toString().length == 1 ? '0'+d.getHours() : d.getHours(),
    months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    seconds = d.getSeconds().toString().length == 1 ? '0'+d.getSeconds() : d.getSeconds();
return months[d.getMonth()]+' '+d.getDate()+' '+d.getFullYear()+' '+hours+':'+minutes+':'+seconds;
}

//**************************END CHILD FNS************************************************






 
