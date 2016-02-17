module.exports = (function() {
	var i18n = require('./i18n.js');
	var $document = $(document);
	var $modal = $('#modalWindow');
	var $modalContent = $modal.find('.modal-content');
	var self = {};
	var shown = false;
	var openHrefModal = function(href) {
		var htmlRegExp 	= /\/parts\/([a-z-]+).html/;
		var name 		= htmlRegExp.exec(href);

		//Load modal content
		$.get(href, {v: BUILD_VERSION})
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
		}).fail(function() {
			console.error(arguments);
		});
		$document.triggerHandler('navigation.set-state', {state: 'windows', value: {href: href, name: name[1]}});
	};

	$modal.on('hidden.bs.modal', function () {
		$modalContent.html('');
		shown = false;
		$document.triggerHandler('navigation.set-state', {state: 'windows', value: null});
	});
	$modal.on('show.bs.modal', function (event) {
		shown = true;
		var $source = $(event.relatedTarget);
		if ($source.length && $source.data('href')) {
			openHrefModal($source.data('href'));
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
			confirm:	null
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
							content += '<button type="button" class="btn btn-secondary" data-dismiss="modal">' + i18n.t('Close') + '</button>';
						} else {
							content += '<button type="button" class="btn btn-secondary" data-dismiss="modal">' + i18n.t('Cancel') + '</button>'+
							'<button type="button" class="btn btn-primary">' + i18n.t('Confirm') + '</button>';
							$modal.one('shown.bs.modal', function() {
								$modal.find('button.btn-primary').one('click', function () {
									options.confirm();
									$modal.modal('hide');
								});
							});
						}
					}
					content += '</div>';
				}
				$modalContent.html(content);
			} else if (options.href) {
				$modal.one('show.bs.modal', function() {
					openHrefModal(options.href);
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
			if (options.backdrop  === false) {
				$('body').addClass('no-backdrop');
				$modal.one('hidden.bs.modal', function() {
					$('body').removeClass('no-backdrop');
				});
				$modal.modal('show');
			} else {
				$modal.modal('show');
			}
		};
		if (shown) {
			$modal.one('hidden.bs.modal', function() {
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
			href: '/parts/login.html',
			open: function () {
				var alert = require('./alert.js');
				alert.show(msg, $('.modal-body'), 'danger');
			}
		})
	}
	return self;
})();