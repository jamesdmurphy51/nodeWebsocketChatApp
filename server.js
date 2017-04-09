//EXPRESS SERVER*****************************************************
const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer();
server.on('request', (app)); 
//const server = require('http').createServer(app);

server.listen(8080, '127.0.0.1', function () {
  console.log('Server listening on port 8080')
})
//*******************************************************************

//WEBSOCKET SERVER***************************************************
const io = require('socket.io').listen(server);
//*******************************************************************



//MIDDLEWARE CODE****************************************************
//Body parser (JSON)
const bodyParser = require('body-parser');
app.use(bodyParser.json());
//*******************************************************************


//MONGO CODE*********************************************************
const mongodb = require('mongodb');
//set mongo client (native)
const mongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017/chatApp';
//*******************************************************************




//WEBSOCKET ROUTES****************************************************
let connections = [];
let users = [];
let messages = [];

//connect
io.sockets.on('connection', (socket) => {
    //add new socket connection to array
    connections.push(socket);
    console.log('Connected: ' + connections.length + " Connections Open");
    //pass array of users already online, to ALL clients
    socket.emit('userArrayToClients', users);
    //pass array of existing messages to client  
    socket.emit('msgArrayToClient', messages);


    //disconnect
    socket.on('disconnect', () => {
        //remove socket from connections array
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: ' + connections.length + " Connections Remaining");
        //and remove user from users array (if they are logged in)
        if (socket.userName){
            users.splice(users.indexOf(socket.userName), 1);
            //communciate updated array back to all clients
            io.sockets.emit('userArrayToClients', users);
        }
    })//end on('disconnect

    //receive new message from client
    socket.on('msgObjectToServer', (data) => {
        //add message (object) to array
        messages.push(data);
        //send SINGLE object back to all clients
        io.sockets.emit('msgObjectToClients', data);
    })

    //receive new user login from client
    socket.on('newUserToServer', (data) => {
        //add new user to array
        users.push(data);
        //attach username to socket object (for removal from array upon disconnect)
        socket.userName = data;
        //communciate updated array back to ALL clients
        io.sockets.emit('userArrayToClients', users);
    })

    
    
    
}) //end on('connection





//*******************************************************************








//EXPRESS HTTP ROUTES ******************************************************
//-------------------------------------------
//GET
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/css/main.css', function(req, res) {
    res.sendFile((__dirname + '/public/css/main.css'));
});

app.get('/js/main.js', function(req, res) {
    res.sendFile((__dirname + '/public/js/main.js'));
});



//-------------------------------------------
//POST

//post for submitButton
app.post('/register', function(req, res) {

    //connect to Mongo
    mongoClient.connect(url, (err, db) => {
        if (err){
            res.send('Unable to connect to Mongo: ' + err);    
        }else{
            console.log('Connected to ' + url);
        }
        //reference existing collection
        const userCollection = db.collection('users');
        
        //see if username already exists
        userCollection.find({userName: req.body.userName}).toArray((err, dbResult) => {
            if(err){
                res.send('Database query error');
            } else if (dbResult.length){
                res.send('Username already exists in database');
            } else {
                console.log('No records found');
                insertDoc();
            }
        });
        
        function insertDoc(){
            //insert req.body to Mongo
            userCollection.insert(req.body, (err, dbResp) => {
                if(err){
                    res.send('Unable to insert records: ' + err);
                }else{
                    res.send(dbResp.insertedCount + ' doc inserted');
                }
                db.close;
            });
        } //end function
    }) //end mongoClient.connect
}); // end app.post('/register'



//POST for goButton
app.post('/', function(req, res) {
    //first check if user is already in array
    if (users.includes(req.body.userName)){
        res.send(JSON.stringify({error: 'You are already logged in\n....on a differenr window'}));
        return;
    }


    //connect to Mongo
    mongoClient.connect(url, (err, db) => {
        if (err){
            res.send(JSON.stringify({error: 'Unable to connect to Mongo: ' + err}));    
        }else{
            console.log('Connected to ' + url);
        }
        //reference existing collection
        const userCollection = db.collection('users');
        
        //see if username exists
        userCollection.find({userName: req.body.userName}).toArray((err, dbResult) => {
            if(err){
                res.send(JSON.stringify({error: 'Database query error'}));
            } else if (dbResult.length){
                //returns an array and we just want first & only one
                res.send(JSON.stringify(dbResult[0]));
            } else {
                res.send(JSON.stringify({error: 'Username does not exist in database'}));
            }
        });
    }) //end mongoClient.connect
}); // end app.post('/'




//-------------------------------------------






