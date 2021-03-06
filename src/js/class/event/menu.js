var menu = require('../ui/menu.js');
var windows = require('../resource/windows.js');
var map = require('../resource/map.js');
var i18n = require('../resource/i18n.js');
var query = require('../resource/query.js');
var toast = require('../resource/toast.js');
var data = require('../resource/data.js');
var wouafs = require('../resource/wouafs.js');
var utils = require('../utils.js');

module.exports = (function() {
	var $document = $(document);
	var favs, interests, following, authorId, id, states, obj;
	//Close menu
	$document.on('click', function(e) {
		if (menu.shown()) {
			var $target = $(e.target);
			if (!$target.hasClass('w-menu') && !$target.parent().hasClass('w-menu') && !$target.parents('.w-menu-dropdown').length) {
				menu.close();
			}
		}
	});
	//Open menu
	$document.on('click', 'button.w-menu', function(e) {
		e.preventDefault();
		if (menu.shown()) {
			menu.close();
		} else {
			menu.show($(this));
		}
	});
	$document.on('menu.close', menu.close);
	//Menu select url link
	var focusedElement;
	$document.on('focus', 'input.link', function(e) {
		if (focusedElement === $(this)) return; //already focused, return so user can now place cursor at specific point in input.
		focusedElement = $(this);
		setTimeout(function () { focusedElement.select(); }, 50); //select all text in any field on focus for easy re-entry. Delay sightly to allow focus to "stick" before selecting.
	});

	//Menu Actions
	$document.on('click', 'a.dropdown-item, a[data-menu]', function(e) {
		var $target = $(e.target);
		var type = $target.data('menu') || $target.parents('a').data('menu') || $target.parents('.w-menu-dropdown').data('menu');
		var action = $target.data('action') || $target.parents('a').data('action');
		if (!type || !action) {
			return;
		}
		if (__DEV__) {
			console.info('Handle menu action ('+ type +'): '+ action);
		}
		e.preventDefault();
		var uid = data.getString('uid');
		switch (type) {
			//Actions on Wouaf menu
			case 'wouaf':
				id = $target.parents('.w-menu-dropdown, .w-container').data('id');
				obj = wouafs.getLocal(id);
				if (!obj) {
					return;
				}
				switch (action) {
					case 'delete':
						if (obj.author[0] !== uid) { //not user wouaf
							return;
						}
						//show confirm page
						windows.show({
							title: i18n.t('Delete your Wouaf'),
							text: i18n.t('delete_details'),
							confirm: function() {
								query.deletePost(obj.id,
									function() { //success
										map.removeResult(obj.id);
										wouafs.remove(obj.id);
										toast.show(i18n.t('Your Wouaf is deleted'));

										$document.triggerHandler('app.deleted-wouaf', obj);
									}, function (msg) { //error
										toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
									}
								);
							}
						});
						break;
					case 'favorite':
						if (!uid) { //user is not logged, show login window
							windows.login(i18n.t('Login to favorite a wouaf'));
							return;
						}
						favs = data.getArray('favorites');
						if (utils.indexOf(favs, obj.id) === -1) {
							obj.fav++;
							$target.replaceWith('<a class="dropdown-item yellow" href="#" data-action="unfavorite">' +
												'<i class="fa fa-star"></i> '+ i18n.t('In your favorites') + (obj.fav ? ' ('+ utils.round(obj.fav) +')' : '') +'</a>');
							query.addFavorite(obj.id, function() {
								toast.show(i18n.t('This Wouaf is added to your favorites'));

								$document.triggerHandler('app.added-favorite', obj);
							}, function (msg) {
								toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
							});
							favs.push(obj.id);
							data.setArray('favorites', favs);
						}
						break;
					case 'unfavorite':
						if (!uid) { //user is not logged, return
							return;
						}
						favs = data.getArray('favorites');
						if (utils.indexOf(favs, obj.id) !== -1) {
							obj.fav--;
							$target.replaceWith('<a class="dropdown-item" href="#" data-action="favorite">' +
												'<i class="fa fa-star-o"></i> '+ i18n.t('Add to your favorites') + (obj.fav ? ' ('+ utils.round(obj.fav) +')' : '') +'</a>');
							query.removeFavorite(obj.id, function() {
								toast.show(i18n.t('This Wouaf is removed from your favorites'));

								$document.triggerHandler('app.deleted-favorite', obj);
							}, function (msg) {
								toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
							});
							delete favs[utils.indexOf(favs, obj.id)];
							data.setArray('favorites', favs);
						}
						break;
					case 'interested':
						if (!uid) { //user is not logged, show login window
							windows.login(i18n.t('Login to show your interest for a wouaf'));
							return;
						}
						interests 	= data.getArray('interests');
						if (utils.indexOf(interests, obj.id) === -1) {
							obj.interest++;
							$target.replaceWith('<a class="dropdown-item red" href="#" data-action="notinterested" title="'+ i18n.t('Click to remove your interest') +'">' +
												'<i class="fa fa-heart"></i> '+ i18n.t('Im interested') + (obj.interest ? ' ('+ utils.round(obj.interest) +')' : '') +'</a>');
							query.addInterest(obj.id, function() {
								toast.show(i18n.t('Your interest for this Wouaf is saved'));

								$document.triggerHandler('app.added-interest', obj);
							}, function (msg) {
								toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
							});
							interests.push(obj.id);
							data.setArray('interests', interests);
						}
						break;
					case 'notinterested':
						if (!uid) { //user is not logged, return
							return;
						}
						interests 	= data.getArray('interests');
						if (utils.indexOf(interests, obj.id) !== -1) {
							obj.interest--;
							$target.replaceWith('<a class="dropdown-item" href="#" data-action="interested" title="'+ i18n.t('Click to add your interest') +'">' +
												'<i class="fa fa-heart-o"></i> '+ i18n.t('Interested') + (obj.interest ? ' ('+ utils.round(obj.interest) +')' : '') +'</a>');
							query.removeInterest(obj.id, function() {
								toast.show(i18n.t('Your disinterest for this Wouaf is saved'));

								$document.triggerHandler('app.deleted-interest', obj);
							}, function (msg) {
								toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
							});
							delete interests[utils.indexOf(interests, obj.id)];
							data.setArray('interests', interests);
						}
						break;
					case 'follow':
						if (!uid) { //user is not logged, show login window
							windows.login(i18n.t('Login to follow a Wouaffer'));
							return;
						}
						following = data.getArray('following');
						authorId = $target.data('uid');
						if (utils.indexOf(following, authorId) === -1) {
							query.followUser(authorId, function () {
								following.push(authorId);
								data.setArray('following', following);
								$target.replaceWith('<a class="dropdown-item" href="#" data-action="unfollow" data-uid="' + authorId + '">' +
													'<i class="fa fa-angle-double-right"></i> '+ i18n.t('Unfollow the author') +'</a>');
								$document.triggerHandler('app.follow-user', authorId);
								toast.show(i18n.t('You follow this Wouaffer'));
							}, function (msg) {
								toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
							});
						}
						break;
					case 'unfollow':
						if (!uid) { //user is not logged, return
							return;
						}
						following = data.getArray('following');
						authorId = $target.data('uid');
						if (utils.indexOf(following, authorId) !== -1) {
							query.unfollowUser(authorId, function () {
								delete following[utils.indexOf(following, authorId)];
								data.setArray('following', following);
								$target.replaceWith('<a class="dropdown-item" href="#" data-action="follow" data-uid="' + authorId + '">' +
													'<i class="fa fa-angle-double-right"></i> '+ i18n.t('Follow the author') +'</a>');
								$document.triggerHandler('app.unfollow-user', authorId);
								toast.show(i18n.t('You are no longer following this Wouaffer'));
							}, function (msg) {
								toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
							});
						}
						break;
					case 'contact':
						if (!uid) { //user is not logged, show login window
							windows.login(i18n.t('Login to contact author'));
							return;
						}
						//show contact page
						windows.show({
							href: 'contact'
						});
						break;
					case 'disallow-contact':
						if (obj.author[0] !== uid) { //not user wouaf
							return;
						}
						query.subscribeWouaf(obj.id, 0, function () {
							$target.replaceWith('<a class="dropdown-item" href="#" data-action="allow-contact">' +
												'<i class="fa fa-envelope"></i> '+ i18n.t('Allow contact by email') +'</a>');
							obj.contact = 0;
							toast.show(i18n.t('You can not be contacted from this Wouaf'));
						}, function (msg) {
							toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
						});
						break;
					case 'allow-contact':
						if (obj.author[0] !== uid) { //not user wouaf
							return;
						}
						query.subscribeWouaf(obj.id, 1, function () {
							$target.replaceWith('<a class="dropdown-item" href="#" data-action="disallow-contact">' +
												'<i class="fa fa-envelope"></i> '+ i18n.t('Disallow contact by email') +'</a>');
							obj.contact = 1;
							toast.show(i18n.t('You can now be contacted from this Wouaf'));
						}, function (msg) {
							toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
						});
						break;
					case 'calendar':
						//show calendar page
						menu.close();

						id = $target.parents('.w-menu-dropdown, .w-container').data('id');
						states = data.getObject('navigation');
						if ((!states.wouaf || !utils.isId(states.wouaf)) && utils.isId(id)) {
							map.showResult(id);
						}
						windows.show({
							href: 'calendar',
							data: (id ? {wouafId: id} : null)
						});
						break;
					case 'comments':
						//show comments page
						menu.close();

						id = $target.parents('.w-menu-dropdown, .w-container').data('id');
						states = data.getObject('navigation');
						if ((!states.wouaf || !utils.isId(states.wouaf)) && utils.isId(id)) {
							map.showResult(id);
						}
						windows.show({
							href: 'comments',
							data: (id ? {wouafId: id} : null)
						});
						break;
					case 'report':
						if (!uid) { //user is not logged, show login window
							windows.login(i18n.t('Login to report a wouaf'));
							return;
						}
						//show confirm page
						windows.show({
							title: i18n.t('Report this Wouaf'),
							text: (i18n.t('report_details')
									+'<br /><br /><p class="text-xs-center"><img src="https://img.wouaf.it/kill-kitten.jpg" style="max-width:100%;" /></p>'),
							confirm: function() {
								query.reportPost(obj.id,
									function() {
										toast.show(i18n.t('This Wouaf has been reported'));

										$document.triggerHandler('app.reported-wouaf', obj);
									}, function (msg) {
										toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
									}
								);
							}
						});
						break;
				}
				break;
			//Actions on Comment menu
			case 'comment':
				var commentId = $target.parents('.w-menu-dropdown').data('id');
				var wouafId = $target.parents('.w-menu-dropdown').data('wouaf');
				menu.close();
				switch (action) {
					case 'delete':
						//show confirm page
						windows.show({
							title: i18n.t('Delete your comment'),
							text: i18n.t('delete_comment_details'),
							confirm: function () {
								query.deleteComment(commentId,
									function () { //success
										//Get comment Wouaf
										obj = wouafs.getLocal(wouafId);
										if (obj) {
											obj.com--;
											$document.triggerHandler('wouaf.update-comment', obj);
										}
										windows.show({
											'href': 'comments'
										});
										toast.show(i18n.t('Your comment is deleted'));

										$document.triggerHandler('app.deleted-comment', obj);
									}, function (msg) { //error
										toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
									}
								);
							},
							cancel: function() {
								windows.show({
									'href': 'comments'
								});
							}
						});
						break;
					case 'report':
						if (!uid) { //user is not logged, show login window
							windows.login(i18n.t('Login to report a comment'));
							return;
						}
						//show confirm page
						windows.show({
							title: i18n.t('Report this comment'),
							text: (i18n.t('report_comment_details')
									+'<br /><br /><p class="text-xs-center"><img src="https://img.wouaf.it/kill-kitten.jpg" style="max-width:100%;" /></p>'),
							confirm: function() {
								query.reportComment(commentId,
									function() {
										windows.show({
											'href': 'comments'
										});
										toast.show(i18n.t('This comment has been reported'));

										obj = wouafs.getLocal(wouafId);
										$document.triggerHandler('app.reported-comment', obj);
									}, function (msg) {
										toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
									}
								);
							},
							cancel: function() {
								windows.show({
									'href': 'comments'
								});
							}
						});
						break;
				}
				break;
			//Actions on Listing menu
			case 'listing':
				var listingId = $target.parents('.w-menu-dropdown').data('id');
				menu.close();
				switch (action) {
					case 'filter-active':
						$document.triggerHandler('tabs.filter', {id: listingId, action: !$target.hasClass('active')});
						break;
					case 'sort-proximity':
						if ($target.hasClass('active')) {
							return;
						}
						$document.triggerHandler('tabs.sort', {id: listingId, action: 'proximity'});
						break;
					case 'sort-date-desc':
						if ($target.hasClass('active')) {
							return;
						}
						$document.triggerHandler('tabs.sort', {id: listingId, action: 'date-desc'});
						break;
					case 'sort-date-asc':
						if ($target.hasClass('active')) {
							return;
						}
						$document.triggerHandler('tabs.sort', {id: listingId, action: 'date-asc'});
						break;
					case 'sort-comments':
						if ($target.hasClass('active')) {
							return;
						}
						$document.triggerHandler('tabs.sort', {id: listingId, action: 'comments'});
						break;
					case 'sort-fav':
						if ($target.hasClass('active')) {
							return;
						}
						$document.triggerHandler('tabs.sort', {id: listingId, action: 'fav'});
						break;
					case 'sort-interest':
						if ($target.hasClass('active')) {
							return;
						}
						$document.triggerHandler('tabs.sort', {id: listingId, action: 'interest'});
						break;
					case 'sort-type':
						if ($target.hasClass('active')) {
							return;
						}
						$document.triggerHandler('tabs.sort', {id: listingId, action: 'type'});
						break;
				}
				break;
		}
	});
}());