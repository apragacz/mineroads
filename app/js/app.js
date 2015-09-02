/* global mat4, vec3, createVertexBuffer */
(function () {
    'use strict';

    var rot = 0;
    var vecBuf;
    var w1 = 0, w2 = 1, h1 = 0, h2 = 1, d1 = -1, d2 = 0;
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
        '1z': [[].concat(zero, zero)],
        '1': [[].concat(one, one, one, one, one, one)],
        '1t2': [[].concat(twoToOne).reverse()],
        '2t1': [[].concat(twoToOne)],
        '2z': [[].concat(zero, zero)],
        '2': [[].concat(two, two, two, two, two, two)],
        '2l': [[].concat(twoLeft, twoLeft, twoLeft, twoLeft, twoLeft, twoLeft)],
        '2r': [[].concat(twoRight, twoRight, twoRight, twoRight, twoRight, twoRight)],
        '2t3': [[].concat(threeToTwo).reverse()],
        '3t2': [[].concat(threeToTwo)],
        '3z': [[].concat(zero, zero)],
        '3': [[].concat(three, three, three, three, three, three)],
    };

    var nextChunkIdsMap = {
        '1z': {
            '1': 1,
        },
        '1': {
            '1': 1,
            '1z': 1,
            '1t2': 1,
        },
        '1t2': {
            '2': 1,
        },
        '2z': {
            '2': 1,
        },
        '2t1': {
            '1': 1,
        },
        '2': {
            '2z': 1,
            '2t1': 1,
            '2t3': 1,
            '2': 1,
            '2l': 1 ,
            '2r': 1,
        },
        '2l': {
            '2': 1,
        },
        '2r': {
            '2': 1,
        },
        '2t3': {
            '3': 1,
        },
        '3z': {
            '3': 1,
        },
        '3t2': {
            '2': 1,
        },
        '3': {
            '3z': 1,
            '3t2': 1,
            '3': 1,
        }
    };

    var state;
    var negPos = vec3.create();

    var ACCELERATE = 'accelerate';
    var STOP = 'stop';
    var MOVE_LEFT = 'move-left';
    var MOVE_RIGHT = 'move-right';
    var JUMP = 'jump';

    var controlType = 1;
    var keyMap;
    var actions = {};
    keyMap = {
        37: MOVE_LEFT,
        38: ACCELERATE,
        39: MOVE_RIGHT,
        40: STOP,

        17: JUMP,
        //13: FIRE,
    };

    function getDefaultState(level) {
        return {
            level: level,
            position: vec3.create([width / 2, 30.5, 0.0]),
            speed: vec3.create([0, 0, -0.01]),
        };
    }

    function copyState(state) {
        return {
            level: state.level,
            position: vec3.create(state.position),
            speed: vec3.create(state.speed),
        };
    }

    function updateState(state) {
        vec3.add(state.position, state.speed, state.position);
    }

    function generateChunkIds(numOfChunks) {
        var chunkIds = [];
        var nextChunkIds;
        var nextChunkId = '1';
        var chunkIds = [];
        for (var i = 0; i < numOfChunks; i++) {
            chunkIds.push(nextChunkId);
            nextChunkIds = Object.keys(nextChunkIdsMap[nextChunkId] || {});
            nextChunkId = nextChunkIds[(Math.random() * nextChunkIds.length)|0];
        }
        return chunkIds;
    }

    function generateLevel(numOfChunks) {
        console.log('numOfChunks', numOfChunks);
        var chunkIds = generateChunkIds(numOfChunks);
        console.log('chunkIds', chunkIds);
        var chunks = chunkIds.map(function (id) {return chunksMap[id];});

        return {
            chunks: chunks,
        };
    }

    function init(gl, shaderProgram) {
        var v = [
            [w2, h2, d2],
            [w2, h2, d1],
            [w1, h2, d1],
            [w1, h2, d2],
            [w2, h1, d2],
            [w2, h1, d1],
            [w1, h1, d1],
            [w1, h1, d2],
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

        state = getDefaultState(generateLevel(40));
    }

    function renderMapChunk(gl ,shaderProgram, pMatrix, mvMatrix, chunk, shift) {
        var translatedMatrix = mat4.create();
        var blockMatrix = mat4.create();
        var oldMVMatrixTranslated = mat4.create();
        var layer = chunk[0];
        var cell;

        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                vecBuf.itemSize, gl.FLOAT,
                false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, vecBuf);

        translatedMatrix.set(mvMatrix);
        mat4.translate(translatedMatrix, [0.0, 0.0, -shift]);

        for (var i = 0; i < layer.length; i++) {
            for (var j = 0; j < width; j++) {
                cell = layer[i][j];
                if (cell === 0) {
                    continue;
                }
                blockMatrix.set(translatedMatrix);
                mat4.translate(blockMatrix, [j, 0.0, -i]);
                gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, blockMatrix);
                gl.drawArrays(gl.TRIANGLES, 0, vecBuf.numItems);
            }
        }

    }

    var firstRender = true;

    function render(gl, shaderProgram, pMatrix, mvMatrix) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        vec3.negate(state.position, negPos);
        mat4.identity(mvMatrix);
        mat4.rotate(mvMatrix, Math.PI / 2, [1.0, 0.0, 0.0]);
        mat4.translate(mvMatrix, negPos);
        var chunks = state.level.chunks;
        var shift = 0;
        var shifts = [];
        for (var i = 0; i < chunks.length; i++) {
            renderMapChunk(gl, shaderProgram, pMatrix, mvMatrix,
                           chunks[i], shift);
            shifts.push(shift);
            shift += chunks[i][0].length;
        }
        firstRender = false;
    }

    function updateData() {
        if (actions[ACCELERATE]) {
            //TODO:
        }
        updateState(state);
    }

    this.init = init;
    this.render = render;
    this.updateData = updateData;

    window.addEventListener('keyup', function (e) {
        var keyCode = e.which || e.keyCode;
        if (keyMap[keyCode]) {
            actions[keyMap[keyCode]] = false;
        }
    }, false);

    window.addEventListener('keydown', function (e) {
        var keyCode = e.which || e.keyCode;
        if (keyMap[keyCode]) {
            actions[keyMap[keyCode]] = true;
        }
    }, false);

}).call(this);
