"use strict";

class MyCamera {
  constructor() {
    this.translation = [0, 0, 100];
    this.fov = 60;
    this.near = 1;
    this.far = 2000;
  }
}

class MyFigure {
  constructor(shapeType) {
    this.id = ID++;
    this.type = shapeType;
    this.vertices = shapes[shapeType];
    this.uniforms = {
      u_colorMult: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
      u_matrix: m4.identity()
    };
    this.translation = [rand(-100, 100), rand(-50, 50), rand(-150, 50)];
    this.xRotation = rand(-180, 180);
    this.yRotation = rand(-180, 180);
    this.zRotation = rand(-180, 180);
    this.scale = 1;
  }
}

class MyLight {
  constructor() {
    this.id = ID++;
    this.shininess = 100;
    this.translation = [rand(-100, 100), rand(-100, 100), rand(0, 150)];
  }
}

var fs = [];
var ls = [];
var camera = new MyCamera();
var shapes = [];
const CUBE_SHAPE = 0;
const SPHERE_SHAPE = 1;
const CONE_SHAPE = 2;
var shapeNames = {};
shapeNames[CUBE_SHAPE] = "Cube";
shapeNames[SPHERE_SHAPE] = "Sphere";
shapeNames[CONE_SHAPE] = "Cone";
var ID = 0;
var currentFigure = -1;
var currentLight = -1;

// UI
var sliderRotateX;
var sliderRotateY;
var sliderRotateZ;
var sliderScale;
var sliderMoveX;
var sliderMoveY;
var sliderMoveZ;
var sliderCamX;
var sliderCamY;
var sliderCamZ;
var sliderCamFov;
var sliderCamNear;
var sliderCamFar;
var sliderLightShininess;


function drawFiguresTable() {
  var table = document.getElementById("figures");
  table.innerHTML = "";
  var tr = "";
  ls.forEach(l => {
    tr += '<tr onclick="selectLight(this)">';
    tr += '<td>Light ' + l.id + '</td>'
    tr += '</tr>'
  })
  fs.forEach(f => {
    tr += '<tr onclick="selectFigure(this)">';
    tr += '<td>' + shapeNames[f.type] + ' ' + f.id + '</td>'
    tr += '</tr>'
  })
  table.innerHTML += tr;
}

function selectLight(tr) {
  var index = tr.rowIndex;
  currentLight = index;
  currentFigure = -1;
  var l = ls[index];
  console.log(l.id);

  // Refresh sliders
  sliderMoveX.value = l.translation[0];
  sliderMoveY.value = l.translation[1];
  sliderMoveZ.value = l.translation[2];
  sliderLightShininess.value = l.shininess;
}

function selectFigure(tr) {
  var index = tr.rowIndex - ls.length;
  currentFigure = index;
  currentLight = -1;
  var f = fs[index];
  console.log(f.id);

  // Refresh sliders
  sliderRotateX.value = f.xRotation;
  sliderRotateY.value = f.yRotation;
  sliderRotateZ.value = f.zRotation;
  sliderScale.value = f.scale;
  sliderMoveX.value = f.translation[0];
  sliderMoveY.value = f.translation[1];
  sliderMoveZ.value = f.translation[2];
}

function deselectFigure() {
  currentFigure = -1;
  currentLight = -1;
}

function addFigure(shape) {
  fs.push(new MyFigure(parseInt(shape)));
  console.log("ADD " + shape);
  drawFiguresTable()
}

function removeFigure() {
  if (currentFigure == -1) {
    return;
  }
  fs.splice(currentFigure, 1);
  currentFigure = -1;
  console.log("REMOVED " + currentFigure);
  drawFiguresTable()
}

