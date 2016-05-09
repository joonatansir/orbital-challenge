/*
Reaktor Orbital Challenge
by Joonatan Sörensen

http://joonatan.fi/orbital-challenge
*/

window.onload = function() {

	var degToRad = 0.0174532925199433;
	var earthRadius = 6371;
	var kmToUnits = 1.0 / earthRadius;

	function lineOfSight(a, b) {
		var sphere = Math.sqrt(Math.pow(earthRadius + a.altitude, 2) - earthRadius*earthRadius);
	  if(distance(a, b) < sphere)
      return true;
		var v1 = new Vec3(b.x - a.x, b.y - a.y, b.z - a.z); 					//Vector from a to b
	  var v2 = new Vec3(-a.x, -a.y, -a.z); 													//Vector from a to origin
	  var cosAngle = v1.dot(v2)/(v1.length()*v2.length());
	  var angle = Math.acos(cosAngle);															//Angle between v1 and v2
	  var minRadius = (earthRadius + a.altitude) * Math.sin(angle);
	  if(minRadius > earthRadius)
      return true;
	  return false;
	}

	function createGraph(data) {
		var graph = {};
		data.satellites.forEach(function(sat){
      graph[sat.id] = new Array();
      data.satellites.forEach(function(otherSat){
        if(sat.id !== otherSat.id) {
          if(lineOfSight(sat, otherSat)) {
            var d = distance(sat, otherSat);
            graph[sat.id].push({sat: otherSat, cost: d});
          }
        }
      });
	  });
	  return graph
	}

	function findPath(graph, satellites, route) {
	  var startSatellite = findFurthestConnectedSatellite(satellites, route.start.latitude, route.start.longitude);
	  var endSatellite = findFurthestConnectedSatellite(satellites, route.end.latitude, route.end.longitude);
	  
	  console.log("Start: " + startSatellite);
	  console.log("End: " + endSatellite);
	  
	  var openList = [ { id: startSatellite, cost: 0 } ];
	  var costSoFar = {};
	  var parentNode = {};
	  parentNode[startSatellite] = null;
	  costSoFar[startSatellite] = 0;
	  
	  while(openList.length > 0) {
      openList.sort(function(a, b){ return b.cost - a.cost; });
      var current = openList.pop().id;
      if(current === endSatellite)
        break;
      graph[current].forEach(function(edge) {
        var newCost = costSoFar[current] + edge.cost;
        var next = edge.sat;
        if(!costSoFar.hasOwnProperty(next.id) || newCost < costSoFar[next.id]){	
          costSoFar[next.id] = newCost;
          openList.push({ id: next.id, cost: newCost + greatCircleDistance(next, route.end) });
          parentNode[next.id] = current;
        }
      });
	  }
	  
	  console.log("RESULT");
	  var current = endSatellite;
	  var path = [current];
	  while(current !== startSatellite) {
      console.log(current);
      current = parentNode[current];
      path.push(current);
	  }
	  console.log(startSatellite);
	  var s = "";
	  for(var i = path.length - 1; i >= 0; i--) {
      s += path[i] + (i > 0 ? ',' : "");
	  }
	  document.getElementById("result").innerHTML = "RESULT: " + s;
	  return path;
	}

	function greatCircleDistance(a, b) {
		return earthRadius * Math.acos(Math.sin(a.latitude*degToRad)*Math.sin(b.latitude*degToRad) + 
					Math.cos(a.latitude*degToRad)*Math.cos(b.latitude*degToRad)*Math.cos(b.longitude-a.longitude));
	}

	function findFurthestConnectedSatellite(satellites, latitude, longitude) {
		var furthestDistance = 0;
	  var furthestSatellite = "";
	  satellites.forEach(function(sat) {
      var startPosition = CoordinatesToCartesian(0, latitude, longitude);
      if(lineOfSight(sat, startPosition)) {
        var d = distance(sat, startPosition);
        if(d > furthestDistance) {
          furthestDistance = d;
          furthestSatellite = sat.id;
        }
      }
	  });
	  return furthestSatellite;
	}

	function Parse(data) {
		var parsedData = { satellites: [], route: {}};
		data.match(/SAT.*/g).forEach(function(element) {
      e = element.split(',');
      parsedData.satellites.push(new Satellite(e[0], parseFloat(e[1]), parseFloat(e[2]), parseFloat(e[3])));
	  });
	  var route = /ROUTE.*/.exec(data);
	  if(route[0] != -1) {
      e = route[0].split(',');
      parsedData.route = { start: { latitude: parseFloat(e[1]), longitude: parseFloat(e[2])}, end: { latitude: parseFloat(e[3]), longitude: parseFloat(e[4]) } };
	  }
	  return parsedData;
	}

	function Vec3(x, y, z) {
		this.x = x;
	  this.y = y;
	  this.z = z;
	}

	Vec3.prototype.length = function() {
		return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);
	}

	Vec3.prototype.dot = function(v) {
		return this.x*v.x + this.y*v.y + this.z*v.z;
	}

	function Satellite(id, latitude, longitude, altitude) {
	  this.id = id;
	  this.latitude = latitude;
	  this.longitude = longitude;
	  this.altitude = altitude;//1.0 + altitude * earthRadius;
	  var pos = CoordinatesToCartesian(altitude, latitude, longitude);
	  this.x = pos.x;
	  this.y = pos.y;
	  this.z = pos.z;
	}

	function CoordinatesToCartesian(r, polar, azimuth) {
		var x = (r + earthRadius) * Math.cos(polar*degToRad) * Math.sin(azimuth*degToRad);
	  var y = (r + earthRadius) * Math.sin(polar*degToRad);
	  var z = (r + earthRadius) * Math.cos(polar*degToRad) * Math.cos(azimuth*degToRad);
	  return {x: x, y: y, z: z};
	}

	function makeSatellites(satellites, parent) {
		satellites.forEach(function(sat){
      var s = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      s.position.set(sat.x * kmToUnits, sat.y * kmToUnits, sat.z * kmToUnits);
      parent.add(s);
	  });
	}

	var data = Parse(document.getElementById("data").innerHTML);
	console.log(data);

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	//var camera = new THREE.OrthographicCamera( -3, 3, 3, -3, 0.1, 1000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById("visualization").appendChild(renderer.domElement);

	var geometry = new THREE.SphereGeometry( 1.0, 50, 50 );
	var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	camera.position.z = 3;

	var start = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
	var pos = CoordinatesToCartesian(0, data.route.start.latitude, data.route.start.longitude);
	start.position.set(pos.x * kmToUnits, pos.y * kmToUnits, pos.z * kmToUnits);
	cube.add(start);

	var end = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
	var pos = CoordinatesToCartesian(0, data.route.end.latitude, data.route.end.longitude);
	end.position.set(pos.x * kmToUnits, pos.y * kmToUnits, pos.z * kmToUnits);
	cube.add(end);

	makeSatellites(data.satellites, cube);

	var graph = createGraph(data);
	console.log(graph);
	var path = findPath(graph, data.satellites, data.route);

	for(var i = 0; i < path.length - 1; i++) {
		var index = parseInt(path[i].slice(3), 10);
	  var otherIndex = parseInt(path[i+1].slice(3), 10);
	  var geom = new THREE.Geometry();
	  geom.vertices.push(new THREE.Vector3(	data.satellites[index].x * kmToUnits, data.satellites[index].y * kmToUnits, data.satellites[index].z * kmToUnits));
	  geom.vertices.push(new THREE.Vector3(	data.satellites[otherIndex].x * kmToUnits, data.satellites[otherIndex].y * kmToUnits, data.satellites[otherIndex].z * kmToUnits));
	  var line = new THREE.LineSegments(geom);
	  cube.add(line);
	}

	/*for(var i = 0; i < data.satellites.length; i ++) {
		graph[data.satellites[i].id].forEach(function(otherSat) {
		var geom = new THREE.Geometry();
		geom.vertices.push(new THREE.Vector3(	data.satellites[i].x * kmToUnits, data.satellites[i].y * kmToUnits, data.satellites[i].z * kmToUnits));
		geom.vertices.push(new THREE.Vector3(	otherSat.sat.x * kmToUnits, otherSat.sat.y * kmToUnits, otherSat.sat.z * kmToUnits));
		var line = new THREE.LineSegments(geom);
		cube.add(line);
	  });
	};*/

	render();

	function render() {
		cube.rotation.y += 0.005;
		requestAnimationFrame( render );
		renderer.render( scene, camera );
	}

	function distance(satA, satB) {
		return Math.sqrt(Math.pow(satA.x-satB.x, 2)+Math.pow(satA.y-satB.y, 2)+Math.pow(satA.z-satB.z, 2));
	}
}