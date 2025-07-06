
class Nut {

    static N = 0;

    constructor (color) {
        this.color = color;
        this.id = Nut.N;
        Nut.N++;
    }

}

class Bolt {

    static N = 0;

    constructor (size, getColor = (x) => x) {
        this.size = size;
        this.getColor = getColor;
        this.array = new Array();
        this.id = Bolt.N;
        Bolt.N++;
    }

    removeAll() {
        this.array.length = 0;
    }

    isFull() {
        return this.array.length >= this.size;
    }

    isEmpty() {
        return this.array.length == 0;
    }

    untilFull() {
        return this.size - this.array.length;
    }

    peek() {
        return this.array[this.array.length - 1];
    }

    peekN() {
        if (this.isEmpty()) return 0;
        let ret = 1;
        let removed = this.getColor(this.peek());
        for (let i = this.array.length - 2; i >= 0; i--) {
            if (this.getColor(this.array[i]) == removed) {
                ret++;
            } else {
                break;
            }
        }
        return  ret;
    }

    canPush(color_obj, nb) {
        console.assert(nb <= this.size, "");
        if (this.isEmpty()) {
            return nb;
        }
        if (this.isFull()) {
            return 0;
        }
        if (this.getColor(this.peek()) == this.getColor(color_obj)) {
            const uf = this.untilFull();
            if (uf < nb) {
                return uf;
            } else {
                return nb;
            }
        }
        return 0;
    }

    push(color_obj) {
        this.array.push(color_obj);
    }

    pushAll(color_objs) {
        for (let color_obj of color_objs) {
            this.push(color_obj);
        }
    }

    popN(nb) {
        if (this.isEmpty()) return [];
        let ret = [];
        let removed = this.array.pop();
        ret.push(removed);
        let removed_color = this.getColor(removed);
        while (! this.isEmpty()) {
            if (this.getColor(this.peek()) == removed_color && ret.length < nb) {
                ret.push(this.array.pop());
            } else {
                break;
            }
        }
        return  ret;
    }


    isOneColor() {
        if (this.isEmpty()) return false;
        const nb = this.array.length;
        const color = this.getColor(this.array[0]);
        for (let i = 1; i < nb; i++) {
            if (this.getColor(this.array[i]) != color) {
                return false;
            }
        }
        return true;
    }
}

class NutGame {

    constructor(nb_bolts, bolt_size) {
        this.nb_bolts = nb_bolts;
        this.bolt_size = bolt_size;
        this.init();
    }

    init() {
        this.bolts = new Array(this.nb_bolts + 2);
        for (let i = 0; i < this.nb_bolts + 2; i++) {
            this.bolts[i] = new Bolt(this.bolt_size, (x) => x.color);
        }
        this.is_locked = false;
        this.select_from = null;
        this.move_nuts_animation = {
            from: 0,
            from_pos: 0,
            to: 0,
            nb: 0,
            start_time: 0,
            duration: 1
        };
    }

    reinit() {
        const lock = this.is_locked;
        this.init();
        this.is_locked = lock;
    }

    lock() {
        this.is_locked = true;
    }

    unlock() {
        this.is_locked = false;
    }

    isAnimating(time) {
        return (this.move_nuts_animation.start_time + this.move_nuts_animation.duration) >= time;
    }

    click(id) {
        if (this.is_locked == true) return;
        if (this.isAnimating(Date.now())) return;
        if (this.select_from == null) {
            if (! this.bolts[id].isEmpty()) {
                this.select_from = id;
            }
        } else {
            let nb = this.canMove(this.select_from, id);
            if (nb > 0) {
                this.doMove(this.select_from, id, nb);
                this.select_from = null;
            } else {
                this.select_from = null;
            }
        }
    }

    emptyAllBolts() {
        for(let b = 0; b < this.nb_bolts; b++) {
            this.bolts[b].removeAll();
        }
    }

    randomFillBolts() {
        this.emptyAllBolts();
        let colors_tray = new Array(this.nb_bolts);
        colors_tray.fill(this.bolt_size);

        const nb_nut = this.nb_bolts * this.bolt_size;

        for (let b = 0; b < this.nb_bolts; b++) {
            for (let i = 0; i < this.bolt_size; i++) {
                var pick = 0;
                do {
                    pick = Math.floor((Math.random() * (this.nb_bolts)));
                } while (colors_tray[pick] <= 0);
                this.bolts[b].push(new Nut(pick));
                colors_tray[pick]--;
            }
        }
        console.assert(colors_tray.every(x => x == 0), "tray is not empty");
    }

    canMove(id_from, id_to) {
        if (this.bolts[id_from].isEmpty()) return false;
        if (id_from == id_to) return true;
        const color = this.bolts[id_from].peek();
        const nb = this.bolts[id_from].peekN();

        return this.bolts[id_to].canPush(color, nb);
    }

    doMove(id_from, id_to, nb) {
        const color = this.bolts[id_from].peek();
        const color_objs = this.bolts[id_from].popN(nb);
        this.move_nuts_animation = {
            objs: color_objs,
            from: id_from,
            to: id_to,
            nb: nb,
            to_prev_size: this.bolts[id_to].array.length,
            start_time: Date.now(),
            duration: 250 + (30*nb) // TODO: put the extra time in a variable
        };
        this.bolts[id_to].pushAll(color_objs);
    }


    isWon() {
        let acc = 0;
        for (let b = 0; b < this.nb_bolts + 2; b++) {
            if (this.bolts[b].isFull()) {
                if (this.bolts[b].isOneColor()) {
                    acc += 1;
                } else {
                    return false;
                }
            }
        }
        return acc == this.nb_bolts;
    }

    print() {
        for (let i = this.bolt_size - 1; i >= 0; i--) {
            let line = [];
            for (let b = 0; b < this.nb_bolts + 2; b++) {
                let bolt = this.bolts[b];
                let color_obj = bolt.array[i];
                if (color_obj == undefined) {
                    line.push(" ");
                } else {
                    line.push(bolt.getColor(color_obj));
                }
            }
            console.log(line.join("\t"));
        }
        let line = [];
        for (let b = 0; b < this.nb_bolts + 2; b++) {
            line.push(b);
        }
        let l = line.join("\t");
        console.log(Array(line.length).fill("-").join("\t"));
        console.log(l);
    }

    play() {

        while (! this.isWon()) {
            this.print();
            let f = parseInt(window.prompt("from"));
            let t = parseInt(window.prompt("to"));
            let nb_move = this.canMove(f, t);
            if (nb_move > 0) {
                console.log("doing move");
                this.doMove(f, t, nb_move);
                console.log("move done");
            } else {
                console.log("invalid move");
            }
        }
        console.log("won");

    }
}
export {NutGame, Bolt};
