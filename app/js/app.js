(function () {
    'use strict';

    var rot = 0;

    var triangleVecBuf;

    function init(gl, shaderProgram) {
        var vertices = [
             0.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        triangleVecBuf = createVertexBuffer(gl, vertices);
    }

    function render(gl, shaderProgram, pMatrix, mvMatrix) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);
        mat4.rotate(mvMatrix, rot, [0.0, 1.0, 0.0]);

        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                triangleVecBuf.itemSize, gl.FLOAT,
                false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVecBuf);
        gl.drawArrays(gl.TRIANGLES, 0, triangleVecBuf.numItems);
    }

    function updateData() {
        rot += 0.01;
    }

    this.init = init;
    this.render = render;
    this.updateData = updateData;

}).call(this);
