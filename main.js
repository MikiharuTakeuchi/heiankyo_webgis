// MapLibre GL JSの読み込み
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import noUiSlider from "nouislider";
import "nouislider/dist/nouislider.css";

import OpacityControl from "maplibre-gl-opacity";
import "maplibre-gl-opacity/dist/maplibre-gl-opacity.css";

import "./style.css";

//legend
import { MaplibreLegendControl } from "@watergis/maplibre-gl-legend";
import "@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css";

//jsonデータをJavaScriptのデータとして読み込む、geojsonではうまくいかないのでjsonで処理
import excavationGeojson from "./public/excavationpoint.json";
import Fuse from "fuse.js";

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
  //目盛りを追加
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

//定義
const expressionDict = {
  //４つの値でなければ、その他（-other）に分類
  "excavation-other": [
    "all",
    ["!=", ["get", "a調査機"], "企業"],
    ["!=", ["get", "a調査機"], "京都市埋蔵文化財研究所"],
    ["!=", ["get", "a調査機"], "古代学協会"],
    ["!=", ["get", "a調査機"], "京都府埋蔵文化財調査研究センター"],
  ],
  //それぞれの属性値で分類
  "excavation-company": ["==", ["get", "a調査機"], "企業"],
  "excavation-shimaibun": ["==", ["get", "a調査機"], "京都市埋蔵文化財研究所"],
  "excavation-kodaigaku": ["==", ["get", "a調査機"], "古代学協会"],
  "excavation-humaibun": [
    "==",
    ["get", "a調査機"],
    "京都府埋蔵文化財調査研究センター",
  ],
};

