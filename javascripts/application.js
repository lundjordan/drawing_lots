$(function(){

    var DrawLots = DrawLots || {}; // create a global object for a namespace

    // Models
    // manages what an individual model looks like (its validity, behaviour, data)
    // fires events when the model's data updates
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
    // as it sugests, manages a collection/list of individual models
    // ie, fetching model data from a DB (client or server), and firing events
    // when the collection changes
    DrawLots.EntrantList = Backbone.Collection.extend({
        model: DrawLots.Entrant,
        localStorage: new Backbone.LocalStorage("backbone-drawing-lots")
        // using local storage so no server/backend needed

    });
    DrawLots.entrants = new DrawLots.EntrantList;
    /////

    ///// Views:
    //in charge of what content the user sees based upon the view's
    //template and the collection/model data affliated with it. It also can attach
    //itself to models/collections and get notified of changes. In addition, it
    //will listen for user events (like clicking a form submit button). This can be
    //an event where the view has a chance to manipulate itself
    DrawLots.EntrantView = Backbone.View.extend({ // this view represents a single Entrant
        tagname: "li", // here this view will be surrounded by an li tag
        template: _.template($('#entrant-template').html()),
        // inside the li tag will be filled with the script from index.html
        // with ID as entrant-template

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            // actually fills the li tag and says to will in <%= tags to use the
            // model's (Entrant) properties
            return this; // returning this so that I can use this method for chaining
            // eg: this.$("#entries").append(view.render().el); <- notice render
            // returns the view and so I can 1) render this view and then return
            // the el property. In this case el is the <li> tag and all its
            // contents from the template (script)
        }

    });


    DrawLots.EntrantListView = Backbone.View.extend({ // this view represents the view of all Entrants
        tagName: 'section',
        className: 'drawing-lots',
        template: _.template($('#drawing-lots-template').html()),
        // this template (script from index.html) will contain the form with submit button,
        // the draw winner button, and all the entrants when they are persisted

        events: {
            "submit #new-entry": "createOnSubmit"
        },

        initialize: function() {
            this.input = this.$("#new-entry-name");
            this.listenTo(DrawLots.entrants, 'add', this.addOne);
            this.listenTo(DrawLots.entrants, 'reset', this.addAll);
            DrawLots.entrants.fetch();
            // fetch says to grab  all the entrants from the collection
            // in this case, this is from the browsers localStorage
        },

        render: function() { // just the same as the single entrant View but I am not passing 
                            // any params as I have no <%= %> tags needed to be filled
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

    ///// Routers
    //// allows for a convenient way to manage which views should be shown and
    // how they are shown based upon a by specific URL
    DrawLots.Router = Backbone.Router.extend({
        routes: {
            '': 'home' // when I am at the root, call the 'home' method below
        },

        initialize: function() {
            this.MainView = new DrawLots.EntrantListView; 
            // upon this router instantiation, instantiate a EntrantsListView
        },

        home: function() {
            $('#container').empty();
            $('#container').append(this.MainView.render().el);
        }
    });

        DrawLots.router = new DrawLots.Router(); // instantiate a router
        Backbone.history.start(); // kick it all off!!

});
