var Tunes = Tunes || {};

Tunes.Album = Backbone.Model.extend({

    isFirstTrack: function(index) {
        return (index == 0);
    },

    isLastTrack: function(index) {
        return (index == (this.get('tracks').length -1));
    },

    trackUrlAtIndex: function(index) {
        if (this.get('tracks').length >= index) {
            return this.get('tracks')[index].url;
        }
        return null;
    },

});

Tunes.Albums = Backbone.Collection.extend({
    model: Tunes.Album,
    url: '/albums',
});

Tunes.Playlist = Tunes.Albums.extend({

    isFirstAlbum: function(index) {
        return (index == 0);
    },

    isLastAlbum: function(index) {
        return (index == (this.models.length -1));
    },

});

Tunes.Player = Backbone.Model.extend({

    defaults: {
        'currentAlbumIndex': 0,
        'currentTrackIndex': 0,
        'state': 'stop'
    },

    initialize: function() {
        this.playlist = new Tunes.Playlist();
    },

    reset: function() {
        this.set({
            'currentAlbumIndex': 0,
            'currentTrackIndex': 0,
            'state': 'stop'
        });
    },

    play: function() {
        this.set({'state': 'play'});
    },

    pause: function() {
        this.set({'state': 'stop'});
    },

    isPlaying: function() {
        return (this.get('state') == 'play');
    },

    isStopped: function() {
        return (!this.isPlaying());
    },

    currentAlbum: function() {
        return this.playlist.at(this.get('currentAlbumIndex'));
    },

    currentTrackUrl: function() {
        album = this.currentAlbum();
        if (album) {
            return album.trackUrlAtIndex(this.get('currentTrackIndex'));
        }
        else {
            return null;
        }
    },

    nextTrack: function() {
        var currentAlbumIndex = this.get('currentAlbumIndex'),
        currentTrackIndex = this.get('currentTrackIndex');
        if (this.currentAlbum().isLastTrack(currentTrackIndex)) {
            if (this.playlist.isLastAlbum(currentAlbumIndex)) {
                this.set({'currentAlbumIndex': 0});
            }
            else {
                this.set({'currentAlbumIndex': currentAlbumIndex + 1});
            }
            this.set({'currentTrackIndex': 0});
        }
        else {
            this.set({'currentTrackIndex': currentTrackIndex + 1});
        }
    },

    prevTrack: function() {
        var currentAlbumIndex = this.get('currentAlbumIndex'),
        currentTrackIndex = this.get('currentTrackIndex'),
        prevAlbumLastTrackIndex;

        if (this.currentAlbum().isFirstTrack(currentTrackIndex)) {
            if (this.playlist.isFirstAlbum(currentAlbumIndex)) {
                this.set({'currentAlbumIndex': this.playlist.models.length -1});
            }
            else {
                this.set({'currentAlbumIndex': currentAlbumIndex - 1});
            }
            prevAlbumLastTrackIndex = this.currentAlbum().get('tracks').length - 1
            this.set({'currentTrackIndex': prevAlbumLastTrackIndex});
       }
       else {
            this.set({'currentTrackIndex': currentTrackIndex -1});
       }
    },
});



Tunes.library = new Tunes.Albums();
Tunes.player = new Tunes.Player();

Tunes.AlbumView = Backbone.View.extend({

    tagName: 'li',
    className: 'album',

    initialize: function() {
        _.bindAll(this, 'render');
        this.model.on('change', this.render);
        this.template = _.template($('#album-template').html());
    },

    render: function() {
        var renderedContent = this.template(this.model.toJSON());
        $(this.el).html(renderedContent)
        return this;
    }

});

Tunes.LibraryAlbumView = Tunes.AlbumView.extend({

    events: {
        'click .queue.add': 'select'
    },

    select: function() {
        this.model.collection.trigger('select', this.model);
    },

});

