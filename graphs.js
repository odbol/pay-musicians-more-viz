var getParam = function (param) {
    var dataCallbackMatches = new RegExp(param + '=([^&]+)').exec(document.location.href);
    if (dataCallbackMatches) {
      return dataCallbackMatches[1];
    } else {
      return null;
    }
  };


var isDebug = getParam('debug') == 'true';
var debug = isDebug ? 
      function (msg) {
        console.log.apply(this, arguments);
      }
      :
      function () {};

var createClassName = (name) => name.replace(/\W/ig, '_');

// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

// Clear on reload (note this usually won't do anything since we only call update() now.)
d3.selectAll("svg").remove();
d3.selectAll(".svgWrapper").remove();

var TRANSITION_DURATION = 400;
var TRANSITION_DURATION_INTERACTIVE = 30;
var TRANSITION_DURATION_FAST = 130;
var ONE_DAY_MS = 24 * 60 * 60 * 1000;

// from https://github.com/bokeh/bokeh/pull/5380/files
var Category20_20 =  ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
                               '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
var Category20b_20 = ['#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31', '#bd9e39',
                               '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173', '#a55194', '#ce6dbd', '#de9ed6']
var Category20c_20 = ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476',
                               '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9']

// var schemeCategory20 = ["rgb(104,175,252)", "rgb(64,103,190)", "rgb(33,240,182)", "rgb(51,105,77)", "rgb(119,214,207)", "rgb(12,168,46)", "rgb(194,223,125)", "rgb(120,157,35)", "rgb(124,238,77)", "rgb(84,68,55)", "rgb(244,184,171)", "rgb(178,74,31)", "rgb(253,143,32)", "rgb(156,26,84)", "rgb(253,78,139)", "rgb(247,57,49)", "rgb(149,126,132)", "rgb(254,206,95)", "rgb(69,60,197)", "rgb(208,147,244)"];
var schemeCategory20 = Category20_20;

var margin = {top: 10, right: 20, bottom: 30, left: 60},
    width = window.innerWidth - margin.left - margin.right,
    height = Math.max(window.innerHeight, window.innerWidth * 2/3) - margin.top - margin.bottom,
    graphWidth = width / 2 - margin.left - margin.right;
    /**
     * [createSvg description]
     * @param  {[type]} w             [description]
     * @param  {[type]} h             [description]
     * @param  {string} containerName If specified, creates a wrapper div with containerName as the class
     * @param  {HTMLElement} holderElement If specified, appends into the given element
     * @return {element}               [the svg]
     */
    createSvg = function(w, h, containerName, holderElement) {
      holderElement = holderElement || 'body';

      w = w || width;
      h = h || height;

      var wrapper = containerName ?
              d3.select(holderElement)
                .append('div')
                  .classed(containerName, true)
                  .classed('svgWrapper', true)
              :
              d3.select(holderElement),
          svg = wrapper.append("svg")
          .attr("width", w + margin.left + margin.right)
          .attr("height", h + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      return svg;
    };


var format = d3.format("($.2f");

// dollarsPerPlay from https://www.digitalmusicnews.com/2018/01/16/streaming-music-services-pay-2018/
var PROVIDERS = [
  {
    name: 'FairStreamShare',
    color: 'steelblue',
    dollarsPerPlay: (d) => d.dollars
  },
  {
    name: 'Google Play Music',
    color: '#F48B15',
    icon: 'images/play_music_triangle.svg',
    dollarsPerPlay: 0.00611
  },
  {
    name: 'Spotify',
    color: '#1DB954',
    icon: 'images/spotify.png',
    dollarsPerPlay: 0.0038
  }
]


var Bar = function(holderElement) {

  var graphHeight = height - margin.top - margin.bottom;

  var svg = createSvg(graphWidth, graphHeight, 'bars', holderElement);

  var xAxisElement = yAxisElement = svg.append("g")
        .attr("class", "x axis"),
      yAxisElement = svg.append("g")
        .attr("class", "y axis");
    yAxisElement    
        //.call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Artist");


  _.each(PROVIDERS, (provider) => {
    svg.append('image')
      .classed(createClassName(provider.name), true)
      .attr('href', provider.icon);
  });



  var update = function (data, transitionDuration) {
    var x = d3.scaleLinear()
      .domain([0, Math.max(4, d3.max(data, d => d.dollars))])
      .range([margin.left, graphWidth - margin.right])

    var y = d3.scaleBand()
      .domain(data.map(d => d.artist))
      .range([margin.top, height - margin.bottom])
      .padding(0.1)


    var getXEnd = (provider, d) => _.isFunction(provider.dollarsPerPlay) ? 
              provider.dollarsPerPlay(d) : 
              d.count * provider.dollarsPerPlay;

    var yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0));

    var xAxis = g => g
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(x)
        .ticks(graphWidth / 100)
        .tickFormat(format))
      .call(g => g.select(".domain").remove());

    xAxisElement.transition().duration(transitionDuration).call(xAxis);
    yAxisElement.transition().duration(transitionDuration).call(yAxis);

    var topArtist = data[0],
        iconMargin = 4,
        iconSize = y.bandwidth() - iconMargin * 2;

    var renderDollarBar = (g, provider) => g
          .attr("x", x(0))
          .attr("y", d => y(d.artist))
          .attr("width", d => x(getXEnd(provider, d)) - x(0))
          .attr("height", y.bandwidth())
          .style("fill", provider.color),
        renderLabel = (g) => g
          .attr('fill', '#000')
          .attr("text-anchor", "start")
          .attr("x", d => x(d.dollars) + 4)
          .attr("y", d => y(d.artist) + y.bandwidth() / 2)
          .text(d => format(d.dollars)); // .text(d => `${format(d.dollars)} (${d.count} plays)`);

    var bar = svg.selectAll(".chart")
        .data(data, function(d, i) { return i;}); // Key on position so changing listener profiles works

    var enter = bar.enter().append("g")
        .classed('chart', true);

    _.each(PROVIDERS, (provider) => {
        enter.append("rect")
          .classed(createClassName(provider.name), true)
          .call(renderDollarBar, provider);

        // update provider icons
        svg.select('image.' + createClassName(provider.name))
          .moveToFront()
          .transition().duration(transitionDuration)
            .attr('width', iconSize)
            .attr('height', iconSize)
            .attr("x", x(getXEnd(provider, topArtist)) - iconSize - iconMargin)
            .attr("y", y(topArtist.artist) + iconMargin);
    });
    
    enter.append("text")
        .style("font", "12px sans-serif")
        .attr("dy", "0.35em")
        .call(renderLabel);
    

    var updates = bar.transition().duration(transitionDuration)
        //.attr("transform", getTransform);

    _.each(PROVIDERS, (provider) => {
      updates.select('rect.' + createClassName(provider.name))
          .call(renderDollarBar, provider);
    }); 
  
    updates.select('text')
        .call(renderLabel);
    
    bar.exit().remove();

  };

  // Don't use GraphBase here because then they get hidden by the switchTab.
  return {update: update};
};

