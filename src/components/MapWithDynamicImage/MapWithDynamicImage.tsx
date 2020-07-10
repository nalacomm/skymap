import React, { useEffect } from "react";
import { Container } from "react-bootstrap";
import "./MapWithDynamicImage.scss";
import * as d3 from "d3";
import ObjectCoordinates from "../../data/Wise_coord_2020.json";
import ImageData from "../../data/image.json";
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

export function MapWithDynamicImage() {
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
    item["Latitude"] = Number(String(item["Latitude"]).replace(/[^0-9.-]/g, ""));
    item["Longitude"] = Number(String(item["Longitude"]).replace(/[^0-9.-]/g, ""));
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
    let coords = {
      x1: 0,
      y1: 0,
      x2: setting.width,
      y2: setting.height,
    };
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

    var imgG = node.append("g");

    imgG
      .insert("svg:image")
      .attr("preserveAspectRatio", "none")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", setting.width)
      .attr("height", setting.height)
      .attr("xlink:href", process.env.PUBLIC_URL + "/img-set/image-1.jpg");
    imgG
      .insert("svg:image")
      .attr("preserveAspectRatio", "none")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", setting.width)
      .attr("height", setting.height)
      .attr("xlink:href", process.env.PUBLIC_URL + "/img-set/image.jpg");

    function zoomed() {
      const xy1 = d3.event.transform.invert([0, 0]);
      const xy2 = d3.event.transform.invert([setting.width, setting.height]);
      coords = {
        x1: xy1[0],
        y1: xy1[1],
        x2: xy2[0],
        y2: xy2[1],
      };
      node.attr("transform", d3.event.transform);
      drawObjects();
      //drawImages();
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

    function drawImages() {
      function getX(singleImage: any, index: number) {
        let { numTileWidth, tiles } = singleImage;
        let { xN } = tiles[index];
        if (xN === 0) {
          return 0;
        } else {
          return Math.floor((xN * setting.width) / numTileWidth);
        }
      }

      function getY(singleImage: any, index: number) {
        let { numTileHeight, tiles } = singleImage;
        let { yN } = tiles[index];
        if (yN === 0) {
          return 0;
        } else {
          return Math.floor((yN * setting.height) / numTileHeight);
        }
      }

      for (let i = 0; i < ImageData.length; i++) {
        const singleImage = ImageData[i];
        for (let p = 0; p < singleImage.tiles.length; p++) {
          const uWidth = Math.ceil(setting.width / singleImage.numTileWidth);
          const uHeight = Math.ceil(setting.height / singleImage.numTileHeight);
          const x1 = getX(singleImage, p);
          const y1 = getY(singleImage, p);
          const x2 = x1 + uWidth;
          const y2 = y1 + uHeight;
          const className = "map-image-" + singleImage.zoom + "-" + p;
          const select = imgG.selectAll("." + className);
          //select.remove();
          if (
            ((coords.x1 >= x1 && coords.x2 <= x1 && coords.y1 >= y1 && coords.y2 <= y1) ||
              (coords.x2 >= x1 && coords.x1 <= x2 && coords.y2 >= y1 && coords.y1 <= y2)) &&
            singleImage.zoom === Math.floor(lastZoom) &&
            lastZoom > 4 &&
            lastZoom < 9
          ) {
            //select.remove();
            //if (select.size() === 0) {
            imgG
              .insert("svg:image")
              .attr("class", className)
              .attr("preserveAspectRatio", "none")
              .attr("x", x1)
              .attr("y", y1)
              .attr("width", uWidth)
              .attr("height", uHeight)
              .attr("xlink:href", process.env.PUBLIC_URL + "/images/" + singleImage.tiles[p]["url"]);
            //}
          } else {
            setTimeout(() => {
              select.remove();
            }, 2000);
          }
        }
      }
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
          let mY = y(Number(item["Latitude"]));
          //|| mY < 10
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
              .attr("y", mY)
              .attr("cursor", "pointer")
              .attr("index", index)
              .attr("fill", filColor)
              .on("click", handleObjectClick)
              .on("mouseover", handleHover)
              .attr("opacity", "1");

            //rect.transition().duration(new Random().integer(100, 1000)).attr("opacity", "1");
          }
          if (mY < 10) {
            mY = 10;
          }
          if (mY > setting.height - 10) {
            mY -= 10;
          }
          if (findLabel.size() === 0) {
            if (lastZoom > 1 || (highlightIndex && highlightIndex === index)) {
              const text = node
                .append("text")
                .attr("class", "label")
                .attr("fill", "white")
                .attr("x", x(Number(item["Longitude"])))
                .attr("y", mY)
                .attr("font-family", "Arial")
                .attr("cursor", "pointer")
                .attr("index", index)
                .html(item["WISE Objects"])
                .on("click", handleObjectClick)
                .on("mouseover", handleHover)
                .attr("opacity", "1");
              // text.transition().duration(new Random().integer(100, 1000)).attr("opacity", "1");
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
            //.transition()
            //.duration(random)
            .attr("height", rectSizeT)
            .attr("width", rectSizeT)
            .attr("transform", "translate(-" + rectSizeT / 2 + ",-" + rectSizeT / 2 + ")")
            .attr("opacity", "1");
          if (lastZoom > 1 || (highlightIndex && highlightIndex === index)) {
            node
              .select(".label[index='" + index + "']")
              //@ts-ignore
              //.transition()
              //.duration(random)
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
    //drawImages();
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

export default MapWithDynamicImage;
