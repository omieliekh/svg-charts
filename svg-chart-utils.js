const getSeed = () => 'svgcharts_' + (Math.random()+'').substr(2);

const toDate = timestamp => new Date(timestamp).toDateString().substr(4, 6);

function htmlNode(name, opts) {
  let node;

  if (name === 'svg') {
    node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    // node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  } else {
    node = document.createElement(name);
  }

  for (let i in opts) {
    node.setAttribute(i, opts[i]);
  }

  return node;
}
