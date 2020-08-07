ig.module(
	'game.entities.meteor'
)
.requires(
	'impact.entity',
    'game.entities.explosion'
)
.defines(function () {

    EntityMeteor = ig.Entity.extend({
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        points: 0,
        maxVel: { x: 100, y: 400 },
        animSheet: null,
        isLarge: false,
        explosion: null,
        init: function (x, y, settings) {

            if (settings.isLarge == null)
                settings.isLarge = (Math.random() >= 0.6) ? true : false;

            this.isLarge = settings.isLarge;

            if (this.isLarge) {
                this.size = { x: 32, y: 32 };
                this.animSheet = new ig.AnimationSheet('media/meteor_big.png', 32, 32);
                this.explosion = new ig.Sound('sound/big_meteor_explosion.*', false);
            } else {
                this.size = { x: 16, y: 16 };
                this.animSheet = new ig.AnimationSheet('media/meteor_small.png', 16, 16);
                this.explosion = new ig.Sound('sound/small_meteor_explosion.*', false);
            }

            this.points = ((this.isLarge) ? 10 : 20) * ig.game.level;

            this.setupAnimation();

            this.currentAnim = this.anims.spin;

            this.parent(x, y, settings);

            var slopePct = 0;

            switch (ig.game.level) {
                case 1:
                    slopePct = .75;
                    break;
                case 2:
                    slopePct = .70;
                    break;
                case 3:
                    slopePct = .65;
                    break;
                case 4:
                    slopePct = .60;
                    break;
                case 5:
                    slopePct = .55;
                    break;
                case 6:
                    slopePct = .50;
                    break;
            };

            //select meteor slope
            if (settings.slope == null) {
                settings.slope = (Math.random() >= slopePct) ? ig.game.getRandomInt(1, this.maxVel.x) : 0;
                this.vel.x = (x > (ig.system.width / 2)) ? -settings.slope : settings.slope;
            }
            else {
                this.vel.x = settings.slope;
            }

            //select meteor speed
            if (settings.highSpeed != settings.lowSpeed)
                this.vel.y = ig.game.getRandomInt(settings.lowSpeed, settings.highSpeed);
            else
                this.vel.y = settings.highSpeed;

        },

        setupAnimation: function () {
            this.addAnim('spin', .15, [0, 1, 2, 3, 4, 5, 6, 7]);
        },

        update: function () {
            // is meteor at screen edge?
            if (((this.pos.x + this.size.x) < 0) || (this.pos.x > ig.system.width)) {
                this.kill();
            } // is meteor at bottom?
            else if (this.pos.y > ig.system.height) {
                ig.game.score += (-this.points / 2);
                this.kill();
            }

            this.parent();
        },

        receiveDamage: function (amount, from) {
            this.parent(amount, from);

            if (from instanceof EntityProjectile) {
                ig.game.score += this.points;

                if (this.isLarge) {
                    var splitmeteor = (Math.random() >= 0.50) ? true : false;
                    var meteorslope1, meteorslope2, lowSpeed1, lowSpeed2, highSpeed1, highSpeed2;

                    meteorslope1 = ig.game.getRandomInt(25, this.maxVel.x);

                    if (Math.random() >= 0.60) {
                        meteorslope2 = meteorslope1;
                        lowSpeed1 = this.vel.y;
                        highSpeed1 = this.vel.y;

                    } else {
                        meteorslope2 = ig.game.getRandomInt(25, this.maxVel.x);
                        lowSpeed1 = 25;
                        highSpeed1 = this.maxVel.x;
                    }

                    lowSpeed2 = lowSpeed1;
                    highSpeed2 = highSpeed1;

                    if (splitmeteor) {
                        ig.game.spawnEntity(EntityMeteor, this.pos.x + (this.size.x / 2), this.pos.y + (this.size.y / 2), { lowSpeed: lowSpeed1, highSpeed: highSpeed1, isLarge: false, slope: -meteorslope1 });
                        ig.game.spawnEntity(EntityMeteor, this.pos.x + (this.size.x / 2), this.pos.y + (this.size.y / 2), { lowSpeed: lowSpeed2, highSpeed: highSpeed2, isLarge: false, slope: meteorslope2 });
                    }
                }
            }
        },

        check: function (other) {
            this.kill();
            other.receiveDamage(10, this);
        },

        kill: function () {
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
        }

    });

});