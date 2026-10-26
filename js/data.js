// 可编辑的内容:照片、时间线、情话
const PASSWORD = "20240220";
const START = new Date(2024, 1, 20, 0, 0, 0); // 2024-02-20

// 把照片放进 photos/ 目录,然后在这里添加一行
const PHOTOS = Array.from({ length: 19 }, (_, i) => ({
  src: `photos/${String(i + 1).padStart(2, "0")}.jpg`,
  caption: "",
}));

// 两地坐标(纬度, 经度),用于计算直线距离
const ME = { name: "北京", lat: 39.9042, lon: 116.4074 };
const HER = { name: "深圳", lat: 22.5431, lon: 114.0579 };

// 一起去过的城市(prov 对应地图上要点亮的省份/直辖市/特别行政区名称)
const VISITED = [
  { n: "重庆", lat: 29.563, lon: 106.5516, prov: "重庆市" },
  { n: "长沙", lat: 28.2282, lon: 112.9388, prov: "湖南省" },
  { n: "武汉", lat: 30.5928, lon: 114.3055, prov: "湖北省" },
  { n: "南京", lat: 32.0603, lon: 118.7969, prov: "江苏省" },
  { n: "深圳", lat: 22.5431, lon: 114.0579, prov: "广东省" },
  { n: "珠海", lat: 22.2707, lon: 113.5767, prov: "广东省" },
  { n: "香港", lat: 22.3193, lon: 114.1694, prov: "香港特别行政区" },
  { n: "澳门", lat: 22.1987, lon: 113.5439, prov: "澳门特别行政区" },
];

// 下一次见面的日期,例如 new Date(2026, 10, 20);不填(null)则不显示倒计时
const MEET = null;

const QUOTES = [
  "年年有风，风吹年年，慢慢即漫漫。",
];
