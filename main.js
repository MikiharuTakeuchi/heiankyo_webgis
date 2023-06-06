// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

const map = new maplibregl.Map({
    container: 'map', // div要素のid
    zoom: 8, // 初期表示のズーム
    center: [136, 35], // 初期表示の中心
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
                type: 'geojson',
                data: '/cyukain_east_survey18.geojson',
            },
            heianarea: {
                type: 'geojson',
                data: '/heiankyo_area.geojson',
            },
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
                type: 'line',
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
                    'circle-color': '#0000ff',
                    'circle-stroke-color': '#fff',
                    'circle-stroke-width': 2,
                },
            },
            {
                id: 'plan-layer',
                source: 'plan',
                type: 'line',
            },
        ],
    },
});

map.on('click', (e) => {
    // クリックした位置にある地物を取得
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['excavation'],
    });
    if (features.length === 0) return;
    console.log(features);

    //ポップアップのところにスクロール機能をつける
    let popupHtml = `<div style="max-height:400px; overflow-y: scroll;">`;
    //ポップアップで表示させるものを5つにする（その準備）
    const MAX_ITEMS = 5;

    //ポップアップするときに事物が複数あるときの処理
    features.forEach((feature, idx) => {
        if (idx + 1 > MAX_ITEMS) return;
        console.log(feature.properties['内容']);
        //ポップアップのスタイル
        popupHtml += `<div style="margin:4px 0; padding:2px; background-color:#00000000;">`;
        // 各地物の情報をHTMLに追加する
        popupHtml += `<div>${feature.properties['内容']}</div>
    <div>${feature.properties['場所']}</div>`;
        if (feature.properties['公開PDF_'] !== undefined) {
            // ＵＲＬがある場合はaタグを追加する
            popupHtml += `<a href='${feature.properties['公開PDF_']}'>報告書link</a>`;
        } else {
            popupHtml += `報告書PDFなし`;
        }
        //ポップアップの中で事物と事物の間に横線を入れる
        popupHtml += `<hr/>`;
        popupHtml += `</div>`;
    });

    /**
  //constは変更のきかない変数を宣言
  //letはその逆、変更ができる
  let popupHtml = `<div>${feature.properties["内容"]}</div>
  <div>${feature.properties["場所"]}</div>`;
  if (feature.properties["公開PDF_"] !== undefined) {
    // ＵＲＬがある場合はaタグを追加する
    popupHtml += `<a href='${feature.properties["公開PDF_"]}'>報告書link</a>`;
  } else {
    popupHtml += `no pdf`;
  }
   */

    popupHtml += '</div>';
    const popup = new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupHtml)
        .addTo(map);
});

//地図上でマウスが移動した際のイベント
map.on('mousemove', (e) => {
    //マウスカーソル以下にレイヤーが存在するかどうかをチェック
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['excavation'],
    });
    //console.log(features)
    if (features.length > 0) {
        //地物が存在する場合はカーソルをpointerに変更
        map.getCanvas().style.cursor = 'pointer';
    } else {
        //存在しない場合はデフォルト
        map.getCanvas().style.cursor = '';
    }
});

const sliderDiv = document.getElementById('slider');
const minYear = 1890;
const maxYear = 2023;
const slider = noUiSlider.create(sliderDiv, {
    start: [minYear, maxYear],
    connect: true,
    range: {
        min: minYear,
        max: maxYear,
    },
    step: 1,
    tooltips: true,
    format: {
        to: function (value) {
            return value;
        },
        // スライダーの値を表示：整数値に変換
        from: function (value) {
            return Number(value);
        },
    },
});
slider.on('update', (values) => {
    console.log(values);
});
