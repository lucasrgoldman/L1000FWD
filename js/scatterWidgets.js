/*
The widgets for the interactive scatter plot.
*/

var Legend = Backbone.View.extend({
	// A view for the legends of the Scatter3dView
	// tagName: 'svg',
	defaults: {
		container: document.body,
		scatterPlot: Scatter3dView,
		w: 300,
		h: 800,
	},

	initialize: function(options){
		if (options === undefined) {options = {}}
		_.defaults(options, this.defaults)
		_.defaults(this, options)
		this.setUpDOMs();
		// render if the scatterPlot changed
		this.listenTo(this.scatterPlot, 'shapeChanged', this.render)
		this.listenTo(this.scatterPlot, 'colorChanged', this.render)
	},

	setUpDOMs: function(){
		// set up DOMs for the legends
		this.el = d3.select(this.container)
			.append('svg')
			.attr('width', this.w)
			.attr('height', this.h)
			.style('z-index', 10)
			.style('position', 'absolute')
			.style('left', '0px')
			.style('top', '0px')
			;

		this.g = this.el.append('g')
			.attr('class', 'legend')
			.attr('transform', 'translate(10, 20)');
		this.g.append('g')
			.attr('id', 'legendShape')
			.attr("class", "legendPanel")
			.attr("transform", "translate(0, 0)");
		this.g.append('g')
			.attr('id', 'legendColor')
			.attr("class", "legendPanel")
			.attr("transform", "translate(100, 0)");

	},

	render: function(){
		// set up legend
		// shape legend
		var scatterPlot = this.scatterPlot;
		var legendShape = d3.legend.symbol()
			.scale(scatterPlot.shapeScale)
			.orient("vertical")
			.title(scatterPlot.shapeKey);
		this.g.select("#legendShape")
			.call(legendShape);

		// color legend
		var legendColor = d3.legend.color()
			.title(scatterPlot.colorKey)
			.shapeWidth(20)
			.cells(5)
			.scale(scatterPlot.colorScale);

		this.g.select("#legendColor")
			.call(legendColor);

		return this;
	},

});



var Controler = Backbone.View.extend({

	defaults: {
		container: document.body,
		scatterPlot: Scatter3dView,
		w: 300,
		h: 800,
	},

	initialize: function(options){
		if (options === undefined) {options = {}}
		_.defaults(options, this.defaults)
		_.defaults(this, options)

		this.model = this.scatterPlot.model;

		this.listenTo(this.model, 'sync', this.render);

		var scatterPlot = this.scatterPlot;

		this.listenTo(scatterPlot, 'shapeChanged', this.changeSelection)

		scatterPlot.listenTo(this, 'shapeChanged', function(selectedMetaKey){
			scatterPlot.shapeBy(selectedMetaKey);
		});
		scatterPlot.listenTo(this, 'colorChanged', function(selectedMetaKey){
			scatterPlot.colorBy(selectedMetaKey);
		});

	},

	render: function(){
		// set up DOMs for the controler
		this.el = d3.select(this.container)
			.append('div')
			.attr('id', 'controls')
			.style('width', this.w)
			.style('height', this.h)
			.style('z-index', 10)
			.style('position', 'absolute')
			.style('right', '0px')
			.style('top', '0px');

		var model = this.model;
		// filter out metas used as index
		var metas = _.filter(model.metas, function(meta){ return meta.nUnique < model.n; });
		var self = this;


		// Shapes: 
		var shapeControl = this.el.append('div')
			.attr('class', 'form-group');
		shapeControl.append('label')
			.attr('class', 'control-label')
			.text('Shape by:');

		var shapeSelect = shapeControl.append('select')
			.attr('id', 'shape')
			.attr('class', 'form-control')
			.on('change', function(){
				var selectedMetaKey = d3.select('#shape').property('value');
				self.trigger('shapeChanged', selectedMetaKey)
			});

		var shapeOptions = shapeSelect
			.selectAll('option')
			.data(_.pluck(metas, 'name')).enter()
			.append('option')
			.text(function(d){return d;})
			.attr('value', function(d){return d;});

		// Colors
		var colorControl = this.el.append('div')
			.attr('class', 'form-group')
		colorControl.append('label')
			.attr('class', 'control-label')
			.text('Color by:');

		var colorSelect = colorControl.append('select')
			.attr('id', 'color')
			.attr('class', 'form-control')
			.on('change', function(){
				var selectedMetaKey = d3.select('#color').property('value');
				self.trigger('colorChanged', selectedMetaKey)
			});

		var colorOptions = colorSelect
			.selectAll('option')
			.data(_.pluck(metas, 'name')).enter()
			.append('option')
			.text(function(d){return d;})
			.attr('value', function(d){return d;});

		return this;
	},

	changeSelection: function(){
		// change the current selected option to value
		$('#shape').val(this.scatterPlot.shapeKey); 
		$('#color').val(this.scatterPlot.colorKey);
	},

});

var Overlay = Backbone.View.extend({
	// An overlay to display current status.
	tagName: 'div',
	defaults: {
		container: document.body,
		scatterPlot: Scatter3dView,
	},

	initialize: function(options){
		if (options === undefined) {options = {}}
		_.defaults(options, this.defaults)
		_.defaults(this, options)
		
		this.render();
		this.changeMessage('Retrieving data from the server...');

		// finished retrieving data
		var self = this;
		this.listenTo(this.scatterPlot.model, 'sync', function(){
			self.changeMessage('Data retrieved. Rendering scatter plot...');
		});
		// finished rendering
		this.listenTo(this.scatterPlot, 'shapeChanged',
			this.remove)
	},

	render: function(){
		var w = $(this.container).width(),
			h = $(this.container).height();
		this.el = d3.select(this.container)
			.append(this.tagName)
			.style('width', w)
			.style('height', h)
			.style('z-index', 10)
			.style('position', 'absolute')
			.style('right', '0px')
			.style('top', '0px')
			.style('background-color', 'rgba(50, 50, 50, 0.5)')
			.style('cursor', 'wait');

		this.msgDiv = this.el.append('div')
			.style('z-index', 11)
			.style('position', 'absolute')
			.style('text-align', 'center')
			.style('width', '100%')
			.style('top', '50%')
			.style('font-size', '250%');
		
		return this;
	},

	changeMessage: function(msg){
		this.msgDiv.text(msg);
	},

	remove: function(){
		this.changeMessage('Rendering completed')
		// COMPLETELY UNBIND THE VIEW
		this.undelegateEvents();
		// Remove view from DOM
		this.el.remove()
		// this.remove();  
		// Backbone.View.prototype.remove.call(this);
	},
});
