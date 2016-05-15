//var rawData = data = formattedData = [];
//var  timestamps = data_current = data_temp = data_voltage = [];

// this points to the datalog file location
var DATALOG = "datalog.csv",
	ARDUINO_IP = "ip.txt",
	VOLTAGE_MIN = 11.6,
	VOLTAGE_MAX = 12.6;

// this lists the colum titles and respective order
var FIELDS = {
	"time"		: 0,
	"vin"		: 1,
	"cin"		: 2,
	"vbat"		: 3,
	"vout"		: 4,
	"cout"		: 5,
	"temp"		: 6,
	"humidity"	: 7
}

// length of fields
var DATA_FIELD_LEN = Object.keys(FIELDS).length;

$(document).ready(function(){
	var data_raw,
		data,
		data_formatted,
		recent;

	var ip;

	if (navigator.geolocation){
		navigator.geolocation.getCurrentPosition(function( position ){
			$("#lat").text(String(position.coords.latitude).substr(0,4));
			$("#angle").text(String(getPanelAngle(position.coords.latitude)).substr(0,4));
		});
	}

	$.get(DATALOG, function(response) {
		data_raw = CSVToArray(response);
		data_formatted = removeBadDataPoints(data_raw);
		populateTable(data_formatted);

		data = parseData(data_formatted);

		// example of compound function
		data.powerIn = data_formatted.map(function(obj) {return (obj[FIELDS["cin"]] / 1000) * obj[FIELDS["vin"]]});
		data.powerOut = data_formatted.map(function(obj) {return (obj[FIELDS["cout"]] / 1000) * obj[FIELDS["vout"]]});

		$("#live_power").html(String(data.powerIn.last() - data.powerOut.last()).substr(0,3));
		$("#live_temperature").html(String(data.temp.last()).substr(0,3));
		$("#live_moisture").html(String(data.humidity.last()).substr(0,3));
		$("#live_voltage").html(String(data.vbat.last()).substr(0, 3));

		// draw graph with x, y functions
		drawGraph(data.time, data.powerIn, "Power In");
		drawGraph(data.time, data.powerOut, "Power Out")
		drawGraph(data.time, data.vbat, "Battery Voltage");

		drawStateOfCharge(data.vbat.last());

	});

	$.get(ARDUINO_IP, function(response){
		ip = response;
		$("#ip").attr("href", "http://" + ip);
	});

	$("#toggleTable").click(function(){
		$("table").toggle();
		$("#toggleTable").toggleClass('hidden');
	})
})

Array.prototype.last = function() {
	return this[this.length-1];
}

function getPanelAngle(latitude) {
	var month = new Date().getMonth();
		angle;

	// summer (april 18 - aug 24)
	if(month >= 4 && month < 8) {
		angle = latitude * .92 - 24.3;
	}
	// winter (oct 7 - march 5)
	else if (month >= 10 || month < 3) {
		angle = latitude * .89 + 24;
	}
	// spring/autumn
	else {
		angle = latitude * .98 - 2.3;
	}

	return 90 - angle;
}

/* copy the data from each index into the appropriate category */
function parseData(data_formatted) {
	// copy the object so we don't overwrite original
	var output = $.extend(true, {}, FIELDS);

	// load each key/value pair with the data for that column
	Object.keys(output).forEach(function(field){
		output[field] = data_formatted.map(function(arr) {
			return arr[output[field]];
		});
	});

	return output;
}

/* remove bad data points*/
function removeBadDataPoints(rawData){
	var len = rawData.length,
		data = [];

	/* strip out bad data points and header */
	for(i = 1; i < len; i++){
		if(rawData[i].length === DATA_FIELD_LEN && !isNaN(rawData[i][1])) {
			data.push(rawData[i]);
		} else {
			console.log("Bad data point at index " + i +". Data = [" + rawData[i] + "].");
		}
	}

	// map data matrix to arrays
	return data;
}

function dayMonthFromString(data, index){
	console.log(data[index]);
	return data[index].substr(0, 5);
}