Tunes.PlaylistAlbumView = Tunes.AlbumView.extend({
    events: {
        'click .queue.remove': 'removeFromPlaylist'
    },

    initialize: function() {
        _.bindAll(this, 'render', 'remove', 'updateState', 'updateTrack');
        this.player = this.options.player;
        this.playlist = this.options.playlist;
        this.template = _.template($('#album-template').html());
        this.model.on('remove', this.remove);
        this.player.on('change:state', this.updateState);
        this.player.on('change:currentTrackIndex', this.updateTrack);
    },

    removeFromPlaylist: function() {
        this.playlist.remove(this.model);
        this.player.reset();
    },

    updateState: function() {
        var isCurrentAlbum = (this.player.currentAlbum() === this.model);
        $(this.el).toggleClass('current', isCurrentAlbum);
    },

    updateTrack: function() {
        var isCurrentAlbum = (this.player.currentAlbum() === this.model),
        isCurrentTrack;
        if (isCurrentAlbum) {
            currentTrack = this.player.get('currentTrackIndex');
            this.$('li').each(function(index, el, player) {
                $(el).toggleClass('current', currentTrack === index);
            });
        }
        this.updateState();
    }
});

Tunes.PlaylistView = Backbone.View.extend({
    tagName: 'section',
    className: 'playlist',

    events: {
        'click .play': 'play',
        'click .pause': 'pause',
        'click .prev': 'prevTrack',
        'click .next': 'nextTrack'
    },

    initialize: function() {
        _.bindAll(this, 'render', 'queueAlbum', 'renderAlbum', 'updateState', 'updateTrack');
        this.template = _.template($('#playlist-template').html());
        this.audio = new Audio();
        this.player = this.options.player;
        this.library = this.options.library;
        this.collection.on('reset', this.render);
        this.library.on('select', this.queueAlbum);
        this.collection.on('add', this.renderAlbum);
        this.player.on('change:state', this.updateState);
        this.player.on('change:currentTrackIndex', this.updateTrack);
    },

    render: function() {
        $(this.el).html(this.template(this.player.toJSON()));
        this.collection.each(this.renderAlbum);
        this.updateState();
        return this;
    },

    queueAlbum: function(album) {
        this.collection.add(album);
    },

    renderAlbum: function(album) {
        var view = new Tunes.PlaylistAlbumView({
            model: album,
            player: this.player,
            playlist: this.collection
        });
        this.$('ul').append(view.render().el);
    },

    updateState: function() {
        this.updateTrack();
        this.$('button.play').toggle(this.player.isStopped());
        this.$('button.pause').toggle(this.player.isPlaying());
    },

    updateTrack: function() {
        this.audio.src = this.player.currentTrackUrl();
        if (this.player.isPlaying()) {
            this.audio.play();
        }
        else {
            this.audio.pause();
        }
    },

    play: function() {
        this.player.play();
    },

    pause: function() {
        this.player.pause();
    },

    prevTrack: function() {
        this.player.prevTrack();
    },

    nextTrack: function() {
        this.player.nextTrack();
    }

});

Tunes.LibraryView = Backbone.View.extend({
    tagName: 'section',
    className: 'library',

    initialize: function() {
        _.bindAll(this, 'render');
        this.collection.on('reset', this.render);
        this.template = _.template($('#library-template').html())
    },

    render: function() {
        var albums, collection = this.collection;
        $(this.el).html(this.template({}));
        albums = this.$('.albums');
        collection.each(function(album) {
            view = new Tunes.LibraryAlbumView({model: album});
            albums.append(view.render().el);
        });
        return this;
    },

});

Tunes.Router = Backbone.Router.extend({

    routes: {
        '': 'home',
        'blank': 'blank',
    },

    initialize: function() {
        this.libraryView = new Tunes.LibraryView({
            collection: Tunes.library
        });
        this.playlistView = new Tunes.PlaylistView({
            collection: Tunes.player.playlist,
            player: Tunes.player,
            library: Tunes.library
        });
    },

    home: function() {
        container = $('#container');
        container.empty();
        container.append(this.playlistView.render().el);
        container.append(this.libraryView.render().el);
    },

    blank: function() {
        container = $('#container');
        container.empty();
        container.text('blank');
    },

});

$(function() {
    Tunes.library.fetch();
    Tunes.router = new Tunes.Router();
    Backbone.history.start();
});


