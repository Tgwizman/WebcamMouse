var modes = {
	'No Filter': function(camera, filter, pixel) {
		return {
			passed: false,
			r: camera.censor ? 255 : 0,
			g: camera.censor ? 255 : 0,
			b: camera.censor ? 255 : 0,
			a: camera.censor ? 255 : 0
		};
	},
	'High Contrast': function(camera, filter, pixel) {
		var shade = (pixel.r + pixel.g + pixel.b) / 3,
			passed = shade < filter.tolerance;

		return {
			passed: passed,
			r: filter.inverted ? (passed ? 255 : 0) : (passed ? 0 : 255),
			g: filter.inverted ? (passed ? 255 : 0) : (passed ? 0 : 255),
			b: filter.inverted ? (passed ? 255 : 0) : (passed ? 0 : 255),
			a: passed || camera.censor ? 255 : 0
		};
	},
	'Target Color': function(camera, filter, pixel) {
		var hsv = rgb2hsv(pixel.r, pixel.g, pixel.b),
			rgb_out = hsv2rgb(filter.targetColor, 100, 100),
			passed = Math.abs(filter.targetColor - hsv[0]) < filter.tolerance;

		return {
			passed: passed,
			r: filter.inverted ? (passed ? 255 : rgb_out[0]) : (passed ? rgb_out[0] : 255),
			g: filter.inverted ? (passed ? 255 : rgb_out[1]) : (passed ? rgb_out[1] : 255),
			b: filter.inverted ? (passed ? 255 : rgb_out[2]) : (passed ? rgb_out[2] : 255),
			a: passed || camera.censor ? 255 : 0
		};
	},
	'Light Map': function(camera, filter, pixel) {
		var hsv = rgb2hsv(pixel.r, pixel.g, pixel.b),
			rgb_out = hsv2rgb(hsv[0], 100, 100),
			passed = Math.abs(filter.targetColor - hsv[0]) < filter.tolerance;

		return {
			passed: passed,
			r: rgb_out[0],
			g: rgb_out[1],
			b: rgb_out[2],
			a: passed || camera.censor ? 255 : 0
		};
	},
	'Find Green': function(camera, filter, pixel) {
		var passed = Math.abs(pixel.r - pixel.b) < 100 && pixel.r + filter.tolerance < pixel.g;

		return {
			passed: passed,
			r: passed ? 0 : 255,
			g: passed ? 255 : 0,
			b: passed ? 0 : 255,
			a: passed || camera.censor ? 255 : 0
		};
	},
	'Find Magenta': function(camera, filter, pixel) {
		var passed = Math.abs(pixel.r - pixel.b) < 100 && pixel.r > pixel.g + filter.tolerance;

		return {
			passed: passed,
			r: passed ? 255 : 0,
			g: passed ? 0 : 255,
			b: passed ? 255 : 0,
			a: passed || camera.censor ? 255 : 0
		};
	}
}