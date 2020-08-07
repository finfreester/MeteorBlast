ig.module(
	'game.entities.guidedmissile'
)
.requires(
	'impact.entity',
    'game.entities.explosion'
)
.defines(function () {

    EntityGuidedMissile = ig.Entity.extend({
        size: { x: 22, y: 22 },
        vel: { x: 0, y: 0 },
        maxVel: { x: 200, y: 200 },
        points: 50,
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.BOTH,
        collides: ig.Entity.COLLIDES.PASSIVE,
        speed: 0,
        lastpos: null,
        guidedmissileerror: false,
        breakoffChaseTimer: null,
        animSheet: new ig.AnimationSheet('media/guidedmissile.png', 22, 22),
        missile: new ig.Sound('sound/guided_missile.*', false),
        explosion: new ig.Sound('sound/big_meteor_explosion.*', false),
        init: function (x, y, settings) {

            // Add the animations
            this.setupAnimation();

            this.currentAnim = this.anims.pulse;

            this.parent(x, y, settings);

            this.points *= ig.game.level;

            this.speed = (ig.game.spaceobject.lowspeed / 10) + (ig.game.level / 2);

            //Missle fails 60% of time
            this.guidedmissileerror = (Math.random() >= 0.40);

            this.breakoffChaseTimer = new ig.Timer(1);

            this.missile.play();

        },

        setupAnimation: function () {
            this.addAnim('pulse', .125, [0, 1, 2, 1]);
        },

        update: function () {

            //is guidedmissile off the edge? or is guidedmissile at bottom?
            if ((this.pos.x + this.size.x < 0) || (this.pos.x > ig.system.width) || (this.pos.y > ig.system.height)) {
                ig.game.mrflyingobject = null;
                this.kill();
            }
            else {

                var deltax = ((ig.game.player.pos.x + (ig.game.player.size.x / 2)) - (this.pos.x + (this.size.x / 2)));
                var deltay = ((ig.game.player.pos.y + (ig.game.player.size.y / 2)) - (this.pos.y + (this.size.y / 2)));

                var rotation = Math.atan2(deltay, deltax); //In Radians
                var angle = (90).toRad(); //ig.game.toRadians(90);

                var vx = this.speed * (angle - Math.abs(rotation)) / angle;
                var vy = (this.speed - Math.abs(vx));  //Going downwards.

                if (this.lastpos == null) {

                    if ((this.guidedmissileerror) && (vy < 1)) { // (this.pos.y + this.size.y > (ig.system.height / 2))) {
                        //Guided missile error so break off chase
                        this.lastpos = { vx: vx, vy: vy };

                    } else {
                        this.pos.x += vx;
                        this.pos.y += vy;
                    }

                } else {

                    this.pos.x += this.lastpos.vx;
                    this.pos.y += this.lastpos.vy;

                }

                //if missile is chasing ship horizontally, 25% chance it breaks off chase.
                //If so, keeps going in current horizontal direction until off screen.
                if ((!this.guidedmissileerror) && (this.breakoffChaseTimer.delta() > 0)) {

                    if ((vy < 0.25) && (Math.random() <= (1 / ig.game.level))) {
                        this.guidedmissileerror = true;
                        this.lastpos = { vx: vx, vy: 0 };
                    }
                    else
                        this.breakoffChaseTimer.set(1);

                }

            }

            this.parent();

        },

        receiveDamage: function (amount, from) {
            this.parent(amount, from);

            if (from instanceof EntityProjectile) {
                ig.game.score += this.points;
            }
        },

        kill: function () {
            this.missile.stop();
            this.parent();
            var explodex = this.pos.x - ((37 - this.size.x) / 2);
            var explodey = this.pos.y - ((34 - this.size.y) / 2);
            if (
                (!ig.game.playerdied) &&
                (this.pos.x + this.size.x > 0) && (this.pos.x <= ig.system.width) &&
                (this.pos.y < ig.game.player.pos.y + ig.game.player.size.y)
               ) {
                this.explosion.play();
                ig.game.spawnEntity(EntityExplosion, explodex, explodey, {});
            }
            ig.game.mrflyingobject = null;
        },

        check: function (other) {
            this.kill();
            other.receiveDamage(10, this);
        }

    });

});