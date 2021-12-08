"use strict";

class MyFigure {
  constructor(vertices, uniforms, translation, xRotation, yRotation, zRotation) {
    this.vertices = vertices;
    this.uniforms = uniforms;
    this.translation = translation;
    this.xRotation = xRotation;
    this.yRotation = yRotation;
    this.zRotation = zRotation;
  }
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
  const CUBE_SHAPE = 0;
  const CONE_SHAPE = 1;
  const SPHERE_SHAPE = 2;

  var cubeVertices = primitives.createCubeVertices(40);
  cubeVertices = primitives.deindexVertices(cubeVertices);
  cubeVertices = primitives.makeRandomVertexColors(cubeVertices, {
    vertsPerColor: 6,
    rand: function (ndx, channel) {
      return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
    },
  });

  var coneVertices = primitives.createTruncatedConeVertices(20, 0, 40, 12, 1, true, false);
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

  var shapes = [
    cubeVertices,
    coneVertices,
    sphereVertices,
  ];

  var fs = [
    new MyFigure(shapes[SPHERE_SHAPE], { u_colorMult: [0.2, 1, 0.2, 1], u_matrix: m4.identity() },
      [70, 0, 0],
      rand(0.8, 1.2),
      rand(0.8, 1.2),
      rand(0.8, 1.2)
    ),
    new MyFigure(shapes[CUBE_SHAPE], { u_colorMult: [1, 0.2, 0.2, 1], u_matrix: m4.identity() },
      [0, 0, 0],
      rand(0.8, 1.2),
      rand(0.8, 1.2),
      rand(0.8, 1.2)
    ),
    new MyFigure(shapes[CONE_SHAPE], { u_colorMult: [0.2, 0.2, 1, 1], u_matrix: m4.identity() },
      [-70, 0, 0],
      rand(0.8, 1.2),
      rand(0.8, 1.2),
      rand(0.8, 1.2)
    ),
  ]

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
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put geometry data into buffer
  // setGeometry(gl, f.vertices);


  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
  // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  // Put normals data into buffer
  // setNormals(gl, f.vertices);


  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var fRotationRadians = 0;
  var shininess = 150;

  requestAnimationFrame(drawScene);

  // Setup a ui.
  webglLessonsUI.setupSlider("#fRotation", { value: radToDeg(fRotationRadians), slide: updateRotation, min: -360, max: 360 });
  webglLessonsUI.setupSlider("#shininess", { value: shininess, slide: updateShininess, min: 1, max: 300 });

  function updateRotation(event, ui) {
    fRotationRadians = degToRad(ui.value);
    // drawScene();
  }

  function updateShininess(event, ui) {
    shininess = ui.value;
    // drawScene();
  }
  console.log(fs)

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
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    // Compute the camera's matrix
    var camera = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera, target, up);
    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);
    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // set the light position
    gl.uniform3fv(lightWorldPositionLocation, [0, 0, 100]);
    // set the camera/view position
    gl.uniform3fv(viewWorldPositionLocation, camera);
    // set the shininess
    gl.uniform1f(shininessLocation, shininess);
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

      // Draw
      var matrix = m4.translate(m4.identity(),
        f.translation[0],
        f.translation[1],
        f.translation[2]);
      matrix = m4.xRotate(matrix, f.xRotation + time);
      matrix = m4.yRotate(matrix, f.yRotation + time);
      matrix = m4.zRotate(matrix, f.zRotation + time);
      f.uniforms.u_matrix = matrix;

      var worldMatrix = f.uniforms.u_matrix; //m4.yRotation(fRotationRadians * time);
      // Set the color to use
      gl.uniform4fv(colorLocation, f.uniforms.u_colorMult);
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
