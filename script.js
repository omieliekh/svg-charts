import SVGCharts from './svg-charts.js';

fetch('chart_data.json')
  .then(r => r.json())
  .then(data => {
    data.forEach((singleChartData, i) => {
      const cont = document.createElement('div');

      cont.setAttribute('id', `container_${i + 1}`);
      cont.style.height = '250px';
      cont.style.width = '80%';
      cont.style.marginBottom = '20px';
      cont.style.marginLeft = '10%';

      document.body.append(cont);

      SVGCharts({
        container: `#container_${i + 1}`,
        data: singleChartData
      });
    });
  });