/* write data into table */
function populateTable(data){
	var i = 1,
		len = data.length,
		table = $("#data"),
		date = "";

	// run loop in reverse to put newest data first
	for(i = len -1; i >= 0; i--){
		var text = "<tr>";
		for(j = 0; j < DATA_FIELD_LEN; j++) {
			text += "<td>" + data[i][j] + "</td>";
		}
		text += "</tr>";
		$("table").append(text);
	}
}

/* update styling on the battery display indicator */
function drawStateOfCharge(curr) {

	var percent = (curr - VOLTAGE_MIN) / (VOLTAGE_MAX - VOLTAGE_MIN) * 100,
		percent_string,
		indicator,
		indicator_low = 25,
		indicator_med = 75;

	if(percent > 100) { percent = 100; } else if (percent < 0) { percent = 0; }

	percent_string = String(parseInt(percent));

	indicator = d3.select("#charge").style("width", (percent_string + "%"));

	d3.select("#percent")
		.attr("text-anchor", "middle")
		.text(percent_string + "%");

	if ( percent < indicator_low ) {
		indicator.style("background-color", "red");
	} else if (percent < indicator_med) {
		indicator.style("background-color", "orange");
	} else {
		indicator.style("background-color", "green");
	}
}

/* d3 data */
function drawGraph(x_data, y_data, title) {
	/* prepare a formatted data set */
	var data = [],
		len = y_data.length;
		data = y_data;

	/* set up graph variables */
	var w = 350,
		h = 200,
		margin = 20,
		max = d3.max(data),
		x_ticks = 5,
		y_ticks = 5,
		y = d3.scale.linear().domain([0, max]).range([0 + margin, h - margin]),
		x = d3.scale.linear().domain([0, len]).range([0 + margin, w - margin]);

	/* append an SVG to the body of the document with set width and height */
	var vis = d3.select("#charts")
		//.append("div")
		.append("svg:svg")
		.attr("id", title)
		.attr("width", w)
		.attr("height", h);

		//vis.enter().append("h3").text(title);
		//.insert("h3").text(title);

	/* append a group that is transformed so bottom left becomes origin */
	var g = vis.append("svg:g")
		.attr("transform", "translate(0, " + h + ")");

	/* */
	var line = d3.svg.line()
		.x(function(d,i) { return x(i); })
		.y(function(d) { return -1 * y(d); });

	g.append("svg:line")
		.attr("x1", x(0))
		.attr("y1", -1 * y(0))
		.attr("x2", x(len))
		.attr("y2", -1 * y(0));

	g.append("svg:line")
		.attr("x1", x(0))
		.attr("y1", -1 * y(0))
		.attr("x2", x(0))
		.attr("y2", -1 * y(max));

	g.append("svg:text")
		.text(title)
		.attr("text-anchor", "middle")
		.attr("dy", "1em")
		.attr("y", -h)
		.attr("x", w/2);

	g.selectAll(".xLabel")
		.data(x.ticks(x_ticks))
		.enter().append("svg:text")
		.attr("class", "xLabel")
		.text(function(d) { return dayMonthFromString(x_data, d) })//String)
		.attr("x", function(d) { return x(d) })
		.attr("y", 0)
		.attr("text-anchor", "middle");

	g.selectAll(".yLabel")
		.data(y.ticks(y_ticks))
		.enter().append("svg:text")
		.attr("class", "yLabel")
		.text(String)
		.attr("x", 0)
		.attr("y", function(d) { return -1 * y(d) })
		.attr("text-anchor", "right")
		.attr("dy", 4);

	g.selectAll(".xTicks")
		.data(x.ticks(x_ticks))
		.enter().append("svg:line")
		.attr("class", "xTicks")
		.attr("x1", function(d) { return x(d); })
		.attr("y1", -1 * y(0))
		.attr("x2", function(d) { return x(d); })
		.attr("y2", -1 * y(-0.3));

	g.selectAll(".yTicks")
		.data(y.ticks(y_ticks))
		.enter().append("svg:line")
		.attr("class", "yTicks")
		.attr("y1", function(d) { return -1 * y(d); })
		.attr("x1", x(-0.3))
		.attr("y2", function(d) { return -1 * y(d); })
		.attr("x2", x(0));

	// draw the data
	g.append("svg:path").attr("d", line(data));
}
