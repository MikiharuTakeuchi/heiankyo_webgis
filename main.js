// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpacityControlプラグインの読み込み
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';

// 地点間の距離を計算するモジュール
import distance from '@turf/distance';

// 地理院標高タイルをMapLibre GL JSで利用するためのモジュール
import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';

const map = new maplibregl.Map({
  container: 'map', // div要素のid
  zoom: 5, // 初期表示のズーム
  center: [138, 37], // 初期表示の中心
  minZoom: 5, // 最小ズーム
  maxZoom: 18, // 最大ズーム
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
      },
      layers: [
          // 背景地図レイヤー
          {
              id: 'osm-layer',
              source: 'osm',
              type: 'raster',
          },
      ]
    }
})         
