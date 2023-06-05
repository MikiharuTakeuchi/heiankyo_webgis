// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
    container: 'map', // div要素のid
    zoom: 8, // 初期表示のズーム
    center: [132, 34], // 初期表示の中心
    minZoom: 4, // 最小ズーム
    maxZoom: 11, // 最大ズーム
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
        ],
    },
});

map.on('click', (e) => {
    // クリックした位置にある地物を取得
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['excavation-'],
    });
    console.log(features);
});
