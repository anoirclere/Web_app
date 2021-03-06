var data = require('../resource/data.js');
var windows = require('../resource/windows.js');
var i18n = require('../resource/i18n.js');
var toast = require('../resource/toast.js');
var map = require('../resource/map.js');
var twitterText = require('twitter-text');
var categories = require('../resource/categories.js');
var dtp = require('../resource/datetimepicker.js');
var utils = require('../utils');
var formUtils = require('./form-utils.js');
var alert = require('../resource/alert.js');
var query = require('../resource/query.js');
var user = require('../resource/user.js');

module.exports = (function() {
	var ENDPOINT 		= API_ENDPOINT;
	var $document 		= $(document);
	var $modalWindow 	= windows.getWindows();
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
						   i18n.t('{{count}} week', {count: 2}),
						   i18n.t('{{count}} week', {count: 3}),
						   i18n.t('{{count}} week', {count: 4})];
	var durations = [3600, 7200, 14400, 21600, 43200, 64800,
					 86400, 172800, 259200, 345600, 432000, 518400,
					 604800, 1209600, 1814400, 2419200];

	var self = {};
	self.show = function (e) {
		if (!data.getString('uid')) { //user is not logged, close window
			windows.close();
			return;
		}
		var $form = $modalWindow.find('form');
		var $remaining = $form.find('.remaining');
		var $help = $form.find('.help');
		var $title = $form.find('input[name=title]');
		var $content = $form.find('textarea[name=content]');
		var $dateStart = $form.find('input[name=date-start]');
		var $dateEnd = $form.find('input[name=date-end]');
		var $specificEnd = $form.find('.specific-end');
		$specificEnd.hide().removeAttr('hidden');
		var $duration = $form.find('select[name=duration]');
		var $category = $form.find('select[name=category]');
		var $categoriesHelp = $form.find('.categories-help');
		var $url = $form.find('input[name=url]');
		var $longitude = $form.find('input[name=longitude]');
		var $latitude = $form.find('input[name=latitude]');
		var $contactNotifications = $form.find('input[name=contact-notifications]');
		var $postNotifications = $form.find('input[name=post-notifications]');
		var $dropzone = $form.find('div.dropzone');
		var uploader = null;
		//categories
		$category.append(categories.getHtmlOptions());
		$categoriesHelp.html(categories.getDetails($category.val()));
		$category.on('change', function() {
			$categoriesHelp.html(categories.getDetails($category.val()));
		});

		//precision => ~1.1m
		var coordinates = map.getMap().getCenter().toUrlValue(5).split(',');
		$latitude.val(coordinates[0]);
		$longitude.val(coordinates[1]);

		for (var i = 0, l = durations.length; i < l; i++) {
			$duration.append('<option value="'+ durations[i] +'"'+ (i === durations.length - 4 ? ' selected="selected"' : '') +'>'+ durationsLabels[i] +'</option>');
		}
		$duration.append('<option value="specific">'+ i18n.t('Specific end date') +'</option>');
		$duration.on('change', function() {
			$specificEnd.toggle($(this).val() === 'specific');
		});

		var maxImages = 3;
		var maxFilesize = 2; //MB
		var max_w = 2048;
		var max_h = 1536;
		var canvas = document.createElement('canvas');
		$dropzone.dropzone({
			url: ENDPOINT + '/file',
			maxFilesize: maxFilesize,
			parallelUploads: 3,
			maxFiles: maxImages,
			autoProcessQueue: false,
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
			headers: {'Authorization': utils.getAuthorization()},
			init: function() {
				uploader = this;
				uploader.on("thumbnail", function(file) {
					if (file.resized || file.width <= max_w && file.height <= max_h) {
						file.resized = true;
						//check if all files are resized
						for(var i = 0, il = uploader.files.length; i < il; i++) {
							if (!uploader.files[i].resized) {
								return;
							}
						}
						uploader.processQueue();
						return;
					}
					var filename = file.name;
					var reader = new FileReader();
					reader.onload = function(e) {
						var img = new Image();
						img.onload = function() {
							var w = img.width;
							var h = img.height;
							var ratio_w = 1;
							var ratio_h = 1;
							if(w > max_w) {
								ratio_w = max_w / w;
							}
							if(h > max_h) {
								ratio_h = max_h / h;
							}

							var ratio = Math.min(ratio_w, ratio_h);
							w = Math.floor(w * ratio);
							h = Math.floor(h * ratio);
							canvas.width = w;
							canvas.height = h;
							var ctx = canvas.getContext('2d', {preserveDrawingBuffer: true});
							ctx.drawImage(img, 0, 0, w, h);

							var dataURL = canvas.toDataURL('image/jpeg', 0.8);
							var a = dataURL.split(',')[1];
							var blob = atob(a);
							var array = [];
							for(var k = 0, l = blob.length; k < l; k++) {
								array.push(blob.charCodeAt(k));
							}
							var data = new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
							data.name = filename;
							data.resized = true;
							uploader.removeFile(file);
				 			uploader.addFile(data);
							//check if all files are resized
							for(var i = 0, il = uploader.files.length; i < il; i++) {
								if (!uploader.files[i].resized) {
									return;
								}
							}
							uploader.processQueue();
						};
						img.src = e.target.result;
					};
					reader.readAsDataURL(file);
				});
			},
			'sending': function(file, xhr, formData) {
				if (!formData.has('uid')) {
					formData.append("uid", data.getString('uid'));
					formData.append("token", data.getString('token'));
				}
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
		$contactNotifications.attr("checked", true);
		$postNotifications.attr("checked", true);

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
				$document.one('windows.close', function() {
					$help.popover('hide');
				});
			}
		});

		//form field validation and submition
		formUtils.init($form, function ($field) {
			//fields validation
			switch($field.attr('name')) {
				case 'url':
					return !$field.val().length || utils.isValidUrl($field.val());
				case 'date-start':
				case 'date-end':
					if ($duration.val() === 'specific' && $dateStart.val() && $dateEnd.val()) {
						var start = dtp.getInputDate($dateStart);
						var end = dtp.getInputDate($dateEnd);
						var duration = 0;
						if (start && end && start.getTime() && end.getTime()) {
							duration = Math.round(end.getTime() / 1000) - Math.round(start.getTime() / 1000);
						}
						if (duration <= 0) {
							return false;
						}
					}
					return true;
			}
			return true;
		}, function () {
			//form submition
			if (!$content.val()) {
				alert.show(i18n.t('Your form is incomplete, thank you to fill at least the content field'), $form);
				return;
			}
			//check dates
			var duration = 0;
			var start = $dateStart.val() ? dtp.getInputDate($dateStart) : new Date();
			if ($duration.val() === 'specific') {
				var end = $dateEnd.val() ? dtp.getInputDate($dateEnd) : new Date();
				if (start && end && start.getTime() && end.getTime()) {
					duration = Math.round(end.getTime() / 1000) - Math.round(start.getTime() / 1000);
				}
				if (duration <= 0) {
					alert.show(i18n.t('Start and end dates are invalid. The end date must be after the start date'), $form);
					return;
				}
				if (duration < 3600) {
					alert.show(i18n.t('Start and end dates are invalid. Your Wouaf must last at least an hour'), $form);
					return;
				}
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
			//Query
			var wouafData = {
				loc: 		($latitude.val() +','+ $longitude.val()),
				cat: 		$category.val(),
				title:		$title.val(),
				text: 		$content.val(),
				date: 		Math.round(start.getTime() / 1000),
				duration: 	(duration ? duration : $duration.val()),
				tz:			(start.getTimezoneOffset() * -1),
				url:		$url.val(),
				contact: 	($contactNotifications.prop("checked") ? 1 : 0),
				subscribe:	($postNotifications.prop("checked") ? 1 : 0),
				pics: 	    JSON.stringify(validImages)
			};
			query.createPost(wouafData , function(result) { //success
				//add a Wouaf to user count
				user.set('posts', parseInt(user.get('posts'), 10) + 1);
				//reload search
				$document.triggerHandler('app.search', {refresh: true});

				windows.close();
				toast.show(i18n.t('Your Wouaf is added'));

				$document.triggerHandler('app.added-wouaf', wouafData);
			}, function(msg) { //error
				alert.show(i18n.t('An error has occurred: {{error}}', {error: i18n.t(msg[0])}), $form, 'danger');
			});
		});
	};
	return self;
}());