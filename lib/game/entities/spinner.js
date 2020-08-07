ig.module(
	'game.entities.spinner'
)
.requires(
	'impact.entity',
    'game.entities.explosion'
)
.defines(function () {

    EntitySpinner = ig.Entity.extend({
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        points: 0,
        maxVel: { x: 15, y: 400 },
        animSheet: null,
        spinner: new ig.Sound('sound/spinner.*', false),
        explosion: null,
        init: function (x, y, settings) {

            var isLarge = (Math.random() >= 0.7) ? true : false;

            if (isLarge) {
                this.size = { x: 24, y: 24 };
                this.animSheet = new ig.AnimationSheet('media/spinner_big.png', 24, 24);
                this.explosion = new ig.Sound('sound/big_meteor_explosion.*', false);
            } else {
                this.size = { x: 14, y: 14 };
                this.animSheet = new ig.AnimationSheet('media/spinner_small.png', 14, 14);
                this.explosion = new ig.Sound('sound/small_meteor_explosion.*', false);
            }

            this.setupAnimation();

            this.currentAnim = this.anims.spin;

            this.parent(x, y, settings);

            var slopePct = 0;

            switch (ig.game.level) {
                case 1:
                    slopePct = 1.01;
                    break;
                case 2:
                    slopePct = .85;
                    break;
                case 3:
                    slopePct = .80;
                    break;
                case 4:
                    slopePct = .75;
                    break;
                case 5:
                    slopePct = .70;
                    break;
                case 6:
                    slopePct = .65;
                    break;
            };

            var slope = (Math.random() >= slopePct) ? ig.game.getRandomInt(1, this.maxVel.x) : 0;

            this.points = ((isLarge) ? 40 : 80) * ig.game.level;

            //select spinner slope
            this.vel.x = (x > (ig.system.width / 2)) ? -slope : slope;

            //select spinner speed
            this.vel.y = ig.game.getRandomInt(settings.lowSpeed, settings.highSpeed);

            this.spinner.play();

        },
        setupAnimation: function () {
            this.addAnim('spin', .15, [0, 1, 2, 3, 4, 5, 6]);
        },

        update: function () {
            // is spinner at screen edge?
            if (((this.pos.x + this.size.x) < 0) || (this.pos.x > ig.system.width)) {
                this.kill();
            } // is spinner at bottom?
            else if (this.pos.y >= ig.game.player.pos.y + ig.game.player.size.y - this.size.y) {
                ig.game.player.receiveDamage(10, this);
                this.kill();
            }

            this.parent();
        },

        kill: function () {
            this.spinner.stop();
            this.parent();
            var explodex = this.pos.x - ((37 - this.size.x) / 2);
            var explodey = this.pos.y - ((34 - this.size.y) / 2);
            if (!ig.game.playerdied) {
                this.explosion.play();
                ig.game.spawnEntity(EntityExplosion, explodex, explodey, {});
            }
            ig.game.spinnercount = (ig.game.spinnercount < 0) ? 0 : (ig.game.spinnercount - 1);
        },

        receiveDamage: function (amount, from) {
            this.parent(amount, from);

            if (from instanceof EntityProjectile) {
                ig.game.score += this.points;
            }
        },

        check: function (other) {
            this.kill();
            other.receiveDamage(10, this);
        }

    });

});