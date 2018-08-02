import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import './main.html';
import './docItem.html';
import './docList.html';
import './navbar.html';
import '/lib/collection.js';
import './accounts.js';


Meteor.subscribe("documents");
Meteor.subscribe("editingUsers");


Router.configure({
	layoutTemplate: 'ApplicationLayout'
});


Router.route('/', function () {
  	this.render('navbar', {to:"header"});
  	this.render('docList', {to:"main"});
});

Router.route('/documents/:_id', function () {
	Session.set("docid", this.params._id);
  	this.render('navbar', {to:"header"});
  	this.render('docItem', {to:"main"});
});


/*
*
*
*TEMPLATE HELPER FUNCTIONS
*
*
*/

Template.editor.helpers({
	docid:function(){
		setupCurrentDocument();
		return Session.get("docid");
	},

	config:function(){
		return function(editor){
			editor.setOption("lineNumbers",true);
			editor.setOption("theme", "rubyblue");
			editor.setOption("mode", "html");
			editor.on("change", function(cm_editor, info){
				$("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
				var docid = Session.get("docid");
				Meteor.call("addEditingUser", docid);
			});
		}
	}
});




Template.editingUsers.helpers({
	users:function(){
		var doc, eusers, users;
		doc = Documents.findOne({_id:Session.get("docid")}); //CHANGE LATER FOR MULTIPLE DOCS
		if(!doc) {
			return;
		}
		eusers = EditingUsers.findOne({docid:doc._id});
		if(!eusers) {
			return;
		}
		users = new Array();
		var i = 0;
		for(var user_id in eusers.users){
			users[i] = fixObjectKeys(eusers.users[user_id]);
			i++;
		}
		return users;
	}
});



Template.navbar.helpers({
	documents:function(){
		return Documents.find();
	}
});




Template.docMeta.helpers({
	document:function(){
		return Documents.findOne({_id:Session.get("docid")});
	},
	canEdit:function(){
		var doc;
		doc = Documents.findOne({_id:Session.get("docid")});
		if(doc){
			if(doc.owner == Meteor.userId()) {
				return true;
			}
		} else {
			return false;
		}

	}
});

Template.editableText.helpers({
	userCanEdit:function(doc, Collection) {
		doc = Documents.findOne({_id: Session.get("docid"), owner:Meteor.userId()});
		if(doc) {
			return true;
		} else {
			return false;
		}
	}
});

Template.docList.helpers({
	documents:function(){
		return Documents.find();
	}
});


/*
*
*
*TEMPLATE EVENT FUNCTIONS
*
*
*/


Template.navbar.events({
	'click .js-add-doc':function(event) {
		event.preventDefault();
		
		//check if user is logged in first
		if(!Meteor.user()) {
			alert("You need to log in first");
		} else {
			var id = Meteor.call("addDoc", function(err, res){
				if(err) {
					console.log("there was an error");
				}
				if(!err) {
					Session.set("docid", res);
				}
			});
		}
	},
	'click .js-load-doc':function(event){
		Session.set("docid", this._id);
	}
})





Template.docMeta.events({
	'click .js-tog-private':function(event) {
		var doc = {_id:Session.get("docid"), isPrivate:event.target.checked};
		Meteor.call("updateDocPrivacy", doc);

	}
})


/*
*
*
*HELPER FUNCTIONS
*
*
*/


function setupCurrentDocument() {
	var doc;
	if(!Session.get("docid")) {
		doc = Documents.findOne();
		if(doc){
			Session.set("docid", doc._id);
		}
	}
}



function fixObjectKeys(obj){
	var newObj ={};
	for(key in obj) {
		var key2 = key.replace("-", "");
		newObj[key2] = obj[key];
	}
	return newObj;
}




