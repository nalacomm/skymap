const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const maxZoomLevel = 10;
const minWidth = 985;
const baseTileWidth = 300;
const baseTileHeight = 300;
const folder = "./public/images/";
const fileName = "image";
const fileExt = ".jpg";
const jsonFile = "./src/data/image.json";


function generateImageSizes() {
  for (let i = maxZoomLevel; i > 0; i--) {
    Jimp.read(folder + fileName + fileExt)
      .then(img => {
        const width = img.getWidth();
        const calcZoomPercent = ((maxZoomLevel * i) / 100) * 100;
        const addWidth = ((width - minWidth) * calcZoomPercent) / 100;
        const finalWidth = minWidth + addWidth;
        img.resize(finalWidth, Jimp.AUTO).write(folder + fileName + "-" + i + fileExt);
      })
      .catch(err => {
        console.error(err);
      });
  }
}

function generateImageSlices() {
  let outputData = [];
  for (let u = maxZoomLevel; u > 0; u--) {
    Jimp.read(folder + fileName + "-" + u + fileExt)
      .then(img => {
        const height = img.getHeight();
        const width = img.getWidth();
        let numTileWidth = Math.floor(width / baseTileWidth);
        let numTileHeight = Math.floor(height / baseTileHeight);
        numTileWidth = numTileWidth === 0 ? 1 : numTileWidth;
        numTileHeight = numTileHeight === 0 ? 1 : numTileHeight;
        const tileWidth = width / numTileWidth;
        const tileHeight = height / numTileHeight;
        let it = 0;
        outputData[u] = {
          zoom: u,
          height,
          width,
          numTileWidth,
          numTileHeight,
          tileWidth,
          tileHeight,
          tiles: [],
        };
        for (let i = 0; i < numTileHeight; i++) {
          for (let j = 0; j < numTileWidth; j++) {
            it += 1;
            const newFileName = folder + fileName + "-" + u + "-" + it + fileExt;
            const x = Math.floor(j * tileWidth);
            const y = Math.floor(i * tileHeight);
            const imgClone = img.clone();
            if (!(numTileHeight === 1 && numTileWidth === 1)) {
              imgClone.crop(x, y, tileWidth, tileHeight);
            }
            imgClone.write(path.resolve(newFileName));
            outputData[u]["tiles"].push({
              x,
              y,
              xN: j,
              yN: i,
              url:  fileName + "-" + u + "-" + it + fileExt,
            });
          }
        }
      })
      .then(() => {
        if (maxZoomLevel === u) {
          fs.writeFileSync(path.resolve(jsonFile), JSON.stringify(outputData), { flag: "w+" });
          console.log(outputData);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }
}

//generateImageSizes();
generateImageSlices();
