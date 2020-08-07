ig.module(
	'game.main'
)
.requires(
	'impact.game',
	'impact.font',
	'game.entities.player',
	'game.entities.meteor',
    'game.entities.spinner',
    'game.entities.ufo',
    'game.entities.guidedmissile',
    'plugins.replacecolor',
    'plugins.impact-splash-loader',
    'plugins.dynscale'

)
.defines(function () {

    MeteorBlastGame = ig.Game.extend({

        // Load a font
        font: new ig.Font('media/orbitron.font.white.png'),
        background: new ig.Image('media/backdrop.png#0000FF#000000'),
        lives: 5,
        score: 0,
        nextlifescore: 1000,
        level: 1,
        scoreboard: { x: 0, y: 0 },
        spaceobject: { lowspeed: 20, highspeed: 50 },
        spaceobjectprobs: { ufo: 0.02, guidedmissile: 0.04, spinner: 0.06 },
        player: null,
        spawnSpaceObjectTimer: null,
        spawnSpaceObjectInterval: 3,
        gamepaused: false,
        mrflyingobject: null,
        spinnercount: 0,
        mrufolazer: null,
        gameOver: false,
        playerdied: false,
        playerStartposition: { x: 0, y: 0 },
        autofirepressed: false,
        newlife: new ig.Sound('sound/newlife.*', false),
        startSound: new ig.Sound('sound/start.*', false),
        init: function () {

            this.clearColor = null;

            this.rebindcontrols();

            if (isTrial) {

                //Set score randomly, allow only 2 lives and no extra lives

                this.score = this.getRandomInt(10000, 50000);
                this.lives = 2;
                this.nextlifescore = 1000000; //set to outlier to ensure no new life granted

            }

            sizeCanvas();

            this.scoreboard = { x: 2, y: (ig.system.height - 7) };
            this.spawnSpaceObjectTimer = new ig.Timer();

            this.autofirepressed = (ig.ua.mobile);

            this.player = ig.game.spawnEntity(EntityPlayer, (ig.system.width / 2 - 11), this.scoreboard.y - 22, {});

            ig.music.add('sound/background_theme.*');

            ig.music.volume = 0.25;
            ig.music.loop = true;
            ig.music.play();

            this.startSound.play();

        },

        update: function () {

            if (ig.input.pressed('pause')) {
                this.gamepaused = !this.gamepaused;
            }

            if (this.gamepaused || this.gameOver) {
                // for pausing
                ig.music.stop();
                return;
            }

            if (this.playerdied) {
                ig.music.stop();
                this.parent();
                return;
            }

            var newLevel = -1;

            if (this.score < 999)
                newLevel = 1;
            else if (this.score < 5000)
                newLevel = 2;
            else if (this.score < 20000)
                newLevel = 3;
            else if (this.score < 50000)
                newLevel = 4;
            else if (this.score < 100000)
                newLevel = 5;
            else
                newLevel = 6;

            if (newLevel != this.level) {
                this.level = newLevel;

                //bump metor speed
                this.spaceobject.highspeed += (this.level * 3);

                if (!isTrial) {
                    ga('send', 'event', 'game', 'level', 'next level', this.level);
                } else {
                    ga('send', 'event', 'game', 'level', 'trial level', this.level);
                }

            }

            if (this.score >= this.nextlifescore) {
                this.lives++;
                this.newlife.play();
                this.nextlifescore += (this.level * 1000);
                ga('send', 'event', 'game', 'life', 'extra ship', this.lives);
            }

            //Place Space object?
            if (this.spawnSpaceObjectTimer.delta() > 0) {

                this.spawnEnemy();
                this.spawnSpaceObjectTimer.set(Math.random() * (1 / this.level) * this.spawnSpaceObjectInterval);

            }

            // check for gameover
            if (this.lives === 0) {

                ig.music.stop();
                this.gameOver = true;

                if (!isTrial) {
                    ga('send', 'event', 'game', 'score', 'game score', this.score);
                }

            }

            this.parent();
        },

        draw: function () {
            // Draw all entities and BackgroundMaps

            // Draw background Image - code below is OK because of built-in caching based on image path.
            if (!this.playerdied) {

                switch (this.level) {
                    case 1:
                        this.background = new ig.Image('media/backdrop.png');
                        break;
                    case 2:
                        this.background = new ig.Image('media/backdrop.png#0000FF#000000');
                        break;
                    case 3:
                        this.background = new ig.Image('media/backdrop.png#FF00FF#000000');
                        break;
                    case 4:
                        this.background = new ig.Image('media/backdrop.png#00FFFF#000000');
                        break;
                    case 5:
                        this.background = new ig.Image('media/backdrop.png#C0C0C0#000000');
                        break;
                    case 6:
                        this.background = new ig.Image('media/backdrop.png');
                        break;
                }

            } else {
                this.background = new ig.Image('media/backdrop.png#FF0000#000000');
            }

            //this.background.draw(0, 0);
            var image = this.background.data;
            ig.system.context.drawImage(image, 0, 0, ig.system.width * ig.system.scale, ig.system.height * ig.system.scale);

            if (this.gameOver) {
                gameMain = ig.game;

                if (!isTrial) {
                    ga('send', 'event', 'game', 'complete', 'game over');
                    ig.system.setGame(GameOverScreen);
                } else {
                    ga('send', 'event', 'game', 'trial complete', 'trial game over');
                    ig.system.setGame(GameOverTrialScreen);
                }
                return;
            }

            if (this.gamepaused) {
                gameMain = ig.game;

                if (!isTrial) {
                    ga('send', 'event', 'game', 'pause', 'pause game');
                } else {
                    ga('send', 'event', 'game', 'trial pause', 'pause trial game');
                }

                ig.system.setGame(PauseScreen);
                return;
            }

            this.parent();

            var scoreboardtext = [this.score, 'P' + this.lives, 'L' + this.level];

            this.font.draw(scoreboardtext[0], 0, this.scoreboard.y, ig.Font.ALIGN.LEFT);
            this.font.draw(scoreboardtext[1], (ig.system.width / 2), this.scoreboard.y, ig.Font.ALIGN.LEFT);
            this.font.draw(scoreboardtext[2], ig.system.width, this.scoreboard.y, ig.Font.ALIGN.RIGHT);

        },

        rebindcontrols: function () {

            // Bind keys
            if (ig.ua.mobile) {
                ig.input.bindTouch('#buttonLeft', 'left');
                ig.input.bindTouch('#buttonRight', 'right');
                ig.input.bindTouch('#buttonPause', 'pause');
                ig.input.bindTouch('#buttonHyperSpace', 'hyperspace');

            } else {
                ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
                ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
                ig.input.bind(ig.KEY.SPACE, 'shoot');
                ig.input.bind(ig.KEY.CTRL, 'hyperspace');
                ig.input.bind(ig.KEY.TAB, 'autofire');
                ig.input.bind(ig.KEY.P, 'pause');
            }

        },

        getRandomArbitrary: function (min, max) {
            return Math.random() * (max - min) + min;
        },

        getRandomInt: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        spawnMeteor: function () {
            var x = this.getRandomInt(0, ig.system.width - 32);
            var y = -32;

            ig.game.spawnEntity(EntityMeteor, x, y, { lowSpeed: this.spaceobject.lowspeed, highSpeed: this.spaceobject.highspeed, isLarge: null, slope: null });
        },

        spawnSpinner: function () {
            if (this.spinnercount > 1)
                return;

            this.spinnercount++;

            var x = this.getRandomInt(0, ig.system.width - 12);
            var y = -12;

            ig.game.spawnEntity(EntitySpinner, x, y, { lowSpeed: this.spaceobject.lowspeed, highSpeed: this.spaceobject.highspeed, isLarge: null, slope: null });

        },

        spawnUFO: function () {
            var midy = (ig.system.height / 2) - 32;
            var topy = 32;
            x = (Math.random() >= 0.5) ? -24 : ig.system.width;
            y = this.getRandomInt(topy, midy);

            this.mrflyingobject = ig.game.spawnEntity(EntityUfo, x, y, { lowSpeed: this.spaceobject.lowspeed, highSpeed: this.spaceobject.highspeed, isLarge: null, slope: null });
        },

        spawnGuidedMissle: function () {
            var x = this.getRandomInt(0, ig.system.width - 22);
            var y = -22;

            this.mrflyingobject = ig.game.spawnEntity(EntityGuidedMissile, x, y, { lowSpeed: this.spaceobject.lowspeed, highSpeed: this.spaceobject.highspeed, isLarge: null, slope: null });
        },

        spawnEnemy: function () {
            //set game object at random location outside of top of screen
            var pickobject = Math.random();

            if ((pickobject <= (this.spaceobjectprobs.ufo * this.level)) && (this.level > 3) && (this.mrflyingobject === null)) {
                this.spawnUFO();
            }
            else if ((pickobject <= (this.spaceobjectprobs.guidedmissile * this.level)) && (this.mrflyingobject === null)) {
                this.spawnGuidedMissle();
            }
            else if (pickobject <= (this.spaceobjectprobs.spinner * this.level)) {
                this.spawnSpinner();
            }

            if (this.mrflyingobject === null) {
                this.spawnMeteor();
            }
        }

    });

    BaseScreen = ig.Game.extend({
        screenstate: {
            MISSION: 0,
            CONTROLS: 1,
            HIGH_SCORE: 2,
            CREDITS: 3,
            GAMEOVER: 4
        },
        currscreenstate: 0,
        cycleTimer: null,
        cyclelifetime: 7,
        highscores: null,
        highscoreInitials: null,
        highscoreInitialsIndex: 0,
        highscoreInitialsChars: '',
        highscoreInitialsCharsCycleTimer: null,
        highscoreInitialsCharsCycleDelay: 0.175,
        isCycle: true,
        fadetime: 2,
        statefadeTimer: null,
        statelifetime: 7,
        currteletypecharcount: -1,
        font: new ig.Font('media/annonymous.font.10.white.png'),
        msg: '',
        continueMsg: '',
        titlemsg: '',
        msgfont: new ig.Font('media/annonymous.font.10.white.png'),
        background: new ig.Image('media/splashbackground.png'),
        newhigh: new ig.Sound('sound/NewHigh.*', false),
        init: function () {

            this.continueMsg = ((!isTrial) ? 'Play' : 'Try');

            $('#buttoncontainer').hide();

            $canvas.css({
                position: 'absolute',
                left: '0',
                top: '0',
                right: '0',
                bottom: '0',
                'image-rendering': 'optimizeSpeed',
                '-webkit-interpolation-mode': 'nearest-neighbor'
            });

            if (ig.ua.mobile) {

                $canvas.css({
                    width: window.innerWidth + 'px',
                    height: window.innerHeight + 'px'
                });

            }
            else {

                $canvas.css({
                    margin: 'auto'
                });

            }

            ig.music.add('sound/background_theme.*');

            ig.music.volume = 0.25;
            ig.music.loop = true;
            ig.music.play();

            this.cycleTimer = new ig.Timer(this.cyclelifetime);
            this.statefadeTimer = new ig.Timer();

            this.highscoreInitialsCharsCycleTimer = new ig.Timer(this.highscoreInitialsCharsCycleDelay);

            var i;

            for (i = 65; i < 91; ++i) {
                this.highscoreInitialsChars += String.fromCharCode(i);
            }

            for (i = 48; i < 65; ++i) {
                this.highscoreInitialsChars += String.fromCharCode(i);
            }

            for (i = 32; i < 48; ++i) {
                this.highscoreInitialsChars += String.fromCharCode(i);
            }

            for (i = 91; i < 97; ++i) {
                this.highscoreInitialsChars += String.fromCharCode(i);
            }

            // Bind keys
            if (ig.ua.mobile) {
                ig.input.bindTouch("#canvas", 'start');
            } else {
                ig.input.bind(ig.KEY.P, 'start');
            }
        },
        update: function () {

            var AcceptInitialEntry = (gameMain !== null) && (!isTrial) &&
                                     (this.currscreenstate == this.screenstate.GAMEOVER) &&
                                     (this.highscores !== null) &&
                                     (gameMain.score >= this.highscores[this.highscores.length - 1].Score);

            if (ig.input.pressed('start') && (!AcceptInitialEntry)) {

                this.msgfont.alpha = 1;

                if ((gameMain === null) || (this.currscreenstate == this.screenstate.GAMEOVER)) {

                    if (!isTrial) {
                        ga('send', 'event', 'game', 'play', 'start game');
                    } else {
                        ga('send', 'event', 'game', 'play trial', 'start trial game');
                    }

                    gameMain = null;

                    ig.system.setGame(MeteorBlastGame);
                    gameMain = ig.game;

                } else {
                    gameMain.gamepaused = false;
                    gameMain.rebindcontrols();

                    sizeCanvas();

                    if (!isTrial) {
                        ga('send', 'event', 'game', 'play', 'resume game');
                    } else {
                        ga('send', 'event', 'game', 'play trial', 'resume trial game');
                    }

                    ig.system.resumeGame(gameMain);
                }

                this.parent();

                return;
            }

            if (
                (this.highscores === null) &&
                ((this.currscreenstate == this.screenstate.GAMEOVER) || (this.currscreenstate == this.screenstate.HIGH_SCORE))
               ) {
                this.getHighScores();
            }

            if (AcceptInitialEntry) {

                if (this.isCycle) {
                    this.newhigh.play();
                }

                this.isCycle = false;

                if (ig.input.state('forward') || ig.input.state('backward')) {

                    if (this.highscoreInitialsCharsCycleTimer.delta() > 0) {

                        if (ig.input.state('forward')) {
                            this.highscoreInitials[this.highscoreInitialsIndex].pointer = ((this.highscoreInitials[this.highscoreInitialsIndex].pointer + 1) % this.highscoreInitialsChars.length);
                        } else { //backward
                            this.highscoreInitials[this.highscoreInitialsIndex].pointer--;
                            if (this.highscoreInitials[this.highscoreInitialsIndex].pointer < 0) {
                                this.highscoreInitials[this.highscoreInitialsIndex].pointer = (this.highscoreInitialsChars.length - 1);
                            }
                        }

                        this.highscoreInitials[this.highscoreInitialsIndex].char = this.highscoreInitialsChars[this.highscoreInitials[this.highscoreInitialsIndex].pointer];

                        this.highscoreInitialsCharsCycleTimer.set(this.highscoreInitialsCharsCycleDelay);

                    }
                }

                if (ig.input.pressed('select')) {

                    this.highscoreInitialsIndex = (this.highscoreInitialsIndex + 1) % this.highscoreInitials.length;

                }

                if (ig.input.pressed('end')) {

                    //Save High Score and resume cycling through HUDs
                    var a = new Array();

                    $.each(this.highscoreInitials, function (i, item) {
                        a.push(item.char);
                    });

                    var initials = a.join('');
                    var playerStats = { Tag: initials, Score: gameMain.score };
                    Dataservice.insertPlayerStats(playerStats, null, null);

                    ga('send', 'event', 'game', 'score', 'high score', gameMain.score);

                    this.currscreenstate = this.screenstate.HIGH_SCORE;

                    this.highscores = null; //preps highscores for reload

                    this.cycleTimer.set(this.cyclelifetime);
                    this.statefadeTimer.reset();

                    this.isCycle = true;

                }

            }

            if (this.isCycle) {
                if (this.cycleTimer.delta() > 0) {

                    ga('send', 'event', 'HUD', 'show', Object.keys(this.screenstate)[this.currscreenstate]);

                    if (this.currscreenstate == this.screenstate.GAMEOVER) {
                        this.currscreenstate = this.screenstate.MISSION;
                    }
                    else {
                        this.titlemsg = '';
                        this.currscreenstate++;
                    }

                    this.currscreenstate %= (this.screenstate.GAMEOVER);

                    this.cycleTimer.set(this.cyclelifetime);
                    this.statefadeTimer.reset();
                }
                else {
                    this.msgfont.alpha = this.statefadeTimer.delta().map(this.statelifetime - this.fadetime, this.statelifetime, 1, 0);
                }
            }

            this.parent();
        },
        draw: function () {
            this.parent();

            //this.background.draw(0, 0);
            var image = this.background.data;
            ig.system.context.drawImage(image, 0, 0, ig.system.width * ig.system.scale, ig.system.height * ig.system.scale);

            if (ig.ua.mobile) {
                this.font.draw('Touch Screen to ' + this.continueMsg, (ig.system.width / 2), (ig.system.height - 10), ig.Font.ALIGN.CENTER);
            } else {
                this.font.draw('Press P to ' + this.continueMsg, (ig.system.width / 2), (ig.system.height - 10), ig.Font.ALIGN.CENTER);
            }

            if ((this.isCycle) && (this.statefadeTimer.delta() > this.statelifetime)) {
                return;
            }

            switch (this.currscreenstate) {
                case this.screenstate.MISSION:
                    this.displayMission();
                    break;

                case this.screenstate.CONTROLS:
                    this.displayControls();
                    break;

                case this.screenstate.HIGH_SCORE:
                    this.displayHighScore(false);
                    break;

                case this.screenstate.CREDITS:
                    this.displayCredits();
                    break;

                case this.screenstate.GAMEOVER:
                    this.displayGameOver();
                    break;

            }

            this.msgfont.draw(this.titlemsg, (ig.system.width / 2), 45, ig.Font.ALIGN.CENTER);
            this.msgfont.draw(this.msg, (ig.system.width / 2) - (this.msgfont.widthForString(this.msg) / 2), (ig.system.height / 2) - (this.msgfont.heightForString(this.msg) / 2), ig.Font.ALIGN.LEFT);
        },
        displayGameOver: function () {

            if (!isTrial) {
                this.displayHighScore(true);
            } else {
                this.msg = 'Thank you for trying MeteorBlast!\n\nPlease support us by purchasing\nat any major mobile app store.';
            }

        },
        getHighScores: function () {
            var ctx = this;
            this.highscoreInitials = new Array({ char: '_', pointer: this.highscoreInitialsChars.length - 1 }, { char: '_', pointer: this.highscoreInitialsChars.length - 1 }, { char: '_', pointer: this.highscoreInitialsChars.length - 1 }, { char: '_', pointer: this.highscoreInitialsChars.length - 1 });
            this.highscoreInitialsIndex = 0;

            if (window.navigator.onLine) {
                Dataservice.getTopScores(function (data) {
                    ctx.highscores = data.d;
                }, null);
            }
        },
        displayMission: function () {

            if (!isTrial) {
                this.titlemsg = 'Your Mission\n\n';
            }
            else {
                this.titlemsg = 'Your Trial Mission\n\n';
            }

            this.msg = 'Use your rapid-fire photons &\nhyper-space drive to repel & dodge\nalien saucers, guided missiles,\nfalling meteors & nuclear bombs\nto save the Earth!';
        },
        displayControls: function () {
            if (!(this instanceof PauseScreen)) {
                this.titlemsg = 'Game Controls\n\n';
            }

            if (!ig.ua.mobile) {
                this.msg = 'Left Arrow key....: Move Left\nRight Arrow key...: Move Right\nSpace bar.........: Fire\nCTRL key..........: HyperSpace\nTAB key...........: AutoFire\nP key.............: Pause Game';
            } else {
                this.msg = 'Left Arrow button....: Move Left\nRight Arrow button...: Move Right\nPlay button..........: HyperSpace\nStop button..........: Pause Game\n\n*AutoFire on always';
            }
        },
        displayHighScore: function (isGameOver) {
            this.titlemsg = '';
            this.msg = '';
            var ctx = this;

            if (
                (window.navigator.onLine) &&
                (gameMain !== null) &&
                (isGameOver) &&
                ((this.highscores !== null) && (gameMain.score >= this.highscores[this.highscores.length - 1].Score))
                ) {

                this.titlemsg = "You set a New High Score!\n\n";
                this.titlemsg += 'Enter your Initials\n';

                if (!ig.ua.mobile) {
                    this.msg = '\n\n\nRight Arrow key..: Cycle Forward\nLeft Arrow key...: Cycle Backwards\nSpace bar........: Select Char.\nCTRL key.........: End';
                } else {
                    this.msg = '\n\n\nRight Arrow button..: Cycle Forward\nLeft Arrow button...: Cycle Backwards\nPlay button.........: Select\nStop button.........: End';
                }

                var a = new Array();

                $.each(this.highscoreInitials, function (i, item) {
                    a.push(item.char);
                });

                var initials = a.join(' ') + '\n';

                a.length = 0;

                $.each(this.highscoreInitials, function (i, item) {
                    a.push(' ');
                });

                a[this.highscoreInitialsIndex] = '^';

                initials += a.join(' ');

                this.msgfont.draw(initials, (ig.system.width / 2), (ig.system.height / 2.25) - (this.msgfont.heightForString(initials) / 2.25), ig.Font.ALIGN.CENTER);

            }
            else {

                this.titlemsg = 'Top ' + TOP_SCORES.toString() + ' Blasters!\n\n';

                if (ctx.highscores != null) {

                    $.each(ctx.highscores, function (i, item) {
                        ctx.msg += ((i + 1).toString() + '.').rpad(" ", 3) + item.Tag.toString().lpad(" ", 5) + item.Score.toString().lpad(" ", 10) + '\n';
                    });

                } else if (!window.navigator.onLine) {

                    ctx.msg = 'Could not retrieve.\nNo internet connection detected.';

                }
            }
        },
        displayCredits: function () {
            this.titlemsg = 'by CodeBridge Software, Inc. 2014\n';
            //this.msg = 'CodeBridge Software, Inc. 2014\nBased on ASTROSMASH\nfor Intellivision\nby Mattel Electronics 1981';
            this.msg = 'Artwork by: Project Marlene\nSounds by:\nsoundbible.com & freesound.org\nThanks to Mark DiAngelo,\nSerithi, fins, tigersound,\njuskiddink, Deganoth, KIZILSUNGUR,\nbullshit99, lavik89,\nzimbot & NenadSimic';
        },
        kill: function () {
            ig.music.stop();
            this.parent();
        }
    });

    StartupScreen = BaseScreen.extend({
        init: function () {
            this.parent();
            this.currscreenstate = 0;
            this.isCycle = true;
        }
    });

    PauseScreen = BaseScreen.extend({
        init: function () {
            this.parent();

            this.continueMsg = 'Resume';

            if (isTrial) {
                this.continueMsg += ' Trial';
                this.titlemsg = '-- Game Trial Paused --\nGame Controls\n\n';
            }
            else {
                this.titlemsg = '-- Game Paused --\nGame Controls\n\n';
            }

            this.currscreenstate = this.screenstate.CONTROLS;
            this.isCycle = false;
        }
    });

    GameOverScreen = BaseScreen.extend({
        init: function () {
            this.parent();
            this.titlemsg = '-- Game Over --\nHigh Scores\n\n';
            this.continueMsg = 'Play again';
            this.currscreenstate = this.screenstate.GAMEOVER;

            // Bind keys
            if (ig.ua.mobile) {
                ig.input.bindTouch('#buttonRight', 'forward');
                ig.input.bindTouch('#buttonLeft', 'backward');
                ig.input.bindTouch('#buttonHyperSpace', 'select');
                ig.input.bindTouch('#buttonPause', 'end');

            } else {
                ig.input.bind(ig.KEY.RIGHT_ARROW, 'forward');
                ig.input.bind(ig.KEY.LEFT_ARROW, 'backward');
                ig.input.bind(ig.KEY.SPACE, 'select');
                ig.input.bind(ig.KEY.CTRL, 'end');
            }

        }
    });

    GameOverTrialScreen = BaseScreen.extend({
        init: function () {
            this.parent();
            this.titlemsg = '-- Game Trial Over --\n\n';
            this.continueMsg = 'Try again';
            this.currscreenstate = this.screenstate.GAMEOVER;
            this.isCycle = false;
        }
    });

    var qs = (function (a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i) {
            var p = a[i].split('=', 2);
            if (p.length == 1)
                b[p[0]] = "";
            else
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'));

    var gameMain = null; //Holds instance of instantiated game for use when game is paused/unpaused
    var isTrial = !(qs['r'] || (qs['r'] == '')); //no trial flag; if found regardless of value, play normally otherwise play as trial

    var $canvas = $('#canvas');
    var framepersec = (!ig.ua.mobile) ? 60 : 30;

    var scale = function () {
        return Math.max(1, Math.round((window.innerWidth / 320) * 4 / 4));
    };

    var sizeCanvas = function () {

        // We want to run the game in "fullscreen", so let's use the window's size
        // directly as the canvas' style size.

        var bShowButtons = ((ig.ua.mobile) && (gameMain != null && !gameMain.gamepaused));

        if (bShowButtons) {
            $('#buttoncontainer').show();
        } else {
            $('#buttoncontainer').hide();
        }

        if (ig.ua.mobile) {

            // We want to run the game in "fullscreen", so let's use the window's size
            // directly as the canvas' style size.
            $canvas.css({
                width: window.innerWidth + 'px',
                height: window.innerHeight + ((bShowButtons) ? -64 : '') + 'px',
                'image-rendering': 'optimizeSpeed',
                '-webkit-interpolation-mode': 'nearest-neighbor'
            });

        }

    };

    var checkOrientation = function () {
        // If the game hasn't started yet, there's nothing to do here
        if (!ig.system) { return; }

        sizeCanvas();

        // resize  all bitmap assets
        var res = ig.resources;

        res.forEach(function (img) {
            img.resize();
        });

        //        var width = Math.floor(window.innerWidth / ig.system.scale);
        //        var height = Math.floor(window.innerHeight / ig.system.scale);

        //        ig.system.resize(width, height);

        ig.system.resize(320, 240, scale());
    };

    function addEvent(element, evnt, funct) {
        if (element.attachEvent)
            return element.attachEvent('on' + evnt, funct);
        else
            return element.addEventListener(evnt, funct, false);
    }

    //pads left
    String.prototype.lpad = function (padString, length) {
        var str = this;
        while (str.length < length)
            str = padString + str;
        return str;
    };

    //pads right
    String.prototype.rpad = function (padString, length) {
        var str = this;
        while (str.length < length)
            str = str + padString;
        return str;
    };

    if (ig.ua.mobile) {

        // Bind keys

        addEvent(window.document, 'load', function (e) {
            window.scrollTo(0, 0);
        });

        addEvent(window.document, 'touchmove', function (e) {
            // Prevent scrolling on this element
            e.preventDefault();
            window.scrollTo(0, 0);
            return false;
        });

        if (window.innerWidth > 212) {

            var pad = Math.floor((window.innerWidth - 212) / 3);

            if (pad > 16) {

                $(".button").each(function (index) {

                    var $but = $(this);
                    var currpos = 0;

                    if (index == 1) {

                        currpos = parseInt($but.css('left'));
                        currpos += 16;
                        $but.css({ 'left': currpos });
                    }
                    else if (index == 2) {
                        currpos = parseInt($but.css('right'));
                        currpos += 16;
                        $but.css({ 'right': currpos });
                    }

                });

            }

        }

        var orientationEvent = ("onorientationchange" in window) ? "orientationchange" : "resize";

        // Listen to resize and orientationchange events
        addEvent(window, orientationEvent, function () {
            
            setTimeout(function () {
                checkOrientation();
            }, 500);

        });

    }

    //        // If we're running on a mobile device and not within Ejecta, disable 
    //        // sound completely :(
    //        if (!window.ejecta) {
    //            ig.Sound.enabled = false;
    //        }

    if (ig.ua.mobile) {
        ig.main('#canvas', StartupScreen, framepersec, 320, 240, scale(), ig.ImpactSplashLoader);

    } else {

        $canvas.css({
            position: 'absolute',
            left: '0',
            right: '0',
            top: '0',
            bottom: '0',
            margin: 'auto'
        });

        ig.System.scaleMode = ig.System.SCALE.CRISP;
        ig.main('#canvas', StartupScreen, framepersec, 320, 240, 2, ig.ImpactSplashLoader);
    }

});