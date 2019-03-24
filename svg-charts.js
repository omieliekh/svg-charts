const TEXT_PIXEL_INTERVAL = 70;
const TEXT_PIXEL_HEIGHT = 30;
const TEXT_PIXEL_PADDING_LEFT = 2;
const TEXT_PIXEL_PADDING_BOTTOM = 7;

const render = ({
  containerElem,
  pathsList,
  strokeWidth,
  xValues,
  realXInterval,
  paddingLeft,
  paddingTop,
  textValueInterval,
  isSimpleChart
}) => {
  const seed = getSeed();

  const pathTags = pathsList
    .map(path => {
      const dAttr = path.values.map(val => val.dot).join(' ');
      return `<path d="${dAttr}" stroke="${path.color}" stroke-width="${strokeWidth}" fill="none"></path>`;
    });


  const verticalLines = isSimpleChart ? [] : xValues.map((xValue, i) => (`
    <g>
      <rect x="${paddingLeft + realXInterval / 2 + realXInterval * i}" y="0" width="${realXInterval}" height="${containerElem.clientHeight - TEXT_PIXEL_HEIGHT}" fill="transparent" class="active-area" />
      <rect x="${paddingLeft + realXInterval / 2 + realXInterval * i + realXInterval / 2 - 1}" y="0" width="1" height="${containerElem.clientHeight - TEXT_PIXEL_HEIGHT}" fill="#88888888" class="sector-line" />
    </g>
  `));

  const textTags = isSimpleChart ? [] : pathsList[0].values
    .filter((item, i) => i % textValueInterval === 0)
    .map((item) => item.x + TEXT_PIXEL_INTERVAL > containerElem.clientWidth ? '' : `<text x="${item.x + TEXT_PIXEL_PADDING_LEFT}" y="${containerElem.clientHeight - TEXT_PIXEL_PADDING_BOTTOM}">${toDate(item.realX)}</text>`);


  const existingSvg = containerElem.querySelector('svg');

  const svg = existingSvg || htmlNode('svg', {
    id: seed,
    width: containerElem.clientWidth,
    height: containerElem.clientHeight
  });

  if (!existingSvg) {
    containerElem.append(svg);
  }

  svg.innerHTML = `${pathTags.join('')}${textTags.join('')}${verticalLines.join('')}`;

  return document.querySelector(`#${seed}`);
};

function SVGCharts({
  container,
  paddingLeft = 10,
  paddingRight = 10,
  paddingTop = 10,
  paddingBottom = 10,
  shift = 0,
  zoom = 100,
  xAxis = 'x',
  yAxis = 'y',
  strokeWidth = 2,
  isSimpleChart = false,
  data
}) {
  if (!container || (typeof container !== 'string' && !container.nodeType)) {
    throw new Error('SVGCharts. "container" option should be DOM node or valid selector');
  }

  if (!data) throw new Error('SVGCharts. "data" option is not defined');

  const containerElem = container.nodeType ? container : document.querySelector(container);

  function preRender() {
    const width = (containerElem.clientWidth - paddingLeft - paddingRight) * zoom / 100;
    const height = containerElem.clientHeight - paddingTop - paddingBottom - (isSimpleChart ? 0 : TEXT_PIXEL_HEIGHT);

    const xValues = getXValues(data.columns);
    const realXInterval = width / (xValues.length - 1);
    const textValueInterval = Math.ceil(TEXT_PIXEL_INTERVAL / realXInterval);

    const pathsList = getPaths({
      columns: data.columns,
      colors: data.colors,
      paddingLeft,
      paddingTop,
      height,
      width,
      xValues,
      realXInterval
    });

    render({
      containerElem,
      pathsList,
      strokeWidth,
      xValues,
      realXInterval,
      paddingLeft,
      textValueInterval,
      isSimpleChart
    });
  }

  preRender();

  window.addEventListener('resize', preRender);
}

function getXValues(columns) {
  return columns.find(column => column[0] === 'x').slice(1);
}

function getXValuesInterval(xVals) {
  const firstInterv = Math.abs(xVals[1] - xVals[0]);

  return xVals[2] ? Math.min(firstInterv, Math.abs(xVals[2] - xVals[1]))
    : (xVals[1] ? firstInterv : 1);
}

function getYValuesList(columns) {
  return columns
    .filter(column => column[0] !== 'x')
    .reduce((acc, list) => {
      acc[list[0]] = list.slice(1);

      return acc;
    }, {});
}

function getYMinMax(yValuesList) {
  let min = null, max = null;

  Object.keys(yValuesList).forEach(key => {
    yValuesList[key].forEach(val => {
      if (min === null || min > val) {
        min = val;
      }

      if (max === null || max < val) {
        max = val;
      }
    });
  });

  return {
    min,
    max,
    delta: max - min
  }
}

function getPaths({
  columns,
  colors,
  height,
  width,
  paddingLeft,
  paddingTop,
  xValues,
  realXInterval
}) {
  const yValuesList = getYValuesList(columns);
  // const interval = getXValuesInterval(xValues);
  const minMaxVals = getYMinMax(yValuesList);

  return Object.keys(yValuesList).map(key => {
    return {
      color: colors[key],
      values: yValuesList[key]
        .map((realY, i) => {
          const x = i * realXInterval + paddingLeft;
          const y = height - ((realY - minMaxVals.min) / minMaxVals.delta * height) + paddingTop;
          const dot = `${i ? 'L' : 'M'}${x} ${y}`;

          return {
            dot,
            realX: xValues[i],
            realY,
            x,
            y
          }
        })
    };
  });
}

const onePxImage = htmlNode('img', { src: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' });
document.body.append(onePxImage);

function dragStart(event) {
  event.dataTransfer.setDragImage(onePxImage, 0, 0);
}

function drag(event) {
  const parent = event.target.parentElement;
  const bg = parent.querySelector('.slider-bg');
  const w = event.target.clientWidth;
  const left = event.x - w;

  event.target.style.left = `${event.x - w}px`;

  if (event.target.classList.contains('slider-left')) {
    bg.style.left = `${left}px`;
  } else {
    bg.style.right = `${parent.clientWidth - left - w}px`;
  }

}
