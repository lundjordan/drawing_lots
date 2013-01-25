$(function(){

var DrawLots = {};

// Models
DrawLots.Entrant = Backbone.Model.extend({
    defaults: function() {
        return {
            name: '',
            winner: false
        }
    }
});
/////

///// Collections
DrawLots.EntrantList = Backbone.Collection.extend({
    model: DrawLots.Entrant,
    localStorage: new Backbone.LocalStorage("backbone-drawing-lots")

});
DrawLots.entrants = new DrawLots.EntrantList;
/////

///// Views
DrawLots.EntrantView = Backbone.View.extend({
    tagname: "li",
    template: _.template($('#entrant-template').html()),

    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }

});


DrawLots.EntrantListView = Backbone.View.extend({
    tagName: 'section',
    className: 'drawing-lots',
    template: _.template($('#drawing-lots-template').html()),

    events: {
        /* "keypress #new-entrant": "createOnEnter" */
        "submit #new-entry": "createOnSubmit"
    },

    initialize: function() {
        this.input = this.$("#new-entry-name");
        this.listenTo(DrawLots.entrants, 'add', this.addOne);
        this.listenTo(DrawLots.entrants, 'reset', this.addAll);
        DrawLots.entrants.fetch();
    },

    render: function() {
        this.$el.html(this.template({}));
        return this;
    },

    addOne: function(entrant) {
        var view = new DrawLots.EntrantView({model: entrant});
        this.$("#entries").append(view.render().el);
    },

    addAll: function() {
        DrawLots.entrants.each(this.addOne, this);
    },

    createOnSubmit: function() {
        if (e.keyCode != 13) return;
        if (!this.input.val()) return;

        DrawLots.entrants.create({title: this.input.val()});
        this.input.val('');
    }

});

DrawLots.mainView = new DrawLots.EntrantListView;


///// Routers
DrawLots.Router = Backbone.Router.extend({
    routes: {
        '': 'home'
    },

    initialize: function() {
        this.MainView = new DrawLots.EntrantListView;
    },

    home: function() {
        $('#container').empty();
        $('#container').append(this.MainView.render().el);
    }
});


    DrawLots.router = new DrawLots.Router();
    Backbone.history.start();
/* }); */

});
