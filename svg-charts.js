export default function SVGCharts({ container, data }) {
  const TEXT_PIXEL_INTERVAL = 100;
  const TEXT_PIXEL_HEIGHT = 30;
  const TEXT_PIXEL_PADDING_LEFT = 2;
  const TEXT_PIXEL_PADDING_BOTTOM = 7;

  let onePxImage = document.querySelector('#svg_charts_one_px_img');

  if (!onePxImage) {
    onePxImage = htmlNode('img', {
      id: 'svg_charts_one_px_img',
      src: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
    });

    document.body.append(onePxImage);
  }

  const rectShadowFilter = `
  <filter id="dropshadow" height="130%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1"/> <!-- stdDeviation is how much to blur -->
    <feOffset dx="0" dy="1" result="offsetblur"/> <!-- how much to offset -->
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.25"/> <!-- slope is the opacity of the shadow -->
    </feComponentTransfer>
    <feMerge> 
      <feMergeNode/> <!-- this contains the offset blurred image -->
      <feMergeNode in="SourceGraphic"/> <!-- this contains the element that the filter is applied to -->
    </feMerge>
  </filter>
  `;

  const toDate = timestamp => new Date(timestamp).toDateString().substr(4, 6);

  function htmlNode(name, opts) {
    let node;

    if (name === 'svg') {
      node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    } else {
      node = name.nodeName ? name : document.createElement(name);
    }

    for (let i in opts) {
      node.setAttribute(i, opts[i]);
    }

    return node;
  }

  function throttle(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : Date.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = Date.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  const render = ({
    containerElem,
    pathsList,
    strokeWidth,
    xValues,
    realXInterval,
    paddingLeft,
    paddingTop,
    textValueInterval,
    isSimpleChart,
    shiftLeftPx
  }) => {
    const pathTags = pathsList
      .map(path => {
        const dAttr = path.values.map(val => val.dot).join(' ');
        return `<path d="${dAttr}" stroke="${path.color}" stroke-width="${strokeWidth}" fill="none"></path>`;
      });

    const textOffsetTop = containerElem.clientHeight / 5;

    const verticalLines = isSimpleChart ? [] : pathsList[0].values.map((item, i) => {

      const textX = item.x + ((item.x + TEXT_PIXEL_INTERVAL * 2 > containerElem.clientWidth) ? -(TEXT_PIXEL_INTERVAL - 20) : TEXT_PIXEL_PADDING_LEFT * 2 + realXInterval);

      const textNodes = pathsList.map((path, pathNum) => `
      <text 
          class="hover-text y-label" 
          x="${textX}" 
          y="${textOffsetTop + TEXT_PIXEL_HEIGHT * (pathNum + 1)}"
          fill="${path.color}"
        >
        ${path.values[i].realY + ' - ' + path.name}
        </text>
    `);

      const rect = `
      <rect 
        class="bg-rect" 
        x="${textX - 10}" 
        y="${textOffsetTop - TEXT_PIXEL_HEIGHT / 2 - 5}" 
        width="${TEXT_PIXEL_INTERVAL}" 
        height="${TEXT_PIXEL_HEIGHT * (textNodes.length + 1)}" 
        rx="4"  
        ry="4" 
        fill="#fff"
        style="filter:url(#dropshadow)"
      />`;

      return `
      <g>
        <rect 
          class="active-area" 
          x="${paddingLeft - shiftLeftPx + realXInterval / 2 + realXInterval * i}" 
          y="0" 
          width="${realXInterval}" 
          height="${containerElem.clientHeight - TEXT_PIXEL_HEIGHT}" 
        />
        <rect 
          class="sector-line" 
          x="${paddingLeft - shiftLeftPx + realXInterval / 2 + realXInterval * i + realXInterval / 2 - 1}" 
          y="0" 
          width="1" 
          height="${containerElem.clientHeight - TEXT_PIXEL_HEIGHT}" 
        />
        ${rect}
        <text 
          class="hover-text" 
          x="${textX}" y="${textOffsetTop}"
        >
          ${toDate(item.realX)}
        </text>
        ${textNodes.join('')}
      </g>
    `;
    });

    const textTags = isSimpleChart ? [] : pathsList[0].values
      .filter(item => item.x > paddingLeft / 2)
      .filter((item, i) => i % textValueInterval === 0)
      .map((item) => item.x + TEXT_PIXEL_INTERVAL > containerElem.clientWidth ? '' : `<text x="${item.x + TEXT_PIXEL_PADDING_LEFT}" y="${containerElem.clientHeight - TEXT_PIXEL_PADDING_BOTTOM}">${toDate(item.realX)}</text>`);

    const existingSvg = containerElem.querySelector('svg');

    const svg = htmlNode(existingSvg || 'svg', {
      width: containerElem.clientWidth,
      height: containerElem.clientHeight
    });

    if (!existingSvg) {
      containerElem.append(svg);
    }

    svg.innerHTML = `${rectShadowFilter}${pathTags.join('')}${textTags.join('')}${verticalLines.join('')}`;

    return svg;
  };

  function RenderSingleChart({
    container,
    paddingLeft = 10,
    paddingRight = 10,
    paddingTop = 10,
    paddingBottom = 10,
    shiftLeft = 0,
    shiftRight = 0,
    strokeWidth = 2,
    isSimpleChart = false,
    data,
    onRangeUpdate
  }) {
    const containerElem = container.nodeType ? container : document.querySelector(container);

    const sliderLeft = containerElem.querySelector('.slider-left');
    const sliderRight = containerElem.querySelector('.slider-right');

    let onRangeUpdateDelayed;

    if (sliderLeft && sliderRight) {
      if (typeof onRangeUpdate === 'function') {
        onRangeUpdateDelayed = throttle(onRangeUpdate, 100, { leading: true, trailing: true });
      }

      const dragDelayed = throttle(drag, 5, { leading: true, trailing: true });

      sliderLeft.addEventListener('dragstart', dragStart, false);
      sliderRight.addEventListener('dragstart', dragStart, false);

      sliderLeft.addEventListener('drag', dragDelayed, false);
      sliderRight.addEventListener('drag', dragDelayed, false);

      sliderLeft.addEventListener('dragend', dragDelayed, false);
      sliderRight.addEventListener('dragend', dragDelayed, false);
    }

    window.addEventListener('resize', preRender);

    function dragStart(event) {
      event.dataTransfer.setDragImage(onePxImage, 0, 0);
    }

    let lastLeft = null;
    let lastRight = null;

    function drag(event) {
      const parent = event.target.parentElement;
      const bg = parent.querySelector('.slider-bg');
      const w = event.target.clientWidth;

      if (event.target.classList.contains('slider-left')) {
        const left = bg.offsetLeft + event.layerX;

        const normalizedLeft = Math.min(Math.max(left, 0), parent.clientWidth - w) / parent.clientWidth * 100;

        if (lastLeft === null || Math.abs(lastLeft - normalizedLeft) < 10) {
          event.target.style.left = `${normalizedLeft}%`;
          bg.style.left = `${normalizedLeft}%`;

          lastLeft = normalizedLeft;
        }
      } else {
        const right = -(parent.clientWidth - bg.offsetLeft - bg.clientWidth) + event.layerX;

        const normalizedRight = Math.min(Math.max(-right, 0), parent.clientWidth - w) / parent.clientWidth * 100;

        if (lastRight === null || Math.abs(lastRight - normalizedRight) < 10) {
          event.target.style.right = `${normalizedRight}%`;
          bg.style.right = `${normalizedRight}%`;

          lastRight = normalizedRight;
        }
      }

      if (event.type === 'dragend') {
        lastLeft = null;
        lastRight = null;
      }

      if (onRangeUpdateDelayed) {
        onRangeUpdateDelayed({
          shiftLeft: (parseInt(bg.style.left) || 0),
          shiftRight: (parseInt(bg.style.right) || 0),
        });
      }
    }

    function update({
      shiftLeft: nextShiftLeft,
      shiftRight: nextShiftRight,
      data: nextData
    }) {
      if (nextShiftLeft !== undefined) {
        shiftLeft = nextShiftLeft;
      }

      if (nextShiftRight !== undefined) {
        shiftRight = nextShiftRight;
      }

      if (nextData !== undefined) {
        data = nextData;
      }

      preRender();
    }

    function preRender() {
      const width = (containerElem.clientWidth - paddingLeft - paddingRight);
      const height = containerElem.clientHeight - paddingTop - paddingBottom - (isSimpleChart ? 0 : TEXT_PIXEL_HEIGHT);

      const xValues = getXValues(data.columns);

      const zoom = (100 / (100 - shiftLeft - shiftRight)) * 100;

      const realXInterval = width / (xValues.length - 1) * zoom / 100;
      const textValueInterval = Math.ceil(TEXT_PIXEL_INTERVAL / realXInterval);

      const shiftLeftPx = shiftLeft / 100 * xValues.length * realXInterval;

      const pathsList = getPaths({
        columns: data.columns,
        colors: data.colors,
        names: data.names,
        paddingLeft,
        paddingTop,
        height,
        width,
        xValues,
        realXInterval,
        shiftLeftPx
      });

      render({
        containerElem,
        pathsList,
        strokeWidth,
        xValues,
        realXInterval,
        paddingLeft,
        textValueInterval,
        isSimpleChart,
        shiftLeftPx
      });
    }

    preRender();

    return {
      update
    }
  }

  function getXValues(columns) {
    return columns.find(column => column[0] === 'x').slice(1);
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
    names,
    height,
    width,
    paddingLeft,
    paddingTop,
    xValues,
    realXInterval,
    shiftLeftPx
  }) {
    const yValuesList = getYValuesList(columns);
    const minMaxVals = getYMinMax(yValuesList);

    return Object.keys(yValuesList).map(key => {
      return {
        color: colors[key],
        name: names[key],
        values: yValuesList[key]
          .map((realY, i) => {
            const x = i * realXInterval + paddingLeft - shiftLeftPx;
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

  // initialisation code:

  if (!container || (typeof container !== 'string' && !container.nodeType)) {
    throw new Error('SVGCharts. "container" option should be DOM node or valid selector');
  }

  if (!data) throw new Error('SVGCharts. "data" option is not defined');

  const containerElem = container.nodeType ? container : document.querySelector(container);

  const smallChartHeight = Math.max(containerElem.clientHeight * 0.2, 40);
  const mainChartHeight = containerElem.clientHeight - smallChartHeight;

  containerElem.innerHTML = `
    <div class="svg-charts svg-charts-main-chart" style="width: 100%; height: ${mainChartHeight}px; margin-bottom: 2px;"></div>
    <div class="svg-charts svg-charts-small-chart" style="width: 100%; height: ${smallChartHeight}px; position: relative;">
      <div class="sliders">
        <div class="slider-bg"></div>
        <div class="slider-left" draggable="true"></div>
        <div class="slider-right" draggable="true"></div>
      </div>
    </div>
  `;

  const mainChart = RenderSingleChart({
    container: containerElem.querySelector('.svg-charts-main-chart'),
    data
  });

  RenderSingleChart({
    container: containerElem.querySelector('.svg-charts-small-chart'),
    data,
    strokeWidth: 1,
    isSimpleChart: true,
    onRangeUpdate: ({ shiftLeft, shiftRight }) => {
      mainChart.update({ shiftLeft, shiftRight });
    }
  });
}
