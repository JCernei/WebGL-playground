"use strict";

class MyCamera {
  constructor() {
    this.translation = [0, 0, 100];
    this.fov = 60;
    this.near = 1;
    this.far = 2000;
    this.ambientColor = [rand(0, 0.3), rand(0, 0.3), rand(0, 0.3)];
  }
}

class MyFigure {
  constructor(vertices, name) {
    this.id = ID++;
    this.name = name;
    this.vertices = vertices;
    this.color = [rand(0, 1), rand(0, 1), rand(0, 1)];
    this.translation = [rand(-100, 100), rand(-50, 50), rand(-150, 50)];
    this.xRotation = rand(-180, 180);
    this.yRotation = rand(-180, 180);
    this.zRotation = rand(-180, 180);
    this.scale = 1;
    this.hasTexture = false;
    this.image = new Image();
    this.texMagic = 2;
  }
}

class MyLight {
  constructor() {
    this.id = ID++;
    this.shininess = 100;
    this.translation = [rand(-100, 100), rand(-100, 100), rand(0, 150)];
    this.diffuseColor = [rand(0, 0.5), rand(0, 0.5), rand(0, 0.5)];
    this.specularColor = [rand(0, 1), rand(0, 1), rand(0, 1)];
  }
}

var fs = [];
var ls = [];
var camera = new MyCamera();
var shapes = {};
var ID = 0;
var currentFigure = -1;
var currentLight = -1;

// UI
var sliderRotateX;
var sliderRotateY;
var sliderRotateZ;
var sliderScale;
var colorFigure;
var sliderMoveX;
var sliderMoveY;
var sliderMoveZ;
var sliderCamX;
var sliderCamY;
var sliderCamZ;
var sliderCamFov;
var sliderCamNear;
var sliderCamFar;
var colorAmbient;
var sliderLightShininess;
var colorDiffuse;
var colorSpecular;


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
    tr += '<td>' + f.name + ' ' + f.id + '</td>'
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
  colorDiffuse.value = rgbToHex(l.diffuseColor);
  colorSpecular.value = rgbToHex(l.specularColor);
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
  colorFigure.value = rgbToHex(f.color);
  sliderMoveX.value = f.translation[0];
  sliderMoveY.value = f.translation[1];
  sliderMoveZ.value = f.translation[2];
}
function addFigure(shape) {
  fs.push(new MyFigure(shapes[shape], shape));
  console.log("ADD " + shape);
  drawFiguresTable()
}
async function addUrlObj() {
  // https://gist.githubusercontent.com/JCernei/0e1831604aecbc121750446559596b04/raw/14ac2e0ff691e1f886b8066295274d2e0a613655/dragon.obj
  // https://webglfundamentals.org/webgl/resources/models/cube/cube.obj
  var url = document.getElementById("urlObj").value;
  if (!(url in shapes)) {
    const response = await fetch(url);
    const text = await response.text();
    var data = parseOBJ(text);
    data.position.numElements = webglUtils.getNumElementsFromNonIndexedArrays(data);
    shapes[url] = data;
    console.log(data);
  }
  var f = new MyFigure(shapes[url], "OBJ");
  // f.texMagic = 3;
  fs.push(f);
  console.log("ADD OBJ");
  drawFiguresTable()
}
async function addFileObj(event) {
  const file = event.target.files[0];
  if (!(file.name in shapes)) {
    const text = await new Response(file).text()
    var data = parseOBJ(text);
    data.position.numElements = webglUtils.getNumElementsFromNonIndexedArrays(data);
    shapes[file.name] = data;
    console.log(data);
  }
  var f = new MyFigure(shapes[file.name], "OBJ");
  fs.push(f);
  console.log("ADD OBJ");
  drawFiguresTable()
}
function deselectFigure() {
  currentFigure = -1;
  currentLight = -1;
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
function changeFigureColor(value) {
  if (currentFigure != -1)
    fs[currentFigure].color = hexToRgb(value);
}
async function addUrlTexture() {
  // https://i.imgur.com/etWLx6y.jpg
  if (currentFigure == -1)
    return;
  var url = document.getElementById("urlTexture").value;
  var image = new Image();
  image.crossOrigin = "";
  image.src = url;
  await image.decode();

  fs[currentFigure].image = image;
  fs[currentFigure].hasTexture = true;
}
async function addFileTexture(event) {
  if (currentFigure == -1)
    return;
  const file = event.target.files[0];
  const blob = await new Response(file).blob()
  var image = new Image();
  image.src = URL.createObjectURL(blob);;
  await image.decode();
  fs[currentFigure].image = image;
  fs[currentFigure].hasTexture = true;
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
function changeAmbientColor(value) {
  camera.ambientColor = hexToRgb(value);
}
function lightShininess(value) {
  if (currentLight != -1)
    ls[currentLight].shininess = parseFloat(value);
}
function changeDiffuseColor(value) {
  if (currentLight != -1)
    ls[currentLight].diffuseColor = hexToRgb(value);
}
function changeSpecularColor(value) {
  if (currentLight != -1)
    ls[currentLight].specularColor = hexToRgb(value);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 256,
    parseInt(result[2], 16) / 256,
    parseInt(result[3], 16) / 256
  ] : null;
}
function rgbToHex(rgb) {
  return "#" + ((1 << 24) + (Math.round(rgb[0] * 256) << 16) + (Math.round(rgb[1] * 256) << 8) + Math.round(rgb[2] * 256)).toString(16).slice(1);
}

function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      var arr = parts.map(parseFloat);
      objTexcoords.push([arr[0], arr[1]]);
    },
    f(parts) {
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return {
    position: new Float32Array(webglVertexData[0]),
    texcoord: new Float32Array(webglVertexData[1]),
    normal: new Float32Array(webglVertexData[2]),
  };
}

