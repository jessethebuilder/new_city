//--- Config Functions 
function useMainCache(){
	return true;
}

//--- Config Vars ---
var data_url = 'temp/test_rss.xml';
var current_time_format = 'MMMM dd, yyyy h:mm:ss a';
//--- App Specific Functions ---

function Message(pages, duration){
	this.pages = pages;
	this.duration = duration;
};

function getMessagesFromData(data){
	var reg = /<Messages>([^]+?)<\/Messages>/g;
	var message_text_reg = /<MessagesText>([^]+?)<\/MessagesText>/;
	var message_dur_reg = /<MessagesDur>([^]+?)<\/MessagesDur>/;
	var arr = [];
	var m;
	
	while(m = reg.exec(data)){
		var msg = new Message;
		var page_reg = /<div class="converted_page"[^]+?<\/div>/g;
		var page_match;
		var page_arr = [];
		var message = message_text_reg.exec(m[1])[1].replace(/\\"/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
		
		// console.log(message);
		
		while(page_match = page_reg.exec(message)){
			if(page_match){
				page_arr.push(page_match[0]);	
			}
		}	
		
		msg.pages = page_arr.length > 0 ? page_arr : [message];
		msg.duration = message_dur_reg.exec(m[1])[1];
		
		arr.push(msg);
	}
	
	return arr;	
}

function parsePlayerData(data){
	var reg = /<Player>([^]+?)<\/Player>/g;
	// console.log(reg.exec(data)[1]);
	return reg.exec(data)[1];
}

function parseUpdateTime(player_data){
	var update_time_reg = /<updateTime>(.*)<\/updateTime/;
	return update_time_reg.exec(player_data)[1];
}

//--- Define Angular App
var newCityPlayer = angular.module('newCityPlayer', ['ngRoute', 'ngSanitize']);

// newCityPlayer.config(['$routeProvider', function($routeProvider){
	// $routeProvider.when('/', {
		// controller: 'newCityPlayerController'
	// }).otherwise({
		// redirectTo: '/'
	// });
// }]);

newCityPlayer.factory('playerData', ['$http', function($http){
	return {
		data: function(callback){
			$http({
				method: 'GET', 
				url: data_url,
				cache: true
			}).success(callback);		
		}
	};
}]);

// newCityPlayer.directive('playerStory', function(){
// 	
// });


newCityPlayer.controller('newCityPlayerController', 
						 ['$scope', '$rootScope', '$routeParams', '$interval', '$location', '$sce', '$http', 'playerData', 'dateFilter', 
						 function($scope, $rootScope, $routeParams, $interval, $location, $sce, $http, playerData, dateFilter){
		
	//------ Get Messages ------------------
	playerData.data(function(data){
		// messages is an array of arrays. Single page arrays have a single index (0).
		$scope.messages = getMessagesFromData(data);

		//------- Set Player Options ----------------
		var player_data = parsePlayerData(data);
		$scope.update_time = parseUpdateTime(player_data);
	
		//------------- Navigation Functions --------------
		//Set initial values
		$scope.message_index = 0;
		$scope.page_index = 0;
		
		function setPageNavigation(){
			var multi_page = $scope.messages[$scope.message_index].pages.length > 1 ? true : false;
			
			if(multi_page){
				jQuery('#page_navigation').show();
			} else {
				jQuery('#page_navigation').hide();
			}
			
			return multi_page;
		}
		$scope.setMessage = function(index, page_index){
			if(typeof page_index === 'undefined'){
				// Goes to index 0 if page is not specified
				page_index = 0;
			}
			
			// Normalize index
			if(index == $scope.messages.length){
				index = 0;
			}
			
			if(index == -1){
				index = $scope.messages.length - 1;
			}
			
			// Set Message Variables
			// Duration and initial duration (#duration_total)
			$scope.duration = $scope.messages[index].duration;
			$scope.duration_total = $scope.duration;
			
			// Indexes
			$scope.message_index = index;
			$scope.page_index = page_index;
			
			// Set the Message that shows
			$scope.message = $sce.trustAsHtml($scope.messages[index].pages[page_index]);
			
			// Show/Hide page navigation depending on whether message is multi-page.
			setPageNavigation();
		};
		
		$scope.setNextMessage = function(){
			$scope.setMessage($scope.message_index + 1);				
			
		};
		
		$scope.setPrevMessage = function(){
			$scope.setMessage($scope.message_index - 1);
		};
		
		// Set initial value
		$scope.setMessage(0);
		
		//---------------- Timer functions -------------
		var stop;
		var message_timer = false;
		
		function startTimer(){
			stop = $interval(function(){
				if(message_timer){
					$scope.duration = $scope.duration - 1;			
				
					if($scope.duration == 0){
		    			$scope.setNextMessage();
		    		}	
				} // if message_timer		  
				
				var now = new Date();
				var update_at = new Date($scope.update_time);
				
				if(now >= update_at){
					// $location.url('/');
				}
				
				
				$scope.current_time = dateFilter(now, current_time_format);  	 
			}, 1000);
		}
		
		$scope.stopTimer = function(){
			if(angular.isDefined(stop)){
				$interval.cancel(stop);
				stop = undefined;
			}
		};
		
		$scope.startMessageTimer = function(){
			message_timer = true;
			jQuery('#start_message_timer').hide();
			jQuery('#stop_message_timer').show();
		};
		
		$scope.stopMessageTimer = function(){
			message_timer = false;
			jQuery('#start_message_timer').show();
			jQuery('#stop_message_timer').hide();
		};
		
		$scope.$on('$destroy', function(){
			$scope.stopTimer();
		});
		
		startTimer();
		$scope.startMessageTimer();
	
		//----------------- Page Flipper Functions ----------
		$scope.setPage = function(page_index){
			$stopMessageTimer();
			$scope.setMessage($scope.message_index, page_index);
		};
		
		$scope.setNextPage = function(){
			$scope.setPage($scope.page_index + 1);
		};
		
		$scope.setPrevPage = function(){
			$scope.setPage($scope.page_index - 1);
		};
	});
}]);
