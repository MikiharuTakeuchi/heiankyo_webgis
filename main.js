// MapLibre GL JSの読み込み
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import noUiSlider from "nouislider";
import "nouislider/dist/nouislider.css";

import OpacityControl from "maplibre-gl-opacity";
import "maplibre-gl-opacity/dist/maplibre-gl-opacity.css";

import "./style.css";

//発掘年度スライダーを初期化,idで探しに行く
const sliderDiv = document.getElementById("slider");
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
  pips: {
    mode: "positions",
    values: [1900, 1950, 2000],
  },
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

//indexで作成したage-slidarを探してくる
const AGES = [
  "旧石器",
  "縄文",
  "弥生",
  "古墳",
  "飛鳥白鳳",
  "奈良",
  "平安",
  "鎌倉",
  "室町",
  "戦国",
  "安土桃山",
  "江戸",
  "明治",
  "大正",
];
//時代スライダーを初期化
const ageSliderDiv = document.getElementById("age-slider");
const ageSlider = noUiSlider.create(ageSliderDiv, {
  start: [0, 13],
  connect: true,
  range: {
    min: 0,
    max: 13,
  },
  step: 1,
  tooltips: true,
  //メモリを追加
  pips: {
    mode: "steps",
    format: {
      to: function (value) {
        return AGES[value];
      },
      // スライダーの値を表示：整数値に変換
      from: function (value) {
        return Number(value);
      },
    },
  },
  format: {
    to: function (value) {
      return AGES[value];
    },
    // スライダーの値を表示：整数値に変換
    from: function (value) {
      return Number(value);
    },
  },
});

//地図画面を初期化
const map = new maplibregl.Map({
  container: "map", // div要素のid
  zoom: 12, // 初期表示のズーム
  center: [135.73, 35], // 初期表示の中心
  minZoom: 4, // 最小ズーム
  maxZoom: 20, // 最大ズーム
  maxBounds: [122, 20, 154, 50], // 表示可能な範囲
  hash: true,
  style: {
    version: 8,
    glyphs: "https://mierune.github.io/fonts/{fontstack}/{range}.pbf",
    sources: {
      // 背景地図ソース
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        maxzoom: 19,
        tileSize: 256,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      gsiphoto: {
        type: "raster",
        tiles: [
          "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
        ],
        maxZoom: 18,
        tileSize: 256,
        attribution:
          ' <a href="https://maps.gsi.go.jp/development/ichiran.html">地理院地図</a>',
      },
      gsigazo1: {
        type: "raster",
        tiles: ["https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg"],
        maxzoom: 17,
        tileSize: 256,
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院地図</a>',
      },
      elevation: {
        type: "raster",
        tiles: ["https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png"],
        maxzoom: 15,
        tileSize: 256,
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院地図</a>',
      },
      excavation: {
        type: "geojson",
        data: "/excavationpoint.geojson",
        attribution:
          '<a href="https://heiankyoexcavationdb-rstgis.hub.arcgis.com/">平安京跡データベース</a>',
      },
      plan: {
        type: "geojson",
        data: "/cyukain_east_survey18.geojson",
        attribution:
          '<a href="https://heiankyoexcavationdb-rstgis.hub.arcgis.com/">平安京跡データベース</a>',
      },
      heianarea: {
        type: "geojson",
        data: "/heiankyo_area.geojson",
        attribution:
          '<a href="https://heiankyoexcavationdb-rstgis.hub.arcgis.com/">平安京跡データベース</a>',
      },
    },
    layers: [
      // 背景地図レイヤー
      {
        id: "osm-layer",
        source: "osm",
        type: "raster",
      },
      {
        id: "gsi-photo-layer",
        source: "gsiphoto",
        type: "raster",
      },
      {
        id: "gsi-gazo1-layer",
        source: "gsigazo1",
        type: "raster",
      },
      {
        id: "gsi-elevation-layer",
        source: "elevation",
        type: "raster",
      },
      {
        id: "heianarea-layer",
        source: "heianarea",
        type: "fill",
        paint: {
          "fill-color": "red",
          "fill-opacity": 0.2,
        },
      },
      {
        id: "heianareaoutline-layer",
        source: "heianarea",
        type: "line",
        paint: {
          "line-color": "red",
          "line-width": 4,
        },
      },
      {
        id: "heianlabel-layer",
        source: "heianarea",
        type: "symbol",
        minzoom: 16,
        layout: {
          "text-field": ["get", "Name"],
          "text-font": ["mplus1c-regular"],
        },
        paint: {
          "text-halo-width": 1,
          "text-halo-color": "#fff",
          "text-color": "#000",
        },
      },
      {
        id: "excavation-heat",
        source: "excavation",
        type: "heatmap",

        filter: [
          "all",
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
        ],
      },
      {
        id: "excavation",
        source: "excavation",
        type: "circle",
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "a調査機"], "企業"],
            "red",
            ["==", ["get", "a調査機"], "京都市埋蔵文化財研究所"],
            "green",
            ["==", ["get", "a調査機"], "古代学協会"],
            "blue",
            ["==", ["get", "a調査機"], "京都府埋蔵文化財調査研究センター"],
            "grey",
            "yellow",
          ],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
        filter: [
          "all",
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
        ],
      },
      {
        id: "plan-layer",
        source: "plan",
        type: "line",
      },
    ],
  },
});

