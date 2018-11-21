/**
** Class : Editor
**/

var Editor = function() {
	this.config = {debug: false, blockSize: 5, worldSize: 8};
	this.temp = {};
	this.ressources = {};
	this.animations = [];
	if(this.config.debug) { this.stats = new Stats(); this.stats.setMode(0); this.stats.domElement.style.position = 'absolute'; this.stats.domElement.style.left = '0px'; this.stats.domElement.style.bottom = '0px'; document.body.appendChild(this.stats.domElement);	}

	var self = this; this.loadRessources(function() {
		self.initRenderer();
		self.bindEvents();
		self.loadWorld();
		//self.registerAnimations() is called after world is loading
		self.update();
		self.selectBlock(self.world.player);
		$('canvas, #block, #demo').fadeIn();
		$('#demo').hide();
	});
}

Editor.prototype.log = function(arg1, arg2) {
	if(!arg2) { console.log(arg1); }
	else { console.log(arg1, arg2); }
}

Editor.prototype.loadRessources = function(callback) {
	this.ressources['lineTexture'] = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.2});

	var self = this;
	$.ajax({type: 'GET', url: 'ressources/worlds.json', success: function(data) {
		self.ressources['worlds'] = data;
		var number = 0; var loader = new THREE.TextureLoader();
		loader.load('ressources/images/player.png', function (texture) {
			self.ressources['playerMaterial'] = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0.4}); number++;
			if(number == 3) { callback(); }
		});
		loader.load('ressources/images/goal.png', function (texture) {
			self.ressources['goalMaterial'] = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0.4}); number++;
			if(number == 3) { callback(); }
		});
		loader.load('ressources/images/obstacle.png', function (texture) {
			self.ressources['obstacleMaterial'] = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0.4}); number++;
			if(number == 3) { callback(); }
		});
	}});
}

Editor.prototype.initRenderer = function() {
	this.scene = new THREE.Scene();

	this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
	this.camera.position.set(0, 11, 65);
	this.camera.lookAt(this.scene.position);

	this.renderer = new THREE.WebGLRenderer({ alpha: true });
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(this.renderer.domElement);
	this.domEvents = new THREEx.DomEvents(this.camera, this.renderer.domElement);
}

Editor.prototype.bindEvents = function() {
	var editor = this;

	window.addEventListener('resize', this, false);
	document.addEventListener('mousemove', this);
	document.addEventListener('touchmove', this);

	$('#block-remove').on('click', function() {
		editor.temp.selectedBlock.remove();
	});
	$('#block-add').on('click', function() {
		editor.world.addObstacle();
	});
	$('#block-export').on('click', function() {
		editor.exportWorldToJSON();
	});

	keyboardJS.bind('spacebar', null, function() {
		if(editor.world.line.axis == 'x') {
			editor.startAnimation('lineAnimation');
			editor.world.line.axis = 'z';
			$('#block #block-axis').text('"' + editor.world.line.axis.toUpperCase() + '"');
		}
	    else if(editor.world.line.axis == 'z') {
	    	editor.startAnimation('lineAnimation');
	    	editor.world.line.axis = 'x';
	    	$('#block #block-axis').text('"' + editor.world.line.axis.toUpperCase() + '"');
	    }
	});
	keyboardJS.bind('left', function() {
		editor.temp.selectedBlock.move('left');
	});
	keyboardJS.bind('right', function() {
		editor.temp.selectedBlock.move('right');
	});
	keyboardJS.bind('up', function() {
		editor.temp.selectedBlock.move('up');
	});
	keyboardJS.bind('down', function() {
		editor.temp.selectedBlock.move('down');
	});
}

Editor.prototype.handleEvent = function(event) {
	if(event.type == 'mousemove' || event.type == 'touchmove') {
		if(event.type == 'mousemove') {
			var mouseX = event.clientX - window.innerWidth / 2;
		} else if(event.type == 'touchmove') {
			var mouseX = event.touches[0].clientX - window.innerWidth / 2;
		}
		this.camera.position.x = 65 * Math.sin(0.001 * (-mouseX));
		this.camera.position.z = 65 * Math.cos(0.001 * (-mouseX));
		this.camera.lookAt(this.scene.position);
		if(!this.everPlayed) {
			$('#step0 .step-number').animate({backgroundColor: "#96e097"});
		}
	}
	else if(event.type == 'resize') {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	}
}

