import React, { Component } from "react";
import { connect } from "react-redux";
import baseImage from "../../images/ir_Gaia_s_sky_Cyl2_4K (1).png";
import { Container } from "react-bootstrap";
import "./InteractiveMap.scss";
import * as d3 from "d3";
import { getMapData } from "../../actions/mapAction";
import dataD from "../../data/Wise_coord_2020.json";

export class InteractiveMap extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  componentDidMount(): void {
    this.props.getMapData();
    this.renderImage();
  }

  componentWillUnmount(): void {}

  renderImage() {
    const size = {
      width: 985,
      height: 492,
    };

    const x = d3.scaleLinear().range([0, size.width]).domain([-180, 180]);
    const y = d3.scaleLinear().range([0, size.height]).domain([-90, 90]);

    let node = d3
      .select("#render_map")
      .append("svg")
      .attr("width", size.width)
      .attr("height", size.height)
      .call(
        d3
          .zoom<any, unknown>()
          .scaleExtent([1, 10])
          .translateExtent([
            [0, 0],
            [size.width, size.height],
          ])
          .on("zoom", function () {
            node.attr("transform", d3.event.transform);
          }),
      )
      .append("g");

    node
      .append("image")
      .attr("width", size.width + "px")
      .attr("height", size.height + "px")
      .attr("xlink:href", baseImage);

    // // add the X Axis
    // node
    //   .append("g")
    //   .attr("class", "axis")
    //   .attr("transform", "translate(0," + (size.height - 20) + ")")
    //   .call(d3.axisBottom(x));

    // // add the Y Axis
    // node
    //   .append("g")
    //   .attr("class", "axis")
    //   .attr("transform", "translate(25,0)")
    //   .call(d3.axisLeft(y));

    dataD.forEach((item: any) => {
      node
        .append("circle")
        .attr("class", "coords")
        .attr("fill", "red")
        .attr("r", 2.2)
        .attr("cx", x(item["Longitude"]))
        .attr("cy", y(item["Latitude"]));

      const rr = node
        .append("text")
        .attr("class", "label")
        .attr("fill", "white")
        .attr("x", x(item["Longitude"]))
        .attr("y", y(item["Latitude"]))
        .attr("font-family", "Arial")
        .attr("font-size", "8px")
        .html(item["WISE Objects"]);

      if (size.width - size.width / 4 < x(item["Longitude"])) {
        rr.attr("transform", function () {
          var BrowserText = (function () {
            var canvas = document.createElement("canvas"),
              context = canvas.getContext("2d");
            function getWidth(text: string, fontSize: number, fontFace: string): number {
              //@ts-ignore
              context.font = fontSize + "px " + fontFace;
              //@ts-ignore
              return context.measureText(text).width + 5;
            }

            return {
              getWidth: getWidth,
            };
          })();
          return "translate(-" + BrowserText.getWidth(item["WISE Objects"], 8, "Arial") + ",3)";
        });
      } else {
        rr.attr("transform", "translate(5,3)");
      }
    });
  }

  render() {
    return (
      <div className="">
        <Container fluid>
          <div id="render_map" />
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

export default connect(mapStateToProps, mapDispatchToProps)(InteractiveMap);
