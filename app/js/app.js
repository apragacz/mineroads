(function () {
    'use strict';

    var rot = 0;
    var vecBuf;
    var w = 4, h = 1;

    function init(gl, shaderProgram) {
        var v = [
            [ w,  0,  w],
            [ w,  0, -w],
            [-w,  0, -w],
            [-w,  0,  w],
            [ w, -h,  w],
            [ w, -h, -w],
            [-w, -h, -w],
            [-w, -h,  w],
        ];
        var data = []
            .concat(v[0], v[1], v[2])
            .concat(v[0], v[2], v[3])

            .concat(v[4], v[0], v[3])
            .concat(v[4], v[3], v[7])

            .concat(v[6], v[5], v[4])
            .concat(v[7], v[6], v[4])

            .concat(v[4], v[5], v[1])
            .concat(v[4], v[1], v[0])

            .concat(v[3], v[2], v[6])
            .concat(v[3], v[6], v[7])
        ;

        vecBuf = createVertexBuffer(gl, data);
    }

    var three = [
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
    ];

    var two = [
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
    ];

    var twoLeft = [
        [0, 0, 1, 0, 0, 0, 0, 0, 0],
    ];

    var twoRight = [
        [0, 0, 0, 0, 0, 0, 1, 0, 0],
    ];

    var one = [
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
    ];

    var zero = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    var threeToTwo = [
        [1, 1, 0, 1, 1, 1, 0, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 1, 1, 0, 1, 1, 1, 0],
    ];

    var twoToOne = [
        [0, 0, 1, 1, 0, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 0, 0],
    ];


    function renderMapChunk(gl ,shaderProgram, pMatrix, mvMatrix) {

    }

    function render(gl, shaderProgram, pMatrix, mvMatrix) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, [0.0, -0.5, -10.0]);
        mat4.rotate(mvMatrix, rot, [0.0, 1.0, 0.0]);

        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                vecBuf.itemSize, gl.FLOAT,
                false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, vecBuf);
        gl.drawArrays(gl.TRIANGLES, 0, vecBuf.numItems);
    }

    function updateData() {
        rot += 0.01;
    }

    this.init = init;
    this.render = render;
    this.updateData = updateData;

}).call(this);
