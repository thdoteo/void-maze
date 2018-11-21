/**
** Class : Game
**/

var Game = function() {
	this.config = {debug: false, blockSize: 5, worldSize: 8};
	this.temp = {};
	this.ressources = {};
	this.animations = [];
	this.player = new Player(this, 'théo');
	if(this.config.debug) { this.stats = new Stats(); this.stats.setMode(0); this.stats.domElement.style.position = 'absolute'; this.stats.domElement.style.left = '0px'; this.stats.domElement.style.bottom = '0px'; document.body.appendChild(this.stats.domElement);	}

	var self = this; this.loadRessources(function() {
		self.initRenderer();
		self.bindEvents();
		self.loadWorld('start');
		//self.registerAnimations() is called after world is loading
		self.update();
		$('canvas, #world, #demo').fadeIn();
	});
}

Game.prototype.log = function(arg1, arg2) {
	if(!arg2) { console.log(arg1); }
	else { console.log(arg1, arg2); }
}

Game.prototype.loadRessources = function(callback) {
	this.ressources['music'] = new Audio('ressources/musics/theme.mp3'); this.ressources.music.loop = true; this.ressources.music.volume = 0.25;
	if(!this.config.debug) { this.ressources.music.play(); }
	this.ressources['winSound'] = new Audio('ressources/sounds/win.mp3'); 
	this.ressources['loseSound'] = new Audio('ressources/sounds/lose.mp3'); 
	this.ressources['collisionSound'] = new Audio('ressources/sounds/collision.mp3'); 

	this.ressources['lineTexture'] = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.2});

	var self = this;
	$.ajax({type: 'GET', url: 'ressources/worlds.json', success: function(data) {
		self.ressources['worlds'] = data;
		var number = 0; var loader = new THREE.TextureLoader();
		loader.load('ressources/images/player.png', function (texture) {
			self.ressources['playerMaterial'] = new THREE.MeshBasicMaterial({map: texture}); number++;
			if(number == 3) { callback(); }
		});
		loader.load('ressources/images/goal.png', function (texture) {
			self.ressources['goalMaterial'] = new THREE.MeshBasicMaterial({map: texture, transparent: true}); number++;
			if(number == 3) { callback(); }
		});
		loader.load('ressources/images/obstacle.png', function (texture) {
			self.ressources['obstacleMaterial'] = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0.8}); number++;
			if(number == 3) { callback(); }
		});
	}});
}

Game.prototype.initRenderer = function() {
	this.scene = new THREE.Scene();

	this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
	this.camera.position.set(0, 11, 65);
	this.camera.lookAt(this.scene.position);

	this.renderer = new THREE.WebGLRenderer({ alpha: true });
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(this.renderer.domElement);
}

Game.prototype.bindEvents = function() {
	window.addEventListener('resize', this, false);
	document.addEventListener('mousemove', this);
	document.addEventListener('touchmove', this);

	var self = this;
	keyboardJS.bind('spacebar', null, function() {
		if(self.player.line.axis == 'x') {
			self.startAnimation('lineAnimation');
			self.player.line.axis = 'z';
		}
	    else if(self.player.line.axis == 'z') {
	    	self.startAnimation('lineAnimation');
	    	self.player.line.axis = 'x';
	    }
	    if(!self.everPlayed) {
			$('#step3 .step-number').animate({backgroundColor: "#96e097"});
		}
	});
	keyboardJS.bind('left', function() {
		self.player.move('left');
		if(!self.everPlayed) {
			$('#step4 .step-number').animate({backgroundColor: "#96e097"});
		}
	});
	keyboardJS.bind('right', function() {
		self.player.move('right');
		if(!self.everPlayed) {
			$('#step1 .step-number').animate({backgroundColor: "#96e097"});
		}
	});
	keyboardJS.bind('up', function() {
		self.player.move('up');
		if(!self.everPlayed) {
			$('#step2 .step-number').animate({backgroundColor: "#96e097"});
		}
	});
	keyboardJS.bind('down', function() {
		self.player.move('down');
	});
}

