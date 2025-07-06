"use strict";

import * as THREE from 'three';
import * as TWEEN from "@tweenjs/tween.js";

const NUT_HEIGHT = 3;
const BOLT_SPACING = 6;
const BOLT_WIDTH = 10;

class NutGameRenderer {
    static geometry_nut = new THREE.CylinderGeometry(2, 2, NUT_HEIGHT, 6, 1);
    static bolt_material = new THREE.MeshStandardMaterial({color: 0xced4da});
    static nut_material = new THREE.MeshStandardMaterial({color: 0xced4da});

    static material = [
        new THREE.MeshStandardMaterial({color: 0xFFBE0B, metalness: 0.0}),
        new THREE.MeshStandardMaterial({color: 0xFB5607, metalness: 0.0}),
        new THREE.MeshStandardMaterial({color: 0xFF006E, metalness: 0.0}),
        new THREE.MeshStandardMaterial({color: 0x8338EC, metalness: 0.0}),
        new THREE.MeshStandardMaterial({color: 0x3E86FF, metalness: 0.0})
    ]

    static bumpmap_thread = new THREE.TextureLoader().load("thread.jpg");
    static bumpmap_nut = new THREE.TextureLoader().load("scratch.jpg");

    constructor(game, scene) {
        this.game = game;
        this.scene = scene;


        NutGameRenderer.bumpmap_thread.wrapS = THREE.RepeatWrapping;
        NutGameRenderer.bumpmap_thread.rotation = Math.PI/2.366;
        NutGameRenderer.bolt_material.bumpMap = NutGameRenderer.bumpmap_thread;

        NutGameRenderer.bumpmap_thread.wrapS = THREE.RepeatWrapping;
        NutGameRenderer.bumpmap_thread.wrapT = THREE.RepeatWrapping;
        NutGameRenderer.nut_material.bumpMap = NutGameRenderer.bumpmap_nut;
        NutGameRenderer.nut_material.bumpScale = 0.5;

        this.init();
    }

    init() {
        if (this.bolts_group !== undefined) {
            this.scene.remove(this.bolts_group);
        }
        if (this.nut_mesh !== undefined) {
            for (let n of this.nut_mesh) {
                this.scene.remove(n[1]);
            }
        }

        this.bolts_mesh = new Array();
        this.nut_mesh = new Map();

        this.bolt_geometry_size = 1.0 * this.game.bolt_size * NUT_HEIGHT;
        this.geometry_bolt = new THREE.CylinderGeometry(1, 1, this.bolt_geometry_size, BOLT_WIDTH);
        this.geometry_bolt.translate(0, (this.bolt_geometry_size / 2.0), 0);

        this.createMesh();

        this.bolts_group = new THREE.Group();
        for (let b of this.bolts_mesh) {
            this.bolts_group.add(b.mesh);
        }
        this.scene.add(this.bolts_group);

        for (let n of this.nut_mesh) {
            this.scene.add(n[1]);
        }

        this.positionBolt(2, 7);
    }

    reinit() {
        this.init();
    }

    getBbox() {
        return new THREE.Box3().setFromObject(this.bolts_group, true);
    }