//地図画面を初期化
const map = new maplibregl.Map({
  container: "map", // div要素のid
  zoom: 12, // 初期表示のズーム
  center: [135.73, 35], // 初期表示の中心
  minZoom: 8, // 最小ズーム
  maxZoom: 20, // 最大ズーム
  maxBounds: [134, 34, 137, 36], // 表示可能な範囲
  hash: true,
  style: {
    version: 8,
    sprite: "https://demotiles.maplibre.org/styles/osm-bright-gl-style/sprite", // スプライトは使わないけど、legendのエラーを回避するために定義
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
      //excavaiton用の箱だけ用意する、のちにテキスト検索をするため、geojsonのままではできない
      excavation: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
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
        layout: { visibility: "none" }, //node:初期の画面で表示しない
      },
      {
        id: "gsi-gazo1-layer",
        source: "gsigazo1",
        type: "raster",
        layout: { visibility: "none" },
      },
      {
        id: "gsi-elevation-layer",
        source: "elevation",
        type: "raster",
        layout: { visibility: "none" },
      },
      {
        id: "heianarea-layer",
        source: "heianarea",
        type: "fill",
        paint: {
          "fill-color": "red",
          "fill-opacity": 0.2,
        },
        layout: { visibility: "none" },
      },
      {
        //平安条坊名を表示するためのもの
        id: "heianlabel-layer",
        source: "heianarea",
        type: "symbol",
        minzoom: 16, //そこまでアップしないと表示されない
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
        paint: {
          "heatmap-weight": 1,
          "heatmap-opacity": 0.7,
          //"heatmap-intensity": 3,
          //"heatmap-radius": [
          //"interpolate",
          //以下のところで、zoomレベルに応じてヒートマップを作るときのpxを指定できる、ある程度の距離（例えば500ｍ範囲）などができたりする
          //["linear"],
          //["zoom"],
          //0, // zoom=0
          //0, // 0px
          //10, // zoom=10
          //10, // 30px
          //15, // zoom=15
          //30,
          //],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,1)", //値0でもちょっとした色を出力(0,0,0,0)でもいい。
            0.5,
            "rgba(96, 244, 2, 0.81)",
            1.0,
            "rgba(255, 231, 0, 0.8)",
          ],
        },
        filter: [
          "all", //and条件
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
        ],
        layout: { visibility: "none" },
      },
      //以下、legendで表示・非表示まで実装できるようにlegendで分類する分、excavationを分類して入れる。
      {
        id: "excavation-other",
        source: "excavation",
        type: "circle",
        paint: {
          "circle-color": "#90c",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
        filter: [
          "all",
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
          expressionDict["excavation-other"],
        ],
        layout: {
          visibility: "visible",
        },
      },
      {
        id: "excavation-company",
        source: "excavation",
        type: "circle",
        paint: {
          "circle-color": "red",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
        filter: [
          "all",
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
          expressionDict["excavation-company"],
        ],
        layout: {
          visibility: "visible",
        },
      },
      {
        id: "excavation-shimaibun",
        source: "excavation",
        type: "circle",
        paint: {
          "circle-color": "#030",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
        filter: [
          "all",
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
          expressionDict["excavation-shimaibun"],
        ],
        layout: {
          visibility: "visible",
        },
      },
      {
        id: "excavation-kodaigaku",
        source: "excavation",
        type: "circle",
        paint: {
          "circle-color": "blue",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
        filter: [
          "all",
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
          expressionDict["excavation-kodaigaku"],
        ],
        layout: {
          visibility: "visible",
        },
      },
      {
        id: "excavation-humaibun",
        source: "excavation",
        type: "circle",
        paint: {
          "circle-color": "grey",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
        filter: [
          "all",
          [">=", ["get", "西暦年"], 1890],
          ["<=", ["get", "西暦年"], 2023],
          expressionDict["excavation-humaibun"],
        ],
        layout: {
          visibility: "visible",
        },
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
  map.setFilter("excavation-other", [
    ...filter,
    expressionDict["excavation-other"],
  ]);

  map.setFilter("excavation-company", [
    ...filter,
    expressionDict["excavation-company"],
  ]);

  map.setFilter("excavation-shimaibun", [
    ...filter,
    expressionDict["excavation-shimaibun"],
  ]);

  map.setFilter("excavation-kodaigaku", [
    ...filter,
    expressionDict["excavation-kodaigaku"],
  ]);

  map.setFilter("excavation-humaibun", [
    ...filter,
    expressionDict["excavation-humaibun"],
  ]);

  map.setFilter("excavation-heat", filter);
}

map.on("load", () => {
  const url = new URL(window.location);
  if (url.searchParams.has('wordsearch')) {
    // クエリパラメータが存在する場合、絞り込みを実行
    const word = url.searchParams.get('wordsearch');
    filterGeojsonBy(word);

    // テキスト入力欄に検索文字列を設定
    document.getElementById('wordsearch').value = word;
  } else {
    // クエリパラメータが存在しない場合、全件表示
    //用意したexcavationの箱にjsonからもってきたデータを入れる。
    map.getSource('excavation').setData(excavationGeojson);
  }

  const opacity = new OpacityControl({
    //背景地図の切り替え機能、baseLayerにすることで複数のなかで一つを選択して表示する機能
    baseLayers: {
      "osm-layer": "OpenStreetMap",
      "gsi-photo-layer": "地理院地図 全国最新写真（シームレス）",
      "gsi-gazo1-layer": "地理院地図 1974年-1978年写真",
      "gsi-elevation-layer": "地理院地図 色別標高図",
    },
  });
  map.addControl(opacity, "top-left");

  const targets = {
    "excavation-other": "調査地点（その他）",
    "excavation-company": "調査地点(企業)",
    "excavation-shimaibun": "調査地点（京都市埋蔵文化財研究所）",
    "excavation-kodaigaku": "調査地点（古代学協会）",
    "excavation-humaibun": "調査地点（京都府埋蔵文化財調査研究センター）",
    "excavation-heat": "発掘調査地点ヒートマップ",
    "heianarea-layer": "平安京条坊",
    "plan-layer": "調査図面",
  };

  //legendを追加する
  map.addControl(
    new MaplibreLegendControl(targets, {
      showDefault: false,
      onlyRendered: false,
    }),
    "top-left"
  );

  map.on("click", (e) => {
    // クリックした位置にある地物を取得
    const features = map.queryRenderedFeatures(e.point, {
      layers: [
        "excavation-other",
        "excavation-company",
        "excavation-shimaibun",
        "excavation-kodaigaku",
        "excavation-humaibun",
      ],
    });
    if (features.length === 0) return;

    //ポップアップのところにスクロール機能をつける
    let popupHtml = `<div style="max-height:400px; overflow-y: scroll;">`;
    //ポップアップで表示させるものを5つにする（その準備）
    const MAX_ITEMS = 8;

    //ポップアップするときに事物が複数あるときの処理
    features.forEach((feature, idx) => {
      if (idx + 1 > MAX_ITEMS) return;
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
      layers: [
        "excavation-other",
        "excavation-company",
        "excavation-shimaibun",
        "excavation-kodaigaku",
        "excavation-humaibun",
      ],
    });

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

//テキスト検索
const options = {
  includeScore: true,
  //検索する属性を決める
  keys: [
    { name: "content", getFn: (feature) => feature.properties["内容"] },
    { name: "location", getFn: (feature) => feature.properties["場所"] },
    { name: "report", getFn: (feature) => feature.properties["書名"] },
  ],
};

//Fuse.jsがテキスト検索に適している。
const fuse = new Fuse(excavationGeojson.features, options); //(demo)const fuse = new Fuse(list, options); listのところは配列の検索対象。
const wordsearch = document.getElementById("wordsearch");
const filterGeojsonBy = (text) => {
  const result = fuse.search(text); //検索を実行
  const geojson = {
      type: 'FeatureCollection',
      features: [],
  };
  result.forEach((r) => {
      //結果の配列を加工、そのままではgeojsonにならないため。
      geojson.features.push(r.item); //pushは配列の最後に要素を追加。
  });
  //excavationというソースをみつける、geojsonを与える。
  map.getSource('excavation').setData(geojson);
};
wordsearch.oninput = (e) => {
  //テキスト検索に何も入力されていない（入力の値の大きさが0）のときは、すべてを表示する。
  if (e.target.value.length === 0) {
    // URLのクエリパラメータからwordsearchを削除
    const url = new URL(window.location);
    url.searchParams.delete('wordsearch');
    history.pushState({}, '', url);

    map.getSource('excavation').setData(excavationGeojson);
    return; // 処理を終了する
  }

  // e.target.value > 1, then　,テキスト検索に何か入力されている場合

  // URLのクエリパラメータにwordsearchを追加
  const url = new URL(window.location);
  url.searchParams.set('wordsearch', e.target.value);
  history.pushState({}, '', url);

  // GeoJSONのフィルター実行
  filterGeojsonBy(e.target.value);
};
