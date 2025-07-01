"use strict";

// TODO: replay feature
// TODO: random game size (nb bolts and nb nuts per bolt)
// TODO: add background

import * as THREE from 'three';

import * as GAME from './nutgame';
import * as GAMERENDERER from './nutgamerenderer';

var game = new GAME.NutGame(5, 4);
game.randomFillBolts();

const scene = new THREE.Scene();
// TODO: automatic camera positioning
// TODO: adjust fov to get all bolts on the same level
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); // TODO: handle window resizing (particulary for mobile)
document.body.appendChild( renderer.domElement );

const game_renderer = new GAMERENDERER.NutGameRenderer(game, scene);

camera.position.z = 15;
camera.position.y = 5;

const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.z = 20;

scene.add(light);

const l = new THREE.AmbientLight(0x454545);
scene.add(l);


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let movement = [];
window.addEventListener('click', onMouseClick, false); // somehow slow on mobile

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let bbox = game_renderer.getBbox();

    for (let b of bbox) {

        if (raycaster.ray.intersectsBox(b.bbox)) {
            game.click(b.bolt_position); // TODO: this must be able to fail. currently playing to fast might break the animation (and the game)
        }
    }
}

function animate() {
    game_renderer.render();

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
