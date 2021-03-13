var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var crypto = require('crypto')

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'nodelogin'
});

var app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

function requireLogin(request, response, next) {
  if (request.session.loggedin) {
    next(); // allow the next route to run
  } else {
    // require the user to log in
    response.redirect("/");
  }
}

app.use('/game', requireLogin, express.static(path.join(__dirname + '/CurrentProject/src/')));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/login.html', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	const md5sum = crypto.createHash('md5');
	
	var username = request.body.username;
	var password = md5sum.update(request.body.password).digest('hex');
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/game/index.html');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/registration.html', function(request, response) {
	response.sendFile(path.join(__dirname + '/registration.html'));
});

app.post('/registration', function(request, response) {
	const md5sum = crypto.createHash('md5');
	
	var email = request.body.email;
	var username = request.body.username;
	var password = md5sum.update(request.body.password).digest('hex');
	if (email && username && password) {
		connection.query('INSERT INTO accounts (username, password, email) VALUES (?, ?, ?)', [username, password, email], function(error, results, fields) {
			if (error) {
				response.send('Errors adding account to DB');
			} else {
				response.send('Account added Successfully');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Email, Username and Password!');
		response.end();
	}
});

app.listen(3000);