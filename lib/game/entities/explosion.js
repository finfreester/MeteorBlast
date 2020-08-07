ig.module(
	'game.entities.explosion'
)
.requires(
	'impact.entity'
)
.defines(function () {

    EntityExplosion = ig.Entity.extend({
        size: { x: 37, y: 34 },
        idleTimer: null,
        lifetime: .125,
        fadetime: .0625,
        collides: ig. Entity.COLLIDES.NEVER,
        animSheet: new ig.AnimationSheet('media/explosion.png', 37, 34),

        init: function (x, y, settings) {
            this.setupAnimation();

            this.currentAnim = this.anims.explode;

            this.parent(x, y, settings);

            this.idleTimer = new ig.Timer(this.lifetime);
        },

        setupAnimation: function () {
            this.addAnim('explode', .0625, [0, 1, 2, 3, 4, 5, 4, 3, 2, 1]);
        },

         update: function () {
            if (this.idleTimer.delta() > this.lifetime) {
                this.kill();
                return;
            }
            this.currentAnim.alpha = this.idleTimer.delta().map(
                this.lifetime - this.fadetime, this.lifetime,
                .333, 0
            );
            this.parent();
        }

    });

});
