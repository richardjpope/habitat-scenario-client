$(document).ready( function(){

  //Helpers
  var backboneSync = Backbone.sync;
    Backbone.sync = function (method, model, options) {
        options.headers = {
            'Authorization': 'Bearer ' + localStorage.getItem("access_token")
        };
        backboneSync(method, model, options);
    };

  var is_authorized = function(){
    return localStorage.getItem("access_token") === null;
  }

  // Models
  var Scenario = Backbone.Model.extend({

    defaults: function() {
      return {
        code: ""
      }
    }
  });

  var Plugin = Backbone.Model.extend({
  defaults: function() {
      return {

      }
    }
  });

  //Collections
  var ScenarioCollection = Backbone.Collection.extend({
      model:Scenario,
      url:localStorage.getItem('habitat_server_url') + "/scenarios"
  });

  var PluginCollection = Backbone.Collection.extend({
      model:Plugin,
      url:localStorage.getItem('habitat_server_url') +"/plugins"
  });

  // Views
  var ScenarioListView = Backbone.View.extend({

    el: $('#main'),

    initialize:function () {
        this.model.bind("reset", this.render, this);
    },

    render:function (eventName) {
        var list = $('<ul class="item-list">')
        var item_template = _.template($('#tpl-scenario-read').html());

        _.each(this.model.models, function (scenario) {
            var data = scenario.toJSON();
            $(list).append(item_template(data));
        }, this);

        $(this.el).append(list);
    }

  });

  var ScenarioView = Backbone.View.extend({

     el: $('#main'),

    initialize:function () {
        this.model.bind("reset", this.render, this);
        this.render();
    },

    template:_.template($('#tpl-scenario-edit').html()),

     events: {
      "click .save"   : "save",
      "click .delete"   : "delete",
    },

    render:function (eventName) {

        $(this.el).html(this.template(this.model.toJSON()));
        this.codeMirror = CodeMirror.fromTextArea(document.getElementById('editor').children[0]);
        this.codeMirror.focus()

    },

    save: function (){
       this.model.save({code: this.codeMirror.getValue()});
    },

    cancel: function(){
      window.location = '/';
    },

    delete: function(){
      this.model.destroy();
      this.remove();
      window.location = '/';
    }

  });

  var PluginView = Backbone.View.extend({

    el: $('#secondary'),

    initialize:function () {
      this.render();
    },

    template:_.template($('#tpl-plugins').html()),

    render:function (eventName) {
      $(this.el).html(this.template({plugins: this.collection.toJSON()}));
    },

  });

  var AuthorizeView = Backbone.View.extend({

    el: $('#main'),

    initialize:function () {
      this.render();
    },

    template:_.template($('#tpl-authorize').html()),

    events: {
     "click .authorize button"   : "authorize",
    },

    render:function (eventName) {
      $(this.el).html(this.template());
    },

    authorize: function (){

      //get server url and store for later
      var url = $('.authorize input').val();
      localStorage.setItem("habitat_server_url", url)

      //build auth url
      var redirect_uri = '' + window.location;
      var auth_url = localStorage.getItem('habitat_server_url') +
      "/oauth/authorize" +
      "?response_type=token" +
      "&client_id=" + client_id +
      "&scope=scenarios" +
      "&redirect_uri=" + encodeURIComponent(redirect_uri);

      window.location.assign(auth_url);
      return false;
    },

  });

  var SettingsView = Backbone.View.extend({

    el: $('#main'),

    initialize:function () {
      this.render();
    },

    template:_.template($('#tpl-settings').html()),

    events: {
     "click .reset button"   : "reset",
    },

    render:function (eventName) {
      $(this.el).html(this.template());
    },

    reset: function (){
      localStorage.clear();
      window.location = '/';
      return false;
    },

  });


  // Router
  var AppRouter = Backbone.Router.extend({

      routes:{
          "":"list",
          "settings":"settings",
          "scenario/new":"add",
          "scenario/:id":"edit",
      },

      initialize:function() {
        this.scenarioList = new ScenarioCollection();
        this.scenarioList.fetch({reset: true});

        this.pluginList = new PluginCollection();
        this.pluginList.fetch({reset: true});
      },

      list:function () {
          if (is_authorized()) {
            this.authorizeView = new AuthorizeView();
          }else{
            this.scenarioListView = new ScenarioListView({model:this.scenarioList});
          }
          //$('#main').html(this.scenarioListView.render().el);
      },

      settings:function () {

          this.authorizeView = new SettingsView();
      },

      edit:function (id) {
          this.scenario = this.scenarioList.get(id);
          this.scenarioView = new ScenarioView({model:this.scenario});
          this.pluginView = new PluginView({collection:this.pluginList});
      },

      add:function () {
          this.scenario = new Scenario();
          this.scenarioList.add(this.scenario);
          this.scenarioView = new ScenarioView({model:this.scenario});
      }
  });

  var client_id = 'djklsadjklsads7a897d9s8dsa';
  // var endUserAuthorizationEndpoint = authHost + "/oauth/authorize";

  hash = document.location.hash
  var match = hash.match(/access_token=(\w+)/);
  if (!!match){
    localStorage.setItem("access_token", match[1])
    window.location = '/';
  }

  var app = new AppRouter();
  Backbone.history.start();


});
