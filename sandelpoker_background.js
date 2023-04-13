// Only run on GBF page (copied from GBF Poker Helper)

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	chrome.declarativeContent.onPageChanged.addRules([{
	    conditions: [new chrome.declarativeContent.PageStateMatcher({
		pageUrl: {
		    hostEquals: "game.granbluefantasy.jp"
		},
	    })
			],
	    actions: [new chrome.declarativeContent.ShowPageAction()]
	}]);
    });
});