//関数を作成、スライダーが変更されたときに実行される、スライダーに合わせて地図のフィルターを更新
function updateExcavationFilter() {
  //slider.getでスライダーを動かしたときの値を取得
  const min = slider.get()[0];
  const max = slider.get()[1];

  //絞り込み条件を追加していく配列
  const conditions = [];
  //絞り込み条件に含まれているかどうかのflagを宣言
  let flag = false;
  AGES.forEach((age) => {
    if (age === ageSlider.get()[0]) flag = true; // 開始条件に合致
    if (flag) conditions.push(["get", age]);
    if (age === ageSlider.get()[1]) flag = false; // 終了条件に合致
  });

  //条件絞り込みを定義する
  const filter = [
    "all", //ここでand条件を指定
    ["all", [">=", ["get", "西暦年"], min], ["<=", ["get", "西暦年"], max]],
    ["any", ...conditions], //anyでor条件,時代の範囲で一個でもＴｒｕｅがあれば表示、...は配列を展開（スプレット構文）
  ];

  //地図にfilterで定義した条件をポイントデータとヒートマップに反映
  map.setFilter("excavation", filter);

  map.setFilter("excavation-heat", filter);
}

map.on("load", () => {
  const opacity = new OpacityControl({
    //背景地図の切り替え機能、baseLayerにすることで複数のなかで一つを選択して表示する機能
    baseLayers: {
      "osm-layer": "OpenStreetMap",
      "gsi-photo-layer": "地理院地図 全国最新写真（シームレス）",
      "gsi-gazo1-layer": "地理院地図 1974年-1978年写真",
      "gsi-elevation-layer": "地理院地図 色別標高図",
    },
    //メインのGISデータの表示非表示、overLayerにすることで複数のレイヤーのなかで複数選択して表示する機能
    overLayers: {
      "heianarea-layer": "平安京条坊",
      excavation: "発掘調査地点",
      "excavation-heat": "発掘調査地点ヒートマップ",
      "plan-layer": "調査図面",
    },
  });
  map.addControl(opacity, "top-left");

  map.on("click", (e) => {
    // クリックした位置にある地物を取得
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["excavation"],
    });
    if (features.length === 0) return;
    console.log(features);

    //ポップアップのところにスクロール機能をつける
    let popupHtml = `<div style="max-height:400px; overflow-y: scroll;">`;
    //ポップアップで表示させるものを5つにする（その準備）
    const MAX_ITEMS = 8;

    //ポップアップするときに事物が複数あるときの処理
    features.forEach((feature, idx) => {
      if (idx + 1 > MAX_ITEMS) return;
      console.log(feature.properties["内容"]);
      //ポップアップのスタイル
      popupHtml += `<div style="margin:4px 0; padding:2px; background-color:#00000000;">`;
      // 各地物の情報をHTMLに追加する
      popupHtml += `<div>${feature.properties["内容"]}</div>
      <div>${feature.properties["場所"]}</div>`;
      if (feature.properties["公開PDF_"] !== undefined) {
        // ＵＲＬがある場合はaタグを追加する
        popupHtml += `<a href='${feature.properties["公開PDF_"]}'>報告書link</a>`;
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

    popupHtml += "</div>";
    const popup = new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(popupHtml)
      .addTo(map);
  });

  //地図上でマウスが移動した際のイベント
  map.on("mousemove", (e) => {
    //マウスカーソル以下にレイヤーが存在するかどうかをチェック
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["excavation"],
    });
    //console.log(features)
    if (features.length > 0) {
      //地物が存在する場合はカーソルをpointerに変更
      map.getCanvas().style.cursor = "pointer";
    } else {
      //存在しない場合はデフォルト
      map.getCanvas().style.cursor = "";
    }
  });
  //スライダーが変更されたときに、関数を実行
  slider.on("update", () => {
    updateExcavationFilter();
  });
  ageSlider.on("update", () => {
    updateExcavationFilter();
  });
});
