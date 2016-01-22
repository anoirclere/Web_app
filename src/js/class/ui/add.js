module.exports = (function() {
	var ENDPOINT 		= API_ENDPOINT;
	if (__DEV__) {
		var KEY 			= API_KEY_DEV;
	} else {
		var KEY 			= API_KEY_PROD;
	}
	var data = require('../resource/data.js');
	var windows = require('../resource/windows.js');
	var i18n = require('../resource/i18n.js');
	var toast = require('../resource/toast.js');
	var map = require('../resource/map.js');
	var twitterText = require('twitter-text');
	var $modalWindow = $('#modalWindow');
	var durationsLabels = [i18n.t('{{count}} hour', {count: 1}),
						   i18n.t('{{count}} hour', {count: 2}),
						   i18n.t('{{count}} hour', {count: 4}),
						   i18n.t('{{count}} hour', {count: 6}),
						   i18n.t('{{count}} hour', {count: 12}),
						   i18n.t('{{count}} hour', {count: 18}),
						   i18n.t('{{count}} day', {count: 1}),
						   i18n.t('{{count}} day', {count: 2}),
						   i18n.t('{{count}} day', {count: 3}),
						   i18n.t('{{count}} day', {count: 4}),
						   i18n.t('{{count}} day', {count: 5}),
						   i18n.t('{{count}} day', {count: 6}),
						   i18n.t('{{count}} week', {count: 1}),
						   i18n.t('{{count}} week', {count: 2})];
	var durations = [3600, 7200, 14400, 21600, 43200, 64800,
					 86400, 172800, 259200, 345600, 432000, 518400,
					 604800, 1209600];

	var self = {};
	self.show = function (e) {
		if (!data.getString('uid')) { //user is not logged, close window
			windows.close();
		}
		var $form = $modalWindow.find('form');
		var $remaining = $form.find('.remaining');
		var $help = $form.find('.help');
		var $content = $form.find('textarea[name=content]');
		var $dateStart = $form.find('input[name=date-start]');
		var $length = $form.find('select[name=length]');
		var $category = $form.find('select[name=category]');
		var $longitude = $form.find('input[name=longitude]');
		var $latitude = $form.find('input[name=latitude]');
		var $facebook = $form.find('input[name=facebook]');
		var $contact = $form.find('input[name=contact]');
		var $wouafNotifications = $form.find('input[name=wouaf-notifications]');

		//set current values
		var categories = data.getObject('categories');
		var i, l;
		if (categories) {
			for(i = 0, l = categories.length; i < l; i++) {
				$category.append('<option value="'+ categories[i]['id'] +'">'+ i18n.t(categories[i]['label']) +'</option>');
			}
		}
		//precision => ~1.1m
		var coordinates = map.getMap().getCenter().toUrlValue(5).split(',');
		$latitude.val(coordinates[0]);
		$longitude.val(coordinates[1]);

		for (i = 0, l = durations.length; i < l; i++) {
			$length.append('<option value="'+ durations[i] +'"'+ (i === durations.length - 2 ? ' selected="selected"' : '') +'>'+ durationsLabels[i] +'</option>');
		}

		//init drop zone
		$("div.dropzone").dropzone({
			url: ENDPOINT + '/file/post',
			headers: {
				key: 		KEY,
				uid: 		data.getString('uid'),
				token:      data.getString('token')
			},
			maxFilesize: 2,
			parallelUploads: 3,
			maxFiles: 3,
			acceptedFiles: '.jpg,.jpeg,.gif,.png',
			uploadMultiple: true,
			addRemoveLinks: true,
			dictRemoveFile: '×',
			dictDefaultMessage: '<i class="fa fa-picture-o"></i> '+ 'Ajoutez jusqu\'à 3 images',
			dictInvalidFileType: 'Seules les images JPG, GIF et PNG sont autorisées',
			dictFileTooBig: 'Cette image est trop volumineuse ({{filesize}}Mo), maximum: {{maxFilesize}}Mo',
			dictResponseError: 'Erreur lors de l\'envoi de l\'image, réessayez ...',
			dictMaxFilesExceeded: '3 images maximum !'
		});

		//content count remaining chars
		$content.on('change keyup paste', function() {
			var count = 300 - twitterText.getUnicodeTextLength($content.val());
			if (count < 0) {
				count = 0;
				$content.val($content.val().substr(0, 300));
			}
			$remaining.html(count + ' caractères restants');
		});

		$facebook.attr("checked", data.getBool('fbPost'));
		$contact.attr("checked", data.getBool('allowContact'));
		$wouafNotifications.attr("checked", data.getBool('postNotif'));

		//help popover
		$help.popover({
			title: 'Comment saisir votre contenu',
			content: require('../../../../languages/parts/'+LANGUAGE+'/help.html'),
			html: true,
			animation: true,
			delay: { "show": 400, "hide": 200 },
			trigger: 'manual',
			placement: 'bottom',
			offset: '0 100',
			template: ['<div class="popover large" role="tooltip">',
							'<div class="popover-arrow"></div>',
							'<button type="button" class="close" aria-label="'+ i18n.t('Close') +'">',
							'<span aria-hidden="true">&times;</span>',
							'</button>',
							'<h3 class="popover-title"></h3>',
							'<div class="popover-content"></div>',
						'</div>'].join('')
		});
		$help.on({
			'click': function () {
				$help.popover('toggle');
			},
			'shown.bs.popover': function () {
				$('.popover .close').one('click', function () {
					$help.popover('hide');
				});
			}
		});
	};
	return self;
})();