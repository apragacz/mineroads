(function () {
    'use strict';

    var root = this;

    var getGLContext = function (canvas) {
        var gl = null;
        try {
            gl = canvas.getContext('experimental-webgl');
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        return gl;
    };


    var initGL = function (gl) {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        var mvMatrix = mat4.create();
        var pMatrix = mat4.create();
        //mat4 is from glMatrix library
        //setting projection matrix to perspective with fov=45
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight,
                0.1, 1000.0, pMatrix);
        //setting modelview matrix to identity
        mat4.identity(mvMatrix);
        return {
            projectionMatrix: pMatrix,
            modelViewMatrix: mvMatrix
        };
    };

    var createShaderProgram = function (gl, vertexShaderCode, fragmentShaderCode) {
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderCode);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(fragmentShader));
        }

        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderCode);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(vertexShader));
        }


        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute =
            gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        shaderProgram.pMatrixUniform =
            gl.getUniformLocation(shaderProgram, 'uPMatrix');
        shaderProgram.mvMatrixUniform =
            gl.getUniformLocation(shaderProgram, 'uMVMatrix');

        return shaderProgram;
    };

    var createTriangleVertexPositionBuffer = function (gl, vertices) {
        var triangleVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
              gl.STATIC_DRAW);
        triangleVertexPositionBuffer.itemSize = 3;
        triangleVertexPositionBuffer.numItems = Math.ceil(vertices.length / 3);
        return triangleVertexPositionBuffer;
    };

    var startApp = function (initRenderingCallback, renderCallback, updateDataCallback) {
        var canvas = document.getElementById('canvas');
        var vertexShaderCode = document.getElementById('shader-vs').innerHTML;
        var fragmentShaderCode = document.getElementById('shader-fs').innerHTML;
        var gl = getGLContext(canvas);

        if (!gl) {
            alert('no gl ;(');
            return;
        }
        var glInitData = initGL(gl);
        var pMatrix = glInitData.projectionMatrix;
        var mvMatrix = glInitData.modelViewMatrix;
        var shaderProgram = createShaderProgram(gl, vertexShaderCode, fragmentShaderCode);
        initRenderingCallback(gl, shaderProgram, pMatrix, mvMatrix);
        console.log('gl init ok');

        function asyncAnimLoop() {
            root.requestAnimationFrame(asyncAnimLoop);
            renderCallback(gl, shaderProgram, pMatrix, mvMatrix);
        }

        asyncAnimLoop();
        setInterval(updateDataCallback, 16);
    };

    root.startApp = startApp;
    root.createVertexBuffer = createTriangleVertexPositionBuffer;

}).call(this);
