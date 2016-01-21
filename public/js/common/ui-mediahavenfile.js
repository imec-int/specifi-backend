function addLoadEvent(func) {
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    } else {
        window.onload = function() {
            if (oldonload) {
                oldonload();
            }
            func();
        }
    }
}
addLoadEvent(initMediaHavenFile);


function initMediaHavenFile() {
    
	// Local File
	$('.field.type-localfile.mediahavenfile').each(function() {
        
		var $el = $(this),
			data = $el.data();
        if(!$el.data('initialized')) {
            $el.data('initialized', true);
    
            var $action = $el.find('.field-action'),
                $upload = $el.find('.field-upload');
    
            var $uploadBtn = $el.find('.btn-upload-file'),
                $cancelBtn = $el.find('.btn-cancel-file');
    
            var $uploadQueued = $el.find('.upload-queued');
    
            var $file = $el.find('.file-container'),
                $filePreview = $file.find('.file-preview.current'),
                $fileDetails = $file.find('.file-details'),
                $fileValues = $file.find('.file-values');
    
            var action = false;
    
            var removeNewFile = function() {
                $el.find('.file-preview.new').remove();
            }
    
            $upload.change(function(e) {
                var fileSelected = $(this).val() ? true : false;
                var renderPlaceholder = function() {
                    // File
                    $filePreview.hide();
                    $fileValues.hide();
                    // Messages
                    $uploadQueued[fileSelected ? 'show' : 'hide']();
                    // Buttons
                    $cancelBtn.show();
                    $uploadBtn.text(fileSelected ? 'Change File' : 'Upload File');
                    // Preview
                    removeNewFile();
                };
                // Preview
                if (fileSelected) {
                    if (window.FileReader) {
                        var files = e.target.files;
                        for (var i = 0, f; f = files[i]; i++) {
                            var fileReader = new FileReader();
                            fileReader.onload = (function(file) {
                                return function(e) {
                                    renderPlaceholder();
                                    $uploadQueued.find('.file-name').html("'" + file.name + "' ");
                                    $(window).trigger('redraw');
                                };
                            })(f);
                            fileReader.readAsDataURL(f);
                        }
                    } else {
                        return renderPlaceholder();
                    }
                }
            });
    
            // Upload File
            $uploadBtn.click(function() {
                $upload.click();
            });
    
            // Cancel Upload
            $cancelBtn.click(function(e) {
                e.preventDefault();
                // Remove new file preview
                removeNewFile();
                // Erase selected file
                $upload.val('');
                // If we have an file already
                if (data.fieldValue) {
                    // Show it
                    $filePreview.show();
                    $fileValues.show();
                } else {
                    // Make sure upload button references no current file
                    $uploadBtn.html('Upload File');
                }
                // Hide the cancel upload button
                $cancelBtn.hide();
                // Hide queued upload message
                $uploadQueued.hide();
                // Redraw
                $(window).trigger('redraw');
            });

        }

	});

};

