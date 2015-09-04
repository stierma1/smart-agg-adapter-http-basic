
var HttpBasicAdapter = require("../lib/http-basic");
var chai = require("chai");
var expect = chai.expect;
var request = require("request");
var examples = require("./examples");
var Application = require("smart-agg");
chai.should();

describe("#HttpBasicAdapter" , function(){
  it("create-server", function(done){
    var httpBasic = new HttpBasicAdapter();
    expect(httpBasic._server).to.equal(null);
    done();
  });

  it("init", function(done){
    var httpBasic = new HttpBasicAdapter();
    httpBasic.init({port: 3001});
    expect(httpBasic._server).to.not.equal(null);
    done();
  });

  it("create-porvider", function(done){
    var httpBasic = new HttpBasicAdapter();
    httpBasic.init({port: 3002});
    httpBasic.on("create-provider", function(data){
      data.id.should.to.equal("test");
      data.interface.should.to.equal("http-basic");
      done();
    });
    setTimeout(function(){
      request.put("http://127.0.0.1:3002/providers/test");
    },20)
  });

  it("end-to-end", function(done){
    var app = new Application({adapters:["../../../lib/http-basic"], interfaces:{},protocols:{"http-basic":{port:3003}}});
    app.processAggregationRule("single-provider-case", examples["single-provider-case"]);
    setTimeout(function(){
      request.put("http://127.0.0.1:3003/providers/provider1");
    }, 20);

    setTimeout(function(){
      request.post("http://127.0.0.1:3003/providers/provider1").form({
        provider: "provider1",
        predicate: "jobs(Status)",
        groundings: ["empty"],
        payload: "I see nothing"
      });
    }, 30);

    setTimeout(function(){
      request.get("http://127.0.0.1:3003/providers/provider1", function(err, req, body){
        var event = JSON.parse(body);
        event[0].provider.should.equal("provider1");
        event[0].predicate.should.equal("behavior(Type)");
        done();
      });
    }, 90);
    /*
    var client = app.createSharedMemoryProvider("provider1");
    client.on("invoke-rule", function(data){
      data.rule.should.equal("single-provider-case");
      data.payloads[0].should.equal("I see nothing");
      done();
    });
    client.init();
    client.updatePredicate("jobs(Status)", ["empty"], "I see nothing");*/
  })
});
