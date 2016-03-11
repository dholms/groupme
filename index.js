var baseURL = "https://api.groupme.com/v3";
var accessToken;
var groups = {};

$(document).ready(function(){
	accessToken = getUrlParameter("access_token");
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
		html += "</div></div><div class='col-md-4'><a href='group.html?access_token=" + accessToken + "&group=" + groups[group].id+"' class='group-name'>"
		html += groups[group].name + "</a><br>";
		if(groups[group].description)
			html += "<em>"+groups[group].description+"</em><br>";
		html += groups[group].members.length + " members";
		html += "</div></div>";
	}
	$('.data').html(html);
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