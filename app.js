var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var spawn = require('child_process').spawn;
var fork = require('child_process').fork;
const { Http2ServerRequest } = require('http2');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.htm');
	console.log('get /');
});

app.get('/dataogon/app-server/payload', function (req, res) {
	res.sendStatus(200);
	console.log('get /payload');
});

const C_LOCAL_REPO = 'dataogon/app-server';
const C_PORT = 9118;
const C_PROC_TO_KILL = "9001";

const W_OBJ = {};
W_OBJ.C_PROJECT_PATH = `G:/${C_LOCAL_REPO}`;
W_OBJ.C_GET_PID = `netstat -aon | findstr 0.0.0.0:${C_PROC_TO_KILL}`;
W_OBJ.C_KILL_PID = null;

const L_OBJ = {};
L_OBJ.C_PROJECT_PATH = `/media/pi/PNY-SSD-01/${C_LOCAL_REPO}`;

function get() {
	if (isWindow()) {
		return W_OBJ;
	} else {
		return L_OBJ;
	}
}

app.post('/dataogon/app-server/payload', function (req, res) {
	console.log(process.platform);
	//verify that the payload is a push from the correct repo
	//verify repository.name == 'toi-device' or repository.full_name = 'toitoi/toi-device'
	console.log(req.body.pusher.name + ' just pushed to ' + req.body.repository.name);

	doSomething();
	// killServer();
	// buildAndStart();

	res.statusCode = 200;
	res.statusMessage = 'done redeployment!!'
	return res;
});

async function doSomething() {

	// check the last log
	exec(`git -C ${get().C_PROJECT_PATH} log -n 1`, (err, stdout, stderr) => {
		if (err) {
			console.log(err);
		} else {
			if (stdout) {
				console.log(stdout);

				// now pull down the latest
				console.log('pulling code from GitHub...');
				exec(`git -C ${get().C_PROJECT_PATH} pull -f`, (err, stdout, stderr) => {
					if (err) {
						console.log(err);
					} else {
						if (stdout) {
							console.log(stdout);

							// check the last log
							exec(`git -C ${get().C_PROJECT_PATH} log -n 1`, (err, stdout, stderr) => {
								if (err) {
									console.log(err);
								} else {
									if (stdout) {
										console.log(stdout);

										// TODO : if the timestamp same, then no need call below...
										if (true) {
											killServer();
										}
									}
									if (stderr) console.log(stderr);
								}
							});
						}
						if (stderr) console.log(stderr);
					}
				});

			}
			if (stderr) console.log(stderr);
		}
	});
}


async function killServer() {

	console.log('kill the current running server...');
	if (isWindow()) {
		exec(get().C_GET_PID, (err, stdout, stderr) => {
			if (err) {
				// ntg to kill
				console.log(err);
				console.log(`no running server on port ${C_PROC_TO_KILL} found.`);
				// build and restart server.
				buildAndStart();
			} else {
				if (stdout) {
					console.log(stdout);
					data = stdout.split(/(\s+)/);
					let pid = data[10];
					console.log(pid);
					W_OBJ.C_KILL_PID = `taskkill /F /PID ${pid}`;
					if (!pid) {
						return;
					}
					// kill the server by pid
					exec(get().C_KILL_PID, (err, stdout, stderr) => {
						if (err) {
							console.log(err);
						} else {
							if (stdout) {
								console.log(stdout);

								// build and restart server.
								buildAndStart();
							}
							if (stderr) console.log(stderr);
						}
					});
				}
				if (stderr) console.log(stderr);
			}
		});
	} else {
		let C_SHELL_SCRIPT = 'sh doSomething.sh /myDir';

	}

}

async function test() {
	console.log('starting server...');
	exec(`npm -C ${get().C_PROJECT_PATH} run start:dev`, execCallback);
}

function buildAndStart() {
	console.log('compiling...');
	// and npm install
	exec(`npm install --quiet --no-progress "${get().C_PROJECT_PATH}"`, (err, stdout, stderr) => {
		if (err) {
			console.log(err);
		} else {
			if (stdout) {
				console.log(stdout);

				console.log('starting server...');
				exec(`npm -C ${get().C_PROJECT_PATH} run start:dev`, execCallback);
			}
			if (stderr) {
				console.log(stderr);
				console.log('here warn message!');
				console.log('normal, continue start server!');

				console.log('starting server...');
				exec(`npm -C ${get().C_PROJECT_PATH} run start:dev`, execCallback);
			};
		}

		console.log('Done deployment!');
	});
}

app.listen(C_PORT, function () {
	console.log('listening on port ', C_PORT)
});

function execCallback(err, stdout, stderr) {
	if (stdout) console.log(stdout);
	if (stderr) console.log(stderr);
}

function isWindow() {
	return process.platform.startsWith('win');
}