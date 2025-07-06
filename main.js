// TODO: random game size (nb bolts and nb nuts per bolt)

import * as THREE from 'three';

import * as GAME from './nutgame';
import * as GAMERENDERER from './nutgamerenderer';

var game = new GAME.NutGame(5, 4);
game.randomFillBolts();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); // TODO: handle window resizing (particulary for mobile)
document.body.appendChild( renderer.domElement );

var game_renderer = new GAMERENDERER.NutGameRenderer(game, scene);

function g_positionCamera() {
    positionCamera(camera, game_renderer.getBbox(), new THREE.Vector3(0, 0.1, 1.2));
}
g_positionCamera();

const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.z = 20;

scene.add(light);

const l = new THREE.AmbientLight(0x454545);
scene.add(l);


// ---------------

const material_back = new THREE.ShaderMaterial( {

    uniforms: {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2() }
    },

    vertexShader:
    `
varying vec3 fragCoord;
void main() {
    vec4 c = modelMatrix * vec4(position, 1.0);
    fragCoord = c.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
    fragmentShader:
    `
uniform vec2 resolution;
uniform float offset;
uniform float time;
varying vec3 fragCoord;

void main()
{
    float h = normalize(fragCoord + offset).y;

    float colorShift = cos(time / 10000.0);

    vec3 color2 = vec3(0.64, 0.36, 0.02);
    vec3 fogColor2 = clamp(color2 + colorShift, 0.5, 0.8);
    vec3 fogColor1 = vec3(0.96, 0.61, 0.18);
    vec3 col = mix(fogColor1, fogColor2, h);

    gl_FragColor = vec4(col, 1.0);
}
`
} );

const geometry_back = new THREE.PlaneGeometry(500, 500); // TODO: adjust size and angle for camera
const plane_back = new THREE.Mesh(geometry_back, material_back);
plane_back.position.z = -10;
scene.add(plane_back);

// ---------------



const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onMouseClick, false); // somehow slow on mobile
window.addEventListener('resize', onWindowResize);

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let bbox = game_renderer.getBoltsBbox();

    for (let b of bbox) {

        if (raycaster.ray.intersectsBox(b.bbox)) {
            game.click(b.bolt_position); // TODO: this must be able to fail. currently playing to fast might break the animation (and the game)

            if (game.isWon()) {
                game.lock();

                setTimeout(() => {
                    game.reinit();
                    game.randomFillBolts();
                    game_renderer.reinit();
                    game.unlock();
                }, 1000);
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);

    g_positionCamera();
}

function positionCamera(camera, box, viewDirection = new THREE.Vector3(0, 0, 1)) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const fov = camera.fov * (Math.PI / 180);
    const fovh = 2*Math.atan(Math.tan(fov/2) * camera.aspect);
    const distanceY = Math.abs((size.y / 2) / Math.tan(fov / 2));
    const distanceX = Math.abs((size.x / 2) / Math.tan(fovh / 2));

    let cameraZ = Math.max(distanceX, distanceY);

    const cameraPosition = new THREE.Vector3()
        .copy(viewDirection)
        .multiplyScalar(cameraZ)
        .add(center);

    camera.position.copy(cameraPosition);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
}

function animate(timestamp) {
    game_renderer.render();
    material_back.uniforms.time.value = timestamp;
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
