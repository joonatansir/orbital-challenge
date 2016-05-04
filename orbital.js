/*
Reaktor Orbital Challenge
by Joonatan Sörensen

http://joonatan.fi
*/

var degToRad = 0.0174532925199433;
var earthRadius = 6371;
var kmToUnits = 1.0 / earthRadius;

function createGraph(data) {
	var graph = {};
	data.satellites.forEach(function(sat){
  	graph[sat.id] = new Array();
  	data.satellites.forEach(function(otherSat){
    	if(sat.id !== otherSat.id) {
      	var dist = distance(sat, otherSat);
      	var x = Math.sqrt(Math.pow(earthRadius + sat.altitude, 2) - Math.pow(dist/2.0, 2));
        if(x > earthRadius) {
        	graph[sat.id].push({sat: otherSat, cost: dist});
        }
      }
    });
  });
  return graph
}

function findPath(satellites, route) {

}

function Parse(data) {
	var parsedData = { satellites: [], route: {}};
	data.match(/SAT.*/g).forEach(function(element) {
  	e = element.split(',');
    parsedData.satellites.push(new Satellite(parseInt(e[0].slice(3), 10), parseFloat(e[1]), parseFloat(e[2]), parseFloat(e[3])));
  });
  var route = /ROUTE.*/.exec(data);
  if(route[0] != -1) {
  	e = route[0].split(',');
  	parsedData.route = { startLatitude: parseFloat(e[1]), startLongitude: parseFloat(e[2]), endLatitude: parseFloat(e[3]), endLongitude: parseFloat(e[4]) };
  }
  return parsedData;
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
var pos = CoordinatesToCartesian(0, data.route.startLatitude, data.route.startLongitude);
start.position.set(pos.x * kmToUnits, pos.y * kmToUnits, pos.z * kmToUnits);
cube.add(start);

var end = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
var pos = CoordinatesToCartesian(0, data.route.endLatitude, data.route.endLongitude);
end.position.set(pos.x * kmToUnits, pos.y * kmToUnits, pos.z * kmToUnits);
cube.add(end);

makeSatellites(data.satellites, cube);

var graph = createGraph(data);
console.log(graph);
var path = findPath(graph);

for(var i = 0; i < data.satellites.length; i ++) {
	graph[i].forEach(function(otherSat) {
  	var geom = new THREE.Geometry();
    geom.vertices.push(new THREE.Vector3(	data.satellites[i].x * kmToUnits, data.satellites[i].y * kmToUnits, data.satellites[i].z * kmToUnits));
  	geom.vertices.push(new THREE.Vector3(	otherSat.sat.x * kmToUnits, otherSat.sat.y * kmToUnits, otherSat.sat.z * kmToUnits));
    var line = new THREE.LineSegments(geom);
    cube.add(line);
  });
};

render();

function render() {
	cube.rotation.y += 0.005;
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}

var a = {x: 10, y: 0, z: 0};
var b = {x: 5, y: -10, z: 0};
console.log(distance(a, b));

function distance(satA, satB) {
	return Math.sqrt(Math.pow(satA.x-satB.x, 2)+Math.pow(satA.y-satB.y, 2)+Math.pow(satA.z-satB.z, 2));
}





