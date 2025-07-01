"use strict";

import * as THREE from 'three';
import * as GAME from './nutgame';


class NutGameRenderer {
    static geometry_bolt = new THREE.CylinderGeometry(1, 1, 12, 10);
    static geometry_nut = new THREE.CylinderGeometry(2, 2, 3, 6, 1);
    static bolt_material = new THREE.MeshStandardMaterial({ color: 0xfcba03});
    static nut_material = new THREE.MeshStandardMaterial({ color: 0xfcba03});

    static material = [
        new THREE.MeshStandardMaterial({color: 0x00ff00, metalness: 1.0}),
        new THREE.MeshStandardMaterial({color: 0x0000ff, metalness: 1.0}),
        new THREE.MeshStandardMaterial({color: 0xff0000, metalness: 1.0})
    ];

    static bumpmap_thread = new THREE.TextureLoader().load("thread.jpg");
    static bumpmap_nut = new THREE.TextureLoader().load("scratch.jpg");

    constructor(game, scene) {
        this.game = game;
        this.scene = scene;
        this.bolts_mesh = new Map();
        this.nut_mesh = new Map();

        NutGameRenderer.bumpmap_thread.wrapS = THREE.RepeatWrapping;
        NutGameRenderer.bumpmap_thread.rotation = Math.PI/2.366;
        NutGameRenderer.bolt_material.bumpMap = NutGameRenderer.bumpmap_thread;

        NutGameRenderer.bumpmap_thread.wrapS = THREE.RepeatWrapping;
        NutGameRenderer.bumpmap_thread.wrapT = THREE.RepeatWrapping;
        NutGameRenderer.nut_material.bumpMap = NutGameRenderer.bumpmap_nut;
        NutGameRenderer.nut_material.bumpScale = 0.5;

        this.createMesh();

        for (let b of this.bolts_mesh) {
            this.scene.add(b[1].mesh);
        }
        for (let n of this.nut_mesh) {
            this.scene.add(n[1]);
        }

        this.positionBolt(2, 5);
    }

    getBbox() {
        let ret = [];
        for (let b of this.bolts_mesh) {
            ret.push({
                bolt_position: b[1].position,
                bbox: new THREE.Box3().setFromObject(b[1].mesh, true)
            });
        }
        return ret;
    }

    createMesh() {
        this.createMeshForBolts();
    }

    createMeshForBolts() {
        let i = 0;
        for (let b of this.game.bolts) {
            const id = b.id;

            const bolt = new THREE.Mesh(NutGameRenderer.geometry_bolt, NutGameRenderer.bolt_material);
            const nut = new THREE.Mesh(NutGameRenderer.geometry_nut, NutGameRenderer.nut_material);
            nut.position.x  = 0;
            nut.position.y = -5;
            const a = new THREE.Group();

            a.add(nut);
            a.add(bolt);

            this.bolts_mesh.set(id, {mesh: a, position: i});
            this.createMeshForNuts(b);
            i++;
        }
    }

    createMeshForNuts(bolt) {
        for (let n of bolt.array) {
            const id = n.id;

            const nut = new THREE.Mesh(NutGameRenderer.geometry_nut, NutGameRenderer.material[n.color % 3]);
            nut.rotation.y = Math.random() * (2 * Math.PI);

            this.nut_mesh.set(id, nut);
        }
    }

    positionBolt(row, column) {
        let bolt_it = this.bolts_mesh[Symbol.iterator]();

        const nb_bolt = this.bolts_mesh.length;
        let i = 0;
        for (let y = 0; y < row; y++) {
            for (let x = 0; x < column; x++) {
                let id_val = bolt_it.next().value;
                if (id_val == undefined) break;
                let curr_bolt = id_val[1].mesh;
                curr_bolt.position.x = (6.0 * x) - 12.0;
                curr_bolt.position.y = - (15.0 * y);

                i++;
                if (i >= nb_bolt) break;
            }
        }
    }

    render() {
        let time = Date.now();

        let moveA = this.game.move_nuts_animation;
        let isMoving = (moveA.start_time + moveA.duration) >= time;

        if (! isMoving) {
            this.start_animation = false;
        } else {
            if (! this.start_animation) {
                this.start_animation = true;
                this.nut_start_position = new Map();
                for (let o of moveA.objs) {
                    const n_mesh = this.nut_mesh.get(o.id);
                    this.nut_start_position.set(o.id, n_mesh.position);
                }
            }
        }

        if (isMoving) {
            const dt = time - moveA.start_time;
            let delay = 0;
            const b_mesh_from = this.bolts_mesh.get(moveA.from);
            const b_mesh_to = this.bolts_mesh.get(moveA.to);
            const move_step_time = (moveA.duration / 3);
            for (let o of moveA.objs) {
                const n_mesh = this.nut_mesh.get(o.id);
                const start = this.nut_start_position.get(o.id);

                let ndt = clamp(((dt - delay) / move_step_time), 0.0, 1.1);
                if (ndt <= 1.0) {
                    n_mesh.position.y = lerp(start.y, 15, ndt);
                    n_mesh.rotation.y = lerp(0, 2 * Math.PI, ndt);
                } else {
                    ndt = clamp((((dt - delay) - move_step_time) / move_step_time), 0.0, 1.1);
                    if (ndt <= 1.0) {
                        n_mesh.position.x = lerp(b_mesh_from.mesh.position.x, b_mesh_to.mesh.position.x, ndt);
                    } else {
                        ndt = clamp((((dt - delay) - move_step_time * 2) / move_step_time), 0.0, 1.0);
                        n_mesh.position.y = lerp(15, 0, ndt);
                        n_mesh.rotation.y = lerp(2 * Math.PI, Math.random() * (Math.PI / 2), ndt);
                    }
                }


                
                delay += 20;
            }
        } else {
            let raised_bolt = this.game.select_from;
            for (let i = 0; i < this.game.bolts.length; i++) {
                let b = this.game.bolts[i];
                const b_mesh = this.bolts_mesh.get(b.id);
                let raise_last = raised_bolt == i;

                for (let j = 0; j < b.array.length; j++) {
                    const n_mesh = this.nut_mesh.get(b.array[j].id);
                    const b_x = b_mesh.mesh.position.x;
                    const b_y = b_mesh.mesh.position.y;
                    n_mesh.position.x = b_x;
                    if (raise_last && b.array.length - 1 == j) {
                        n_mesh.position.y = b_y + (3.0 * j + 1);
                    } else {
                        n_mesh.position.y = b_y + (3.0 * j);
                    }
                }
            }
        }
    }

}

function lerp(v0, v1, t) {
    return v0 + t * (v1 - v0);
}

function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}
export {NutGameRenderer};
