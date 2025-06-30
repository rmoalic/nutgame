"use strict";

import * as THREE from 'three';
import * as GAME from './nutgame';


class NutGameRenderer {
    static geometry_bolt = new THREE.CylinderGeometry(1, 1, 12, 10); 
    static geometry_nut = new THREE.CylinderGeometry(2, 2, 3, 6, 1);
    static bolt_material = new THREE.MeshStandardMaterial( { color: 0xfcba03 } );
    static nut_material = new THREE.MeshStandardMaterial( { color: 0xfcba03 } );
    
    static material = [
        new THREE.MeshStandardMaterial( { color: 0x00ff00 } ),
        new THREE.MeshStandardMaterial( { color: 0x0000ff } ),
        new THREE.MeshStandardMaterial( { color: 0xff0000 } )
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
        //NutGameRenderer.bumpmap_thread.rotation = Math.PI / 2;
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
                curr_bolt.position.x = (4.0 * x) - 10.0;
                curr_bolt.position.y = - (15.0 * y);            

                i++;
                if (i >= nb_bolt) break;
            }
        }
    }

    render() {
        for (let b of this.game.bolts) {
            const b_mesh = this.bolts_mesh.get(b.id);
            let i = 0;
            for (let n of b.array) {
                const n_mesh = this.nut_mesh.get(n.id);
                const b_x = b_mesh.mesh.position.x;
                const b_y = b_mesh.mesh.position.y;
                n_mesh.position.x = b_x;
                n_mesh.position.y = b_y + (3.0 * i);
                i++;
            }
        }
    }

}

export {NutGameRenderer};