    getBoltsBbox() {
        let ret = [];
        for (let b of this.bolts_mesh) {
            ret.push({
                bolt_position: b.position,
                bbox: new THREE.Box3().setFromObject(b.mesh, true)
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

            const bolt = new THREE.Mesh(this.geometry_bolt, NutGameRenderer.bolt_material);
            const nut = new THREE.Mesh(NutGameRenderer.geometry_nut, NutGameRenderer.nut_material);
            nut.position.x  = 0;
            nut.position.y = - NUT_HEIGHT;
            bolt.position.y = - 0.5 * NUT_HEIGHT; // ???
            console.log(bolt.position);
            const a = new THREE.Group();

            a.add(nut);
            a.add(bolt);

            this.bolts_mesh.push({mesh: a, position: i, id: id});
            this.createMeshForNuts(b);
            i++;
        }
    }

    createMeshForNuts(bolt) {
        for (let n of bolt.array) {
            const id = n.id;

            const nut = new THREE.Mesh(NutGameRenderer.geometry_nut, NutGameRenderer.material[n.color % NutGameRenderer.material.length]);
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
                let curr_bolt = id_val.mesh;
                curr_bolt.position.x = (BOLT_SPACING * x) - ((BOLT_SPACING) * ((column % 2 == 0 ? column : column - 1) / 2));
                curr_bolt.position.y = - ((this.bolt_geometry_size + (1.5 * BOLT_SPACING)) * y);

                i++;
                if (i >= nb_bolt) break;
            }
        }
    }

    createAnimation() {
        let moveA = this.game.move_nuts_animation;
        const b_mesh_from = this.bolts_mesh[moveA.from];
        const b_mesh_to = this.bolts_mesh[moveA.to];
        const move_step_time = (moveA.duration / 3); // TODO: the 2nd step should probably not have the same lenght as the other 2

        const top_point_from = {x: b_mesh_from.mesh.position.x, y: b_mesh_from.mesh.position.y + (this.game.bolt_size + 1) * NUT_HEIGHT};
        const top_point_to = {x: b_mesh_to.mesh.position.x, y: b_mesh_to.mesh.position.y + (this.game.bolt_size + 1) * NUT_HEIGHT};

        let ret = [];
        let i = 0;
        for (let o of moveA.objs) {
            const group = new TWEEN.Group();
            const n_mesh = this.nut_mesh.get(o.id);
            const final_position = {x: b_mesh_to.mesh.position.x, y: b_mesh_to.mesh.position.y + (moveA.to_prev_size + i) * NUT_HEIGHT};

            const a_top_from = new TWEEN.Tween(n_mesh.position)
                  .delay(i * 30) // TODO: get the value from the game object
                  .to(top_point_from, move_step_time)
                  .easing(TWEEN.Easing.Quadratic.In);

            const a_top_to = new TWEEN.Tween(n_mesh.position)
                  .to(top_point_to, move_step_time)
                  .easing(TWEEN.Easing.Linear.None);

            const a_bttm_to = new TWEEN.Tween(n_mesh.position)
                  .to(final_position, move_step_time)
                  .easing(TWEEN.Easing.Quadratic.Out);

            a_top_from.chain(a_top_to);
            a_top_to.chain(a_bttm_to)

            group.add(a_top_from);
            group.add(a_top_to);
            group.add(a_bttm_to);
            ret.push({first: a_top_from, all: group});

            i++;
        }

        return ret;
    }

    render() {
        let time = Date.now();
        let isMoving = this.game.isAnimating(time);

        if (! isMoving) {
            this.start_animation = false;
        } else {
            if (! this.start_animation) {
                this.start_animation = true;

                this.anim = new TWEEN.Group();
                const sa = this.createAnimation();
                for (const a of sa) {
                    for (const b of a.all.getAll()) {
                        this.anim.add(b);
                    }
                    a.first.start();
                }
            }
        }

        if (this.anim !== undefined) this.anim.update();

        if (! isMoving) {
            let raised_bolt = this.game.select_from;
            for (let i = 0; i < this.game.bolts.length; i++) {
                let b = this.game.bolts[i];
                const b_mesh = this.bolts_mesh.find(x => x.id == b.id);
                let raise_last = raised_bolt == i;

                for (let j = 0; j < b.array.length; j++) {
                    const n_mesh = this.nut_mesh.get(b.array[j].id);
                    const b_x = b_mesh.mesh.position.x;
                    const b_y = b_mesh.mesh.position.y;
                    n_mesh.position.x = b_x;
                    if (raise_last && b.array.length - 1 == j) {
                        n_mesh.position.y = b_y + (NUT_HEIGHT * j + 1);
                    } else {
                        n_mesh.position.y = b_y + (NUT_HEIGHT * j);
                    }
                }
            }
        }
    }

}

export {NutGameRenderer};
