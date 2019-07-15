var handlers = {};

function initializeDivButton(id, action) {
	handlers[id] = {
		action: action
	};

	$(id).addEventListener('click', function(e) {
		handlers['#' + e.target.id].action($('#' + e.target.id), e);
	});
}

function initializeNumberField(id, key, extact) {
	handlers[id] = {
		key: key,
		extact: extact,
		action: function(el, ev) {
			pathVar(this.key, el.value * 1);
			if (typeof this.extact == 'function') this.extact(el.value * 1);
		}
	}

	$(id).addEventListener('change', function(e) {
		handlers['#' + e.target.id].action(this, e);
	});
}

function initializeTextField(id, key, extact) {
	handlers[id] = {
		key: key,
		extact: extact,
		action: function(el, ev) {
			pathVar(this.key, el.value);
			if (typeof this.extact == 'function') this.extact(el.value);
		}
	}

	$(id).addEventListener('change', function(e) {
		handlers['#' + e.target.id].action(this, e);
	});
}

function initializeToggle(id, key, extact) {
	handlers[id] = {
		key: key,
		extact: extact,
		action: function(el, ev) {
			pathVar(this.key, el.checked);
			if (typeof this.extact == 'function') this.extact(el.checked);
		}
	};

	if (pathVar(key)) $(id).checked = pathVar(key);

	$(id).addEventListener('change', function(e) {
		handlers['#' + e.target.id].action(this, e);
	}, false);
}

function initializeDropDown(id, key, extact) {
	handlers[id] = {
		key: key,
		extact: extact,
		action: function(el, ev) {
			pathVar(this.key, el.value);
			if (typeof this.extact == 'function') this.extact(el.value);
		}
	}

	if (pathVar(key)) $(id).value = pathVar(key);

	$(id).addEventListener('change', function(e) {
		handlers['#' + e.target.id].action(this, e);
	});
}

function initializeCursor(id, canvas, down, move, up) {
	handlers[id] = {
		id: id,
		canvas: canvas,
		on: {
			down: down,
			move: move,
			up: up
		},
		active: id == canvas,
		started: false
	}

	if (id !== canvas) $(id).addEventListener('click', function(e) {
		handlers['#' + this.id].active = true;
		document.body.style.cursor = 'crosshair';
	});
}