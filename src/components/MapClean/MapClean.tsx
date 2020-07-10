import React, { useEffect, useState, useRef } from "react";
import "./MapClean.scss";
import * as d3 from "d3";
import ObjectCoordinates from "../../data/datafile.json";
import { Random } from "random-js";
import star from "../../images/star.svg";
import triangle from "../../images/triangle.svg";
import rectangle from "../../images/rectangle.svg";
import { Line } from "rc-progress";

interface ObjectInterface {
  i?: number | null;
  Caldwell_Messier: string;
  "WISE Objects": string;
  L: string | number;
  B: string | number;
  Longitude: string | number;
  Latitude: string | number;
  "size in degrees": string | number | null;
  "HST image": string;
  Orientation: string | null | number;
  "Pending Caldwell add.": string | null | number;
  Birthday: string | null | number;
  Category: string | null | number;
  n: string | null | number;
  date: string | null | number;
  year: string | null | number;
  name: string | null | number;
  text: string | null | number;
  url: string | null | number;
}

let drawCounter = 0;
let currentSelect = -100;
let highlightIndex = -100;
let timeoutId: any;
let runFirstTime = true;

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef();
  useEffect(() => {
    // @ts-ignore
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      // @ts-ignore
      savedCallback.current();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
//@ts-ignore
let svg, zoom;
export function MapClean() {
  const [currentSelectU, setCurrentSelectU] = useState(-100);
  const [sWidth, setWidth] = useState(window.innerWidth);
  const [sHeight, setHeight] = useState(window.innerWidth / 2);
  let setting = {
    width: sWidth,
    height: sHeight,
    fontSize: 6,
    circleSize: 2.2,
    maxZoom: 40,
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
    window.addEventListener("resize", handleResize);
  }, [sWidth, sHeight]);

  function handleResize() {
    setWidth(window.innerWidth);
    setHeight(window.innerWidth / 2);
  }

  function renderImage() {
    [process.env.PUBLIC_URL + "/c21-12.png", process.env.PUBLIC_URL + "/c21-1.png", star, triangle, rectangle].forEach(
        (picture) => {
          const img = new Image();
          img.src = picture;
        },
    );
    const x = d3.scaleLinear().range([0, sWidth]).domain([-180, 180]);
    const y = d3.scaleLinear().range([0, sHeight]).domain([-90, 90]);
    let lastZoom = 1;
    let coords = {
      x1: 0,
      y1: 0,
      x2: sWidth,
      y2: sHeight,
    };
    zoom = d3
        .zoom<any, unknown>()
        .scaleExtent([1, setting.maxZoom])
        .translateExtent([
          [0, 0],
          [sWidth, sHeight],
        ])
        .on("zoom", zoomed);

    d3.select("#render_map2 svg").remove();
    //@ts-ignore
    svg = d3.select("#render_map2").append("svg").attr("width", sWidth).attr("height", sHeight);
    var node = svg.append("g");
    svg.call(zoom);
    var imgG = node.append("g");
    imgG
        .insert("svg:image")
        .attr("preserveAspectRatio", "none")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", sWidth)
        .attr("height", sHeight)
        .attr("xlink:href", process.env.PUBLIC_URL + "/img-set/image-1.jpg");
    imgG
        .insert("svg:image")
        .attr("preserveAspectRatio", "none")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", sWidth)
        .attr("height", sHeight)
        .attr("xlink:href", process.env.PUBLIC_URL + "/img-set/image.jpg");

    function zoomed() {
      handleMouseOut();
      const xy1 = d3.event.transform.invert([0, 0]);
      const xy2 = d3.event.transform.invert([sWidth, sHeight]);
      coords = {
        x1: xy1[0],
        y1: xy1[1],
        x2: xy2[0],
        y2: xy2[1],
      };
      node.attr("transform", d3.event.transform);
      drawObjects();
    }

    function fontSize(): number {
      let fontSizeT = 12;
      if (lastZoom !== 1) {
        if (lastZoom < 5) {
          fontSizeT = 6;
        } else if (lastZoom < 10) {
          fontSizeT = 5;
        } else if (lastZoom < 15) {
          fontSizeT = 4;
        } else if (lastZoom < 20) {
          fontSizeT = 3;
        } else if (lastZoom < 25) {
          fontSizeT = 2.5;
        } else if (lastZoom < 30) {
          fontSizeT = 2;
        } else if (lastZoom < 35) {
          fontSizeT = 1.5;
        } else if (lastZoom <= 40) {
          fontSizeT = 1;
        }
      }
      if (fontSizeT < 2) {
        //fontSizeT = 2;
      }

      return fontSizeT;
    }

    function rectSize(): number {
      return fontSize() / 2;
    }

    function handleHover() {
      const $this = this as HTMLElement;
      highlightIndex = Number($this.getAttribute("index"));
      if (currentSelect != highlightIndex) {
        currentSelect = -100;
        setCurrentSelectU(currentSelect);
        timeoutId = null;
        drawObjects();
      }
    }

    function handleMouseOut() {
      const $this = this as HTMLElement;
      let highlightIndexOld = highlightIndex;
      let currentSelectOld = currentSelect;
      highlightIndex = -100;
      if (highlightIndexOld !== highlightIndex) {
        highlightIndex = -100;
      }
      if (currentSelectOld !== currentSelect) {
        currentSelect = -100;
        setCurrentSelectU(currentSelect);
      }

      if (!timeoutId) {
        timeoutId = window.setTimeout(function () {
          timeoutId = null;
          drawObjects();
        }, 100);
      }
    }

    function handleObjectClick() {
      let zoomLevel = 6;
      const $this = this as HTMLElement;
      currentSelect = Number($this.getAttribute("index"));

      setCurrentSelectU(currentSelect);
      let x = Number($this.getAttribute("x"));
      let y = Number($this.getAttribute("y"));
      console.log(x);
      console.log(y);
      if (x * (zoomLevel - 1) > sWidth * (zoomLevel - 1.5)) {
        x = sWidth - sWidth / zoomLevel / 2;
      }
      if (x * (zoomLevel - 1) < sWidth * 0.5) {
        x = sWidth / zoomLevel / 2;
      }
      if (y * (zoomLevel - 1) > sHeight * (zoomLevel - 1.5)) {
        y = sHeight - sHeight / zoomLevel / 2;
      }
      if (y * (zoomLevel - 1) < sHeight * 0.5) {
        y = sHeight / zoomLevel / 2;
      }
      d3.event.stopPropagation();
      //@ts-ignore
      svg
          .transition()
          .duration(500)
          .call(
              //@ts-ignore
              zoom.transform,
              d3.zoomIdentity
                  .translate(sWidth / 2, sHeight / 2)
                  .scale(zoomLevel)
                  .translate(-x, -y),
              //d3.mouse($this),
          );
    }

    function drawObjects() {
      drawCounter++;
      //console.log("Draw Start: " + drawCounter)
      if (!(d3 && d3.event && d3.event.transform) || lastZoom !== d3.event.transform.k) {
        if (d3 && d3.event && d3.event.transform) {
          lastZoom = d3.event.transform.k;
        }
        for (let index = 0; index < ObjectCoordinates.length; index++) {
          let objectInterface: ObjectInterface = ObjectCoordinates[index];
          const item = objectModification(Object.assign({}, objectInterface));
          //currentSelect
          //console.log(item)
          let mY = y(Number(item["Latitude"]));
          if (runFirstTime && node.select(".coords[index='" + index + "']").size() === 0) {
            let shape = star;
            if (item["Caldwell_Messier"].includes("C")) {
              shape = triangle;
            } else if (item["Caldwell_Messier"].includes("M")) {
              shape = rectangle;
            }
            const rect = node
                .insert("svg:image")
                .attr("class", "coords")
                .attr("preserveAspectRatio", "none")
                .attr("x", x(Number(item["Longitude"])))
                .attr("y", mY)
                .attr("cursor", "pointer")
                .attr("index", index)
                .on("click", handleObjectClick)
                .on("mouseover", handleHover)
                .attr("xlink:href", shape)
                .attr("opacity", "0");
            rect.transition().duration(new Random().integer(500, 2000)).attr("opacity", "1");
          }
          mY = mY < 10 ? 10 : mY;
          mY = mY > sHeight - 10 ? mY - 10 : mY;
          let txtFont = fontSize();
          if ((highlightIndex && highlightIndex === index) || currentSelect === index) {
            if (node.select(".hover_image[index='" + index + "']").size() === 0) {
              let useX = x(Number(item["Longitude"])) + 5;
              if (sWidth - sWidth / 4 < x(Number(item["Longitude"]))) {
                useX = x(Number(item["Longitude"])) - 30;
              }
              let useY = mY - 22;
              if (useY < 50) {
                useY += 24;
              }
              const url =
                  currentSelect === index
                      ? process.env.PUBLIC_URL + "/c21-12.png"
                      : process.env.PUBLIC_URL + "/c21-1.png";
              const size = currentSelect === index ? 30 : 25;
              node
                  .insert("svg:image")
                  .attr("class", "hover_image")
                  .attr("index", index)
                  .attr("x", useX)
                  .attr("y", useY)
                  .attr("width", size)
                  .attr("height", 16)
                  .attr("xlink:href", url);
              node.append("rect")
                  .attr("x",useX)
                  .attr("class","rect-border")
                  .attr("y",useY)
                  .attr("width", size)
                  .attr("index", index)
                  .attr("height",16)
                  .style("fill", "transparent")
                  .style("stroke", "green")
                  .style("stroke-width", "0.5px");
            }
            if (node.select(".label[index='" + index + "']").size() === 0) {
              const text = node
                  .append("text")
                  .attr("class", "label")
                  .attr("fill", "white")
                  .attr("x", x(Number(item["Longitude"])))
                  .attr("y", mY)
                  .attr("font-family", "Arial")
                  .attr("cursor", "pointer")
                  .attr("index", index)
                  .attr("font-size", txtFont - 1 + "px")
                  .html(item["WISE Objects"])
                  .on("click", handleObjectClick)
                  .on("mouseover", handleHover)
                  .attr("opacity", "0");
              text.transition().duration(new Random().integer(100, 1000)).attr("opacity", "1");
            }
          } else if (currentSelect === -100) {
            node.select(".hover_image[index='" + index + "']").remove();
            node.select(".label[index='" + index + "']").remove();
            node.select(".rect-border[index='" + index + "']").remove();

          }
          let textWidth = 4;
          if (sWidth - sWidth / 4 < x(Number(item["Longitude"]))) {
            textWidth = -BrowserText.getWidth(item["WISE Objects"], txtFont, "Arial") - 6;
          }
          const random = new Random().integer(100, 200);
          let rectSizeT = rectSize();
          if ((d3 && d3.event && d3.event.transform) || runFirstTime) {
            node
                .select(".coords[index='" + index + "']")
                //@ts-ignore
                .transition()
                .duration(random)
                .attr("transform", "translate(-" + rectSizeT / 2 + ",-" + rectSizeT / 2 + ")")
                .attr("height", rectSizeT)
                .attr("width", rectSizeT)
                .attr("opacity", "1");
          }
          if (
              (lastZoom > 1 || (highlightIndex && highlightIndex === index) || currentSelect === index) &&
              node.select(".label[index='" + index + "']").size() > 0
          ) {
            node
                .select(".label[index='" + index + "']")
                //@ts-ignore
                .transition()
                .duration(random)
                .attr("font-size", txtFont + "px")
                .attr("transform", "translate(" + (textWidth + 1) + ",0)")
                .attr("opacity", "1");
          } else {
            node.select(".label[index='" + index + "']").remove();
          }
        }
        runFirstTime = false;
      }
      //console.log("Draw End: " + drawCounter)
    }

    drawObjects();
  }
  function clusterObjClick(item: ObjectInterface) {
    let zoomLevel = 6;
    const $this = this as HTMLElement;
    currentSelect = Number(item.i);
    setCurrentSelectU(currentSelect);
    let x = Number($this.getAttribute("x"));
    let y = Number($this.getAttribute("y"));
    if (x * (zoomLevel - 1) > sWidth * (zoomLevel - 1.5)) {
      x = sWidth - sWidth / zoomLevel / 2;
    }
    if (x * (zoomLevel - 1) < sWidth * 0.5) {
      x = sWidth / zoomLevel / 2;
    }
    if (y * (zoomLevel - 1) > sHeight * (zoomLevel - 1.5)) {
      y = sHeight - sHeight / zoomLevel / 2;
    }
    if (y * (zoomLevel - 1) < sHeight * 0.5) {
      y = sHeight / zoomLevel / 2;
    }
    d3.event.stopPropagation();
    //@ts-ignore
    svg
        .transition()
        .duration(500)
        .call(
            //@ts-ignore
            zoom.transform,
            d3.zoomIdentity
                .translate(sWidth / 2, sHeight / 2)
                .scale(zoomLevel)
                .translate(-x, -y),
            d3.mouse($this),
        );
  }
  // @ts-ignore
  const [loadPercent, setLoadPercent] = useState(0);
  useInterval(() => {
    if (loadPercent < 100) {
      setLoadPercent(loadPercent + new Random().integer(0, 15));
    }
  }, 1000); // change it to 1000
  function distance(fromLat: any, fromLong: any, toLat: any, toLong: any) {
    // var a = lat1 - lat2;
    // var b = lon1 - lon2;
    // var c = Math.sqrt(a * a + b * b);
    //
    // return c;

    var a = toLat - fromLat;
    var b = toLong - fromLong;
    var c = Math.sqrt(a * a + b * b);

    return c;
  }

  const customC = ObjectCoordinates.map((item, index) => objectModification(Object.assign({ i: index }, item)));

  return (
      <>
        <div
            id="render_map2"
            style={{
              width: sWidth + "px",
              height: sHeight + "px",
              margin: "0 auto",
              overflow: "hidden",
            }}
            className={loadPercent >= 100 ? "" : "hidden"}
        >
          {currentSelectU && currentSelectU >= 0 && (
              <div className="display-area">
                {customC
                    //.sort((a, b) => {
                    //  const distA = distance(a["Latitude"], a["Longitude"], customC[currentSelectU]["Latitude"], customC[currentSelectU]["Latitude"]);
                    //  const distB = distance(b["Latitude"], b["Longitude"], customC[currentSelectU]["Latitude"], customC[currentSelectU]["Latitude"]);
                    //  return distB - distA;
                    //})
                    .filter((item) => {
                      const dist = distance(
                          customC[currentSelectU]["Latitude"],
                          customC[currentSelectU]["Longitude"],
                          item["Latitude"],
                          item["Longitude"],
                      );
                      return dist < 20;
                    })
                    .map((item: ObjectInterface, index) => {
                      let shape = star;
                      if (item["Caldwell_Messier"].includes("C")) {
                        shape = triangle;
                      } else if (item["Caldwell_Messier"].includes("M")) {
                        shape = rectangle;
                      }
                      return (
                          <div
                              key={index}
                              className="display-item"
                              onClick={() => {
                                if (d3.select(".coords[index='" + item.i + "']").size() > 0) {
                                  d3.select(".label").remove();
                                  d3.select(".hover_image").remove();
                                  d3.select(".coords[index='" + item.i + "']").dispatch("click");
                                }
                              }}
                          >
                            <img src={shape} alt="" />
                            {item["WISE Objects"]}
                          </div>
                      );
                    })}
              </div>
          )}
        </div>
        <div className={"loader " + (loadPercent >= 100 ? "loaded" : "")}>
          <div className="loader-inner">
            <Line percent={loadPercent} strokeWidth={2} strokeColor="#D3D3D3" />
          </div>
        </div>
      </>
  );
}

export default MapClean;