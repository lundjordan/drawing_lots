var DrawLots = DrawLots || {}; // create a global object for a namespace

// Models
// manages what an individual model looks like (its validity, behaviour, properties)
// fires events when the model's data is modified
DrawLots.Entrant = Backbone.Model.extend({

    defaults: function() {
        return {
            name: '',
            winner: false,
            isRecentWinner: false // used for highlight purposes from sample.html
        }
    },

    makeNewWinner: function() {
        this.save({winner: true, isRecentWinner: true});
    },

    setAsPastWinner: function() {
        this.save({isRecentWinner: false});
    }

});
/////

///// Collections
// as it suggests, manages a collection/list of individual models
// ie, fetching model data from a DB (client or server) andfiring events
// when the collection changes. It also can describe functionality for the
// collection
DrawLots.EntrantList = Backbone.Collection.extend({
    model: DrawLots.Entrant,
    localStorage: new Backbone.LocalStorage("backbone-drawing-lots"),
    // using local storage so no server/backend needed

    notDrawn: function () {
        return this.where({winner: false});
    },

    resetRecentWinners: function() {
        this.each(function(entrant) {
            if (entrant.get('isRecentWinner') === true) {
                entrant.setAsPastWinner();
            }
        });
    }

});
DrawLots.entrants = new DrawLots.EntrantList;
/////

///// Views:
//in charge of what content the user sees based upon the view's root tag(el)
//and it's content (sometimes that content is from a script template).
//Views are often affiliated with models/collections and get notified of changes.
//Views can listen for user events (like clicking a form submit button).
DrawLots.EntrantView = Backbone.View.extend({ // this view represents a single Entrant
    tagName: "li", // here this view will be surrounded by an li tag
    template: _.template($('#entrant-template').html()),
    // inside the li tag will be filled with the script from index.html
    // with ID as entrant-template

    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
        // listen to changes from the model that is affiliated with this View
        // upon instantiation. Call render() when this event is fired
    },

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
        "submit #new-entry": "createOnSubmit",
        // call createOnSubmit when the form with new-entry ID is submitted
        "click #draw": "pickRandomNotDrawnEntrant"
    },

    initialize: function() {
        this.listenTo(DrawLots.entrants, 'add', this.addOne);
        this.listenTo(DrawLots.entrants, 'reset', this.addAll);
        /* this.listenTo(DrawLots.entrants, 'all', this.render); */
        // attach this view to the entrants collection and sign this view up
        // for 'add' and 'reset' changes. addOne and addAll will be called
        // respectively on the evnt
        DrawLots.entrants.fetch();
        // fetch says to grab  all the entrants from the DB and add it to
        // collection
        // in this case, this is from the browsers localStorage
    },

    render: function() { // just the same as the single entrant View but I am not passing 
                        // any params as I have no <%= %> tags needed to be filled
        this.$el.html(this.template({}));
        this.addAll(); // I am calling addAll() here to populate the <ul> entries
        return this;
    },

    addOne: function(entrant) {
        var view = new DrawLots.EntrantView({model: entrant});
        this.$("#entries").append(view.render().el);
        // this method is called because of listenTo() in initialize()
        // 1) create a new EntrantView
        // 2) render that view and add that view into the <ul> list 
    },

    addAll: function() {
        DrawLots.entrants.each(this.addOne, this);
        // this method is called because of listenTo() in initialize()
        // for each entrant in the collection, add it to the <ul> list
        // with addOne() function
    },

    createOnSubmit: function(event) {
        event.preventDefault();
        console.log('made it here');
        this.createEntrant();
    },

    createEntrant: function() {
        this.clearWarnings();
        var input = $("#new-entry-name"); //grab the textfield for value reference
        if (!input.val()) {
            /* alert("please provide a name for entrant"); */
            return this.warn("#newEntrantWarning", "please provide a name for entrant");
        }
        DrawLots.entrants.create({name: input.val()});
        input.val('').focus();
        // the bread and butter. XXX read every other comment first
        // 1) called on form submit, see events: <- above
        // 2) takes the value in the textfield and creates a new model
        // 3) adds that model (Entrant) to the Entrants collection
        // 4) this changes the entrants collection which fires an 'add'
        // event.
        // 5) since this view is listening to those events (see listenTo()
        // above), the addOne() function is called and the view is updated!!
        // -- simply beautiful!!
    },

    pickRandomNotDrawnEntrant: function() {
        this.clearWarnings();
        if (DrawLots.entrants.size() == 0) {
            /* alert("You must create an entrant first!"); */
            return this.warn("#drawWarning", "You must create an entrant first!");
        }
        luckyEntrant = _.shuffle(DrawLots.entrants.notDrawn())[0];
        if (!luckyEntrant) {
            /* alert("Every entrant has been drawn!"); */
            return this.warn("#drawWarning", "Every entrant has been drawn!");
        }
        DrawLots.entrants.resetRecentWinners();
        luckyEntrant.makeNewWinner();
    },

    clearWarnings: function() {
        $('#newEntrantWarning').hide();
        $('#drawWarning').hide();
    },


    warn: function(warnType, message) {
        $(warnType).html(message).fadeOut(100)
        $(warnType).html(message).fadeIn(400)
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

$(function(){
    DrawLots.router = new DrawLots.Router(); // instantiate a router
    Backbone.history.start(); // kick it all off!!
});
