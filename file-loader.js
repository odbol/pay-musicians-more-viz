var FileLoader = function (element, onFileLoaded) {
	element.addEventListener('dragover', (ev) => {
		console.log('dragover: ', ev);

		ev.preventDefault();
	});
	element.addEventListener('drop', (ev) => this.onFileDropped(ev, (file) => this.openFile(file).then(onFileLoaded)));
};


// from https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
FileLoader.prototype.onFileDropped = function (ev, callback) {
  console.log('File(s) dropped');

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === 'file') {
        var file = ev.dataTransfer.items[i].getAsFile();
        console.log('... file[' + i + '].name = ' + file.name);
        callback(file);
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
      callback(ev.dataTransfer.files[i]);
    }
  }


};

FileLoader.prototype.openFile = function (file) {
  return new Promise((resolve, reject) => {
  	const reader = new FileReader(); 

  	reader.onload = (ev) => resolve(JSON.parse(ev.target.result));
  	reader.onerror = () => reject(reader.error);

	reader.readAsText(file);
  });
};