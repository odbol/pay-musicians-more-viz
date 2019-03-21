var SpotifyParser = function () {

};

SpotifyParser.prototype.parse = function (json) {
	return json
		.filter((d) => d.msPlayed > 30 * 1000) // must play longer than 30 seconds to count as streamed
		.map((d) => {
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