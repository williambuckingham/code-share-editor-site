import { Meteor } from 'meteor/meteor';

import '/lib/collection.js';

Meteor.startup(() => {
  if (!Documents.findOne()) {
  	Documents.insert({title:"my new document"});
  }
});





Meteor.publish("documents", function(){
	return Documents.find({
		$or:[{isPrivate:{$ne:true}},
		{owner:this.userId}
		]});
});

Meteor.publish("editingUsers", function(){
	return EditingUsers.find();
});







Meteor.methods({
	//This method is for adding an editing user to a document
	addEditingUser:function(docid) {
		var doc, user, eusers;
		doc = Documents.findOne({_id:docid});

		//Check if there is a document
		if(!doc){
			return;
		}

		//Check if there is a user logged in
		if(!this.userId){
			return;
		}
		user = Meteor.user().profile;
		eusers = EditingUsers.findOne({docid:doc._id});

		//If no eusers set up for current document then create object
		if(!eusers) {
			eusers = {
				docid:doc._id,
				users:{},
			};
		}
		

		//Insert current ediiting user into document 
		user.lastEdit = new Date();
		eusers.users[this.userId] = user;
		EditingUsers.upsert({_id:eusers._id}, eusers);
	},

	addDoc:function() {
		var doc;
		if(!this.userId) {
			return;
		} else {
			doc = {owner:this.userId, createdOn:new Date(), title: "my new doc!"};
			var id = Documents.insert(doc);;
			return id;
		}
	},

	updateDocPrivacy:function(doc){
		console.log("updating privacy");
		var realDoc = Documents.findOne({_id:doc._id, owner:this.userId});
		if(realDoc) {
			realDoc.isPrivate = doc.isPrivate;
			Documents.update({_id:doc._id}, realDoc);
		}
	},

	addComment:function(comment){
		if (this.userId){
			comment.createdOn = new Date();
			comment.userId = this.userId();
			return Comments.insert(comment);
		}
		return;
	}
})