Editor.prototype.registerAnimations = function() {
	this.animations['lineAnimation'] = {
		'object': this.world.line.object.rotation,
		'to': {y: 'this.world.line.object.rotation.y + (Math.PI / 2)'},
		'duration': 100,
		'easing': TWEEN.Easing.Back.In
	};
}

Editor.prototype.startAnimation = function(name) {
	var animation = $.extend(true, {}, this.animations[name]);
	for(key in animation.to) {
		animation.to[key] = eval(animation.to[key]);
	}
	new TWEEN.Tween(animation.object).to(animation.to, animation.duration).easing(animation.easing).start();
}

Editor.prototype.loadWorld = function() {
	this.world = new World(this);
	this.registerAnimations();
}

Editor.prototype.update = function() {
	if(this.config.debug) { this.stats.begin(); }

	TWEEN.update();
	this.renderer.render(this.scene, this.camera);

	if(this.config.debug) { this.stats.end(); }
	requestAnimationFrame(this.update.bind(this));
}

Editor.prototype.selectBlock = function(block) {
	if(this.temp.selectedBlock) { this.temp.selectedBlock.object.material.opacity = 0.4; }
	this.temp.selectedBlock = block;
	this.world.line.object.position.set(block.getCoordinates().x * this.config.blockSize, block.getCoordinates().y * this.config.blockSize, block.getCoordinates().z * this.config.blockSize);
	if(block.type == 'obstacle') { 	block.object.material.opacity = 0.75; }
	else { 	block.object.material.opacity = 1; }
	$('#block #block-icon').attr('src', 'ressources/images/' + block.type + '.png');
	$('#block #block-text').text(block.type[0].toUpperCase() + block.type.slice(1) + ',');
	$('#block #block-coords').text('[' + block.getCoordinates().x + ', ' + block.getCoordinates().y + ', ' + block.getCoordinates().z + '],');
	$('#block #block-axis').text('"' + this.world.line.axis.toUpperCase() + '"');
}

Editor.prototype.exportWorldToJSON = function() {
	var object = {name: '', player: [], goal: [], obstacles: []};
	object.name = $('#block #block-name').val();
	if(object.name == '') { object.name = 'New world'; }
	object.player = [this.world.player.getCoordinates().x, this.world.player.getCoordinates().y, this.world.player.getCoordinates().z];
	object.goal = [this.world.goal.getCoordinates().x, this.world.goal.getCoordinates().y, this.world.goal.getCoordinates().z];
	for(var i = 2; i < this.world.blocks.length; i++) {
		var block = this.world.blocks[i];
		object.obstacles.push([block.getCoordinates().x, block.getCoordinates().y, block.getCoordinates().z]);
	}

	var ghostTextarea = document.createElement('textarea');
    ghostTextarea.id = 'ghosttextarea';
    ghostTextarea.style.position = 'absolute'; 
    ghostTextarea.style.top = '0px'; 
    ghostTextarea.style.left = '-5000px'; 
    document.body.appendChild(ghostTextarea);
    ghostTextarea.textContent = JSON.stringify(object, null, '\t');
    ghostTextarea.focus(); ghostTextarea.setSelectionRange(0, ghostTextarea.value.length);
    document.execCommand('copy');

	alert('JSON\'s object of the world have been copied to your clipboard.');
}



/**
** Class : Block
**/

var Block = function(editorInstance, type, x, y, z) {
	this.editor = editorInstance;
	this.type = type;
	this.object;

	this.create(x, y, z); //Create object and add it to the scene
}

Block.prototype.create = function(x, y, z) {
	var cubeGeometry = new THREE.CubeGeometry(this.editor.config.blockSize, this.editor.config.blockSize, this.editor.config.blockSize);
	if(this.type == 'player') { cubeMaterial = this.editor.ressources.playerMaterial; }
	else if(this.type == 'goal') { cubeMaterial = this.editor.ressources.goalMaterial; }
	else if(this.type == 'obstacle') { cubeMaterial = this.editor.ressources.obstacleMaterial; }

	this.object = new THREE.Mesh(cubeGeometry, cubeMaterial);
	this.setCoordinates(x, y, z);
	this.editor.scene.add(this.object);
	return this.object;
}

