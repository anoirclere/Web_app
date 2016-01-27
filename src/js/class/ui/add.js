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
	var dtp = require('../resource/datetimepicker.js');
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
		var $title = $form.find('input[name=title]');
		var $content = $form.find('textarea[name=content]');
		var $dateStart = $form.find('input[name=date-start]');
		var $duration = $form.find('select[name=duration]');
		var $category = $form.find('select[name=category]');
		var $longitude = $form.find('input[name=longitude]');
		var $latitude = $form.find('input[name=latitude]');
		var $facebook = $form.find('input[name=facebook]');
		var $contact = $form.find('input[name=contact]');
		var $wouafNotifications = $form.find('input[name=wouaf-notifications]');
		var $dropzone = $form.find('div.dropzone');
		var uploader = null;
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
			$duration.append('<option value="'+ durations[i] +'"'+ (i === durations.length - 2 ? ' selected="selected"' : '') +'>'+ durationsLabels[i] +'</option>');
		}

		//init drop zone
		var maxImages = 3;
		var maxFilesize = 2;
		$dropzone.dropzone({
			url: ENDPOINT + '/file/',
			maxFilesize: maxFilesize,
			parallelUploads: 3,
			maxFiles: maxImages,
			acceptedFiles: '.jpg,.jpeg,.png',
			uploadMultiple: true,
			addRemoveLinks: true,
			dictRemoveFile: '×',
			dictCancelUpload: '×',
			dictCancelUploadConfirmation: i18n.t('Are you sure you want to cancel this loading'),
			dictDefaultMessage: '<i class="fa fa-picture-o"></i> '+ i18n.t('Add up to {{count}} image', {count: maxImages}),
			dictInvalidFileType: i18n.t('Only JPEG and PNG images are allowed'),
			dictFileTooBig: i18n.t('This image is too large', {maxFilesize: maxFilesize}),
			dictResponseError: i18n.t('Error sending the image, try again'),
			dictMaxFilesExceeded: i18n.t('{{count}} image maximum', {count: maxImages}),
			init: function() {
				uploader = this;
				this.on();
			},
			'sending': function(file, xhr, formData) {
				formData.append("key", KEY);
				formData.append("uid", data.getString('uid'));
				formData.append("token", data.getString('token'));
			},
			'success': function(file, response) {
				for(var i = 0, l = response.result.length; i < l; i++) {
					if (file.name === response.result[i].name) {
						var result = response.result[i];
						if (result.error || !result.id) {
							if (__DEV__) {
								console.info('Error on file '+file.name, response);
							}
							var message = result.error ? i18n.t(result.error) : i18n.t('Unknown error');
							// below is from the source code
							var node, _i, _len, _ref, _results;
							file.previewElement.classList.add("dz-error");
							_ref = file.previewElement.querySelectorAll("[data-dz-errormessage]");
							_results = [];
							for (_i = 0, _len = _ref.length; _i < _len; _i++) {
								node = _ref[_i];
								_results.push(node.textContent = message);
							}
							return _results;
						} else {
							//success => store image id
							file.serverId = result.id;
						}
					}
				}
				return file.previewElement.classList.add("dz-success"); // from source
			}
		});

		//content count remaining chars
		$content.on('change keyup paste', function() {
			var count = 300 - twitterText.getUnicodeTextLength($content.val());
			if (count < 0) {
				count = 0;
				$content.val($content.val().substr(0, 300));
			}
			$remaining.html(i18n.t('{{count}} character left', {count: count}));
		});

		$facebook.attr("checked", data.getBool('fbPost'));
		$facebook.attr('disabled', data.getString('loginType') !== 'facebook');
		$contact.attr("checked", data.getBool('allowContact'));
		$wouafNotifications.attr("checked", data.getBool('postNotif'));

		//help popover
		$help.popover({
			title: i18n.t('How to enter your content'),
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

		$form.on('submit', function (event) {
			event.preventDefault();
			var alert = require('../resource/alert.js');
			$form.find('.alert').hide("fast", function() {
				$(this).remove();
			});
			if ($form.find('.has-error').length) {
				alert.show(i18n.t('There are errors in your form'), $form);
				return false;
			}
			if (!$title.val() && !$content.val()) {
				alert.show(i18n.t('Your form is incomplete, thank you to fill at least the title or content'), $form);
				return false;
			}
			//images
			var validImages = [];
			if (uploader) {
				var images = uploader.getAcceptedFiles();
				for (var i = 0, l = images.length; i < l; i++) {
					if (images[i].serverId) {
						validImages.push(images[i].serverId);
					}
				}
			}
			//date
			var date = $dateStart.val() ? dtp.getInputDate($dateStart) : new Date();

			//Query
			var query = require('../resource/query.js');
			query.createPost({
				 loc: 		($latitude.val() +','+ $longitude.val()),
				 cat: 		$category.val(),
				 title:		$title.val(),
				 text: 		$content.val(),
				 date: 		(date / 1000),
				 duration: 	$duration.val(),
				 fbpost: 	(data.getString('loginType') === 'facebook' && $facebook.prop("checked") ? 1 : 0),
				 contact: 	($contact.prop("checked") ? 1 : 0),
				 notif:	 	($wouafNotifications.prop("checked") ? 1 : 0),
				 pics: 	    JSON.stringify(validImages)
			} , function(result) { //success
				if (result.result && result.result == 1) {


					windows.close();

					var toast = require('../resource/toast.js');
					toast.show(i18n.t('Your Wouaf is added'));
				} else if (result.msg) {
					alert.show(i18n.t(result.msg[0]), $form, 'danger');
				} else {
					query.connectionError();
				}
			}, function(result) { //error
				if (result.msg) {
					alert.show(i18n.t(result.msg[0]), $form, 'danger');
				} else {
					query.connectionError();
				}
			});
		});
	};
	return self;
})();