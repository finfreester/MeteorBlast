ig.module(
	'game.entities.player'
)
.requires(
	'impact.entity'
)
.defines(function () {

    EntityPlayer = ig.Entity.extend({
        size: { x: 22, y: 22 },
        offset: { x: 2, y: 1 },
        maxVel: { x: 250, y: 0 },
        speed: 250,
        autofireTimer: null,
        invincible: false,
        invincibleDelay: 2,
        invincibleTimer:null,

        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.NONE,
        collides: ig.Entity.COLLIDES.PASSIVE,

        animSheet: new ig.AnimationSheet('media/ship.png', 22, 22),
        hyperspace: new ig.Sound('sound/hyperspace.*', false),
        
        makeInvincible: function(){
            this.invincible = true;
            this.invincibleTimer.reset();
        },

        init: function (x, y, settings) {

            // Add the animations
            this.setupAnimation();

            this.currentAnim = this.anims.idle;

            this.parent(x, y, settings);

            this.invincibleTimer = new ig.Timer();
            this.autofireTimer = new ig.Timer(.25);

            if (ig.game.playerStartposition.x == 0) {
                ig.game.playerStartposition = { x: ((ig.system.width / 2) - (this.size.x / 2)), y: (ig.game.scoreboard.y - this.size.y) };
            }

        },

        setupAnimation: function () {
            this.addAnim('idle', .125, [0, 1, 2, 3, 4, 5, 4, 3, 2, 1]);
        },

        update: function () {

            var y = this.pos.y - this.offset.y - 1 - 8;

            // move left or right
            if (ig.input.state('left')) {
                this.vel.x = -this.speed;
            }
            else if (ig.input.state('right')) {
                this.vel.x = this.speed;
            }
            else {
                this.vel.x = 0;
            }

            if (ig.input.pressed('autofire')) {
                ig.game.autofirepressed = !ig.game.autofirepressed;
            }

            if (ig.input.pressed('hyperspace')) {
                this.hyperspace.play();
                this.makeInvincible();
                this.pos.x = ig.game.getRandomInt(Math.round((ig.system.width - this.size.x) / 2), ig.system.width - this.size.x);
            }
            else {
                if (!this.invincible) {

                    // shoot

                    var shootx = this.pos.x + (this.size.x / 2) - this.offset.x - 2;

                    if (ig.input.pressed('shoot') && (!ig.game.autofirepressed)) {
                        ig.game.spawnEntity(EntityProjectile, shootx, y, {});
                    }
                    else if ((ig.game.autofirepressed) && (this.autofireTimer.delta() > 0)) {
                        ig.game.spawnEntity(EntityProjectile, shootx, y, {});
                        this.autofireTimer.reset();
                    }

                }
            }

            if ( this.invincibleTimer.delta() > this.invincibleDelay ) {
                this.invincible = false;
                this.currentAnim.alpha = 1;
            }

            // move!
            this.parent();

            // check if player goes past left/right of screen and stop
            if (this.pos.x + this.size.x > ig.system.width) {
                this.pos.x = ig.system.width - this.size.x + this.offset.x;
            }
            else if (this.pos.x < 0) {
                this.pos.x = 0 + this.offset.x;
            }

        },

        receiveDamage: function (amount, from) {
            this.parent(amount, from);
        },

        draw: function () {
            if (this.invincible) {
                this.currentAnim.alpha = this.invincibleTimer.delta() / this.invincibleDelay * 1;
            }
            this.parent();
        },

        kill: function () {
            ig.game.playerdied = true;

            this.parent();

            var ents = ig.game.entities;
            var inGameEntititesLen = ents.length - 1;

            //Kill all entities other than player to clear screen
            for (var i = 0; i <= inGameEntititesLen; i++) {
                if (ents[i] != ig.game.player) {
                    ents[i].kill();
                }
            }

            ig.game.spawnEntity(EntityPlayerDeathExplosion, this.pos.x + (this.size.x / 2) - 3, this.pos.y + (this.size.y / 2) - 7, { callBack: this.onDeath });
        },

        onDeath: function () {
            ig.game.score -= (100 * ig.game.level);
            ig.game.lives--;

            ig.game.playerdied = false;
           
            if (ig.game.lives > 0) {
                ig.game.player = ig.game.spawnEntity(EntityPlayer, ig.game.playerStartposition.x, ig.game.playerStartposition.y, {});
                ig.music.play();
            }
        }

    });

    EntityProjectile = ig.Entity.extend({
        size: { x: 4, y: 16 },
        maxVel: { x: 0, y: 350 },
        speed: 350,

        type: ig.Entity.TYPE.NONE,
        checkAgainst: ig.Entity.TYPE.B,
        collides: ig.Entity.COLLIDES.PASSIVE,

        animSheet: new ig.AnimationSheet('media/projectile.png', 4, 16),

        init: function (x, y, settings) {
            this.parent(x, y, settings);

            this.addAnim('idle', 1, [0]);
            this.vel.y = -this.speed;
        },

        check: function (other) {
            this.kill();
            other.receiveDamage(10, this);
        }

    });

    EntityPlayerDeathExplosion = ig.Entity.extend({
        idleTimer: null,
        lifetime: 2,
        explosion: new ig.Sound('sound/shipexplosion.*', false),
        init: function (x, y, settings) {
            this.parent(x, y, settings);

            var particles = this.shuffle([0, 1, 2, 3, 4, 5]);
            var particleangles = [210, 230, 250, 290, 310, 330];

            this.explosion.play();

            for (var i = 0; i < particles.length; i++)
                ig.game.spawnEntity(EntityPlayerDeathExplosionParticle, x, y, { particleindex: particles[i], particleangle: (particleangles[i]).toRad() });

            this.idleTimer = new ig.Timer();
        },

        shuffle: function (array) {
            var tmp, current, top = array.length;
            if (top) while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }
            return array;
        },

        update: function () {
            if (this.idleTimer.delta() > this.lifetime) {
                this.kill();
                if (this.callBack)
                    this.callBack();
                return;
            }

        },

    });

    EntityPlayerDeathExplosionParticle = ig.Entity.extend({
        size: { x: 6, y: 13 },
        maxVel: { x: 160, y: 200 },
        idleTimer: null,
        lifetime: 2,
        fadetime: 1,
        gravityFactor: 1,
        vel: { x: 35, y: 35 },
        collides: ig.Entity.COLLIDES.NEVER,
        animSheet: new ig.AnimationSheet('media/playerexplosion.png', 6, 13),
        init: function (x, y, settings) {
            this.parent(x, y, settings);

            this.vel.x *= Math.cos(settings.particleangle);
            this.vel.y *= Math.sin(settings.particleangle);

            this.addAnim('idle', 0.25, [settings.particleindex]);

            this.idleTimer = new ig.Timer();
        },

        update: function () {
            if (this.idleTimer.delta() > this.lifetime) {
                this.kill();
                return;
            }

            this.currentAnim.angle += Math.PI / 2 * ig.system.tick;

            this.currentAnim.alpha = this.idleTimer.delta().map(
                this.lifetime - this.fadetime, this.lifetime,
                1, 0
            );

            this.parent();

        }

    });

});