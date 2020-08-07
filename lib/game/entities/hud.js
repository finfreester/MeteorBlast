ig.module(
    'game.entities.hud'
)
.requires(
    'impact.entity'
)
.defines(function () {
    EntityHud = ig.Entity.extend({
        size: { x: 320, y: 240 },
        msg: '',
        msgfont: new ig.Font('media/orbitron.font.white.png'),
        zIndex: 800,
        animSheet: new ig.AnimationSheet('media/splashbackground.png', 320, 240),
        collides: ig.Entity.COLLIDES.NEVER,
        gravityFactor: 0,
        init: function (x, y, settings) {
            this.addAnim( 'idle', 1, [0] );
            this.parent(x, y, settings);
            this.pos.x = ig.game.screen.x;
            this.pos.y = ig.game.screen.y;
        },
        update: function () {
            this.pos.x = ig.game.screen.x;
            this.pos.y = ig.game.screen.y;
            if (ig.input.mouse.y <= 20) {
                //console.log('mouse zone');
            }
            else {

            }
            this.parent();
        },
        draw: function () {
            this.parent();
            this.msg = 'Your Mission\n\nUse your rapid-fire photons &\nhyper-space drive & repel\nalien saucers, guided missiles,\nfalling meteors & nuclear bombs\nto save the Earth!';
            this.msgfont.draw(this.msg, (ig.system.width / 2) - (this.msgfont.widthForString(this.msg) / 2), (ig.system.height / 2) - (this.msgfont.heightForString(this.msg) / 2) - 12, ig.Font.ALIGN.LEFT);
            }
        }
    });
});