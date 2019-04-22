var MusicViz = function () {


	var PLAY_MONTHLY_FEE_DOLLARS = 10;
	var fairMargin = 0.7;
	var EARLIEST_EVENT,
		LATEST_EVENT,
		TOTAL_TIME_IN_DAYS,
		TOTAL_MONTHS;

	var playbackEvents,
		loadEvents = function (events) {
			playbackEvents = events;
		 	EARLIEST_EVENT = _.min(playbackEvents, d => d.timestamp.getTime());
			LATEST_EVENT = _.max(playbackEvents, d => d.timestamp.getTime());
			TOTAL_TIME_IN_DAYS = (LATEST_EVENT.timestamp.getTime() - EARLIEST_EVENT.timestamp.getTime()) / 1000 / 60 / 60 / 24;
			if (TOTAL_TIME_IN_DAYS < 1) TOTAL_TIME_IN_DAYS = 1;
			TOTAL_MONTHS = Math.floor(TOTAL_TIME_IN_DAYS / 30);
		};

	var	currentMonthRange = 2,
	 	playCountsByArtist,
		artistPlayCounts,
		totalPlayCount,
		updateDates = () => {
			var timeRangeInDays = currentMonthRange * 30;
			var earliestTimestamp = LATEST_EVENT.timestamp.getTime() - (timeRangeInDays * 24 * 60 * 60 * 1000);
			var playbackEventsForTime = playbackEvents.filter(d => d.timestamp.getTime() >= earliestTimestamp);
			playCountsByArtist = _.countBy(playbackEventsForTime, 'artist');
			artistPlayCounts = _.sortBy(_.map(playCountsByArtist, (count, artist) => {return {count, artist}}), d => -d.count);
			totalPlayCount = _.reduce(artistPlayCounts, (sum, d) => sum + d.count, 0);


			var avgPlaysPerDay = totalPlayCount / timeRangeInDays,
				totalArtists = _.size(playCountsByArtist);

			playsPerDayEl.innerHTML = Math.round(avgPlaysPerDay);
			totalArtistsEl.innerHTML = totalArtists;
			playsPerArtistEl.innerHTML = Math.round(totalPlayCount / totalArtists);
		};

	var totalFees,
		totalDollars
		updateTotals = () => {
			totalFees = PLAY_MONTHLY_FEE_DOLLARS * currentMonthRange;
			totalDollars = totalFees * fairMargin;
		};


	var bars = new Bar('#barChart'),
		pie = new Pie('#pieChart');

	var update = function (transitionDuration) {
		updateTotals();

		var data = _.map(artistPlayCounts, ({count, artist}) => {
			var percent = count / totalPlayCount,
				dollars = totalDollars * percent;
			//debug(artist + ': ' + count + ' (' + percent + ') = $' + dollars + ' vs. what they actually got: $' + actualDollars);

			return {
				artist,
				count,
				dollars
			};
		});

		console.log('totalPlayCount: ' + totalPlayCount);
		// console.log('totalTimeInDays: ' + totalTimeInDays);
		// console.log('totalMonths: ' + totalMonths);
		console.log('totalDollars: ' + totalDollars);

		var TOP_LIMIT = 25;
		var topData = data.slice(0, TOP_LIMIT);

		bars.update(topData, transitionDuration);

		var profitMarginDollars = totalFees - fairMargin * totalFees,
			othersTotals = _.reduce(data.slice(TOP_LIMIT), (sum, d) => {
				return {
					dollars: sum.dollars + d.dollars,
					count: sum.count + d.count
				}
			}, { dollars: 0, count: 0});
			pieData = [
		      {
		        artist: PROVIDERS[0].name,
		        dollars: profitMarginDollars
		      }, 
		      ...topData,
		      {
		      	artist: "Others",
		      	dollars: othersTotals.dollars,
		      	count: othersTotals.count
		      }
		    ];
		pie.update(pieData, transitionDuration);
	};


	// UI
	var playsPerDayEl = document.getElementById('playsPerDay'),
		playsPerArtistEl = document.getElementById('playsPerArtist'),
		totalArtistsEl = document.getElementById('totalArtists');

	var profitMargin = document.getElementById('profitMargin'),
		profitMarginPercent = document.getElementById('profitMarginPercent');
	profitMargin.value = 100 - fairMargin * 100;
	profitMarginPercent.innerHTML = profitMargin.value;
	profitMargin.addEventListener('input', (ev) => {
		fairMargin = (100 - profitMargin.value) / 100;
		profitMarginPercent.innerHTML = profitMargin.value;
		update(TRANSITION_DURATION_INTERACTIVE);
	});

	var timeRange = document.getElementById('timeRange'),
		timeRangeValue = document.getElementById('timeRangeValue');
	timeRange.value = TOTAL_MONTHS;
	timeRange.max = TOTAL_MONTHS;
	timeRangeValue.innerHTML = timeRange.value;
	timeRange.addEventListener('input', (ev) => {
		currentMonthRange = timeRange.value;
		timeRangeValue.innerHTML = currentMonthRange;

		updateDates();
		update(TRANSITION_DURATION_FAST);
	});


	return {
		showEvents: function (events) {
			//console.log(JSON.stringify(events));

			resetColors();
			loadEvents(events);

			// TODO: fix this
			timeRange.value = TOTAL_MONTHS;
			timeRange.max = TOTAL_MONTHS;
			timeRange.value = TOTAL_MONTHS;
			timeRangeValue.innerHTML = timeRange.value;
			currentMonthRange = timeRange.value;

			updateDates();
			update(TRANSITION_DURATION);
		}
	};
};