Block.prototype.move = function(direction) {
	var axis = this.editor.world.line.axis;
	var nextObstacle = this.editor.world.getNextObstacle(this, direction, axis);
	var to = {};

	if(direction == "up" || direction == "down") { axis = 'y'; }
	if(direction == "left" || direction == "down") { to[axis] = "-" + this.editor.config.blockSize; }
	else if(direction == "right" || direction == "up") { to[axis] = "+" + this.editor.config.blockSize; }

	if(Math.abs(this.getCoordinates()[axis] + parseInt(to[axis] / 5)) <= this.editor.config.worldSize) {
		if(!nextObstacle || this.getCoordinates()[axis] + parseInt(to[axis] / 5) != nextObstacle.getCoordinates()[axis]) {
			var self = this; new TWEEN.Tween(this.object.position).to(to, 0).easing(TWEEN.Easing.Linear.None).start().onComplete(function() {
				$('#block #block-coords').text('[' + self.getCoordinates().x + ', ' + self.getCoordinates().y + ', ' + self.getCoordinates().z + ']');
			});
			new TWEEN.Tween(this.editor.world.line.object.position).to(to, 0).easing(TWEEN.Easing.Linear.None).start();
		}
	}
}

Block.prototype.remove = function() {
	if(this.type != "player" && this.type != "goal") {
		this.editor.scene.remove(this.object);
		var index = this.editor.world.blocks.indexOf(this);
		this.editor.world.blocks.splice(index, 1);
		this.editor.selectBlock(this.editor.world.player);
	} else {
		alert("You can't remove this block ! You can't play without a " + this.type + "...")
	}
}

Block.prototype.setCoordinates = function(x, y, z) {
	this.object.position.set(x * this.editor.config.blockSize, y * this.editor.config.blockSize, z * this.editor.config.blockSize);
}

Block.prototype.getCoordinates = function() {
	return {x: this.object.position.x / this.editor.config.blockSize, y: this.object.position.y / this.editor.config.blockSize, z: this.object.position.z / this.editor.config.blockSize};
}



/**
** Class : World
**/

var World = function(editorInstance) {
	this.editor = editorInstance;
	this.blocks = [];
	this.player;
	this.goal;
	this.line = {axis: 'x'};

	this.create();
}

World.prototype.create = function() {
	var world = this.editor.ressources['worlds'][0];

	this.player = new Block(this.editor, 'player', world.player[0], world.player[1], world.player[2]);
	this.goal = new Block(this.editor, 'goal', world.goal[0], world.goal[1], world.goal[2]);
	this.blocks.push(this.player);
	this.blocks.push(this.goal);

	this.line.object = new THREE.Mesh(new THREE.CubeGeometry(this.editor.config.blockSize * 4, 0.75, 0.75), this.editor.ressources.lineTexture);
	this.line.object.position.set(world.player[0] * this.editor.config.blockSize, world.player[1] * this.editor.config.blockSize, world.player[2] * this.editor.config.blockSize);
	this.line.object.rotation.y = 0;
	this.line.axis = 'x';
	this.editor.scene.add(this.line.object);

	for(var i = 0; i < world.obstacles.length; i++) {
		var obstacle = new Block(this.editor, 'obstacle', world.obstacles[i][0], world.obstacles[i][1], world.obstacles[i][2]);
		this.blocks.push(obstacle);
	}

	for(var i = 0; i < this.blocks.length; i++) {
		var block = this.blocks[i];
		var self = this;
		this.editor.domEvents.addEventListener(block.object, 'click', function(e) {
		    for(var i = 0; i < self.blocks.length; i++) {
		    	if(e.target == self.blocks[i].object) { self.editor.selectBlock(self.blocks[i]); }
		    }
		}, false);
	}
}

