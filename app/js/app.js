/* global mat4, vec3, createVertexBuffer */
(function () {
    'use strict';

    function BBox(lo, hi) {
        this.lo = vec3.create(lo);
        this.hi = vec3.create(hi);
    }

    BBox.prototype.intersectCoord = function (bbox, i) {
        return (bbox.lo[i] < this.hi[i]) && (this.lo[i] < bbox.hi[i]);
    };


    BBox.prototype.intersect = function (bbox) {
        return (this.intersectCoord(bbox, 0)
                    && this.intersectCoord(bbox, 1)
                    && this.intersectCoord(bbox, 2));
    };

    var rot = 0;
    var vecBuf, normalBuf, indexBuf;
    var w1 = 0, w2 = 1, h1 = 0, h2 = 1, d1 = -1, d2 = 0;
    var width = 11;
    var CELL_BLOCK = 1;
    var CELL_BIGGER_BLOCK = 3;
    var CELL_WALL = 4;
    var CELL_WALL_HOLE = 5;

    var three = [
        [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    ];

    var two = [
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    ];

    var twoBig = [
        [0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
    ];

    var twoLeft = [
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    ];

    var twoRight = [
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    ];

    var one = [
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    ];

    var zero = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    var threeToTwo = [
        [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
    ];

    var twoToOne = [
        [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    ];

    var chunkLayerMap = {
        '1z': [].concat(zero, zero),
        '1': [].concat(one, one, one, one, one, one),
        '1t2': [].concat(twoToOne).reverse(),
        '2t1': [].concat(twoToOne),
        '2z': [].concat(zero, zero),
        '2': [].concat(two, two, two, two, two, two),
        '2b': [].concat(two, two, twoBig, two, two),
        '2l': [].concat(twoLeft, twoLeft, twoLeft, twoLeft, twoLeft, twoLeft),
        '2r': [].concat(twoRight, twoRight, twoRight, twoRight, twoRight, twoRight),
        '2t3': [].concat(threeToTwo).reverse(),
        '3t2': [].concat(threeToTwo),
        '3z': [].concat(zero, zero),
        '3': [].concat(three, three, three, three, three, three),
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
            '2b': 1,
        },
        '2b': {
            '2': 1,
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

    var currentState, stateStack;
    var negPos = vec3.create();

    var ACCELERATE = 'accelerate';
    var STOP = 'stop';
    var MOVE_LEFT = 'move-left';
    var MOVE_RIGHT = 'move-right';
    var JUMP = 'jump';
    var REVERSE_TIME = 'reverse-time';

    var controlType = 1;
    var keyMap;
    var MAX_FORWARD_SPEED = 0.3;
    var MAX_TURN_SPEED = 0.5;
    var actions = {};
    keyMap = {
        37: MOVE_LEFT,
        38: ACCELERATE,
        39: MOVE_RIGHT,
        40: STOP,

        32: JUMP,
        //17: JUMP,
        82: REVERSE_TIME,
        //13: FIRE,
    };

    function getDefaultState(level) {
        return {
            level: level,
            engine: 0,
            position: vec3.create([width / 2, 1.5, 0.0]),
            speed: vec3.create([0, 0, 0]),
            ground: true,
            prevGround: true,
            deadCnt: 0,
        };
    }

    function copyState(state) {
        return {
            level: state.level,
            engine: state.engine,
            position: state.position,
            speed: state.speed,
            ground: state.ground,
            prevGround: state.ground,
            deadCnt: state.deadCnt,
        };
    }


    function generateChunkIds(numOfChunks) {
        var chunkIds = [];
        var nextChunkIds;
        var nextChunkId = '1';
        for (var i = 0; i < numOfChunks; i++) {
            chunkIds.push(nextChunkId);
            nextChunkIds = Object.keys(nextChunkIdsMap[nextChunkId] || {});
            nextChunkId = nextChunkIds[(Math.random() * nextChunkIds.length)|0];
        }
        return chunkIds;
    }

    function getChunkBBoxes(chunk) {
        var bboxes = [];
        var layer = chunk.layer;
        var shift = chunk.shift;
        var cell;
        var vb1, vb2;

        for (var i = 0; i < layer.length; i++) {
            for (var j = 0; j < width; j++) {
                cell = layer[i][j];
                if (cell === 0) {
                    continue;
                }

                vb1 = vec3.create([j, 0.0, -i - shift - 1]);
                vb2 = vec3.add(vb1, [1, 1, 1], vec3.create());
                bboxes.push(new BBox(vb1, vb2));

                if (cell === 3) {
                    vb1 = vec3.create([j, 1.0, -i - shift - 1]);
                    vb2 = vec3.add(vb1, [1, 1, 1], vec3.create());
                    bboxes.push(new BBox(vb1, vb2));
                }
            }
        }

        return bboxes;
    }

    function generateLevel(numOfChunks) {
        var chunkIds = generateChunkIds(numOfChunks);
        console.log('chunkIds', chunkIds);
        var chunkLayers = chunkIds.map(function (id) {
            return chunkLayerMap[id];
        });
        var layer;
        var shift = 0;
        var chunk;
        var chunks = [];

        for (var i = 0; i < chunkLayers.length; ++i) {
            layer = chunkLayers[i];
            chunk = {
                layer: layer,
                shift: shift,
            };
            chunk.bboxes = getChunkBBoxes(chunk);
            chunks.push(chunk);
            shift += layer.length;
        }

        console.log('chunks', chunks);

        return {
            chunks: chunks,
        };
    }

    function createVertexBuffer(gl, vertices, itemSize) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
              gl.STATIC_DRAW);
        buffer.itemSize = itemSize;
        buffer.numItems = Math.ceil(vertices.length / itemSize);
        return buffer;
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
        var vertices = []
            .concat(v[0], v[1], v[2], v[3])
            .concat(v[4], v[0], v[3], v[7])
            .concat(v[6], v[5], v[4], v[7])
            .concat(v[4], v[5], v[1], v[0])
            .concat(v[3], v[2], v[6], v[7])
        ;

        var indices = [
            0, 1, 2,
            0, 2, 3,

            4, 5, 6,
            4, 6, 7,

            8, 9, 10,
            8, 10, 11,

            12, 13, 14,
            12, 14, 15,

            16, 17, 18,
            16, 18, 19,
        ];

        var normals = [];

        var v1, v2, v3;
        var cv1 = vec3.create();
        var cv2 = vec3.create();
        var cvr;

        for (var i = 0; i < vertices.length; i += 12) {
            cvr = [0, 0, 0];
            v1 = vertices.slice(i, i + 3);
            v2 = vertices.slice(i + 3, i + 6);
            v3 = vertices.slice(i + 6, i + 9);

            vec3.subtract(v1, v2, cv1);
            vec3.subtract(v3, v2, cv2);
            vec3.cross(cv2, cv1, cvr);
            normals = normals.concat(cvr, cvr, cvr, cvr);
        }

        console.log('vertices', vertices);
        console.log('normals', normals);
        console.log('indices', indices);

        vecBuf = createVertexBuffer(gl, vertices, 3);
        normalBuf = createVertexBuffer(gl, normals, 3);

        indexBuf = gl.createBuffer();
        indexBuf.numItems = indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
                      gl.STATIC_DRAW);

        currentState = getDefaultState(generateLevel(40));
        stateStack = [];
    }

    function drawBlock(gl, shaderProgram, mvMatrix, position) {
        var blockMatrix = mat4.create();
        blockMatrix.set(mvMatrix);
        mat4.translate(blockMatrix, position);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, blockMatrix);
        gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function renderMapChunk(gl ,shaderProgram, pMatrix, mvMatrix, chunk) {
        var translatedMatrix = mat4.create();
        var blockMatrix = mat4.create();
        var oldMVMatrixTranslated = mat4.create();
        var shift = chunk.shift;
        var layer = chunk.layer;
        var cell;

        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);

        if (shaderProgram.vertexNormalAttribute >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                                   normalBuf.itemSize, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vecBuf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                              vecBuf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

        translatedMatrix.set(mvMatrix);
        mat4.translate(translatedMatrix, [0.0, 0.0, -shift]);

        for (var i = 0; i < layer.length; i++) {
            for (var j = 0; j < width; j++) {
                cell = layer[i][j];
                if (cell === 0) {
                    continue;
                }
                drawBlock(gl, shaderProgram, translatedMatrix, [j, 0.0, -i]);

                if (cell === CELL_BIGGER_BLOCK) {
                    drawBlock(gl, shaderProgram, translatedMatrix, [j, 1.0, -i]);
                } else if (cell === CELL_WALL) {
                    drawBlock(gl, shaderProgram, translatedMatrix, [j, 1.0, -i]);
                    drawBlock(gl, shaderProgram, translatedMatrix, [j, 2.0, -i]);
                } else if (cell === CELL_WALL_HOLE) {
                    drawBlock(gl, shaderProgram, translatedMatrix, [j, 2.0, -i]);
                }
            }
        }
    }

    function render(gl, shaderProgram, pMatrix, mvMatrix) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        vec3.negate(currentState.position, negPos);
        mat4.identity(mvMatrix);
        //mat4.rotate(mvMatrix, Math.PI / 9, [1.0, 0.0, 0.0]);
        mat4.translate(mvMatrix, negPos);
        currentState.level.chunks.forEach(function (chunk) {
            renderMapChunk(gl, shaderProgram, pMatrix, mvMatrix, chunk);
        });

    }

    function getIntersectingChunkBBoxes(playerBBox, chunk) {
        return chunk.bboxes.filter(function (bbox) {
            return playerBBox.intersect(bbox);
        });
    }

    function getIntersectingLevelBBoxes(playerBBox, level) {
        var bboxes = [];
        var chunkBBoxes;
        level.chunks.forEach(function (chunk) {
            chunkBBoxes = getIntersectingChunkBBoxes(playerBBox, chunk);
            if (chunkBBoxes.length > 0) {
                bboxes = bboxes.concat(chunkBBoxes);
            }
        });
        return bboxes;
    }

    function getBBox(position) {
        var vb1 = vec3.add(position, [-0.4, -0.5, -0.5], vec3.create());
        var vb2 = vec3.add(position, [0.4, 0.2, 0.5], vec3.create());
        return new BBox(vb1, vb2);
    }

    function updateState(state) {
        var newPosition = vec3.create();
        var newSpeed = vec3.create(state.speed);
        var newPlayerBBox, oldPlayerBBox;
        var bboxes;
        var bbox;
        var i;
        var groundLevelCoord = 1.5;

        if (state.deadCnt > 0) {
            state.deadCnt++;
            return state;
        }

        vec3.add(state.position, state.speed, newPosition);

        oldPlayerBBox = getBBox(state.position);
        newPlayerBBox = getBBox(newPosition);

        bboxes = getIntersectingLevelBBoxes(newPlayerBBox, state.level);

        state.ground = false;

        for (i = 0; i < bboxes.length; ++i) {
            bbox = bboxes[i];

            if (oldPlayerBBox.lo[1] >= bbox.hi[1]
                    && newPlayerBBox.lo[1] < bbox.hi[1]) {
                // TODO: remove hardcoded value
                newPosition[1] = bbox.hi[1] + 0.5;
                newPlayerBBox = getBBox(newPosition);
                bboxes = getIntersectingLevelBBoxes(newPlayerBBox, state.level);
                state.ground = true;
                break;
            }
        }

        for (i = 0; i < bboxes.length; ++i) {
            bbox = bboxes[i];

            if (oldPlayerBBox.lo[2] >= bbox.hi[2]
                    && newPlayerBBox.lo[2] < bbox.hi[2]) {
                // TODO: remove hardcoded value
                newPosition[2] = bbox.hi[2] + 0.5;
                newPlayerBBox = getBBox(newPosition);
                state.deadCnt = 1;
                break;
            }
        }

        if (newPosition[1] === 1.5 && newSpeed[1] < 0) {
            // bump
            newSpeed[1] = -newSpeed[1] * 0.25;
        }

        // gravity
        newSpeed[1] -= 0.0030;

        if (state.ground) {
            // left/right friction
            newSpeed[0] *= 0.5;
        }

        state.position = newPosition;
        state.speed = newSpeed;

        return state;

    }

    function react(state) {
        var speed = vec3.create(state.speed);
        var engine = state.engine;
        var turnEngine = engine * 0.2 + 0.001;

        if (state.deadCnt > 0) {
            return state;
        }

        if (actions[ACCELERATE]) {
            engine += 0.0008;
            if (engine > MAX_FORWARD_SPEED) {
                engine = MAX_FORWARD_SPEED;
            }
        }

        if (actions[STOP]) {
            engine -= 0.01;
            if (engine < 0.0) {
                engine = 0.0;
            }
        }

        speed[2] = -engine;

        if (state.ground || state.prevGround) {

            if (actions[MOVE_LEFT]) {
                vec3.add(speed, [-turnEngine, 0, 0]);
            }
            if (actions[MOVE_RIGHT]) {
                vec3.add(speed, [turnEngine, 0, 0]);
            }
        }

        if (state.ground) {
            if (actions[JUMP]) {
                console.log('jump');
                speed[1] += 0.09;
            }

        }

        state.engine = engine;
        state.speed = speed;
        return state;
    }

    function updateData() {
        if (actions[REVERSE_TIME]) {
            if (stateStack.length >= 2) {
                stateStack.pop();
                currentState = stateStack.pop();
            }
        } else {
            currentState = copyState(currentState);
            react(currentState);
            updateState(currentState);
            stateStack.push(currentState);
            if (stateStack.length > 300) {
                stateStack.shift();
            }
        }
    }

    this.init = init;
    this.render = render;
    this.updateData = updateData;

    window.addEventListener('keyup', function (e) {
        var keyCode = e.which || e.keyCode;
        console.log('keyup', keyCode);
        if (keyMap[keyCode]) {
            actions[keyMap[keyCode]] = false;
        }
    }, false);

    window.addEventListener('keydown', function (e) {
        var keyCode = e.which || e.keyCode;
        console.log('keydown', keyCode);
        if (keyMap[keyCode]) {
            actions[keyMap[keyCode]] = true;
        }
    }, false);

}).call(this);