function rotateX(value) {
  if (currentFigure == -1)
    return;
  fs[currentFigure].xRotation = parseFloat(value);
}
function rotateY(value) {
  if (currentFigure == -1)
    return;
  fs[currentFigure].yRotation = parseFloat(value);
}
function rotateZ(value) {
  if (currentFigure == -1)
    return;
  fs[currentFigure].zRotation = parseFloat(value);
}
function scale(value) {
  if (currentFigure == -1)
    return;
  fs[currentFigure].scale = parseFloat(value);
}
function moveX(value) {
  if (currentFigure != -1)
    fs[currentFigure].translation[0] = parseFloat(value);
  if (currentLight != -1)
    ls[currentLight].translation[0] = parseFloat(value);
}
function moveY(value) {
  if (currentFigure != -1)
    fs[currentFigure].translation[1] = parseFloat(value);
  if (currentLight != -1)
    ls[currentLight].translation[1] = parseFloat(value);
}
function moveZ(value) {
  if (currentFigure != -1)
    fs[currentFigure].translation[2] = parseFloat(value);
  if (currentLight != -1)
    ls[currentLight].translation[2] = parseFloat(value);
}
function cameraX(value) {
  camera.translation[0] = parseFloat(value);
}
function cameraY(value) {
  camera.translation[1] = parseFloat(value);
}
function cameraZ(value) {
  camera.translation[2] = parseFloat(value);
}
function cameraFov(value) {
  camera.fov = parseFloat(value);
}
function cameraNear(value) {
  camera.near = parseFloat(value);
}
function cameraFar(value) {
  camera.far = parseFloat(value);
}
function lightShininess(value) {
  if (currentLight != -1)
    ls[currentLight].shininess = parseFloat(value);
}

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
  var program = programInfo.program;

  //------------------------------------------------- 
  var cubeVertices = primitives.createCubeVertices(20);
  cubeVertices = primitives.deindexVertices(cubeVertices);
  cubeVertices = primitives.makeRandomVertexColors(cubeVertices, {
    vertsPerColor: 6,
    rand: function (ndx, channel) {
      return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
    },
  });

  var coneVertices = primitives.createTruncatedConeVertices(10, 0, 20, 12, 1, true, false);
  coneVertices = primitives.deindexVertices(coneVertices);
  coneVertices = primitives.makeRandomVertexColors(coneVertices, {
    vertsPerColor: 6,
    rand: function (ndx, channel) {
      return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
    },
  });

  var sphereVertices = primitives.createSphereVertices(20, 20, 20);
  sphereVertices = primitives.deindexVertices(sphereVertices);
  sphereVertices = primitives.makeRandomVertexColors(sphereVertices, {
    vertsPerColor: 6,
    rand: function (ndx, channel) {
      return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
    },
  });

  shapes = [
    cubeVertices,
    sphereVertices,
    coneVertices,
  ];

  ls.push(new MyLight());
  fs.push(new MyFigure(SPHERE_SHAPE));
  fs.push(new MyFigure(CUBE_SHAPE));
  fs.push(new MyFigure(CONE_SHAPE));
  drawFiguresTable()

  // lookup uniforms
  var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
  var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var shininessLocation = gl.getUniformLocation(program, "u_shininess");
  var lightWorldPositionLocation =
    gl.getUniformLocation(program, "u_lightWorldPosition");
  var viewWorldPositionLocation =
    gl.getUniformLocation(program, "u_viewWorldPosition");
  var worldLocation =
    gl.getUniformLocation(program, "u_world");
  var lightColorLocation =
    gl.getUniformLocation(program, "u_lightColor");
  var specularColorLocation =
    gl.getUniformLocation(program, "u_specularColor");

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var normalLocation = gl.getAttribLocation(program, "a_normal");

  // Create buffers to put positions and normals in
  var positionBuffer = gl.createBuffer();
  var normalBuffer = gl.createBuffer();

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  requestAnimationFrame(drawScene);

  // Setup a ui.
  sliderRotateX = document.getElementById("sliderRotateX");
  sliderRotateY = document.getElementById("sliderRotateY");
  sliderRotateZ = document.getElementById("sliderRotateZ");
  sliderScale = document.getElementById("sliderScale");
  sliderMoveX = document.getElementById("sliderMoveX");
  sliderMoveY = document.getElementById("sliderMoveY");
  sliderMoveZ = document.getElementById("sliderMoveZ");
  sliderCamX = document.getElementById("sliderCamX");
  sliderCamY = document.getElementById("sliderCamY");
  sliderCamZ = document.getElementById("sliderCamZ");
  sliderCamFov = document.getElementById("sliderCamFov");
  sliderCamNear = document.getElementById("sliderCamNear");
  sliderCamFar = document.getElementById("sliderCamFar");
  sliderLightShininess = document.getElementById("sliderLightShininess");

  sliderCamX.value = camera.translation[0];
  sliderCamY.value = camera.translation[1];
  sliderCamZ.value = camera.translation[2];
  sliderCamFov.value = camera.fov;
  sliderCamNear.value = camera.near;
  sliderCamFar.value = camera.far;

  // Draw the scene.
  function drawScene(time) {
    time *= 0.0005;
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);
    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(degToRad(camera.fov), aspect, camera.near, camera.far);
    // Compute the camera's matrix
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera.translation, target, up);
    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);
    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // set the light position
    gl.uniform3fv(lightWorldPositionLocation, ls[0].translation);
    // set the camera/view position
    gl.uniform3fv(viewWorldPositionLocation, camera.translation);
    // set the shininess
    gl.uniform1f(shininessLocation, ls[0].shininess);
    // set the light color
    gl.uniform3fv(lightColorLocation, m4.normalize([1, 1, 1]));  // red light
    // set the specular color
    gl.uniform3fv(specularColorLocation, m4.normalize([0.2, 0.2, 1]));  // red light

    for (var f of fs) {
      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation);
      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      setGeometry(gl, f.vertices);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

      // Turn on the normal attribute
      gl.enableVertexAttribArray(normalLocation);
      // Bind the normal buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      setNormals(gl, f.vertices);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

      // Compute Matrix
      var matrix = m4.translate(m4.identity(),
        f.translation[0],
        f.translation[1],
        f.translation[2]);
      matrix = m4.xRotate(matrix, degToRad(f.xRotation));
      matrix = m4.yRotate(matrix, degToRad(f.yRotation));
      matrix = m4.zRotate(matrix, degToRad(f.zRotation));
      matrix = m4.scale(matrix, f.scale, f.scale, f.scale);
      f.uniforms.u_matrix = matrix;

      var worldMatrix = f.uniforms.u_matrix;
      // Set the color to use
      var fColor = [...f.uniforms.u_colorMult];
      if (currentFigure != -1 && f.id == fs[currentFigure].id)
        fColor[3] = 0.5;
      gl.uniform4fv(colorLocation, fColor);
      // Multiply the matrices.
      var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
      var worldInverseMatrix = m4.inverse(worldMatrix);
      var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
      // Set the matrices
      gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
      gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
      gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

      gl.drawArrays(gl.TRIANGLES, 0, f.vertices.position.numElements);
    }

    requestAnimationFrame(drawScene);
  }
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl, gVertices) {
  gl.bufferData(gl.ARRAY_BUFFER, gVertices.position, gl.STATIC_DRAW);
}

function setNormals(gl, nVertices) {
  gl.bufferData(gl.ARRAY_BUFFER, nVertices.normal, gl.STATIC_DRAW);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

main();