World.prototype.remove = function() {
	//Remove all blocks of the world and clear this.blocks
	for(var i = 0 ; i < this.blocks.length ; i++) { this.editor.scene.remove(this.blocks[i].object); }
	this.blocks = [];
	this.editor.scene.remove(this.line.object);
}

World.prototype.addObstacle = function() {
	var alreadyBlock = false;
	for(var i = 0; i < this.blocks.length; i++) {
		if(this.blocks[i].getCoordinates().x == 0 && this.blocks[i].getCoordinates().y == 0 && this.blocks[i].getCoordinates().z == 0) { alreadyBlock = true; }
	}
	if(alreadyBlock) {
		alert('There is already a block at [0, 0, 0]. Move it to be able to add an another obstacle in the world.');
	} else {
		var obstacle = new Block(this.editor, 'obstacle', 0, 0, 0);
		this.blocks.push(obstacle);
		var self = this; this.editor.domEvents.addEventListener(obstacle.object, 'click', function(e) {
		    for(var i = 0; i < self.blocks.length; i++) {
		    	if(e.target == self.blocks[i].object) { self.editor.selectBlock(self.blocks[i]); }
		    }
		}, false);
		this.editor.selectBlock(obstacle);
	}
}

World.prototype.getNextObstacle = function(block, direction, axis) {
	var nearestObstacle;
	for(var i = 0; i < this.blocks.length; i++) {
		var obstacle = this.blocks[i];
		if(direction == "up") {
			if(obstacle.getCoordinates().y > block.getCoordinates().y && block.getCoordinates().x == obstacle.getCoordinates().x && block.getCoordinates().z == obstacle.getCoordinates().z) {
				if(!nearestObstacle) { nearestObstacle = obstacle; }
				else if(obstacle.getCoordinates().y < nearestObstacle.getCoordinates().y) { nearestObstacle = obstacle; }
			}
		} else if(direction == "down") {
			if(obstacle.getCoordinates().y < block.getCoordinates().y && block.getCoordinates().x == obstacle.getCoordinates().x && block.getCoordinates().z == obstacle.getCoordinates().z) {
				if(!nearestObstacle) { nearestObstacle = obstacle; }
				else if(obstacle.getCoordinates().y > nearestObstacle.getCoordinates().y) { nearestObstacle = obstacle; }
			}
		} else if(direction == "left" && axis == "x") {
			if(obstacle.getCoordinates().x < block.getCoordinates().x && block.getCoordinates().y == obstacle.getCoordinates().y && block.getCoordinates().z == obstacle.getCoordinates().z) {
				if(!nearestObstacle) { nearestObstacle = obstacle; }
				else if(obstacle.getCoordinates().x > nearestObstacle.getCoordinates().x) { nearestObstacle = obstacle; }
			}
		} else if(direction == "right" && axis == "x") {
			if(obstacle.getCoordinates().x > block.getCoordinates().x && block.getCoordinates().y == obstacle.getCoordinates().y && block.getCoordinates().z == obstacle.getCoordinates().z) {
				if(!nearestObstacle) { nearestObstacle = obstacle; }
				else if(obstacle.getCoordinates().x < nearestObstacle.getCoordinates().x) { nearestObstacle = obstacle; }
			}
		} else if(direction == "left" && axis == "z") {
			if(obstacle.getCoordinates().z < block.getCoordinates().z && block.getCoordinates().x == obstacle.getCoordinates().x && block.getCoordinates().y == obstacle.getCoordinates().y) {
				if(!nearestObstacle) { nearestObstacle = obstacle; }
				else if(obstacle.getCoordinates().z > nearestObstacle.getCoordinates().z) { nearestObstacle = obstacle; }
			}
		} else if(direction == "right" && axis == "z") {
			if(obstacle.getCoordinates().z > block.getCoordinates().z && block.getCoordinates().x == obstacle.getCoordinates().x && block.getCoordinates().y == obstacle.getCoordinates().y) {
				if(!nearestObstacle) { nearestObstacle = obstacle; }
				else if(obstacle.getCoordinates().z < nearestObstacle.getCoordinates().z) { nearestObstacle = obstacle; }
			}
		}
	}
	return nearestObstacle;
}