const getSeed = () => 'svgcharts_' + (Math.random()+'').substr(2);

const render = ({ container, pathsList, width, height }) => {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const seed = getSeed();

  console.log('pathsList: ', pathsList);

  const pathTags = pathsList
    .map(path => {
      const dAttr = path.values.map(val => val.dot).join(' ');
      return `<path d="${dAttr}" stroke="${path.color}" stroke-width="2" fill="none"></path>`;
    });

  container.innerHTML =
    `<svg id="${seed}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${pathTags.join('')}</svg>`;

  return document.querySelector(`#${seed}`);
};

function SVGCharts({
  container,
  height = 200,
  width = 400,
  paddingLeft = 20,
  paddingRight = 20,
  paddingTop = 20,
  paddingBottom = 20,
  xAxis = 'x',
  yAxis = 'y',
  data
}) {
  if (!container) throw new Error('SVGCharts. "container" option is not defined');

  if (!data) throw new Error('SVGCharts. "data" option is not defined');

  const pathsList = getPaths({ columns: data.columns, colors: data.colors, height, width });

  render({ container, pathsList, width, height });
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

function getPaths({ columns, colors, height, width }) {
  const xValues = getXValues(columns);
  const realInterv = width / (xValues.length - 1);
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

          x: i * realInterv,
          y: height - ((y - minMaxVals.min) / minMaxVals.delta * height)
        }))
        .map(({ x, y, realX, realY }, i) => ({ dot: `${i ? 'L' : 'M'}${x} ${y}`, realX, realY }))
    };
  });
}
