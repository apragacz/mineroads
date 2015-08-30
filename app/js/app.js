(function () {
    'use strict';

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
        var mvMatrix = mat4.create();
        var pMatrix = mat4.create();
        //mat4 is from glMatrix library
        //setting projection matrix to perspective with fov=45
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight,
                0.1, 100.0, pMatrix);
        //setting modelview matrix to identity
        mat4.identity(mvMatrix);
        return {
            projectionMatrix: pMatrix,
            modelViewMatrix: mvMatrix
        }
    }

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
    }

    var drawScene = function (gl, shaderProgram, pMatrix, mvMatrix, triangleVertexPositionBuffer) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);

        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                triangleVertexPositionBuffer.itemSize, gl.FLOAT,
                false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false,
                pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false,
                mvMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        gl.drawArrays(gl.TRIANGLES, 0,
                triangleVertexPositionBuffer.numItems);
        console.log('drawing ok');
        console.log(triangleVertexPositionBuffer.numItems);

    }

    var startApp = function () {
        var canvas = document.getElementById('canvas');
        var vertexShaderCode = document.getElementById('shader-vs').innerHTML;
        var fragmentShaderCode = document.getElementById('shader-fs').innerHTML;

        var vertices = [
             0.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];

        var gl = getGLContext(canvas);
        if (!gl) {
            alert('no gl ;(')
            return;
        }
        var glInitData = initGL(gl);
        var pMatrix = glInitData.projectionMatrix;
        var mvMatrix = glInitData.modelViewMatrix;
        var shaderProgram = createShaderProgram(gl, vertexShaderCode, fragmentShaderCode);
        var triangleVertexPositionBuffer = createTriangleVertexPositionBuffer(gl, vertices);
        console.log('data init ok');
        drawScene(gl, shaderProgram, pMatrix, mvMatrix, triangleVertexPositionBuffer);
    };

    this.startApp = startApp;

}).call(this);
