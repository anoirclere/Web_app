var i18n = require('./i18n.js');
var utils = require('../utils.js');
var query = require('./query.js');
var alert = require('./alert.js');

module.exports = (function() {
	var $document = $(document);
	var $modal = $('#modalWindow');
	var $modalContent = $modal.find('.modal-content');
	var self = {};
	var shown = false;
	var currentOptions = null;
	var openHrefModal = function(options) {
		if (!utils.isValidPageName(options.href)) {
			return;
		}
		//Load modal content
		var start = new Date().getTime();
		$.get('/parts/'+ options.href +'.html', {v: BUILD_VERSION})
		.done(function(html) {
			$modalContent.html(html);
			var $html = $(html);
			if ($html.data('event')) {
				$document.triggerHandler($html.data('event'));
			}
			if ($html.data('ui')) {
				var ui = require('../ui/'+ $html.data('ui') +'.js');
				if (ui && ui.show) {
					ui.show();
				}
			}
		}).fail(function(xhr, status, msg) {
			self.close();
			if (status === 'error' && msg === 'Not Found') {
				self.show({
					title: i18n.t('404_Error_'),
					text: i18n.t('Error, unknown url')
				});
			} else {
				query.connectionError();
			}
		}).then(function () {
			$document.triggerHandler('windows.opened', {time: (new Date().getTime()-start), href: options.href});
		});
		if (!$modal.data('navigationOpen')) {
			$document.triggerHandler('navigation.set-state', {name: 'windows', value: options.href});
		} else {
			$document.triggerHandler('navigation.set-state', $modal.data('navigationOpen'));
			$modal.data('navigationOpen', null);
		}
	};
	$modal.on('hide.bs.modal', function () {
		$document.triggerHandler('windows.close');
	});
	$modal.on('hidden.bs.modal', function () {
		$modalContent.html('');
		shown = false;
		currentOptions = null;
		$document.triggerHandler('windows.closed');
		if (!$modal.data('navigationClose')) {
			$document.triggerHandler('navigation.set-state', {name: 'windows', value: null});
		} else {
			$document.triggerHandler('navigation.set-state', $modal.data('navigationClose'));
			$modal.data('navigationClose', null);
		}
	});
	$modal.on('show.bs.modal', function (event) {
		shown = true;
		var $source = $(event.relatedTarget);
		if ($source.length && $source.data('href')) {
			if ($source.attr('href').indexOf('/wouaf/') === -1) {
				var map = require('./map.js');
				map.hideResult();
			}
			currentOptions = {href: $source.data('href')};
			openHrefModal(currentOptions);
		}
	});
	self.show = function(options) {
		options = $.extend({
			title:		'',
			text:		'',
			footer:		'',
			href: 		'',
			open:		null,
			close:		null,
			navigationOpen: null,
			navigationClose: null,
			confirm:	null,
			cancel:		null,
			data: 		null,
			closeLabel: null
		}, options);
		var open = function (options) {
			if (options.text) {
				var content =
					'<div class="modal-header">' +
					'	<button type="button" class="close" data-dismiss="modal" aria-label="' + i18n.t('Close') + '">' +
					'		<span aria-hidden="true">&times;</span>' +
					'		<span class="sr-only">' + i18n.t('Close') + '</span>' +
					'	</button>';
				if (options.title) {
					content += '<h4 class="modal-title">' + options.title + '</h4>';
				}
				content += ' </div>' +
					'<div class="modal-body">'+ options.text +'</div>';
				if (options.footer !== false) {
					content += '<div class="modal-footer">';
					if (options.footer) {
						content += options.footer;
					} else {
						if (!options.confirm) {
							content += '<button type="button" class="btn btn-secondary" data-dismiss="modal">' + (options.closeLabel ? options.closeLabel : i18n.t('Close')) + '</button>';
						} else {
							content += '<button type="button" class="btn btn-secondary" data-dismiss="modal">' + i18n.t('Cancel') + '</button>&nbsp;'+
							'<button type="button" class="btn btn-primary"><i class="fa fa-check"></i> ' + i18n.t('Confirm') + '</button>';
							$modal.one('shown.bs.modal', function() {
								$modal.find('button.btn-primary').one('click', function () {
									options.confirm();
									$modal.modal('hide');
								});
								if (options.cancel) {
									$modal.find('button.btn-secondary').one('click', function () {
										options.cancel();
									});
								}
							});
						}
					}
					content += '</div>';
				}
				$modalContent.html(content);
			} else if (options.href) {
				$modal.one('show.bs.modal', function() {
					openHrefModal(options);
				});
			}
			if (options.open) {
				$modal.one('shown.bs.modal', function (event) {
					options.open(event);
				});
			}
			if (options.close) {
				$modal.one('hidden.bs.modal', function (event) {
					options.close(event);
				});
			}
			$modal.data('navigationOpen', options.navigationOpen);
			$modal.data('navigationClose', options.navigationClose);
			if (options.backdrop  === false) {
				$('body').addClass('no-backdrop');
				$modal.one('hidden.bs.modal', function () {
					$('body').removeClass('no-backdrop');
				});
			}
			currentOptions = options;
			$modal.modal('show');
		};
		if (shown) {
			$document.triggerHandler('navigation.disable-state');
			$modal.one('hidden.bs.modal', function() {
				$document.triggerHandler('navigation.enable-state');
				open(options);
			});
			$modal.modal('hide');
		} else {
			open(options);
		}
	};
	self.close = function () {
		$modal.modal('hide');
	};
	self.login = function(msg) {
		self.show({
			href: 'login',
			open: function () {
				alert.show(msg, $('.modal-body'), 'danger');
			}
		})
	};
	self.refresh = function() {
		if (shown) {
			self.show(currentOptions);
		}
	};
	self.getWindows = function () {
		return $modal;
	};
	self.getOptions = function () {
		return currentOptions;
	};
	return self;
}());