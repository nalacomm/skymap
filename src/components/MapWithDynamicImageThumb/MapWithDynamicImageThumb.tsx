import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import { Container } from "react-bootstrap";
import "./MapWithDynamicImageThumb.scss";
import * as d3 from "d3";
import ObjectCoordinates from "../../data/datafile.json";
import ImageData from "../../data/image.json";
import { Random } from "random-js";
import hoverImage from "../../images/c21-1.png";
import star from "../../images/star.svg";
import triangle from "../../images/triangle.svg";
import rectangle from "../../images/rectangle.svg";
import { ZoomTransform, ContainerElement } from "d3";
import { Line, Circle } from "rc-progress";

console.log(ObjectCoordinates);
interface ObjectInterface {
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

let currentSelect = -100;
let highlightIndex = -100;
let timeoutId: any;

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    // @ts-ignore
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
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

export function MapWithDynamicImageThumb() {
  const [sWidth, setWidth] = useState(window.innerWidth);
  const [sHeight, setHeight] = useState(window.innerWidth / 2);
  let setting = {
    width: sWidth,
    //width: 985,
    //height: 492 /*maximum size: 544*/,
    height: sHeight /*maximum size: 544*/,
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

  function onWheel() {
    //d3.event.preventDefault();
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
    let zoom = d3
      .zoom<any, unknown>()
      .scaleExtent([1, setting.maxZoom])
      .translateExtent([
        [0, 0],
        [sWidth, sHeight],
      ])
      .on("zoom", zoomed);

    d3.select("#render_map2 svg").remove();
    let svg = d3.select("#render_map2").append("svg").attr("width", sWidth).attr("height", sHeight);

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
    //imgG
    //  .insert("svg:image")
    //  .attr("preserveAspectRatio", "none")
    //  .attr("x", 0)
    //  .attr("y", 0)
    //  .attr("width", sWidth)
    //  .attr("height", sHeight)
    //  .attr("xlink:href", process.env.PUBLIC_URL + "/img-set/image-50.jpg");

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
      //drawImages();
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

    function fontImageSize(o: string): number {
      if (o === "w") {
        let ffff = 30;
        if (lastZoom !== 1) {
          if (lastZoom < 5) {
            ffff = 6;
          } else if (lastZoom < 10) {
            ffff = 5;
          } else if (lastZoom < 15) {
            ffff = 4;
          } else if (lastZoom < 20) {
            ffff = 3;
          } else if (lastZoom < 25) {
            ffff = 2.5;
          } else if (lastZoom < 30) {
            ffff = 2;
          } else if (lastZoom < 35) {
            ffff = 1.5;
          } else if (lastZoom <= 40) {
            ffff = 1;
          }
        }
        return ffff;
      } else {
        let ffff = 12;
        if (lastZoom !== 1) {
          if (lastZoom < 5) {
            ffff = 6;
          } else if (lastZoom < 10) {
            ffff = 5;
          } else if (lastZoom < 15) {
            ffff = 4;
          } else if (lastZoom < 20) {
            ffff = 3;
          } else if (lastZoom < 25) {
            ffff = 2.5;
          } else if (lastZoom < 30) {
            ffff = 2;
          } else if (lastZoom < 35) {
            ffff = 1.5;
          } else if (lastZoom <= 40) {
            ffff = 1;
          }
        }
        return ffff;
      }
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
          return Math.floor((xN * sWidth) / numTileWidth);
        }
      }

      function getY(singleImage: any, index: number) {
        let { numTileHeight, tiles } = singleImage;
        let { yN } = tiles[index];
        if (yN === 0) {
          return 0;
        } else {
          return Math.floor((yN * sHeight) / numTileHeight);
        }
      }

      for (let i = 0; i < ImageData.length; i++) {
        const singleImage = ImageData[i];
        for (let p = 0; p < singleImage.tiles.length; p++) {
          const uWidth = Math.ceil(sWidth / singleImage.numTileWidth);
          const uHeight = Math.ceil(sHeight / singleImage.numTileHeight);
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

    function drawObjects() {
      if (!(d3 && d3.event && d3.event.transform) || lastZoom !== d3.event.transform.k) {
        if (d3 && d3.event && d3.event.transform) {
          lastZoom = d3.event.transform.k;
        }
        ObjectCoordinates.forEach((objectInterface: ObjectInterface, index: number) => {
          const item = objectModification(Object.assign({}, objectInterface));
          let rectSizeT = rectSize();
          let txtFont = fontSize();
          //if ((highlightIndex && highlightIndex === index) || currentSelect === index) {
          //rectSizeT += 1;
          // txtFont += 3;
          //}
          let findCoord = node.select(".coords[index='" + index + "']");
          let findLabel = node.select(".label[index='" + index + "']");
          let hover_image = node.select(".hover_image[index='" + index + "']");
          let mY = y(Number(item["Latitude"]));
          //|| mY < 10
          if (findCoord.size() === 0) {
            let filColor = "green";
            if (item["Caldwell_Messier"].includes("C")) {
              filColor = "blue";
            } else if (item["Caldwell_Messier"].includes("M")) {
              filColor = "red";
            }

            //  const rect = node
            //    .append("rect")
            //    .attr("class", "coords")
            //    .attr("x", x(Number(item["Longitude"])))
            //    .attr("y", mY)
            //    .attr("cursor", "pointer")
            //    .attr("index", index)
            //    .attr("fill", filColor)
            //    .on("click", handleObjectClick)
            //    .on("mouseover", handleHover)
            //    .attr("opacity", "1");

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
              //.on("mouseenter", handleHover)
              //.on("mouseout", handleMouseOut)
              .attr("xlink:href", shape)
              .attr("opacity", "0");

            rect.transition().duration(new Random().integer(500, 2000)).attr("opacity", "1");
          }
          if (mY < 10) {
            mY = 10;
          }
          if (mY > sHeight - 10) {
            mY -= 10;
          }

          //if (hover_image.size() === 0) {
          // if (lastZoom > 1 || (highlightIndex && highlightIndex === index)) {
          //   const text = node
          //     .append("text")
          //     .attr("class", "label")
          //     .attr("fill", "white")
          //     .attr("x", x(Number(item["Longitude"])))
          //     .attr("y", mY)
          //     .attr("font-family", "Arial")
          //     .attr("cursor", "pointer")
          //     .attr("index", index)
          //     .html(item["WISE Objects"])
          //     .on("click", handleObjectClick)
          //     .on("mouseover", handleHover)
          //     .attr("opacity", "1");
          //   // text.transition().duration(new Random().integer(100, 1000)).attr("opacity", "1");
          // }
          //node.select(".hover_image").remove();
          if ((highlightIndex && highlightIndex === index) || currentSelect === index) {
            //node.select(".hover_image").remove();
            //node.select(".label").remove();
            if (hover_image.size() === 0) {
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
              //const url = item["HST image"];
              const size = currentSelect === index ? 30 : 25;
              node
                .insert("svg:image")
                .attr("class", "hover_image")
                .attr("index", index)
                //.attr("preserveAspectRatio", "none")
                .attr("x", useX)
                .attr("y", useY)
                .attr("width", size)
                .attr("height", 16)
                .attr("xlink:href", url);
            }
            if (findLabel.size() === 0) {
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
          } else {
            if (currentSelect === -100) {
              node.select(".hover_image[index='" + index + "']").remove();
              node.select(".label[index='" + index + "']").remove();
            }
          }
          if (hover_image.size() > 0) {
            const url =
              currentSelect === index ? process.env.PUBLIC_URL + "/c21-12.png" : process.env.PUBLIC_URL + "/c21-1.png";
            const size = currentSelect === index ? 30 : 25;
            hover_image.attr("xlink:href", url).attr("width", size);
          }
          //}
          let textWidth = 4;
          if (sWidth - sWidth / 4 < x(Number(item["Longitude"]))) {
            textWidth = -BrowserText.getWidth(item["WISE Objects"], txtFont, "Arial") - 6;
          }
          const random = new Random().integer(100, 200);
          node
            .select(".coords[index='" + index + "']")
            //@ts-ignore
            .transition()
            .duration(random)
            .attr("transform", "translate(-" + rectSizeT / 2 + ",-" + rectSizeT / 2 + ")")
            .attr("height", rectSizeT)
            .attr("width", rectSizeT)
            .attr("opacity", "1");
          if (lastZoom > 1 || (highlightIndex && highlightIndex === index) || currentSelect === index) {
            node
              .select(".label[index='" + index + "']")
              //@ts-ignore
              .transition()
              .duration(random)
              .attr("font-size", txtFont + "px")
              .attr("transform", "translate(" + (textWidth + 1) + ",0)")
              .attr("opacity", "1");
          }
        });
      }
    }

    function handleHover() {
      //node.select(".hover_image").remove();
      const $this = this as HTMLElement;
      highlightIndex = Number($this.getAttribute("index"));
      if (currentSelect != highlightIndex) {
        currentSelect = -100;

        timeoutId = null;
        drawObjects();
      }
    }

    function handleMouseOut() {
      //node.select(".hover_image").remove();
      const $this = this as HTMLElement;
      let highlightIndexOld = highlightIndex;
      let currentSelectOld = currentSelect;
      highlightIndex = -100;
      //currentSelect= -100
      if (highlightIndexOld !== highlightIndex) {
        highlightIndex = -100;
      }
      if (currentSelectOld !== currentSelect) {
        currentSelect = -100;
      }

      if (!timeoutId) {
        timeoutId = window.setTimeout(function () {
          timeoutId = null; // EDIT: added this line

          drawObjects();
        }, 100);
      }
    }

    function handleObjectClick() {
      let zoomLevel = 6;
      //node.select(".hover_image").remove();
      const $this = this as HTMLElement;
      currentSelect = Number($this.getAttribute("index"));
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
      svg
        .transition()
        .duration(500)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(sWidth / 2, sHeight / 2)
            .scale(zoomLevel)
            .translate(-x, -y),
          d3.mouse($this),
        );
    }

    drawObjects();
    //drawImages();
  }

  // @ts-ignore
  const [loadPercent, setLoadPercent] = useState(0);
  useInterval(() => {
    if (loadPercent < 100) {
      setLoadPercent(loadPercent + new Random().integer(0, 15));
    }
  }, 10); // change it to 1000
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
        <div>sdf</div>
      </div>
      <div className={"loader " + (loadPercent >= 100 ? "loaded" : "")}>
        <div className="loader-inner">
          <Line percent={loadPercent} strokeWidth={2} strokeColor="#D3D3D3" />
        </div>
      </div>
    </>
  );
}

export default MapWithDynamicImageThumb;
