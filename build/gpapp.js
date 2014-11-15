/** @jsx React.DOM */

var GPApp = React.createClass({displayName: 'GPApp',
  getInitialState: function() {
    return { GPs: [new GP(0, [1,0.2], 1, [], [], [])],
             newGPParam: 1.0,
             newGPNoise: 0.2,
             newGPcf: 0,
             newGPavailableIDs: [10, 9, 8, 7, 6, 5, 4, 3, 2],
             alfa: 0.3,
             stepSize: 3.14,
             NSteps: 15,
             addTrPoints: false,
             trPointsX: [],
             trPointsY: [],
             dmTr: [],
             dmTeTr: [],
             samplingState: 0, // 0 = stopped, 1 = discrete, 2 = continuous
             oldSamplingState: 0,
             showSamples: true,
             showMeanAndVar: false
            }
  },
  setAlfa: function(newVal) { this.setState({ alfa: newVal }); },
  setStepSize: function(newVal) { this.setState({ stepSize: newVal }); },
  setNSteps: function(newVal) { this.setState({ NSteps: newVal }); },
  toggleAddTrPoints: function() {
    if (this.state.addTrPoints){
      // added training points
      var dmTr = computeDistanceMatrix(this.state.trPointsX, this.state.trPointsX);
      var dmTeTr = computeDistanceMatrix(tePointsX, this.state.trPointsX);

      var newGPs = recomputeProjections(this.state.GPs, dmTr, dmTeTr, this.state.trPointsY);

      this.setState({ addTrPoints: !this.state.addTrPoints, GPs: newGPs, dmTr: dmTr, dmTeTr: dmTeTr, samplingState: this.state.oldSamplingState });
    } else {
      // beginning to add training points
      this.setState({ addTrPoints: !this.state.addTrPoints, oldSamplingState: this.state.samplingState, samplingState: 0 });
    }
  },
  clearTrPoints: function() { this.setState({ trPointsX: [], trPointsY: [] }); },
  toggleShowMeanAndVar: function() { if (!this.state.addTrPoints) this.setState({ showMeanAndVar: !this.state.showMeanAndVar }); },
  toggleShowSamples: function() {
    if (!this.state.addTrPoints) {
      if (this.state.showSamples) {
        this.setState({ samplingState: 0, showSamples: false });
      } else {
        this.setState({ samplingState: this.state.oldSamplingState, showSamples: true });
      }
    }
  },
  setNewGPParam: function(newVal) { this.setState({ newGPParam: newVal }); },
  setNewGPNoise: function(newVal) { this.setState({ newGPNoise: newVal }); },
  setNewGPcf: function(event) { this.setState({ newGPcf: event.target.value }); },
  addGP: function() {
    if (this.state.newGPavailableIDs.length < 1) return;
    var id = this.state.newGPavailableIDs.pop();
    var newGPs = this.state.GPs.concat([new GP(this.state.newGPcf, [this.state.newGPParam, this.state.newGPNoise], id, this.state.dmTr, this.state.dmTeTr, this.state.trPointsY)]);
    this.setState({ GPs: newGPs, newGPavailableIDs: this.state.newGPavailableIDs });
  },
  delGP: function(id) {
    return (function() {
      var newGPs = this.state.GPs;
      var delIdx = newGPs.findIndex(function (g) { return g.id == id; });
      if (delIdx >= 0) {
        newGPs.splice(delIdx, 1);
        this.state.newGPavailableIDs.push(id);
        this.setState({ GPs: newGPs });
      }
    }).bind(this);
  },
  addTrPoint: function(x, y) {
    if (x >= -5 && x <= 5 && y >= -3 && y <= 3){
      var newTrPointsX = this.state.trPointsX.concat([x]);
      var newTrPointsY = this.state.trPointsY.concat([y]);
      this.setState({ trPointsX: newTrPointsX, trPointsY: newTrPointsY });
    }
  },
  stopSampling: function() { this.setState({ samplingState: 0, oldSamplingState: 0 }); },
  startDiscreteSampling: function() { this.setState({ samplingState: 1, oldSamplingState: 1 }); },
  startContinuousSampling: function() { this.setState({ samplingState: 2, oldSamplingState: 2 }); },
  render: function() {
    var sliderOptAlfa = { width: 200, height: 9, min: 0, max: 1 };
    var sliderOptStepSize = { width: 200, height: 9, min: 0, max: 2*Math.PI };
    var sliderOptNSteps = { width: 200, height: 9, min: 1, max: 100, step: 1 };
    var sliderOptGPParam = { width: 200, height: 9, min: 0.01, max: 5 };
    var sliderOptGPNoise = { width: 200, height: 9, min: 0, max: 2 };
    var delGP = this.delGP;
    var gpoptions = cfs.map(function (c) {
      return (React.DOM.option( {value:c.id}, c.name));
    });
    return (
      React.DOM.div( {id:"gp"}, 
        GPAxis( {state:this.state, addTrPoint:this.addTrPoint} ),
        React.DOM.div( {id:"controls"}, 
          React.DOM.input( {type:"checkbox", checked:this.state.showMeanAndVar, onChange:this.toggleShowMeanAndVar} ),"Show mean and credible intervals"+' '+
          " ",React.DOM.input( {type:"checkbox", checked:this.state.showSamples, onChange:this.toggleShowSamples} ),"Show samples",React.DOM.br(null ),
          React.DOM.button( {onClick:this.startDiscreteSampling, disabled:this.state.samplingState === 1 || this.state.addTrPoints || !this.state.showSamples}, "sample independently"),
          React.DOM.button( {onClick:this.startContinuousSampling, disabled:this.state.samplingState === 2 || this.state.addTrPoints || !this.state.showSamples}, "sample continuous trajectories"),
          React.DOM.button( {onClick:this.stopSampling, disabled:this.state.samplingState === 0 || this.state.addTrPoints}, "stop sampling"),
          React.DOM.br(null ),
          this.state.addTrPoints ? React.DOM.span( {className:"info"}, "click on the figure to add an observation " ) : '',
          React.DOM.button( {onClick:this.toggleAddTrPoints}, this.state.addTrPoints ? "done" : "add observations"),
          this.state.addTrPoints ? React.DOM.button( {onClick:this.clearTrPoints}, "clear") : ''
        ),
        React.DOM.div( {id:"opts"}, 
        React.DOM.h2(null, "Trajectory simulation settings"),
        React.DOM.table(null, 
          React.DOM.tr(null, React.DOM.td(null, "Momentum refreshment"),React.DOM.td(null, Slider( {value:this.state.alfa, setValue:this.setAlfa, opt:sliderOptAlfa} ), " ", this.state.alfa.toFixed(2))), 
          React.DOM.tr(null, React.DOM.td(null, "Path length"),React.DOM.td(null, Slider( {value:this.state.stepSize, setValue:this.setStepSize, opt:sliderOptStepSize} ), " ", this.state.stepSize.toFixed(2))), 
          React.DOM.tr(null, React.DOM.td(null, "Number of steps in path"),React.DOM.td(null, Slider( {value:this.state.NSteps, setValue:this.setNSteps, opt:sliderOptNSteps} ), " ", this.state.NSteps)) 
        )
        ),
        React.DOM.div( {id:"gplist"}, 
          React.DOM.div( {id:"addgp"}, 
          React.DOM.h2(null, "Add new process"),
          React.DOM.table(null, 
            React.DOM.tr(null, React.DOM.td(null, "Covariance function"),React.DOM.td(null, React.DOM.select( {value:this.state.newGPcf, onChange:this.setNewGPcf}, gpoptions))),
            React.DOM.tr(null, React.DOM.td(null, "Length scale"),React.DOM.td(null, Slider( {value:this.state.newGPParam, setValue:this.setNewGPParam, opt:sliderOptGPParam} ), " ", this.state.newGPParam.toFixed(2))),
            React.DOM.tr(null, React.DOM.td(null, "Noise"),React.DOM.td(null, Slider( {value:this.state.newGPNoise, setValue:this.setNewGPNoise, opt:sliderOptGPNoise} ), " ", this.state.newGPNoise.toFixed(2)))
          ),
          React.DOM.button( {onClick:this.addGP, disabled:this.state.newGPavailableIDs.length <= 0}, "add")
          ),
        React.DOM.h2(null, "Process list"),
        React.DOM.table(null, 
          React.DOM.thead(null, 
            React.DOM.tr(null, React.DOM.th(null, "id"),React.DOM.th(null, "covariance"),React.DOM.th(null, "length scale"),React.DOM.th(null, "noise"),React.DOM.th(null))
          ),
          GPList( {GPs:this.state.GPs, delGP:this.delGP} )
        )
        )
      )
    )
  }
});

React.renderComponent(
  GPApp(null ),
  document.getElementById('gp-outer')
);
