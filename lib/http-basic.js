
var util = require("util");
var EE = require("events").EventEmitter;
var express = require("express");
var bodyParser = require("body-parser");

function HttpBasicAdapter(){
  EE.call(this);
  this.interface = "http-basic";
  this.protocol = "http-basic";
  this.defaults = {
    port:8880
  };

  this._server = null;
  this.messages = {};
}

util.inherits(HttpBasicAdapter, EE);

HttpBasicAdapter.prototype.init = function(config){
  var app = express();
  var self = this;

  app.use(bodyParser());

  app.put("/providers/:providerId", function(req, res){
    self.createProvider(req.params.providerId);
    res.status(200).end();
  });

  app.get("/providers/:providerId", function(req, res){
    var providerMessages = self.messages[req.params.providerId];
    if(providerMessages){
      delete self.messages[req.params.providerId];
    }
    res.status(200).send(providerMessages);
  });

  app.post("/providers/:providerId", function(req, res){
    self.emit(req.params.providerId + ":update-predicate", req.body);
    res.status(200).end();
  });

  app.listen((config && config.port) || this.defaults.port);

  this._server = app;
};

HttpBasicAdapter.prototype.createProviderHandler = function(event, interfaceManager){
  var self = this;
  interfaceManager.on(event.id + ":invoke-rule", function(data){
    self.messages[data.provider] = self.messages[data.provider] || [];
    self.messages[data.provider].push(data);
  });

  this.on(event.id + ":update-predicate", function(data){
    interfaceManager.emit("predicate-updated", data);
  });

};

HttpBasicAdapter.prototype.createProvider = function(providerId){
  this.emit("create-provider", {interface:this.interface, id:providerId});
};

module.exports = HttpBasicAdapter;
