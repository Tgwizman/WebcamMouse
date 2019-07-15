var video,
	canvas_in, canvas_out,
	ctx_in, ctx_out,
	camera, server,
	target_color, tc_ctx,
	redrawTargetColor,
	currentMenu,
	filters, selectedFilterIndex;

function getDataAt(imageData, x, y) {
	var i = Math.floor((y * width + x) * 4);
	return {
		r: imageData.data[i    ],
		g: imageData.data[i + 1],
		b: imageData.data[i + 2],
		a: imageData.data[i + 3]
	}
}

function setMousePos(x, y) {
	XHR_GET('/api?action=setMousePos&x=' + x + '&y=' + y);
}

function mouseButton(down, button) {
	XHR_GET('/api?action=mouseButton&down=' + down + '&button=' + button);
}

function drawTargetColor(filter) {
	target_color.width = target_color.clientWidth;
	target_color.height = target_color.clientHeight;

	var target_angle = filter.targetColor * (Math.PI/180),
		t1 = ad2xy(target_angle + 0 * (Math.PI/180), 70),
		t2 = ad2xy(target_angle + 120 * (Math.PI/180), 70),
		t3 = ad2xy(target_angle + 240 * (Math.PI/180), 70),
		square_size = 0.5 * target_color.width;

	for (var x=0; x<target_color.width; x++) {
		for (var y=0; y<target_color.height; y++) {
			var a = angle(target_color.width/2, target_color.height/2, x, y),
				d = dist(target_color.width/2, target_color.height/2, x, y),
				inTriangle = PointInsideTriangle(
					x, y,
					target_color.width/2 + t1.x, target_color.height/2 - t1.y,
					target_color.width/2 + t2.x, target_color.height/2 - t2.y,
					target_color.width/2 + t3.x, target_color.height/2 - t3.y
				);

			if (70 < d && d < 100) {
				tc_ctx.fillStyle = hsv2hex(a, 100, 100);

				/*
				var min = Math.min(filter.targetColor, a),
					max = Math.max(filter.targetColor, a);

				if (max - min < filter.tolerance/2) {
					tc_ctx.fillStyle = hsv2hex(a, 50, 100);
				}
				*/

				tc_ctx.fillRect(x, y, 1, 1);
			} else if (inTriangle) {
				var rxy = ad2xy((a - filter.targetColor - 120) * Math.PI/180, d);

				saturation = (target_color.height - 140)/2 - rxy.x;
				value = (target_color.width - 140)/2 - rxy.y + 25;

				tc_ctx.fillStyle = hsv2hex(filter.targetColor, saturation, value);

				tc_ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	// Triangle border

	tc_ctx.beginPath();
	tc_ctx.moveTo(target_color.width/2 + t1.x, target_color.height/2 - t1.y);
	tc_ctx.lineTo(target_color.width/2 + t2.x, target_color.height/2 - t2.y);
	tc_ctx.lineTo(target_color.width/2 + t3.x, target_color.height/2 - t3.y);
	tc_ctx.closePath();
	tc_ctx.strokeStyle = '#999';
	tc_ctx.stroke();

	// Outer circle border

	tc_ctx.beginPath();
	tc_ctx.arc(target_color.width/2, target_color.height/2, 100, Math.PI/180, false);
	tc_ctx.closePath();
	tc_ctx.strokeStyle = '#999';
	tc_ctx.lineWidth = 3;
	tc_ctx.stroke();
	tc_ctx.strokeStyle = '#CCC';
	tc_ctx.lineWidth = 1;
	tc_ctx.stroke();

	// Inner circle border

	tc_ctx.beginPath();
	tc_ctx.arc(target_color.width/2, target_color.height/2, 70, Math.PI/180, false);
	tc_ctx.closePath();
	tc_ctx.strokeStyle = '#999';
	tc_ctx.lineWidth = 3;
	tc_ctx.stroke();
	tc_ctx.strokeStyle = '#CCC';
	tc_ctx.lineWidth = 1;
	tc_ctx.stroke();

	// Circle target

	tc_ctx.beginPath();
	tc_ctx.moveTo(target_color.width/2 + Math.sin(target_angle) * 70, target_color.height/2 - Math.cos(target_angle) * 70);
	tc_ctx.lineTo(target_color.width/2 + Math.sin(target_angle) * 100, target_color.height/2 - Math.cos(target_angle) * 100);
	tc_ctx.lineWidth = 5;
	tc_ctx.strokeStyle = '#999';
	tc_ctx.stroke();
	tc_ctx.lineWidth = 1;
	tc_ctx.strokeStyle = '#CCC';
	tc_ctx.stroke();
}

function filterImage(filter, imageData) {
	if (camera.flipX) {
		var newData = new ImageData(camera.width, camera.height);

		var i0, i1;
		for (var x=0; x<camera.width; x++) {
			for (var y=0; y<camera.height; y++) {
				i0 = Math.floor((y * camera.width + x) * 4);
				i1 = Math.floor((y * camera.width + (camera.width - x)) * 4);
				newData.data[i1    ] = imageData.data[i0    ];
				newData.data[i1 + 1] = imageData.data[i0 + 1];
				newData.data[i1 + 2] = imageData.data[i0 + 2];
				newData.data[i1 + 3] = imageData.data[i0 + 3];
			}
		}
		imageData = newData;
		ctx_in.putImageData(imageData, 0, 0);
	}

	var index_in, pixel,
		data_in = imageData,
		data_out = new ImageData(camera.width, camera.height),
		pixels = [], rgb;

	if (filter.targetColor) rgb = hsv2rgb(filter.targetColor, 100, 100);

	for (var x=0; x<camera.width; x++) {
		for (var y=0; y<camera.height; y++) {
			index_in = Math.floor((y * camera.width + x) * 4);

			pixel = modes[filter.mode](camera, filter, {
				r: data_in.data[index_in + 0],
				g: data_in.data[index_in + 1],
				b: data_in.data[index_in + 2]
			});

			data_out.data[index_in    ] = pixel.r;
			data_out.data[index_in + 1] = pixel.g;
			data_out.data[index_in + 2] = pixel.b;
			data_out.data[index_in + 3] = pixel.a;

			if (filter.inverted) pixel.passed = !pixel.passed;

			if (pixel.passed
				&& filter.bounding.x * camera.width < x && (filter.bounding.x + filter.bounding.w) * camera.width > x
				&& filter.bounding.y * camera.height < y && (filter.bounding.y + filter.bounding.h) * camera.height > y) {
				pixels.push([x, y]);
			}
		}
	}

	// crop pixel by bounding box
	if (filter.bounding.enabled) {
		var pixels2 = [];
		for (var i=0; i<pixels.length; i++) {
			if (filter.bounding.x * camera.width < pixels[i].x && (filter.bounding.x + filter.bounding.w) * camera.width > pixels[i]) {
				pixels2.push(pixels[i]);
			}
		}
	}

	return {
		imageData: data_out,
		pixels: pixels
	};
}

function parseImage(filter, pixels, imageData) {
	var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		group = null,
		threshold = 10,
		hist_len = 15,
		hist_x_avg = 0, hist_y_avg = 0,
		found = {};

	canvas.width = camera.width;
	canvas.height = camera.height;

	ctx.putImageData(imageData, 0, 0);

	if (pixels.length > 10) {
		found.average = {
			x: 0,
			y: 0
		};

		for (var i=0; i<pixels.length; i++) {
			found.average.x += pixels[i][0] / pixels.length;
			found.average.y += pixels[i][1] / pixels.length;
		}

		found.group = {
			x: found.average.x,
			y: found.average.y,
			w: 1,
			h: 1
		}

		for (var i=1; i<pixels.length; i++) {
			if (found.group.x > pixels[i][0] && found.group.x - pixels[i][0] < threshold) {
				found.group.w += found.group.x - pixels[i][0];
				found.group.x = pixels[i][0];
			}
			if (found.group.y > pixels[i][1] && found.group.y - pixels[i][1] < threshold) {
				found.group.h += found.group.y - pixels[i][1];
				found.group.y = pixels[i][1];
			}
			if (found.group.x + found.group.w < pixels[i][0] && pixels[i][0] - (found.group.x + found.group.w) < threshold) {
				found.group.w += pixels[i][0] - (found.group.x + found.group.w);
			}
			if (found.group.y + found.group.h < pixels[i][1] && pixels[i][1] - (found.group.y + found.group.h) < threshold) {
				found.group.h += pixels[i][1] - (found.group.y + found.group.h);
			}
		}

		found.center = {
			x: found.group.x + found.group.w/2,
			y: found.group.y + found.group.h/2
		};

		found.center.xFlat = found.center.x / camera.width,
		found.center.yFlat = found.center.y / camera.height;

		if (filter.bounding.x > found.center.xFlat) found.center.xFlat = filter.bounding.x;
		if (filter.bounding.x + filter.bounding.w < found.center.xFlat) found.center.xFlat = filter.bounding.x + filter.bounding.w;
		if (filter.bounding.y > found.center.yFlat) found.center.yFlat = filter.bounding.y;
		if (filter.bounding.y + filter.bounding.h < found.center.yFlat) found.center.yFlat = filter.bounding.y + filter.bounding.h;

		if (filter.action == 'Mouse Pos') {
			server.mouse_history.push([found.center.xFlat, found.center.yFlat]);
			if (server.mouse_history.length > hist_len) server.mouse_history.shift();

			if (server.mouse_history.length >= hist_len) {
				var index;

				for (var i=0; i<hist_len; i++) {
					index = (server.mouse_history.length - 1) - i;
					if (server.mouse_history[index]) {
						hist_x_avg += server.mouse_history[index][0];
						hist_y_avg += server.mouse_history[index][1];
					}
				}

				hist_x_avg /= hist_len;
				hist_y_avg /= hist_len;

				setMousePos(
					(hist_x_avg - filter.bounding.x) / filter.bounding.w,
					(hist_y_avg - filter.bounding.y) / filter.bounding.h
				);
			}
		}
	}

	if (filter.bounding.enabled) {
		// bounding
		ctx.strokeStyle = '#0F0';
		ctx.strokeRect(
			Math.round(camera.width * filter.bounding.x),
			Math.round(camera.height * filter.bounding.y),
			Math.round(camera.width * filter.bounding.w),
			Math.round(camera.height * filter.bounding.h)
		);

		// bounding center lines
		ctx.strokeStyle = '#00F';
		ctx.strokeRect(
			Math.round(camera.width * filter.bounding.x + camera.width * filter.bounding.w / 2),
			Math.round(filter.bounding.y * camera.height), 1, Math.round(filter.bounding.h * camera.height)
		);
		ctx.strokeStyle = '#00F';
		ctx.strokeRect(
			Math.round(filter.bounding.x * camera.width),
			Math.round(camera.height * filter.bounding.y + camera.height * filter.bounding.h / 2),
			Math.round(filter.bounding.w * camera.width), 1
		);

		// dead zone
		if (filter.deadZone.enabled) {
			ctx.strokeStyle = '#F00';
			ctx.strokeRect(
				Math.round(camera.width * filter.deadZone.x),
				Math.round(camera.height * filter.deadZone.y),
				Math.round(camera.width * filter.deadZone.w),
				Math.round(camera.height * filter.deadZone.h)
			);
		}

		if (currentMenu == 'mainMenu') {
			ctx.fillStyle = '#FFF';
			ctx.fillText(filter.name,
				camera.width * filter.bounding.x,
				camera.height * filter.bounding.y);
		}
	}

	if (found.group) {
		ctx.strokeStyle = '#99F';
		ctx.strokeRect(found.group.x, found.group.y, found.group.w, found.group.h);

		ctx.beginPath();
		ctx.arc(found.center.x, found.center.y, found.group.h / 2, Math.PI * 180, false);
		ctx.closePath();

		if (filter.bounding.x * camera.width < found.center.x
			&& (filter.bounding.x + filter.bounding.w) * camera.width > found.center.x
			&& filter.bounding.y * camera.height < found.center.y
			&& (filter.bounding.y + filter.bounding.h) * camera.height > found.center.y) {
			ctx.strokeStyle = '#999';
			server.clickAllowed = true;
		} else {
			ctx.strokeStyle = '#000';
		}
		ctx.stroke();
	}

	if (hist_x_avg && hist_y_avg) {
		ctx.fillStyle = '#FFF';
		ctx.fillRect(hist_x_avg, hist_y_avg, 1, 1);
	}

	if (filter.action == 'Left Mouse') {
		if (found.group) {
			if (filter.lastAction != 'down') mouseButton(true, 0);
			filter.lastAction = 'down';
		} else {
			if (filter.lastAction != 'up') mouseButton(false, 0);
			filter.lastAction = 'up';
		}
	}

	if (filter.action == 'Right Mouse') {
		if (found.group) {
			if (filter.lastAction != 'down') mouseButton(true, 2);
			filter.lastAction = 'down';
		} else {
			if (filter.lastAction != 'up') mouseButton(false, 2);
			filter.lastAction = 'up';
		}
	}

	return {
		editedData: ctx.getImageData(0, 0, camera.width, camera.height),
		pixels: pixels,
		found: found
	}
}

function resize() {
	video.setAttribute('width', camera.width);
	video.setAttribute('height', camera.height);
	$('#raw_camera').width = camera.width;
	$('#raw_camera').height = camera.height;
	$('#processed').width = camera.width;
	$('#processed').height = camera.height;
}

var FILTER = (function() {
	function FILTER(options) {
		this.name = typeof options.name == 'string' ? options.name : 'untitled';
		this.enabled = typeof options.enabled == 'boolean' ? options.enabled : true;
		this.mode = typeof options.mode == 'string' ? options.mode : 'No Filter';
		this.tolerance = typeof options.tolerance == 'number' ? options.tolerance : 50;
		this.inverted = typeof options.inverted == 'boolean' ? options.inverted : false;
		this.targetColor = typeof options.targetColor == 'number' ? options.targetColor : 0;
		this.bounding = typeof options.bounding == 'object' ? options.bounding : {enabled: false};
		this.deadZone = typeof options.deadZone == 'object' ? options.deadZone : {enabled: false};
		this.action = typeof options.action == 'string' ? options.action : 'No Action';
	}
	return FILTER;
})();

function removeFilter(i) {
	var filter = filters[i];
	filters.splice(i, 1);
	updateFilterList();
}

function updateFilterList() {
	$('#filterList').style.display = 'none';

	var data = '',
		filter;
	for (var i=0; i<filters.length; i++) {
		filter = filters[i];
		data += '<div class="filter">'
			+ '<input type="checkbox" id="filter_' + filter.name + '">'
			+ '<div class="name">' + filter.name + '</div>'
			+ '<div class="edit" onclick="editFilter(\'' + i + '\')">Edit</div>'
			+ '<div class="remove" onclick="removeFilter(\'' + i + '\')">x</div>'
		+ '</div>';
	}
	$('#filterList_items').innerHTML = data;

	for (var i=0; i<filters.length; i++) {
		filter = filters[i];
		initializeToggle('#filter_' + filter.name, 'filters.' + i + '.enabled');
	}

	$('#filterList').style.display = 'block';
}

function showMenu() {
	$('#editFilter').style.display = 'none';

	currentMenu = 'mainMenu';
	selectedFilterIndex = -1;

	// Censor Toggle

	initializeToggle('#censorToggle', 'camera.censor');

	// Pixels Toggle

	initializeToggle('#pixelsToggle', 'camera.showPixels');

	// Add Filter Div Button

	initializeDivButton('#addFilter', function(handler, ev) {
		filters.push(new FILTER({
			name: 'untitled'
		}));
		updateFilterList();
	});

	updateFilterList();

	$('#mainMenu').style.display = 'block';
}

function editFilter(index) {
	$('#mainMenu').style.display = 'none';

	currentMenu = 'editFilter';
	selectedFilterIndex = index;

	var filter = filters[index];

	$('#editingName').innerHTML = '<input type="text" id="filterNameField" value="' + filter.name + '">';

	initializeTextField('#filterNameField', 'filters.' + index + '.name');

	// exit edit filter to filter list

	$('#exitEdit').addEventListener('click', function(e) {
		showMenu();
	});

	// Filter Drop-Down

	initializeDropDown('#filterMode', 'filters.' + index + '.mode', function(value) {
		if (value == 'No Filter') {
			$('#toleranceField').style.display = 'none';
			$('#invertedToggle').style.display = 'none';
		} else {
			$('#toleranceField').style.display = 'block';
			$('#invertedToggle').style.display = 'block';
		}
		if (value == 'Target Color' || value == 'Light Map') {
			$('#target_block').style.display = 'block';
			redrawTargetColor = true;
		} else {
			$('#target_block').style.display = 'none';
		}
	});

	// Pick Color Cursor

	initializeCursor('#pickColor', '#processed', function(handler, ev) {
		if (ev.button == 0) {
			var el = $(handler.canvas),
				x = Math.floor(ev.x / el.clientWidth * camera.width),
				y = Math.floor(ev.y / el.clientHeight * camera.height),
				i = (y * camera.width + x) * 4,
				data = ctx_in.getImageData(0, 0, camera.width, camera.height),
				hsv = rgb2hsv(data.data[i], data.data[i + 1], data.data[i + 2]);
			filter.targetColor = Math.round(hsv[0]);
			redrawTargetColor = true;
		}
	});

	// Target Color Canvas Mouse
	function TargetColorListener(x, y) {
		var a = angle(target_color.width/2, target_color.height/2, x, y),
			d = dist(target_color.width/2, target_color.height/2, x, y);

		if (d < 70) {
			// console.log('inside circle');
		} else if (d < 100) {
			filter.targetColor = Math.round(a);
		}

		$('#target_hex').value = hsv2hex(filter.targetColor, 100, 100);

		redrawTargetColor = true;
	}

	initializeCursor('#target_color', '#target_color', function(handler, ev) {
		var bounds = $('#target_color').getBoundingClientRect();
		TargetColorListener(ev.x - bounds.left, y = ev.y - bounds.top);
	}, function(handler, ev) {
		if (handler.started) {
			var bounds = $('#target_color').getBoundingClientRect();
			TargetColorListener(ev.x - bounds.left, y = ev.y - bounds.top);
		}
	});

	$('#filterMode').value = filter.mode || 'No Filter';
	if (filter.mode == 'Target Color' || filter.mode == 'Light Map') {
		$('#target_block').style.display =  'block';
		redrawTargetColor = true;
	} else {
		$('#target_block').style.display = 'none';
	}

	$('#toleranceField').value = filter.tolerance;
	initializeNumberField('#toleranceField', 'filters.' + index + '.tolerance', function(value) {
		redrawTargetColor = true;
	});
	$('#toleranceField').style.display = filter.mode == 'No Filter' ? 'none' : 'inline-block';

	// Inverted Toggle

	initializeToggle('#invertedToggle', 'filters.' + index + '.inverted');

	$('#invertedToggle').checked = filter.inverted || false;
	$('#invertedToggle').style.display = filter.mode == 'No Filter' ? 'none' : 'inline-block';

	// Bounding Box Toggle

	initializeToggle('#boundingToggle', 'filters.' + index + '.bounding.enabled', function(value) {
		var filter = filters[selectedFilterIndex];
		if (value) {
			$('#bounding').style.display = 'inline';
			$('#deadZone_p').style.display = 'block';
			$('#deadZone').style.display = filter.deadZone.enabled ? 'inline' : 'none';
		} else {
			$('#bounding').style.display = 'none';
			$('#deadZone_p').style.display = 'none';
			$('#deadZone').style.display = 'none';
		}
	});

	$('#boundingToggle').checked = false;
	if (filter.bounding !== undefined) {
		$('#boundingToggle').checked = filter.bounding.enabled;
		$('#bounding_x').value = filter.bounding.x || 0;
		$('#bounding_y').value = filter.bounding.y || 0;
		$('#bounding_w').value = filter.bounding.w || 1;
		$('#bounding_h').value = filter.bounding.h || 1;
	}

	// Bounding Box Cursor

	initializeCursor('#pickBounding', '#processed', function(handler, ev) {
		if (ev.button == 0) {
			var filter = filters[selectedFilterIndex],
				el = $(handler.canvas),
				x = ev.x / el.clientWidth,
				y = ev.y / el.clientHeight;
			$('#bounding_x').value = filter.bounding.x = x;
			$('#bounding_y').value = filter.bounding.y = y;
			$('#bounding_w').value = filter.bounding.w = 0;
			$('#bounding_h').value = filter.bounding.h = 0;
		}
	}, function(handler, ev) {
		if (handler.started) {
			var filter = filters[selectedFilterIndex],
				el = $(handler.canvas),
				x = ev.x / el.clientWidth - filter.bounding.x,
				y = ev.y / el.clientHeight - filter.bounding.y;
			$('#bounding_w').value = filter.bounding.w = x;
			$('#bounding_h').value = filter.bounding.h = y;
		}
	});

	// Bounding Box Number Fields

	initializeNumberField('#bounding_x', 'filters.!selectedFilterIndex.bounding.x');
	initializeNumberField('#bounding_y', 'filters.!selectedFilterIndex.bounding.y');
	initializeNumberField('#bounding_w', 'filters.!selectedFilterIndex.bounding.w');
	initializeNumberField('#bounding_h', 'filters.!selectedFilterIndex.bounding.h');
	$('#bounding').style.display = filter.bounding && filter.bounding.enabled ? 'block' : 'none';

	// Dead Zone Toggle

	initializeToggle('#deadZoneToggle', 'filters.!selectedFilterIndex.deadZone.enabled', function(value) {
		if (value) {
			$('#deadZone').style.display = 'inline';
		} else {
			$('#deadZone').style.display = 'none';
		}
	});

	$('#deadZoneToggle').checked = false;
	if (filter.deadZone !== undefined) {
		$('#deadZoneToggle').checked = filter.deadZone.enabled;
		$('#deadZone_x').value = filter.deadZone.x || '';
		$('#deadZone_y').value = filter.deadZone.y || '';
		$('#deadZone_w').value = filter.deadZone.w || '';
		$('#deadZone_h').value = filter.deadZone.h || '';
	}
	$('#deadZone_p').style.display = filter.bounding && filter.bounding.enabled ? 'block' : 'none';

	// Dead Zone Cursor

	initializeCursor('#pickDeadZone', '#processed', function(handler, e) {
		if (e.button == 0) {
			var el = $(handler.canvas),
				x = e.x / el.clientWidth,
				y = e.y / el.clientHeight;
			$('#deadZone_x').value = filters[selectedFilterIndex].deadZone.x = x;
			$('#deadZone_y').value = filters[selectedFilterIndex].deadZone.y = y;
		}
	}, function(handler, e) {
		if (handler.started) {
			var el = $(handler.canvas),
				x = e.x / el.clientWidth - filters[selectedFilterIndex].deadZone.x,
				y = e.y / el.clientHeight - filters[selectedFilterIndex].deadZone.y;
			$('#deadZone_w').value = filters[selectedFilterIndex].deadZone.w = x;
			$('#deadZone_h').value = filters[selectedFilterIndex].deadZone.h = y;
		}
	});

	// Dead Zone Number Fields

	initializeNumberField('#deadZone_x', 'filters.!selectedFilterIndex.deadZone.x');
	initializeNumberField('#deadZone_y', 'filters.!selectedFilterIndex.deadZone.y');
	initializeNumberField('#deadZone_w', 'filters.!selectedFilterIndex.deadZone.w');
	initializeNumberField('#deadZone_h', 'filters.!selectedFilterIndex.deadZone.h');
	$('#deadZone').style.display = filter.deadZone && filter.deadZone.enabled ? 'block' : 'none';

	initializeDropDown('#filterAction', 'filters.' + index + '.action');

	$('#editFilter').style.display = 'block';
}

function runFrame() {
	if (!camera.paused) {
		ctx_in.drawImage(video, 0, 0, camera.width, camera.height);
		ctx_out.clearRect(0, 0, camera.width, camera.height);

		var imageData = ctx_in.getImageData(0, 0, camera.width, camera.height),
			editedData = ctx_in.createImageData(camera.width, camera.height);

		if (currentMenu == 'editFilter') {
			var filter = filters[selectedFilterIndex];

			if (filter.enabled) {
				var filteredImage = filterImage(filter, imageData);

				if (camera.censor) {
					ctx_in.putImageData(filteredImage.imageData, 0, 0);
				}

				if (filteredImage) {
					if (camera.showPixels) {
						ctx_out.putImageData(editedData, 0, 0);

						ctx_out.fillStyle = '#FFF';
						ctx_out.fillRect(
							filter.bounding.x * camera.width, filter.bounding.y * camera.height,
							filter.bounding.w * camera.width, filter.bounding.h * camera.height
						);
						if (filteredImage.pixels) {
							ctx_out.fillStyle = '#000';
							for (var i=0; i<filteredImage.pixels.length; i++) {
								ctx_out.fillRect(filteredImage.pixels[i][0], filteredImage.pixels[i][1], 1, 1);
							}
						}
						editedData = ctx_out.getImageData(0, 0, camera.width, camera.height);
					}

					editedData = parseImage(filter, filteredImage.pixels, editedData).editedData;
				}
			}
		} else if (currentMenu == 'mainMenu') {
			for (filterName in filters) {
				var filter = filters[filterName];

				if (filter.enabled) {
					var filteredImage = filterImage(filter, imageData);

					if (camera.censor) {
						ctx_in.fillStyle = '#333';
						ctx_in.fillRect(0, 0, camera.width, camera.height);
					}

					if (filteredImage) {
						if (camera.showPixels) {
							ctx_out.putImageData(editedData, 0, 0);

							ctx_out.fillStyle = '#FFF';
							ctx_out.fillRect(
								filter.bounding.x * camera.width, filter.bounding.y * camera.height,
								filter.bounding.w * camera.width, filter.bounding.h * camera.height
							);
							if (filteredImage.pixels) {
								ctx_out.fillStyle = '#000';
								for (var i=0; i<filteredImage.pixels.length; i++) {
									ctx_out.fillRect(filteredImage.pixels[i][0], filteredImage.pixels[i][1], 1, 1);
								}
							}
							editedData = ctx_out.getImageData(0, 0, camera.width, camera.height);
						}

						editedData = parseImage(filter, filteredImage.pixels, editedData).editedData;
					}
				}
			}
		}
		ctx_out.putImageData(editedData, 0, 0);
	}

	if (redrawTargetColor) {
		drawTargetColor(filters[selectedFilterIndex]);
		redrawTargetColor = false;
	}

	requestAnimationFrame(runFrame);
}

window.onload = function() {

	// driver

	video = $('#video');
	canvas_in = $('#raw_camera');
	canvas_out = $('#processed');
	ctx_in = canvas_in.getContext('2d');
	ctx_out = canvas_out.getContext('2d');

	camera = {
		width: 320,
		height: 240,
		flipX: true,
		viewing: false,
		paused: false,
		censor: true,
		showPixels: true,
	};
	server = {
		sendAsMouse: false,
		mouse_history: [],
		clickAllowed: false
	};


	target_color = $('#target_color');
	tc_ctx = target_color.getContext('2d');
	redrawTargetColor = false;

	filters = [];

	// Initalize

	filters.push(new FILTER({
		name: 'Mou Pos - Mag',
		mode: 'Find Magenta',
		targetColor: 100,
		tolerance: 15,
		bounding: {
			enabled: true,
			x: 0.21,
			y: 0.16,
			w: 0.4,
			h: 0.27
		},
		deadZone: {
			enabled: true,
			x: 0.34,
			y: 0.235,
			w: 0.145,
			h: 0.125
		},
	//	action: 'Mouse Pos'
	}));

	filters.push(new FILTER({
		name: 'Lef Mou - !Mag',
		mode: 'Find Magenta',
		tolerance: 7,
		inverted: true,
		bounding: {
			enabled: true,
			x: 0.65,
			y: 0.75,
			w: 0.08,
			h: 0.08
		},
	//	action: 'Left Mouse'
	}));

	filters.push(new FILTER({
		name: 'Rig Mou - !Mag',
		mode: 'Find Magenta',
		tolerance: 3,
		inverted: true,
		bounding: {
			enabled: true,
			x: 0.24,
			y: 0.8,
			w: 0.1,
			h: 0.1
		},
	//	action: 'Right Mouse'
	}));

	resize();
	showMenu();

	// Load Webcam

	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false
	}).then(function(stream) {
		video.srcObject = stream;
		video.play();
	}).catch(function(err) {
		console.log("An error occurred: " + err);
	});

	video.addEventListener('playing', function(e) {
		if (!camera.viewing) {
			video.setAttribute('width', camera.width);
			video.setAttribute('height', camera.height);
			$('#raw_camera').width = camera.width;
			$('#raw_camera').height = camera.height;
			$('#processed').width = camera.width;
			$('#processed').height = camera.height;
			camera.viewing = true;
		}
	}, false);

	// Menu Handle Button

	initializeDivButton('#menuHandle', function(handler, ev) {
		if ($('#menu').style.display !== 'block') {
			$('#menu').style.display = 'block';
			video.style.width = 'calc(100% - 20em)';
			canvas_in.style.width = 'calc(100% - 20em)';
			canvas_out.style.width = 'calc(100% - 20em)';
			$('#menuHandle').style.right = 'calc(20em - 1px)';
			$('#menuHandle').innerHTML = '>';
		} else {
			$('#menu').style.display = 'none';
			video.style.width = '100%';
			canvas_in.style.width = '100%';
			canvas_out.style.width = '100%';
			$('#menuHandle').style.right = '0px';
			$('#menuHandle').innerHTML = '<';
		}
		
		resize();
	});
	$('#menuHandle').style.right = 'calc(20em - 1px)';

	// Cursor Mouse Handler

	document.addEventListener('mousedown', function(e) {
		var id, handler;
		for (id in handlers) {
			handler = handlers[id];
			if (handler.canvas == e.target.id && handler.active) {
				handler.started = true;
				if (handler.on && handler.on.down) handler.on.down(handler, e);
			}
		}
	}, false);

	document.addEventListener('mousemove', function(e) {
		var id, handler;
		for (id in handlers) {
			handler = handlers[id];
			if (handler.canvas == e.target.id && handler.active) {
				if (handler.on && handler.on.move) handler.on.move(handler, e);
			}
		}
	}, false);

	document.addEventListener('mouseup', function(e) {
		var id, handler;
		for (id in handlers) {
			handler = handlers[id];
			if (handler.canvas == e.target.id && handler.active) {
				if (handler.on && handler.on.up) handler.on.up(handler, e);
				handler.started = false;
				if (handler.id !== handler.canvas) handler.active = false;
			}
		}
		document.body.style.cursor = 'default';
	}, false);

	// Toggle Key Handler

	document.addEventListener('keydown', function(e) {
		var filter = filters[selectedFilterIndex];

		if (e.keyCode == 32) camera.paused = !camera.paused;
		if (e.keyCode == 70) camera.flipX = !camera.flipX;

		if (e.target == target_color
			&& (filter.mode == 'Target Color' || filter.mode == 'Light Map')) {
			if (e.keyCode == 37) {
				filter.targetColor -= 1;
				if (filter.targetColor < 0) filter.targetColor += 360;
				redrawTargetColor = true;
			}
			if (e.keyCode == 39) {
				filter.targetColor += 1;
				if (filter.targetColor >= 360) filter.targetColor -= 360;
				redrawTargetColor = true;
			}
		}

		if (e.target == $('#menuHandle') && e.keyCode == 13) {
			$('#menuHandle').click();
		}

		if (e.target == $('#censorToggle') && e.keyCode == 13) {
			$('#censorToggle').click();
		}

		if (e.target == $('#inverted') && e.keyCode == 13) {
			$('#inverted').click();
		}

		if (e.target == $('#boundingToggle') && e.keyCode == 13) {
			$('#boundingToggle').click();
		}

		if (e.target == $('#deadZoneToggle') && e.keyCode == 13) {
			$('#deadZoneToggle').click();
		}
	}, false);

	// Run

	runFrame();
}