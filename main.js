// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: 'map', // div要素のid
  zoom: 8, // 初期表示のズーム
  center: [132, 34], // 初期表示の中心
  minZoom: 4, // 最小ズーム
  maxZoom: 20, // 最大ズーム
  maxBounds: [122, 20, 154, 50], // 表示可能な範囲
  style: {
      version: 8,
      sources: {
          // 背景地図ソース
          osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              maxzoom: 19,
              tileSize: 256,
              attribution:
                  '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
          excavation: {
            type: 'geojson',
            data: '/excavationpoint.geojson',
          },
          plan: {
            type:'geojson',
            data: '/cyukain_east_survey18.geojson',
          },
          heianarea: {
            type:'geojson',
            data: '/heiankyo_area.geojson',
          }
      },
      layers: [
          // 背景地図レイヤー
          {
              id: 'osm-layer',
              source: 'osm',
              type: 'raster',
          },
          {
              id: 'heianarea-layer',
              source: 'heianarea',
              type: 'line'
          },          
          {
              id: 'point-layer',
              source: 'excavation',
              type: 'heatmap',
          },
          {
            id: 'excavation',
            source: 'excavation',
            type: 'circle',
            paint: {
              "circle-color": "#0000ff",
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 2
            }
          },
          {
            id: 'plan-layer',
            source: 'plan',
            type: 'line'
          },
      ]
    }
})         

map.on('click', (e) => {
  // クリックした位置にある地物を取得
  const features = map.queryRenderedFeatures(e.point, {
      layers: ['excavation'],
  });
  console.log(features);
});