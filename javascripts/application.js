
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

    initialize: function() {
        DrawLots.entrants.fetch();
    },

    render: function() {
        this.$el.html(this.template({}));
        return this;
    },

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

$(function(){

    DrawLots.router = new DrawLots.Router();
    Backbone.history.start();

});