var _artistColors = null,
  getArtistColors = (data) => {
    if (!_artistColors) {
      _artistColors = d3.scaleOrdinal(data.map(d => d.artist), schemeCategory20);
    } 
    return _artistColors;
  },
  resetColors = () => _artistColors = null;


var Pie = function(holderElement) {

  var graphHeight = height - margin.top - margin.bottom;

  var svg = createSvg(graphWidth, graphHeight, 'pie', holderElement);
  
  svg
    .attr("text-anchor", "middle")
    .style("font", "12px sans-serif");

  var pie = d3.pie()
    .sort(null)
    .value(d => d.dollars)

  var arc = d3.arc()
      .innerRadius(0)
      .outerRadius(Math.min(graphWidth, height) / 2 - 1);

  var arcLabel = (() => {
    const radius = Math.min(graphWidth, height) / 2 * 0.8;
    return d3.arc().innerRadius(radius).outerRadius(radius);
  })();

  const g = svg.append("g")
      .attr("transform", `translate(${graphWidth / 2},${graphHeight / 3})`);

  var update = function (data, transitionDuration) {
    
    var artistColors = getArtistColors(data),
        color = (artist) => {
          if (artist === PROVIDERS[0].name) {
            return PROVIDERS[0].color;
          } else {
            return artistColors(artist);
          }
        };

    const arcs = pie(data);
    

    var renderPath = g => g
        .attr("fill", d => color(d.data.artist))
        // .attr("stroke", "white")
        .attr("d", arc);

    var renderTitle = g => g
        .text(d => `${d.data.artist}: ${format(d.data.dollars)}` + (d.data.count ? ` (${d.data.count} plays)` : ''));

    var paths = g.selectAll("path")
      .data(arcs);

    paths
      .enter().append("path")
        .call(renderPath)
      .append("title")
        .call(renderTitle);

    var updates = paths.transition().duration(transitionDuration);

    updates
        .call(renderPath)
      .select("title")
        .call(renderTitle);

    paths.exit().remove();

    var renderText = g => g
          .attr("transform", d => `translate(${arcLabel.centroid(d)})`),
        renderDollars = g => g
          .text(d => `${format(d.data.dollars)}` + (d.data.count ? ` (${d.data.count} plays)` : ''));

    const text = g.selectAll("text")
      .data(arcs.filter(d => (d.endAngle - d.startAngle) > 0.25));

    var enter = text.enter()
      .append("text")
        .attr("dy", "0.35em")
        .call(renderText);
    
    enter.append("tspan")
        .classed('artist', true)
        .attr("x", 0)
        .attr("y", "-0.7em")
        .style("font-weight", "bold")
        .text(d => d.data.artist);
    
    enter.append("tspan")
        .classed('dollars', true)
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .call(renderDollars);

    updates = text.transition().duration(transitionDuration);

    updates
      .call(renderText);

    updates
      .select('.artist')
        .text(d => d.data.artist);

    updates
      .select('.dollars')
        .call(renderDollars);

    text.exit().remove();

  };

  return {update: update};
};