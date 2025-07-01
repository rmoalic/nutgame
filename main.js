"use strict";
import * as THREE from 'three';

import * as GAME from './nutgame';
import * as GAMERENDERER from './nutgamerenderer';

var game = new GAME.NutGame(3, 5);
game.randomFillBolts();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const game_renderer = new GAMERENDERER.NutGameRenderer(game, scene);

camera.position.z = 15;
//const light = new THREE.SpotLight( 0xffffff )
const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.z = 4;

scene.add(light);


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let movement = [];
window.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let bbox = game_renderer.getBbox();

    for (let b of bbox) {

        if (raycaster.ray.intersectsBox(b.bbox)) {
            game.click(b.bolt_position);
        }
    }
}

function animate() {
    game_renderer.render();

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
