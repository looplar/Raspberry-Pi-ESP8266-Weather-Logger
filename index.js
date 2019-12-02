var express     = require('express');
var mysql       = require('mysql');
var app         = express();
var bodyParser  = require('body-parser');

var SavePassword = 'tutorials-raspberrypi.de';

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'weather',
    password : 'pasw',
    database : 'weather_station',
    debug    :  false,
    connectionLimit : 100
});

app.set('port', (process.env.PORT || 8000))
app.set('view engine', 'pug')
app.use(express.static(__dirname + '/views'));
app.use('/scripts', express.static(__dirname + '/node_modules/vis/dist/'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Visualize
app.get('/hours/:hours', function(req, res) {
    var hours = req.params.hours;
    var where = 'where datum >= DATE_SUB(NOW(),INTERVAL ' + hours + ' HOUR)';
    var query = 'SELECT datum x, humidity y, sender_id, \'humidity\' `group` FROM temperature ' + where +
                     ' UNION SELECT datum x, temp y, sender_id, \'temp\' `group` FROM temperature ' + where;
    console.log(query);
    // get data from database
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        results = JSON.stringify(results);
        res.render('index', { data: results });
    });
})

// Visualize
app.get('/highcharts/temp/hours/:hours', function(req, res) {
    var hours = req.params.hours;
    var where = 'where datum >= DATE_SUB(NOW(),INTERVAL ' + hours + ' HOUR)';
    var query = 'SELECT datum x, temp y FROM temperature ' + where;
    console.log(query);
    // get data from database
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        results = JSON.stringify(results);
        console.log(results);
        res.render('highcharts', { data: results});
    });
})
app.get('/highcharts/hum/hours/:hours', function(req, res) {
    var hours = req.params.hours;
    var where = 'where datum >= DATE_SUB(NOW(),INTERVAL ' + hours + ' HOUR)';
    var query = 'SELECT datum x, hum y FROM humidity ' + where;
    console.log(query);
    // get data from database
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        results = JSON.stringify(results);
        console.log(results);
        res.render('highcharts', { data: results});
    });
})
// Visualize
app.get('/temp/hours/:hours', function(req, res) {
    var hours = req.params.hours;
    var where = 'where datum >= DATE_SUB(NOW(),INTERVAL ' + hours + ' HOUR)';
    var query = 'SELECT datum x, temp y, sender_id, \'temp\' `group` FROM temperature ' + where;
    console.log(query);
    // get data from database
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        results = JSON.stringify(results);
        res.render('index', { data: results });
    });
})

// Visualize
app.get('/hum/hours/:hours', function(req, res) {
    var hours = req.params.hours;
    var where = 'where datum >= DATE_SUB(NOW(),INTERVAL ' + hours + ' HOUR)';
    var query = 'SELECT datum x, humidity y, sender_id, \'humidity\' `group` FROM temperature ' + where;
    console.log(query);
    // get data from database
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        results = JSON.stringify(results);
        res.render('index', { data: results });
    });
})

// Visualize
app.get('/', function(req, res) {
    // get data from database
    connection.query('SELECT datum x, humidity y, sender_id, \'humidity\' `group` FROM temperature ' +
                     'UNION SELECT datum x, temp y, sender_id, \'temp\' `group` FROM temperature', function (error, results, fields) {
        if (error) throw error;
        results = JSON.stringify(results);
        console.log(result);
        res.render('index', { data: results });
    });
})

// Send data
app.post('/esp8266_trigger', function(req, res){

    var sender_id, temperature, humidity;

    if (!req.body.hasOwnProperty("password") || req.body.password != SavePassword) {
        res.json({"code" : 403, "error": "Password incorrect / missing"});
        return;
    }

    if (!req.body.hasOwnProperty("sender_id") || req.body.sender_id == "") {
        res.json({"code" : 403, "error": "Sender ID missing"});
        return;
    } else {
        sender_id = req.body.sender_id;
    }

    if (!req.body.hasOwnProperty("temperature") || parseFloat(req.body.temperature) == NaN) {
        res.json({"code" : 403, "error": "Temperature Value missing"});
        return;
    } else {
        temperature = parseFloat(req.body.temperature);
    }

    if (!req.body.hasOwnProperty("humidity") || parseFloat(req.body.humidity) == NaN) {
        res.json({"code" : 403, "error": "Humidity Value missing"});
        return;
    } else {
        humidtiy = parseFloat(req.body.humidity);
    }

    // save
    var query = connection.query('INSERT INTO temperature VALUES ' +
                                ' (DEFAULT, '+mysql.escape(sender_id)+', NOW(), '+temperature+', '+humidtiy+');', function (error, results, fields) {
        if (error) {
            res.json({"code" : 403, "status" : "Error in connection database"});
            console.out(error);
            return;
        }
        res.json({"code": 200});
    });


});

app.listen(app.get('port'));
