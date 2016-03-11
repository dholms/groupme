var baseURL = "https://api.groupme.com/v3";
var groupURL;
var accessToken;
var messageURL;
var userURL;
var messages = [];
var people = {};
var groups = {};
var groupInfo = {};
var counter = 0;
$(document).ready(function(){
	// accessToken = getUrlParameter("access_token");
	accessToken = "694d1600c7a20133e5ff02b4a5819c83";
	if(accessToken){
		populateGroups();
	} else{
		window.location.replace("https://oauth.groupme.com/oauth/authorize?client_id=mYijg0ZZvRrHmtH7pPaLMBf0LSIbYor6NOJa1Hk4ePlxt26i");
	}
});

var displayGroups = function(response){
	console.log(response);
	var html = "";
	for(group in groups){
		html += "<div class='group row'><div class='col-md-2'><div class='pic-container'>";
		if(groups[group].image_url){
			html += "<img src='" + groups[group].image_url + "' class='pic'/>";
		} else{
			html += "<img src='bw_logo.png' class='pic'/>";
		}
		html += "</div></div><div class='col-md-4'><a href='people.html?accessToken=" + accessToken + "&group=" + groups[group].id+"' class='group-name'>"
		html += groups[group].name + "</a><br>";
		if(groups[group].description)
			html += "<em>"+groups[group].description+"</em><br>";
		html += groups[group].members.length + " members";
		html += "</div></div>";
	}
	$('.data').html(html);
	$('.group-name').on('click', loadGroup);
}

var loadGroup = function(e){
	$('.data').html("");
	for(group in groups){
			if(groups[group].name === e.target.innerHTML){
				groupURL = baseURL + "/groups/" + groups[group].id;
				messageURL = groupURL + "/messages";
				messages = [];
				populateMessages("999999999999999999");
				break;
			}
		}
}

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

var populateGroups = function(){
	$.ajax({
		url: baseURL+"/groups",
		type: 'GET',
		data: {token: accessToken, per_page:20},
		success: function(response) {
			groups = response.response;
			displayGroups(response);
		},
		error: function(errors) {
			console.log(errors);
		}
	});
}

var displayResult = function(arr){
	var order;
	if(arguments.length == 0){
		order = sortArr("averageLikes");
	} else{
		order = arr;
	}
	var html = "";
	html += '<div class="row"><a href="#" onclick="displayGroups()">Return To Groups</a></div>';
	for(var i = 0; i < order.length; i++){
		var person = order[i];
		if(i%3 == 0){
			html += "<div class='row people-row'>";
		}
		html += "<div class='col-md-2'><div class='pic-container'>";
		if(people[person].image_url){
			html += "<img src='" + people[person].image_url + "' class='pic'/>";
		} else{
			html += "<img src='bw_logo.png' class='pic'/>";
		}
		html += "</div></div><div class='col-md-2'><span class='group-name'>" + people[person].name + "</span><br>";
		html += "Average likes: " + people[person].averageLikes + "<br>";
		html += "Highest likes: " + people[person].highestLikes + "<br>";
		html += "Total likes: " + people[person].totalLikes + "<br>";
		html += "Total messages: " + people[person].totalMessages + "<br>";
		html += "Unliked Percentage: " + people[person].unLikeRatio;
		html += "</div>";
		if(i%3 == 2){
			html += "</div>";
		}
	}
	$('.data').html(html);
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
		data: {token: accessToken, limit: 100, before_id:before_id},
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