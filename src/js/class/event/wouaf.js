module.exports = (function() {
	var map = require('../resource/map.js');
	var windows = require('../resource/windows.js');
	var i18n = require('../resource/i18n.js');
	var query = require('../resource/query.js');
	var toast = require('../resource/toast.js');
	var wouaf = require('../ui/wouaf.js');
	var menu = require('../ui/menu.js');
	var utils = require('../utils.js');
	var $document = $(document);

	$document.on('app.wouaf-show', function(e, data) {
		if (!data.ids) {
			return;
		}
		var ids = data.ids;
		//grab results
		var results = map.getResults(ids);
		var length = results.length;
		var content = '';
		if (!length) {
			$document.triggerHandler('navigation.set-state', {name: 'wouaf', value: null});
			return;
		} else if (results.length === 1) {
			$document.triggerHandler('navigation.set-state', {name: 'wouaf', value: results[0].id});
			content = wouaf.getWouaf(results[0]);
		} else {
			$document.triggerHandler('navigation.set-state', {name: 'wouaf', value: null});
			content = wouaf.getClusterList(results);
		}
		// Set infoWindow content
		data.iw.setContent(content);
		data.iw.open(data.map);
	});
	var expanding = false;
	$document.on('show.bs.collapse', '.w-accordion', function () {
		expanding = true;
	});
	$document.on('shown.bs.collapse', '.w-accordion', function (e) {
		expanding = false;
		var $target = $(e.target);
		if (!$target.length) {
			return;
		}
		var id = $target.parent().data('id');
		if (!id) {
			return;
		}
		if ($target.hasClass('in')) {
			$document.triggerHandler('navigation.set-state', {name: 'wouaf', value: id});
		} else {
			$document.triggerHandler('navigation.set-state', {name: 'wouaf', value: null});
		}
	});
	$document.on('hidden.bs.collapse', '.w-accordion', function () {
		if (!expanding) {
			$document.triggerHandler('navigation.set-state', {name: 'wouaf', value: null});
		}
	});
	//update comment count
	$document.on('wouaf.update-comment', function(e, wouaf) {
		$('#map').find('.w-container[data-id="'+ wouaf.id +'"] a[data-action=comments]').html(
			'<i class="fa fa-comment"></i> '+
			(wouaf.com ? i18n.t('{{count}} comment', {count: wouaf.com}) : i18n.t('Add a comment', {count: wouaf.com}))
		);
	});

	//Swipebox
	$document.on('click', 'a.swipebox', function(e) {
		e.preventDefault();
		var $this = $(this);
		var galleryImg = [];
		var initialIndex = 0;
		$this.parent().find('a.swipebox').each(function(i) {
			var $that = $(this);
			if ($this.attr('href') === $that.attr('href')) {
				initialIndex = i;
			}
			galleryImg.push({href: $that.attr('href')});
		});
		$.swipebox(galleryImg, {hideBarsDelay: 0, loopAtEnd: true, initialIndexOnArray: initialIndex });
	});

	//Menu
	$document.on('click', 'button.w-menu', function(e) {
		e.preventDefault();
		if (menu.shown()) {
			menu.close();
		} else {
			menu.show($(this));
		}
	});

	//Wouaf Actions
	$document.on('click', 'a.dropdown-item, a.w-comments', function(e) {
		var data = require('../resource/data.js');
		var $target = $(e.target);
		if (!$target.data('action')) {
			return;
		}
		e.preventDefault();
		var id = $target.parents('.w-menu-dropdown, .w-container').data('id');
		var obj = map.getResults([id])[0] || null;
		if (!obj) {
			return;
		}
		var uid = data.getString('uid');
		switch ($target.data('action')) {
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
								toast.show(i18n.t('Your Wouaf is deleted'));
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
				var favs = data.getArray('favorites');
				if (utils.indexOf(favs, obj.id) === -1) {
					obj.fav++;
					$target.replaceWith('<a class="dropdown-item" href="#" data-action="unfavorite"><i class="fa fa-star"></i> '+ i18n.t('In your favorites ({{fav}})', {fav: obj.fav}) +'</a>');
					query.addFavorite(obj.id, function() {
						toast.show(i18n.t('This Wouaf is added to your favorites'));
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
				var favs = data.getArray('favorites');
				if (utils.indexOf(favs, obj.id) !== -1) {
					obj.fav--;
					$target.replaceWith('<a class="dropdown-item" href="#" data-action="favorite"><i class="fa fa-star-o"></i> '+ i18n.t('Add to your favorites ({{fav}})', {fav: obj.fav}) +'</a>');
					query.removeFavorite(obj.id, function() {
						toast.show(i18n.t('This Wouaf is removed from your favorites'));
					}, function (msg) {
						toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
					});
					delete favs[utils.indexOf(favs, obj.id)];
					data.setArray('favorites', favs);
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
			case 'comments':
				//show comments page
				windows.show({
					href: 'comments'
				});
				break;
			/*case 'like':
				if (!uid) { //user is not logged, show login window
					windows.login(i18n.t('Login to like a wouaf'));
					return;
				}
				break;*/
			case 'report':
				if (!uid) { //user is not logged, show login window
					windows.login(i18n.t('Login to report a wouaf'));
					return;
				}
				//show confirm page
				windows.show({
					title: i18n.t('Report this Wouaf'),
					text: i18n.t('report_details'),
					confirm: function() {
						query.reportPost(obj.id,
							function() {
								toast.show(i18n.t('This Wouaf has been reported'));
							}, function (msg) {
								toast.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), 5000);
							}
						);
					}
				});
				break;
		}
	});
})();
