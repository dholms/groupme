var baseURL = "https://api.groupme.com/v3";
var groupURL;
var accessToken;
var messageURL;
var userURL;
var messages = [];
var people = {};
var groupInfo = {};
var counter = 0;
$(document).ready(function(){
	accessToken = getUrlParameter("access_token");
	groupURL = baseURL + "/groups/" + getUrlParameter("group");
	messageURL = groupURL + "/messages";
	if(accessToken){
		populateMessages("999999999999999999");
	} else{
		window.location.replace("https://oauth.groupme.com/oauth/authorize?client_id=mYijg0ZZvRrHmtH7pPaLMBf0LSIbYor6NOJa1Hk4ePlxt26i");
	}
});

var updateList = function(){
	console.log('here');
	var sortBy = $("#sortBy").val();
	var sortToken = "";
	switch(sortBy){
		case "Highest Likes":
			sortToken = "highestLikes";
			break;
		case "Total Likes":
			sortToken = "totalLikes";
			break;
		case "Average Likes":
			sortToken = "averageLikes";
			break;
		case "No Likes":
			sortToken = "noLikes";
			break;
		case "Total Messages":
			sortToken = "totalMessages";
			break;
		case "Unliked Percentage":
			sortToken = "unLikeRatio";
			break;
	}
	var arr = sortArr(sortToken);
	displayResult(arr);
}

var sortArr = function(token){
	var sortable = [];
	for(person in people){
		sortable.push([person, people[person][token]]);
	}
	sortable.sort(function(a, b) {return b[1]-a[1];});
	var arr = [];
	for(var i = 0; i < sortable.length; i++){
		arr.push(sortable[i][0]);
	}
	return arr;
}

var displayResult = function(arr){
	var order;
	if(arguments.length == 0){
		order = sortArr("averageLikes");
	} else{
		order = arr;
	}
	var html = "";
	for(var i = 0; i < order.length; i++){
		var person = order[i];
		if(i%3 == 0){
			html += "<div class='row'>";
		}
		html += "<div class='col-md-4 col-sm-4 col-xs-12'><div class='row'>";
		html += "<div class='col-md-6 col-sm-6 col-xs-6'><div class='pic-container'>";
		if(people[person].image_url){
			html += "<img src='" + people[person].image_url + "' class='pic'/>";
		} else{
			html += "<img src='bw_logo.png' class='pic'/>";
		}
		html += "</div></div><div class='col-md-6 col-sm-6 col-xs-6'>";
		html +=	"<span class='group-name'>" + people[person].name + "</span><br>";
		html += "Average likes:" + people[person].averageLikes + "<br>";
		html += "Highest likes:" + people[person].highestLikes + "<br>";
		html += "Total likes:" + people[person].totalLikes + "<br>";
		html += "Total messages:" + people[person].totalMessages +"<br>";
		html += "</div></div></div>";
		if(i%3 == 2){
			html += "</div>";
		}
	}
	$('.data').html(html);
	$('.data').removeClass('loading')
}

var startAnalysis = function(){
	var members = groupInfo.members;
	people = {};
	for(var i = 0; i < members.length; i++){
		people[members[i].user_id] = {name:members[i].nickname, image_url:members[i].image_url, messages:[]};
	}
	
	for(var i = 0; i < messages.length; i++){
		var message = messages[i]
		if(people[message.sender_id]){
			people[message.sender_id].messages.push(message);
		}
	}
	getStats();
	console.log(people);
	displayResult();
}

var getStats = function(){
	for(person in people){
		getLikes(person);
		people[person].totalMessages = people[person].messages.length;
	}
}

var getLikes = function(person){
	var messageList = people[person].messages;
	var totalLikes = 0;
	var highestLikes = 0;
	var noLikes = 0;
	var likesFrom = {};
	for(var i = 0; i < messageList.length; i++){
		var likes = messageList[i].favorited_by;
		var likesNumber = likes.length;
		for(var j = 0; j < likes.length; j++){
			if(likes[j] == person){
				likesNumber--;
			}
			var soFar = likesFrom[likes[j]];
			if(soFar){
				likesFrom[likes[j]] = soFar + 1;
			} else{
				likesFrom[likes[j]] = 1;
			}
		}
		totalLikes += likesNumber;
		highestLikes = Math.max(highestLikes, likesNumber);
		if(likesNumber == 0){
			noLikes++;
		}
	}
	people[person].likesFrom = likesFrom;
	people[person].noLikes = noLikes;
	people[person].totalLikes = totalLikes;
	people[person].highestLikes = highestLikes;
	if(messageList.length >0){
		people[person].averageLikes = (totalLikes/messageList.length).toPrecision(3);
		people[person].unLikeRatio = Math.floor(100*noLikes/messageList.length);
	} else{
		people[person].averageLikes = 0;
		people[person].unLikeRatio = 0;
	}
	
}

var getGroupInfo = function(){
	$.ajax({
		url: groupURL,
		type: 'GET',
		data: {token: accessToken},
		success: function(response) {
			groupInfo = response.response;
			startAnalysis();
		},
		error: function(errors) {
			console.log(errors);
		}
	});
}

var populateMessages = function(before_id){
	$.ajax({
		url: messageURL,
		type: 'GET',
		data: {token: accessToken, limit: 100, before_id: before_id},
		success: function(response) {
			counter++;
			temp = response.response.messages
			messages = messages.concat(temp);
			if(temp.length == 100){
				populateMessages(temp[99].id);
			} else{
				getGroupInfo();
			}
		},
		error: function(errors) {
			console.log(errors);
		}
	});
}

var getUrlParameter = function(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};