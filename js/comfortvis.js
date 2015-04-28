/**
 * Grades Visualization
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @param _eventHandler -- the Eventhandling Object to emit data to
 * @constructor
 */
ComfortVis = function(_parentElement, _data, _metaData, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.metaData = _metaData;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.filters = {};

    this.margin = {top: 10, right: 10, bottom: 20, left: 20},
    this.width = 400 - this.margin.left - this.margin.right,
    this.height = 300 - this.margin.top - this.margin.bottom;

    this.initVis();
}


/**
 * Method that sets up the SVG and the variables
 */
ComfortVis.prototype.initVis = function(){

    var that = this;

    // Create new SVG element
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axes and scales
    this.x = d3.scale.linear()
      .domain([0, 10])
      .range([0, this.width]);

    this.y = d3.scale.linear()
      .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")

    this.svg.append("g")
        .attr("class", "y axis")

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
}

/**
 * Method to wrangle the data.
 */
ComfortVis.prototype.wrangleData = function(_filterFunction, _filterId) {

    var that = this;

    var filter = function() { return false; }
    if (_filterFunction != null) {
        filter = _filterFunction;
        if (that.filters[_filterId]) {
          delete that.filters[_filterId];
        }
        else {
          that.filters[_filterId] = filter;
        }
    }

    // todo: starting with just midterm data
    var data = this.data.map(function(d) {
      return d.comfort;
    });

    this.displayData = d3.layout.histogram()
      .bins(this.x.ticks(10))
      (data);

    var filtered = this.data;

    if (isEmpty(this.filters)) {
      filtered = filtered.filter(function() { return false; });
    }
    else {
      filtered = multiFilter(filtered, that.filters);
    }

    var data2 = filtered.map(function(d) {
      return d.comfort;
    });

    this.displayData2 = d3.layout.histogram()
      .bins(this.x.ticks(10))
      (data2);

}

/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
ComfortVis.prototype.updateVis = function() {

    var that = this;

    this.svg.selectAll(".bar").remove();

    // Update scales with domains
    this.y.domain([0, d3.max(this.displayData, function(d) { return d.y; })]);

    var width = that.x(that.displayData[0].dx) - 1;

    var bar = this.svg.selectAll(".bar")
      .data(that.displayData)
      .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + (that.x(d.x) - .5 * width) + "," + that.y(d.y) + ")"; });

    bar.append("rect")
      .attr("x", 1)
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d.y); });

    var bar2 = this.svg.selectAll(".bar2")
      .data(that.displayData2)
      .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + (that.x(d.x) - .5 * width) + "," + that.y(d.y) + ")"; });

    bar2.append("rect")
      .attr("x", 1)
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d.y); })
      .style("fill", "steelblue");

    // Update axes
    this.svg.select(".x.axis")
      .call(that.xAxis);

    this.svg.select(".y.axis")
      .call(that.yAxis)
}

ComfortVis.prototype.onSelectionChange = function (id, min, max) {

    var filter = function(d) {
      return d.grades.midterm >= min && d.grades.midterm < max;
    }

    this.wrangleData(filter, id);

    this.updateVis();
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

function multiFilter(data, filterFunctions) {
  filtered = [];
  for (item in data) {
    for (key in filterFunctions) {
      if (filterFunctions[key](data[item])) {
        filtered.push(data[item]);
        break;
      }
    }
  }
  return filtered;
}