async function main() {
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

  shapes["Cube"] = cubeVertices;
  shapes["Sphere"] = sphereVertices;
  shapes["Cone"] = coneVertices;

  console.log("------------------------------------");
  console.log(cubeVertices);
  console.log(sphereVertices);

  ls.push(new MyLight());
  ls.push(new MyLight());
  fs.push(new MyFigure(sphereVertices, "Sphere"));
  fs.push(new MyFigure(cubeVertices, "Cube"));
  fs.push(new MyFigure(coneVertices, "Cone"));
  drawFiguresTable()

  // lookup uniforms
  var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
  var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var shininessLocation = gl.getUniformLocation(program, "u_shininess");
  var shininessLocation2 = gl.getUniformLocation(program, "u_shininess2");
  var lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
  var lightWorldPositionLocation2 = gl.getUniformLocation(program, "u_lightWorldPosition2");
  var viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
  var worldLocation = gl.getUniformLocation(program, "u_world");
  var diffuseColorLocation = gl.getUniformLocation(program, "u_diffuseColor");
  var diffuseColorLocation2 = gl.getUniformLocation(program, "u_diffuseColor2");
  var specularColorLocation = gl.getUniformLocation(program, "u_specularColor");
  var specularColorLocation2 = gl.getUniformLocation(program, "u_specularColor2");
  var ambientColorLocation = gl.getUniformLocation(program, "u_ambientColor");
  var textureLocation = gl.getUniformLocation(program, "u_texture");
  var hasTextureLocation = gl.getUniformLocation(program, "u_hastexture");
  var isSelectedLocation = gl.getUniformLocation(program, "u_isSelected");
  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var normalLocation = gl.getAttribLocation(program, "a_normal");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // Create buffers to put position, normal and texture
  var positionBuffer = gl.createBuffer();
  var normalBuffer = gl.createBuffer();
  var texcoordBuffer = gl.createBuffer();

  // Now that the image has loaded make copy it to the texture.
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

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
  colorFigure = document.getElementById("colorFigure");
  sliderMoveX = document.getElementById("sliderMoveX");
  sliderMoveY = document.getElementById("sliderMoveY");
  sliderMoveZ = document.getElementById("sliderMoveZ");
  sliderCamX = document.getElementById("sliderCamX");
  sliderCamY = document.getElementById("sliderCamY");
  sliderCamZ = document.getElementById("sliderCamZ");
  sliderCamFov = document.getElementById("sliderCamFov");
  sliderCamNear = document.getElementById("sliderCamNear");
  sliderCamFar = document.getElementById("sliderCamFar");
  colorAmbient = document.getElementById("colorAmbient");
  sliderLightShininess = document.getElementById("sliderLightShininess");
  colorDiffuse = document.getElementById("colorDiffuse");
  colorSpecular = document.getElementById("colorSpecular");

  sliderCamX.value = camera.translation[0];
  sliderCamY.value = camera.translation[1];
  sliderCamZ.value = camera.translation[2];
  sliderCamFov.value = camera.fov;
  sliderCamNear.value = camera.near;
  sliderCamFar.value = camera.far;
  colorAmbient.value = rgbToHex(camera.ambientColor);

  // Draw the scene.
  function drawScene() {
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
    gl.uniform3fv(lightWorldPositionLocation2, ls[1].translation);
    // set the camera/view position
    gl.uniform3fv(viewWorldPositionLocation, camera.translation);
    // set the shininess
    gl.uniform1f(shininessLocation, ls[0].shininess);
    gl.uniform1f(shininessLocation2, ls[1].shininess);
    // set the light color
    gl.uniform3fv(diffuseColorLocation, ls[0].diffuseColor);
    gl.uniform3fv(diffuseColorLocation2, ls[1].diffuseColor);
    // set the specular color
    gl.uniform3fv(specularColorLocation, ls[0].specularColor);
    gl.uniform3fv(specularColorLocation2, ls[1].specularColor);
    // set the ambient color
    gl.uniform3fv(ambientColorLocation, camera.ambientColor);

    for (var f of fs) {
      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation);
      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, f.vertices.position, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

      // Turn on the normal attribute
      gl.enableVertexAttribArray(normalLocation);
      // Bind the normal buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, f.vertices.normal, gl.STATIC_DRAW);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

      if (f.hasTexture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, f.image);
      // Turn on the texcoord attribute
      gl.enableVertexAttribArray(texcoordLocation);
      // Bind the texture buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, f.vertices.texcoord, gl.STATIC_DRAW);
      gl.vertexAttribPointer(texcoordLocation, f.texMagic, gl.FLOAT, false, 0, 0);

      // Compute Matrix
      var matrix = m4.translate(m4.identity(),
        f.translation[0],
        f.translation[1],
        f.translation[2]);
      matrix = m4.xRotate(matrix, degToRad(f.xRotation));
      matrix = m4.yRotate(matrix, degToRad(f.yRotation));
      matrix = m4.zRotate(matrix, degToRad(f.zRotation));
      matrix = m4.scale(matrix, f.scale, f.scale, f.scale);

      var worldMatrix = matrix;
      // Set the color to use
      gl.uniform4fv(colorLocation, [...f.color, 1]);
      // Multiply the matrices.
      var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
      var worldInverseMatrix = m4.inverse(worldMatrix);
      var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
      // Set the matrices
      gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
      gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
      gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

      // Tell the shader to use texture unit 0 for u_texture
      gl.uniform1i(textureLocation, 0);
      gl.uniform1i(hasTextureLocation, f.hasTexture);
      gl.uniform1i(isSelectedLocation, currentFigure != -1 && f.id == fs[currentFigure].id);

      gl.drawArrays(gl.TRIANGLES, 0, f.vertices.position.numElements);
    }

    requestAnimationFrame(drawScene);
  }
}

function setGeometry(gl, vertices) {
  gl.bufferData(gl.ARRAY_BUFFER, vertices.position, gl.STATIC_DRAW);
}

function setNormals(gl, vertices) {
  gl.bufferData(gl.ARRAY_BUFFER, vertices.normal, gl.STATIC_DRAW);
}

// Fill the buffer with texture coordinates the F.
function setTexcoords(gl, vertices) {
  gl.bufferData(gl.ARRAY_BUFFER, vertices.texcoord, gl.STATIC_DRAW);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

main();
