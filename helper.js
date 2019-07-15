// Non-relative functions that help

function $(e) {
	if (e[0] == '#') {
		return document.getElementById(e.slice(1));
	} else if (e[0] == '.') {
		return document.getElementsByClassName(e.slice(1));
	} else {
		console.log(e);
		return document.getElementById(e);
	}
};

// Color

function rgb2hex(r, g, b) {
	hex = (r * 65536 + g * 256 + b).toString(16, 6);
	while (hex.length < 6) hex = '0' + hex;
	return '#' + hex.toUpperCase();
}

function hsv2rgb(h, s, v) {
	if (h < 0) h = 0;
	if (s < 0) s = 0;
	if (v < 0) v = 0;
	if (h >= 360) h = 359;
	if (s > 100) s = 100;
	if (v > 100) v = 100;

	s /= 100;
	v /= 100;

	hh = h / 60.0;
	C = v * s;
	X = C * (1.0-Math.abs((hh%2)-1.0));
	r = g = b = 0;

	if (hh >= 0 && hh < 1) {
		r = C;
		g = X;
	} else if (hh >= 1 && hh < 2) {
		r = X;
		g = C;
	} else if (hh >= 2 && hh < 3) {
		g = C;
		b = X;
	} else if (hh >= 3 && hh < 4) {
		g = X;
		b = C;
	} else if (hh >= 4 && hh < 5) {
		r = X;
		b = C;
	} else {
		r = C;
		b = X;
	}

	m = v - C;

	return [
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255)
	]
}

function hsv2hex(h, s, v) {
	var rgb = hsv2rgb(h, s, v);
	return rgb2hex(rgb[0], rgb[1], rgb[2]);
}

function rgb2hsv(r, g, b) {
	var h, s, v;

	r /= 255;
	g /= 255;
	b /= 255;

	var min = Math.min(r, g, b),
		max = Math.max(r, g, b);

	v = max;
	d = max - min;

	if (d < 0.00001) {
		s = 0;
		h = 0;
	}

	if (max > 0) {
		s = d / max;
	} else {
		s = 0;
		h = 0;
		return [h, s, v];
	}

	if (r >= max) {
		h = (g - b) / d;
	} else if (g >= max) {
		h = 2 + (b - r) / d;
	} else {
		h = 4 + (r - g) / d;
	}

	h *= 60;
	if (h < 0) h += 360;

	return [h, s * 100, v * 100];
}

// Calc & Trig

function dist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function angle(x1, y1, x2, y2) {
	return (Math.atan2(x1 - x2, y2 - y1) * 180 / Math.PI + 180) % 360;
}

function ad2xy(a, d) {
	return {x: Math.sin(a) * d, y: Math.cos(a) * d};
}

function SameSide(x1, y1, x2, y2, x3, y3, x4, y4) {
	var cp1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3),
		cp2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
	return cp1 * cp2 >= 0;
}

function PointInsideTriangle(x1, y1, x2, y2, x3, y3, x4, y4) {
	return SameSide(x1, y1, x2, y2, x3, y3, x4, y4)
		&& SameSide(x1, y1, x3, y3, x2, y2, x4, y4)
		&& SameSide(x1, y1, x4, y4, x2, y2, x3, y3);
}

// Browser

function pathVar(path, value) {
	if (value !== undefined) {
		if (path.split('.').length > 1) {
			var keySplit = path.split('.'),
				name = keySplit.pop(),
				foundVar = window[keySplit[0]];
			for (var i=1; i<keySplit.length; i++) {
				if (keySplit[i][0] == '!') keySplit[i] = pathVar(keySplit[i].slice(1));
				foundVar = foundVar[keySplit[i]];
			}
			foundVar[name] = value;
		} else {
			window[path] = value;
		}
	} else {
		if (path.split('.').length > 1) {
			var keySplit = path.split('.'),
				name = keySplit.pop(),
				foundVar = window[keySplit[0]];
			for (var i=1; i<keySplit.length; i++) {
				if (keySplit[i][0] == '!') keySplit[i] = pathVar(keySplit[i].slice(1));
				if (keySplit[i] in foundVar) {
					foundVar = foundVar[keySplit[i]];
				} else {
					return undefined;
				}
			}
			return foundVar[name];
		} else {
			if (path[0] == '!') path[0] = path[0].slice(1);
			return window[path];
		}
	}
}

// Network

function XHR_GET(url, cb) {
	var xhr = new XMLHttpRequest();
	if (cb) xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) cb(this.responseText);
	};
	xhr.open("GET", url, true);
	xhr.send();
}