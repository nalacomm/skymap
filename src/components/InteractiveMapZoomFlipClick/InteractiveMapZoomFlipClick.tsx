import React, { useEffect } from "react";
import baseImage from "../../images/ir_Gaia_s_sky_Cyl2_4K (1).png";
import { Container } from "react-bootstrap";
import "./InteractiveMapZoomFlipClick.scss";
import * as d3 from "d3";
import ObjectCoordinates from "../../data/Wise_coord_2020.json";
import { Random } from "random-js";

interface ObjectInterface {
  Caldwell_Messier: string;
  "WISE Objects": string;
  L: string | number;
  B: string | number;
  Longitude: string | number;
  Latitude: string | number;
  "size in degrees": string | number;
  "HST image": string;
  Orientation: string;
}

export function InteractiveMapZoomFlipClick() {
  const setting = {
    width: 985,
    height: 492 /*maximum size: 544*/,
    fontSize: 7,
    circleSize: 2.2,
    maxZoom: 10,
  };

  const BrowserText = (function () {
    let canvas = document.createElement("canvas") as HTMLCanvasElement;
    let context = canvas.getContext("2d") as CanvasRenderingContext2D;

    function getWidth(text: string, fontSize: number, fontFace: string): number {
      context.font = fontSize + "px " + fontFace;
      return context.measureText(text).width + 4;
    }

    return {
      getWidth: getWidth,
    };
  })();

  function objectModification(item: ObjectInterface): ObjectInterface {
    if (item["Latitude"] > 0) {
      item["Latitude"] = -Math.abs(Number(item["Latitude"]));
    } else {
      item["Latitude"] = Math.abs(Number(item["Latitude"]));
    }
    return item;
  }

  useEffect(() => {
    renderImage();
  }, []);

  function renderImage() {
    const x = d3.scaleLinear().range([0, setting.width]).domain([-180, 180]);
    const y = d3.scaleLinear().range([0, setting.height]).domain([-90, 90]);
    let lastZoom = 1;
    let zoom = d3
      .zoom<any, unknown>()
      .scaleExtent([1, setting.maxZoom])
      .translateExtent([
        [0, 0],
        [setting.width, setting.height],
      ])
      .on("zoom", zoomed);
    let svg = d3.select("#render_map2").append("svg").attr("width", setting.width).attr("height", setting.height);

    var node = svg.append("g");

    svg.call(zoom);

    node
      .append("image")
      .attr("width", setting.width + "px")
      .attr("height", setting.height + "px")
      .attr("xlink:href", baseImage);

    function zoomed() {
      node.attr("transform", d3.event.transform);
      drawObjects();
    }

    function fontSize(): number {
      let fontSizeT =
        lastZoom !== 1
          ? setting.fontSize - (setting.fontSize * ((100 * lastZoom) / setting.maxZoom)) / 100
          : setting.fontSize;
      if (fontSizeT < 2) {
        fontSizeT = 2;
      }

      return fontSizeT;
    }

    function rectSize(): number {
      return fontSize() / 2;
    }

    function circleSize(): number {
      let rVal =
        d3 && d3.event && d3.event.transform
          ? setting.circleSize - (setting.circleSize * ((100 * d3.event.transform.k) / setting.maxZoom)) / 100
          : setting.circleSize;
      if (rVal < 0.4) {
        rVal = 0.4;
      }

      return rVal;
    }

    function drawObjects(highlightIndex?: number) {
      if (!(d3 && d3.event && d3.event.transform) || lastZoom !== d3.event.transform.k) {
        if (d3 && d3.event && d3.event.transform) {
          lastZoom = d3.event.transform.k;
        }
        ObjectCoordinates.forEach((objectInterface: ObjectInterface, index: number) => {
          const item = objectModification(Object.assign({}, objectInterface));
          let rectSizeT = rectSize();
          let txtFont = fontSize();
          if (highlightIndex && highlightIndex === index) {
            rectSizeT += 3;
            txtFont += 3;
          }
          let findCoord = node.select(".coords[index='" + index + "']");
          let findLabel = node.select(".label[index='" + index + "']");
          if (findCoord.size() === 0) {
            let filColor = "green";
            if (item["Caldwell_Messier"].includes("C")) {
              filColor = "blue";
            } else if (item["Caldwell_Messier"].includes("M")) {
              filColor = "red";
            }
            const rect = node
              .append("rect")
              .attr("class", "coords")
              .attr("x", x(Number(item["Longitude"])))
              .attr("y", y(Number(item["Latitude"])))
              .attr("cursor", "pointer")
              .attr("index", index)
              .attr("fill", filColor)
              .on("click", handleObjectClick)
              .on("mouseover", handleHover)
              .attr("opacity", "0");

            rect.transition().duration(new Random().integer(100, 1000)).attr("opacity", "1");
          }
          if (findLabel.size() === 0) {
            if (lastZoom > 1 || (highlightIndex && highlightIndex === index)) {
              const text = node
                .append("text")
                .attr("class", "label")
                .attr("fill", "white")
                .attr("x", x(Number(item["Longitude"])))
                .attr("y", y(Number(item["Latitude"])))
                .attr("font-family", "Arial")
                .attr("cursor", "pointer")
                .attr("index", index)
                .html(item["WISE Objects"])
                .on("click", handleObjectClick)
                .on("mouseover", handleHover)
                .attr("opacity", "0");
              text.transition().duration(new Random().integer(100, 1000)).attr("opacity", "1");
            }
          }
          let textWidth = 4;
          if (setting.width - setting.width / 4 < x(Number(item["Longitude"]))) {
            textWidth = -BrowserText.getWidth(item["WISE Objects"], txtFont, "Arial");
          }
          const random = new Random().integer(100, 500);
          node
            .select(".coords[index='" + index + "']")
            //@ts-ignore
            .transition()
            .duration(random)
            .attr("height", rectSizeT)
            .attr("width", rectSizeT)
            .attr("transform", "translate(-" + rectSizeT / 2 + ",-" + rectSizeT / 2 + ")")
            .attr("opacity", "1");
          if (lastZoom > 1 || (highlightIndex && highlightIndex === index)) {
            node
              .select(".label[index='" + index + "']")
              //@ts-ignore
              .transition()
              .duration(random)
              .attr("font-size", txtFont + "px")
              .attr("transform", "translate(" + textWidth + ",0)")
              .attr("opacity", "1");
          } else {
            node.select(".label[index='" + index + "']").remove();
          }
        });
      }
    }

    function handleHover() {
      const $this = this as HTMLElement;
      drawObjects(Number($this.getAttribute("index")));
    }
    function handleObjectClick() {
      const $this = this as HTMLElement;
      d3.event.stopPropagation();
      svg
        .transition()
        .duration(500)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(setting.width / 2, setting.height / 2)
            .scale(6)
            .translate(-Number($this.getAttribute("x")), -Number($this.getAttribute("y"))),
          d3.mouse($this),
        );
    }
    drawObjects();
  }
  return (
    <div className="mt-5">
      <Container fluid>
        <div
          id="render_map2"
          style={{
            width: setting.width + "px",
            height: setting.height + "px",
            margin: "0 auto",
            overflow: "hidden",
          }}
        />
      </Container>
    </div>
  );
}

export default InteractiveMapZoomFlipClick;
