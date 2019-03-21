const getSeed = () => 'svgcharts_' + (Math.random()+'').substr(2);

const render = ({
  containerElem,
  pathsList,
  strokeWidth,
  xValues,
  realXInterval,
  paddingLeft
}) => {
  const seed = getSeed();

  console.log('pathsList: ', pathsList);

  const pathTags = pathsList
    .map(path => {
      const dAttr = path.values.map(val => val.dot).join(' ');
      return `<path d="${dAttr}" stroke="${path.color}" stroke-width="${strokeWidth}" fill="none"></path>`;
    });


  pathTags.push(xValues.map((xValue, i) => {
    return `
      <g>
        <rect x="${paddingLeft + realXInterval / 2 + realXInterval * i}" y="0" width="${realXInterval}" height="100%" fill="transparent" class="active-area" />
        <rect x="${paddingLeft + realXInterval / 2 + realXInterval * i + realXInterval / 2 - 1}" y="0" width="1" height="100%" fill="#88888888" class="sector-line" />
      </g>  
    `
  }));

  containerElem.innerHTML =
    `<svg id="${seed}" width="${containerElem.clientWidth}" height="${containerElem.clientHeight}" xmlns="http://www.w3.org/2000/svg">${pathTags.join('')}</svg>`;

  return document.querySelector(`#${seed}`);
};

function SVGCharts({
  container,
  paddingLeft = 10,
  paddingRight = 10,
  paddingTop = 10,
  paddingBottom = 10,
  xAxis = 'x',
  yAxis = 'y',
  strokeWidth = 2,
  data
}) {
  if (!container || (typeof container !== 'string' && !container.nodeType)) {
    throw new Error('SVGCharts. "container" option should be DOM node or valid selector');
  }

  if (!data) throw new Error('SVGCharts. "data" option is not defined');

  const containerElem = container.nodeType ? container : document.querySelector(container);

  function preRender() {
    const width = containerElem.clientWidth - paddingLeft - paddingRight;
    const height = containerElem.clientHeight - paddingTop - paddingTop;

    const xValues = getXValues(data.columns);
    const realXInterval = width / (xValues.length - 1);

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

    render({ containerElem, pathsList, strokeWidth, xValues, realXInterval, paddingLeft });
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
        .map((y, i) => ({
          realX: xValues[i],
          realY: y,

          x: i * realXInterval + paddingLeft,
          y: height - ((y - minMaxVals.min) / minMaxVals.delta * height) + paddingTop
        }))
        .map(({ x, y, realX, realY }, i) => ({ dot: `${i ? 'L' : 'M'}${x} ${y}`, realX, realY }))
    };
  });
}
