/* global mat4, createVertexBuffer */
(function () {
    'use strict';

    var rot = 0;
    var vecBuf;
    var w = 0.5, h = 1;

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

    var width = 9;

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

    var chunksMap = {
        '0': [[].concat(zero, zero)],
        '1': [[].concat(one, one, one, one, one, one)],
        '1t2': [[].concat(twoToOne).reverse()],
        '2t1': [[].concat(twoToOne)],
        '2': [[].concat(two, two, two, two, two, two)],
        '2l': [[].concat(twoLeft, twoLeft, twoLeft, twoLeft, twoLeft, twoLeft)],
        '2r': [[].concat(twoRight, twoRight, twoRight, twoRight, twoRight, twoRight)],
        '2t3': [[].concat(threeToTwo).reverse()],
        '3t2': [[].concat(threeToTwo)],
        '3': [[].concat(three, three, three, three, three, three)],
    };

    var nextChunkIdsMap = {
        '0': {
            '1': 1,
        },
        '1': {
            '1': 1,
            '0': 1,
        },
    };

    function generateLevel(numOfChunks) {

        var levelChunks = [];

        var nextChunkId = '1';
        var chunkIds = [];
        for (var i = 0; i < numOfChunks; i++) {
            levelChunks.push(chunksMap[nextChunkId]);
            chunkIds = Object.keys(nextChunkIdsMap[nextChunkId] || {});
            nextChunkId = chunkIds[(Math.random() * chunkIds.length)|0];
        }

        return {
            chunks: levelChunks,
        };
    }

    function renderMapChunk(gl ,shaderProgram, pMatrix, mvMatrix, chunk) {
        var oldMVMatrix = mat4.create();
        var layer = chunk[0];
        var cell;

        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                vecBuf.itemSize, gl.FLOAT,
                false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, vecBuf);
        var widthHalf = (width / 2)|0;

        for (var i = 0; i < layer.length; i++) {
            for (var j = 0; j < width; j++) {
                cell = layer[i][j];
                if (cell === 0) {
                    continue;
                }
                oldMVMatrix.set(mvMatrix);
                mat4.translate(mvMatrix, [j - widthHalf, 0.0, -i]);
                gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
                gl.drawArrays(gl.TRIANGLES, 0, vecBuf.numItems);
                mvMatrix.set(oldMVMatrix);
            }
        }

    }

    function render(gl, shaderProgram, pMatrix, mvMatrix) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, [0.0, -0.5, -10.0]);
        mat4.rotate(mvMatrix, rot, [0.0, 1.0, 0.0]);

        renderMapChunk(gl ,shaderProgram, pMatrix, mvMatrix, chunksMap['2t3']);
    }

    function updateData() {
        rot += 0.01;
    }

    this.init = init;
    this.render = render;
    this.updateData = updateData;

}).call(this);
