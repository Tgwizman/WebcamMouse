var fs = require('fs'),
	ur = require('urlserver'),
	robot = require('robotjs'),
	screenSize = robot.getScreenSize(),

	hostname = ur.getNetwork.hostname.toLowerCase(),
	host = 'https://' + hostname + '/';

ur.use('/', function(input, output) {
	output.sendFile('client.html');
	/*
	if (hostname == input.request.headers.host.toLowerCase()) {
		output.sendFile('client.html');
	} else {
		output.url = host;
	}
	*/
});

ur.use('/style.css', function(input, output) {
	output.sendFile('style.css');
});

ur.use('/webcammouse.js', function(input, output) {
	output.sendFile('webcammouse.js');
});

ur.use('/helper.js', function(input, output) {
	output.sendFile('helper.js');
});

ur.use('/dom2.js', function(input, output) {
	output.sendFile('dom2.js');
});

ur.use('/processing.js', function(input, output) {
	output.sendFile('processing.js');
});

// console.log(Object.keys(robot));

ur.use('/api', function(input, output) {
	var data = {
		message: 'invalid access',
		error: true
	};

	// if (hostname == input.request.headers.host.toLowerCase()) {
		data.message = 'unknown api';

		if (input.params.action == 'setMousePos') {
			if (input.params.x && input.params.y) {
				var x = parseFloat(input.params.x),
					y = parseFloat(input.params.y);

				if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
					data.message = 'success';

					robot.moveMouse(
						Math.round(x * screenSize.width),
						Math.round(y * screenSize.height)
					);
				}
			}
		} else if (input.params.action == 'mouseButton') {
			var position, button;

			if (input.params.down == 'true') position = 'down';
			if (input.params.down == 'false') position = 'up';

			if (input.params.button == 0) button = 'left';
			if (input.params.button == 1) button = 'middle';
			if (input.params.button == 2) button = 'right';

			if (position != null && button != null) {
				data.message = 'success';
				robot.mouseToggle(position, button);
			}
		}
	//}

	output.type = 'application/json';
	output.data = JSON.stringify(data);
});

ur.server({
	key: ur.getFile('ssl/key.pem'),
	cert: ur.getFile('ssl/server.crt')
}).listen(443);

require('http').createServer(function(req, res) {
	res.writeHead(301, {'Location': 'https://' + req.headers.host});
	res.end();
}).listen(80);