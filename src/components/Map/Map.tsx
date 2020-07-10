import React, { Component, createRef } from "react";
import { connect } from "react-redux";
import { getMapData } from "../../actions/mapAction";
import "./Map.scss";
import baseImage from "../../images/ir_Gaia_s_sky_Cyl2_4K (1).png";
import { Container } from "react-bootstrap";

interface XY {
  x: number;
  y: number;
}

export class Map extends Component<any, any> {
  private baseImageElement = createRef<HTMLImageElement>();
  private intervalId: any = null;

  constructor(props: any) {
    super(props);
    this.state = {
      baseImageHeight: 0,
      baseImageWidth: 0,
      currentBaseImageHeight: 0,
      currentBaseImageWidth: 0,
      xGridOn: true,
      yGridOn: true,
      labelsOn: true,
      dotsOn: true,
    };
    this.handleImageLoaded = this.handleImageLoaded.bind(this);
    this.convertLatLongToXY = this.convertLatLongToXY.bind(this);
    this.convertValueRange = this.convertValueRange.bind(this);
  }

  componentDidMount(): void {
    this.props.getMapData();
    this.intervalId = setInterval(this.handleImageLoaded.bind(this), 1000);
  }

  componentWillUnmount(): void {
    clearInterval(this.intervalId);
  }

  handleImageLoaded(): void {
    let node = this.baseImageElement.current;
    if (node) {
      this.setState({
        baseImageHeight: node.naturalHeight,
        baseImageWidth: node.naturalWidth,
        currentBaseImageHeight: node.clientHeight,
        currentBaseImageWidth: node.clientWidth,
      });
    }
  }

  convertValueRange(OldMin: number, OldMax: number, NewMin: number = 0, NewMax: number, value: number): number {
    let OldRange = OldMax - OldMin;
    let NewRange = NewMax - NewMin;
    return ((value - OldMin) * NewRange) / OldRange + NewMin;
  }

  convertLatLongToXY(latitude: number, longitude: number): XY {
    let { currentBaseImageHeight, currentBaseImageWidth } = this.state;
    return {
      x: this.convertValueRange(-180, 180, 0, currentBaseImageWidth, longitude),
      y: this.convertValueRange(-90, 90, 0, currentBaseImageHeight, latitude),
    };
  }

  renderXGrid(): React.ReactElement[] {
    let xgrid: React.ReactElement[] = [];
    for (let i: number = -180; i < 180; i += 10) {
      xgrid.push(
        <div className="xgrid" key={i}>
          <div className="xgridtxt">{i}</div>
        </div>,
      );
    }
    return xgrid;
  }

  renderYGrid(): React.ReactElement[] {
    let ygrid: React.ReactElement[] = [];
    for (let i: number = -90; i < 90; i += 10) {
      ygrid.push(
        <div className="ygrid" key={i}>
          <div className="ygridtxt">{i}</div>
        </div>,
      );
    }
    return ygrid;
  }

  render() {
    const { xGridOn, yGridOn, labelsOn, dotsOn, currentBaseImageWidth } = this.state;

    return (
      <div className="map-page-container">
        <Container fluid>
          <div className="map-button-container">
            <label htmlFor="xgrid">
              X Grid
              <input
                type="checkbox"
                checked={xGridOn}
                name="xgrid"
                id="xgrid"
                onChange={(event) => {
                  this.setState({ xGridOn: event.target.checked });
                }}
              />
            </label>
            <label htmlFor="ygrid">
              Y Grid
              <input
                type="checkbox"
                checked={yGridOn}
                name="ygrid"
                id="ygrid"
                onChange={(event) => {
                  this.setState({ yGridOn: event.target.checked });
                }}
              />
            </label>
            <label htmlFor="labels">
              Labels
              <input
                type="checkbox"
                checked={labelsOn}
                name="labels"
                id="labels"
                onChange={(event) => {
                  this.setState({ labelsOn: event.target.checked });
                }}
              />
            </label>
            <label htmlFor="dot">
              Dots
              <input
                type="checkbox"
                checked={dotsOn}
                name="dot"
                id="dot"
                onChange={(event) => {
                  this.setState({ dotsOn: event.target.checked });
                }}
              />
            </label>
          </div>
          <div className="base-image-container">
            <img src={baseImage} alt="Base" ref={this.baseImageElement} onLoad={this.handleImageLoaded} />
            {yGridOn && <div className="xgrid-container">{this.renderXGrid()}</div>}
            {xGridOn && <div className="ygrid-container">{this.renderYGrid()}</div>}
            {this.props.mapData &&
              this.props.mapData.length &&
              this.props.mapData.map((item: any, key: number) => {
                const { x, y } = this.convertLatLongToXY(item["Latitude"], item["Longitude"]);
                return (
                  <div
                    key={key}
                    style={{
                      left: isNaN(x) ? 0 : x,
                      top: isNaN(y) ? 0 : y,
                    }}
                    className="xy-item"
                  >
                    <span className={!dotsOn ? "invisible" : ""} />
                    {labelsOn && (
                      <div className={"obj-label " + (currentBaseImageWidth / 2 < x ? "left-hang" : "")}>
                        {item["WISE Objects"]}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </Container>
      </div>
    );
  }
}

const mapDispatchToProps: any = {
  getMapData,
};

const mapStateToProps = (state: any, ownProps: any) => {
  return {
    mapData: state.mapData,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Map);