Game.prototype.handleEvent = function(event) {
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

Game.prototype.registerAnimations = function() {
	this.animations['lineAnimation'] = {
		'object': this.player.line.object.rotation,
		'to': {y: 'this.player.line.object.rotation.y + (Math.PI / 2)'},
		'duration': 100,
		'easing': TWEEN.Easing.Back.In
	};
}

Game.prototype.startAnimation = function(name) {
	var animation = $.extend(true, {}, this.animations[name]);
	for(key in animation.to) {
		animation.to[key] = eval(animation.to[key]);
	}
	new TWEEN.Tween(animation.object).to(animation.to, animation.duration).easing(animation.easing).start();
}

Game.prototype.loadWorld = function(which) {
	if(which == 'start') { this.temp.currentWorldId = 0; }
	else if(which == 'next') { this.temp.currentWorldId++; }
	
	if(this.world) { this.world.remove(); }
	this.world = new World(this, this.temp.currentWorldId);
	this.registerAnimations();

	$('#demo').fadeOut();
}

Game.prototype.update = function() {
	if(this.config.debug) { this.stats.begin(); }

	TWEEN.update();
	this.renderer.render(this.scene, this.camera);

	if(this.config.debug) { this.stats.end(); }
	requestAnimationFrame(this.update.bind(this));
}

Game.prototype.win = function() {
	if(this.temp.currentWorldId == this.ressources['worlds'].length - 1) {
		this.loadWorld('start');
	} else {
		this.loadWorld('next');
	}
}

Game.prototype.lose = function() {
	this.loadWorld('current');
}



/**
** Class : Block
**/

var Block = function(gameInstance, type, x, y, z) {
	this.game = gameInstance;
	this.type = type;
	this.object;

	this.create(x, y, z); //Create object and add it to the scene
}

Block.prototype.create = function(x, y, z) {
	var cubeGeometry = new THREE.CubeGeometry(this.game.config.blockSize, this.game.config.blockSize, this.game.config.blockSize);
	if(this.type == 'player') { cubeMaterial = this.game.ressources.playerMaterial; }
	else if(this.type == 'goal') { cubeMaterial = this.game.ressources.goalMaterial; }
	else if(this.type == 'obstacle') { cubeMaterial = this.game.ressources.obstacleMaterial; }

	this.object = new THREE.Mesh(cubeGeometry, cubeMaterial);
	this.setCoordinates(x, y, z);
	this.game.scene.add(this.object);
	return this.object;
}

Block.prototype.setCoordinates = function(x, y, z) {
	this.object.position.set(x * this.game.config.blockSize, y * this.game.config.blockSize, z * this.game.config.blockSize);
}

Block.prototype.getCoordinates = function() {
	return {x: this.object.position.x / this.game.config.blockSize, y: this.object.position.y / this.game.config.blockSize, z: this.object.position.z / this.game.config.blockSize};
}



/**
** Class : Player
**/

var Player = function(gameInstance, name) {
	this.game = gameInstance;
	this.name = name;
	this.block; this.line = {axis: 'x'};
	this.moving = {}; this.nextMovement = {}; this.disableMoving = false; this.lastDirection;
}

Player.prototype.move = function(direction) {
	var axis = this.line.axis;
	if(this.isMoving()) {
		this.nextMovement = {direction: direction, axis: axis};
		return true;
	}
	this.moving = {direction: direction, axis: axis};
	var nextObstacle = this.game.world.getNextObstacle(this.block, direction, axis);

	if(direction == "up" || direction == "down") { this.moving.axis = axis = 'y'; }
	var distance, distanceBeforeCollision;
	if(nextObstacle && !this.game.world.isBlockOutside(nextObstacle)) {
		distance = Math.abs(nextObstacle.getCoordinates()[axis] - this.block.getCoordinates()[axis]) * this.game.config.blockSize;
		distanceBeforeCollision = this.game.config.blockSize;
		if(nextObstacle.type == "goal") { distanceBeforeCollision = 0; }
	} else {
		if(direction == "left" || direction == "down") {
			distance = Math.abs(this.game.config.worldSize + this.block.getCoordinates()[axis]) * this.game.config.blockSize;
		} else if(direction == "right" || direction == "up") {
			distance = Math.abs(this.game.config.worldSize - this.block.getCoordinates()[axis]) * this.game.config.blockSize;
		}
		distanceBeforeCollision = 0;
	}

	var to = {};
	if(direction == "left" || direction == "down") { to[axis] = "-" + (distance - distanceBeforeCollision); }
	else if(direction == "right" || direction == "up") { to[axis] = "+" + (distance - distanceBeforeCollision); }

	var time =  25 * (distance / 5); //50ms per blocks

	if(direction != this.lastDirection) {
		var self = this; new TWEEN.Tween(this.block.object.position).to(to, time).easing(TWEEN.Easing.Linear.None).start().onComplete(function() {
			self.reachBlock(nextObstacle);
		});
		new TWEEN.Tween(this.line.object.position).to(to, time).easing(TWEEN.Easing.Linear.None).start();
	} else {
		this.reachBlock(nextObstacle);
	}

	this.lastDirection = direction;
}

Player.prototype.reachBlock = function(block) {
	if(!block || this.game.world.isBlockOutside(block)) {
		// console.log('void');
		this.game.ressources.loseSound.play();
		$('#lose').fadeIn(function() { $(this).delay(2500).fadeOut(); });

		this.disableMoving = true;
		new TWEEN.Tween(this.line.object.position).to({y: "-" + this.game.config.worldSize * this.game.config.blockSize * 3}, 1500).easing(TWEEN.Easing.Cubic.In).start();
		for(var i = 0 ; i < this.game.world.blocks.length ; i++) {
			new TWEEN.Tween(this.game.world.blocks[i].object.position).to({y: "-" + this.game.config.worldSize * this.game.config.blockSize * 3}, 1500).easing(TWEEN.Easing.Cubic.In).start();
		}
		var self = this; new TWEEN.Tween(this.block.object.position).to({y: "-" + this.game.config.worldSize * this.game.config.blockSize * 3}, 1500).easing(TWEEN.Easing.Cubic.In).start().onComplete(function() {
			self.disableMoving = false;
			self.moving = {};
			self.lastDirection = '';
			self.game.temp.everPlayed = true;
			self.game.lose();
		});

	}
	else if(block.type == "obstacle") {
		// console.log('obstacle [' + block.getCoordinates().x + ', ' + block.getCoordinates().y + ', ' + block.getCoordinates().z + ']');
		this.game.ressources.collisionSound.play();

		if(!this.disableMoving) { 
			var step1 = {}; var step2 = {};
			if(this.moving.direction == "left" || this.moving.direction == "down") { step1[this.moving.axis] = "-" + 0.3; step2[this.moving.axis] = "+" + 0.3; }
			else if(this.moving.direction == "right" || this.moving.direction == "up") { step1[this.moving.axis] = "+" + 0.3; step2[this.moving.axis] = "-" + 0.3; }
			this.disableMoving = true;
			var self = this; new TWEEN.Tween(block.object.position).to(step1, 50).easing(TWEEN.Easing.Linear.None).start().onComplete(function() {
				new TWEEN.Tween(block.object.position).to(step2, 150).easing(TWEEN.Easing.Linear.None).start().onComplete(function() {
					self.disableMoving = false;
					self.lastDirection = '';
				});
			});
		}
		this.moving = {};
		if(Object.keys(this.nextMovement).length != 0) {
			this.move(this.nextMovement.direction); this.nextMovement = {};
		}

	} else if(block.type == "goal") {
		// console.log('goal [' + block.getCoordinates().x + ', ' + block.getCoordinates().y + ', ' + block.getCoordinates().z + ']');
		this.game.ressources.winSound.play();
		if(this.game.temp.currentWorldId == this.game.ressources['worlds'].length - 1) { $('#win').fadeIn(function() { $(this).delay(4500).fadeOut(); }); }
		this.disableMoving = true;
		var self = this; new TWEEN.Tween(block.object.material).to({opacity: 0}, 200).easing(TWEEN.Easing.Cubic.In).start().onComplete(function() {
			new TWEEN.Tween(self.block.object.rotation).to({z: 10, y: 15}, 2500).easing(TWEEN.Easing.Cubic.In).start().onComplete(function() {
				new TWEEN.Tween(self.line.object.position).to({y: "+" + self.game.config.worldSize * self.game.config.blockSize * 3}, 1500).easing(TWEEN.Easing.Cubic.In).start();
				for(var i = 0 ; i < self.game.world.blocks.length ; i++) {
					new TWEEN.Tween(self.game.world.blocks[i].object.position).to({y: "+" + self.game.config.worldSize * self.game.config.blockSize * 3}, 1500).easing(TWEEN.Easing.Cubic.In).start();
				}
				new TWEEN.Tween(self.block.object.position).to({y: "+" + self.game.config.worldSize * self.game.config.blockSize * 3}, 1500).easing(TWEEN.Easing.Cubic.In).start().onComplete(function() {
					block.object.material.opacity = 1;
					self.disableMoving = false;
					self.moving = {};
					self.lastDirection = '';
					self.game.temp.everPlayed = true;
					self.game.win();
				});
			});
		});
	}
}

Player.prototype.isMoving = function() {
	if(Object.keys(this.moving).length != 0) { return true; }
	else { return false; }
}



/**
** Class : World
**/

var World = function(gameInstance, worldId) {
	this.game = gameInstance;
	this.worldId = worldId;
	this.blocks = [];
	this.goal;

	this.create(worldId);
}

World.prototype.create = function(worldId) {
	var world = this.game.ressources['worlds'][worldId];
	$('#world-number').text(world.name);

	//Create player's block. Create player's line and add it to the scene.
	// this.game.player.line.object = new THREE.Mesh(new THREE.CubeGeometry(this.game.config.worldSize * this.game.config.blockSize * 2 + this.game.config.blockSize, 0.75, 0.75), this.game.ressources.lineTexture);
	this.game.player.line.object = new THREE.Mesh(new THREE.CubeGeometry(this.game.config.blockSize * 4, 0.75, 0.75), this.game.ressources.lineTexture);
	this.game.player.line.object.position.set(world.player[0] * this.game.config.blockSize, world.player[1] * this.game.config.blockSize, world.player[2] * this.game.config.blockSize);
	this.game.player.line.axis = 'x';
	this.game.player.line.object.rotation.y = 0;
	this.game.scene.add(this.game.player.line.object);
	this.game.player.block = new Block(this.game, 'player', world.player[0], world.player[1], world.player[2]);

	//Create goal and add it to this.blocks.
	this.goal = new Block(this.game, 'goal', world.goal[0], world.goal[1], world.goal[2]);
	this.blocks.push(this.goal);

	//Create obstacles and add them to this.blocks.
	for(var i = 0; i < world.obstacles.length; i++) {
		var obstacle = new Block(this.game, 'obstacle', world.obstacles[i][0], world.obstacles[i][1], world.obstacles[i][2]);
		this.blocks.push(obstacle);
	}
}

World.prototype.remove = function() {
	//Remove all blocks of the world and clear this.blocks
	for(var i = 0 ; i < this.blocks.length ; i++) { this.game.scene.remove(this.blocks[i].object); }
	this.blocks = [];
	this.game.scene.remove(this.game.player.block.object);
	this.game.scene.remove(this.game.player.line.object);
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

World.prototype.isBlockOutside = function(block) {
	var coordinates = block.getCoordinates();
	if(Math.abs(coordinates.x * this.game.config.blockSize) > this.game.config.worldSize * this.game.config.blockSize || Math.abs(coordinates.y) > this.game.config.worldSize * this.game.config.blockSize || Math.abs(coordinates.z) > this.game.config.worldSize * this.game.config.blockSize) {
		return true;
	} else { return false; }
}