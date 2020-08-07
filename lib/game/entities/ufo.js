ig.module(
	'game.entities.ufo'
)
.requires(
	'impact.entity',
    'game.entities.explosion'
)
.defines(function () {

    EntityUfo = ig.Entity.extend({
        size: { x: 32, y: 24 },
        type: ig.Entity.TYPE.B,
        collides: ig.Entity.COLLIDES.PASSIVE,
        points: 100,
        maxVel: { x: 350, y: 0 },
        animSheet: new ig.AnimationSheet('media/ufo.png', 32, 24),
        middistancetoplayer: 0,
        ufo: new ig.Sound('sound/ufo.*', false),
        explosion: new ig.Sound('sound/big_meteor_explosion.*', false),
        init: function (x, y, settings) {

            this.setupAnimation();

            this.currentAnim = this.anims.wobble;

            this.parent(x, y, settings);

            this.points *= ig.game.level;

            this.middistancetoplayer = y + ((ig.game.player.pos.y - y) / 2);

            this.vel.x = ig.game.getRandomInt(settings.lowSpeed, settings.highSpeed);

            if (x > 0) {
                this.vel.x = -this.vel.x;
            }

            this.ufo.play();

        },

        setupAnimation: function () {
            this.addAnim('wobble', .125, [0, 1, 2, 3, 2, 1, 0, 4, 5, 6, 5, 4]);
        },

        update: function () {
            // is ufo at screen edge?
            if (((this.pos.x + this.size.x) < 0) || (this.pos.x > ig.system.width)) {
                this.kill();
            }
            else if ((Math.random() >= 0.60) && (ig.game.mrufolazer == null)) {
                var midx = this.pos.x + (this.size.x / 2);
                var y = this.pos.y + this.size.y + 1;
                ig.game.mrufolazer = ig.game.spawnEntity(EntityUfoProjectile, midx, y, {});
            }
            else if (ig.game.mrufolazer != null) {
                if (ig.game.mrufolazer.pos.y >= this.middistancetoplayer) {
                    ig.game.mrufolazer = null;
                }
            }

            this.parent();
        },

        kill: function () {
            this.ufo.stop();
            this.parent();
            var explodex = this.pos.x - ((37 - this.size.x) / 2);
            var explodey = this.pos.y - ((34 - this.size.y) / 2);
            if ((this.pos.x + this.size.x > 0) && (this.pos.x <= ig.system.width)) {
                this.explosion.play();
                ig.game.spawnEntity(EntityExplosion, explodex, explodey, {});
            }
            ig.game.mrflyingobject = null;
            ig.game.mrufolazer = null;
        },

        receiveDamage: function (amount, from) {
            this.parent(amount, from);
            ig.game.score += this.points;
        }

    });

    EntityUfoProjectile = ig.Entity.extend({
        size: { x: 8, y: 8 },
        maxVel: { x: 300, y: 300 },

        type: ig.Entity.TYPE.NONE,
        checkAgainst: ig.Entity.TYPE.BOTH,
        collides: ig.Entity.COLLIDES.NEVER,
        animSheet: new ig.AnimationSheet('media/ufolazer.png', 8, 8),
        ufolazer: new ig.Sound('sound/ufolazer.*', false),
        init: function (x, y, settings) {
            this.parent(x, y, settings);

            this.addAnim('idle', 1, [0]);

            var slopeadj = 0;

            switch (ig.game.level) {
                case 4:
                    slopeadj = .75;
                    break;
                case 5:
                    slopeadj = .90;
                    break;
                case 6:
                    slopeadj = 1;
                    break;
                default:
                    slopeadj = 1;
                    break;
            };

            var rise = (ig.game.player.pos.y - y) * slopeadj;
            var run = (ig.game.player.pos.x - x) * slopeadj;

            this.vel.y = rise;
            this.vel.x = run;

            this.ufolazer.play();
        },

        update: function () {
            // is ufo lazer at screen edge?
            if (((this.pos.x + this.size.x) < 2) || (this.pos.x > ig.system.width)) {
                this.kill();
            } // is ufo lazer at bottom?
            else if (this.pos.y > ig.system.height) {
                this.kill();
            }

            this.parent();
        },

        check: function (other) {
            this.kill();
            other.receiveDamage(10, this);
        },

        kill: function () {
            this.ufolazer.stop();

            this.parent();

            if (!ig.game.playerdied) {
                ig.game.spawnEntity(EntityExplosion, this.pos.x, this.pos.y, {});
            }
            ig.game.mrufolazer = null;
        }

    });

});