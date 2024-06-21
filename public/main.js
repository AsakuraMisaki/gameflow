import 'pixi-spine' // Do this once at the very start of your code. This registers the loader!

import * as PIXI from 'pixijs';

import {Spine} from 'pixi-spine';

// es5 class fix
PIXI.utils.es5New = function (_class, context, ...args) {
    const _proto_ = new _class(...args);
    Object.assign(context, _proto_);
};

// PIXI.Renderer.registerPlugin
PIXI.Renderer.registerPlugin = function (pluginName, ctor) {
    Renderer.__plugins[pluginName] = ctor;
};

console.warn(PIXI);



const app = new PIXI.Application({ resizeTo: window });

document.body.appendChild(app.view);

const geometry = new PIXI.Geometry()
    .addAttribute(
        'aVertexPosition', // the attribute name
        [
            -100,
            -100, // x, y
            100,
            -100, // x, y
            100,
            100,
            -100,
            100,
        ], // x, y
        2,
    ) // the size of the attribute
    .addAttribute(
        'aUvs', // the attribute name
        [
            0,
            0, // u, v
            1,
            0, // u, v
            1,
            1,
            0,
            1,
        ], // u, v
        2,
    ) // the size of the attribute
    .addIndex([0, 1, 2, 0, 2, 3]);

const vertexSrc = `

    precision mediump float;

    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 vUvs;

    void main() {

        vUvs = aUvs;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    }`;

const fragmentSrc = `

    precision mediump float;

    varying vec2 vUvs;

    uniform sampler2D uSampler2;
    uniform float time;

    void main() {

        gl_FragColor = texture2D(uSampler2, vUvs + sin( (time + (vUvs.x) * 14.) ) * 0.1 );
    }`;

const uniforms = {
    uSampler2: PIXI.Texture.from('https://pixijs.com/assets/bg_scene_rotate.jpg'),
    time: 0,
};

const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);

const quad = new PIXI.Mesh(geometry, shader);

quad.position.set(400, 300);
quad.scale.set(2);

app.stage.addChild(quad);

// start the animation..
// requestAnimationFrame(animate);

app.ticker.add((delta) => {
    quad.rotation += 0.01;
    quad.shader.uniforms.time += 0.1;
});

export default PIXI;
