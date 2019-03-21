var SpotifyParser = function () {

};

SpotifyParser.prototype.parse = function (json) {
	return json.map((d) => {
			return {
				artist: d.artistName,
				title: d.trackName,
				timestamp: new Date(Date.parse(d.endTime))
			}
		});
};

SpotifyParser.prototype.load = function (url) {
	return d3.json(url)
		.then(this.parse);
};